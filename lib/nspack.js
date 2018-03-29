var regeneratorRuntime = require("regenerator-runtime");
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');
var path = require('path');
var md5 = require('md5');
var cb2p = require('./cb2p');
var babel = require('babel-core');
var debug = require('debug')('nspack');

var defaultModuleProcessors = require('./nspack-default-processors');

var NodeModuleResolver = require('./node-module-resolver');
var NSPackBuiltResult = require('./nspack-built-result');
var NSPackModule = require('./nspack-module');
var NSPackEntryModule = require('./nspack-entry-module');

var _require = require('./utils'),
    sleep = _require.sleep,
    tryFStat = _require.tryFStat,
    tryReadJsonFileContent = _require.tryReadJsonFileContent,
    readFile = _require.readFile;

var extend = Object.assign;

module.exports = NSPack;

extend(module.exports, {
    hooks: {
        OutputUglifier: require('./nspack-hook-output-uglifier')
    }
});

function NSPack(config) {
    if (!(this instanceof NSPack)) {
        return new NSPack(config).build();
    }

    this._config = sanitizeConfig.call(this, config);
    this.debugLevel = this._config.debugLevel;
    this._fs = this._config.fs || fs;

    this._builtTimes = 0;
    this._nextModuleId = 1;
    this._externalModules = {}; // moduleName => module
    this._modules = {}; // id => module
    this._modulesByFullPathName = {}; // fullPathName => module
    this._result = new NSPackBuiltResult(this);
    this._nodeModuleResolver = new NodeModuleResolver();
    return this;
}

