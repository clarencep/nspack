"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var node_module_resolver_1 = require("./node-module-resolver");
var nspack_built_result_1 = require("./nspack-built-result");
var nspack_module_1 = require("./nspack-module");
var utils_1 = require("./utils");
var nspacker_config_1 = require("./nspacker-config");
var babel = require('babel-core');
var md5 = require('md5');
var debug = require('debug')('nspack');
var extend = Object.assign;
var NSPack = /** @class */ (function () {
    function NSPack(config) {
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
    NSPack.prototype.build = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hasUpdated, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this._isBuilding) {
                            throw new Error("The building process already started!");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 8, 9]);
                        this._isBuilding = true;
                        if (!(this._builtTimes > 0)) return [3 /*break*/, 3];
                        this.debugLevel > 10 && debug("checking if module updated");
                        return [4 /*yield*/, this._checkModulesUpdates()];
                    case 2:
                        hasUpdated = _a.sent();
                        if (!hasUpdated) {
                            this.debugLevel > 10 && debug("modules not updated, so don't build");
                            this._result = new nspack_built_result_1.default(this);
                            this._result.updated = false;
                            this._isBuilding = false;
                            return [2 /*return*/, this._result];
                        }
                        this.debugLevel > 10 && debug("modules updated, so do build");
                        this._result = new nspack_built_result_1.default(this);
                        _a.label = 3;
                    case 3:
                        this._builtTimes++;
                        this.buildBeginAt = new Date();
                        return [4 /*yield*/, this._resolveExternalModules()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this._buildFromEntries()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this._outputManifests()];
                    case 6:
                        _a.sent();
                        this._result.updated = true;
                        this.buildEndAt = new Date();
                        this.buildSpentTimeMs = +this.buildEndAt - (+this.buildBeginAt);
                        this.debugLevel > 1 && this.debugDumpAllModules();
                        this.debugLevel > 0 && this.debugDumpAllEntriesOutputs();
                        this._isBuilding = false;
                        return [2 /*return*/, this._result];
                    case 7:
                        e_1 = _a.sent();
                        this._isBuilding = false;
                        console.error(e_1);
                        throw e_1;
                    case 8:
                        this._isBuilding = false;
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype.watch = function (doneCb, beginBuildCb) {
        if (doneCb === void 0) { doneCb = noop; }
        if (beginBuildCb === void 0) { beginBuildCb = noop; }
        return __awaiter(this, void 0, void 0, function () {
            var lastUpdated, res, beginTime, e_2, spentTimeMs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        beginTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 9]);
                        if (!(lastUpdated || !res)) return [3 /*break*/, 3];
                        if (!res) {
                            this.debugLevel > 1 && debug("begin first nspack...");
                        }
                        else {
                            this.debugLevel > 1 && debug("watching for changes...");
                        }
                        return [4 /*yield*/, beginBuildCb(this)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        lastUpdated = false;
                        return [4 /*yield*/, this.incrementBuild()];
                    case 4:
                        res = _a.sent();
                        lastUpdated = (res.buildTimes <= 1 || res.updated);
                        if (!lastUpdated) return [3 /*break*/, 6];
                        return [4 /*yield*/, doneCb(null, res)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2 = _a.sent();
                        return [4 /*yield*/, doneCb(e_2, null)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        spentTimeMs = Date.now() - beginTime;
                        return [4 /*yield*/, utils_1.sleep(Math.max(1, this._config.watchInterval - spentTimeMs))];
                    case 10:
                        _a.sent();
                        _a.label = 11;
                    case 11: return [3 /*break*/, 0];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype.incrementBuild = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.build()];
            });
        });
    };
    NSPack.prototype.addModule = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this._addModuleIfNotExists(module)
                        .then(function (m) { return _this._processModule(m); })];
            });
        });
    };
    NSPack.prototype.addOrUpdateModule = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var m;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._addModuleIfNotExists(module)];
                    case 1:
                        m = _a.sent();
                        if (!m.fresh) {
                            extend(m, module);
                        }
                        return [2 /*return*/, this._processModule(m)];
                }
            });
        });
    };
    NSPack.prototype._resolveExternalModules = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var externalModules, jobs, _loop_1, this_1, _i, _a, moduleName;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        externalModules = this._config.externals;
                        if (!externalModules) {
                            return [2 /*return*/];
                        }
                        jobs = [];
                        _loop_1 = function (moduleName) {
                            jobs.push(this_1._addModuleIfNotExists({
                                name: moduleName,
                                baseDir: this_1._config.entryBase,
                                builtSource: "module.exports = " + externalModules[moduleName],
                                file: 'external://' + moduleName,
                                type: 'js',
                                builtType: 'js',
                                isExternal: true,
                                processed: true,
                            }).then(function (module) {
                                _this._externalModules[moduleName] = module;
                            }));
                        };
                        this_1 = this;
                        for (_i = 0, _a = Object.keys(externalModules); _i < _a.length; _i++) {
                            moduleName = _a[_i];
                            _loop_1(moduleName);
                        }
                        return [4 /*yield*/, Promise.all(jobs)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._buildFromEntries = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._buildFromEntries_serial()
                        // await this._buildFromEntries_parrell()
                    ];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._buildFromEntries_serial = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils_1.serial(Object.values(this._entries)
                            .filter(function (x) { return !x.processed || x.needUpdate; })
                            .map(function (module) {
                            return function () { return _this._buildEntryModule(module)
                                .then(function (module) {
                                module.processed = true;
                                module.needUpdate = false;
                                _this._result.modules[module.name] = module;
                            }); };
                        }))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._buildFromEntries_parrell = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils_1.parallelLimit(Object.values(this._entries)
                            .filter(function (x) { return !x.processed || x.needUpdate; })
                            .map(function (module) {
                            return function () { return _this._buildEntryModule(module)
                                .then(function (module) {
                                module.processed = true;
                                module.needUpdate = false;
                                _this._result.modules[module.name] = module;
                            }); };
                        }), 
                        /*limit=*/ 10)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._buildEntryModule = function (entryModule) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var baseDir, resolvingJsModule, resolvingCssModule, _a, jsModule, cssModule, _b, _c, html, htmlValid, htmlHash, htmlOutputName;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.debugLevel > 0 && debug("building entry module %o...", entryModule.name);
                        baseDir = this._config.entryBase;
                        entryModule.entry = { name: entryModule.name, baseDir: baseDir };
                        resolvingJsModule = entryModule.loadJsSource()
                            .then(function (_a) {
                            var sourceCode = _a.sourceCode, filePath = _a.filePath;
                            return _this._addModuleIfNotExists({
                                name: entryModule.name + '.js',
                                baseDir: baseDir,
                                fullPathName: filePath || path.join(baseDir, entryModule.name + '.js'),
                                source: sourceCode,
                                libName: entryModule.libName === undefined ? entryModule.name.replace(/\\/g, '/') : entryModule.libName,
                                libTarget: entryModule.libTarget,
                                amdExecOnDef: entryModule.amdExecOnDef === undefined ? true : !!entryModule.amdExecOnDef,
                                isInternal: !filePath || (!sourceCode && sourceCode !== ''),
                            });
                        })
                            .then(function (module) { return _this._processModule(module); });
                        resolvingCssModule = entryModule.loadCssSource()
                            .catch(function (e) {
                            if (!entryModule.ignoreMissingCss) {
                                throw e;
                            }
                            return { sourceCode: null, filePath: null };
                        })
                            .then(function (_a) {
                            var sourceCode = _a.sourceCode, filePath = _a.filePath;
                            return _this._addModuleIfNotExists({
                                name: entryModule.name + '.css',
                                baseDir: baseDir,
                                fullPathName: filePath || path.join(baseDir, entryModule.name + '.css'),
                                source: sourceCode,
                                isInternal: !filePath || (!sourceCode && sourceCode !== ''),
                            });
                        })
                            .then(function (module) { return _this._processModule(module); });
                        return [4 /*yield*/, Promise.all([resolvingJsModule, resolvingCssModule])
                            // // debug:
                            // if (entryModule.name === 'about'){
                            //     console.log('=============about: ', entryModule)
                            // }
                        ];
                    case 1:
                        _a = _d.sent(), jsModule = _a[0], cssModule = _a[1];
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
                        _b = jsModule;
                        if (!jsModule.valid) return [3 /*break*/, 3];
                        return [4 /*yield*/, this._bundleJsModule(jsModule)];
                    case 2:
                        _c = _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _c = undefined;
                        _d.label = 4;
                    case 4:
                        _b.outputSource = _c;
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
                            scriptsTags: jsModule.outputSource ? "<script src=\"/" + jsModule.outputName + "\"></script>" : '',
                            style: cssModule,
                            stylesTags: cssModule.outputSource ? "<link rel=\"stylesheet\" href=\"/" + cssModule.outputName + "\" >" : '',
                            html: null,
                        };
                        return [4 /*yield*/, entryModule.loadHtmlSource()];
                    case 5:
                        html = _d.sent();
                        htmlValid = !!(html && (html.sourceCode || html.sourceCode === ''));
                        htmlHash = htmlValid ? this._hash(html) : '';
                        htmlOutputName = htmlValid ? this._buildOutputName({ name: entryModule.name, hash: htmlHash, type: 'html' }) : '';
                        entryModule.bundle.html = {
                            valid: htmlValid,
                            outputSource: html.sourceCode,
                            outputSize: html && html.sourceCode ? html.sourceCode.length : 0,
                            hash: htmlHash,
                            outputName: htmlOutputName,
                        };
                        return [4 /*yield*/, Promise.all([
                                this._outputFile(jsModule.outputName, jsModule.outputSource, entryModule, 'js'),
                                this._outputFile(cssModule.outputName, cssModule.outputSource, entryModule, 'css'),
                                this._outputFile(htmlOutputName, html, entryModule, 'html'),
                            ])];
                    case 6:
                        _d.sent();
                        entryModule.processed = true;
                        return [2 /*return*/, entryModule];
                }
            });
        });
    };
    NSPack.prototype._bundleJsModule = function (jsModule) {
        return __awaiter(this, void 0, void 0, function () {
            var bundled, bundleRec, bundledJsCode, transpiledCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bundled = newArray(this._nextModuleId);
                        bundleRec = function (module) {
                            if (!bundled[module.id]) {
                                bundled[module.id] = {
                                    id: module.id,
                                    name: module.name,
                                    file: module.relativePath,
                                    source: module.builtSource,
                                };
                                if (module.dependencies && module.dependencies.length > 0) {
                                    for (var _i = 0, _a = module.dependencies; _i < _a.length; _i++) {
                                        var x = _a[_i];
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
                                            throw new Error("Unknown builtType: " + x.builtType + " when bundling " + x.fullPathName + " of " + jsModule.fullPathName);
                                        }
                                    }
                                }
                            }
                        };
                        bundleRec(jsModule);
                        bundledJsCode = buildJsBundleCode(bundled, jsModule.id);
                        return [4 /*yield*/, this._transCompile(bundledJsCode)];
                    case 1:
                        transpiledCode = _a.sent();
                        return [2 /*return*/, wrapLibrary(jsModule, transpiledCode)];
                }
            });
        });
    };
    NSPack.prototype._bundleCssModule = function (cssModule) {
        if (cssModule.appendSources && cssModule.appendSources.length > 0) {
            return (cssModule.builtSource || '') + cssModule.appendSources.join("\n");
        }
        return cssModule.builtSource;
    };
    NSPack.prototype._extractCssFromJs = function (jsModule, cssModule) {
        var _this = this;
        cssModule.appendSources = cssModule.appendSources || [];
        var extracted = {};
        var extractRec = function (dependencies) {
            if (dependencies) {
                for (var _i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
                    var x = dependencies_1[_i];
                    if (x.builtType === 'css') {
                        if (!extracted[x.id]) {
                            extracted[x.id] = true;
                            cssModule.appendSources.push(_this._bundleCssModule(x));
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
    };
    NSPack.prototype._transformCssInJs = function (jsModule) {
        var _this = this;
        var transformed = {};
        var transformRec = function (dependencies) {
            if (dependencies) {
                for (var _i = 0, dependencies_2 = dependencies; _i < dependencies_2.length; _i++) {
                    var x = dependencies_2[_i];
                    if (x.builtType === 'css') {
                        _this._transformCssModuleToInjectCssScript(x);
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
    };
    NSPack.prototype._transformCssModuleToInjectCssScript = function (module) {
        var injectStyleModule = this._getInjectStyleModule();
        var styleText = JSON.stringify(module.builtSource);
        module.builtSource = "module.exports = __require_module__(" + injectStyleModule.id + "/*" + injectStyleModule.name + "*/)(" + styleText + ")";
        module.builtType = 'js';
        module.dependencies.push(injectStyleModule);
    };
    NSPack.prototype._getInjectStyleModule = function () {
        var injectStyleModuleName = '__inject_style__';
        return this._addInternalModule(injectStyleModuleName, getInjectStyleModuleSource);
    };
    NSPack.prototype._addInternalModule = function (moduleName, getModuleSource) {
        var moduleFile = 'internal://' + moduleName;
        if (moduleFile in this._modulesByFullPathName) {
            return this._modulesByFullPathName[moduleFile];
        }
        var module = new nspack_module_1.default({
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
    };
    NSPack.prototype._transCompile = function (jsCode) {
        return __awaiter(this, void 0, void 0, function () {
            var babelConfig, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._loadBabelRc()];
                    case 1:
                        babelConfig = _a.sent();
                        try {
                            res = babel.transform(jsCode, babelConfig);
                            return [2 /*return*/, "(function(__nspack__){" + res.code + ";return __nspack__.r})({});"];
                        }
                        catch (e) {
                            // todo...
                            fs.writeFileSync(path.join(this._config.outputBase, ".last-babel-failed.js"), jsCode);
                            throw e;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._loadBabelRc = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(this._babelrcObj === undefined)) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this._loadBabelRcNoCache()];
                    case 1:
                        _a._babelrcObj = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, this._babelrcObj];
                }
            });
        });
    };
    NSPack.prototype._loadBabelRcNoCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(this._config.babelrc === false)) return [3 /*break*/, 1];
                        return [2 /*return*/, false];
                    case 1:
                        if (!(typeof this._config.babelrc === 'string')) return [3 /*break*/, 3];
                        this._babelrcFile = this._config.babelrc;
                        return [4 /*yield*/, utils_1.tryReadJsonFileContent(this._babelrcFile)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3:
                        if (!(this._config.babelrc === true || this._config.babelrc === undefined)) return [3 /*break*/, 5];
                        this._babelrcFile = '.babelrc';
                        _a = this._config;
                        return [4 /*yield*/, utils_1.tryReadJsonFileContent(this._babelrcFile)];
                    case 4: return [2 /*return*/, _a.babelrc = _b.sent()];
                    case 5: return [2 /*return*/, this._config.babelrc];
                }
            });
        });
    };
    NSPack.prototype._outputManifests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var manifestsConfig, manifests, manifestsJson, jobs, jsonpCb;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        manifestsConfig = this._config.outputHashManifests;
                        if (!manifestsConfig || (!manifestsConfig.json && !manifestsConfig.jsonp)) {
                            return [2 /*return*/];
                        }
                        manifests = this._buildManifests();
                        return [4 /*yield*/, this._applyHook('buildManifests', manifests)];
                    case 1:
                        _a.sent();
                        manifestsJson = JSON.stringify(manifests);
                        jobs = [];
                        if (manifestsConfig.json) {
                            jobs.push(this._writeOutputFile(manifestsConfig.json, manifestsJson));
                        }
                        if (manifestsConfig.jsonp) {
                            jsonpCb = manifestsConfig.jsonpCallback || 'nspackManifestsJsonpCallback';
                            jobs.push(this._writeOutputFile(manifestsConfig.jsonp, jsonpCb + "(" + manifestsJson + ")"));
                        }
                        return [4 /*yield*/, Promise.all(jobs)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._buildManifests = function () {
        var manifests = {};
        for (var _i = 0, _a = Object.values(this._entries); _i < _a.length; _i++) {
            var m = _a[_i];
            var bundle = m.bundle;
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
    };
    NSPack.prototype._buildOutputName = function (_a) {
        var type = _a.type, name = _a.name, hash = _a.hash;
        var defaultOutputConfig = this._config.output['*'];
        var moduleOutputConfig = this._config.output[name] || defaultOutputConfig;
        var template = moduleOutputConfig[type] || defaultOutputConfig[type];
        return template.replace('[name]', name).replace('[hash]', hash);
    };
    NSPack.prototype._hash = function (content) {
        return md5(content || '').substring(0, this._config.hashLength);
    };
    NSPack.prototype._resolveEntryFile = function (filename) {
        return path.resolve(this._config.entryBase, filename);
    };
    NSPack.prototype._resolveOutputFile = function (filename) {
        return path.resolve(this._config.outputBase, filename);
    };
    NSPack.prototype._outputFile = function (outputName, content, entryModule, outputType) {
        return __awaiter(this, void 0, void 0, function () {
            var filePath, fileDir, outputFile;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (content === undefined) {
                            return [2 /*return*/];
                        }
                        filePath = this._resolveOutputFile(outputName);
                        fileDir = path.dirname(filePath);
                        outputFile = {
                            packer: this,
                            entryModule: entryModule,
                            outputName: outputName, outputType: outputType,
                            filePath: filePath, fileDir: fileDir,
                            content: content,
                            write: function (options) {
                                if (options === void 0) { options = {}; }
                                return __awaiter(this, void 0, void 0, function () {
                                    var t;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                t = options ? extend({}, this, options) : this;
                                                return [4 /*yield*/, t.packer._mkdirIfNotExists(t.fileDir)];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, t.packer._callFsOpAsync('writeFile', t.filePath, t.content, 'utf8')];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                        };
                        return [4 /*yield*/, this._applyHook("outputFile", outputFile)];
                    case 1:
                        if ((_a.sent()) === false) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, outputFile.write()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._writeOutputFile = function (filename, content) {
        return __awaiter(this, void 0, void 0, function () {
            var filePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = this._resolveOutputFile(filename);
                        return [4 /*yield*/, this._mkdirIfNotExists(path.dirname(filePath))];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._callFsOpAsync('writeFile', filePath, content, 'utf8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    NSPack.prototype._resolveModule = function (moduleName, baseDir, resolvingParents) {
        return __awaiter(this, void 0, void 0, function () {
            var module;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.debugLevel > 0 && debug("resolving %o in %o", moduleName, baseDir);
                        if (moduleName in this._config.externals) {
                            return [2 /*return*/, this._externalModules[moduleName]];
                        }
                        return [4 /*yield*/, this._addModuleIfNotExists({
                                name: moduleName,
                                baseDir: baseDir,
                                resolvingParents: resolvingParents,
                            })];
                    case 1:
                        module = _a.sent();
                        return [4 /*yield*/, this._processModule(module)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, module];
                }
            });
        });
    };
    NSPack.prototype._processModule = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var processing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (module.processed && !module.needUpdate) {
                            this.debugLevel > 3 && debug("ignore module %o in %o (processed and do not need update)", module.name, module.baseDir || module.fullFileDirName);
                            return [2 /*return*/, module];
                        }
                        if (module.processing) {
                            return [2 /*return*/, module.processing];
                        }
                        processing = module.processing = (function () { return __awaiter(_this, void 0, void 0, function () {
                            var processors, _i, processors_1, processor;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        this.debugLevel > 1 && debug("processing module %o in %o", module.name, module.baseDir || module.fullFileDirName);
                                        return [4 /*yield*/, module.loadSource()];
                                    case 1:
                                        _a.sent();
                                        processors = this._config.moduleProcessors[module.type];
                                        if (!processors) return [3 /*break*/, 6];
                                        _i = 0, processors_1 = processors;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < processors_1.length)) return [3 /*break*/, 5];
                                        processor = processors_1[_i];
                                        return [4 /*yield*/, processor.call(processor, module, this)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [3 /*break*/, 7];
                                    case 6: throw new Error("No processor for " + module.type + " when processing file " + module.fullPathName);
                                    case 7:
                                        module.processed = true;
                                        module.needUpdate = false;
                                        return [2 /*return*/, module];
                                }
                            });
                        }); })();
                        return [4 /*yield*/, processing];
                    case 1:
                        _a.sent();
                        module.processing = false;
                        return [2 /*return*/, module];
                }
            });
        });
    };
    NSPack.prototype._addModuleIfNotExists = function (module) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!('fullPathName' in module)) return [3 /*break*/, 3];
                        if (!(module.isInternal || module.isExternal)) return [3 /*break*/, 1];
                        module.fullPathName = module.file;
                        if (!('relativePath' in module)) {
                            module.relativePath = module.file;
                        }
                        return [3 /*break*/, 3];
                    case 1:
                        _a = module;
                        return [4 /*yield*/, this._resolveModuleFullPathName(module.name, module.baseDir)];
                    case 2:
                        _a.fullPathName = _b.sent();
                        _b.label = 3;
                    case 3:
                        if (!module.fullPathName) {
                            throw new Error("Failed to resolve module '" + module.name + "' in directory '" + module.baseDir + "'" + (module.resolvingParents || ''));
                        }
                        if (module.fullPathName in this._modulesByFullPathName) {
                            this._modulesByFullPathName[module.fullPathName].fresh = false;
                            return [2 /*return*/, this._modulesByFullPathName[module.fullPathName]];
                        }
                        module = new nspack_module_1.default(module, this);
                        module.fresh = true;
                        module.id = this._nextModuleId++;
                        this._modules[module.id] = module;
                        this._modulesByFullPathName[module.fullPathName] = module;
                        return [2 /*return*/, module];
                }
            });
        });
    };
    NSPack.prototype._resolveModuleFullPathName = function (moduleName, baseDir) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir)];
                    case 1: 
                    // if (moduleName[0] === '@'){
                    //     return await this._nodeModuleResolver.resolveModuleFullPathName(
                    //         path.join(this._config.entryBase, moduleName.substring(1)), 
                    //         ''
                    //     )
                    // }
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    NSPack.prototype.debugDumpAllModules = function () {
        debug("all modules: ");
        for (var i = 0, n = this._nextModuleId; i < n; i++) {
            var m = this._modules[i];
            if (m) {
                debug("\t[%o]\t%o\t%o\t%o (%o)", i, m.type, m.builtType, m.name, m.fullPathName);
            }
        }
    };
    NSPack.prototype.debugDumpAllEntriesOutputs = function () {
        debug("Done build. Spent %s(s)", (this.buildSpentTimeMs / 1000).toFixed(3));
        for (var _i = 0, _a = Object.values(this._entries); _i < _a.length; _i++) {
            var entryModule = _a[_i];
            debug("\t%o:", entryModule.name);
            debug("\t\t%o: %o", entryModule.bundle.script.outputName, entryModule.bundle.script.hash);
            debug("\t\t%o: %o", entryModule.bundle.style.outputName, entryModule.bundle.style.hash);
            debug("\t\t%o: %o", entryModule.bundle.html.outputName, entryModule.bundle.html.hash);
        }
    };
    NSPack.prototype._callFsOpAsync = function (op) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            var cb = function (err, res) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            };
            _this._fs[op].apply(_this._fs, args.concat([cb]));
        });
    };
    NSPack.prototype._mkdirIfNotExists = function (fileDir) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this._fs.stat(fileDir, function (err, st) {
                            if (err) {
                                _this._fs.mkdir(fileDir, function (err) {
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
                                    reject(new Error("Invalid path/directory: " + fileDir));
                                }
                                else {
                                    resolve();
                                }
                            }
                        });
                    })];
            });
        });
    };
    NSPack.prototype._applyHook = function (hookName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var hook = this._config.hooks[hookName];
        if (hook) {
            return hook.apply(hook, args);
        }
    };
    NSPack.prototype._checkModulesUpdates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hasOneUpdated, _i, _a, m;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all(Object.values(this._modules)
                            .map(function (m) { return m._checkIfNeedUpdate0(); }))];
                    case 1:
                        _b.sent();
                        hasOneUpdated = false;
                        for (_i = 0, _a = Object.values(this._entries); _i < _a.length; _i++) {
                            m = _a[_i];
                            hasOneUpdated = hasOneUpdated || m._checkIfNeedUpdate1();
                        }
                        return [2 /*return*/, hasOneUpdated];
                }
            });
        });
    };
    return NSPack;
}());
exports.default = NSPack;
function makeSourceFileReaderFunc(filepath, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    return function () {
        return utils_1.readFile(filepath, encoding)
            .then(function (data) { return ({ filePath: filepath, sourceCode: data }); });
    };
}
function buildJsBundleCode(modules, entryModuleId) {
    if (entryModuleId === void 0) { entryModuleId = 0; }
    var modulesCodes = [];
    for (var i = 0, n = modules.length; i < n; i++) {
        var module_1 = modules[i];
        if (module_1) {
            modulesCodes.push("\n");
            modulesCodes.push(wrapModuleCode(module_1.id, module_1.source, (module_1.file || module_1.relativePath || module_1.name)));
            modulesCodes.push(",");
        }
        else {
            modulesCodes.push(",");
        }
    }
    return "\n__nspack__.r = (function(modules){\n    var required = {};\n    var require = function(moduleId){\n        var m = required[moduleId];\n        if (!m){\n            m = required[moduleId] = {exports:{}};\n            modules[moduleId](require, m, m.exports);\n        }\n    \n        return m.exports;\n    };\n    return require(" + entryModuleId + ");\n})([" + modulesCodes.join("") + "]);\n\nfunction __extract_default__(module){\n    return module.__esModule ? module.default : module\n}\n\nfunction __set_esModule_flag__(exports){\n    exports.__esModule = true\n}\n";
}
function wrapModuleCode(moduleId, source, moduleFile) {
    return "\n// module#" + moduleId + ": file: " + moduleFile + "\nfunction(__require_module__, module, exports){\n    " + source + "\n}\n";
}
function newArray(len, defaultValue) {
    var a = new Array(len);
    for (var i = 0; i < len; i++) {
        a[i] = defaultValue;
    }
    return a;
}
function getInjectStyleModuleSource() {
    return "\nmodule.exports = function (styleCode){\n    if (styleCode){\n        var styleTag = document.createElement(\"style\")\n        styleTag.innerText = styleCode\n        ~(document.getElementsByTagName('head')[0] || document.documentElement).appendChild(styleTag)\n    }\n    return styleCode\n}";
}
function wrapLibrary(_a, code) {
    var libName = _a.libName, libTarget = _a.libTarget, amdExecOnDef = _a.amdExecOnDef;
    // debug("wrapLibray: ", {libName, libTarget, amdExecOnDef})
    // no library, just return
    if (!libTarget) {
        return code;
    }
    if (libTarget === 'amd') {
        if (libName) {
            if (!amdExecOnDef) {
                return "\ndefine(" + JSON.stringify(libName) + ", [], function(){\n    return " + code + "\n})\n";
            }
            else {
                return "\n(function(f,u){\n    var m,e;\n    try{m = f()}catch(x){e=x}; \n    define(" + JSON.stringify(libName) + ", [], function(){if(e !== u){throw e} return m})\n    if(e !== u){throw e}\n})(function(){\n    return " + code + "\n})\n";
            }
        }
        else {
            return "\ndefine([], function(){\n    return " + code + "\n})\n";
        }
    }
    else if (libTarget === 'umd') {
        if (libName) {
            return "\n(function (root, moduleName, moduleDef, undefined) {\n    if (typeof exports === 'object' && typeof module === 'object')\n        module.exports = moduleDef()\n    else if (typeof define === 'function' && define.amd)\n        " + (amdExecOnDef
                ? '{var m, e; try{m = moduleDef()}catch(x){e=x} define(moduleName, [], function(){if(e !== undefined){throw e} return m})} if(e !== undefined){throw e}'
                : 'define(moduleName, [], moduleDef)') + "\n    else if (typeof exports === 'object')\n        exports[moduleName] = moduleDef()\n    else\n        root[moduleName] = moduleDef()\n})(this, " + JSON.stringify(libName) + ", function(){\n    return " + code + "\n})\n";
        }
        else {
            return "\n(function (root, moduleDef, undefined) {\n    if (typeof exports === 'object' && typeof module === 'object')\n        module.exports = moduleDef()\n    else if (typeof define === 'function' && define.amd)\n        " + (amdExecOnDef
                ? '{var m, e; try{m = moduleDef()}catch(x){e=x}; define([], function(){if(e !== undefined){throw e} return m})} if(e !== undefined){throw e}'
                : 'define([], moduleDef)') + "\n    else if (typeof exports === 'object')\n        exports['return'] = moduleDef()\n    else\n        root.returnExports = moduleDef()\n})(this, " + JSON.stringify(libName) + ", function(){\n    return " + code + "\n})\n";
        }
    }
    else if (libTarget === 'commonjs') {
        return 'module.exports = ' + code;
    }
    else {
        throw new Error("Unknown libTarget(" + libTarget + ") when processing " + libName);
    }
}
function noop() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
}
