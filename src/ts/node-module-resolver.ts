import * as fs from "fs"
import * as path from "path"
import cb2p from './cb2p'
import Cache from './cache'


import {readFile, tryFStat, tryReadJsonFileContent} from "./utils"
import { ModuleResolver } from "./nspack-interface";

const pathSepRe = /[\\\/]/


export type NodeModuleResolverAlias = {
    [key: string]: string,
}

export type NodeModuleResolverOptions = {
    extensions?: string[],
    alias?: NodeModuleResolverAlias,
}

type NodeModuleResolverCompiledAlias = {
    resolveAll: (alias:string, maxDepth?: number) => string
}

type NodePackageJsonSimplified = {main?:string}

export default class NodeModuleResolver implements ModuleResolver{
    private _extensions: string[];
    private _alias: NodeModuleResolverCompiledAlias;
    private _resolveCache: Cache<Promise<string>>;
    private _tryFileCache: Cache<Promise<string>>;
    private _aliasCache: Cache<string>;
    private _packageJsonCache: Cache<Promise<NodePackageJsonSimplified>>;

    constructor(options?: NodeModuleResolverOptions){
        options = options || {}
        this._extensions = options.extensions || ['.js']
        this._alias = this._compileAlias(options.alias)
            
        this._resolveCache = new Cache()
        this._tryFileCache = new Cache()
        this._aliasCache = new Cache()
        this._packageJsonCache = new Cache()
    }

    async resolveModuleFullPathName(moduleName: string, baseDir: string): Promise<string>{
        moduleName = this._expandAlias(moduleName)

        if (moduleName && path.isAbsolute(moduleName)){
            return await this._tryFile(moduleName)
        }

        if (moduleName[0] === '.'){
            return await this._tryFile(path.join(baseDir, moduleName))
        }

        return this._resolveCache._remember(moduleName + '@' + baseDir, async (): Promise<string> => {
            if (!baseDir){
                return await this._tryFile(moduleName)
            }

            let baseDirParts = baseDir.split(pathSepRe)

            // try read node modules
            for (let n = baseDirParts.length; n > 0; n--){
                // debug(`============== n: ${n} ============`)
                const r = await this._tryFile(path.join(baseDirParts.slice(0, n).join(path.sep), 'node_modules', moduleName))
                if (r){
                    return r
                }
            }
        })
    }
    resetCache(){
        this._resolveCache.resetCache()
        this._tryFileCache.resetCache()
        this._aliasCache.resetCache()
        this._packageJsonCache.resetCache()
    }
    async _tryFile(filepath: string): Promise<string>{
        return this._tryFileCache._remember(filepath, (): Promise<string> => {
            return this._tryFileNoCache(filepath)
        })
    }
    async _tryFileNoCache(filepath: string): Promise<string>{
        let fileIsDir = false

        const r = await tryFStat(filepath)
        if (r){
            if (r.isFile()){
                return filepath
            }

            fileIsDir = r.isDirectory()
        }

        // debug("file %o is directory: %o", filepath, fileIsDir)

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
            let packageJson = await this._readPackageJson(path.join(filepath, 'package.json'))
            // debug("packageJson in %o: %o", filepath, packageJson)
            if (packageJson){
                return await this._tryFile(path.join(filepath, packageJson.main || 'index'))
            } else {
                // try index.js in the directory
                const dirIndexJs = path.join(filepath, 'index.js')
                const r3 = await tryFStat(dirIndexJs)
                if (r3 && r3.isFile()){
                    return dirIndexJs
                }
            }
        }

        return '';
    }
    _readPackageJson(jsonPath: string): Promise<NodePackageJsonSimplified>{
        return this._packageJsonCache._remember(jsonPath, async () => {
            const data = await tryReadJsonFileContent(jsonPath)
            // return data
            return {main: data ? data.main : undefined}
        })
    }
    _compileAlias(aliases: NodeModuleResolverAlias): NodeModuleResolverCompiledAlias{
        if (!aliases){
            return {resolveAll: x => x}
        }

        let firstCharCodes = {}
        let r = []

        const reExp = []

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

            firstCharCodes[aliasName.charCodeAt(0)] = true
            r.push(item)
        })

        // sort by alias name length DESC
        r = r.sort((a, b) => b.aliasNameLen - a.aliasNameLen)
        
        const resolveOnce = (x: string): string => {
            if (!firstCharCodes[x.charCodeAt(0)]){
                return x
            }

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

        const resolveAll = (x: string, maxDepth=10): string => {
            if (maxDepth <= 0){
                throw new Error("max depth reached when resolving alias for " + x)
            }

            const y = resolveOnce(x)
            if (y !== x){
                return resolveAll(y, maxDepth - 1)
            }

            return y
        }

        r.forEach(item => {
            item.replacement = resolveAll(item.replacement)
        })

        return {resolveAll}
    }
    _expandAlias(alias: string): string{
        return this._aliasCache._remember(alias, () => {
            return this._expandAliasNoCache(alias)
        })
    }
    _expandAliasNoCache(alias: string): string{
        return this._alias.resolveAll(alias)
    }
}




// NodeModuleResolver.prototype.resolveModuleFullPathName = decorate(NodeModuleResolver.prototype.resolveModuleFullPathName, async function(oldFunc, ...args){
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) !!!!!!!!!!!", args)
//     const res = await oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! resolveModuleFullPathName(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

// NodeModuleResolver.prototype._tryFileNoCache = decorate(NodeModuleResolver.prototype._tryFileNoCache, async function(oldFunc, ...args){
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


// NodeModuleResolver.prototype._expandAliasNoCache = decorate(NodeModuleResolver.prototype._expandAliasNoCache, function(oldFunc, ...args){
//     // debug("!!!!!!!!!!! _expandAlias(%o) !!!!!!!!!!!", args)
//     const res = oldFunc.apply(this, args)
//     debug("!!!!!!!!!!! _expandAlias(%o) => %o !!!!!!!!!!!", args, res)
//     return res
// })

function decorate(oldFunc, newFunc){
    return function(...args){
        return newFunc.call(this, oldFunc, ...args)
    }
}


