import {PackerConfig, EntryConfigItem, EntryContentReader, EntryFilePath, EntryContent, EntrySourceCode, EntryModule} from "./nspack-interface"
import NSPacker from "./nspacker"
import NSPackEntryModule from "./nspack-entry-module";
import * as fs from 'fs'
import * as path from 'path'
import {readFile} from './utils'

import defaultModuleProcessors from './nspack-default-processors'

const extend = Object.assign

export function sanitizeAndFillConfig(this: NSPacker, config: PackerConfig){
    const r = this._config = {...config}

    if (!r.entryBase){
        r.entryBase = process.cwd()
    }

    r.entry = {...config.entry}
    for (let entryName of Object.keys(r.entry)){
        this._entries[entryName] = new NSPackEntryModule(entryName, r.entry[entryName], this)
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
    
    return r
}


function noop(...args){}
