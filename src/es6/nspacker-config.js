"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nspack_entry_module_1 = require("./nspack-entry-module");
const path = require("path");
const nspack_default_processors_1 = require("./nspack-default-processors");
const extend = Object.assign;
function sanitizeAndFillConfig(config) {
    const r = this._config = Object.assign({}, config);
    if (!r.entryBase) {
        r.entryBase = process.cwd();
    }
    r.entry = Object.assign({}, config.entry);
    for (let entryName of Object.keys(r.entry)) {
        this._entries[entryName] = new nspack_entry_module_1.default(entryName, r.entry[entryName], this);
    }
    if (!r.outputBase) {
        r.outputBase = path.join(process.cwd(), 'dist');
    }
    r.output = extend({
        '*': {
            js: '[name].js',
            css: '[name].css',
            html: '[name].html',
        }
    }, r.output || {});
    // r.outputHashManifests = r.outputHashManifests || null
    r.hashLength = +r.hashLength || 6;
    r.resolve = extend({
        extensions: ['.js'],
        alias: {
            '@': r.entryBase,
        },
    }, r.resolve || {});
    r.moduleProcessors = Object.assign({}, nspack_default_processors_1.default, r.moduleProcessors);
    r.externals = r.externals || {};
    r.hooks = extend({
        outputFile: noop,
        buildManifests: noop,
    }, r.hooks || {});
    r.watchInterval = +r.watchInterval || 500;
    this.debugLevel = r.debugLevel = (r.debugLevel === undefined ? +process.env.NSPACK_DEBUG_LEVEL : +r.debugLevel) || 0;
    this._fs = r.fs || require('fs');
    // babelrc keeps no changed.
    return r;
}
exports.sanitizeAndFillConfig = sanitizeAndFillConfig;
function noop(...args) { }
