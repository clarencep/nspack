var regeneratorRuntime = require("regenerator-runtime");
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('nspack');
var jsVarRegex = /^[a-zA-Z0-9_$]+$/;

module.exports = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(module, packer) {
        var processRequires, dependenciesProcesses, resolvingModules, resolvingModulesByPlaceholderId, nextPlaceholderId, lineRegexHandlers, lines, i, n, line, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, handler, _i, _n, builtSource2;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        packer.debugLevel > 1 && debug("process module %o", module.fullPathName);
                        module.builtType = 'js';

                        if (module.source) {
                            _context.next = 5;
                            break;
                        }

                        module.builtSource = module.source;
                        return _context.abrupt('return');

                    case 5:
                        processRequires = true;
                        dependenciesProcesses = [];
                        resolvingModules = {};
                        resolvingModulesByPlaceholderId = {};
                        nextPlaceholderId = 1;
                        lineRegexHandlers = getJsLinesRegexHandlers(function (reqModuleNameStrLiteral, strQuote) {
                            var reqModuleName = parseJsStr(reqModuleNameStrLiteral, strQuote);

                            if (reqModuleName in resolvingModules) {
                                return resolvingModules[reqModuleName].idPlaceholder;
                            }

                            var idPlaceholderId = nextPlaceholderId++;
                            var idPlaceholder = '__' + idPlaceholderId + '_MODULE_ID_PLACEHOLDER__';

                            var resolvingInfo = {
                                idPlaceholder: idPlaceholder,
                                resolving: packer._resolveModule(reqModuleName, module.fullFileDirName).then(function (reqModule) {
                                    resolvingInfo.id = reqModule.id;
                                    module.dependencies.push(reqModule);
                                    dependenciesProcesses.push(packer._processModule(reqModule));
                                })
                            };

                            resolvingModules[reqModuleName] = resolvingModulesByPlaceholderId[idPlaceholderId] = resolvingInfo;

                            return idPlaceholder;
                        });
                        lines = module.source.split("\n");
                        i = 0, n = lines.length;

                    case 13:
                        if (!(i < n)) {
                            _context.next = 44;
                            break;
                        }

                        line = lines[i];

                        if (!processRequires) {
                            _context.next = 39;
                            break;
                        }

                        processRequires = line.indexOf('//#!DONT_PROCESS_REQUIRES') < 0;

                        if (!processRequires) {
                            _context.next = 37;
                            break;
                        }

                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context.prev = 21;

                        for (_iterator = lineRegexHandlers[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            handler = _step.value;

                            line = line.replace(handler[0], handler[1]);
                        }
                        _context.next = 29;
                        break;

                    case 25:
                        _context.prev = 25;
                        _context.t0 = _context['catch'](21);
                        _didIteratorError = true;
                        _iteratorError = _context.t0;

                    case 29:
                        _context.prev = 29;
                        _context.prev = 30;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }

                    case 32:
                        _context.prev = 32;

                        if (!_didIteratorError) {
                            _context.next = 35;
                            break;
                        }

                        throw _iteratorError;

                    case 35:
                        return _context.finish(32);

                    case 36:
                        return _context.finish(29);

                    case 37:
                        _context.next = 40;
                        break;

                    case 39:
                        processRequires = line.indexOf('//#!DO_PROCESS_REQUIRES') < 0;

                    case 40:

                        lines[i] = line;

                    case 41:
                        i++;
                        _context.next = 13;
                        break;

                    case 44:

                        packer.debugLevel > 1 && debug("process module %o: %o", module.fullPathName, { resolvingModules: resolvingModules, resolvingModulesByPlaceholderId: resolvingModulesByPlaceholderId });

                        _context.next = 47;
                        return Promise.all(Object.values(resolvingModules).map(function (x) {
                            return x.resolving;
                        }));

                    case 47:

                        for (_i = 0, _n = lines.length; _i < _n; _i++) {
                            lines[_i] = lines[_i].replace(/__(\d+)_MODULE_ID_PLACEHOLDER__/g, function ($0, $1) {
                                return resolvingModulesByPlaceholderId[+$1].id;
                            });
                        }

                        module.builtSource = lines.join("\n");

                        // mark ES module:
                        builtSource2 = module.builtSource.replace(/__ES_MODULE__/g, '');

                        if (builtSource2.length !== module.builtSource.length) {
                            module.builtSource = "__set_esModule_flag__(exports)\n" + builtSource2;
                        }

                        _context.next = 53;
                        return Promise.all(dependenciesProcesses);

                    case 53:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[21, 25, 29, 37], [30,, 32, 36]]);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

