
import * as fs from 'fs'
import * as path from 'path'
import defaultModuleProcessors from './nspack-default-processors'
import NodeModuleResolver from './node-module-resolver'
import NSPackBuiltResult from './nspack-built-result'
import NSPackModule from './nspack-module'
import NSPackEntryModule from './nspack-entry-module'
import NSPackProgressBar from './nspack-progress-bar'


import {
    sleep,
    tryFStat,
    tryReadJsonFileContent,
    serial,
    parallel,
    parallelLimit,
    log,
} from './utils'

import { EntryModule, PackerConfig, Packer, ModuleResolver, FileSystem, Module, EntryResolver, BuiltResult, PackerConfigArg, NewModule } from './nspack-interface';
import { sanitizeAndFillConfig } from './nspacker-config';
import NsPackProgressBar from './nspack-progress-bar';

const babel = require('babel-core')
const md5 = require('md5')
const debug = require('debug')('nspack')


const extend = Object.assign

interface BundleModule  {
    id: string,
    name: string,
    file: string,
    relativePath?: string,
    source: string|Buffer,
}


export default class NSPack implements Packer {
    buildTimes: number;
    buildSpentTimeMs: number;
    debugLevel: number;
    buildBeginAt: Date;
    buildEndAt: Date;

    _config: PackerConfig;
    _fs: FileSystem = fs;
    _builtTimes: number = 0;
    _nextModuleId: number = 1;
    _externalModules: {[name: string]: NSPackModule} = {};
    _modules: {[id: number]: NSPackModule} = {};
    _modulesByFullPathName: {[fullPathName: string]: NSPackModule} = {};

    _entries: {[name: string]: NSPackEntryModule} = {};
    _result: NSPackBuiltResult;
    _lessModuleResolver: ModuleResolver;
    _nodeModuleResolver: ModuleResolver;

    _isBuilding: boolean = false;

    _babelrcFile: string;
    _babelrcObj: any;

    _configResolving: Promise<any>;

    _modulesProgressBar: NSPackProgressBar;
    _outputProgressBar: NSPackProgressBar;

    constructor(config: PackerConfigArg){
        sanitizeAndFillConfig.call(this, config)
    }
    
