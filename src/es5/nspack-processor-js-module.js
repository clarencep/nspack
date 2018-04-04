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
var debug = require('debug')('nspack');
var jsVarRegex = /^[a-zA-Z0-9_$]+$/;
function default_1(module, packer) {
    return __awaiter(this, void 0, void 0, function () {
        var processRequires, dependenciesProcesses, resolvingModules, resolvingModulesByPlaceholderId, nextPlaceholderId, lineRegexHandlers, lines, i, n, line, _i, lineRegexHandlers_1, handler, i, n, builtSource2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    packer.debugLevel > 1 && debug("process module %o", module.fullPathName);
                    module.builtType = 'js';
                    if (!module.source) {
                        module.builtSource = module.source;
                        return [2 /*return*/];
                    }
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
                        var idPlaceholder = "__" + idPlaceholderId + "_MODULE_ID_PLACEHOLDER__";
                        var resolvingInfo = {
                            id: 0,
                            idPlaceholder: idPlaceholder,
                            resolving: packer._resolveModule(reqModuleName, module.fullFileDirName, module.resolvingParentsAndSelf)
                                .then(function (reqModule) {
                                resolvingInfo.id = reqModule.id;
                                module.dependencies.push(reqModule);
                                dependenciesProcesses.push(packer._processModule(reqModule));
                            })
                        };
                        resolvingModules[reqModuleName] = resolvingModulesByPlaceholderId[idPlaceholderId] = resolvingInfo;
                        return idPlaceholder;
                    });
                    lines = (module.source + '').split("\n");
                    for (i = 0, n = lines.length; i < n; i++) {
                        line = lines[i];
                        if (processRequires) {
                            processRequires = line.indexOf('//#!DONT_PROCESS_REQUIRES') < 0;
                            if (processRequires) {
                                for (_i = 0, lineRegexHandlers_1 = lineRegexHandlers; _i < lineRegexHandlers_1.length; _i++) {
                                    handler = lineRegexHandlers_1[_i];
                                    line = line.replace(handler[0], handler[1]);
                                }
                            }
                        }
                        else {
                            processRequires = line.indexOf('//#!DO_PROCESS_REQUIRES') < 0;
                        }
                        lines[i] = line;
                    }
                    packer.debugLevel > 1 && debug("process module %o: %o", module.fullPathName, { resolvingModules: resolvingModules, resolvingModulesByPlaceholderId: resolvingModulesByPlaceholderId });
                    return [4 /*yield*/, Promise.all(Object.values(resolvingModules).map(function (x) { return x.resolving; }))];
                case 1:
                    _a.sent();
                    for (i = 0, n = lines.length; i < n; i++) {
                        lines[i] = lines[i].replace(/__(\d+)_MODULE_ID_PLACEHOLDER__/g, function ($0, $1) { return resolvingModulesByPlaceholderId[+$1].id; });
                    }
                    module.builtSource = lines.join("\n");
                    builtSource2 = module.builtSource.replace(/__ES_MODULE__/g, '');
                    if (builtSource2.length !== module.builtSource.length) {
                        module.builtSource = "__set_esModule_flag__(exports)\n" + builtSource2;
                    }
                    return [4 /*yield*/, Promise.all(dependenciesProcesses)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = default_1;
function getJsLinesRegexHandlers(resolveModuleId) {
    return [
        // todo: how to remove comments, but don't hurt URL string and RegExp??
        // [
        //     /\/\/.*$/,
        //     () => '',
        // ],
        [
            // const foo = require('bar');
            // [0] => " require('bar')"
            // [1] => " "
            // [2] => "'"
            // [3] => "bar"
            /(^|[^0-9a-zA-Z_.$])require\s*\(\s*(['"`])(\S+?)['"`]\s*\)/,
            function ($0, $1, $2, $3) { return $1 + " __require_module__(" + resolveModuleId($3, $2) + "/*" + $3 + "*/)"; },
        ],
        [
            // import * as foo from 'bar';
            // [0] => `import * as foo from 'bar'`
            // [2] => `foo`
            // [3] => `'`
            // [4] => `bar`
            /(^|[^0-9a-zA-Z_.$])import\s+\*\s+as\s+(\S+)\s+from\s+(['"`])(\S+?)['"`]/,
            function ($0, $1, $2, $3, $4) { return $1 + "const " + $2 + " = __require_module__(" + resolveModuleId($4, $3) + ")"; },
        ],
        [
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
            /(^|[^0-9a-zA-Z_.$])import\s+(.+?)\s+from\s+(['"`])(\S+?)['"`]/,
            function ($0, $1, $2, $3, $4) { return (jsVarRegex.test($2)
                ? $1 + "const " + $2 + " = __extract_default__(__require_module__(" + resolveModuleId($4, $3) + "))"
                : $1 + "const " + convertImportAsToObjectAssign($2) + " = __require_module__(" + resolveModuleId($4, $3) + ")"); },
        ],
        [
            // export default xxx
            // -> module.exports = xxx
            /(^|[^0-9a-zA-Z_.$])export\s+default\s+/,
            function ($0, $1) { return $1 + "__ES_MODULE__; exports.default = "; },
        ],
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
            /(^|[^0-9a-zA-Z_.$])export\s+(let|var|const)\s+([a-zA-Z0-9_$]+?)\s*=/,
            function ($0, $1, $2, $3) { return $1 + "__ES_MODULE__; " + $2 + " " + $3 + " = exports." + $3 + " ="; },
        ],
        [
            // export function foo (...
            // -> exports.foo = function foo (...
            // [0]: `export function foo (`
            // [2]: foo
            /(^|[^0-9a-zA-Z_.$])export\s+function\s+([a-zA-Z0-9_$]+?)\s*\(/,
            function ($0, $1, $2) { return $1 + "__ES_MODULE__; exports." + $2 + " = function " + $2 + "("; },
        ],
        [
            // export class Foo {...
            /(^|[^0-9a-zA-Z_.$])export\s+class\s+([a-zA-Z0-9_$]+?)\s*\{/,
            function ($0, $1, $2) { return $1 + "__ES_MODULE__; exports." + $2 + " = class " + $2 + "{"; },
        ],
    ];
}
function parseJsStr(strLiteral, strQuote) {
    // todo...
    return strLiteral;
}
function convertImportAsToObjectAssign(s) {
    return s.replace(/\bas\b/g, ':');
}
