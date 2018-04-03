var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { readFile } from './utils';
const extend = Object.assign;
export default class NSPackEntryModule {
    constructor(entryName, cfg, packer) {
        this.needUpdate = false;
        this._packer = () => packer;
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
    get packer() {
        return this._packer();
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
        return this._loadSource(this.css, '.js');
    }
    loadHtmlSource() {
        return this._loadSource(this.html, '.js');
    }
    _loadSource(reader, fileExtName) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield reader.call(this, this);
            if (!data.filePath && data.sourceCode) {
                data.filePath = this.name + fileExtName;
            }
            return data;
        });
    }
}
function entryConfigItemToEntryContentReader(cfg) {
    if (!cfg) {
        return (entry) => ({ filePath: null, sourceCode: null });
    }
    if (isEntryFilePath(cfg)) {
        return (entry) => sanitizeEntryContent({ filePath: cfg });
    }
    if (isEntryContent(cfg)) {
        return (entry) => sanitizeEntryContent(cfg);
    }
    if (typeof cfg === 'function') {
        return (entry) => Promise.resolve(cfg(entry))
            .then((data) => {
            if (isEntrySourceCode(data)) {
                return { sourceCode: data };
            }
            if (isEntryContent(data)) {
                return sanitizeEntryContent(data);
            }
            throw new Error("Invalid type of entry data!");
        });
    }
    throw new Error("Invalid entry config item!");
}
function sanitizeEntryContent(entry) {
    if (entry.filePath && entry.sourceCode === undefined) {
        return readFile(entry.filePath)
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
