const fs = require('fs')
const path = require('path')
const md5 = require('md5')
const cb2p = require('./cb2p')
const babel = require('babel-core')

const defaultModuleProcessors = require('./default-module-processors')
const NodeModuleResolver = require('./node-module-resolver')

const extend = Object.assign

const readFile = cb2p(fs.readFile)
const writeFile = cb2p(fs.writeFile)

module.exports = NSPack

function NSPack(config){
    if (!(this instanceof NSPack)){
        return (new NSPack(config)).build()
    }

    this._config = sanitizeConfig(config)
    this._nextModuleId = 1
    this._modules = {} // id => module
    this._modulesByFullPathName = {} // fullPathName => module
    this._built = {}
    this._nodeModuleResolver = new NodeModuleResolver()
    return this
}

extend(NSPack.prototype, {
    async build(){
        await this._resolveExternalModules()
        await this._buildFromEntries()
        return this._built
    },
    async _resolveExternalModules(){
        const externalModules = this._config.externals
        if (!externalModules){
            return
        }

        const jobs = []
        for (let moduleName of Object.keys(externalModules)){
            jobs.push(
                this._addModuleIfNotExists({
                    name: moduleName,
                    baseDir: this._config.entryBase,
                    source: `module.exports = ${externalModules[moduleName]}`,
                    file: 'external://' + moduleName,
                    isExternal: true,
                    processed: true,
                })
            )
        }

        await Promise.all(jobs)
    },
    async _buildFromEntries(){
        const jobs = []
        const entryModules = Object.values(this._config.entry)
        for (let entryModule of entryModules){
            jobs.push(
                this._buildEntryModule(entryModule)
                    .then(module => {
                        this._built[entryModule.name] = module
                    })
            )
        }

        await Promise.all(jobs)
    },
    async _buildEntryModule(entryModule){
        this._log(`building ${entryModule.name}...`)

        const baseDir = this._config.entryBase
        entryModule.entry = {name: entryModule.name, baseDir: baseDir}
        const resolvingJsModule = this._addModuleIfNotExists({
            name: entryModule.name + '.js',
            baseDir: baseDir,
            fullPathName: path.join(baseDir, entryModule.name + '.js'),
            source: await entryModule.js(entryModule)
        }).then(module => this._processModule(module))

        const resolvingCssModule = this._addModuleIfNotExists({
            name: entryModule.name + '.css',
            baseDir: baseDir,
            fullPathName: path.join(baseDir, entryModule.name + '.css'),
            source: await entryModule.css(entryModule)
        }).then(module => this._processModule(module))

        const [jsModule, cssModule] = await Promise.all([resolvingJsModule, resolvingCssModule])

        if (entryModule.extractCssFromJs){
            this._extractCssFromJs(jsModule, cssModule)
        } else {
            this._transformCssInJs(jsModule)
        }

        jsModule.outputSource = await this._bundleJsModule(jsModule)
        jsModule.hash = this._hash(jsModule.outputSource)
        jsModule.outputName = this._buildOutputName(jsModule)

        cssModule.outputSource = this._bundleCssModule(cssModule)
        cssModule.hash = this._hash(cssModule.outputSource)
        cssModule.outputName = this._buildOutputName(cssModule)

        entryModule.bundle = {
            jsModule: jsModule,
            scriptTags: `<script src="/${jsModule.outputName}"></script>`,
            cssModule: cssModule,
            styleTags: `<link rel="stylesheet" href="/${cssModule.outputName}" >`
        }

        const html = await entryModule.html(entryModule)
        const htmlHash = this._hash(html)
        const htmlOutputName = this._buildOutputName({name: entryModule.name, hash: htmlHash, type: 'html'})

        await Promise.all([
            this._outputFile(jsModule.outputName, jsModule.outputSource),
            this._outputFile(cssModule.outputName, cssModule.outputSource),
            this._outputFile(htmlOutputName, html),
        ])
    },
    async _bundleJsModule(jsModule){
        const bundled = newArray(this._nextModuleId)
        const bundleRec = (module) => {
            if (!bundled[module.id]){
                bundled[module.id] = {
                    id: module.id,
                    name: module.name,
                    file: module.relativePath,
                    source: module.builtSource,
                }

                if (module.dependencies && module.dependencies.length > 0){
                    for (let x of module.dependencies){
                        if (x.builtType === 'js'){
                            bundleRec(x)
                        }
                    }
                }
            }
        }

        bundleRec(jsModule)

        const bundledJsCode = buildJsBundleCode(bundled, jsModule.id)

        return await this._transCompile(bundledJsCode)
    },
    _bundleCssModule(cssModule){
        if (cssModule.appendSources && cssModule.appendSources.length > 0){
            return (cssModule.builtSource || '') + cssModule.appendSources.join("\n")
        }

        return cssModule.builtSource
    },
    _extractCssFromJs(jsModule, cssModule){
        cssModule.appendSources = cssModule.appendSources || []

        const extracted = {}
        const extractRec = (dependencies) => {
            if (dependencies){
                for (let x of dependencies){
                    if (x.builtType === 'css'){
                        if (!extracted[x.id]){
                            extracted[x.id] = true
                            cssModule.appendSources.push(
                                this._bundleCssModule(x)
                            )
                        }
                    } else {
                        extractRec(x.dependencies)
                    }
                }
            }
        }

        extractRec(jsModule.dependencies)
        jsModule.cssExtracted = true
    },
    _transformCssInJs(jsModule){
        const transformed = {}
        const transformRec = (dependencies) => {
            if (dependencies) {
                for (let x of dependencies){
                    if (x.builtType === 'css'){
                        this._transformCssModuleToInjectCssScript(x)
                    }
                }
            }
        }

        transformRec(jsModule.dependencies)
    },
    _transformCssModuleToInjectCssScript(module){
        const injectStyleModule = this._getInjectStyleModule()
        const styleText = JSON.stringify(module.builtSource)
        module.builtSource = `module.exports = require(${injectStyleModule.id}/*${injectStyleModule.name}*/)(${styleText})`
        module.builtType = 'js'
    },
    _getInjectStyleModule(){
        const injectStyleModuleName = '__inject_style__'
        return this._addModuleIfNotExists({
            name: injectStyleModuleName,
            file: 'internal://' + injectStyleModuleName,
            type: 'js',
            source: getInjectStyleModuleSource(),
            isInternal: true,
            processed: true,
        })
    },
    async _transCompile(jsCode){
        const babelConfig = await this._loadBabelRc()

        const res = babel.transform(jsCode, babelConfig)

        return res.code
    },
    async _loadBabelRc(){
        if (this._config.babelrc === false){
            return false
        } else if (typeof this._config.babelrc === 'string'){
            this._config.babelrcFile = this._config.babelrc
            return this._config.babelrc = await readJsonFile(this._config.babelrc)
        } else if (this._config.babelrc === true || this._config.babelrc === undefined){
            this._config.babelrcFile = '.babelrc'
            return this._config.babelrc = await readJsonFile('.babelrc')
        } else {
            return this._config.babelrc
        }
    },
    _buildOutputName({type, name, hash}){
        const defaultOutputConfig = this._config.output['*']
        const moduleOutputConfig = this._config.output[name] || defaultOutputConfig
        const template = moduleOutputConfig[type] || defaultOutputConfig[type]
        return template.replace('[name]', name).replace('[hash]', hash)
    },
    _hash(content){
        return md5(content).substring(0, this._config.hash_length)
    },
    async _outputFile(filepath, content){
        if (content === undefined){
            return
        }

        return writeFile(filepath, content, 'utf8')
    },
    async _resolveModule(moduleName, baseDir){
        this._log(`resolveing ${moduleName} in ${baseDir}`)
        const module = this._addModuleIfNotExists({
            name: moduleName,
            baseDir: baseDir,
        })

        await this._processModule(module)

        return module
    },
    async _processModule(module){
        module.dependencies = []

        if (!('source' in module)){
            module.source = await readFile(module.fullPathName, "utf8")
        }

        if (!('fullFileDirName' in module)){
            module.fullFileDirName = path.dirname(module.fullPathName)
        }
        
        const processors = this.moduleProcessors[module.type]
        if (processors){
            for (let processor of processors){
                processor.process(module, this)
            }
        } else {
            throw new Error(`No processor for ${module.type} when processing file ${module.fullPathName}`)
        }

        return module
    },
    async _addModuleIfNotExists(module){
        if (!('fullPathName' in module)){
            if (module.isInternal || module.isExternal){
                module.fullPathName = module.file
                module.relativePath = module.file
            } else {
                module.fullPathName = await _resolveModuleFullPathName(module.name, module.baseDir)
            }
        }

        if (!module.fullPathName){
            throw new Error(`Failed to resolve module '${module.name}' in directory '${module.baseDir}'`)
        }

        if (module.fullPathName in this._modulesByFullPathName){
            return this._modulesByFullPathName[module.fullPathName]
        }

        if (!('relativePath' in module)){
            module.relativePath = path.relative(this._config.entryBase, module.fullPathName)
        }

        if (!('type' in module)){
            module.type = path.extname(module.fullPathName).replace(/^./, '').toLowerCase()
        }


        module.id = this._nextModuleId++
        this._modules[module.id] = module
        this._modulesByFullPathName[module.fullPathName] = module

        return module
    },
    async _resolveModuleFullPathName(moduleName, baseDir) {

        if (moduleName[0] === '@'){
            return path.join(this._config.entryBase, moduleName)
        }

        return await this._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir)
    },
    _log(msg){
        console.log(msg)
    },
})

