const {humanizeSize} = require('./utils')

module.exports = class NSPackBuiltResult{
    constructor(packer){
        this.packer = packer
        this.modules = {}
    }

    summary(){
        const r = []
        r.push(`Done build. Spent ${(this.packer.buildSpentTimeMs / 1000).toFixed(3)}(s)`)

        for (let module of Object.values(this.modules)){
            r.push("    " + module.name + ":")
            r.push("        " + module.bundle.script.outputName + ": \t" + humanizeSize(module.bundle.script.outputSize) + "\t" + module.bundle.script.hash.substring(0,4))
            r.push("        " + module.bundle.style.outputName + ": \t" + humanizeSize(module.bundle.style.outputSize) + "\t" + module.bundle.style.hash.substring(0,4))
            r.push("        " + module.bundle.html.outputName + ": \t" + humanizeSize(module.bundle.html.outputSize) + "\t" + module.bundle.html.hash.substring(0,4))
        }

        r.push("")

        return r.join("\n")
    }
}
