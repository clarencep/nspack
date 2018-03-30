const fs = require('fs')
const path = require('path')
const md5 = require('md5')
const cb2p = require('./cb2p')
const babel = require('babel-core')
const debug = require('debug')('nspack')


const defaultModuleProcessors = require('./nspack-default-processors')

const NodeModuleResolver = require('./node-module-resolver')
const NSPackBuiltResult = require('./nspack-built-result')
const NSPackModule = require('./nspack-module')
const NSPackEntryModule = require('./nspack-entry-module')

const {
    sleep,
    tryFStat,
    tryReadJsonFileContent,
    readFile,
} = require('./utils')

const extend = Object.assign


module.exports = NSPack

extend(module.exports, {
    hooks: {
        OutputUglifier: require('./nspack-hook-output-uglifier'),
    },
})


function NSPack(config){
    if (!(this instanceof NSPack)){
        return (new NSPack(config)).build()
    }

    this._config = sanitizeConfig.call(this, config)
    this.debugLevel = this._config.debugLevel
    this._fs = this._config.fs || fs

    this._builtTimes = 0
    this._nextModuleId = 1
    this._externalModules = {} // moduleName => module
    this._modules = {} // id => module
    this._modulesByFullPathName = {} // fullPathName => module
    this._result = new NSPackBuiltResult(this)
    this._nodeModuleResolver = new NodeModuleResolver(this._config.resolve)
    return this
}


