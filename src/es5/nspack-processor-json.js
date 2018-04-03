"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(module, packer) {
    module.builtType = 'js';
    try {
        JSON.parse(module.source + '');
    }
    catch (e) {
        throw new Error("Invalid JSON file: " + module.relativePath + ", detail: " + (e + ''));
    }
    module.builtSource = 'module.exports = (' + module.source + ')';
}
exports.default = default_1;
