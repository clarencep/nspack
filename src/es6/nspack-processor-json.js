
/**
 * 
 * @param {NSPackModule} module 
 * @param {NSPack} packer 
 */
module.exports = function(module, packer){
    module.builtType = 'js'
    
    try {
        JSON.parse(module.source)
    } catch (e){
        throw new Error(`Invalid JSON file: ${module.relativePath}, detail: ${e + ''}`)
    }

    module.builtSource = 'module.exports = (' + module.source + ')'
}

