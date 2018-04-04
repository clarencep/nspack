"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var NSPackBuiltResult = /** @class */ (function () {
    function NSPackBuiltResult(packer) {
        this.updated = false;
        this._packer = function () { return packer; };
        this._buildTimes = packer.buildTimes;
        this.modules = {};
    }
    Object.defineProperty(NSPackBuiltResult.prototype, "packer", {
        get: function () {
            return this._packer();
        },
        enumerable: true,
        configurable: true
    });
    NSPackBuiltResult.prototype.buildTimes = function () {
        return this._buildTimes;
    };
    NSPackBuiltResult.prototype.spentTimeSeconds = function () {
        return (this.packer.buildSpentTimeMs / 1000).toFixed(3);
    };
    NSPackBuiltResult.prototype.summary = function () {
        var r = [];
        r.push("Done build. Spent " + this.spentTimeSeconds() + "(s)");
        for (var _i = 0, _a = Object.values(this.modules); _i < _a.length; _i++) {
            var module_1 = _a[_i];
            r.push("    " + module_1.name + ":");
            module_1.bundle.script && module_1.bundle.script.valid &&
                r.push("        " + module_1.bundle.script.outputName + ": \t" + utils_1.humanizeSize(module_1.bundle.script.outputSize) + "\t" + module_1.bundle.script.hash.substring(0, 4));
            module_1.bundle.style && module_1.bundle.style.valid &&
                r.push("        " + module_1.bundle.style.outputName + ": \t" + utils_1.humanizeSize(module_1.bundle.style.outputSize) + "\t" + module_1.bundle.style.hash.substring(0, 4));
            module_1.bundle.html && module_1.bundle.html.valid &&
                r.push("        " + module_1.bundle.html.outputName + ": \t" + utils_1.humanizeSize(module_1.bundle.html.outputSize) + "\t" + module_1.bundle.html.hash.substring(0, 4));
        }
        r.push("");
        return r.join("\n");
    };
    return NSPackBuiltResult;
}());
exports.default = NSPackBuiltResult;
