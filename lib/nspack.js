var regeneratorRuntime = require("regenerator-runtime");
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var mkdirIfNotExists = function () {
    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(fileDir) {
        var st;
        return regeneratorRuntime.wrap(function _callee15$(_context15) {
            while (1) {
                switch (_context15.prev = _context15.next) {
                    case 0:
                        _context15.prev = 0;
                        _context15.next = 3;
                        return stat(fileDir);

                    case 3:
                        st = _context15.sent;

                        if (!(!st || !st.isDirectory())) {
                            _context15.next = 6;
                            break;
                        }

                        throw new Error('Invalid path/directory: ' + fileDir);

                    case 6:
                        _context15.next = 19;
                        break;

                    case 8:
                        _context15.prev = 8;
                        _context15.t0 = _context15['catch'](0);
                        _context15.prev = 10;
                        _context15.next = 13;
                        return mkdir(fileDir);

                    case 13:
                        _context15.next = 19;
                        break;

                    case 15:
                        _context15.prev = 15;
                        _context15.t1 = _context15['catch'](10);

                        if (!(_context15.t1.code !== 'EEXIST')) {
                            _context15.next = 19;
                            break;
                        }

                        throw _context15.t1;

                    case 19:
                    case 'end':
                        return _context15.stop();
                }
            }
        }, _callee15, this, [[0, 8], [10, 15]]);
    }));

    return function mkdirIfNotExists(_x3) {
        return _ref6.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');
var path = require('path');
var md5 = require('md5');
var cb2p = require('./cb2p');
var babel = require('babel-core');
var debug = require('debug')('nspack');

var defaultModuleProcessors = require('./default-module-processors');
var NodeModuleResolver = require('./node-module-resolver');

var _require = require('./utils'),
    tryFStat = _require.tryFStat,
    tryReadJsonFileContent = _require.tryReadJsonFileContent;

var extend = Object.assign;

var readFile = cb2p(fs.readFile);
var writeFile = cb2p(fs.writeFile);
var stat = cb2p(fs.stat);
var mkdir = cb2p(fs.mkdir);

module.exports = NSPack;

function NSPack(config) {
    if (!(this instanceof NSPack)) {
        return new NSPack(config).build();
    }

    this._config = sanitizeConfig(config);
    this.debugLevel = this._config.debugLevel;

    this._nextModuleId = 1;
    this._externalModules = {}; // moduleName => module
    this._modules = {}; // id => module
    this._modulesByFullPathName = {}; // fullPathName => module
    this._built = {};
    this._nodeModuleResolver = new NodeModuleResolver();
    return this;
}

extend(NSPack.prototype, {
    build: function build() {
        var _this = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _this.buildBeginAt = new Date();

                            _context.next = 3;
                            return _this._resolveExternalModules();

                        case 3:
                            _context.next = 5;
                            return _this._buildFromEntries();

                        case 5:

                            _this.buildEndAt = new Date();
                            _this.buildSpentTimeMs = +_this.buildEndAt - +_this.buildBeginAt;

                            _this.debugLevel > 1 && _this.debugDumpAllModules();
                            _this.debugLevel > 0 && _this.debugDumpAllEntriesOutputs();

                            return _context.abrupt('return', _this._built);

                        case 10:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this);
        }))();
    },
    addModule: function addModule(module) {
        var _this2 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            return _context2.abrupt('return', _this2._addModuleIfNotExists(module).then(function (m) {
                                return _this2._processModule(m);
                            }));

                        case 1:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this2);
        }))();
    },
    _resolveExternalModules: function _resolveExternalModules() {
        var _this3 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
            var externalModules, jobs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _loop, _iterator, _step;

            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            externalModules = _this3._config.externals;

                            if (externalModules) {
                                _context3.next = 3;
                                break;
                            }

                            return _context3.abrupt('return');

                        case 3:
                            jobs = [];
                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            _context3.prev = 7;

                            _loop = function _loop() {
                                var moduleName = _step.value;

                                jobs.push(_this3._addModuleIfNotExists({
                                    name: moduleName,
                                    baseDir: _this3._config.entryBase,
                                    builtSource: 'module.exports = ' + externalModules[moduleName],
                                    file: 'external://' + moduleName,
                                    type: 'js',
                                    builtType: 'js',
                                    isExternal: true,
                                    processed: true
                                }).then(function (module) {
                                    _this3._externalModules[moduleName] = module;
                                }));
                            };

                            for (_iterator = Object.keys(externalModules)[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                _loop();
                            }

                            _context3.next = 16;
                            break;

                        case 12:
                            _context3.prev = 12;
                            _context3.t0 = _context3['catch'](7);
                            _didIteratorError = true;
                            _iteratorError = _context3.t0;

                        case 16:
                            _context3.prev = 16;
                            _context3.prev = 17;

                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }

                        case 19:
                            _context3.prev = 19;

                            if (!_didIteratorError) {
                                _context3.next = 22;
                                break;
                            }

                            throw _iteratorError;

                        case 22:
                            return _context3.finish(19);

                        case 23:
                            return _context3.finish(16);

                        case 24:
                            _context3.next = 26;
                            return Promise.all(jobs);

                        case 26:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, _this3, [[7, 12, 16, 24], [17,, 19, 23]]);
        }))();
    },
    _buildFromEntries: function _buildFromEntries() {
        var _this4 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
            var jobs, entryModules, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _loop2, _iterator2, _step2;

            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            jobs = [];
                            entryModules = Object.values(_this4._config.entry);
                            _iteratorNormalCompletion2 = true;
                            _didIteratorError2 = false;
                            _iteratorError2 = undefined;
                            _context4.prev = 5;

                            _loop2 = function _loop2() {
                                var entryModule = _step2.value;

                                jobs.push(_this4._buildEntryModule(entryModule).then(function (module) {
                                    _this4._built[entryModule.name] = module;
                                }));
                            };

                            for (_iterator2 = entryModules[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                _loop2();
                            }

                            _context4.next = 14;
                            break;

                        case 10:
                            _context4.prev = 10;
                            _context4.t0 = _context4['catch'](5);
                            _didIteratorError2 = true;
                            _iteratorError2 = _context4.t0;

                        case 14:
                            _context4.prev = 14;
                            _context4.prev = 15;

                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }

                        case 17:
                            _context4.prev = 17;

                            if (!_didIteratorError2) {
                                _context4.next = 20;
                                break;
                            }

                            throw _iteratorError2;

                        case 20:
                            return _context4.finish(17);

                        case 21:
                            return _context4.finish(14);

                        case 22:
                            _context4.next = 24;
                            return Promise.all(jobs);

                        case 24:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, _this4, [[5, 10, 14, 22], [15,, 17, 21]]);
        }))();
    },
    _buildEntryModule: function _buildEntryModule(entryModule) {
        var _this5 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
            var baseDir, resolvingJsModule, resolvingCssModule, _ref3, _ref4, jsModule, cssModule, html, htmlHash, htmlOutputName;

            return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                    switch (_context5.prev = _context5.next) {
                        case 0:
                            _this5.debugLevel > 0 && debug('building entry module %o...', entryModule.name);

                            baseDir = _this5._config.entryBase;

                            entryModule.entry = { name: entryModule.name, baseDir: baseDir };
                            resolvingJsModule = _this5._loadSource(entryModule.js(entryModule)).then(function (_ref) {
                                var sourceCode = _ref.sourceCode,
                                    filePath = _ref.filePath;
                                return _this5._addModuleIfNotExists({
                                    name: entryModule.name + '.js',
                                    baseDir: baseDir,
                                    fullPathName: filePath || path.join(baseDir, entryModule.name + '.js'),
                                    source: sourceCode
                                });
                            }).then(function (module) {
                                return _this5._processModule(module);
                            });
                            resolvingCssModule = _this5._loadSource(entryModule.css(entryModule)).catch(function (e) {
                                if (!entryModule.ignoreMissingCss) {
                                    throw e;
                                }

                                return {};
                            }).then(function (_ref2) {
                                var sourceCode = _ref2.sourceCode,
                                    filePath = _ref2.filePath;
                                return _this5._addModuleIfNotExists({
                                    name: entryModule.name + '.css',
                                    baseDir: baseDir,
                                    fullPathName: filePath || path.join(baseDir, entryModule.name + '.css'),
                                    source: sourceCode
                                });
                            }).then(function (module) {
                                return _this5._processModule(module);
                            });
                            _context5.next = 7;
                            return Promise.all([resolvingJsModule, resolvingCssModule]);

                        case 7:
                            _ref3 = _context5.sent;
                            _ref4 = _slicedToArray(_ref3, 2);
                            jsModule = _ref4[0];
                            cssModule = _ref4[1];


                            if (entryModule.extractCssFromJs) {
                                _this5._extractCssFromJs(jsModule, cssModule);
                            } else {
                                _this5._transformCssInJs(jsModule);
                            }

                            _context5.next = 14;
                            return _this5._bundleJsModule(jsModule);

                        case 14:
                            jsModule.outputSource = _context5.sent;

                            jsModule.hash = _this5._hash(jsModule.outputSource);
                            jsModule.outputName = _this5._buildOutputName({
                                name: entryModule.name,
                                hash: jsModule.hash,
                                type: 'js'
                            });

                            cssModule.outputSource = _this5._bundleCssModule(cssModule);
                            cssModule.hash = _this5._hash(cssModule.outputSource);
                            cssModule.outputName = _this5._buildOutputName({
                                name: entryModule.name,
                                hash: cssModule.hash,
                                type: 'css'
                            });

                            entryModule.bundle = {
                                script: jsModule,
                                scriptsTags: jsModule.outputSource ? '<script src="/' + jsModule.outputName + '"></script>' : '',
                                style: cssModule,
                                stylesTags: cssModule.outputSource ? '<link rel="stylesheet" href="/' + cssModule.outputName + '" >' : '',
                                html: null
                            };

                            _context5.next = 23;
                            return entryModule.html(entryModule);

                        case 23:
                            html = _context5.sent;
                            htmlHash = _this5._hash(html);
                            htmlOutputName = _this5._buildOutputName({ name: entryModule.name, hash: htmlHash, type: 'html' });


                            entryModule.bundle.html = {
                                outputSource: html,
                                hash: htmlHash,
                                outputName: htmlOutputName
                            };

                            _context5.next = 29;
                            return Promise.all([_this5._outputFile(jsModule.outputName, jsModule.outputSource), _this5._outputFile(cssModule.outputName, cssModule.outputSource), _this5._outputFile(htmlOutputName, html)]);

                        case 29:
                        case 'end':
                            return _context5.stop();
                    }
                }
            }, _callee5, _this5);
        }))();
    },
    _bundleJsModule: function _bundleJsModule(jsModule) {
        var _this6 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
            var bundled, bundleRec, bundledJsCode;
            return regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            bundled = newArray(_this6._nextModuleId);

                            bundleRec = function bundleRec(module) {
                                if (!bundled[module.id]) {
                                    bundled[module.id] = {
                                        id: module.id,
                                        name: module.name,
                                        file: module.relativePath,
                                        source: module.builtSource
                                    };

                                    if (module.dependencies && module.dependencies.length > 0) {
                                        var _iteratorNormalCompletion3 = true;
                                        var _didIteratorError3 = false;
                                        var _iteratorError3 = undefined;

                                        try {
                                            for (var _iterator3 = module.dependencies[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                                var x = _step3.value;

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
                                }
                            };

                            bundleRec(jsModule);

                            bundledJsCode = buildJsBundleCode(bundled, jsModule.id);
                            _context6.next = 6;
                            return _this6._transCompile(bundledJsCode);

                        case 6:
                            return _context6.abrupt('return', _context6.sent);

                        case 7:
                        case 'end':
                            return _context6.stop();
                    }
                }
            }, _callee6, _this6);
        }))();
    },
    _bundleCssModule: function _bundleCssModule(cssModule) {
        if (cssModule.appendSources && cssModule.appendSources.length > 0) {
            return (cssModule.builtSource || '') + cssModule.appendSources.join("\n");
        }

        return cssModule.builtSource;
    },
    _extractCssFromJs: function _extractCssFromJs(jsModule, cssModule) {
        var _this7 = this;

        cssModule.appendSources = cssModule.appendSources || [];

        var extracted = {};
        var extractRec = function extractRec(dependencies) {
            if (dependencies) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                    for (var _iterator4 = dependencies[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var x = _step4.value;

                        if (x.builtType === 'css') {
                            if (!extracted[x.id]) {
                                extracted[x.id] = true;
                                cssModule.appendSources.push(_this7._bundleCssModule(x));
                            }
                        } else {
                            extractRec(x.dependencies);
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

        extractRec(jsModule.dependencies);
        jsModule.cssExtracted = true;
    },
    _transformCssInJs: function _transformCssInJs(jsModule) {
        var _this8 = this;

        var transformed = {};
        var transformRec = function transformRec(dependencies) {
            if (dependencies) {
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                    for (var _iterator5 = dependencies[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var x = _step5.value;

                        if (x.builtType === 'css') {
                            _this8._transformCssModuleToInjectCssScript(x);
                        } else if (x.builtType === 'js') {
                            transformRec(x.dependencies);
                        } else {
                            // ignore other builtTypes
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

        var module = {
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
        };

        this._modules[module.id] = module;
        this._modulesByFullPathName[moduleFile] = module;
        return module;
    },
    _transCompile: function _transCompile(jsCode) {
        var _this9 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
            var babelConfig, res;
            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            _context7.next = 2;
                            return _this9._loadBabelRc();

                        case 2:
                            babelConfig = _context7.sent;
                            res = babel.transform(jsCode, babelConfig);
                            return _context7.abrupt('return', '!(function(){' + res.code + '})();');

                        case 5:
                        case 'end':
                            return _context7.stop();
                    }
                }
            }, _callee7, _this9);
        }))();
    },
    _loadBabelRc: function _loadBabelRc() {
        var _this10 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
            return regeneratorRuntime.wrap(function _callee8$(_context8) {
                while (1) {
                    switch (_context8.prev = _context8.next) {
                        case 0:
                            if (!(_this10._config.babelrc === false)) {
                                _context8.next = 4;
                                break;
                            }

                            return _context8.abrupt('return', false);

                        case 4:
                            if (!(typeof _this10._config.babelrc === 'string')) {
                                _context8.next = 11;
                                break;
                            }

                            _this10._config.babelrcFile = _this10._config.babelrc;
                            _context8.next = 8;
                            return tryReadJsonFileContent(_this10._config.babelrc);

                        case 8:
                            return _context8.abrupt('return', _this10._config.babelrc = _context8.sent);

                        case 11:
                            if (!(_this10._config.babelrc === true || _this10._config.babelrc === undefined)) {
                                _context8.next = 18;
                                break;
                            }

                            _this10._config.babelrcFile = '.babelrc';
                            _context8.next = 15;
                            return tryReadJsonFileContent('.babelrc');

                        case 15:
                            return _context8.abrupt('return', _this10._config.babelrc = _context8.sent);

                        case 18:
                            return _context8.abrupt('return', _this10._config.babelrc);

                        case 19:
                        case 'end':
                            return _context8.stop();
                    }
                }
            }, _callee8, _this10);
        }))();
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
        return md5(content || '').substring(0, this._config.hash_length);
    },
    _outputFile: function _outputFile(outputName, content) {
        var _this11 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
            var filepath, fileDir;
            return regeneratorRuntime.wrap(function _callee9$(_context9) {
                while (1) {
                    switch (_context9.prev = _context9.next) {
                        case 0:
                            if (!(content === undefined)) {
                                _context9.next = 2;
                                break;
                            }

                            return _context9.abrupt('return');

                        case 2:
                            filepath = _this11._config.resolveOutputFile(outputName);
                            fileDir = path.dirname(filepath);
                            _context9.next = 6;
                            return mkdirIfNotExists(fileDir);

                        case 6:
                            return _context9.abrupt('return', writeFile(filepath, content, 'utf8'));

                        case 7:
                        case 'end':
                            return _context9.stop();
                    }
                }
            }, _callee9, _this11);
        }))();
    },
    _resolveModule: function _resolveModule(moduleName, baseDir) {
        var _this12 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
            var module;
            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                while (1) {
                    switch (_context10.prev = _context10.next) {
                        case 0:
                            _this12.debugLevel > 0 && debug('resolving %o in %o', moduleName, baseDir);

                            if (!(moduleName in _this12._config.externals)) {
                                _context10.next = 3;
                                break;
                            }

                            return _context10.abrupt('return', _this12._externalModules[moduleName]);

                        case 3:
                            _context10.next = 5;
                            return _this12._addModuleIfNotExists({
                                name: moduleName,
                                baseDir: baseDir
                            });

                        case 5:
                            module = _context10.sent;
                            _context10.next = 8;
                            return _this12._processModule(module);

                        case 8:
                            return _context10.abrupt('return', module);

                        case 9:
                        case 'end':
                            return _context10.stop();
                    }
                }
            }, _callee10, _this12);
        }))();
    },
    _processModule: function _processModule(module) {
        var _this13 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
            var processors, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, processor;

            return regeneratorRuntime.wrap(function _callee11$(_context11) {
                while (1) {
                    switch (_context11.prev = _context11.next) {
                        case 0:
                            if (!module.processed) {
                                _context11.next = 2;
                                break;
                            }

                            return _context11.abrupt('return');

                        case 2:

                            _this13.debugLevel > 1 && debug("processing module %o in %o", module.name, module.baseDir || module.fullFileDirName);

                            module.dependencies = [];

                            if ('source' in module) {
                                _context11.next = 9;
                                break;
                            }

                            _this13.debugLevel > 1 && debug("read module source from file: %o, module: %o", module.fullPathName, module);
                            _context11.next = 8;
                            return readFile(module.fullPathName, "utf8");

                        case 8:
                            module.source = _context11.sent;

                        case 9:

                            if (!('fullFileDirName' in module)) {
                                module.fullFileDirName = path.dirname(module.fullPathName);
                            }

                            processors = _this13._config.moduleProcessors[module.type];

                            if (!processors) {
                                _context11.next = 40;
                                break;
                            }

                            _iteratorNormalCompletion6 = true;
                            _didIteratorError6 = false;
                            _iteratorError6 = undefined;
                            _context11.prev = 15;
                            _iterator6 = processors[Symbol.iterator]();

                        case 17:
                            if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
                                _context11.next = 24;
                                break;
                            }

                            processor = _step6.value;
                            _context11.next = 21;
                            return processor.call(processor, module, _this13);

                        case 21:
                            _iteratorNormalCompletion6 = true;
                            _context11.next = 17;
                            break;

                        case 24:
                            _context11.next = 30;
                            break;

                        case 26:
                            _context11.prev = 26;
                            _context11.t0 = _context11['catch'](15);
                            _didIteratorError6 = true;
                            _iteratorError6 = _context11.t0;

                        case 30:
                            _context11.prev = 30;
                            _context11.prev = 31;

                            if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                _iterator6.return();
                            }

                        case 33:
                            _context11.prev = 33;

                            if (!_didIteratorError6) {
                                _context11.next = 36;
                                break;
                            }

                            throw _iteratorError6;

                        case 36:
                            return _context11.finish(33);

                        case 37:
                            return _context11.finish(30);

                        case 38:
                            _context11.next = 41;
                            break;

                        case 40:
                            throw new Error('No processor for ' + module.type + ' when processing file ' + module.fullPathName);

                        case 41:
                            return _context11.abrupt('return', module);

                        case 42:
                        case 'end':
                            return _context11.stop();
                    }
                }
            }, _callee11, _this13, [[15, 26, 30, 38], [31,, 33, 37]]);
        }))();
    },
    _addModuleIfNotExists: function _addModuleIfNotExists(module) {
        var _this14 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
            return regeneratorRuntime.wrap(function _callee12$(_context12) {
                while (1) {
                    switch (_context12.prev = _context12.next) {
                        case 0:
                            if ('fullPathName' in module) {
                                _context12.next = 9;
                                break;
                            }

                            if (!(module.isInternal || module.isExternal)) {
                                _context12.next = 6;
                                break;
                            }

                            module.fullPathName = module.file;
                            if (!('relativePath' in module)) {
                                module.relativePath = module.file;
                            }
                            _context12.next = 9;
                            break;

                        case 6:
                            _context12.next = 8;
                            return _this14._resolveModuleFullPathName(module.name, module.baseDir);

                        case 8:
                            module.fullPathName = _context12.sent;

                        case 9:
                            if (module.fullPathName) {
                                _context12.next = 11;
                                break;
                            }

                            throw new Error('Failed to resolve module \'' + module.name + '\' in directory \'' + module.baseDir + '\'');

                        case 11:
                            if (!(module.fullPathName in _this14._modulesByFullPathName)) {
                                _context12.next = 13;
                                break;
                            }

                            return _context12.abrupt('return', _this14._modulesByFullPathName[module.fullPathName]);

                        case 13:

                            if (!('relativePath' in module)) {
                                module.relativePath = path.relative(_this14._config.entryBase, module.fullPathName);
                            }

                            if (!('type' in module)) {
                                module.type = path.extname(module.fullPathName).replace(/^./, '').toLowerCase();
                            }

                            module.id = _this14._nextModuleId++;
                            _this14._modules[module.id] = module;
                            _this14._modulesByFullPathName[module.fullPathName] = module;

                            return _context12.abrupt('return', module);

                        case 19:
                        case 'end':
                            return _context12.stop();
                    }
                }
            }, _callee12, _this14);
        }))();
    },
    _resolveModuleFullPathName: function _resolveModuleFullPathName(moduleName, baseDir) {
        var _this15 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13() {
            return regeneratorRuntime.wrap(function _callee13$(_context13) {
                while (1) {
                    switch (_context13.prev = _context13.next) {
                        case 0:
                            if (!(moduleName[0] === '@')) {
                                _context13.next = 2;
                                break;
                            }

                            return _context13.abrupt('return', path.join(_this15._config.entryBase, moduleName.substring(1)));

                        case 2:
                            _context13.next = 4;
                            return _this15._nodeModuleResolver.resolveModuleFullPathName(moduleName, baseDir);

                        case 4:
                            return _context13.abrupt('return', _context13.sent);

                        case 5:
                        case 'end':
                            return _context13.stop();
                    }
                }
            }, _callee13, _this15);
        }))();
    },
    _loadSource: function _loadSource(src) {
        var _this16 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14() {
            var srcFilePath;
            return regeneratorRuntime.wrap(function _callee14$(_context14) {
                while (1) {
                    switch (_context14.prev = _context14.next) {
                        case 0:
                            _context14.next = 2;
                            return src;

                        case 2:
                            src = _context14.sent;

                            if (!(src === undefined)) {
                                _context14.next = 5;
                                break;
                            }

                            return _context14.abrupt('return', {});

                        case 5:
                            if (!(typeof src === 'string')) {
                                _context14.next = 7;
                                break;
                            }

                            return _context14.abrupt('return', { sourceCode: src });

                        case 7:
                            if (!((typeof src === 'undefined' ? 'undefined' : _typeof(src)) === 'object' && src)) {
                                _context14.next = 15;
                                break;
                            }

                            if (!(src.file && !src.sourceCode)) {
                                _context14.next = 14;
                                break;
                            }

                            srcFilePath = _this16._config.resolveEntryFile(src.file);

                            _this16.debugLevel > 1 && debug("loadSource: reading file: %o", srcFilePath);
                            return _context14.abrupt('return', readFile(srcFilePath, src.encoding || 'utf8').then(function (data) {
                                return { filePath: srcFilePath, sourceCode: data };
                            }));

                        case 14:
                            return _context14.abrupt('return', src);

                        case 15:
                            return _context14.abrupt('return', {});

                        case 16:
                        case 'end':
                            return _context14.stop();
                    }
                }
            }, _callee14, _this16);
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
                var _entryModule = _step7.value;

                debug("%o:", _entryModule.name);
                debug("\t%o: %o", _entryModule.bundle.script.outputName, _entryModule.bundle.script.hash);
                debug("\t%o: %o", _entryModule.bundle.style.outputName, _entryModule.bundle.style.hash);
                debug("\t%o: %o", _entryModule.bundle.html.outputName, _entryModule.bundle.html.hash);
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
    }
});

