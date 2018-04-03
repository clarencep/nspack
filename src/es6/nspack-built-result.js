"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
class NSPackBuiltResult {
    constructor(packer) {
        this.updated = false;
        this._packer = () => packer;
        this._buildTimes = packer.buildTimes;
        this.modules = {};
    }
    get packer() {
        return this._packer();
    }
    buildTimes() {
        return this._buildTimes;
    }
    spentTimeSeconds() {
        return (this.packer.buildSpentTimeMs / 1000).toFixed(3);
    }
    summary() {
        const r = [];
        r.push(`Done build. Spent ${this.spentTimeSeconds()}(s)`);
        const tbl = [];
        for (let module of Object.values(this.modules)) {
            tbl.push(['  ' + module.name + ':']);
            if (module.bundle.script && module.bundle.script.valid) {
                tbl.push([
                    '',
                    module.bundle.script.outputName,
                    utils_1.humanizeSize(module.bundle.script.outputSize),
                    module.bundle.script.hash,
                ]);
            }
            if (module.bundle.style && module.bundle.style.valid) {
                tbl.push([
                    '',
                    module.bundle.style.outputName,
                    utils_1.humanizeSize(module.bundle.style.outputSize),
                    module.bundle.style.hash,
                ]);
            }
            if (module.bundle.html && module.bundle.html.valid) {
                tbl.push([
                    '',
                    module.bundle.html.outputName,
                    utils_1.humanizeSize(module.bundle.html.outputSize),
                    module.bundle.html.hash,
                ]);
            }
        }
        r.push(renderTable(tbl));
        r.push("");
        return r.join("\n");
    }
}
exports.default = NSPackBuiltResult;
function renderTable(table) {
    const r = [];
    const maxColsLen = [0, 0, 0, 0];
    for (let row of table) {
        for (let i = 0; i < row.length; i++) {
            const cell = row[i];
            if (cell.length > maxColsLen[i]) {
                maxColsLen[i] = cell.length;
            }
        }
    }
    const maxMaxColsLen = [4, 50, 10, 10];
    for (let i = 0; i < maxMaxColsLen.length; i++) {
        if (maxColsLen[i] > maxMaxColsLen[i]) {
            maxColsLen[i] = maxMaxColsLen[i];
        }
    }
    for (let row of table) {
        if (row.length <= 0) {
            continue;
        }
        if (row.length === 1) {
            r.push(row[0]);
            continue;
        }
        r.push(row.map((v, i) => i === 2 ? padSpaceLeft(v, maxColsLen[i]) : padSpaceRight(v, maxColsLen[i])).join(" "));
    }
    return r.join("\n");
}
function padSpaceLeft(v, len) {
    if (v.length >= len) {
        return v;
    }
    return new Array(len - v.length).fill(' ').join('') + v;
}
function padSpaceRight(v, len) {
    if (v.length >= len) {
        return v;
    }
    return v + new Array(len - v.length).fill(' ').join('');
}
