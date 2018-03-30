const fs = require('fs')
const path = require('path')
const cb2p = require('./cb2p')
const debug = require('debug')('nspack')
const Cache = require('./cache')

const extend = Object.assign

const readFile = cb2p(fs.readFile)

const {
    tryFStat,
    tryReadJsonFileContent,
} = require('./utils')

module.exports = NodeModuleResolver

function NodeModuleResolver(options){
    if (!(this instanceof NodeModuleResolver)){
        return new NodeModuleResolver()
    }

    options = options || {}
    this._extensions = options.extensions || []
    this._alias = this._compileAlias(options.alias)
    
    this._resolveCache = new Cache()
    this._tryFileCache = new Cache()
    this._aliasCache = new Cache()

    return this
}

extend(NodeModuleResolver.prototype, {
    async resolveModuleFullPathName(moduleName, baseDir){
        moduleName = this._expandAlias(moduleName)

        if (moduleName && path.isAbsolute(moduleName)){
            return await this._tryFile(moduleName)
        }

        if (moduleName[0] === '.'){
            return await this._tryFile(path.join(baseDir, moduleName))
        }

        return this._resolveCache._remember(moduleName + '@' + baseDir, async () => {
            if (!baseDir){
                return await this._tryFile(moduleName)
            }

            let baseDirParts = baseDir.split(path.sep)

            // try read node modules
            for (let n = baseDirParts.length - 1; n > 0; n--){
                const r = await this._tryFile(path.join(baseDirParts.slice(0, n).join(path.sep), 'node_modules', moduleName))
                if (r){
                    return r
                }
            }
        })
    },
    resetCache(){
        this._resolveCache.resetCache()
        this._tryFileCache.resetCache()
        this._aliasCache.resetCache()
    },
    async _tryFile(filepath){
        return this._tryFileCache._remember(filepath, () => {
            return this._tryFileNoCache(filepath)
        })
    },
    async _tryFileNoCache(filepath){
        let fileIsDir = false

        const r = await tryFStat(filepath)
        if (r){
            if (r.isFile()){
                return filepath
            }

            fileIsDir = r.isDirectory()
        }

        for (let extName of this._extensions){
            // try jquery => jquery.js
            const jsFile = filepath + extName
            const r2 = await tryFStat(jsFile)
            if (r2 && r2.isFile()){
                return jsFile
            }
        }

        if (fileIsDir){
            // try "main" script in the package.json
            let packageJson = tryReadJsonFileContent(path.join(filepath, 'package.json'))
            if (packageJson){
                return await this._tryFile(path.join(filepath, packageJson.main || 'index.js'))
            } else {
                // try index.js in the directory
                const dirIndexJs = path.join(filepath, 'index.js')
                const r3 = await tryFStat(dirIndexJs)
                if (r3 && r3.isFile()){
                    return dirIndexJs
                }
            }
        }

        return false;
    },
    _compileAlias(aliases){
        if (!aliases){
            return
        }

        let r = []

        const reExp = []
        const reReplacements = {}

        Object.keys(aliases).forEach(aliasName => {
            const aliasNameLen = aliasName.length
            const realName = aliases[aliasName]
            const item = {
                aliasName,
                aliasNameLen,
                search:      aliasName,
                searchLen:   aliasNameLen,
                replacement: realName,
                isFullMatch: false,
            }

            if (aliasName[aliasNameLen - 1] === '$'){
                item.search = aliasName.substr(0, aliasNameLen - 1)
                item.searchLen = item.search.length
                item.isFullMatch = true
            }

            r.push(item)
        })

        // sort by alias name length DESC
        r = r.sort((a, b) => b.aliasNameLen - a.aliasNameLen)
        
        const resolveOnce = (x) => {
            const xLen = x.length
            for (let item of r){
                if (item.searchLen < xLen){
                    if (!item.isFullMatch && item.search === x.substr(0, item.searchLen)){
                        return item.replacement + x.substr(item.searchLen)
                    } // else: no match
                } else if (item.searchLen === xLen){
                    if (item.search === x){
                        return item.replacement
                    } // else: no match
                } // else: no match
            }

            return x
        }

        const resolveAll = (x, maxDepth=10) => {
            if (maxDepth <= 0){
                throw new Error("max depth reached when resolving alias for " + x)
            }

            const y = resolveOnce(x)
            if (y !== x){
                return resolveAll(y, maxDepth - 1)
            }

            return y
        }

        Object.keys(reReplacements).forEach(aliasName => {
            reReplacements[aliasName] = resolveAll(aliasName)
        })

        return {
            resolveOnce,
            resolveAll,
        }
    },
    _expandAlias(alias){
        return this._aliasCache._remember(alias, () => {
            return this._expandAliasNoCache(alias)
        })
    },
    _expandAliasNoCache(alias){
        return this._alias.resolveAll(alias)
    }
})


// NodeModuleResolver.prototype.resolveModuleFullPathName = decorate(NodeModuleResolver.prototype.resolveModuleFullPathName, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// NodeModuleResolver.prototype._tryFileNoCache = decorate(NodeModuleResolver.prototype._tryFile, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! _tryFileNoCache(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _tryFileNoCache(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// NodeModuleResolver.prototype._tryFile = decorate(NodeModuleResolver.prototype._tryFile, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! _tryFile(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _tryFile(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// function decorate(oldFunc, newFunc){
//     return function(...args){
//         return newFunc.call(this, oldFunc, ...args)
//     }
// }


