"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
function readFile(filename, encoding = null) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, { encoding: encoding }, function (err, data) {
            if (err) {
                console.error(`Error: failed to read file "${filename}", detail error:`, err);
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
exports.readFile = readFile;
function tryFStat(file) {
    return new Promise(resolve => {
        fs.stat(file, (err, stats) => {
            if (err) {
                console.error(`Warn: failed to try stat file "${file}", detail error:`, err);
                resolve(false);
            }
            else {
                resolve(stats);
            }
        });
    });
}
exports.tryFStat = tryFStat;
function tryReadFileContent(file, encoding = 'utf8') {
    return new Promise(resolve => {
        fs.readFile(file, encoding, (err, content) => {
            if (err) {
                console.error(`Warn: failed to try read file "${file}", detail error:`, err);
                resolve(false);
            }
            else {
                resolve(content);
            }
        });
    });
}
exports.tryReadFileContent = tryReadFileContent;
function tryReadJsonFileContent(file, encoding = 'utf8') {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            fs.readFile(file, encoding, (err, content) => {
                if (err) {
                    console.error(`Warn: failed to try read JSON file "${file}", detail error:`, err);
                    resolve(false);
                }
                else {
                    try {
                        resolve(JSON.parse(content));
                    }
                    catch (e) {
                        resolve(false);
                    }
                }
            });
        });
    });
}
exports.tryReadJsonFileContent = tryReadJsonFileContent;
function humanizeSize(sizeInBytes) {
    return (+sizeInBytes / 1000).toFixed(1).replace(/\.0+$/, '') + 'kb';
}
exports.humanizeSize = humanizeSize;
function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}
exports.sleep = sleep;
function serial(runnables) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let run of runnables) {
            yield run();
        }
    });
}
exports.serial = serial;
function parallel(runnables) {
    return __awaiter(this, void 0, void 0, function* () {
        const jobs = [];
        for (let run of runnables) {
            jobs.push(run());
        }
        yield Promise.all(jobs);
    });
}
exports.parallel = parallel;
function parallelLimit(runnables, limitNum = 10) {
    return __awaiter(this, void 0, void 0, function* () {
        const runnablesArr = [];
        for (let run of runnables) {
            runnablesArr.push(run);
        }
        return new Promise((resolve, reject) => {
            const runnablesNum = runnablesArr.length;
            let hasRejected = false;
            let ranNum = 0;
            let runningNum = 0;
            const start = () => {
                // debug("running: %o, limit: %o, ran: %o, runnables: %o", 
                //     runningNum, limitNum, ranNum, runnablesNum)
                if (hasRejected) {
                    return;
                }
                if (ranNum >= runnablesNum && runningNum <= 0) {
                    resolve();
                    return;
                }
                for (; runningNum < limitNum && ranNum < runnablesNum;) {
                    // debug("running: %o, limit: %o, ran: %o, runnables: %o", 
                    //     runningNum, limitNum, ranNum, runnablesNum)
                    const run = runnablesArr[ranNum];
                    const job = runJobAsPromise(run);
                    job.then(() => {
                        runningNum--;
                        start();
                    }, err => {
                        runningNum--;
                        hasRejected = true;
                        reject(err);
                    });
                    runningNum++;
                    ranNum++;
                    // debug("running: %o, limit: %o, ran: %o, runnables: %o", 
                    //     runningNum, limitNum, ranNum, runnablesNum)
                }
            };
            start();
        });
    });
}
exports.parallelLimit = parallelLimit;
function runJobAsPromise(run) {
    return __awaiter(this, void 0, void 0, function* () {
        return run();
    });
}
function extractDefault(module) {
    return module ? (module.__esModule ? module.default : module) : undefined;
}
exports.extractDefault = extractDefault;
