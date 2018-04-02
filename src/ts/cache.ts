
type CacheStore<T> = {
    [k: string]: T;
}

export default class Cache<T> {
    private _cache: CacheStore<T>;
    constructor(){
        this._cache = {}
    }
    resetCache(){
        this._cache = {}
    }
    // _remember(cacheKey, loadFunc){
    //     return loadFunc()
    // },
    _remember(cacheKey: string, loadFunc: () => T){
        if (cacheKey in this._cache){
            return this._cache[cacheKey]
        }

        return this._cache[cacheKey] = loadFunc()
    }
}




