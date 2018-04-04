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
const debug = require('debug')('nspack');
const textFileTypesRe = /^(txt|text|js|jsx|css|less|json|htm|html|vue)$/;
class NSPackModule {
    constructor(attributes, packer) {
        this.processed = false;
        this.processing = false;
        this.isExternal = false;
        this.isInternal = false;
        this.needUpdate = false;
        this.fresh = false;
        this.amdExecOnDef = false;
        this.cssExtracted = false;
        this.extractedCss = '';
        this._packer = () => packer;
        attributes && extend(this, attributes);
        if (!this.fullPathName) {
            throw new Error("Invalid module -- no fullPathName!");
        }
        if (this.relativePath === undefined) {
            this.relativePath = path.relative(this.entryBase, this.fullPathName);
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
        this.packer.debugLevel > 2 && debug("new module: %o", this);
    }
    get packer() {
        return this._packer();
    }
    get entryBase() {
        return this.packer._config.entryBase;
    }
    loadSource() {
        return __awaiter(this, void 0, void 0, function* () {
            if ((this.needUpdate || this.source === undefined) && !this.isExternal && !this.isInternal) {
                this.packer.debugLevel > 1 && debug("read module source from file: %o, module: %o", this.fullPathName, this);
                const readFileAt = Date.now();
                this.source = yield utils_1.readFile(this.fullPathName, this.encoding);
                this.sourceUpdatedAt = readFileAt;
                return;
            }
        });
    }
    _checkIfNeedUpdate0() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isInternal && !this.isExternal) {
                const stat = yield utils_1.tryFStat(this.fullPathName);
                if (!stat || !stat.isFile() || +stat.mtimeMs > this.sourceUpdatedAt) {
                    this.packer.debugLevel > 3 && debug("source updated: %o, at %o", this.fullPathName, stat);
                    return this.needUpdate = true;
                }
            }
        });
    }
    _checkIfNeedUpdate1() {
        if (this.needUpdate) {
            return true;
        }
        for (let dependModule of this.dependencies) {
            if (dependModule._checkIfNeedUpdate1()) {
                return this.needUpdate = true;
            }
        }
    }
    _isTextFile() {
        const type = this.type;
        return textFileTypesRe.test(type);
    }
}
exports.default = NSPackModule;
