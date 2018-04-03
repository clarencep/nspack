export default class Cache {
    constructor() {
        this._cache = {};
    }
    resetCache() {
        this._cache = {};
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
}