extend(NSPack.prototype, {
    build: function build() {
        var _this = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            var hasUpdated;
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!_this._isBuilding) {
                                _context.next = 2;
                                break;
                            }

                            throw new Error('The building process already started!');

                        case 2:
                            _context.prev = 2;

                            _this._isBuilding = true;

                            if (!(_this._builtTimes > 0)) {
                                _context.next = 17;
                                break;
                            }

                            _this.debugLevel > 10 && debug("checking if module updated");
                            _context.next = 8;
                            return _this._checkModulesUpdates();

                        case 8:
                            hasUpdated = _context.sent;

                            if (hasUpdated) {
                                _context.next = 15;
                                break;
                            }

                            _this.debugLevel > 10 && debug("modules not updated, so don't build");
                            _this._result = new NSPackBuiltResult(_this);
                            _this._result.updated = false;
                            _this._isBuilding = false;
                            return _context.abrupt('return', _this._result);

                        case 15:

                            _this.debugLevel > 10 && debug("modules updated, so do build");
                            _this._result = new NSPackBuiltResult(_this);

                        case 17:

                            _this._builtTimes++;
                            _this.buildBeginAt = new Date();

                            _context.next = 21;
                            return _this._resolveExternalModules();

                        case 21:
                            _context.next = 23;
                            return _this._buildFromEntries();

                        case 23:
                            _context.next = 25;
                            return _this._outputManifests();

                        case 25:

                            _this._result.updated = true;
                            _this.buildEndAt = new Date();
                            _this.buildSpentTimeMs = +_this.buildEndAt - +_this.buildBeginAt;

                            _this.debugLevel > 1 && _this.debugDumpAllModules();
                            _this.debugLevel > 0 && _this.debugDumpAllEntriesOutputs();

                            _this._isBuilding = false;
                            return _context.abrupt('return', _this._result);

                        case 34:
                            _context.prev = 34;
                            _context.t0 = _context['catch'](2);

                            _this._isBuilding = false;
                            console.error(_context.t0);
                            throw _context.t0;

                        case 39:
                            _context.prev = 39;

                            _this._isBuilding = false;
                            return _context.finish(39);

                        case 42:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this, [[2, 34, 39, 42]]);
        }))();
    },
    watch: function watch() {
        var _this2 = this;

        var doneCb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : noop;
        var beginBuildCb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : noop;
        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            var lastUpdated, res, beginTime, spentTimeMs;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            lastUpdated = void 0, res = void 0;

                        case 1:
                            beginTime = Date.now();
                            _context2.prev = 2;

                            if (!(lastUpdated || !res)) {
                                _context2.next = 7;
                                break;
                            }

                            if (!res) {
                                _this2.debugLevel > 1 && debug("begin first nspack...");
                            } else {
                                _this2.debugLevel > 1 && debug("watching for changes...");
                            }

                            _context2.next = 7;
                            return beginBuildCb(_this2);

                        case 7:

                            lastUpdated = false;
                            _context2.next = 10;
                            return _this2.incrementBuild();

                        case 10:
                            res = _context2.sent;


                            lastUpdated = res.buildTimes <= 1 || res.updated;

                            if (!lastUpdated) {
                                _context2.next = 15;
                                break;
                            }

                            _context2.next = 15;
                            return doneCb(null, res);

                        case 15:
                            _context2.next = 21;
                            break;

                        case 17:
                            _context2.prev = 17;
                            _context2.t0 = _context2['catch'](2);
                            _context2.next = 21;
                            return doneCb(_context2.t0, null);

                        case 21:
                            spentTimeMs = Date.now() - beginTime;
                            _context2.next = 24;
                            return sleep(Math.max(1, _this2._config.watchInterval - spentTimeMs));

                        case 24:
                            _context2.next = 1;
                            break;

                        case 26:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this2, [[2, 17]]);
        }))();
    },
    incrementBuild: function incrementBuild() {
        var _this3 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            return _context3.abrupt('return', _this3.build());

                        case 1:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, _this3);
        }))();
    },
    addModule: function addModule(module) {
        var _this4 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            return _context4.abrupt('return', _this4._addModuleIfNotExists(module).then(function (m) {
                                return _this4._processModule(m);
                            }));

                        case 1:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, _this4);
        }))();
    },
    addOrUpdateModule: function addOrUpdateModule(module) {
        var _this5 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
            var m;
            return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                    switch (_context5.prev = _context5.next) {
                        case 0:
                            _context5.next = 2;
                            return _this5._addModuleIfNotExists(module);

                        case 2:
                            m = _context5.sent;

                            if (!m.fresh) {
                                extend(m, module);
                            }

                            return _context5.abrupt('return', _this5._processModule(m));

                        case 5:
                        case 'end':
                            return _context5.stop();
                    }
                }
            }, _callee5, _this5);
        }))();
    },
    _resolveExternalModules: function _resolveExternalModules() {
        var _this6 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
            var externalModules, jobs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _loop, _iterator, _step;

            return regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            externalModules = _this6._config.externals;

                            if (externalModules) {
                                _context6.next = 3;
                                break;
                            }

                            return _context6.abrupt('return');

                        case 3:
                            jobs = [];
                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context6.prev = 7;

                            _loop = function _loop() {
                                var moduleName = _step.value;

                                jobs.push(_this6._addModuleIfNotExists({
                                    name: moduleName,
                                    baseDir: _this6._config.entryBase,
                                    builtSource: 'module.exports = ' + externalModules[moduleName],
                                    file: 'external://' + moduleName,
                                    type: 'js',
                                    builtType: 'js',
                                    isExternal: true,
                                    processed: true
                                }).then(function (module) {
                                    _this6._externalModules[moduleName] = module;
                                }));
                            };

                            for (_iterator = Object.keys(externalModules)[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                _loop();
                            }

                            _context6.next = 16;
                            break;

                        case 12:
                            _context6.prev = 12;
                            _context6.t0 = _context6['catch'](7);
                            _didIteratorError = true;
                            _iteratorError = _context6.t0;

                        case 16:
                            _context6.prev = 16;
                            _context6.prev = 17;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }

                        case 19:
                            _context6.prev = 19;

                            if (!_didIteratorError) {
                                _context6.next = 22;
                                break;
                            }

                            throw _iteratorError;

                        case 22:
                            return _context6.finish(19);

                        case 23:
                            return _context6.finish(16);

                        case 24:
                            _context6.next = 26;
                            return Promise.all(jobs);

                        case 26:
                        case 'end':
                            return _context6.stop();
                    }
                }
            }, _callee6, _this6, [[7, 12, 16, 24], [17,, 19, 23]]);
        }))();
    },
    _buildFromEntries: function _buildFromEntries() {
        var _this7 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            _context7.next = 2;
                            return Promise.all(Object.values(_this7._config.entry).filter(function (x) {
                                return !x.processed || x.needUpdate;
                            }).map(function (module) {
                                return _this7._buildEntryModule(module).then(function (module) {
                                    module.processed = true;
                                    module.needUpdate = false;
                                    _this7._result.modules[module.name] = module;
                                });
                            }));

                        case 2:
                        case 'end':
                            return _context7.stop();
                    }
                }
            }, _callee7, _this7);
        }))();
    },
    _buildEntryModule: function _buildEntryModule(entryModule) {
        var _this8 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
            var baseDir, resolvingJsModule, resolvingCssModule, _ref3, _ref4, jsModule, cssModule, html, htmlValid, htmlHash, htmlOutputName;

            return regeneratorRuntime.wrap(function _callee8$(_context8) {
                while (1) {
                    switch (_context8.prev = _context8.next) {
                        case 0:
                            _this8.debugLevel > 0 && debug('building entry module %o...', entryModule.name);

                            baseDir = _this8._config.entryBase;

                            entryModule.entry = { name: entryModule.name, baseDir: baseDir };
                            resolvingJsModule = _this8._loadSource(entryModule.js(entryModule)).then(function (_ref) {
                                var sourceCode = _ref.sourceCode,
                                    filePath = _ref.filePath;
                                return _this8._addModuleIfNotExists({
                                    name: entryModule.name + '.js',
                                    baseDir: baseDir,
                                    fullPathName: filePath || path.join(baseDir, entryModule.name + '.js'),
                                    source: sourceCode,
                                    libName: entryModule.libName === undefined ? entryModule.name.replace(/\\/g, '/') : entryModule.libName,
                                    libTarget: entryModule.libTarget,
                                    amdExecOnDef: entryModule.amdExecOnDef === undefined ? true : !!entryModule.amdExecOnDef,
                                    isInternal: !filePath || !sourceCode && sourceCode !== ''
                                });
                            }).then(function (module) {
                                return _this8._processModule(module);
                            });
                            resolvingCssModule = _this8._loadSource(entryModule.css(entryModule)).catch(function (e) {
                                if (!entryModule.ignoreMissingCss) {
                                    throw e;
                                }

                                return {};
                            }).then(function (_ref2) {
                                var sourceCode = _ref2.sourceCode,
                                    filePath = _ref2.filePath;
                                return _this8._addModuleIfNotExists({
                                    name: entryModule.name + '.css',
                                    baseDir: baseDir,
                                    fullPathName: filePath || path.join(baseDir, entryModule.name + '.css'),
                                    source: sourceCode,
                                    isInternal: !filePath || !sourceCode && sourceCode !== ''
                                });
                            }).then(function (module) {
                                return _this8._processModule(module);
                            });
                            _context8.next = 7;
                            return Promise.all([resolvingJsModule, resolvingCssModule]);

                        case 7:
                            _ref3 = _context8.sent;
                            _ref4 = _slicedToArray(_ref3, 2);
                            jsModule = _ref4[0];
                            cssModule = _ref4[1];


                            // // debug:
                            // if (entryModule.name === 'about'){
                            //     console.log('=============about: ', entryModule)
                            // }

                            if (entryModule.extractCssFromJs) {
                                _this8._extractCssFromJs(jsModule, cssModule);
                            } else {
                                _this8._transformCssInJs(jsModule);
                            }

                            jsModule.valid = !!(jsModule.source || jsModule.source === '');

                            if (!jsModule.valid) {
                                _context8.next = 19;
                                break;
                            }

                            _context8.next = 16;
                            return _this8._bundleJsModule(jsModule);

                        case 16:
                            _context8.t0 = _context8.sent;
                            _context8.next = 20;
                            break;

                        case 19:
                            _context8.t0 = undefined;

                        case 20:
                            jsModule.outputSource = _context8.t0;

                            jsModule.outputSize = jsModule.outputSource ? jsModule.outputSource.length : 0;
                            jsModule.hash = jsModule.valid ? _this8._hash(jsModule.outputSource) : '';
                            jsModule.outputName = jsModule.valid ? _this8._buildOutputName({
                                name: entryModule.name,
                                hash: jsModule.hash,
                                type: 'js'
                            }) : '';

                            cssModule.valid = !!(cssModule.source || cssModule.source === '' || entryModule.extractCssFromJs && cssModule.appendSources && cssModule.appendSources.length > 0);
                            cssModule.outputSource = cssModule.valid ? _this8._bundleCssModule(cssModule) : undefined;
                            cssModule.outputSize = cssModule.outputSource ? cssModule.outputSource.length : 0;
                            cssModule.hash = cssModule.valid ? _this8._hash(cssModule.outputSource) : '';
                            cssModule.outputName = cssModule.valid ? _this8._buildOutputName({
                                name: entryModule.name,
                                hash: cssModule.hash,
                                type: 'css'
                            }) : '';

                            entryModule.jsModule = jsModule;
                            entryModule.cssModule = cssModule;

                            entryModule.bundle = {
                                script: jsModule,
                                scriptsTags: jsModule.outputSource ? '<script src="/' + jsModule.outputName + '"></script>' : '',
                                style: cssModule,
                                stylesTags: cssModule.outputSource ? '<link rel="stylesheet" href="/' + cssModule.outputName + '" >' : '',
                                html: null
                            };

                            _context8.next = 34;
                            return entryModule.html(entryModule);

                        case 34:
                            html = _context8.sent;
                            htmlValid = !!(html || html === '');
                            htmlHash = htmlValid ? _this8._hash(html) : '';
                            htmlOutputName = htmlValid ? _this8._buildOutputName({ name: entryModule.name, hash: htmlHash, type: 'html' }) : '';


                            entryModule.bundle.html = {
                                valid: htmlValid,
                                outputSource: html,
                                outputSize: html ? html.length : 0,
                                hash: htmlHash,
                                outputName: htmlOutputName
                            };

                            _context8.next = 41;
                            return Promise.all([_this8._outputFile(jsModule.outputName, jsModule.outputSource, entryModule, 'js'), _this8._outputFile(cssModule.outputName, cssModule.outputSource, entryModule, 'css'), _this8._outputFile(htmlOutputName, html, entryModule, 'html')]);

                        case 41:

                            entryModule.processed = true;
                            return _context8.abrupt('return', entryModule);

                        case 43:
                        case 'end':
                            return _context8.stop();
                    }
                }
            }, _callee8, _this8);
        }))();
    },
    _bundleJsModule: function _bundleJsModule(jsModule) {
        var _this9 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
            var bundled, bundleRec, bundledJsCode, transpiledCode;
            return regeneratorRuntime.wrap(function _callee9$(_context9) {
                while (1) {
                    switch (_context9.prev = _context9.next) {
                        case 0:
                            bundled = newArray(_this9._nextModuleId);

                            bundleRec = function bundleRec(module) {
                                if (!bundled[module.id]) {
                                    bundled[module.id] = {
                                        id: module.id,
                                        name: module.name,
                                        file: module.relativePath,
                                        source: module.builtSource
                                    };

                                    if (module.dependencies && module.dependencies.length > 0) {
                                        var _iteratorNormalCompletion2 = true;
                                        var _didIteratorError2 = false;
                                        var _iteratorError2 = undefined;

                                        try {
                                            for (var _iterator2 = module.dependencies[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                                var x = _step2.value;

                                                if (x.builtType === 'js') {
                                                    bundleRec(x);
                                                } else if (x.builtType === 'css') {
                                                    if (jsModule.cssExtracted) {
                                                        bundled[x.id] = {
                                                            id: x.id,
                                                            name: x.name,
                                                            file: x.relativePath,
                                                            source: ""
                                                        };
                                                    } else {
                                                        throw new Error("Logic Error: css modules still exists when bundling.");
                                                    }
                                                } else {
                                                    throw new Error('Unknown builtType: ' + x.builtType + ' when bundling ' + x.fullPathName + ' of ' + jsModule.fullPathName);
                                                }
                                            }
                                        } catch (err) {
                                            _didIteratorError2 = true;
                                            _iteratorError2 = err;
                                        } finally {
                                            try {
                                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                                    _iterator2.return();
                                                }
                                            } finally {
                                                if (_didIteratorError2) {
                                                    throw _iteratorError2;
                                                }
                                            }
                                        }
                                    }
                                }
                            };

                            bundleRec(jsModule);

                            bundledJsCode = buildJsBundleCode(bundled, jsModule.id);
                            _context9.next = 6;
                            return _this9._transCompile(bundledJsCode);

                        case 6:
                            transpiledCode = _context9.sent;
                            return _context9.abrupt('return', wrapLibrary(jsModule, transpiledCode));

                        case 8:
                        case 'end':
                            return _context9.stop();
                    }
                }
            }, _callee9, _this9);
        }))();
    },
    _bundleCssModule: function _bundleCssModule(cssModule) {
        if (cssModule.appendSources && cssModule.appendSources.length > 0) {
            return (cssModule.builtSource || '') + cssModule.appendSources.join("\n");
        }

        return cssModule.builtSource;
    },
    _extractCssFromJs: function _extractCssFromJs(jsModule, cssModule) {
        var _this10 = this;

        cssModule.appendSources = cssModule.appendSources || [];

        var extracted = {};
        var extractRec = function extractRec(dependencies) {
            if (dependencies) {
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = dependencies[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var x = _step3.value;

                        if (x.builtType === 'css') {
                            if (!extracted[x.id]) {
                                extracted[x.id] = true;
                                cssModule.appendSources.push(_this10._bundleCssModule(x));
                            }
                        } else {
                            extractRec(x.dependencies);
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            }
        };

        extractRec(jsModule.dependencies);
        jsModule.cssExtracted = true;
    },
    _transformCssInJs: function _transformCssInJs(jsModule) {
        var _this11 = this;

        var transformed = {};
        var transformRec = function transformRec(dependencies) {
            if (dependencies) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = dependencies[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var x = _step4.value;

                        if (x.builtType === 'css') {
                            _this11._transformCssModuleToInjectCssScript(x);
                        } else if (x.builtType === 'js') {
                            transformRec(x.dependencies);
                        } else {
                            // ignore other builtTypes
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }
            }
        };

        transformRec(jsModule.dependencies);
    },
    _transformCssModuleToInjectCssScript: function _transformCssModuleToInjectCssScript(module) {
        var injectStyleModule = this._getInjectStyleModule();
        var styleText = JSON.stringify(module.builtSource);
        module.builtSource = 'module.exports = __require_module__(' + injectStyleModule.id + '/*' + injectStyleModule.name + '*/)(' + styleText + ')';
        module.builtType = 'js';
        module.dependencies.push(injectStyleModule);
    },
    _getInjectStyleModule: function _getInjectStyleModule() {
        var injectStyleModuleName = '__inject_style__';
        return this._addInternalModule(injectStyleModuleName, getInjectStyleModuleSource);
    },
    _addInternalModule: function _addInternalModule(moduleName, getModuleSource) {
        var moduleFile = 'internal://' + moduleName;
        if (moduleFile in this._modulesByFullPathName) {
            return this._modulesByFullPathName[moduleFile];
        }

        var module = new NSPackModule({
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
            processed: true
        }, this);

        this._modules[module.id] = module;
        this._modulesByFullPathName[moduleFile] = module;
        return module;
    },
    _transCompile: function _transCompile(jsCode) {
        var _this12 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
            var babelConfig, res;
            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                while (1) {
                    switch (_context10.prev = _context10.next) {
                        case 0:
                            _context10.next = 2;
                            return _this12._loadBabelRc();

                        case 2:
                            babelConfig = _context10.sent;
                            res = babel.transform(jsCode, babelConfig);
                            return _context10.abrupt('return', '(function(__nspack__){' + res.code + ';return __nspack__.r})({});');

                        case 5:
                        case 'end':
                            return _context10.stop();
                    }
                }
            }, _callee10, _this12);
        }))();
    },
    _loadBabelRc: function _loadBabelRc() {
        var _this13 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
            return regeneratorRuntime.wrap(function _callee11$(_context11) {
                while (1) {
                    switch (_context11.prev = _context11.next) {
                        case 0:
                            if (!(_this13._config.babelrc === false)) {
                                _context11.next = 4;
                                break;
                            }

                            return _context11.abrupt('return', false);

                        case 4:
                            if (!(typeof _this13._config.babelrc === 'string')) {
                                _context11.next = 11;
                                break;
                            }

                            _this13._config.babelrcFile = _this13._config.babelrc;
                            _context11.next = 8;
                            return tryReadJsonFileContent(_this13._config.babelrc);

                        case 8:
                            return _context11.abrupt('return', _this13._config.babelrc = _context11.sent);

                        case 11:
                            if (!(_this13._config.babelrc === true || _this13._config.babelrc === undefined)) {
                                _context11.next = 18;
                                break;
                            }

                            _this13._config.babelrcFile = '.babelrc';
                            _context11.next = 15;
                            return tryReadJsonFileContent('.babelrc');

                        case 15:
                            return _context11.abrupt('return', _this13._config.babelrc = _context11.sent);

                        case 18:
                            return _context11.abrupt('return', _this13._config.babelrc);

                        case 19:
                        case 'end':
                            return _context11.stop();
                    }
                }
            }, _callee11, _this13);
        }))();
    },
    _outputManifests: function _outputManifests() {
        var _this14 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
            var manifestsConfig, manifests, manifestsJson, jobs, jsonpCb;
            return regeneratorRuntime.wrap(function _callee12$(_context12) {
                while (1) {
                    switch (_context12.prev = _context12.next) {
                        case 0:
                            manifestsConfig = _this14._config.outputHashManifests;

                            if (!(!manifestsConfig || !manifestsConfig.json && !manifestsConfig.jsonp)) {
                                _context12.next = 3;
                                break;
                            }

                            return _context12.abrupt('return');

                        case 3:
                            manifests = _this14._buildManifests();
                            _context12.next = 6;
                            return _this14._applyHook('buildManifests', manifests);

                        case 6:
                            manifestsJson = JSON.stringify(manifests);
                            jobs = [];

                            if (manifestsConfig.json) {
                                jobs.push(_this14._writeOutputFile(manifestsConfig.json, manifestsJson));
                            }

                            if (manifestsConfig.jsonp) {
                                jsonpCb = manifestsConfig.jsonpCallback || 'nspackManifestsJsonpCallback';

                                jobs.push(_this14._writeOutputFile(manifestsConfig.jsonp, jsonpCb + '(' + manifestsJson + ')'));
                            }

                            _context12.next = 12;
                            return Promise.all(jobs);

                        case 12:
                        case 'end':
                            return _context12.stop();
                    }
                }
            }, _callee12, _this14);
        }))();
    },
    _buildManifests: function _buildManifests() {
        var manifests = {};
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
            for (var _iterator5 = Object.values(this._config.entry)[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var m = _step5.value;

                // todo...
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
        } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                }
            } finally {
                if (_didIteratorError5) {
                    throw _iteratorError5;
                }
            }
        }

        return manifests;
    },
    _buildOutputName: function _buildOutputName(_ref5) {
        var type = _ref5.type,
            name = _ref5.name,
            hash = _ref5.hash;

        var defaultOutputConfig = this._config.output['*'];
        var moduleOutputConfig = this._config.output[name] || defaultOutputConfig;
        var template = moduleOutputConfig[type] || defaultOutputConfig[type];
        return template.replace('[name]', name).replace('[hash]', hash);
    },
    _hash: function _hash(content) {
        return md5(content || '').substring(0, this._config.hashLength);
    },
    _outputFile: function _outputFile(outputName, content, entryModule, outputType) {
        var _this15 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14() {
            var filePath, fileDir, outputFile;
            return regeneratorRuntime.wrap(function _callee14$(_context14) {
                while (1) {
                    switch (_context14.prev = _context14.next) {
                        case 0:
                            if (!(content === undefined)) {
                                _context14.next = 2;
                                break;
                            }

                            return _context14.abrupt('return');

                        case 2:
                            filePath = _this15._config.resolveOutputFile(outputName);
                            fileDir = path.dirname(filePath);
                            outputFile = {
                                packer: _this15,
                                entryModule: entryModule,
                                outputName: outputName, outputType: outputType,
                                filePath: filePath, fileDir: fileDir,
                                content: content,
                                write: function write(options) {
                                    var _this16 = this;

                                    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13() {
                                        var t;
                                        return regeneratorRuntime.wrap(function _callee13$(_context13) {
                                            while (1) {
                                                switch (_context13.prev = _context13.next) {
                                                    case 0:
                                                        t = options ? extend({}, _this16, options) : _this16;
                                                        _context13.next = 3;
                                                        return t.packer._mkdirIfNotExists(t.fileDir);

                                                    case 3:
                                                        _context13.next = 5;
                                                        return t.packer._callFsOpAsync('writeFile', t.filePath, t.content, 'utf8');

                                                    case 5:
                                                    case 'end':
                                                        return _context13.stop();
                                                }
                                            }
                                        }, _callee13, _this16);
                                    }))();
                                }
                            };
                            _context14.next = 7;
                            return _this15._applyHook("outputFile", outputFile);

                        case 7:
                            _context14.t0 = _context14.sent;

                            if (!(_context14.t0 === false)) {
                                _context14.next = 10;
                                break;
                            }

                            return _context14.abrupt('return');

                        case 10:
                            _context14.next = 12;
                            return outputFile.write();

                        case 12:
                        case 'end':
                            return _context14.stop();
                    }
                }
            }, _callee14, _this15);
        }))();
    },
    _writeOutputFile: function _writeOutputFile(filename, content) {
        var _this17 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15() {
            var filePath;
            return regeneratorRuntime.wrap(function _callee15$(_context15) {
                while (1) {
                    switch (_context15.prev = _context15.next) {
                        case 0:
                            filePath = _this17._config.resolveOutputFile(filename);
                            _context15.next = 3;
                            return _this17._mkdirIfNotExists(path.dirname(filePath));

                        case 3:
                            _context15.next = 5;
                            return _this17._callFsOpAsync('writeFile', filePath, content, 'utf8');

                        case 5:
                        case 'end':
                            return _context15.stop();
                    }
                }
            }, _callee15, _this17);
        }))();
    },
    _resolveModule: function _resolveModule(moduleName, baseDir) {
        var _this18 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16() {
            var module;
            return regeneratorRuntime.wrap(function _callee16$(_context16) {
                while (1) {
                    switch (_context16.prev = _context16.next) {
                        case 0:
                            _this18.debugLevel > 0 && debug('resolving %o in %o', moduleName, baseDir);

                            if (!(moduleName in _this18._config.externals)) {
                                _context16.next = 3;
                                break;
                            }

                            return _context16.abrupt('return', _this18._externalModules[moduleName]);

                        case 3:
                            _context16.next = 5;
                            return _this18._addModuleIfNotExists({
                                name: moduleName,
                                baseDir: baseDir
                            });

                        case 5:
                            module = _context16.sent;
                            _context16.next = 8;
                            return _this18._processModule(module);

                        case 8:
                            return _context16.abrupt('return', module);

                        case 9:
                        case 'end':
                            return _context16.stop();
                    }
                }
            }, _callee16, _this18);
        }))();
    },
    _processModule: function _processModule(module) {
        var _this19 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18() {
            var processing;
            return regeneratorRuntime.wrap(function _callee18$(_context18) {
                while (1) {
                    switch (_context18.prev = _context18.next) {
                        case 0:
                            if (!(module.processed && !module.needUpdate)) {
                                _context18.next = 3;
                                break;
                            }

                            _this19.debugLevel > 3 && debug("ignore module %o in %o (processed and do not need update)", module.name, module.baseDir || module.fullFileDirName);
                            return _context18.abrupt('return', module);

                        case 3:
                            if (!module.processing) {
                                _context18.next = 5;
                                break;
                            }

                            return _context18.abrupt('return', module.processing);

                        case 5:
                            processing = module.processing = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17() {
                                var processors, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, processor;

                                return regeneratorRuntime.wrap(function _callee17$(_context17) {
                                    while (1) {
                                        switch (_context17.prev = _context17.next) {
                                            case 0:
                                                _this19.debugLevel > 1 && debug("processing module %o in %o", module.name, module.baseDir || module.fullFileDirName);

                                                _context17.next = 3;
                                                return module.loadSource();

                                            case 3:
                                                processors = _this19._config.moduleProcessors[module.type];

                                                if (!processors) {
                                                    _context17.next = 33;
                                                    break;
                                                }

                                                _iteratorNormalCompletion6 = true;
                                                _didIteratorError6 = false;
                                                _iteratorError6 = undefined;
                                                _context17.prev = 8;
                                                _iterator6 = processors[Symbol.iterator]();

                                            case 10:
                                                if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
                                                    _context17.next = 17;
                                                    break;
                                                }

                                                processor = _step6.value;
                                                _context17.next = 14;
                                                return processor.call(processor, module, _this19);

                                            case 14:
                                                _iteratorNormalCompletion6 = true;
                                                _context17.next = 10;
                                                break;

                                            case 17:
                                                _context17.next = 23;
                                                break;

                                            case 19:
                                                _context17.prev = 19;
                                                _context17.t0 = _context17['catch'](8);
                                                _didIteratorError6 = true;
                                                _iteratorError6 = _context17.t0;

                                            case 23:
                                                _context17.prev = 23;
                                                _context17.prev = 24;

                                                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                                    _iterator6.return();
                                                }

                                            case 26:
                                                _context17.prev = 26;

                                                if (!_didIteratorError6) {
                                                    _context17.next = 29;
                                                    break;
                                                }

                                                throw _iteratorError6;

                                            case 29:
                                                return _context17.finish(26);

                                            case 30:
                                                return _context17.finish(23);

                                            case 31:
                                                _context17.next = 34;
                                                break;

                                            case 33:
                                                throw new Error('No processor for ' + module.type + ' when processing file ' + module.fullPathName);

                                            case 34:

                                                module.processed = true;
                                                module.needUpdate = false;
                                                return _context17.abrupt('return', module);

                                            case 37:
                                            case 'end':
                                                return _context17.stop();
                                        }
                                    }
                                }, _callee17, _this19, [[8, 19, 23, 31], [24,, 26, 30]]);
                            }))();
                            _context18.next = 8;
                            return processing;

                        case 8:
                            module.processing = false;
                            return _context18.abrupt('return', module);

                        case 10:
                        case 'end':
                            return _context18.stop();
                    }
                }
            }, _callee18, _this19);
        }))();
    },
    _addModuleIfNotExists: function _addModuleIfNotExists(module) {
        var _this20 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19() {
            return regeneratorRuntime.wrap(function _callee19$(_context19) {
                while (1) {
                    switch (_context19.prev = _context19.next) {
                        case 0:
                            if ('fullPathName' in module) {
                                _context19.next = 9;
                                break;
                            }

                            if (!(module.isInternal || module.isExternal)) {
                                _context19.next = 6;
                                break;
                            }

                            module.fullPathName = module.file;
                            if (!('relativePath' in module)) {
                                module.relativePath = module.file;
                            }
                            _context19.next = 9;
                            break;

                        case 6:
                            _context19.next = 8;
                            return _this20._resolveModuleFullPathName(module.name, module.baseDir);

                        case 8:
                            module.fullPathName = _context19.sent;

                        case 9:
                            if (module.fullPathName) {
                                _context19.next = 11;
                                break;
                            }

                            throw new Error('Failed to resolve module \'' + module.name + '\' in directory \'' + module.baseDir + '\'');

                        case 11:
                            if (!(module.fullPathName in _this20._modulesByFullPathName)) {
                                _context19.next = 14;
                                break;
                            }

                            _this20._modulesByFullPathName[module.fullPathName].fresh = false;
                            return _context19.abrupt('return', _this20._modulesByFullPathName[module.fullPathName]);

                        case 14:

                            module = new NSPackModule(module, _this20);
                            module.fresh = true;
                            module.id = _this20._nextModuleId++;

                            _this20._modules[module.id] = module;
                            _this20._modulesByFullPathName[module.fullPathName] = module;

                            return _context19.abrupt('return', module);

                        case 20:
                        case 'end':
                            return _context19.stop();
                    }
                }
            }, _callee19, _this20);
        }))();
    },
    _resolveModuleFullPathName: function _resolveModuleFullPathName(moduleName, baseDir) {
        var _this21 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {
            return regeneratorRuntime.wrap(function _callee20$(_context20) {
                while (1) {
                    switch (_context20.prev = _context20.next) {
                        case 0:
                            if (!(moduleName[0] === '@')) {
                                _context20.next = 4;
                                break;
                            }

                            _context20.next = 3;
                            return _this21._nodeModuleResolver.resolveModuleFullPathName(path.join(_this21._config.entryBase, moduleName.substring(1)), '');

                        case 3:
                            return _context20.abrupt('return', _context20.sent);

                        case 4:
                            _context20.next = 6;
                            return _this21._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir);

                        case 6:
                            return _context20.abrupt('return', _context20.sent);

                        case 7:
                        case 'end':
                            return _context20.stop();
                    }
                }
            }, _callee20, _this21);
        }))();
    },
    _loadSource: function _loadSource(src) {
        var _this22 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21() {
            var srcFilePath;
            return regeneratorRuntime.wrap(function _callee21$(_context21) {
                while (1) {
                    switch (_context21.prev = _context21.next) {
                        case 0:
                            _context21.next = 2;
                            return src;

                        case 2:
                            src = _context21.sent;

                            if (!(src === undefined)) {
                                _context21.next = 5;
                                break;
                            }

                            return _context21.abrupt('return', {});

                        case 5:
                            if (!(typeof src === 'string')) {
                                _context21.next = 7;
                                break;
                            }

                            return _context21.abrupt('return', { sourceCode: src });

                        case 7:
                            if (!((typeof src === 'undefined' ? 'undefined' : _typeof(src)) === 'object' && src)) {
                                _context21.next = 15;
                                break;
                            }

                            if (!(src.file && !src.sourceCode)) {
                                _context21.next = 14;
                                break;
                            }

                            srcFilePath = _this22._config.resolveEntryFile(src.file);

                            _this22.debugLevel > 1 && debug("loadSource: reading file: %o", srcFilePath);
                            return _context21.abrupt('return', readFile(srcFilePath, src.encoding || 'utf8').then(function (data) {
                                return { filePath: srcFilePath, sourceCode: data };
                            }));

                        case 14:
                            return _context21.abrupt('return', src);

                        case 15:
                            return _context21.abrupt('return', {});

                        case 16:
                        case 'end':
                            return _context21.stop();
                    }
                }
            }, _callee21, _this22);
        }))();
    },
    debugDumpAllModules: function debugDumpAllModules() {
        debug("all modules: ");
        for (var i = 0, n = this._nextModuleId; i < n; i++) {
            var m = this._modules[i];
            if (m) {
                debug("\t[%o]\t%o\t%o\t%o (%o)", i, m.type, m.builtType, m.name, m.fullPathName);
            }
        }
    },
    debugDumpAllEntriesOutputs: function debugDumpAllEntriesOutputs() {
        debug("Done build. Spent %s(s)", (this.buildSpentTimeMs / 1000).toFixed(3));

        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
            for (var _iterator7 = Object.values(this._config.entry)[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var entryModule = _step7.value;

                debug("\t%o:", entryModule.name);
                debug("\t\t%o: %o", entryModule.bundle.script.outputName, entryModule.bundle.script.hash);
                debug("\t\t%o: %o", entryModule.bundle.style.outputName, entryModule.bundle.style.hash);
                debug("\t\t%o: %o", entryModule.bundle.html.outputName, entryModule.bundle.html.hash);
            }
        } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion7 && _iterator7.return) {
                    _iterator7.return();
                }
            } finally {
                if (_didIteratorError7) {
                    throw _iteratorError7;
                }
            }
        }
    },
    _callFsOpAsync: function _callFsOpAsync(op) {
        var _this23 = this;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        return new Promise(function (resolve, reject) {
            var cb = function cb(err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            };

            _this23._fs[op].apply(_this23._fs, args.concat([cb]));
        });
    },
    _mkdirIfNotExists: function _mkdirIfNotExists(fileDir) {
        var _this24 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22() {
            var st;
            return regeneratorRuntime.wrap(function _callee22$(_context22) {
                while (1) {
                    switch (_context22.prev = _context22.next) {
                        case 0:
                            _context22.prev = 0;
                            _context22.next = 3;
                            return _this24._callFsOpAsync('stat', fileDir);

                        case 3:
                            st = _context22.sent;

                            if (!(!st || !st.isDirectory())) {
                                _context22.next = 6;
                                break;
                            }

                            throw new Error('Invalid path/directory: ' + fileDir);

                        case 6:
                            _context22.next = 19;
                            break;

                        case 8:
                            _context22.prev = 8;
                            _context22.t0 = _context22['catch'](0);
                            _context22.prev = 10;
                            _context22.next = 13;
                            return _this24._callFsOpAsync('mkdir', fileDir);

                        case 13:
                            _context22.next = 19;
                            break;

                        case 15:
                            _context22.prev = 15;
                            _context22.t1 = _context22['catch'](10);

                            if (!(_context22.t1.code !== 'EEXIST')) {
                                _context22.next = 19;
                                break;
                            }

                            throw _context22.t1;

                        case 19:
                        case 'end':
                            return _context22.stop();
                    }
                }
            }, _callee22, _this24, [[0, 8], [10, 15]]);
        }))();
    },
    _applyHook: function _applyHook(hookName) {
        var hook = this._config.hooks[hookName];
        if (hook) {
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            return hook.apply(hook, args);
        }
    },
    _checkModulesUpdates: function _checkModulesUpdates() {
        var _this25 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23() {
            var hasOneUpdated, _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, m;

            return regeneratorRuntime.wrap(function _callee23$(_context23) {
                while (1) {
                    switch (_context23.prev = _context23.next) {
                        case 0:
                            _context23.next = 2;
                            return Promise.all(Object.values(_this25._modules).map(function (m) {
                                return m._checkIfNeedUpdate0();
                            }));

                        case 2:
                            hasOneUpdated = false;
                            _iteratorNormalCompletion8 = true;
                            _didIteratorError8 = false;
                            _iteratorError8 = undefined;
                            _context23.prev = 6;

                            for (_iterator8 = Object.values(_this25._config.entry)[Symbol.iterator](); !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                m = _step8.value;

                                hasOneUpdated = hasOneUpdated || m._checkIfNeedUpdate1();
                            }

                            _context23.next = 14;
                            break;

                        case 10:
                            _context23.prev = 10;
                            _context23.t0 = _context23['catch'](6);
                            _didIteratorError8 = true;
                            _iteratorError8 = _context23.t0;

                        case 14:
                            _context23.prev = 14;
                            _context23.prev = 15;

                            if (!_iteratorNormalCompletion8 && _iterator8.return) {
                                _iterator8.return();
                            }

                        case 17:
                            _context23.prev = 17;

                            if (!_didIteratorError8) {
                                _context23.next = 20;
                                break;
                            }

                            throw _iteratorError8;

                        case 20:
                            return _context23.finish(17);

                        case 21:
                            return _context23.finish(14);

                        case 22:
                            return _context23.abrupt('return', hasOneUpdated);

                        case 23:
                        case 'end':
                            return _context23.stop();
                    }
                }
            }, _callee23, _this25, [[6, 10, 14, 22], [15,, 17, 21]]);
        }))();
    }
});

