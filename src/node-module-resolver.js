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

module.exports = NodeModuleResolver

function NodeModuleResolver(){
    if (!(this instanceof NodeModuleResolver)){
        return new NodeModuleResolver()
    }

    this._cache = {}

    return this
}

extend(NodeModuleResolver.prototype, {
    async resolveModuleFullPathName(moduleName, baseDir){
        if (moduleName[0] === '.'){
            return await this._tryFileCached(path.join(baseDir, moduleName))
        }

        return this._remember('module:' + moduleName + '@' + baseDir, async () => {
            if (!baseDir){
                return await this._tryFileCached(moduleName)
            }

            let baseDirParts = baseDir.split(path.sep)

            // try read node modules
            for (let n = baseDirParts.length - 1; n > 0; n--){
                const r = await this._tryFileCached(path.join(baseDirParts.slice(0, n).join(path.sep), 'node_modules', moduleName))
                if (r){
                    return r
                }
            }
        })
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
        let fileIsDir = false

        const r = await tryFStat(filepath)
        if (r){
            if (r.isFile()){
                return filepath
            }

            fileIsDir = r.isDirectory()
        }

        // try jquery => jquery.js
        const jsFile = filepath + '.js'
        const r2 = await tryFStat(jsFile)
        if (r2 && r2.isFile()){
            return jsFile
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
    }
})


// NodeModuleResolver.prototype.resolveModuleFullPathName = decorate(NodeModuleResolver.prototype.resolveModuleFullPathName, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// NodeModuleResolver.prototype._tryFile = decorate(NodeModuleResolver.prototype._tryFile, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! _tryFile(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _tryFile(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// NodeModuleResolver.prototype._tryFileCached = decorate(NodeModuleResolver.prototype._tryFileCached, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! _tryFileCached(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _tryFileCached(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// function decorate(oldFunc, newFunc){
//     return function(...args){
//         return newFunc.call(this, oldFunc, ...args)
//     }
// }


