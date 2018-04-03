"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cache = /** @class */ (function () {
    function Cache() {
        this._cache = {};
    }
    Cache.prototype.resetCache = function () {
        this._cache = {};
    };
    // _remember(cacheKey, loadFunc){
    //     return loadFunc()
    // },
    Cache.prototype._remember = function (cacheKey, loadFunc) {
        if (cacheKey in this._cache) {
            return this._cache[cacheKey];
        }
        return this._cache[cacheKey] = loadFunc();
    };
    return Cache;
}());
exports.default = Cache;
