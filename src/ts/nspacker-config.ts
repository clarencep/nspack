import {PackerConfig, EntryConfigItem, EntryContentReader, EntryFilePath, EntryContent, EntrySourceCode, EntryModule, PackerConfigArg} from "./nspack-interface"
import NSPacker from "./nspacker"
import NSPackEntryModule from "./nspack-entry-module";
import * as fs from 'fs'
import * as path from 'path'
import {readFile} from './utils'

import defaultModuleProcessors from './nspack-default-processors'
import NodeModuleResolver from "./node-module-resolver";

const extend = Object.assign

export async function sanitizeAndFillConfig(this: NSPacker, config: PackerConfigArg): Promise<any>{
    if (isPackerConfig(config)){
        return _sanitizeAndFillConfigSync.call(this, config)
    }

    if (typeof config === 'function'){
        const cfg = config()
        if (isPromise(cfg)){
            return this._configResolving = cfg
                .then((v) => _sanitizeAndFillConfigSync.call(this, v))
                .then(() => {
                    this._configResolving = null
                })
        } 
        
        if (isPackerConfig(cfg)){
            return _sanitizeAndFillConfigSync.call(this, cfg)
        }
        
        throw new Error("Invalid configuration resolve -- return value is not a Promise or a valid PackerConfig object.")
    }

    throw new Error("Invalid configuration -- it should be a PackerConfig object or a sync function or an async function returns a PackerConfig object")
}

function isPromise(x: any): x is PromiseLike<any> {
    return !!(typeof x === 'object' && x && typeof x.then === 'function')
}

function isPackerConfig(x: PackerConfigArg): x is PackerConfig{
    return !!(typeof x === 'object' && x && x.entry)
}

function _sanitizeAndFillConfigSync(this: NSPacker, config: PackerConfig){
    const r = this._config = {...config}

    if (!r.entryBase){
        r.entryBase = process.cwd()
    }

    r.entry = {...config.entry}
    for (let entryName of Object.keys(r.entry)){
        const entryConfig = r.entry[entryName]
        if (!r.entryFilter || r.entryFilter(entryName, entryConfig)){
            this._entries[entryName] = new NSPackEntryModule(entryName, entryConfig, this)
        }
    }

    if (!r.outputBase){
        r.outputBase = path.join(process.cwd(), 'dist')
    }

    r.output = extend({
        '*': {
            js: '[name].js',
            css: '[name].css',
            html: '[name].html',
        }
    }, r.output || {})

    // r.outputHashManifests = r.outputHashManifests || null

    r.hashLength = +r.hashLength || 6
    
    r.resolve = extend({
        extensions: ['.js'],
        alias: {
            '@': r.entryBase,
        },
    }, r.resolve || {})

    this._nodeModuleResolver = new NodeModuleResolver(this._config.resolve)

    r.moduleProcessors = {...defaultModuleProcessors, ...r.moduleProcessors}

    r.externals = r.externals || {}

    r.hooks = extend({
        outputFile: noop,
        buildManifests: noop,
    }, r.hooks || {})

    r.watchInterval = +r.watchInterval || 500

    this.debugLevel = r.debugLevel = (r.debugLevel === undefined ? +process.env.NSPACK_DEBUG_LEVEL : +r.debugLevel) || 0

    this._fs = r.fs || require('fs')

    // babelrc keeps no changed.

    r.parallelLimit = +r.parallelLimit || +process.env.NSPACK_PARALLEL_LIMIT || 10
    
    
    return r
}


function noop(...args){}
