var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as path from "path";
import Cache from './cache';
import { tryFStat } from "./utils";
// const debug = require('debug')('nspack')
export default class LessModuleResolver {
    constructor(options) {
        this._cache = new Cache();
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
            const r = yield tryFStat(filepath);
            if (r && r.isFile()) {
                return filepath;
            }
            // try foo => foo.less
            const lessFile = filepath + '.less';
            const r2 = yield tryFStat(lessFile);
            if (r2 && r2.isFile()) {
                return lessFile;
            }
            // try foo => foo.css
            const cssFile = filepath + '.css';
            const r3 = yield tryFStat(cssFile);
            if (r3 && r3.isFile()) {
                return cssFile;
            }
            return '';
        });
    }
}