/**
 * 
 * @param {*} config 
 * @this NSPack
 */
function sanitizeConfig(config) {
    var r = _extends({}, config);

    if (!r.entryBase) {
        r.entryBase = process.cwd();
    }

    r.resolveEntryFile = function (f) {
        return path.join(r.entryBase, f);
    };

    r.entry = _extends({}, config.entry);
    var _iteratorNormalCompletion9 = true;
    var _didIteratorError9 = false;
    var _iteratorError9 = undefined;

    try {
        for (var _iterator9 = Object.keys(r.entry)[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var entryName = _step9.value;

            var entry = r.entry[entryName] = new NSPackEntryModule({ name: entryName }, this);
            var entryConfigType = _typeof(config.entry[entryName]);
            if (entryConfigType === 'string') {
                entry.js = config.entry[entryName];
            } else if (entryConfigType === 'function') {
                entry.js = config.entry[entryName];
            } else if (entryConfigType === 'object' && entryConfigType) {
                extend(entry, config.entry[entryName]);
            } else {
                throw new Error('config.entry[' + entryName + '] is invalid');
            }

            // if string, assume it is a path
            if (typeof entry.js === 'string') {
                entry.js = makeSourceFileReaderFunc(r.resolveEntryFile(entry.js));
            } else if (typeof entry.js === 'function') {
                // nothing to do
            } else if (!entry.js) {
                entry.js = function () {
                    return undefined;
                };
            }

            if (typeof entry.css === 'string') {
                entry.css = makeSourceFileReaderFunc(r.resolveEntryFile(entry.css));
            } else if (typeof entry.css === 'function') {
                // nothing to do
            } else if (!entry.css) {
                entry.css = function () {
                    return undefined;
                };
            }

            if (typeof entry.html === 'string') {
                (function () {
                    var entryHtml = require(r.resolveEntryFile(entry.html));
                    if (typeof entryHtml === 'string') {
                        entry.html = function () {
                            return entryHtml;
                        };
                    } else if (typeof entryHtml === 'function') {
                        entry.html = entryHtml;
                    } else {
                        throw new Error('config.entry[' + entryName + '].html is invalid');
                    }
                })();
            } else if (typeof entry.html === 'function') {
                // nothing to do
            } else if (!entry.html) {
                entry.html = function () {
                    return undefined;
                };
            }
        }
    } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                _iterator9.return();
            }
        } finally {
            if (_didIteratorError9) {
                throw _iteratorError9;
            }
        }
    }

    if (!r.outputBase) {
        r.outputBase = path.join(process.cwd(), 'dist');
    }

    r.resolveOutputFile = function (f) {
        return path.join(r.outputBase, f);
    };

    r.moduleProcessors = _extends({}, defaultModuleProcessors, r.moduleProcessors);

    r.hashLength = +r.hashLength || 6;

    r.debugLevel = (r.debugLevel === undefined ? +process.env.NSPACK_DEBUG_LEVEL : +r.debugLevel) || 0;

    r.hooks = extend({
        outputFile: noop,
        buildManifests: noop
    }, r.hooks || {});

    r.watchInterval = +r.watchInterval || 500;

    return r;
}

