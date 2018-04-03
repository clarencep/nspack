"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var nspack_entry_module_1 = require("./nspack-entry-module");
var path = require("path");
var nspack_default_processors_1 = require("./nspack-default-processors");
var extend = Object.assign;
function sanitizeAndFillConfig(config) {
    var r = this._config = __assign({}, config);
    if (!r.entryBase) {
        r.entryBase = process.cwd();
    }
    r.entry = __assign({}, config.entry);
    for (var _i = 0, _a = Object.keys(r.entry); _i < _a.length; _i++) {
        var entryName = _a[_i];
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
    r.moduleProcessors = __assign({}, nspack_default_processors_1.default, r.moduleProcessors);
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
function noop() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
}
