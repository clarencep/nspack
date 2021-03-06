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
const utils_1 = require("./utils");
const path = require("path");
const extend = Object.assign;
class NSPackEntryModule {
    constructor(entryName, cfg, packer) {
        this.needUpdate = false;
        this._packer = () => packer;
        extend(this, {
            name: entryName,
            js: entryConfigItemToEntryContentReader.call(this, cfg.js),
            css: entryConfigItemToEntryContentReader.call(this, cfg.css),
            html: entryConfigItemToEntryContentReader.call(this, cfg.html),
            extractCssFromJs: !!cfg.extractCssFromJs,
            ignoreMissingCss: !!cfg.ignoreMissingCss,
            libName: cfg.libName,
            libTarget: cfg.libTarget,
            amdExecOnDef: cfg.amdExecOnDef === undefined ? true : !!cfg.amdExecOnDef,
        });
        this.entry = {
            name: entryName,
            baseDir: this.baseDir,
        };
    }
    get packer() {
        return this._packer();
    }
    get baseDir() {
        return this.packer._config.entryBase;
    }
    _checkIfNeedUpdate0() {
        // entry module need not this method
        return false;
    }
    _checkIfNeedUpdate1() {
        if (this.needUpdate) {
            return false;
        }
        const jsNeedUpdates = this.jsModule._checkIfNeedUpdate1();
        const cssNeedUpdates = this.cssModule._checkIfNeedUpdate1();
        return this.needUpdate = (jsNeedUpdates || cssNeedUpdates);
    }
    loadJsSource() {
        return this._loadSource(this.js, '.js');
    }
    loadCssSource() {
        return this._loadSource(this.css, '.css');
    }
    loadHtmlSource() {
        return __awaiter(this, void 0, void 0, function* () {
            // html source should be executed
            const data = yield this.html.call(this, this);
            if (data.filePath) {
                const filePath = path.resolve(this.baseDir, data.filePath);
                if (/\.js$/.test(filePath)) {
                    const sourceCodeResolver = require(filePath);
                    if (typeof sourceCodeResolver !== 'function') {
                        throw new Error(`Invalid html resolver: ${filePath}. It should export a/an (async) function which returns the HTML source code.`);
                    }
                    const sourceCode = yield sourceCodeResolver.call(this, this);
                    return { filePath, sourceCode };
                }
            }
            return data;
        });
    }
    _loadSource(reader, fileExtName) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield reader.call(this, this);
            if (!data.filePath && data.sourceCode) {
                data.filePath = path.resolve(this.baseDir, this.name + fileExtName);
            }
            return data;
        });
    }
}
exports.default = NSPackEntryModule;
function entryConfigItemToEntryContentReader(cfg) {
    if (!cfg) {
        return (entry) => ({ filePath: null, sourceCode: null });
    }
    if (isEntryFilePath(cfg)) {
        return (entry) => sanitizeEntryContent.call(this, { filePath: cfg });
    }
    if (isEntryContent(cfg)) {
        return (entry) => sanitizeEntryContent.call(this, cfg);
    }
    if (typeof cfg === 'function') {
        return (entry) => Promise.resolve(cfg(entry))
            .then((data) => {
            if (isEntrySourceCode(data)) {
                return { sourceCode: data };
            }
            if (isEntryContent(data)) {
                return sanitizeEntryContent.call(this, data);
            }
            throw new Error("Invalid type of entry data!");
        });
    }
    throw new Error("Invalid entry config item!");
}
function sanitizeEntryContent(entry) {
    if (entry.filePath && entry.sourceCode === undefined) {
        return utils_1.readFile(path.resolve(this.baseDir, entry.filePath))
            .then(data => {
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
