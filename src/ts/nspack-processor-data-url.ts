import { Module, Packer, ModuleProcessor } from "./nspack-interface";

export default function (module: Module, packer: Packer){
    return processModule(module, packer, guessModuleMediaType(module))
}

export function withMimeType(mimeType: string): ModuleProcessor{
    return function(module: Module, packer: Packer){
        return processModule(module, packer, mimeType)
    }
}

const moduleTypeToMediaType = {
    'txt': 'text/plain',
    'text': 'text/plain',
    'js': 'application/javascript',
    'css': 'text/css',
    'htm': 'text/html',
    'html': 'text/html',
    'bmp' : 'image/bmp',
    'png' : 'image/png',
    'jpg' : 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif' : 'image/gif',
    'webp': 'image/webp',
    'ico' : 'image/ico',
}

function processModule(module: Module, packer: Packer, mediaType: string){
    module.builtType = 'js'
    module.builtSource = `data:${mediaType};base64,` + toBuffer(module.source).toString('base64')
}

function guessModuleMediaType(module: Module){
    return moduleTypeToMediaType[module.type] || 'application/octet-stream'
}

function toBuffer(data: string|Buffer): Buffer{
    if (typeof data === 'string'){
        return new Buffer(data)
    }

    return data
}
