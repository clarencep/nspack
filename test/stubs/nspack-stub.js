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
}

