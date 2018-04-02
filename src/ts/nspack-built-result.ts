
import { Packer, Module, EntryModule, BuiltResult } from './nspack-interface';
import {humanizeSize} from './utils'

type PackerGetter = () => Packer

export default class NSPackBuiltResult implements BuiltResult {
    private _packer: PackerGetter;
    private _buildTimes: number;
    public modules: {[entryName: string]: EntryModule};
    public updated: boolean = false;


    constructor(packer: Packer){
        this._packer = () => packer
        this._buildTimes = packer.buildTimes
        this.modules = {}
    }

    get packer(): Packer{
        return this._packer()
    }

    buildTimes(): number{
        return this._buildTimes
    }

    spentTimeSeconds(): string{
        return (this.packer.buildSpentTimeMs / 1000).toFixed(3)
    }

    summary(): string{
        const r = []
        r.push(`Done build. Spent ${this.spentTimeSeconds()}(s)`)

        for (let module of Object.values(this.modules)){
            r.push("    " + module.name + ":")

            module.bundle.script && module.bundle.script.valid && 
            r.push("        " + module.bundle.script.outputName + ": \t" + humanizeSize(module.bundle.script.outputSize) + "\t" + module.bundle.script.hash.substring(0,4))

            module.bundle.style && module.bundle.style.valid && 
            r.push("        " + module.bundle.style.outputName + ": \t" + humanizeSize(module.bundle.style.outputSize) + "\t" + module.bundle.style.hash.substring(0,4))

            module.bundle.html && module.bundle.html.valid &&
            r.push("        " + module.bundle.html.outputName + ": \t" + humanizeSize(module.bundle.html.outputSize) + "\t" + module.bundle.html.hash.substring(0,4))
        }

        r.push("")

        return r.join("\n")
    }
}
