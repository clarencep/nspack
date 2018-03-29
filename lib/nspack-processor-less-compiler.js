var regeneratorRuntime = require("regenerator-runtime");
var buildFragment = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(fragment, module, packer) {
        var r, importedModule;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        if (!(fragment.type === FRAGMENT_TYPE_CODE)) {
                            _context2.next = 15;
                            break;
                        }

                        if (!(fragment.code.length < 30 && isAllWhiteSpace(fragment.code))) {
                            _context2.next = 3;
                            break;
                        }

                        return _context2.abrupt('return', '');

                    case 3:
                        _context2.prev = 3;
                        _context2.next = 6;
                        return less.render(fragment.code);

                    case 6:
                        r = _context2.sent;
                        return _context2.abrupt('return', r.css);

                    case 10:
                        _context2.prev = 10;
                        _context2.t0 = _context2['catch'](3);

                        console.error('Error: failed to compile ' + module.fullPathName + ', detail:');
                        console.error(_context2.t0);
                        throw new Error('Error: failed to compile ' + module.fullPathName + ', detail:' + _context2.t0);

                    case 15:
                        if (!(fragment.type === FRAGMENT_TYPE_IMPORT)) {
                            _context2.next = 21;
                            break;
                        }

                        _context2.next = 18;
                        return resolveLessModule.call(packer, fragment.module, module.fullFileDirName);

                    case 18:
                        importedModule = _context2.sent;


                        module.dependencies.push(importedModule);
                        return _context2.abrupt('return', '\n/*' + importedModule.relativePath + '*/\n' + importedModule.builtSource);

                    case 21:
                        throw new Error("Invalid fragment type: " + fragment.type);

                    case 22:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[3, 10]]);
    }));

    return function buildFragment(_x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
    };
}();

var resolveLessModule = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(moduleName, baseDir) {
        var moduleFullPathName, module;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        this.debugLevel > 0 && debug('resolving %o in %o', moduleName, baseDir);
                        _context3.next = 3;
                        return resolveLessModuleFullPathName.call(this, moduleName, baseDir);

                    case 3:
                        moduleFullPathName = _context3.sent;

                        if (moduleFullPathName) {
                            _context3.next = 6;
                            break;
                        }

                        throw new Error('failed tor resolve ' + moduleName + ' in ' + baseDir);

                    case 6:
                        _context3.next = 8;
                        return this._addModuleIfNotExists({
                            name: moduleName,
                            baseDir: baseDir,
                            fullPathName: moduleFullPathName
                        });

                    case 8:
                        module = _context3.sent;
                        _context3.next = 11;
                        return this._processModule(module);

                    case 11:
                        return _context3.abrupt('return', _context3.sent);

                    case 12:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function resolveLessModule(_x6, _x7) {
        return _ref3.apply(this, arguments);
    };
}();

/**
 * @this packer
 */


var resolveLessModuleFullPathName = function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(moduleName, baseDir) {
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        if (!(moduleName[0] === '@')) {
                            _context4.next = 4;
                            break;
                        }

                        _context4.next = 3;
                        return this._lessModuleResolver.resolveModuleFullPathName(path.join(this._config.entryBase, moduleName.substring(1)), '');

                    case 3:
                        return _context4.abrupt('return', _context4.sent);

                    case 4:
                        _context4.next = 6;
                        return this._lessModuleResolver.resolveModuleFullPathName(moduleName, baseDir);

                    case 6:
                        return _context4.abrupt('return', _context4.sent);

                    case 7:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function resolveLessModuleFullPathName(_x8, _x9) {
        return _ref4.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('nspack');
var less = require('less');
var LessModuleResolver = require('./less-module-resolver');

var importRegex = /@import ["']([^"']*?)["'];/g; // todo: escape string??

module.exports = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(module, packer) {
        var source, fragments, builtFragments;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        module.builtType = 'css';

                        if (!packer._lessModuleResolver) {
                            packer._lessModuleResolver = new LessModuleResolver();
                        }

                        source = module.source;
                        fragments = splitLessSource(source);


                        fragments.forEach(function (x, i) {
                            return debug("!!!!!!!!!!!!!fragments[%o]: %o", i, x);
                        });

                        _context.next = 7;
                        return Promise.all(fragments.map(function (x) {
                            return buildFragment(x, module, packer);
                        }));

                    case 7:
                        builtFragments = _context.sent;


                        builtFragments.forEach(function (x, i) {
                            return debug("!!!!!!!!!!!!!builtFragments[%o]: %o", i, x);
                        });

                        module.builtSource = builtFragments.join("");

                    case 10:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

var FRAGMENT_TYPE_CODE = 1;
var FRAGMENT_TYPE_IMPORT = 2;

function splitLessSource(source) {
    var fragments = [];

    importRegex.lastIndex = 0;

    var i = 0,
        m = void 0;

    for (;;) {
        m = importRegex.exec(source);
        if (m) {
            if (m.index > 0) {
                fragments.push({
                    type: FRAGMENT_TYPE_CODE,
                    code: source.substring(i, m.index)
                });
            }

            fragments.push({
                type: FRAGMENT_TYPE_IMPORT,
                code: m[0],
                module: m[1] // todo: escape string??
            });

            i = importRegex.lastIndex;
        } else {
            if (i <= source.length) {
                fragments.push({
                    type: FRAGMENT_TYPE_CODE,
                    code: source.substring(i)
                });
            }
            break;
        }
    }

    return fragments;
}

function isAllWhiteSpace(text) {
    return text.trim().length === 0;
}