function getJsLinesRegexHandlers(resolveModuleId) {
    return [[/\/\/.*$/, function () {
        return '';
    }], [
    // const foo = require('bar');
    // [0] => " require('bar')"
    // [1] => " "
    // [2] => "'"
    // [3] => "bar"
    /(^|[^0-9a-zA-Z_.$])require\s*\(\s*(['"`])(\S+?)['"`]\s*\)/, function ($0, $1, $2, $3) {
        return $1 + ' __require_module__(' + resolveModuleId($3, $2) + '/*' + $3 + '*/)';
    }], [
    // import * as foo from 'bar';
    // [0] => `import * as foo from 'bar'`
    // [2] => `foo`
    // [3] => `'`
    // [4] => `bar`
    /(^|[^0-9a-zA-Z_.$])import\s+\*\s+as\s+(\S+)\s+from\s+(['"`])(\S+?)['"`]/, function ($0, $1, $2, $3, $4) {
        return $1 + 'const ' + $2 + ' = __require_module__(' + resolveModuleId($4, $3) + ')';
    }], [
    // import foo from 'bar';
    // [0] => `import foo from 'bar'`
    // [2] => `foo`
    // [3] => `'`
    // [4] => `bar`
    // 
    // import {foo, goo} from 'bar';
    // [0] => `import {foo, goo} from 'bar'`
    // [2] => `{foo, goo}`
    // [3] => `'`
    // [4] => `bar`
    /(^|[^0-9a-zA-Z_.$])import\s+(.+?)\s+from\s+(['"`])(\S+?)['"`]/, function ($0, $1, $2, $3, $4) {
        return jsVarRegex.test($2) ? $1 + 'const ' + $2 + ' = __extract_default__(__require_module__(' + resolveModuleId($4, $3) + '))' : $1 + 'const ' + $2 + ' = __require_module__(' + resolveModuleId($4, $3) + ')';
    }], [
    // export default xxx
    // -> module.exports = xxx
    /(^|[^0-9a-zA-Z_.$])export\s+default\s+/, function ($0, $1) {
        return $1 + '__ES_MODULE__; exports.default = ';
    }],
    // todo: export xxx
    [
    // limit: only one variable in the export statement line.
    //        and each export statement must be in a individual line.
    // export let foo = bar
    // export var foo = bar
    // export const foo = bar
    // -> let|var|const foo = exports.foo = bar
    // [0]: `export let foo =`
    // [2]: `let`
    // [3]: `foo`
    /(^|[^0-9a-zA-Z_.$])export\s+(let|var|const)\s+([a-zA-Z0-9_$]+?)\s*=/, function ($0, $1, $2, $3) {
        return $1 + '__ES_MODULE__; ' + $2 + ' ' + $3 + ' = exports.' + $3 + ' =';
    }], [
    // export function foo (...
    // -> exports.foo = function foo (...
    // [0]: `export function foo (`
    // [2]: foo
    /(^|[^0-9a-zA-Z_.$])export\s+function\s+([a-zA-Z0-9_$]+?)\s*\(/, function ($0, $1, $2) {
        return $1 + '__ES_MODULE__; exports.' + $2 + ' = function ' + $2 + '(';
    }], [
    // export class Foo {...
    /(^|[^0-9a-zA-Z_.$])export\s+class\s+([a-zA-Z0-9_$]+?)\s*\{/, function ($0, $1, $2) {
        return $1 + '__ES_MODULE__; exports.' + $2 + ' = class ' + $2 + '{';
    }]];
}

function parseJsStr(strLiteral, strQuote) {
    // todo...
    return strLiteral;
}