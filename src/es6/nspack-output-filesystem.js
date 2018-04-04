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
const cache_1 = require("./cache");
const path = require("path");
class NSPackOutputFileSystem {
    constructor(fs) {
        this._fs = fs;
        this._statCache = new cache_1.default();
    }
    resetCache() {
        this._statCache.resetCache();
    }
    writeFile(filePathName, data, encoding) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this._fs.writeFile(filePathName, data, encoding, (err) => {
                    if (err) {
                        utils_1.log.error(`Error: failed to write to file "${filePathName}", detail: `, err);
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    mkdirIfNotExists(fileDir) {
        return __awaiter(this, void 0, void 0, function* () {
            const st = yield this._tryStat(fileDir);
            if (st) {
                if (st.isDirectory()) {
                    return;
                }
                throw new Error(`${fileDir} already exists, but not a directory!`);
            }
            const a = path.resolve(fileDir).replace(/[\\\/]/g, path.sep).split(path.sep);
            let lastExistsIndex = -1;
            for (let i = a.length - 1; i > 0; i--) {
                const p = a.slice(0, i).join(path.sep);
                const t = yield this._tryStat(p);
                if (t) {
                    if (t.isDirectory()) {
                        lastExistsIndex = i;
                        break;
                    }
                    throw new Error(`${p} exists, but not a directory!`);
                }
            }
            if (lastExistsIndex < 0) {
                throw new Error(`no exists parent found for ${fileDir}!`);
            }
            for (let i = lastExistsIndex + 1; i <= a.length; i++) {
                const p = a.slice(0, i).join(path.sep);
                this._clearStatCache(p);
                yield this._mkdir(p)
                    .catch(err => {
                    // ignore existing directory error.
                    if (!(err && err.code === 'EEXIST')) {
                        throw err;
                    }
                });
            }
        });
    }
    _mkdir(fileDir) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this._fs.mkdir(fileDir, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    _stat(fileDir) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._statCache.rememberAsync(fileDir, () => {
                return new Promise((resolve, reject) => {
                    this._fs.stat(fileDir, (err, st) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(st);
                        }
                    });
                });
            });
        });
    }
    _tryStat(fileDir) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._statCache.rememberAsync(fileDir, () => {
                return new Promise((resolve, reject) => {
                    this._fs.stat(fileDir, (err, st) => {
                        if (err) {
                            resolve(null);
                        }
                        else {
                            resolve(st);
                        }
                    });
                });
            });
        });
    }
    _clearStatCache(fileDir) {
        this._statCache.forget(fileDir);
    }
}
exports.default = NSPackOutputFileSystem;
