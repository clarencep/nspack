const extend = Object.assign
module.exports = class NSPackEntryModule{
    constructor(attributes, packer){
        this._packer = () => packer
        attributes && extend(this, attributes)

    }

    get packer(){
        return this._packer()
    }

    _checkIfNeedUpdate0(){
        // entry module need not this method
    }

    _checkIfNeedUpdate1(){
        const jsNeedUpdates = this.jsModule._checkIfNeedUpdate1()
        const cssNeedUpdates = this.cssModule._checkIfNeedUpdate1()
        return this.needUpdate = (jsNeedUpdates || cssNeedUpdates)
    }



}