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
var utils_1 = require("./utils");
var path = require("path");
var extend = Object.assign;
var debug = require('debug')('nspack');
var textFileTypesRe = /^(txt|text|js|jsx|css|less|json|htm|html|vue)$/;
var NSPackModule = /** @class */ (function () {
    function NSPackModule(attributes, packer) {
        this.processed = false;
        this.cssExtracted = false;
        this.isExternal = false;
        this.isInternal = false;
        this.needUpdate = false;
        this.fresh = false;
        this.amdExecOnDef = false;
        this._packer = function () { return packer; };
        attributes && extend(this, attributes);
        if (this.relativePath === undefined) {
            this.relativePath = path.relative(this.packer._config.entryBase, this.fullPathName);
        }
        if (this.type === undefined) {
            this.type = path.extname(this.fullPathName).replace(/^./, '').toLowerCase();
        }
        if (this.fullFileDirName === undefined) {
            this.fullFileDirName = path.dirname(this.fullPathName);
        }
        if (this.encoding === undefined) {
            this.encoding = this._isTextFile() ? 'utf8' : null;
        }
        this.resolvingParentsAndSelf = "\n-- " + this.relativePath + (this.resolvingParents || '');
        this.dependencies = [];
    }
    Object.defineProperty(NSPackModule.prototype, "packer", {
        get: function () {
            return this._packer();
        },
        enumerable: true,
        configurable: true
    });
    NSPackModule.prototype.loadSource = function () {
        return __awaiter(this, void 0, void 0, function () {
            var readFileAt, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!((this.needUpdate || this.source === undefined) && !this.isExternal && !this.isInternal)) return [3 /*break*/, 2];
                        this.packer.debugLevel > 1 && debug("read module source from file: %o, module: %o", this.fullPathName, this);
                        readFileAt = Date.now();
                        _a = this;
                        return [4 /*yield*/, utils_1.readFile(this.fullPathName, this.encoding)];
                    case 1:
                        _a.source = _b.sent();
                        this.sourceUpdatedAt = readFileAt;
                        return [2 /*return*/];
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    NSPackModule.prototype._checkIfNeedUpdate0 = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stat;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(!this.isInternal && !this.isExternal)) return [3 /*break*/, 2];
                        return [4 /*yield*/, utils_1.tryFStat(this.fullPathName)];
                    case 1:
                        stat = _a.sent();
                        if (!stat || !stat.isFile() || +stat.mtimeMs > this.sourceUpdatedAt) {
                            this.packer.debugLevel > 3 && debug("source updated: %o, at %o", this.fullPathName, stat);
                            return [2 /*return*/, this.needUpdate = true];
                        }
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    NSPackModule.prototype._checkIfNeedUpdate1 = function () {
        if (this.needUpdate) {
            return true;
        }
        for (var _i = 0, _a = this.dependencies; _i < _a.length; _i++) {
            var dependModule = _a[_i];
            if (dependModule._checkIfNeedUpdate1()) {
                return this.needUpdate = true;
            }
        }
    };
    NSPackModule.prototype._isTextFile = function () {
        var type = this.type;
        return textFileTypesRe.test(type);
    };
    return NSPackModule;
}());
exports.default = NSPackModule;
