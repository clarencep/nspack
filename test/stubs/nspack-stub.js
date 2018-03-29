var regeneratorRuntime = require("regenerator-runtime");
module.exports = class NSPackStub {
    constructor(){
        this.modules = []
        this.modulesByName = {}
    }
    async addModule(module){
        this.modules.push(module)
        this.modulesByName[module.name] = module
        return module
    }
    async addOrUpdateModule(module){
        if (this.modulesByName[module.name]){
            this.modulesByName[module.name] = module
        }

        this.modules.push(module)
        this.modulesByName[module.name] = module
        return module
    }
}

