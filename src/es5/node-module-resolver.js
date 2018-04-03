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
var path = require("path");
var cache_1 = require("./cache");
var utils_1 = require("./utils");
var pathSepRe = /[\\\/]/;
var NodeModuleResolver = /** @class */ (function () {
    function NodeModuleResolver(options) {
        options = options || {};
        this._extensions = options.extensions || ['.js'];
        this._alias = this._compileAlias(options.alias);
        this._resolveCache = new cache_1.default();
        this._tryFileCache = new cache_1.default();
        this._aliasCache = new cache_1.default();
        this._packageJsonCache = new cache_1.default();
    }
    NodeModuleResolver.prototype.resolveModuleFullPathName = function (moduleName, baseDir) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        moduleName = this._expandAlias(moduleName);
                        if (!(moduleName && path.isAbsolute(moduleName))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._tryFile(moduleName)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        if (!(moduleName[0] === '.')) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._tryFile(path.join(baseDir, moduleName))];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4: return [2 /*return*/, this._resolveCache._remember(moduleName + '@' + baseDir, function () { return __awaiter(_this, void 0, void 0, function () {
                            var baseDirParts, n, r;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!!baseDir) return [3 /*break*/, 2];
                                        return [4 /*yield*/, this._tryFile(moduleName)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                    case 2:
                                        baseDirParts = baseDir.split(pathSepRe);
                                        n = baseDirParts.length;
                                        _a.label = 3;
                                    case 3:
                                        if (!(n > 0)) return [3 /*break*/, 6];
                                        return [4 /*yield*/, this._tryFile(path.join(baseDirParts.slice(0, n).join(path.sep), 'node_modules', moduleName))];
                                    case 4:
                                        r = _a.sent();
                                        if (r) {
                                            return [2 /*return*/, r];
                                        }
                                        _a.label = 5;
                                    case 5:
                                        n--;
                                        return [3 /*break*/, 3];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); })];
                }
            });
        });
    };
    NodeModuleResolver.prototype.resetCache = function () {
        this._resolveCache.resetCache();
        this._tryFileCache.resetCache();
        this._aliasCache.resetCache();
        this._packageJsonCache.resetCache();
    };
    NodeModuleResolver.prototype._tryFile = function (filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this._tryFileCache._remember(filepath, function () {
                        return _this._tryFileNoCache(filepath);
                    })];
            });
        });
    };
    NodeModuleResolver.prototype._tryFileNoCache = function (filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var fileIsDir, r, _i, _a, extName, jsFile, r2, packageJson, dirIndexJs, r3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        fileIsDir = false;
                        return [4 /*yield*/, utils_1.tryFStat(filepath)];
                    case 1:
                        r = _b.sent();
                        if (r) {
                            if (r.isFile()) {
                                return [2 /*return*/, filepath];
                            }
                            fileIsDir = r.isDirectory();
                        }
                        _i = 0, _a = this._extensions;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        extName = _a[_i];
                        jsFile = filepath + extName;
                        return [4 /*yield*/, utils_1.tryFStat(jsFile)];
                    case 3:
                        r2 = _b.sent();
                        if (r2 && r2.isFile()) {
                            return [2 /*return*/, jsFile];
                        }
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        if (!fileIsDir) return [3 /*break*/, 10];
                        return [4 /*yield*/, this._readPackageJson(path.join(filepath, 'package.json'))
                            // debug("packageJson in %o: %o", filepath, packageJson)
                        ];
                    case 6:
                        packageJson = _b.sent();
                        if (!packageJson) return [3 /*break*/, 8];
                        return [4 /*yield*/, this._tryFile(path.join(filepath, packageJson.main || 'index'))];
                    case 7: return [2 /*return*/, _b.sent()];
                    case 8:
                        dirIndexJs = path.join(filepath, 'index.js');
                        return [4 /*yield*/, utils_1.tryFStat(dirIndexJs)];
                    case 9:
                        r3 = _b.sent();
                        if (r3 && r3.isFile()) {
                            return [2 /*return*/, dirIndexJs];
                        }
                        _b.label = 10;
                    case 10: return [2 /*return*/, ''];
                }
            });
        });
    };
    NodeModuleResolver.prototype._readPackageJson = function (jsonPath) {
        var _this = this;
        return this._packageJsonCache._remember(jsonPath, function () { return __awaiter(_this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, utils_1.tryReadJsonFileContent(jsonPath)
                        // return data
                    ];
                    case 1:
                        data = _a.sent();
                        // return data
                        return [2 /*return*/, { main: data ? data.main : undefined }];
                }
            });
        }); });
    };
    NodeModuleResolver.prototype._compileAlias = function (aliases) {
        if (!aliases) {
            return { resolveAll: function (x) { return x; } };
        }
        var firstCharCodes = {};
        var r = [];
        var reExp = [];
        Object.keys(aliases).forEach(function (aliasName) {
            var aliasNameLen = aliasName.length;
            var realName = aliases[aliasName];
            var item = {
                aliasName: aliasName,
                aliasNameLen: aliasNameLen,
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
        r = r.sort(function (a, b) { return b.aliasNameLen - a.aliasNameLen; });
        var resolveOnce = function (x) {
            if (!firstCharCodes[x.charCodeAt(0)]) {
                return x;
            }
            var xLen = x.length;
            for (var _i = 0, r_1 = r; _i < r_1.length; _i++) {
                var item = r_1[_i];
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
        var resolveAll = function (x, maxDepth) {
            if (maxDepth === void 0) { maxDepth = 10; }
            if (maxDepth <= 0) {
                throw new Error("max depth reached when resolving alias for " + x);
            }
            var y = resolveOnce(x);
            if (y !== x) {
                return resolveAll(y, maxDepth - 1);
            }
            return y;
        };
        r.forEach(function (item) {
            item.replacement = resolveAll(item.replacement);
        });
        return { resolveAll: resolveAll };
    };
    NodeModuleResolver.prototype._expandAlias = function (alias) {
        var _this = this;
        return this._aliasCache._remember(alias, function () {
            return _this._expandAliasNoCache(alias);
        });
    };
    NodeModuleResolver.prototype._expandAliasNoCache = function (alias) {
        return this._alias.resolveAll(alias);
    };
    return NodeModuleResolver;
}());
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
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return newFunc.call.apply(newFunc, [this, oldFunc].concat(args));
    };
}
