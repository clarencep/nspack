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
// const debug = require('debug')('nspack')
class LessModuleResolver {
    constructor(options) {
        this._cache = new cache_1.default();
    }
    resolveModuleFullPathName(moduleName, baseDir) {
        return __awaiter(this, void 0, void 0, function* () {
            if (moduleName[0] === '.') {
                return yield this._tryFileCached(path.join(baseDir, moduleName));
            }
            if (!baseDir) {
                return yield this._tryFileCached(moduleName);
            }
            throw new Error(`Cannot resolve ${moduleName} in ${baseDir}`);
        });
    }
    resetCache() {
        this._cache.resetCache();
    }
    _tryFileCached(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._cache._remember('resolve:' + filepath, () => this._tryFile(filepath));
        });
    }
    _tryFile(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            const r = yield utils_1.tryFStat(filepath);
            if (r && r.isFile()) {
                return filepath;
            }
            // try foo => foo.less
            const lessFile = filepath + '.less';
            const r2 = yield utils_1.tryFStat(lessFile);
            if (r2 && r2.isFile()) {
                return lessFile;
            }
            // try foo => foo.css
            const cssFile = filepath + '.css';
            const r3 = yield utils_1.tryFStat(cssFile);
            if (r3 && r3.isFile()) {
                return cssFile;
            }
            return '';
        });
    }
}
exports.default = LessModuleResolver;
