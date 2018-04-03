import * as fs from "fs"
import cb2p from "./cb2p"

export function readFile(filename: string, encoding: string): Promise<string>;
export function readFile(filename: string): Promise<Buffer>;
export function readFile(filename: string, encoding=null): any{
    return new Promise((resolve, reject) => {
        fs.readFile(filename, {encoding: encoding}, function(err, data){
            if (err){
                console.error(`Error: failed to read file "${filename}", detail error:`, err)
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

export function tryFStat(file: string): Promise<false|fs.Stats>{
    return new Promise<false|fs.Stats>(resolve => {
        fs.stat(file, (err, stats) => {
            if (err){
                console.error(`Warn: failed to try stat file "${file}", detail error:`, err)
                resolve(false)
            } else {
                resolve(stats)
            }
        })
    })
}

export function tryReadFileContent(file: string, encoding='utf8'){
    return new Promise(resolve => {
        fs.readFile(file, encoding, (err, content) => {
            if (err){
                console.error(`Warn: failed to try read file "${file}", detail error:`, err)
                resolve(false)
            } else {
                resolve(content)
            }
        })
    })
}

export async function tryReadJsonFileContent(file, encoding='utf8') : Promise<any>{
    return new Promise(resolve => {
        fs.readFile(file, encoding, (err, content) => {
            if (err){
                console.error(`Warn: failed to try read JSON file "${file}", detail error:`, err)
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

export function humanizeSize(sizeInBytes: number): string{
    return (+sizeInBytes / 1000).toFixed(1).replace(/\.0+$/, '') + 'kb'
}

export function sleep(timeout: number): Promise<void>{
    return new Promise(resolve => setTimeout(resolve, timeout))
}

export type Runnable = (...args) => any
export async function serial(runnables: Runnable[]){
    for (let run of runnables){
        await run()
    }
}

export async function parallel(runnables: Runnable[]){
    const jobs = []

    for (let run of runnables){
        jobs.push(run())
    }

    await Promise.all(jobs)
}

export async function parallelLimit(runnables: Runnable[], limitNum=10){
    const runnablesArr = []

    for (let run of runnables){
        runnablesArr.push(run)
    }

    return new Promise((resolve, reject) => {
        const runnablesNum = runnablesArr.length

        let hasRejected = false
        let ranNum = 0
        let runningNum = 0

        const start = () => {
            for (; runningNum < limitNum && ranNum < runnablesNum; 
                   runningNum++, ranNum++){
                const run = runnablesArr[ranNum]
                const job = runJobAsPromise(run)
                
                job.then(() => {
                    runningNum--

                    if (!hasRejected){
                        start()
                    }
                }, err => {
                    runningNum--
                    hasRejected = true
                    reject(err)
                })
            }
    
        }

        start()
    })
}

async function runJobAsPromise(run: Runnable){
    return run()
}

export function extractDefault(module: any): any{
    return module ? (module.__esModule ? module.default : module) : undefined
}