function makeSourceFileReaderFunc(filepath) {
    var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';

    return function () {
        return readFile(filepath, encoding).then(function (data) {
            return { filePath: filepath, sourceCode: data };
        });
    };
}

function buildJsBundleCode(modules) {
    var entryModuleId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    var modulesCodes = [];

    for (var i = 0, n = modules.length; i < n; i++) {
        var _module = modules[i];
        if (_module) {
            modulesCodes.push("\n");
            modulesCodes.push(wrapModuleCode(_module.id, _module.source, _module.file || _module.relativePath || _module.name));
            modulesCodes.push(",");
        } else {
            modulesCodes.push(",");
        }
    }

    return '\n__nspack__.r = (function(modules){\n    var required = {};\n    var require = function(moduleId){\n        var m = required[moduleId];\n        if (!m){\n            m = required[moduleId] = {exports:{}};\n            modules[moduleId](require, m, m.exports);\n        }\n    \n        return m.exports;\n    };\n    return require(' + entryModuleId + ');\n})([' + modulesCodes.join("") + ']);\n\nfunction __extract_default__(module){\n    return module.__esModule ? module.default : module\n}\n\nfunction __set_esModule_flag__(exports){\n    exports.__esModule = true\n}\n';
}

function wrapModuleCode(moduleId, source, moduleFile) {
    return '\n// module#' + moduleId + ': file: ' + moduleFile + '\nfunction(__require_module__, module, exports){\n    ' + source + '\n}\n';
}

