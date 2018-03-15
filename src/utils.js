const fs = require('fs')
const debug = require('debug')('nspack')

module.exports = {
    tryFStat,
    tryReadFileContent,
    tryReadJsonFileContent,
    humanizeSize,
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