extend(NSPack.prototype, {
    async build(){
        if (this._isBuilding){
            throw new Error(`The building process already started!`)
        }

        try {
            this._isBuilding = true

            if (this._builtTimes > 0){
                this.debugLevel > 10 && debug("checking if module updated")
                const hasUpdated = await this._checkModulesUpdates()
                if (!hasUpdated){
                    this.debugLevel > 10 && debug("modules not updated, so don't build")
                    this._result = new NSPackBuiltResult(this)
                    this._result.updated = false
                    this._isBuilding = false
                    return this._result
                }

                this.debugLevel > 10 && debug("modules updated, so do build")
                this._result = new NSPackBuiltResult(this)
            }

            this._builtTimes++
            this.buildBeginAt = new Date()

            await this._resolveExternalModules()
            await this._buildFromEntries()
            await this._outputManifests()

            this._result.updated = true
            this.buildEndAt = new Date()
            this.buildSpentTimeMs = +this.buildEndAt - (+this.buildBeginAt)

            this.debugLevel > 1 && this.debugDumpAllModules()
            this.debugLevel > 0 && this.debugDumpAllEntriesOutputs()

            this._isBuilding = false
            return this._result
        } catch (e){
            this._isBuilding = false
            console.error(e)
            throw e
        } finally {
            this._isBuilding = false
        }
    },
    async watch(doneCb=noop, beginBuildCb=noop){
        let lastUpdated, res

        for(;;){
            const beginTime = Date.now()

            try {
                if (lastUpdated || !res){
                    if (!res){
                        this.debugLevel > 1 && debug("begin first nspack...")
                    } else {
                        this.debugLevel > 1 && debug("watching for changes...")
                    }

                    await beginBuildCb(this)
                }

                lastUpdated = false
                res = await this.incrementBuild()
                
                lastUpdated = (res.buildTimes <= 1 || res.updated)
                if (lastUpdated){
                    await doneCb(null, res)
                }
            } catch (e){
                await doneCb(e, null)
            }

            const spentTimeMs = Date.now() - beginTime
            await sleep(Math.max(1, this._config.watchInterval - spentTimeMs))
        }
    },
    async incrementBuild(){
        return this.build()
    },
    async addModule(module){
        return this._addModuleIfNotExists(module)
                   .then(m => this._processModule(m))
    },
    async addOrUpdateModule(module){
        const m = await this._addModuleIfNotExists(module)
        if (!m.fresh){
            extend(m, module)
        }

        return this._processModule(m)
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
        await Promise.all(
            Object.values(this._config.entry)
                  .filter(x => !x.processed || x.needUpdate)
                  .map(module => this._buildEntryModule(module)
                                     .then(module => {
                                        module.processed = true
                                        module.needUpdate = false
                                        this._result.modules[module.name] = module
                                     }))
        )
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
                        libName: entryModule.libName === undefined ? entryModule.name.replace(/\\/g, '/') : entryModule.libName,
                        libTarget: entryModule.libTarget,
                        amdExecOnDef: entryModule.amdExecOnDef === undefined ? true : !!entryModule.amdExecOnDef,
                        isInternal: !filePath || (!sourceCode && sourceCode !== ''),
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
                        isInternal: !filePath || (!sourceCode && sourceCode !== ''),
                    }))
                .then(module => this._processModule(module))

        const [jsModule, cssModule] = await Promise.all([resolvingJsModule, resolvingCssModule])

        // // debug:
        // if (entryModule.name === 'about'){
        //     console.log('=============about: ', entryModule)
        // }

        if (entryModule.extractCssFromJs){
            this._extractCssFromJs(jsModule, cssModule)
        } else {
            this._transformCssInJs(jsModule)
        }

        jsModule.valid = !!(jsModule.source || jsModule.source === '')
        jsModule.outputSource = jsModule.valid ? await this._bundleJsModule(jsModule) : undefined
        jsModule.outputSize = jsModule.outputSource ? jsModule.outputSource.length : 0
        jsModule.hash = jsModule.valid ? this._hash(jsModule.outputSource) : ''
        jsModule.outputName = jsModule.valid ? this._buildOutputName({
            name: entryModule.name,
            hash: jsModule.hash,
            type: 'js',
        }) : ''

        cssModule.valid = !!(cssModule.source || cssModule.source === '' || (entryModule.extractCssFromJs && cssModule.appendSources && cssModule.appendSources.length > 0))
        cssModule.outputSource = cssModule.valid ? this._bundleCssModule(cssModule) : undefined
        cssModule.outputSize = cssModule.outputSource ? cssModule.outputSource.length : 0
        cssModule.hash = cssModule.valid ? this._hash(cssModule.outputSource) : ''
        cssModule.outputName = cssModule.valid ? this._buildOutputName({
            name: entryModule.name,
            hash: cssModule.hash,
            type: 'css',
        }) : ''

        entryModule.jsModule = jsModule
        entryModule.cssModule = cssModule

        entryModule.bundle = {
            script: jsModule,
            scriptsTags: jsModule.outputSource ? `<script src="/${jsModule.outputName}"></script>` : '',
            style: cssModule,
            stylesTags: cssModule.outputSource ? `<link rel="stylesheet" href="/${cssModule.outputName}" >` : '',
            html: null,
        }

        const html = await entryModule.html(entryModule)
        const htmlValid = !!(html || html === '')
        const htmlHash = htmlValid ? this._hash(html) : ''
        const htmlOutputName = htmlValid ? this._buildOutputName({name: entryModule.name, hash: htmlHash, type: 'html'}) : ''
        
        entryModule.bundle.html = {
            valid:        htmlValid,
            outputSource: html,
            outputSize:   html ? html.length : 0,
            hash:         htmlHash,
            outputName:   htmlOutputName,
        }

        await Promise.all([
            this._outputFile(jsModule.outputName, jsModule.outputSource, entryModule, 'js'),
            this._outputFile(cssModule.outputName, cssModule.outputSource, entryModule, 'css'),
            this._outputFile(htmlOutputName, html, entryModule, 'html'),
        ])

        entryModule.processed = true
        return entryModule
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

        const transpiledCode = await this._transCompile(bundledJsCode)

        return wrapLibrary(jsModule, transpiledCode)
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
        module.builtSource = `module.exports = __require_module__(${injectStyleModule.id}/*${injectStyleModule.name}*/)(${styleText})`
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

        const module = new NSPackModule({
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
        }, this)

        this._modules[module.id] = module
        this._modulesByFullPathName[moduleFile] = module
        return module
    },
    async _transCompile(jsCode){
        const babelConfig = await this._loadBabelRc()

        const res = babel.transform(jsCode, babelConfig)

        return `(function(__nspack__){${res.code};return __nspack__.r})({});`
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
    async _outputManifests(){
        const manifestsConfig = this._config.outputHashManifests
        if (!manifestsConfig || (!manifestsConfig.json && !manifestsConfig.jsonp)){
            return
        }

        const manifests = this._buildManifests()
        await this._applyHook('buildManifests', manifests)

        const manifestsJson = JSON.stringify(manifests)

        const jobs = []
        if (manifestsConfig.json){
            jobs.push(this._writeOutputFile(manifestsConfig.json, manifestsJson))
        }
        
        if (manifestsConfig.jsonp){
            const jsonpCb = manifestsConfig.jsonpCallback || 'nspackManifestsJsonpCallback'
            jobs.push(this._writeOutputFile(manifestsConfig.jsonp, `${jsonpCb}(${manifestsJson})`))
        }

        await Promise.all(jobs)
    },
    _buildManifests(){
        const manifests = {}
        for (let m of Object.values(this._config.entry)){
            // todo...
            const bundle = m.bundle
            if (bundle.script.valid){
                manifests[m.name + '.js'] = bundle.script.hash
            }

            if (bundle.style.valid){
                manifests[m.name + '.css'] = bundle.style.hash
            }

            if (bundle.html.valid){
                manifests[m.name + '.html'] = bundle.html.hash
            }
        }

        return manifests
    },
    _buildOutputName({type, name, hash}){
        const defaultOutputConfig = this._config.output['*']
        const moduleOutputConfig = this._config.output[name] || defaultOutputConfig
        const template = moduleOutputConfig[type] || defaultOutputConfig[type]
        return template.replace('[name]', name).replace('[hash]', hash)
    },
    _hash(content){
        return md5(content || '').substring(0, this._config.hashLength)
    },
    async _outputFile(outputName, content, entryModule, outputType){
        if (content === undefined){
            return
        }

        const filePath = this._config.resolveOutputFile(outputName)
        const fileDir = path.dirname(filePath)
        const outputFile = {
            packer: this,
            entryModule,
            outputName, outputType,
            filePath, fileDir,
            content,
            async write(options){
                const t = options ? extend({}, this, options) : this
                await t.packer._mkdirIfNotExists(t.fileDir)
                await t.packer._callFsOpAsync('writeFile', t.filePath, t.content, 'utf8')
            }
        }

        if (await this._applyHook("outputFile", outputFile) === false){
            return
        }

        await outputFile.write()
    },
    async _writeOutputFile(filename, content){
        const filePath = this._config.resolveOutputFile(filename)
        await this._mkdirIfNotExists(path.dirname(filePath))
        await this._callFsOpAsync('writeFile', filePath, content, 'utf8')
    },
    async _resolveModule(moduleName, baseDir, resolvingParents){
        this.debugLevel > 0 && debug(`resolving %o in %o`, moduleName, baseDir)

        if (moduleName in this._config.externals){
            return this._externalModules[moduleName]
        } 
        
        const module = await this._addModuleIfNotExists({
            name: moduleName,
            baseDir: baseDir,
            resolvingParents,
        })

        await this._processModule(module)

        return module
    },
    async _processModule(module){
        if (module.processed && !module.needUpdate){
            this.debugLevel > 3 && debug("ignore module %o in %o (processed and do not need update)", module.name, module.baseDir || module.fullFileDirName)
            return module
        }

        if (module.processing){
            return module.processing
        }

        const processing = module.processing = (async () => {
            this.debugLevel > 1 && debug("processing module %o in %o", module.name, module.baseDir || module.fullFileDirName)
    
            await module.loadSource()
    
            const processors = this._config.moduleProcessors[module.type]
            if (processors){
                for (let processor of processors){
                    await processor.call(processor, module, this)
                }
            } else {
                throw new Error(`No processor for ${module.type} when processing file ${module.fullPathName}`)
            }
    
            module.processed = true
            module.needUpdate = false
            return module
        })()

        await processing
        module.processing = false
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
            throw new Error(`Failed to resolve module '${module.name}' in directory '${module.baseDir}'` + (module.resolvingParents || ''))
        }

        if (module.fullPathName in this._modulesByFullPathName){
            this._modulesByFullPathName[module.fullPathName].fresh = false
            return this._modulesByFullPathName[module.fullPathName]
        }

        module = new NSPackModule(module, this)
        module.fresh = true
        module.id = this._nextModuleId++

        this._modules[module.id] = module
        this._modulesByFullPathName[module.fullPathName] = module

        return module
    },
    async _resolveModuleFullPathName(moduleName, baseDir) {
        if (moduleName[0] === '@'){
            return await this._nodeModuleResolver.resolveModuleFullPathName(
                path.join(this._config.entryBase, moduleName.substring(1)), 
                ''
            )
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
            debug("\t%o:", entryModule.name)
            debug("\t\t%o: %o", entryModule.bundle.script.outputName, entryModule.bundle.script.hash)
            debug("\t\t%o: %o", entryModule.bundle.style.outputName, entryModule.bundle.style.hash)
            debug("\t\t%o: %o", entryModule.bundle.html.outputName, entryModule.bundle.html.hash)
        }
    },
    _callFsOpAsync(op, ...args){
        return new Promise((resolve, reject) => {
            const cb = (err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            }

            this._fs[op].apply(this._fs, args.concat([cb]))
        })
    },
    async _mkdirIfNotExists(fileDir){
        try {
            const st = await this._callFsOpAsync('stat', fileDir)
            if (!st || !st.isDirectory()){
                throw new Error(`Invalid path/directory: ${fileDir}`)
            }
        } catch (e){
            try {
                await this._callFsOpAsync('mkdir', fileDir)
            } catch(e){
                if (e.code !== 'EEXIST'){
                    throw e
                }
            }
        }
    },
    _applyHook(hookName, ...args){
        const hook = this._config.hooks[hookName]
        if (hook){
            return hook.apply(hook, args)
        }
    },
    async _checkModulesUpdates(){
        await Promise.all(
            Object.values(this._modules)
                  .map(m => m._checkIfNeedUpdate0())
        )
        
        let hasOneUpdated = false
        for (let m of Object.values(this._config.entry)){
            hasOneUpdated = hasOneUpdated || m._checkIfNeedUpdate1()
        }

        return hasOneUpdated
    }
})

