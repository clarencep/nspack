"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
function readFile(filename, encoding) {
    if (encoding === void 0) { encoding = null; }
    return new Promise(function (resolve, reject) {
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
exports.readFile = readFile;
function tryFStat(file) {
    return new Promise(function (resolve) {
        fs.stat(file, function (err, stats) {
            if (err) {
                resolve(false);
            }
            else {
                resolve(stats);
            }
        });
    });
}
exports.tryFStat = tryFStat;
function tryReadFileContent(file, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    return new Promise(function (resolve) {
        fs.readFile(file, encoding, function (err, content) {
            if (err) {
                resolve(false);
            }
            else {
                resolve(content);
            }
        });
    });
}
exports.tryReadFileContent = tryReadFileContent;
function tryReadJsonFileContent(file, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    fs.readFile(file, encoding, function (err, content) {
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
                })];
        });
    });
}
exports.tryReadJsonFileContent = tryReadJsonFileContent;
function humanizeSize(sizeInBytes) {
    return (+sizeInBytes / 1000).toFixed(1).replace(/\.0+$/, '') + 'kb';
}
exports.humanizeSize = humanizeSize;
function sleep(timeout) {
    return new Promise(function (resolve) { return setTimeout(resolve, timeout); });
}
exports.sleep = sleep;
function serial(runnables) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, runnables_1, run;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, runnables_1 = runnables;
                    _a.label = 1;
                case 1:
                    if (!(_i < runnables_1.length)) return [3 /*break*/, 4];
                    run = runnables_1[_i];
                    return [4 /*yield*/, run()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.serial = serial;
function parallel(runnables) {
    return __awaiter(this, void 0, void 0, function () {
        var jobs, _i, runnables_2, run;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jobs = [];
                    for (_i = 0, runnables_2 = runnables; _i < runnables_2.length; _i++) {
                        run = runnables_2[_i];
                        jobs.push(run());
                    }
                    return [4 /*yield*/, Promise.all(jobs)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.parallel = parallel;
function parallelLimit(runnables, limitNum) {
    if (limitNum === void 0) { limitNum = 10; }
    return __awaiter(this, void 0, void 0, function () {
        var runnablesArr, _i, runnables_3, run;
        return __generator(this, function (_a) {
            runnablesArr = [];
            for (_i = 0, runnables_3 = runnables; _i < runnables_3.length; _i++) {
                run = runnables_3[_i];
                runnablesArr.push(run);
            }
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var runnablesNum = runnablesArr.length;
                    var hasRejected = false;
                    var ranNum = 0;
                    var runningNum = 0;
                    var start = function () {
                        for (; runningNum < limitNum && ranNum < runnablesNum; runningNum++, ranNum++) {
                            var run = runnablesArr[ranNum];
                            var job = runJobAsPromise(run);
                            job.then(function () {
                                runningNum--;
                                if (!hasRejected) {
                                    start();
                                }
                            }, function (err) {
                                runningNum--;
                                hasRejected = true;
                                reject(err);
                            });
                        }
                    };
                    start();
                })];
        });
    });
}
exports.parallelLimit = parallelLimit;
function runJobAsPromise(run) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, run()];
        });
    });
}
function extractDefault(module) {
    return module ? (module.__esModule ? module.default : module) : undefined;
}
exports.extractDefault = extractDefault;
