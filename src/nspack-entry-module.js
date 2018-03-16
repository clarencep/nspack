const extend = Object.assign
module.exports = class NSPackEntryModule{
    constructor(attributes, packer){
        this.packer = packer
        attributes && extend(this, attributes)

    }

    _checkIfNeedUpdate1(){
        this.jsModule._checkIfNeedUpdate1()
        this.cssModule._checkIfNeedUpdate1()
        this.htmlModule._checkIfNeedUpdate1()
    }



}