    async build(): Promise<BuiltResult>{
        if (this._isBuilding){
            throw new Error(`The building process already started!`)
        }

        if (this._configResolving){
            await this._configResolving
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
            }

            this._builtTimes++
            this.buildBeginAt = new Date()
            this._result = new NSPackBuiltResult(this)
            this._modulesProgressBar = new NSPackProgressBar(' compiling')
            this._outputProgressBar  = new NsPackProgressBar('   writing')
            

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
            log.error(e)
            throw e
        } finally {
            this._isBuilding = false
        }
    }
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
    }
    async incrementBuild(){
        return this.build()
    }
    async addModule(module){
        return this._addModuleIfNotExists(module)
                   .then(m => this._processModule(m))
    }
    async addOrUpdateModule(module){
        const m = await this._addModuleIfNotExists(module)
        if (!m.fresh){
            extend(m, module)
        }

        return this._processModule(m)
    }
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
    }
    async _buildFromEntries(){
        // await this._buildFromEntries_serial()
        await this._buildFromEntries_parrell()
    }
    async _buildFromEntries_serial(){
        await serial(
            Object.values(this._entries)
                  .filter((x: EntryModule) => !x.processed || x.needUpdate)
                  .map(module => 
                            () => this._buildEntryModule(module)
                                        .then(module => {
                                            module.processed = true
                                            module.needUpdate = false
                                            this._result.modules[module.name] = module
                                        })))
    }
    async _buildFromEntries_parrell(){
        await parallelLimit(
            Object.values(this._entries)
                  .filter((x: EntryModule) => !x.processed || x.needUpdate)
                  .map(module => 
                            () => this._buildEntryModule(module)
                                        .then(module => {
                                            module.processed = true
                                            module.needUpdate = false
                                            this._result.modules[module.name] = module
                                        })),
            /*limit=*/this._config.parallelLimit,
        )
    }
    async _buildEntryModule(entryModule: NSPackEntryModule){
        const baseDir = entryModule.baseDir

        this.debugLevel > 0 && debug(`building entry module %o...(baseDir: %o)`, entryModule.name, baseDir)

        const resolvingJsModule: Promise<NSPackModule> = 
                entryModule.loadJsSource()
                .then(({sourceCode, filePath}) => 
                    this._addModuleIfNotExists({
                        name: entryModule.name + '.js',
                        baseDir: baseDir,
                        fullPathName: filePath ? path.resolve(baseDir, filePath) : path.join(baseDir, entryModule.name + '.js'),
                        source: sourceCode,
                        libName: entryModule.libName,
                        libTarget: entryModule.libTarget,
                        amdExecOnDef: entryModule.amdExecOnDef,
                        isInternal: !filePath || (!sourceCode && sourceCode !== ''),
                    }))
                .then(module => this._processModule(module))

        const resolvingCssModule: Promise<NSPackModule> = 
                entryModule.loadCssSource()
                .catch(e => {
                    if (!entryModule.ignoreMissingCss){
                        throw e
                    }

                    return {sourceCode: null, filePath: null}
                })
                .then(({sourceCode, filePath}) => 
                    this._addModuleIfNotExists({
                        name: entryModule.name + '.css',
                        baseDir: baseDir,
                        fullPathName: filePath ? path.resolve(baseDir, filePath) : path.join(baseDir, entryModule.name + '.css'),
                        source: sourceCode,
                        isInternal: !filePath || (!sourceCode && sourceCode !== ''),
                    }))
                .then(module => this._processModule(module))

        const [jsModule, cssModule] = await Promise.all([resolvingJsModule, resolvingCssModule])

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

        cssModule.valid = !!(cssModule.source) || cssModule.source === '' || !!(jsModule.extractedCss)
        cssModule.outputSource = cssModule.valid ? this._bundleCssModule(cssModule, jsModule) : undefined
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

        const html = await entryModule.loadHtmlSource()
        const htmlValid = !!(html && (html.sourceCode || html.sourceCode === ''))
        const htmlHash = htmlValid ? this._hash(html) : ''
        const htmlOutputName = htmlValid ? this._buildOutputName({name: entryModule.name, hash: htmlHash, type: 'html'}) : ''
        
        entryModule.bundle.html = {
            valid:        htmlValid,
            outputSource: html.sourceCode,
            outputSize:   htmlValid ? html.sourceCode.length : 0,
            hash:         htmlHash,
            outputName:   htmlOutputName,
        }

        await Promise.all([
            this._outputFile(jsModule.outputName, jsModule.outputSource, entryModule, 'js'),
            this._outputFile(cssModule.outputName, cssModule.outputSource, entryModule, 'css'),
            this._outputFile(htmlOutputName, html.sourceCode, entryModule, 'html'),
        ])

        entryModule.processed = true
        return entryModule
    }
    async _bundleJsModule(jsModule: NSPackModule){
        const bundled = newArray<BundleModule>(this._nextModuleId)
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
    }
    _bundleCssModule(cssModule: NSPackModule, jsModule: NSPackModule=null): string{
        if (jsModule && jsModule.extractedCss && jsModule.extractedCss.length > 0){
            return cssModule.builtSource + jsModule.extractedCss
        }

        return cssModule.builtSource + ''
    }
    _extractCssFromJs(jsModule: NSPackModule, cssModule: NSPackModule){
        const extractedCssArr = []

        const extracted = {}
        const extractRec = (dependencies) => {
            if (dependencies){
                for (let x of dependencies){
                    if (x.builtType === 'css'){
                        if (!extracted[x.id]){
                            extracted[x.id] = true
                            extractedCssArr.push(
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

        jsModule.extractedCss = extractedCssArr.join("\n")
        jsModule.cssExtracted = true
    }
    _transformCssInJs(jsModule: NSPackModule){
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
    }
    _transformCssModuleToInjectCssScript(module: NSPackModule){
        const injectStyleModule = this._getInjectStyleModule()
        const styleText = JSON.stringify(module.builtSource)
        module.builtSource = `module.exports = __require_module__(${injectStyleModule.id}/*${injectStyleModule.name}*/)(${styleText})`
        module.builtType = 'js'
        module.dependencies.push(injectStyleModule)
    }
    _getInjectStyleModule(){
        const injectStyleModuleName = '__inject_style__'
        return this._addInternalModule(injectStyleModuleName, getInjectStyleModuleSource)
    }
    _addInternalModule(moduleName: string, getModuleSource: () => string|Buffer){
        const moduleFile = 'internal://' + moduleName
        if (moduleFile in this._modulesByFullPathName){
            return this._modulesByFullPathName[moduleFile]
        }

        const module = new NSPackModule({
            id: this._nextModuleId++,
            baseDir: '',
            name: moduleName,
            file: moduleFile,
            fullPathName: moduleFile,
            fullFileDirName: '',
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
    }
    async _transCompile(jsCode: string){
        const babelConfig = await this._loadBabelRc()

        try{
            const res = babel.transform(jsCode, babelConfig)

            return `(function(__nspack__){${res.code};return __nspack__.r})({});`
        } catch (e){
            // todo...
            fs.writeFileSync(path.join(this._config.outputBase, ".last-babel-failed.js"), jsCode)
            throw e
        }
    }
    async _loadBabelRc(){
        if (this._babelrcObj === undefined){
            this._babelrcObj = await this._loadBabelRcNoCache()
        }

        return this._babelrcObj
    }
    async _loadBabelRcNoCache(){
        if (this._config.babelrc === false){
            return false
        } else if (typeof this._config.babelrc === 'string'){
            this._babelrcFile = this._config.babelrc
            return await tryReadJsonFileContent(this._babelrcFile)
        } else if (this._config.babelrc === true || this._config.babelrc === undefined){
            this._babelrcFile = '.babelrc'
            return this._config.babelrc = await tryReadJsonFileContent(this._babelrcFile)
        } else {
            return this._config.babelrc
        }
    }
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
    }
    _buildManifests(){
        const manifests = {}
        for (let m of Object.values(this._entries)){
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
    }
    _buildOutputName({type, name, hash}: {type: string, name: string, hash: string}){
        const defaultOutputConfig = this._config.output['*']
        const moduleOutputConfig = this._config.output[name] || defaultOutputConfig
        const template = moduleOutputConfig[type] || defaultOutputConfig[type]
        return template.replace('[name]', name).replace('[hash]', hash)
    }
    _hash(content){
        return md5(content || '').substring(0, this._config.hashLength)
    }
    _resolveEntryFile(filename: string): string{
        return path.resolve(this._config.entryBase, filename)
    }
    _resolveOutputFile(filename: string): string{
        return path.resolve(this._config.outputBase, filename)
    }
    async _outputFile(outputName: string, content: string|Buffer|null, entryModule, outputType){
        this._outputProgressBar.addTotal()
        await this._outputFile_np(outputName, content, entryModule, outputType)
        this._outputProgressBar.processed()
    }
    async _outputFile_np(outputName: string, content: string|Buffer|null, entryModule, outputType){
        if (!outputName || !isValidFileContent(content)){
            return
        }

        const filePath = this._resolveOutputFile(outputName)
        const fileDir = path.dirname(filePath)
        const outputFile = {
            packer: this,
            entryModule,
            outputName, outputType,
            filePath, fileDir,
            content,
            async write(options={}){
                const t = options ? extend({}, this, options) : this
                await t.packer._writeOutputFile(t.filePath, t.content, 'utf8')
            }
        }

        if (await this._applyHook("outputFile", outputFile) === false){
            return
        }

        await outputFile.write()
    }
    async _writeOutputFile(filename: string, content: string|Buffer, encoding='utf8'){
        const filePath = this._resolveOutputFile(filename)
        await this._mkdirIfNotExists(path.dirname(filePath))
        await this._writeFile(filePath, content, encoding)
    }
    async _resolveModule(moduleName: string, baseDir: string, resolvingParents: string){
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
    }
    async _processModule(module: NSPackModule){
        this._modulesProgressBar.addTotal()

        const r = await this._processModule_np(module)

        this._modulesProgressBar.processed()

        return r
    }
    async _processModule_np(module: NSPackModule){
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
    }
    async _addModuleIfNotExists(module: NewModule): Promise<NSPackModule>{
        if (!('fullPathName' in module)){
            if (module.isInternal || module.isExternal){
                module.fullPathName = module.file // path.resolve(module.baseDir, module.file)
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

        const m = new NSPackModule(module, this)
        m.fresh = true
        m.id = this._nextModuleId++

        this._modules[m.id] = m
        this._modulesByFullPathName[m.fullPathName] = m

        return m
    }
    async _resolveModuleFullPathName(moduleName: string, baseDir: string): Promise<string> {
        // if (moduleName[0] === '@'){
        //     return await this._nodeModuleResolver.resolveModuleFullPathName(
        //         path.join(this._config.entryBase, moduleName.substring(1)), 
        //         ''
        //     )
        // }

        return await this._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir)
    }
    debugDumpAllModules(){
        debug("all modules: ")
        for (let i = 0, n = this._nextModuleId; i < n; i++){
            let m = this._modules[i]
            if (m){
                debug("\t[%o]\t%o\t%o\t%o (%o)", 
                    i, m.type, m.builtType, m.name, m.fullPathName)
                debug("source: %o", m.source)
                debug("built: %o", m.builtSource)
            }
        }
    }
    debugDumpAllEntriesOutputs(){
        debug("Done build. Spent %s(s)", (this.buildSpentTimeMs / 1000).toFixed(3))

        for (let entryModule of Object.values(this._entries)){
            debug("\t%o:", entryModule.name)
            debug("\t\t%o: %o", entryModule.bundle.script.outputName, entryModule.bundle.script.hash)
            debug("\t\t%o: %o", entryModule.bundle.style.outputName, entryModule.bundle.style.hash)
            debug("\t\t%o: %o", entryModule.bundle.html.outputName, entryModule.bundle.html.hash)
        }
    }
    async _writeFile(filePathName: string, data: string|Buffer, encoding: string): Promise<any>{
        return new Promise((resolve, reject) => {
            this._fs.writeFile(filePathName, data, encoding, (err) => {
                if (err){
                    log.error(`Error: failed to write to file "${filePathName}", detail: `, err)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
    async _mkdirIfNotExists(fileDir: string): Promise<any>{
        return new Promise((resolve, reject) => {
            this._fs.stat(fileDir, (err, st) => {
                if (err){
                    this._fs.mkdir(fileDir, (err: any) => {
                        if (err && err.code !== 'EEXIST'){
                            log.error(`Error: failed to mkdir "${fileDir}", detail: `, err)
                            reject(err)
                        } else {
                            resolve()
                        }
                    })
                } else {
                    if (!st || !st.isDirectory()){
                        reject(new Error(`Invalid path/directory: ${fileDir}`))
                    } else {
                        resolve()
                    }
                }
    
            })

        })
    }
    _applyHook(hookName: string, ...args: any[]): any|Promise<any>{
        const hook = this._config.hooks[hookName]
        if (hook){
            return hook.apply(hook, args)
        }
    }
    async _checkModulesUpdates(): Promise<boolean>{
        await Promise.all(
            Object.values(this._modules)
                  .map(m => m._checkIfNeedUpdate0())
        )
        
        let hasOneUpdated = false
        for (let m of Object.values(this._entries)){
            hasOneUpdated = hasOneUpdated || m._checkIfNeedUpdate1()
        }

        return hasOneUpdated
    }
}

function buildJsBundleCode(modules: BundleModule[], entryModuleId=0){
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

function newArray<T>(len: number, defaultValue?: T): T[]{
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

function noop(...args){}

function isValidFileContent(content: string|Buffer|null): boolean{
    return !!content || content === ''
}
