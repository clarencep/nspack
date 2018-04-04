import { Module, Packer } from "./nspack-interface";


export default function(module: Module, packer: Packer){
    module.builtType = 'js'
    
    try {
        JSON.parse(module.source + '')
    } catch (e){
        throw new Error(`Invalid JSON file: ${module.relativePath}, detail: ${e + ''}`)
    }

    module.builtSource = 'module.exports = (' + module.source + ')'
}

