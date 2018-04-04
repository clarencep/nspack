import NsPackModule from './nspack-module'
import { Packer, Module, EntryModule, ModuleBundle, EntryModuleBundle, NewEntryModule, EntryConfig, EntryConfigItem, EntryContentReader, EntryContent, EntrySourceCode, EntryFilePath } from './nspack-interface';
import { readFile } from './utils';
import * as path from 'path'

const extend = Object.assign

export default class NSPackEntryModule implements EntryModule{
    name: string;
    
    libName?: string;
    libTarget?: string;
    amdExecOnDef?: boolean;
    ignoreMissingCss?: boolean;
    extractCssFromJs?: boolean;
    processed: boolean;

    jsModule: Module;
    cssModule: Module;

    bundle: EntryModuleBundle;

    js: EntryContentReader;
    css: EntryContentReader;
    html: EntryContentReader;
    
    entry: {
        name: string;
        baseDir: string;
    };

    needUpdate: boolean = false;
    private _packer: () => Packer;

    constructor(entryName, cfg: EntryConfig, packer: Packer){
        this._packer = () => packer
        extend(this, {
            name: entryName,
            js: entryConfigItemToEntryContentReader.call(this, cfg.js),
            css: entryConfigItemToEntryContentReader.call(this, cfg.css),
            html: entryConfigItemToEntryContentReader.call(this, cfg.html)  ,     
            extractCssFromJs: !!cfg.extractCssFromJs,
            ignoreMissingCss: !!cfg.ignoreMissingCss,
            libName: cfg.libName,
            libTarget: cfg.libTarget,
            amdExecOnDef: cfg.amdExecOnDef === undefined ? true : !!cfg.amdExecOnDef,
        })

        this.entry = {
            name: entryName,
            baseDir: this.baseDir,
        }
    }

    get packer(): Packer{
        return this._packer()
    }
    
    get baseDir(){
        return this.packer._config.entryBase
    }

    _checkIfNeedUpdate0(){
        // entry module need not this method
        return false
    }

    _checkIfNeedUpdate1(){
        if (this.needUpdate){
            return false
        }

        const jsNeedUpdates = this.jsModule._checkIfNeedUpdate1()
        const cssNeedUpdates = this.cssModule._checkIfNeedUpdate1()
        return this.needUpdate = (jsNeedUpdates || cssNeedUpdates)
    }
    loadJsSource(): Promise<EntryContent>{
        return this._loadSource(this.js, '.js')
    }
    loadCssSource(): Promise<EntryContent>{
        return this._loadSource(this.css, '.css')
    }
    async loadHtmlSource(): Promise<EntryContent>{
        // html source should be executed
        const data = await this.html.call(this, this)
        if (data.filePath){
            const filePath = path.resolve(this.baseDir, data.filePath)
            if (/\.js$/.test(filePath)){
                const sourceCodeResolver = require(filePath);
                if (typeof sourceCodeResolver !== 'function'){
                    throw new Error(`Invalid html resolver: ${filePath}. It should export a/an (async) function which returns the HTML source code.`)
                }

                const sourceCode = await sourceCodeResolver.call(this, this)
                return {filePath, sourceCode}
            }
        }

        return data
    }
    async _loadSource(reader: EntryContentReader, fileExtName: string): Promise<EntryContent>{
        const data = await reader.call(this, this)
        if (!data.filePath && data.sourceCode){
            data.filePath = path.resolve(this.baseDir, this.name + fileExtName)
        }

        return data
    }
}
function entryConfigItemToEntryContentReader(this: NSPackEntryModule, cfg: EntryConfigItem): EntryContentReader {
    if (!cfg){
        return (entry: EntryModule) => ({filePath: null, sourceCode: null})
    }

    if (isEntryFilePath(cfg)){
        return (entry: EntryModule) => sanitizeEntryContent.call(this, {filePath: cfg})
    }

    if (isEntryContent(cfg)){
        return (entry: EntryModule) => sanitizeEntryContent.call(this, cfg)
    }

    if (typeof cfg === 'function'){
        return (entry: EntryModule) => Promise.resolve(cfg(entry))
                     .then((data: EntrySourceCode|EntryContent): EntryContent|Promise<EntryContent> => {
                         if (isEntrySourceCode(data)){
                             return {sourceCode: data}
                         }

                         if (isEntryContent(data)){
                             return sanitizeEntryContent.call(this, data)
                         }

                         throw new Error("Invalid type of entry data!")
                     })
    }

    throw new Error("Invalid entry config item!")
}

function sanitizeEntryContent(this: NSPackEntryModule, entry: EntryContent): EntryContent|Promise<EntryContent>{
    if (entry.filePath && entry.sourceCode === undefined){
        return readFile(path.resolve(this.baseDir, entry.filePath))
                    .then(data => {
                        entry.sourceCode = data
                        return entry
                    })
    }

    return entry
}

function isEntrySourceCode(cfg: any): cfg is EntrySourceCode{
    return typeof cfg === 'string' || cfg instanceof Buffer || cfg === null
}

function isEntryFilePath(cfg: EntryConfigItem): cfg is EntryFilePath{
    return typeof cfg === 'string'
}

function isEntryContent(cfg: EntryConfigItem): cfg is EntryContent {
    return !!(typeof cfg === 'object' && (cfg.filePath || cfg.sourceCode))
}