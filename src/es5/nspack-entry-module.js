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
var extend = Object.assign;
var NSPackEntryModule = /** @class */ (function () {
    function NSPackEntryModule(entryName, cfg, packer) {
        this.needUpdate = false;
        this._packer = function () { return packer; };
        extend(this, {
            name: entryName,
            js: entryConfigItemToEntryContentReader(cfg.js),
            css: entryConfigItemToEntryContentReader(cfg.css),
            html: entryConfigItemToEntryContentReader(cfg.html),
            extractCssFromJs: !!cfg.extractCssFromJs,
            ignoreMissingCss: !!cfg.ignoreMissingCss,
            libName: cfg.libName,
            libTarget: cfg.libTarget,
            amdExecOnDef: cfg.amdExecOnDef === undefined ? true : !!cfg.amdExecOnDef,
        });
    }
    Object.defineProperty(NSPackEntryModule.prototype, "packer", {
        get: function () {
            return this._packer();
        },
        enumerable: true,
        configurable: true
    });
    NSPackEntryModule.prototype._checkIfNeedUpdate0 = function () {
        // entry module need not this method
        return false;
    };
    NSPackEntryModule.prototype._checkIfNeedUpdate1 = function () {
        if (this.needUpdate) {
            return false;
        }
        var jsNeedUpdates = this.jsModule._checkIfNeedUpdate1();
        var cssNeedUpdates = this.cssModule._checkIfNeedUpdate1();
        return this.needUpdate = (jsNeedUpdates || cssNeedUpdates);
    };
    NSPackEntryModule.prototype.loadJsSource = function () {
        return this._loadSource(this.js, '.js');
    };
    NSPackEntryModule.prototype.loadCssSource = function () {
        return this._loadSource(this.css, '.js');
    };
    NSPackEntryModule.prototype.loadHtmlSource = function () {
        return this._loadSource(this.html, '.js');
    };
    NSPackEntryModule.prototype._loadSource = function (reader, fileExtName) {
        return __awaiter(this, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, reader.call(this, this)];
                    case 1:
                        data = _a.sent();
                        if (!data.filePath && data.sourceCode) {
                            data.filePath = this.name + fileExtName;
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    return NSPackEntryModule;
}());
exports.default = NSPackEntryModule;
function entryConfigItemToEntryContentReader(cfg) {
    if (!cfg) {
        return function (entry) { return ({ filePath: null, sourceCode: null }); };
    }
    if (isEntryFilePath(cfg)) {
        return function (entry) { return sanitizeEntryContent({ filePath: cfg }); };
    }
    if (isEntryContent(cfg)) {
        return function (entry) { return sanitizeEntryContent(cfg); };
    }
    if (typeof cfg === 'function') {
        return function (entry) { return Promise.resolve(cfg(entry))
            .then(function (data) {
            if (isEntrySourceCode(data)) {
                return { sourceCode: data };
            }
            if (isEntryContent(data)) {
                return sanitizeEntryContent(data);
            }
            throw new Error("Invalid type of entry data!");
        }); };
    }
    throw new Error("Invalid entry config item!");
}
function sanitizeEntryContent(entry) {
    if (entry.filePath && entry.sourceCode === undefined) {
        return utils_1.readFile(entry.filePath)
            .then(function (data) {
            entry.sourceCode = data;
            return entry;
        });
    }
    return entry;
}
function isEntrySourceCode(cfg) {
    return typeof cfg === 'string' || cfg instanceof Buffer || cfg === null;
}
function isEntryFilePath(cfg) {
    return typeof cfg === 'string';
}
function isEntryContent(cfg) {
    return !!(typeof cfg === 'object' && (cfg.filePath || cfg.sourceCode));
}
