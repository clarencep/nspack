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
        for (let module of Object.values(this.modules)) {
            r.push("    " + module.name + ":");
            module.bundle.script && module.bundle.script.valid &&
                r.push("        " + module.bundle.script.outputName + ": \t" + utils_1.humanizeSize(module.bundle.script.outputSize) + "\t" + module.bundle.script.hash.substring(0, 4));
            module.bundle.style && module.bundle.style.valid &&
                r.push("        " + module.bundle.style.outputName + ": \t" + utils_1.humanizeSize(module.bundle.style.outputSize) + "\t" + module.bundle.style.hash.substring(0, 4));
            module.bundle.html && module.bundle.html.valid &&
                r.push("        " + module.bundle.html.outputName + ": \t" + utils_1.humanizeSize(module.bundle.html.outputSize) + "\t" + module.bundle.html.hash.substring(0, 4));
        }
        r.push("");
        return r.join("\n");
    }
}
exports.default = NSPackBuiltResult;