function sanitizeConfig(config){
    const r = {...config}

    if (!r.entryBase){
        r.entryBase = process.cwd()
    }

    r.resolveEntryFile = (f) => path.join(r.entryBase, f)

    r.entry = {...config.entry}
    for (let entryName of Object.keys(r.entry)){
        const entry = r.entry[entryName] = {name: entryName}
        const entryConfigType = typeof config.entry[entryName]
        if (entryConfigType === 'string'){
            entry.js = config.entry[entryName]
        } else if (entryConfigType === 'function'){
            entry.js = config.entry[entryName]
        } else if (entryConfigType === 'object' && entryConfigType){
            extend(entry, config.entry[entryName])
        } else {
            throw new Error(`config.entry[${entryName}] is invalid`)
        }

        // if string, assume it is a path
        if (typeof entry.js === 'string') {
            entry.js = makeFileReaderFunc(r.resolveEntryFile(entry.js))
        } else if (typeof entry.js === 'function'){
            // nothing to do
        } else if (!entry.js){
            entry.js = () => undefined
        }

        if (typeof entry.css === 'string'){
            entry.css = makeFileReaderFunc(r.resolveEntryFile(entry.css))
        } else if (typeof entry.css === 'function'){
            // nothing to do
        } else if (!entry.css){
            entry.css = () => undefined
        }

        if (typeof entry.html === 'string'){
            const entryHtml = require(r.resolveEntryFile(entry.html))
            if (typeof entryHtml === 'string'){
                entry.html = () => entryHtml
            } else if (typeof entryHtml === 'function') {
                entry.html = entryHtml
            } else {
                throw new Error(`config.entry[${entryName}].html is invalid`)
            }
        } else if (typeof entry.html === 'function'){
            // nothing to do
        } else if (!entry.html){
            entry.html = () => undefined
        }
    }

    if (!r.outputBase){
        r.outputBase = path.join(process.cwd(), 'dist')
    }

    r.resolveOutputFile = (f) => path.join(r.outputBase, f)

    r.moduleProcessors = {...defaultModuleProcessors, ...r.moduleProcessors}

    r.hashLength = +r.hashLength || 6

    return r
}


