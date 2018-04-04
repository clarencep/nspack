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
const less_module_resolver_1 = require("./less-module-resolver");
const path = require("path");
const debug = require('debug')('nspack.lessc');
const less = require('less');
var FragmentType;
(function (FragmentType) {
    FragmentType[FragmentType["Code"] = 1] = "Code";
    FragmentType[FragmentType["ImportStatement"] = 2] = "ImportStatement";
})(FragmentType || (FragmentType = {}));
const importRegex = /@import ["']([^"']*?)["'];/g; // todo: escape string??
function default_1(module, packer) {
    return __awaiter(this, void 0, void 0, function* () {
        module.builtType = 'css';
        if (!packer._lessModuleResolver) {
            packer._lessModuleResolver = new less_module_resolver_1.default(packer._config.resolve);
        }
        const source = module.source + '';
        const fragments = splitLessSource(source);
        packer.debugLevel > 4 &&
            fragments.forEach((x, i) => debug("!!!!!!!!!!!!!fragments[%o]: %o", i, x));
        const builtFragments = yield Promise.all(fragments.map(x => buildFragment(x, module, packer)));
        packer.debugLevel > 4 &&
            builtFragments.forEach((x, i) => debug("!!!!!!!!!!!!!builtFragments[%o]: %o", i, x));
        module.builtSource = builtFragments.join("");
        packer.debugLevel > 4 &&
            debug("module %o build result: %o", module.relativePath, module.builtSource);
    });
}
exports.default = default_1;
function splitLessSource(source) {
    const fragments = [];
    importRegex.lastIndex = 0;
    let i = 0, m;
    for (;;) {
        m = importRegex.exec(source);
        if (m) {
            if (m.index > 0) {
                fragments.push({
                    type: FragmentType.Code,
                    code: source.substring(i, m.index),
                });
            }
            fragments.push({
                type: FragmentType.ImportStatement,
                code: m[0],
                module: m[1],
            });
            i = importRegex.lastIndex;
        }
        else {
            if (i <= source.length) {
                fragments.push({
                    type: FragmentType.Code,
                    code: source.substring(i),
                });
            }
            break;
        }
    }
    return fragments;
}
function buildFragment(fragment, module, packer) {
    return __awaiter(this, void 0, void 0, function* () {
        if (fragment.type === FragmentType.Code) {
            if (fragment.code.length < 30 && isAllWhiteSpace(fragment.code)) {
                return '';
            }
            try {
                // debug("compile less code: %o", fragment.code)
                const r = yield less.render(fragment.code);
                return r.css;
            }
            catch (e) {
                debug(`Error: failed to compile %o, detail: %o`, module.fullPathName, e);
                throw new Error(`Error: failed to compile ${module.fullPathName}, detail:` + e);
            }
        }
        if (fragment.type === FragmentType.ImportStatement) {
            const importedModule = yield resolveLessModule.call(packer, fragment.module, module.fullFileDirName);
            module.dependencies.push(importedModule);
            return '\n/*' + importedModule.relativePath + '*/\n' + importedModule.builtSource;
        }
        throw new Error("Invalid fragment type: " + fragment.type);
    });
}
function resolveLessModule(moduleName, baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        this.debugLevel > 0 && debug(`resolving %o in %o`, moduleName, baseDir);
        const moduleFullPathName = yield resolveLessModuleFullPathName.call(this, moduleName, baseDir);
        if (!moduleFullPathName) {
            throw new Error(`failed tor resolve ${moduleName} in ${baseDir}`);
        }
        const module = yield this._addModuleIfNotExists({
            name: moduleName,
            baseDir: baseDir,
            fullPathName: moduleFullPathName,
        });
        return yield this._processModule(module);
    });
}
/**
 * @this packer
 */
function resolveLessModuleFullPathName(moduleName, baseDir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (moduleName[0] === '@') {
            return yield this._lessModuleResolver.resolveModuleFullPathName(path.join(this._config.entryBase, moduleName.substring(1)), '');
        }
        return yield this._lessModuleResolver.resolveModuleFullPathName(moduleName, baseDir);
    });
}
function isAllWhiteSpace(text) {
    return text.trim().length === 0;
}
