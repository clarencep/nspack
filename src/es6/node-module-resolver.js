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
const path = require("path");
const cache_1 = require("./cache");
const utils_1 = require("./utils");
const pathSepRe = /[\\\/]/;
class NodeModuleResolver {
    constructor(options) {
        options = options || {};
        this._extensions = options.extensions || ['.js'];
        this._alias = this._compileAlias(options.alias);
        this._resolveCache = new cache_1.default();
        this._tryFileCache = new cache_1.default();
        this._aliasCache = new cache_1.default();
        this._packageJsonCache = new cache_1.default();
    }
    resolveModuleFullPathName(moduleName, baseDir) {
        return __awaiter(this, void 0, void 0, function* () {
            moduleName = this._expandAlias(moduleName);
            if (moduleName && path.isAbsolute(moduleName)) {
                return yield this._tryFile(moduleName);
            }
            if (moduleName[0] === '.') {
                return yield this._tryFile(path.join(baseDir, moduleName));
            }
            return this._resolveCache._remember(moduleName + '@' + baseDir, () => __awaiter(this, void 0, void 0, function* () {
                if (!baseDir) {
                    return yield this._tryFile(moduleName);
                }
                let baseDirParts = baseDir.split(pathSepRe);
                // try read node modules
                for (let n = baseDirParts.length; n > 0; n--) {
                    // debug(`============== n: ${n} ============`)
                    const r = yield this._tryFile(path.join(baseDirParts.slice(0, n).join(path.sep), 'node_modules', moduleName));
                    if (r) {
                        return r;
                    }
                }
            }));
        });
    }
    resetCache() {
        this._resolveCache.resetCache();
        this._tryFileCache.resetCache();
        this._aliasCache.resetCache();
        this._packageJsonCache.resetCache();
    }
    _tryFile(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._tryFileCache._remember(filepath, () => {
                return this._tryFileNoCache(filepath);
            });
        });
    }
    _tryFileNoCache(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileIsDir = false;
            const r = yield utils_1.tryFStat(filepath);
            if (r) {
                if (r.isFile()) {
                    return filepath;
                }
                fileIsDir = r.isDirectory();
            }
            // debug("file %o is directory: %o", filepath, fileIsDir)
            for (let extName of this._extensions) {
                // try jquery => jquery.js
                const jsFile = filepath + extName;
                const r2 = yield utils_1.tryFStat(jsFile);
                if (r2 && r2.isFile()) {
                    return jsFile;
                }
            }
            if (fileIsDir) {
                // try "main" script in the package.json
                let packageJson = yield this._readPackageJson(path.join(filepath, 'package.json'));
                // debug("packageJson in %o: %o", filepath, packageJson)
                if (packageJson) {
                    return yield this._tryFile(path.join(filepath, packageJson.main || 'index'));
                }
                else {
                    // try index.js in the directory
                    const dirIndexJs = path.join(filepath, 'index.js');
                    const r3 = yield utils_1.tryFStat(dirIndexJs);
                    if (r3 && r3.isFile()) {
                        return dirIndexJs;
                    }
                }
            }
            return '';
        });
    }
    _readPackageJson(jsonPath) {
        return this._packageJsonCache._remember(jsonPath, () => __awaiter(this, void 0, void 0, function* () {
            const data = yield utils_1.tryReadJsonFileContent(jsonPath);
            // return data
            return { main: data ? data.main : undefined };
        }));
    }
    _compileAlias(aliases) {
        if (!aliases) {
            return { resolveAll: x => x };
        }
        let firstCharCodes = {};
        let r = [];
        const reExp = [];
        Object.keys(aliases).forEach(aliasName => {
            const aliasNameLen = aliasName.length;
            const realName = aliases[aliasName];
            const item = {
                aliasName,
                aliasNameLen,
                search: aliasName,
                searchLen: aliasNameLen,
                replacement: realName,
                isFullMatch: false,
            };
            if (aliasName[aliasNameLen - 1] === '$') {
                item.search = aliasName.substr(0, aliasNameLen - 1);
                item.searchLen = item.search.length;
                item.isFullMatch = true;
            }
            firstCharCodes[aliasName.charCodeAt(0)] = true;
            r.push(item);
        });
        // sort by alias name length DESC
        r = r.sort((a, b) => b.aliasNameLen - a.aliasNameLen);
        const resolveOnce = (x) => {
            if (!firstCharCodes[x.charCodeAt(0)]) {
                return x;
            }
            const xLen = x.length;
            for (let item of r) {
                if (item.searchLen < xLen) {
                    if (!item.isFullMatch && item.search === x.substr(0, item.searchLen)) {
                        return item.replacement + x.substr(item.searchLen);
                    } // else: no match
                }
                else if (item.searchLen === xLen) {
                    if (item.search === x) {
                        return item.replacement;
                    } // else: no match
                } // else: no match
            }
            return x;
        };
        const resolveAll = (x, maxDepth = 10) => {
            if (maxDepth <= 0) {
                throw new Error("max depth reached when resolving alias for " + x);
            }
            const y = resolveOnce(x);
            if (y !== x) {
                return resolveAll(y, maxDepth - 1);
            }
            return y;
        };
        r.forEach(item => {
            item.replacement = resolveAll(item.replacement);
        });
        return { resolveAll };
    }
    _expandAlias(alias) {
        return this._aliasCache._remember(alias, () => {
            return this._expandAliasNoCache(alias);
        });
    }
    _expandAliasNoCache(alias) {
        return this._alias.resolveAll(alias);
    }
}
exports.default = NodeModuleResolver;
// NodeModuleResolver.prototype.resolveModuleFullPathName = decorate(NodeModuleResolver.prototype.resolveModuleFullPathName, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })
// NodeModuleResolver.prototype._tryFileNoCache = decorate(NodeModuleResolver.prototype._tryFileNoCache, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! _tryFileNoCache(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _tryFileNoCache(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })
// NodeModuleResolver.prototype._tryFile = decorate(NodeModuleResolver.prototype._tryFile, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! _tryFile(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _tryFile(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })
// NodeModuleResolver.prototype._expandAliasNoCache = decorate(NodeModuleResolver.prototype._expandAliasNoCache, function(oldFunc, ...args){
//     // debug("!!!!!!!!!!! _expandAlias(%o) !!!!!!!!!!!", args)
//     const res = oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _expandAlias(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })
function decorate(oldFunc, newFunc) {
    return function (...args) {
        return newFunc.call(this, oldFunc, ...args);
    };
}