/**
 * 
 * @param {*} config 
 * @this NSPack
 */
function sanitizeConfig(config){
    const r = {...config}

    if (!r.entryBase){
        r.entryBase = process.cwd()
    }

    r.resolveEntryFile = (f) => path.join(r.entryBase, f)

    r.entry = {...config.entry}
    for (let entryName of Object.keys(r.entry)){
        const entry = r.entry[entryName] = new NSPackEntryModule({name: entryName}, this)
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

    r.hooks = extend({
        outputFile: noop,
        buildManifests: noop,
    }, r.hooks || {})

    r.watchInterval = +r.watchInterval || 500

    r.resolve = r.resolve || {}
    r.resolve.extensions = r.resolve.extensions || ['.js']
    r.resolve.alias = r.resolve.alias || {'@': r.entryBase}

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
__nspack__.r = (function(modules){
    var required = {};
    var require = function(moduleId){
        var m = required[moduleId];
        if (!m){
            m = required[moduleId] = {exports:{}};
            modules[moduleId](require, m, m.exports);
        }
    
        return m.exports;
    };
    return require(${entryModuleId});
})([${modulesCodes.join("")}]);

function __extract_default__(module){
    return module.__esModule ? module.default : module
}

function __set_esModule_flag__(exports){
    exports.__esModule = true
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

function wrapLibrary({libName, libTarget, amdExecOnDef}, code){
    // debug("wrapLibray: ", {libName, libTarget, amdExecOnDef})
    // no library, just return
    if (!libTarget){
        return code
    }

    if (libTarget === 'amd') {
        if (libName){
            if (!amdExecOnDef){
                return `
define(${JSON.stringify(libName)}, [], function(){
    return ${code}
})
`
            } else {
            return `
(function(f,u){
    var m,e;
    try{m = f()}catch(x){e=x}; 
    define(${JSON.stringify(libName)}, [], function(){if(e !== u){throw e} return m})
    if(e !== u){throw e}
})(function(){
    return ${code}
})
`
            }
        } else {
            return 
            return `
define([], function(){
    return ${code}
})
`
        }
    } else if (libTarget === 'umd') {
        if (libName){
            return `
(function (root, moduleName, moduleDef, undefined) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = moduleDef()
    else if (typeof define === 'function' && define.amd)
        ${amdExecOnDef 
            ? '{var m, e; try{m = moduleDef()}catch(x){e=x} define(moduleName, [], function(){if(e !== undefined){throw e} return m})} if(e !== undefined){throw e}' 
            : 'define(moduleName, [], moduleDef)'}
    else if (typeof exports === 'object')
        exports[moduleName] = moduleDef()
    else
        root[moduleName] = moduleDef()
})(this, ${JSON.stringify(libName)}, function(){
    return ${code}
})
`
        } else {
            return `
(function (root, moduleDef, undefined) {
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = moduleDef()
    else if (typeof define === 'function' && define.amd)
        ${amdExecOnDef 
            ? '{var m, e; try{m = moduleDef()}catch(x){e=x}; define([], function(){if(e !== undefined){throw e} return m})} if(e !== undefined){throw e}' 
            : 'define([], moduleDef)'}
    else if (typeof exports === 'object')
        exports['return'] = moduleDef()
    else
        root.returnExports = moduleDef()
})(this, ${JSON.stringify(libName)}, function(){
    return ${code}
})
`
        }
    } else if (libTarget === 'commonjs') {
        return 'module.exports = ' + code
    } else {
        throw new Error(`Unknown libTarget(${libTarget}) when processing ${libName}`)
    }
}

function noop(){}
