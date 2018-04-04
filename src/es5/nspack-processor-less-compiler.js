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
var less_module_resolver_1 = require("./less-module-resolver");
var path = require("path");
var debug = require('debug')('nspack');
var less = require('less');
var FragmentType;
(function (FragmentType) {
    FragmentType[FragmentType["Code"] = 1] = "Code";
    FragmentType[FragmentType["ImportStatement"] = 2] = "ImportStatement";
})(FragmentType || (FragmentType = {}));
var importRegex = /@import ["']([^"']*?)["'];/g; // todo: escape string??
function default_1(module, packer) {
    return __awaiter(this, void 0, void 0, function () {
        var source, fragments, builtFragments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    module.builtType = 'css';
                    if (!packer._lessModuleResolver) {
                        packer._lessModuleResolver = new less_module_resolver_1.default(packer._config.resolve);
                    }
                    source = module.source + '';
                    fragments = splitLessSource(source);
                    return [4 /*yield*/, Promise.all(fragments.map(function (x) { return buildFragment(x, module, packer); }))
                        // builtFragments.forEach((x,i) => debug("!!!!!!!!!!!!!builtFragments[%o]: %o", i, x))
                    ];
                case 1:
                    builtFragments = _a.sent();
                    // builtFragments.forEach((x,i) => debug("!!!!!!!!!!!!!builtFragments[%o]: %o", i, x))
                    module.builtSource = builtFragments.join("");
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = default_1;
function splitLessSource(source) {
    var fragments = [];
    importRegex.lastIndex = 0;
    var i = 0, m;
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
    return __awaiter(this, void 0, void 0, function () {
        var r, e_1, importedModule;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(fragment.type === FragmentType.Code)) return [3 /*break*/, 4];
                    if (fragment.code.length < 30 && isAllWhiteSpace(fragment.code)) {
                        return [2 /*return*/, ''];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, less.render(fragment.code)];
                case 2:
                    r = _a.sent();
                    return [2 /*return*/, r.css];
                case 3:
                    e_1 = _a.sent();
                    console.error("Error: failed to compile " + module.fullPathName + ", detail:");
                    console.error(e_1);
                    throw new Error("Error: failed to compile " + module.fullPathName + ", detail:" + e_1);
                case 4:
                    if (!(fragment.type === FragmentType.ImportStatement)) return [3 /*break*/, 6];
                    return [4 /*yield*/, resolveLessModule.call(packer, fragment.module, module.fullFileDirName)];
                case 5:
                    importedModule = _a.sent();
                    module.dependencies.push(importedModule);
                    return [2 /*return*/, '\n/*' + importedModule.relativePath + '*/\n' + importedModule.builtSource];
                case 6: throw new Error("Invalid fragment type: " + fragment.type);
            }
        });
    });
}
function resolveLessModule(moduleName, baseDir) {
    return __awaiter(this, void 0, void 0, function () {
        var moduleFullPathName, module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    this.debugLevel > 0 && debug("resolving %o in %o", moduleName, baseDir);
                    return [4 /*yield*/, resolveLessModuleFullPathName.call(this, moduleName, baseDir)];
                case 1:
                    moduleFullPathName = _a.sent();
                    if (!moduleFullPathName) {
                        throw new Error("failed tor resolve " + moduleName + " in " + baseDir);
                    }
                    return [4 /*yield*/, this._addModuleIfNotExists({
                            name: moduleName,
                            baseDir: baseDir,
                            fullPathName: moduleFullPathName,
                        })];
                case 2:
                    module = _a.sent();
                    return [4 /*yield*/, this._processModule(module)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * @this packer
 */
function resolveLessModuleFullPathName(moduleName, baseDir) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(moduleName[0] === '@')) return [3 /*break*/, 2];
                    return [4 /*yield*/, this._lessModuleResolver.resolveModuleFullPathName(path.join(this._config.entryBase, moduleName.substring(1)), '')];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, this._lessModuleResolver.resolveModuleFullPathName(moduleName, baseDir)];
                case 3: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function isAllWhiteSpace(text) {
    return text.trim().length === 0;
}
