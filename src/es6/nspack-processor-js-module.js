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
const debug = require('debug')('nspack');
const jsVarRegex = /^[a-zA-Z0-9_$]+$/;
const allCommentLineRegex = /^\s+(\/\/)/;
function default_1(module, packer) {
    return __awaiter(this, void 0, void 0, function* () {
        packer.debugLevel > 1 && debug("process module %o", module.fullPathName);
        module.builtType = 'js';
        if (!module.source) {
            module.builtSource = module.source;
            return;
        }
        let processRequires = true;
        let dependenciesProcesses = [];
        let resolvingModules = {};
        let resolvingModulesByPlaceholderId = {};
        let nextPlaceholderId = 1;
        const lineRegexHandlers = getJsLinesRegexHandlers((reqModuleNameStrLiteral, strQuote) => {
            const reqModuleName = parseJsStr(reqModuleNameStrLiteral, strQuote);
            if (reqModuleName in resolvingModules) {
                return resolvingModules[reqModuleName].idPlaceholder;
            }
            const idPlaceholderId = nextPlaceholderId++;
            const idPlaceholder = `__${idPlaceholderId}_MODULE_ID_PLACEHOLDER__`;
            const resolvingInfo = {
                id: 0,
                idPlaceholder,
                resolving: packer._resolveModule(reqModuleName, module.fullFileDirName, module.resolvingParentsAndSelf)
                    .then(reqModule => {
                    resolvingInfo.id = reqModule.id;
                    module.dependencies.push(reqModule);
                    dependenciesProcesses.push(packer._processModule(reqModule));
                })
            };
            resolvingModules[reqModuleName] = resolvingModulesByPlaceholderId[idPlaceholderId] = resolvingInfo;
            return idPlaceholder;
        });
        const lines = (module.source + '').split("\n");
        for (let i = 0, n = lines.length; i < n; i++) {
            let line = lines[i];
            if (processRequires) {
                processRequires = line.indexOf('//#!DONT_PROCESS_REQUIRES') < 0;
                if (processRequires && !isAllCommentLine(line)) {
                    for (let handler of lineRegexHandlers) {
                        line = line.replace(handler[0], handler[1]);
                    }
                }
            }
            else {
                processRequires = line.indexOf('//#!DO_PROCESS_REQUIRES') < 0;
            }
            lines[i] = line;
        }
        packer.debugLevel > 1 && debug("process module %o: %o", module.fullPathName, { resolvingModules, resolvingModulesByPlaceholderId });
        yield Promise.all(Object.values(resolvingModules).map((x) => x.resolving));
        for (let i = 0, n = lines.length; i < n; i++) {
            lines[i] = lines[i].replace(/__(\d+)_MODULE_ID_PLACEHOLDER__/g, ($0, $1) => resolvingModulesByPlaceholderId[+$1].id);
        }
        module.builtSource = lines.join("\n");
        // mark ES module:
        const builtSource2 = module.builtSource.replace(/__ES_MODULE__/g, '');
        if (builtSource2.length !== module.builtSource.length) {
            module.builtSource = "__set_esModule_flag__(exports)\n" + builtSource2;
        }
        yield Promise.all(dependenciesProcesses);
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
            ($0, $1, $2, $3) => `${$1} __require_module__(${resolveModuleId($3, $2)}/*${$3}*/)`,
        ],
        [
            // import 'bar';
            // [0] => `import 'bar'`
            // [2] => `'`
            // [3] => `bar`
            /(^|[^0-9a-zA-Z_.$])import\s*(['"`])(\S+?)['"`]/,
            ($0, $1, $2, $3) => `${$1}__require_module__(${resolveModuleId($3, $2)})`,
        ],
        [
            // import * as foo from 'bar';
            // [0] => `import * as foo from 'bar'`
            // [2] => `foo`
            // [3] => `'`
            // [4] => `bar`
            /(^|[^0-9a-zA-Z_.$])import\s+\*\s+as\s+(\S+)\s+from\s+(['"`])(\S+?)['"`]/,
            ($0, $1, $2, $3, $4) => `${$1}const ${$2} = __require_module__(${resolveModuleId($4, $3)})`,
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
            ($0, $1, $2, $3, $4) => (jsVarRegex.test($2)
                ? `${$1}const ${$2} = __extract_default__(__require_module__(${resolveModuleId($4, $3)}))`
                : `${$1}const ${convertImportAsToObjectAssign($2)} = __require_module__(${resolveModuleId($4, $3)})`),
        ],
        [
            // export default xxx
            // -> module.exports = xxx
            /(^|[^0-9a-zA-Z_.$])export\s+default($|[^0-9a-zA-Z_.$])/,
            ($0, $1, $2) => `${$1}__ES_MODULE__; exports.default = ${$2}`,
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
            ($0, $1, $2, $3) => `${$1}__ES_MODULE__; ${$2} ${$3} = exports.${$3} =`,
        ],
        [
            // export function foo (...
            // -> exports.foo = function foo (...
            // [0]: `export function foo (`
            // [2]: foo
            /(^|[^0-9a-zA-Z_.$])export\s+function\s+([a-zA-Z0-9_$]+?)\s*\(/,
            ($0, $1, $2) => `${$1}__ES_MODULE__; exports.${$2} = function ${$2}(`,
        ],
        [
            // export class Foo {...
            /(^|[^0-9a-zA-Z_.$])export\s+class\s+([a-zA-Z0-9_$]+?)\s*\{/,
            ($0, $1, $2) => `${$1}__ES_MODULE__; exports.${$2} = class ${$2}{`,
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
function isAllCommentLine(s) {
    return allCommentLineRegex.test(s);
}
