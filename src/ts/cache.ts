import { isPromise } from "./utils";

type CacheStore<T> = {
    [k: string]: T;
}

export default class Cache<T> {
    private _cache: CacheStore<T>;
    private _cachePromises: CacheStore<Promise<T>>;

    constructor(){
        this._cache = {}
        this._cachePromises = {}
    }
    resetCache(){
        this._cache = {}
        this._cachePromises = {}
    }
    // _remember(cacheKey, loadFunc){
    //     return loadFunc()
    // },
    _remember(cacheKey: string, loadFunc: () => T): T{
        if (cacheKey in this._cache){
            return this._cache[cacheKey]
        }

        return this._cache[cacheKey] = loadFunc()
    }

    remember(cacheKey: string, loadFunc: () => T): T{
        if (cacheKey in this._cache){
            return this._cache[cacheKey]
        }

        return this._cache[cacheKey] = loadFunc()
    }

    rememberAsync(cacheKey: string, loadFunc: () => T|Promise<T>): T|Promise<T>{
        if (cacheKey in this._cache){
            return this._cache[cacheKey]
        }

        if (cacheKey in this._cachePromises){
            return this._cachePromises[cacheKey]
        }

        const loading = loadFunc()

        if (isPromise(loading)){
            loading.then(v => {
                this._cache[cacheKey] = v
                delete this._cachePromises[cacheKey]
            })

            return this._cachePromises[cacheKey] = loading
        }

        return this._cache[cacheKey] = loading
    }

    forget(cacheKey: string){
        delete this._cache[cacheKey]
        delete this._cachePromises[cacheKey]
    }
}

