import * as fs from 'fs';
import { FileSystem } from "./nspack-interface";
import { log, isPromise } from "./utils";
import Cache from "./cache";
import * as path from 'path'


export default class NSPackOutputFileSystem {
    private _fs: FileSystem;
    private _statCache: Cache<fs.Stats>;

    public constructor(fs: FileSystem){
        this._fs = fs
        this._statCache = new Cache();
    }

    public resetCache(){
        this._statCache.resetCache()

    }

    public async writeFile(filePathName: string, data: string|Buffer, encoding: string): Promise<any>{
        return new Promise((resolve, reject) => {
            this._fs.writeFile(filePathName, data, encoding, (err) => {
                if (err){
                    log.error(`Error: failed to write to file "${filePathName}", detail: `, err)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    public async mkdirIfNotExists(fileDir: string): Promise<any>{
        const st = await this._tryStat(fileDir)
        if (st){
            if (st.isDirectory()){
                return
            }
            
            throw new Error(`${fileDir} already exists, but not a directory!`)
        }

        
        const a = path.resolve(fileDir).replace(/[\\\/]/g, path.sep).split(path.sep)
        let lastExistsIndex = -1
        for (let i = a.length - 1; i > 0; i--){
            const p = a.slice(0, i).join(path.sep)
            const t = await this._tryStat(p)
            if (t){
                if (t.isDirectory()){
                    lastExistsIndex = i
                    break
                }

                throw new Error(`${p} exists, but not a directory!`)
            }
        }

        if (lastExistsIndex < 0){
            throw new Error(`no exists parent found for ${fileDir}!`)
        }

        for (let i = lastExistsIndex + 1; i <= a.length; i++){
            const p = a.slice(0, i).join(path.sep)

            this._clearStatCache(p)
            await this._mkdir(p)
                        .catch(err => {
                            // ignore existing directory error.
                            if (!(err && err.code === 'EEXIST')){
                                throw err
                            }
                        })
        }
    }

    private async _mkdir(fileDir: string): Promise<void>{
        return new Promise<void>((resolve, reject) => {
            this._fs.mkdir(fileDir, (err) => {
                if (err){
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    private async _stat(fileDir: string): Promise<fs.Stats>{
        return this._statCache.rememberAsync(fileDir, (): Promise<fs.Stats> => {
            return new Promise((resolve, reject) => {
                this._fs.stat(fileDir, (err, st) => {
                    if (err){
                        reject(err)
                    } else {
                        resolve(st)
                    }
                })
            })
        })
    }

    private async _tryStat(fileDir: string): Promise<fs.Stats>{
        return this._statCache.rememberAsync(fileDir, (): Promise<fs.Stats> => {
            return new Promise((resolve, reject) => {
                this._fs.stat(fileDir, (err, st) => {
                    if (err){
                        resolve(null)
                    } else {
                        resolve(st)
                    }
                })
            })
        })
    }

    private _clearStatCache(fileDir: string){
        this._statCache.forget(fileDir)
    }
}