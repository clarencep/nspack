import * as fs from "fs"
import * as path from "path"
import cb2p from './cb2p'
import Cache from './cache'

import {readFile, tryFStat, tryReadJsonFileContent} from "./utils"

// const debug = require('debug')('nspack')


export default class LessModuleResolver {
    private _cache: Cache<Promise<string>>;
    constructor(options?: any){
        this._cache = new Cache()
    }
    async resolveModuleFullPathName(moduleName: string, baseDir: string): Promise<string>{
        if (moduleName[0] === '.'){
            return await this._tryFileCached(path.join(baseDir, moduleName))
        }

        if (!baseDir){
            return await this._tryFileCached(moduleName)
        }

        throw new Error(`Cannot resolve ${moduleName} in ${baseDir}`)
    }
    resetCache(){
        this._cache.resetCache()
    }
    async _tryFileCached(filepath: string): Promise<string>{
        return this._cache._remember('resolve:' + filepath, () => this._tryFile(filepath))
    }
    async _tryFile(filepath: string): Promise<string>{
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

        return '';
    }
}
