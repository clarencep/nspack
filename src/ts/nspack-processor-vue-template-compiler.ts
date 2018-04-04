import { Module, Packer } from "./nspack-interface";

const vueTplCompiler = require('vue-template-compiler')
const transpile = require('vue-template-es2015-compiler')

export default function (module: Module, packer: Packer){
    const res = vueTplCompiler.compile(module.source + '')
    if (res.errors.length > 0){
        throw new Error(`Failed to compile vue template ${module.fullPathName}: ${res.errors.join("\n")}`)
    }

    const lines = [
        'exports.render = ', toFunction(res.render),
        'exports.staticRenderFns = [', 
    ]

    res.staticRenderFns.forEach(fn => {
        lines.push(toFunction(fn))
        lines.push(',')
    })
    
    lines.push(']')

    module.builtSource = lines.join("\n")
    module.builtType = 'js'
}


function toFunction(funcBody: string): string{
    return transpile(`function render(){${funcBody}}`)
}
