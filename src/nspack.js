const fs = require('fs')
const path = require('path')
const md5 = require('md5')
const cb2p = require('./cb2p')
const babel = require('babel-core')
const debug = require('debug')('nspack')

const defaultModuleProcessors = require('./default-module-processors')
const NodeModuleResolver = require('./node-module-resolver')

const {
    tryFStat,
    tryReadJsonFileContent,
} = require('./utils')

const extend = Object.assign

const readFile = cb2p(fs.readFile)
const writeFile = cb2p(fs.writeFile)
const stat = cb2p(fs.stat)
const mkdir = cb2p(fs.mkdir)

module.exports = NSPack

function NSPack(config){
    if (!(this instanceof NSPack)){
        return (new NSPack(config)).build()
    }

    this._config = sanitizeConfig(config)
    this.debugLevel = this._config.debugLevel

    this._nextModuleId = 1
    this._externalModules = {} // moduleName => module
    this._modules = {} // id => module
    this._modulesByFullPathName = {} // fullPathName => module
    this._built = {}
    this._nodeModuleResolver = new NodeModuleResolver()
    return this
}

extend(NSPack.prototype, {
    async build(){
        this.buildBeginAt = new Date()

        await this._resolveExternalModules()
        await this._buildFromEntries()

        this.buildEndAt = new Date()
        this.buildSpentTimeMs = +this.buildEndAt - (+this.buildBeginAt)

        this.debugLevel > 1 && this.debugDumpAllModules()
        this.debugLevel > 0 && this.debugDumpAllEntriesOutputs()

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
                    builtSource: `module.exports = ${externalModules[moduleName]}`,
                    file: 'external://' + moduleName,
                    type: 'js',
                    builtType: 'js',
                    isExternal: true,
                    processed: true,
                }).then(module => {
                    this._externalModules[moduleName] = module
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
        this.debugLevel > 0 && debug(`building entry module %o...`, entryModule.name)

        const baseDir = this._config.entryBase
        entryModule.entry = {name: entryModule.name, baseDir: baseDir}
        const resolvingJsModule = 
            this._loadSource(entryModule.js(entryModule))
                .then(({sourceCode, filePath}) => 
                    this._addModuleIfNotExists({
                        name: entryModule.name + '.js',
                        baseDir: baseDir,
                        fullPathName: filePath || path.join(baseDir, entryModule.name + '.js'),
                        source: sourceCode,
                    }))
                .then(module => this._processModule(module))

        const resolvingCssModule = 
            this._loadSource(entryModule.css(entryModule))
                .catch(e => {
                    if (!entryModule.ignoreMissingCss){
                        throw e
                    }

                    return {}
                })
                .then(({sourceCode, filePath}) => 
                    this._addModuleIfNotExists({
                        name: entryModule.name + '.css',
                        baseDir: baseDir,
                        fullPathName: filePath || path.join(baseDir, entryModule.name + '.css'),
                        source: sourceCode,
                    }))
                .then(module => this._processModule(module))

        const [jsModule, cssModule] = await Promise.all([resolvingJsModule, resolvingCssModule])

        if (entryModule.extractCssFromJs){
            this._extractCssFromJs(jsModule, cssModule)
        } else {
            this._transformCssInJs(jsModule)
        }

        jsModule.outputSource = await this._bundleJsModule(jsModule)
        jsModule.hash = this._hash(jsModule.outputSource)
        jsModule.outputName = this._buildOutputName({
            name: entryModule.name,
            hash: jsModule.hash,
            type: 'js',
        })

        cssModule.outputSource = this._bundleCssModule(cssModule)
        cssModule.hash = this._hash(cssModule.outputSource)
        cssModule.outputName = this._buildOutputName({
            name: entryModule.name,
            hash: cssModule.hash,
            type: 'css',
        })

        entryModule.bundle = {
            script: jsModule,
            scriptsTags: jsModule.outputSource ? `<script src="/${jsModule.outputName}"></script>` : '',
            style: cssModule,
            stylesTags: cssModule.outputSource ? `<link rel="stylesheet" href="/${cssModule.outputName}" >` : '',
            html: null,
        }

        const html = await entryModule.html(entryModule)
        const htmlHash = this._hash(html)
        const htmlOutputName = this._buildOutputName({name: entryModule.name, hash: htmlHash, type: 'html'})
        
        entryModule.bundle.html = {
            outputSource: html,
            hash:         htmlHash,
            outputName:   htmlOutputName,
        }

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
                        } else if (x.builtType === 'css') {
                            if (jsModule.cssExtracted){
                                bundled[x.id] = {
                                    id: x.id,
                                    name: x.name,
                                    file: x.relativePath,
                                    source: "",
                                }
                            } else {
                                throw new Error("Logic Error: css modules still exists when bundling.")
                            }
                        } else {
                            throw new Error(`Unknown builtType: ${x.builtType} when bundling ${x.fullPathName} of ${jsModule.fullPathName}`)
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
                    } else if (x.builtType === 'js') {
                        transformRec(x.dependencies)
                    } else {
                        // ignore other builtTypes
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
        module.dependencies.push(injectStyleModule)
    },
    _getInjectStyleModule(){
        const injectStyleModuleName = '__inject_style__'
        return this._addInternalModule(injectStyleModuleName, getInjectStyleModuleSource)
    },
    _addInternalModule(moduleName, getModuleSource){
        const moduleFile = 'internal://' + moduleName
        if (moduleFile in this._modulesByFullPathName){
            return this._modulesByFullPathName[moduleFile]
        }

        const module = {
            id: this._nextModuleId++,
            name: moduleName,
            file: moduleFile,
            fullPathName: moduleFile,
            fullFileDirName: false,
            relativePath: moduleFile,
            type: 'js',
            builtType: 'js',
            builtSource: getModuleSource(),
            isInternal: true,
            processed: true,
        }

        this._modules[module.id] = module
        this._modulesByFullPathName[moduleFile] = module
        return module
    },
    async _transCompile(jsCode){
        const babelConfig = await this._loadBabelRc()

        const res = babel.transform(jsCode, babelConfig)

        return `!(function(){${res.code}})();`
    },
    async _loadBabelRc(){
        if (this._config.babelrc === false){
            return false
        } else if (typeof this._config.babelrc === 'string'){
            this._config.babelrcFile = this._config.babelrc
            return this._config.babelrc = await tryReadJsonFileContent(this._config.babelrc)
        } else if (this._config.babelrc === true || this._config.babelrc === undefined){
            this._config.babelrcFile = '.babelrc'
            return this._config.babelrc = await tryReadJsonFileContent('.babelrc')
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
        return md5(content || '').substring(0, this._config.hash_length)
    },
    async _outputFile(outputName, content){
        if (content === undefined){
            return
        }

        const filepath = this._config.resolveOutputFile(outputName)
        const fileDir = path.dirname(filepath)
        await mkdirIfNotExists(fileDir)

        return writeFile(filepath, content, 'utf8')
    },
    async _resolveModule(moduleName, baseDir){
        this.debugLevel > 0 && debug(`resolving %o in %o`, moduleName, baseDir)

        if (moduleName in this._config.externals){
            return this._externalModules[moduleName]
        } 
        
        const module = await this._addModuleIfNotExists({
            name: moduleName,
            baseDir: baseDir,
        })

        await this._processModule(module)

        return module
    },
    async _processModule(module){
        if (module.processed){
            return
        }

        this.debugLevel > 1 && debug("processing module %o in %o", module.name, module.baseDir || module.fullFileDirName)

        module.dependencies = []

        if (!('source' in module)){
            this.debugLevel > 1 && debug("read module source from file: %o, module: %o", module.fullPathName, module)
            module.source = await readFile(module.fullPathName, "utf8")
        }

        if (!('fullFileDirName' in module)){
            module.fullFileDirName = path.dirname(module.fullPathName)
        }
        
        const processors = this._config.moduleProcessors[module.type]
        if (processors){
            for (let processor of processors){
                await processor.call(processor, module, this)
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
                if (!('relativePath' in module)){
                    module.relativePath = module.file
                }
            } else {
                module.fullPathName = await this._resolveModuleFullPathName(module.name, module.baseDir)
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
            return path.join(this._config.entryBase, moduleName.substring(1))
        }

        return await this._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir)
    },
    async _loadSource(src){
        src = await src
        if (src === undefined){
            return {}
        }

        if (typeof src === 'string'){
            return {sourceCode: src}
        }

        if (typeof src === 'object' && src){
            if (src.file && !src.sourceCode){
                const srcFilePath = this._config.resolveEntryFile(src.file)
                this.debugLevel > 1 && debug("loadSource: reading file: %o", srcFilePath)
                return readFile(srcFilePath, src.encoding || 'utf8')
                        .then(data => ({filePath: srcFilePath, sourceCode: data}))
            } else {
                return src
            }
        }

        return {}
    },
    
    debugDumpAllModules(){
        debug("all modules: ")
        for (let i = 0, n = this._nextModuleId; i < n; i++){
            let m = this._modules[i]
            if (m){
                debug("\t[%o]\t%o\t%o\t%o (%o)", 
                    i, m.type, m.builtType, m.name, m.fullPathName)
            }
        }
    },
    debugDumpAllEntriesOutputs(){
        debug("Done build. Spent %s(s)", (this.buildSpentTimeMs / 1000).toFixed(3))

        for (let entryModule of Object.values(this._config.entry)){
            debug("%o:", entryModule.name)
            debug("\t%o: %o", entryModule.bundle.script.outputName, entryModule.bundle.script.hash)
            debug("\t%o: %o", entryModule.bundle.style.outputName, entryModule.bundle.style.hash)
            debug("\t%o: %o", entryModule.bundle.html.outputName, entryModule.bundle.html.hash)
        }
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
            entry.js = makeSourceFileReaderFunc(r.resolveEntryFile(entry.js))
        } else if (typeof entry.js === 'function'){
            // nothing to do
        } else if (!entry.js){
            entry.js = () => undefined
        }

        if (typeof entry.css === 'string'){
            entry.css = makeSourceFileReaderFunc(r.resolveEntryFile(entry.css))
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

    r.debugLevel = (r.debugLevel === undefined ? +process.env.NSPACK_DEBUG_LEVEL : +r.debugLevel) || 0

    return r
}


function makeSourceFileReaderFunc(filepath, encoding='utf8'){
    return () => {
        return readFile(filepath, encoding)
                 .then(data => ({filePath: filepath, sourceCode: data}))
    }
}

function buildJsBundleCode(modules, entryModuleId=0){
    const modulesCodes = []
    
    for (let i = 0, n = modules.length; i < n; i++){
        const module = modules[i]
        if (module){
            modulesCodes.push("\n")
            modulesCodes.push(wrapModuleCode(module.id, module.source, (module.file || module.relativePath || module.name)))
            modulesCodes.push(",")
        } else {
            modulesCodes.push(",")
        }
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
})([${modulesCodes.join("")}]);

function __extract_default__(module){
    return module.__esModule ? module.default : module
}

`
}

function wrapModuleCode(moduleId, source, moduleFile){
    return `
// module#${moduleId}: file: ${moduleFile}
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

async function mkdirIfNotExists(fileDir){
    try {
        const st = await stat(fileDir)
        if (!st || !st.isDirectory()){
            throw new Error(`Invalid path/directory: ${fileDir}`)
        }
    } catch (e){
        try {
            await mkdir(fileDir)
        } catch(e){
            if (e.code !== 'EEXIST'){
                throw e
            }
        }
    }
}
