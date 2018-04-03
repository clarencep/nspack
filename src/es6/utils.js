var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as fs from "fs";
export function readFile(filename, encoding = null) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, { encoding: encoding }, function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
export function tryFStat(file) {
    return new Promise(resolve => {
        fs.stat(file, (err, stats) => {
            if (err) {
                resolve(false);
            }
            else {
                resolve(stats);
            }
        });
    });
}
export function tryReadFileContent(file, encoding = 'utf8') {
    return new Promise(resolve => {
        fs.readFile(file, encoding, (err, content) => {
            if (err) {
                resolve(false);
            }
            else {
                resolve(content);
            }
        });
    });
}
export function tryReadJsonFileContent(file, encoding = 'utf8') {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => {
            fs.readFile(file, encoding, (err, content) => {
                if (err) {
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
export function humanizeSize(sizeInBytes) {
    return (+sizeInBytes / 1000).toFixed(1).replace(/\.0+$/, '') + 'kb';
}
export function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}
export function serial(runnables) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let run of runnables) {
            yield run();
        }
    });
}
export function parallel(runnables) {
    return __awaiter(this, void 0, void 0, function* () {
        const jobs = [];
        for (let run of runnables) {
            jobs.push(run());
        }
        yield Promise.all(jobs);
    });
}
export function parallelLimit(runnables, limitNum = 10) {
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
                for (; runningNum < limitNum && ranNum < runnablesNum; runningNum++, ranNum++) {
                    const run = runnablesArr[ranNum];
                    const job = runJobAsPromise(run);
                    job.then(() => {
                        runningNum--;
                        if (!hasRejected) {
                            start();
                        }
                    }, err => {
                        runningNum--;
                        hasRejected = true;
                        reject(err);
                    });
                }
            };
            start();
        });
    });
}
function runJobAsPromise(run) {
    return __awaiter(this, void 0, void 0, function* () {
        return run();
    });
}
export function extractDefault(module) {
    return module ? (module.__esModule ? module.default : module) : undefined;
}
