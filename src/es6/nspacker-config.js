"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nspack_entry_module_1 = require("./nspack-entry-module");
const path = require("path");
const nspack_default_processors_1 = require("./nspack-default-processors");
const node_module_resolver_1 = require("./node-module-resolver");
const extend = Object.assign;
function sanitizeAndFillConfig(config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isPackerConfig(config)) {
            return _sanitizeAndFillConfigSync.call(this, config);
        }
        if (typeof config === 'function') {
            const cfg = config();
            if (isPromise(cfg)) {
                return this._configResolving = cfg
                    .then((v) => _sanitizeAndFillConfigSync.call(this, v))
                    .then(() => {
                    this._configResolving = null;
                });
            }
            if (isPackerConfig(cfg)) {
                return _sanitizeAndFillConfigSync.call(this, cfg);
            }
            throw new Error("Invalid configuration resolve -- return value is not a Promise or a valid PackerConfig object.");
        }
        throw new Error("Invalid configuration -- it should be a PackerConfig object or a sync function or an async function returns a PackerConfig object");
    });
}
exports.sanitizeAndFillConfig = sanitizeAndFillConfig;
function isPromise(x) {
    return !!(typeof x === 'object' && x && typeof x.then === 'function');
}
function isPackerConfig(x) {
    return !!(typeof x === 'object' && x && x.entry);
}
function _sanitizeAndFillConfigSync(config) {
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
    this._nodeModuleResolver = new node_module_resolver_1.default(this._config.resolve);
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
function noop(...args) { }
