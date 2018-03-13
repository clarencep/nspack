const fs = require('fs')
const path = require('path')
const cb2p = require('./cb2p')
const extend = Object.assign

const readFile = cb2p(fs.readFile)
const fstat = cb2p(fs.stat)

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
            return path.join(baseDir, moduleName)
        }

        return this._remember('module:' + moduleName + '@' + baseDir, async () => {
            let baseDirParts = baseDir.split(path.sep)

            // try read node modules
            for (let n = baseDirParts.length - 1; n > 0; n--){
                const r = await this._tryFileCached(path.join(baseDirParts.slice(0, n), 'node_modules', moduleName))
                if (r){
                    return r
                }
            }
        })
    },
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

        // try directly the file
        const r = tryFStat(filepath)
        if (r){
            if (r.isFile()){
                return filepath
            }

            fileIsDir = r.isDirectory()
        }

        // try jquery => jquery.js
        jsFile = filepath + '.js'
        const r2 = tryFStat(jsFile)
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
                const r3 = tryFStat(dirIndexJs)
                if (r3 && r3.isFile()){
                    return dirIndexJs
                }
            }
        }


        return false;
    }
})

async function tryFStat(file){
    return new Promise(resolve => {
        fs.fstat(file, (err, stats) => {
            if (err){
                resolve(false)
            } else {
                resolve(state)
            }
        })
    })
}

async function tryReadFileContent(file, encoding='utf8'){
    return new Promise(resolve => {
        fs.readFile(file, encoding, (err, content) => {
            if (err){
                resolve(false)
            } else {
                resolve(content)
            }
        })
    })
}

async function tryReadJsonFileContent(file, encoding='utf8'){
    return new Promise(resolve => {
        fs.readFile(file, encoding, (err, content) => {
            if (err){
                resolve(false)
            } else {
                try {
                    resolve(JSON.parse(content))
                } catch (e){
                    resolve(false)
                }
            }
        })
    })
}
