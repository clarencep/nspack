/**
 * 
 * @param {NSPackModule} module 
 * @param {NSPack} packer 
 */
module.exports = function (module, packer){
    return processModule(module, packer, guessModuleMediaType(module))
}

module.exports.withMimeType = function(mimeType){
    return function(module, packer){
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

function processModule(module, packer, mediaType){
    module.builtType = 'js'
    module.builtSource = `data:${mediaType};base64,` + module.source.toString('base64')
}

function guessModuleMediaType(module){
    return moduleTypeToMediaType[module.type] || 'application/octet-stream'
}
