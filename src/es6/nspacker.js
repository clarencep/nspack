"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const node_module_resolver_1 = require("./node-module-resolver");
const nspack_built_result_1 = require("./nspack-built-result");
const nspack_module_1 = require("./nspack-module");
const utils_1 = require("./utils");
const nspacker_config_1 = require("./nspacker-config");
const babel = require('babel-core');
const md5 = require('md5');
const debug = require('debug')('nspack');
const extend = Object.assign;
class NSPack {
    constructor(config) {
        this._fs = fs;
        this._builtTimes = 0;
        this._nextModuleId = 1;
        this._externalModules = {};
        this._modules = {};
        this._modulesByFullPathName = {};
        this._entries = {};
        this._isBuilding = false;
        nspacker_config_1.sanitizeAndFillConfig.call(this, config);
        this._result = new nspack_built_result_1.default(this);
        this._nodeModuleResolver = new node_module_resolver_1.default(this._config.resolve);
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isBuilding) {
                throw new Error(`The building process already started!`);
            }
            try {
                this._isBuilding = true;
                if (this._builtTimes > 0) {
                    this.debugLevel > 10 && debug("checking if module updated");
                    const hasUpdated = yield this._checkModulesUpdates();
                    if (!hasUpdated) {
                        this.debugLevel > 10 && debug("modules not updated, so don't build");
                        this._result = new nspack_built_result_1.default(this);
                        this._result.updated = false;
                        this._isBuilding = false;
                        return this._result;
                    }
                    this.debugLevel > 10 && debug("modules updated, so do build");
                    this._result = new nspack_built_result_1.default(this);
                }
                this._builtTimes++;
                this.buildBeginAt = new Date();
                yield this._resolveExternalModules();
                yield this._buildFromEntries();
                yield this._outputManifests();
                this._result.updated = true;
                this.buildEndAt = new Date();
                this.buildSpentTimeMs = +this.buildEndAt - (+this.buildBeginAt);
                this.debugLevel > 1 && this.debugDumpAllModules();
                this.debugLevel > 0 && this.debugDumpAllEntriesOutputs();
                this._isBuilding = false;
                return this._result;
            }
            catch (e) {
                this._isBuilding = false;
                console.error(e);
                throw e;
            }
            finally {
                this._isBuilding = false;
            }
        });
    }
    watch(doneCb = noop, beginBuildCb = noop) {
        return __awaiter(this, void 0, void 0, function* () {
            let lastUpdated, res;
            for (;;) {
                const beginTime = Date.now();
                try {
                    if (lastUpdated || !res) {
                        if (!res) {
                            this.debugLevel > 1 && debug("begin first nspack...");
                        }
                        else {
                            this.debugLevel > 1 && debug("watching for changes...");
                        }
                        yield beginBuildCb(this);
                    }
                    lastUpdated = false;
                    res = yield this.incrementBuild();
                    lastUpdated = (res.buildTimes <= 1 || res.updated);
                    if (lastUpdated) {
                        yield doneCb(null, res);
                    }
                }
                catch (e) {
                    yield doneCb(e, null);
                }
                const spentTimeMs = Date.now() - beginTime;
                yield utils_1.sleep(Math.max(1, this._config.watchInterval - spentTimeMs));
            }
        });
    }
    incrementBuild() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.build();
        });
    }
    addModule(module) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._addModuleIfNotExists(module)
                .then(m => this._processModule(m));
        });
    }
    addOrUpdateModule(module) {
        return __awaiter(this, void 0, void 0, function* () {
            const m = yield this._addModuleIfNotExists(module);
            if (!m.fresh) {
                extend(m, module);
            }
            return this._processModule(m);
        });
    }
    _resolveExternalModules() {
        return __awaiter(this, void 0, void 0, function* () {
            const externalModules = this._config.externals;
            if (!externalModules) {
                return;
            }
            const jobs = [];
            for (let moduleName of Object.keys(externalModules)) {
                jobs.push(this._addModuleIfNotExists({
                    name: moduleName,
                    baseDir: this._config.entryBase,
                    builtSource: `module.exports = ${externalModules[moduleName]}`,
                    file: 'external://' + moduleName,
                    type: 'js',
                    builtType: 'js',
                    isExternal: true,
                    processed: true,
                }).then(module => {
                    this._externalModules[moduleName] = module;
                }));
            }
            yield Promise.all(jobs);
        });
    }
    _buildFromEntries() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._buildFromEntries_serial();
            // await this._buildFromEntries_parrell()
        });
    }
    _buildFromEntries_serial() {
        return __awaiter(this, void 0, void 0, function* () {
            yield utils_1.serial(Object.values(this._entries)
                .filter((x) => !x.processed || x.needUpdate)
                .map(module => () => this._buildEntryModule(module)
                .then(module => {
                module.processed = true;
                module.needUpdate = false;
                this._result.modules[module.name] = module;
            })));
        });
    }
    _buildFromEntries_parrell() {
        return __awaiter(this, void 0, void 0, function* () {
            yield utils_1.parallelLimit(Object.values(this._entries)
                .filter((x) => !x.processed || x.needUpdate)
                .map(module => () => this._buildEntryModule(module)
                .then(module => {
                module.processed = true;
                module.needUpdate = false;
                this._result.modules[module.name] = module;
            })), 
            /*limit=*/ 10);
        });
    }
    _buildEntryModule(entryModule) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debugLevel > 0 && debug(`building entry module %o...`, entryModule.name);
            const baseDir = this._config.entryBase;
            entryModule.entry = { name: entryModule.name, baseDir: baseDir };
            const resolvingJsModule = entryModule.loadJsSource()
                .then(({ sourceCode, filePath }) => this._addModuleIfNotExists({
                name: entryModule.name + '.js',
                baseDir: baseDir,
                fullPathName: filePath || path.join(baseDir, entryModule.name + '.js'),
                source: sourceCode,
                libName: entryModule.libName === undefined ? entryModule.name.replace(/\\/g, '/') : entryModule.libName,
                libTarget: entryModule.libTarget,
                amdExecOnDef: entryModule.amdExecOnDef === undefined ? true : !!entryModule.amdExecOnDef,
                isInternal: !filePath || (!sourceCode && sourceCode !== ''),
            }))
                .then(module => this._processModule(module));
            const resolvingCssModule = entryModule.loadCssSource()
                .catch(e => {
                if (!entryModule.ignoreMissingCss) {
                    throw e;
                }
                return { sourceCode: null, filePath: null };
            })
                .then(({ sourceCode, filePath }) => this._addModuleIfNotExists({
                name: entryModule.name + '.css',
                baseDir: baseDir,
                fullPathName: filePath || path.join(baseDir, entryModule.name + '.css'),
                source: sourceCode,
                isInternal: !filePath || (!sourceCode && sourceCode !== ''),
            }))
                .then(module => this._processModule(module));
            const [jsModule, cssModule] = yield Promise.all([resolvingJsModule, resolvingCssModule]);
            // // debug:
            // if (entryModule.name === 'about'){
            //     console.log('=============about: ', entryModule)
            // }
            if (entryModule.extractCssFromJs) {
                this._extractCssFromJs(jsModule, cssModule);
            }
            else {
                this._transformCssInJs(jsModule);
            }
            jsModule.valid = !!(jsModule.source || jsModule.source === '');
            jsModule.outputSource = jsModule.valid ? yield this._bundleJsModule(jsModule) : undefined;
            jsModule.outputSize = jsModule.outputSource ? jsModule.outputSource.length : 0;
            jsModule.hash = jsModule.valid ? this._hash(jsModule.outputSource) : '';
            jsModule.outputName = jsModule.valid ? this._buildOutputName({
                name: entryModule.name,
                hash: jsModule.hash,
                type: 'js',
            }) : '';
            cssModule.valid = !!(cssModule.source || cssModule.source === '' || (entryModule.extractCssFromJs && cssModule.appendSources && cssModule.appendSources.length > 0));
            cssModule.outputSource = cssModule.valid ? this._bundleCssModule(cssModule) : undefined;
            cssModule.outputSize = cssModule.outputSource ? cssModule.outputSource.length : 0;
            cssModule.hash = cssModule.valid ? this._hash(cssModule.outputSource) : '';
            cssModule.outputName = cssModule.valid ? this._buildOutputName({
                name: entryModule.name,
                hash: cssModule.hash,
                type: 'css',
            }) : '';
            entryModule.jsModule = jsModule;
            entryModule.cssModule = cssModule;
            entryModule.bundle = {
                script: jsModule,
                scriptsTags: jsModule.outputSource ? `<script src="/${jsModule.outputName}"></script>` : '',
                style: cssModule,
                stylesTags: cssModule.outputSource ? `<link rel="stylesheet" href="/${cssModule.outputName}" >` : '',
                html: null,
            };
            const html = yield entryModule.loadHtmlSource();
            const htmlValid = !!(html && (html.sourceCode || html.sourceCode === ''));
            const htmlHash = htmlValid ? this._hash(html) : '';
            const htmlOutputName = htmlValid ? this._buildOutputName({ name: entryModule.name, hash: htmlHash, type: 'html' }) : '';
            entryModule.bundle.html = {
                valid: htmlValid,
                outputSource: html.sourceCode,
                outputSize: html && html.sourceCode ? html.sourceCode.length : 0,
                hash: htmlHash,
                outputName: htmlOutputName,
            };
            yield Promise.all([
                this._outputFile(jsModule.outputName, jsModule.outputSource, entryModule, 'js'),
                this._outputFile(cssModule.outputName, cssModule.outputSource, entryModule, 'css'),
                this._outputFile(htmlOutputName, html, entryModule, 'html'),
            ]);
            entryModule.processed = true;
            return entryModule;
        });
    }
    _bundleJsModule(jsModule) {
        return __awaiter(this, void 0, void 0, function* () {
            const bundled = newArray(this._nextModuleId);
            const bundleRec = (module) => {
                if (!bundled[module.id]) {
                    bundled[module.id] = {
                        id: module.id,
                        name: module.name,
                        file: module.relativePath,
                        source: module.builtSource,
                    };
                    if (module.dependencies && module.dependencies.length > 0) {
                        for (let x of module.dependencies) {
                            if (x.builtType === 'js') {
                                bundleRec(x);
                            }
                            else if (x.builtType === 'css') {
                                if (jsModule.cssExtracted) {
                                    bundled[x.id] = {
                                        id: x.id,
                                        name: x.name,
                                        file: x.relativePath,
                                        source: "",
                                    };
                                }
                                else {
                                    throw new Error("Logic Error: css modules still exists when bundling.");
                                }
                            }
                            else {
                                throw new Error(`Unknown builtType: ${x.builtType} when bundling ${x.fullPathName} of ${jsModule.fullPathName}`);
                            }
                        }
                    }
                }
            };
            bundleRec(jsModule);
            const bundledJsCode = buildJsBundleCode(bundled, jsModule.id);
            const transpiledCode = yield this._transCompile(bundledJsCode);
            return wrapLibrary(jsModule, transpiledCode);
        });
    }
    _bundleCssModule(cssModule) {
        if (cssModule.appendSources && cssModule.appendSources.length > 0) {
            return (cssModule.builtSource || '') + cssModule.appendSources.join("\n");
        }
        return cssModule.builtSource;
    }
    _extractCssFromJs(jsModule, cssModule) {
        cssModule.appendSources = cssModule.appendSources || [];
        const extracted = {};
        const extractRec = (dependencies) => {
            if (dependencies) {
                for (let x of dependencies) {
                    if (x.builtType === 'css') {
                        if (!extracted[x.id]) {
                            extracted[x.id] = true;
                            cssModule.appendSources.push(this._bundleCssModule(x));
                        }
                    }
                    else {
                        extractRec(x.dependencies);
                    }
                }
            }
        };
        extractRec(jsModule.dependencies);
        jsModule.cssExtracted = true;
    }
    _transformCssInJs(jsModule) {
        const transformed = {};
        const transformRec = (dependencies) => {
            if (dependencies) {
                for (let x of dependencies) {
                    if (x.builtType === 'css') {
                        this._transformCssModuleToInjectCssScript(x);
                    }
                    else if (x.builtType === 'js') {
                        transformRec(x.dependencies);
                    }
                    else {
                        // ignore other builtTypes
                    }
                }
            }
        };
        transformRec(jsModule.dependencies);
    }
    _transformCssModuleToInjectCssScript(module) {
        const injectStyleModule = this._getInjectStyleModule();
        const styleText = JSON.stringify(module.builtSource);
        module.builtSource = `module.exports = __require_module__(${injectStyleModule.id}/*${injectStyleModule.name}*/)(${styleText})`;
        module.builtType = 'js';
        module.dependencies.push(injectStyleModule);
    }
    _getInjectStyleModule() {
        const injectStyleModuleName = '__inject_style__';
        return this._addInternalModule(injectStyleModuleName, getInjectStyleModuleSource);
    }
    _addInternalModule(moduleName, getModuleSource) {
        const moduleFile = 'internal://' + moduleName;
        if (moduleFile in this._modulesByFullPathName) {
            return this._modulesByFullPathName[moduleFile];
        }
        const module = new nspack_module_1.default({
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
        }, this);
        this._modules[module.id] = module;
        this._modulesByFullPathName[moduleFile] = module;
        return module;
    }
    _transCompile(jsCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const babelConfig = yield this._loadBabelRc();
            try {
                const res = babel.transform(jsCode, babelConfig);
                return `(function(__nspack__){${res.code};return __nspack__.r})({});`;
            }
            catch (e) {
                // todo...
                fs.writeFileSync(path.join(this._config.outputBase, ".last-babel-failed.js"), jsCode);
                throw e;
            }
        });
    }
    _loadBabelRc() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._babelrcObj === undefined) {
                this._babelrcObj = yield this._loadBabelRcNoCache();
            }
            return this._babelrcObj;
        });
    }
    _loadBabelRcNoCache() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._config.babelrc === false) {
                return false;
            }
            else if (typeof this._config.babelrc === 'string') {
                this._babelrcFile = this._config.babelrc;
                return yield utils_1.tryReadJsonFileContent(this._babelrcFile);
            }
            else if (this._config.babelrc === true || this._config.babelrc === undefined) {
                this._babelrcFile = '.babelrc';
                return this._config.babelrc = yield utils_1.tryReadJsonFileContent(this._babelrcFile);
            }
            else {
                return this._config.babelrc;
            }
        });
    }
    _outputManifests() {
        return __awaiter(this, void 0, void 0, function* () {
            const manifestsConfig = this._config.outputHashManifests;
            if (!manifestsConfig || (!manifestsConfig.json && !manifestsConfig.jsonp)) {
                return;
            }
            const manifests = this._buildManifests();
            yield this._applyHook('buildManifests', manifests);
            const manifestsJson = JSON.stringify(manifests);
            const jobs = [];
            if (manifestsConfig.json) {
                jobs.push(this._writeOutputFile(manifestsConfig.json, manifestsJson));
            }
            if (manifestsConfig.jsonp) {
                const jsonpCb = manifestsConfig.jsonpCallback || 'nspackManifestsJsonpCallback';
                jobs.push(this._writeOutputFile(manifestsConfig.jsonp, `${jsonpCb}(${manifestsJson})`));
            }
            yield Promise.all(jobs);
        });
    }
    _buildManifests() {
        const manifests = {};
        for (let m of Object.values(this._entries)) {
            const bundle = m.bundle;
            if (bundle.script.valid) {
                manifests[m.name + '.js'] = bundle.script.hash;
            }
            if (bundle.style.valid) {
                manifests[m.name + '.css'] = bundle.style.hash;
            }
            if (bundle.html.valid) {
                manifests[m.name + '.html'] = bundle.html.hash;
            }
        }
        return manifests;
    }
    _buildOutputName({ type, name, hash }) {
        const defaultOutputConfig = this._config.output['*'];
        const moduleOutputConfig = this._config.output[name] || defaultOutputConfig;
        const template = moduleOutputConfig[type] || defaultOutputConfig[type];
        return template.replace('[name]', name).replace('[hash]', hash);
    }
    _hash(content) {
        return md5(content || '').substring(0, this._config.hashLength);
    }
    _resolveEntryFile(filename) {
        return path.resolve(this._config.entryBase, filename);
    }
    _resolveOutputFile(filename) {
        return path.resolve(this._config.outputBase, filename);
    }
    _outputFile(outputName, content, entryModule, outputType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (content === undefined) {
                return;
            }
            const filePath = this._resolveOutputFile(outputName);
            const fileDir = path.dirname(filePath);
            const outputFile = {
                packer: this,
                entryModule,
                outputName, outputType,
                filePath, fileDir,
                content,
                write(options = {}) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const t = options ? extend({}, this, options) : this;
                        yield t.packer._mkdirIfNotExists(t.fileDir);
                        yield t.packer._callFsOpAsync('writeFile', t.filePath, t.content, 'utf8');
                    });
                }
            };
            if ((yield this._applyHook("outputFile", outputFile)) === false) {
                return;
            }
            yield outputFile.write();
        });
    }
    _writeOutputFile(filename, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = this._resolveOutputFile(filename);
            yield this._mkdirIfNotExists(path.dirname(filePath));
            yield this._callFsOpAsync('writeFile', filePath, content, 'utf8');
        });
    }
    _resolveModule(moduleName, baseDir, resolvingParents) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debugLevel > 0 && debug(`resolving %o in %o`, moduleName, baseDir);
            if (moduleName in this._config.externals) {
                return this._externalModules[moduleName];
            }
            const module = yield this._addModuleIfNotExists({
                name: moduleName,
                baseDir: baseDir,
                resolvingParents,
            });
            yield this._processModule(module);
            return module;
        });
    }
    _processModule(module) {
        return __awaiter(this, void 0, void 0, function* () {
            if (module.processed && !module.needUpdate) {
                this.debugLevel > 3 && debug("ignore module %o in %o (processed and do not need update)", module.name, module.baseDir || module.fullFileDirName);
                return module;
            }
            if (module.processing) {
                return module.processing;
            }
            const processing = module.processing = (() => __awaiter(this, void 0, void 0, function* () {
                this.debugLevel > 1 && debug("processing module %o in %o", module.name, module.baseDir || module.fullFileDirName);
                yield module.loadSource();
                const processors = this._config.moduleProcessors[module.type];
                if (processors) {
                    for (let processor of processors) {
                        yield processor.call(processor, module, this);
                    }
                }
                else {
                    throw new Error(`No processor for ${module.type} when processing file ${module.fullPathName}`);
                }
                module.processed = true;
                module.needUpdate = false;
                return module;
            }))();
            yield processing;
            module.processing = false;
            return module;
        });
    }
    _addModuleIfNotExists(module) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!('fullPathName' in module)) {
                if (module.isInternal || module.isExternal) {
                    module.fullPathName = module.file;
                    if (!('relativePath' in module)) {
                        module.relativePath = module.file;
                    }
                }
                else {
                    module.fullPathName = yield this._resolveModuleFullPathName(module.name, module.baseDir);
                }
            }
            if (!module.fullPathName) {
                throw new Error(`Failed to resolve module '${module.name}' in directory '${module.baseDir}'` + (module.resolvingParents || ''));
            }
            if (module.fullPathName in this._modulesByFullPathName) {
                this._modulesByFullPathName[module.fullPathName].fresh = false;
                return this._modulesByFullPathName[module.fullPathName];
            }
            module = new nspack_module_1.default(module, this);
            module.fresh = true;
            module.id = this._nextModuleId++;
            this._modules[module.id] = module;
            this._modulesByFullPathName[module.fullPathName] = module;
            return module;
        });
    }
    _resolveModuleFullPathName(moduleName, baseDir) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (moduleName[0] === '@'){
            //     return await this._nodeModuleResolver.resolveModuleFullPathName(
            //         path.join(this._config.entryBase, moduleName.substring(1)), 
            //         ''
            //     )
            // }
            return yield this._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir);
        });
    }
    debugDumpAllModules() {
        debug("all modules: ");
        for (let i = 0, n = this._nextModuleId; i < n; i++) {
            let m = this._modules[i];
            if (m) {
                debug("\t[%o]\t%o\t%o\t%o (%o)", i, m.type, m.builtType, m.name, m.fullPathName);
            }
        }
    }
    debugDumpAllEntriesOutputs() {
        debug("Done build. Spent %s(s)", (this.buildSpentTimeMs / 1000).toFixed(3));
        for (let entryModule of Object.values(this._entries)) {
            debug("\t%o:", entryModule.name);
            debug("\t\t%o: %o", entryModule.bundle.script.outputName, entryModule.bundle.script.hash);
            debug("\t\t%o: %o", entryModule.bundle.style.outputName, entryModule.bundle.style.hash);
            debug("\t\t%o: %o", entryModule.bundle.html.outputName, entryModule.bundle.html.hash);
        }
    }
    _callFsOpAsync(op, ...args) {
        return new Promise((resolve, reject) => {
            const cb = (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            };
            this._fs[op].apply(this._fs, args.concat([cb]));
        });
    }
    _mkdirIfNotExists(fileDir) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this._fs.stat(fileDir, (err, st) => {
                    if (err) {
                        this._fs.mkdir(fileDir, (err) => {
                            if (err && err.code !== 'EEXIST') {
                                reject(err);
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                    else {
                        if (!st || !st.isDirectory()) {
                            reject(new Error(`Invalid path/directory: ${fileDir}`));
                        }
                        else {
                            resolve();
                        }
                    }
                });
            });
        });
    }
    _applyHook(hookName, ...args) {
        const hook = this._config.hooks[hookName];
        if (hook) {
            return hook.apply(hook, args);
        }
    }
    _checkModulesUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(Object.values(this._modules)
                .map(m => m._checkIfNeedUpdate0()));
            let hasOneUpdated = false;
            for (let m of Object.values(this._entries)) {
                hasOneUpdated = hasOneUpdated || m._checkIfNeedUpdate1();
            }
            return hasOneUpdated;
        });
    }
}
exports.default = NSPack;
function buildJsBundleCode(modules, entryModuleId = 0) {
    const modulesCodes = [];
    for (let i = 0, n = modules.length; i < n; i++) {
        const module = modules[i];
        if (module) {
            modulesCodes.push("\n");
            modulesCodes.push(wrapModuleCode(module.id, module.source, (module.file || module.relativePath || module.name)));
            modulesCodes.push(",");
        }
        else {
            modulesCodes.push(",");
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
`;
}
function wrapModuleCode(moduleId, source, moduleFile) {
    return `
// module#${moduleId}: file: ${moduleFile}
function(__require_module__, module, exports){
    ${source}
}
`;
}
function newArray(len, defaultValue) {
    const a = new Array(len);
    for (let i = 0; i < len; i++) {
        a[i] = defaultValue;
    }
    return a;
}
function getInjectStyleModuleSource() {
    return `
module.exports = function (styleCode){
    if (styleCode){
        var styleTag = document.createElement("style")
        styleTag.innerText = styleCode
        ~(document.getElementsByTagName('head')[0] || document.documentElement).appendChild(styleTag)
    }
    return styleCode
}`;
}
function wrapLibrary({ libName, libTarget, amdExecOnDef }, code) {
    // debug("wrapLibray: ", {libName, libTarget, amdExecOnDef})
    // no library, just return
    if (!libTarget) {
        return code;
    }
    if (libTarget === 'amd') {
        if (libName) {
            if (!amdExecOnDef) {
                return `
define(${JSON.stringify(libName)}, [], function(){
    return ${code}
})
`;
            }
            else {
                return `
(function(f,u){
    var m,e;
    try{m = f()}catch(x){e=x}; 
    define(${JSON.stringify(libName)}, [], function(){if(e !== u){throw e} return m})
    if(e !== u){throw e}
})(function(){
    return ${code}
})
`;
            }
        }
        else {
            return `
define([], function(){
    return ${code}
})
`;
        }
    }
    else if (libTarget === 'umd') {
        if (libName) {
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
`;
        }
        else {
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
`;
        }
    }
    else if (libTarget === 'commonjs') {
        return 'module.exports = ' + code;
    }
    else {
        throw new Error(`Unknown libTarget(${libTarget}) when processing ${libName}`);
    }
}
function noop(...args) { }
