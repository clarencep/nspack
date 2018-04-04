"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(module, packer) {
    return processModule(module, packer, guessModuleMediaType(module));
}
exports.default = default_1;
function withMimeType(mimeType) {
    return function (module, packer) {
        return processModule(module, packer, mimeType);
    };
}
exports.withMimeType = withMimeType;
const moduleTypeToMediaType = {
    'txt': 'text/plain',
    'text': 'text/plain',
    'js': 'application/javascript',
    'css': 'text/css',
    'htm': 'text/html',
    'html': 'text/html',
    'bmp': 'image/bmp',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'ico': 'image/ico',
};
function processModule(module, packer, mediaType) {
    module.builtType = 'js';
    module.builtSource = `data:${mediaType};base64,` + toBuffer(module.source).toString('base64');
}
function guessModuleMediaType(module) {
    return moduleTypeToMediaType[module.type] || 'application/octet-stream';
}
function toBuffer(data) {
    if (typeof data === 'string') {
        return new Buffer(data);
    }
    return data;
}
