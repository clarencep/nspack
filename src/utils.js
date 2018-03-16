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