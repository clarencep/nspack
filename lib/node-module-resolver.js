var regeneratorRuntime = require("regenerator-runtime");
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');
var path = require('path');
var cb2p = require('./cb2p');
var debug = require('debug')('nspack');

var extend = Object.assign;

var readFile = cb2p(fs.readFile);

var _require = require('./utils'),
    tryFStat = _require.tryFStat,
    tryReadJsonFileContent = _require.tryReadJsonFileContent;

module.exports = NodeModuleResolver;

function NodeModuleResolver() {
    if (!(this instanceof NodeModuleResolver)) {
        return new NodeModuleResolver();
    }

    this._cache = {};

    return this;
}

extend(NodeModuleResolver.prototype, {
    resolveModuleFullPathName: function resolveModuleFullPathName(moduleName, baseDir) {
        var _this = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            if (!(moduleName[0] === '.')) {
                                _context2.next = 2;
                                break;
                            }

                            return _context2.abrupt('return', path.join(baseDir, moduleName));

                        case 2:
                            return _context2.abrupt('return', _this._remember('module:' + moduleName + '@' + baseDir, _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                                var baseDirParts, n, r;
                                return regeneratorRuntime.wrap(function _callee$(_context) {
                                    while (1) {
                                        switch (_context.prev = _context.next) {
                                            case 0:
                                                baseDirParts = baseDir.split(path.sep);

                                                // try read node modules

                                                n = baseDirParts.length - 1;

                                            case 2:
                                                if (!(n > 0)) {
                                                    _context.next = 11;
                                                    break;
                                                }

                                                _context.next = 5;
                                                return _this._tryFileCached(path.join(baseDirParts.slice(0, n).join(path.sep), 'node_modules', moduleName));

                                            case 5:
                                                r = _context.sent;

                                                if (!r) {
                                                    _context.next = 8;
                                                    break;
                                                }

                                                return _context.abrupt('return', r);

                                            case 8:
                                                n--;
                                                _context.next = 2;
                                                break;

                                            case 11:
                                            case 'end':
                                                return _context.stop();
                                        }
                                    }
                                }, _callee, _this);
                            }))));

                        case 3:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this);
        }))();
    },
    _remember: function _remember(cacheKey, loadFunc) {
        var _this2 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            if (!(cacheKey in _this2._cache)) {
                                _context3.next = 2;
                                break;
                            }

                            return _context3.abrupt('return', _this2._cache[cacheKey]);

                        case 2:
                            _context3.next = 4;
                            return loadFunc();

                        case 4:
                            return _context3.abrupt('return', _this2._cache[cacheKey] = _context3.sent);

                        case 5:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, _this2);
        }))();
    },
    _tryFileCached: function _tryFileCached(filepath) {
        var _this3 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            return _context4.abrupt('return', _this3._remember('resolve:' + filepath, function () {
                                return _this3._tryFile(filepath);
                            }));

                        case 1:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, _this3);
        }))();
    },
    _tryFile: function _tryFile(filepath) {
        var _this4 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
            var fileIsDir, r, r2, packageJson, dirIndexJs, r3;
            return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                    switch (_context5.prev = _context5.next) {
                        case 0:
                            fileIsDir = false;

                            // try directly the file

                            _context5.next = 3;
                            return tryFStat(filepath);

                        case 3:
                            r = _context5.sent;

                            if (!r) {
                                _context5.next = 8;
                                break;
                            }

                            if (!r.isFile()) {
                                _context5.next = 7;
                                break;
                            }

                            return _context5.abrupt('return', filepath);

                        case 7:

                            fileIsDir = r.isDirectory();

                        case 8:

                            // try jquery => jquery.js
                            jsFile = filepath + '.js';
                            _context5.next = 11;
                            return tryFStat(jsFile);

                        case 11:
                            r2 = _context5.sent;

                            if (!(r2 && r2.isFile())) {
                                _context5.next = 14;
                                break;
                            }

                            return _context5.abrupt('return', jsFile);

                        case 14:
                            if (!fileIsDir) {
                                _context5.next = 28;
                                break;
                            }

                            // try "main" script in the package.json
                            packageJson = tryReadJsonFileContent(path.join(filepath, 'package.json'));

                            if (!packageJson) {
                                _context5.next = 22;
                                break;
                            }

                            _context5.next = 19;
                            return _this4._tryFile(path.join(filepath, packageJson.main || 'index.js'));

                        case 19:
                            return _context5.abrupt('return', _context5.sent);

                        case 22:
                            // try index.js in the directory
                            dirIndexJs = path.join(filepath, 'index.js');
                            _context5.next = 25;
                            return tryFStat(dirIndexJs);

                        case 25:
                            r3 = _context5.sent;

                            if (!(r3 && r3.isFile())) {
                                _context5.next = 28;
                                break;
                            }

                            return _context5.abrupt('return', dirIndexJs);

                        case 28:
                            return _context5.abrupt('return', false);

                        case 29:
                        case 'end':
                            return _context5.stop();
                    }
                }
            }, _callee5, _this4);
        }))();
    }
});