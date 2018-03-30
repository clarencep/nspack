const fs = require('fs')
const debug = require('debug')('nspack')
const cb2p = require('./cb2p')

module.exports = {
    tryFStat,
    tryReadFileContent,
    tryReadJsonFileContent,
    humanizeSize,
    sleep,
    readFile: cb2p(fs.readFile),
    serial,
    parallel,
    parallelLimit,
}

async function tryFStat(file){
    return new Promise(resolve => {
        fs.stat(file, (err, stats) => {
            if (err){
                resolve(false)
            } else {
                resolve(stats)
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

function humanizeSize(sizeInBytes){
    return (+sizeInBytes / 1000).toFixed(1).replace(/\.0+$/, '') + 'kb'
}

function sleep(timeout){
    return new Promise(resolve => setTimeout(resolve, timeout))
}

async function serial(runnables){
    for (let run of runnables){
        await run()
    }
}

async function parallel(runnables){
    const jobs = []

    for (let run of runnables){
        jobs.push(run())
    }

    await Promise.all(jobs)
}

async function parallelLimit(runnables, limitNum){
    limitNum = +limitNum || 10

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

async function runJobAsPromise(run){
    return run()
}

