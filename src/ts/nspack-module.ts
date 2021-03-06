import {tryFStat, readFile} from './utils'
import * as path from 'path'
import { Module, ModuleBuiltType, Packer, NewModule, ModuleBundle } from './nspack-interface';

const extend = Object.assign
const debug = require('debug')('nspack')


const textFileTypesRe = /^(txt|text|js|jsx|css|less|json|htm|html|vue)$/

export default class NSPackModule implements Module, ModuleBundle {
    id: number;
    name: string;
    baseDir: string;

    type: string;
    source?: string|Buffer;
    builtType: ModuleBuiltType;
    builtSource: string|Buffer;

    file?: string;
    relativePath: string;
    fullPathName: string;
    fullFileDirName: string;

    dependencies: Module[];

    resolvingParents: string;
    resolvingParentsAndSelf: string;

    valid: boolean;
    outputSource: string|Buffer;
    outputSize: number;
    outputName: string;
    hash: string;

    processed: boolean = false;
    processing: Promise<any>|false = false;

    isExternal: boolean = false;
    isInternal: boolean = false;
    needUpdate: boolean = false;
    fresh: boolean = false;

    libName: string;
    libTarget: string;
    amdExecOnDef: boolean = false;

    cssExtracted: boolean = false;
    extractedCss: string = '';

    private _packer: () => Packer;
    private encoding: string|null;
    private sourceUpdatedAt: number;
    
    constructor(attributes: NewModule, packer: Packer){
        this._packer = () => packer
        attributes && extend(this, attributes)

        if (!this.fullPathName){
            throw new Error("Invalid module -- no fullPathName!")
        }

        if (this.relativePath === undefined){
            this.relativePath = path.relative(
                this.entryBase, 
                this.fullPathName
            )
        }

        if (this.type === undefined){
            this.type = path.extname(this.fullPathName).replace(/^./, '').toLowerCase()
        }

        if (this.fullFileDirName === undefined){
            this.fullFileDirName = path.dirname(this.fullPathName)
        }

        if (this.encoding === undefined){
            this.encoding = this._isTextFile() ? 'utf8' : null
        }

        this.resolvingParentsAndSelf = "\n-- " + this.relativePath + (this.resolvingParents || '')

        this.dependencies = []
        
        this.packer.debugLevel > 2 && debug("new module: %o", this)
    }

    get packer(): Packer{
        return this._packer()
    }

    get entryBase(): string {
        return this.packer._config.entryBase
    }

    async loadSource(): Promise<void>{
        if ((this.needUpdate || this.source === undefined) && !this.isExternal && !this.isInternal){
            this.packer.debugLevel > 1 && debug("read module source from file: %o, module: %o", this.fullPathName, this)

            const readFileAt = Date.now()
            this.source = await readFile(this.fullPathName, this.encoding)
            this.sourceUpdatedAt = readFileAt
            return 
        }
    }

    async _checkIfNeedUpdate0(): Promise<boolean>{
        if (!this.isInternal && !this.isExternal){
            const stat = await tryFStat(this.fullPathName)
            if (!stat || !stat.isFile() || +stat.mtimeMs > this.sourceUpdatedAt){
                this.packer.debugLevel > 3 && debug("source updated: %o, at %o", this.fullPathName, stat)
                return this.needUpdate = true
            }
        }
    }

    _checkIfNeedUpdate1(): boolean{
        if (this.needUpdate){
            return true
        }

        for (let dependModule of this.dependencies){
            if (dependModule._checkIfNeedUpdate1()){
                return this.needUpdate = true
            }
        }
    }

    _isTextFile(): boolean{
        const type = this.type
        return textFileTypesRe.test(type)
    }


}

