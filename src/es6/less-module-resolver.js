const fs = require('fs')
const path = require('path')
const cb2p = require('./cb2p')
const debug = require('debug')('nspack')

const extend = Object.assign

const readFile = cb2p(fs.readFile)

const {
    tryFStat,
    tryReadJsonFileContent,
} = require('./utils')

module.exports = LessModuleResolver

function LessModuleResolver(){
    if (!(this instanceof LessModuleResolver)){
        return new LessModuleResolver()
    }

    this._cache = {}

    return this
}

extend(LessModuleResolver.prototype, {
    async resolveModuleFullPathName(moduleName, baseDir){
        if (moduleName[0] === '.'){
            return await this._tryFileCached(path.join(baseDir, moduleName))
        }

        if (!baseDir){
            return await this._tryFileCached(moduleName)
        }

        throw new Error(`Cannot resolve ${moduleName} in ${baseDir}`)
    },
    resetCache(){
        this._cache = {}
    },
    // _remember(cacheKey, loadFunc){
    //     return loadFunc()
    // },
    async _remember(cacheKey, loadFunc){
        if (cacheKey in this._cache){
            return this._cache[cacheKey]
        }

        return this._cache[cacheKey] = await loadFunc()
    },
    async _tryFileCached(filepath){
        return this._remember('resolve:' + filepath, () => this._tryFile(filepath))
    },
    async _tryFile(filepath){
        const r = await tryFStat(filepath)
        if (r && r.isFile()){
            return filepath
        }

        // try foo => foo.less
        const lessFile = filepath + '.less'
        const r2 = await tryFStat(lessFile)
        if (r2 && r2.isFile()){
            return lessFile
        }

        // try foo => foo.css
        const cssFile = filepath + '.css'
        const r3 = await tryFStat(cssFile)
        if (r3 && r3.isFile()){
            return cssFile
        }

        return false;
    }
})