function makeFileReaderFunc(filepath, encoding='utf8'){
    return () => readFile(filepath, encoding)
}

function buildJsBundleCode(modules, entryModuleId=0){
    const modulesCodes = []
    
    for (let module of modules){
        modulesCodes.push(module.id + ':')
        modulesCodes.push(wrapModuleCode(module.id, module.name, (module.file || module.relativePath || module.name), module.source))
        modulesCodes.push(",\n")
    }

    return `
!(function(modules){
    var required = {};
    var require = function(moduleId){
        var m = required[moduleId];
        if (!m){
            m = required[moduleId] = {exports:{}};
            modules[moduleId](require, m, m.exports);
        }
    
        return m.exports;
    };
    require(${entryModuleId});
})({${modulesCodes.join("")}});`
}

function wrapModuleCode(moduleId, moduleName, moduleFile, source){
    return `
// module#${moduleId}: ${moduleName}, file: ${moduleFile}
function(__require_module__, module, exports){
    ${source}
}
`
}

function newArray(len, defaultValue){
    const a = new Array(len)
    for (let i = 0; i < len; i++){
        a[i] = defaultValue
    }

    return a
}

function getInjectStyleModuleSource(){
    return `
module.exports = function (styleCode){
    if (styleCode){
        var styleTag = document.createElement("style")
        styleTag.innerText = styleCode
        ~(document.getElementsByTagName('head')[0] || document.documentElement).appendChild(styleTag)
    }
    return styleCode
}`
}
