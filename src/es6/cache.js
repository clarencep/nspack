"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
class Cache {
    constructor() {
        this._cache = {};
        this._cachePromises = {};
    }
    resetCache() {
        this._cache = {};
        this._cachePromises = {};
    }
    // _remember(cacheKey, loadFunc){
    //     return loadFunc()
    // },
    _remember(cacheKey, loadFunc) {
        if (cacheKey in this._cache) {
            return this._cache[cacheKey];
        }
        return this._cache[cacheKey] = loadFunc();
    }
    remember(cacheKey, loadFunc) {
        if (cacheKey in this._cache) {
            return this._cache[cacheKey];
        }
        return this._cache[cacheKey] = loadFunc();
    }
    rememberAsync(cacheKey, loadFunc) {
        if (cacheKey in this._cache) {
            return this._cache[cacheKey];
        }
        if (cacheKey in this._cachePromises) {
            return this._cachePromises[cacheKey];
        }
        const loading = loadFunc();
        if (utils_1.isPromise(loading)) {
            loading.then(v => {
                this._cache[cacheKey] = v;
                delete this._cachePromises[cacheKey];
            });
            return this._cachePromises[cacheKey] = loading;
        }
        return this._cache[cacheKey] = loading;
    }
    forget(cacheKey) {
        delete this._cache[cacheKey];
        delete this._cachePromises[cacheKey];
    }
}
exports.default = Cache;