function newArray(len, defaultValue) {
    var a = new Array(len);
    for (var i = 0; i < len; i++) {
        a[i] = defaultValue;
    }

    return a;
}

function getInjectStyleModuleSource() {
    return '\nmodule.exports = function (styleCode){\n    if (styleCode){\n        var styleTag = document.createElement("style")\n        styleTag.innerText = styleCode\n        ~(document.getElementsByTagName(\'head\')[0] || document.documentElement).appendChild(styleTag)\n    }\n    return styleCode\n}';
}

function wrapLibrary(_ref7, code) {
    var libName = _ref7.libName,
        libTarget = _ref7.libTarget,
        amdExecOnDef = _ref7.amdExecOnDef;

    // debug("wrapLibray: ", {libName, libTarget, amdExecOnDef})
    // no library, just return
    if (!libTarget) {
        return code;
    }

    if (libTarget === 'amd') {
        if (libName) {
            if (!amdExecOnDef) {
                return '\ndefine(' + JSON.stringify(libName) + ', [], function(){\n    return ' + code + '\n})\n';
            } else {
                return '\n(function(f,u){\n    var m,e;\n    try{m = f()}catch(x){e=x}; \n    define(' + JSON.stringify(libName) + ', [], function(){if(e !== u){throw e} return m})\n    if(e !== u){throw e}\n})(function(){\n    return ' + code + '\n})\n';
            }
        } else {
            return;
            return '\ndefine([], function(){\n    return ' + code + '\n})\n';
        }
    } else if (libTarget === 'umd') {
        if (libName) {
            return '\n(function (root, moduleName, moduleDef, undefined) {\n    if (typeof exports === \'object\' && typeof module === \'object\')\n        module.exports = moduleDef()\n    else if (typeof define === \'function\' && define.amd)\n        ' + (amdExecOnDef ? '{var m, e; try{m = moduleDef()}catch(x){e=x} define(moduleName, [], function(){if(e !== undefined){throw e} return m})} if(e !== undefined){throw e}' : 'define(moduleName, [], moduleDef)') + '\n    else if (typeof exports === \'object\')\n        exports[moduleName] = moduleDef()\n    else\n        root[moduleName] = moduleDef()\n})(this, ' + JSON.stringify(libName) + ', function(){\n    return ' + code + '\n})\n';
        } else {
            return '\n(function (root, moduleDef, undefined) {\n    if (typeof exports === \'object\' && typeof module === \'object\')\n        module.exports = moduleDef()\n    else if (typeof define === \'function\' && define.amd)\n        ' + (amdExecOnDef ? '{var m, e; try{m = moduleDef()}catch(x){e=x}; define([], function(){if(e !== undefined){throw e} return m})} if(e !== undefined){throw e}' : 'define([], moduleDef)') + '\n    else if (typeof exports === \'object\')\n        exports[\'return\'] = moduleDef()\n    else\n        root.returnExports = moduleDef()\n})(this, ' + JSON.stringify(libName) + ', function(){\n    return ' + code + '\n})\n';
        }
    } else if (libTarget === 'commonjs') {
        return 'module.exports = ' + code;
    } else {
        throw new Error('Unknown libTarget(' + libTarget + ') when processing ' + libName);
    }
}

function noop() {}