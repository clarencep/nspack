import { Module, Packer } from "./nspack-interface";

export default function (module: Module, packer: Packer){
    module.builtType = 'css'
    // todo...
    module.builtSource = module.builtSource || module.source
}