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

module.exports = LessModuleResolver;

function LessModuleResolver() {
    if (!(this instanceof LessModuleResolver)) {
        return new LessModuleResolver();
    }

    this._cache = {};

    return this;
}

extend(LessModuleResolver.prototype, {
    resolveModuleFullPathName: function resolveModuleFullPathName(moduleName, baseDir) {
        var _this = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            if (!(moduleName[0] === '.')) {
                                _context.next = 4;
                                break;
                            }

                            _context.next = 3;
                            return _this._tryFileCached(path.join(baseDir, moduleName));

                        case 3:
                            return _context.abrupt('return', _context.sent);

                        case 4:
                            if (baseDir) {
                                _context.next = 8;
                                break;
                            }

                            _context.next = 7;
                            return _this._tryFileCached(moduleName);

                        case 7:
                            return _context.abrupt('return', _context.sent);

                        case 8:
                            throw new Error('Cannot resolve ' + moduleName + ' in ' + baseDir);

                        case 9:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this);
        }))();
    },
    resetCache: function resetCache() {
        this._cache = {};
    },

    // _remember(cacheKey, loadFunc){
    //     return loadFunc()
    // },
    _remember: function _remember(cacheKey, loadFunc) {
        var _this2 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            if (!(cacheKey in _this2._cache)) {
                                _context2.next = 2;
                                break;
                            }

                            return _context2.abrupt('return', _this2._cache[cacheKey]);

                        case 2:
                            _context2.next = 4;
                            return loadFunc();

                        case 4:
                            return _context2.abrupt('return', _this2._cache[cacheKey] = _context2.sent);

                        case 5:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this2);
        }))();
    },
    _tryFileCached: function _tryFileCached(filepath) {
        var _this3 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            return _context3.abrupt('return', _this3._remember('resolve:' + filepath, function () {
                                return _this3._tryFile(filepath);
                            }));

                        case 1:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, _this3);
        }))();
    },
    _tryFile: function _tryFile(filepath) {
        var _this4 = this;

        return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
            var r, lessFile, r2, cssFile, r3;
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            _context4.next = 2;
                            return tryFStat(filepath);

                        case 2:
                            r = _context4.sent;

                            if (!(r && r.isFile())) {
                                _context4.next = 5;
                                break;
                            }

                            return _context4.abrupt('return', filepath);

                        case 5:

                            // try foo => foo.less
                            lessFile = filepath + '.less';
                            _context4.next = 8;
                            return tryFStat(lessFile);

                        case 8:
                            r2 = _context4.sent;

                            if (!(r2 && r2.isFile())) {
                                _context4.next = 11;
                                break;
                            }

                            return _context4.abrupt('return', lessFile);

                        case 11:

                            // try foo => foo.css
                            cssFile = filepath + '.css';
                            _context4.next = 14;
                            return tryFStat(cssFile);

                        case 14:
                            r3 = _context4.sent;

                            if (!(r3 && r3.isFile())) {
                                _context4.next = 17;
                                break;
                            }

                            return _context4.abrupt('return', cssFile);

                        case 17:
                            return _context4.abrupt('return', false);

                        case 18:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, _this4);
        }))();
    }
});