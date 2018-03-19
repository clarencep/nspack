const path = require('path')
const extend = Object.assign
const debug = require('debug')('nspack')
const {tryFStat, readFile,} = require('./utils')


module.exports = class NSPackModule {
    constructor(attributes, packer){
        this._packer = () => packer
        attributes && extend(this, attributes)

        if (this.relativePath === undefined){
            this.relativePath = path.relative(
                this.packer._config.entryBase, 
                this.fullPathName
            )
        }

        if (this.type === undefined){
            this.type = path.extname(this.fullPathName).replace(/^./, '').toLowerCase()
        }

        if (this.fullFileDirName === undefined){
            this.fullFileDirName = path.dirname(this.fullPathName)
        }

        this.dependencies = []
    }

    get packer(){
        return this._packer()
    }

    async loadSource(){
        if (this.source === undefined && !this.isExternal && !this.isInternal){
            this.packer.debugLevel > 1 && debug("read module source from file: %o, module: %o", this.fullPathName, this)

            const readFileAt = Date.now()
            this.source = await readFile(this.fullPathName, "utf8")
            this.sourceUpdatedAt = readFileAt
            return 
        }
    }

    async _checkIfNeedUpdate0(){
        if (!this.isInternal && !this.isExternal){
            const stat = await tryFStat(this.fullPathName)
            if (!stat || !stat.isFile() || +stat.mtimeMs > this.sourceUpdatedAt){
                return this.needUpdate = true
            }
        }
    }

    _checkIfNeedUpdate1(){
        if (this.needUpdate){
            return true
        }

        for (let dependModule of this.dependencies){
            if (dependModule._checkIfNeedUpdate1()){
                return this.needUpdate = true
            }
        }
    }



}