function sanitizeConfig(config) {
    var r = _extends({}, config);

    if (!r.entryBase) {
        r.entryBase = process.cwd();
    }

    r.resolveEntryFile = function (f) {
        return path.join(r.entryBase, f);
    };

    r.entry = _extends({}, config.entry);
    var _iteratorNormalCompletion8 = true;
    var _didIteratorError8 = false;
    var _iteratorError8 = undefined;

    try {
        for (var _iterator8 = Object.keys(r.entry)[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var entryName = _step8.value;

            var entry = r.entry[entryName] = { name: entryName };
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
        _didIteratorError8 = true;
        _iteratorError8 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
                _iterator8.return();
            }
        } finally {
            if (_didIteratorError8) {
                throw _iteratorError8;
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

    return '\n!(function(modules){\n    var required = {};\n    var require = function(moduleId){\n        var m = required[moduleId];\n        if (!m){\n            m = required[moduleId] = {exports:{}};\n            modules[moduleId](require, m, m.exports);\n        }\n    \n        return m.exports;\n    };\n    require(' + entryModuleId + ');\n})([' + modulesCodes.join("") + ']);\n\nfunction __extract_default__(module){\n    return module.__esModule ? module.default : module\n}\n\nfunction __set_esModule_flag__(exports){\n    exports.__esModule = true\n}\n\nfunction __extend__(...args){\n    Object.assign(...args)\n}\n\n';
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