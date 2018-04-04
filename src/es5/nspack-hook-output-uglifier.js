"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var extend = Object.assign;
exports.default = {
    defaultInstance: getDefaultUglifier,
    defaultConfig: getDefaultConfig,
    withConfig: function (config) { return new OutputUglifier(config); },
    apply: function (that, args) {
        return (_a = that.defaultInstance()).handle.apply(_a, args);
        var _a;
    },
    call: function (that) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return that.apply(that, args);
    }
};
var defaultUglifier;
function getDefaultUglifier() {
    if (!defaultUglifier) {
        defaultUglifier = new OutputUglifier();
    }
    return defaultUglifier;
}
function getDefaultConfig() {
    var UglifyJs = require('uglify-js');
    var postcss = require('postcss');
    var autoprefixer = require('autoprefixer');
    var cssnano = require('cssnano');
    var HtmlMinifier = require('html-minifier');
    return {
        js: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: function (_a) {
                var code = _a.code, options = _a.options;
                return UglifyJs.minify(code, options);
            },
            options: {}
        },
        css: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: function (_a) {
                var code = _a.code, options = _a.options;
                return postcss([
                    autoprefixer,
                    new cssnano({
                        preset: 'default',
                        zindex: false,
                        reduceIdents: false,
                    })
                ])
                    .process(code, { from: undefined, to: undefined })
                    .then(function (res) {
                    return {
                        code: res.css,
                    };
                });
            },
            options: {},
        },
        html: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: function (_a) {
                var code = _a.code, options = _a.options;
                return {
                    code: HtmlMinifier.minify(code, options)
                };
            },
            options: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
            },
        },
    };
}
var OutputUglifier = /** @class */ (function () {
    function OutputUglifier(config) {
        if (config === void 0) { config = {}; }
        this._config = extend(getDefaultConfig(), config);
    }
    /**
     *
     * @param {{
     *          packer,
                entryModule,
                outputName, outputType,
                filePath, fileDir,
                content,
                write,
            }} outputFile
    */
    OutputUglifier.prototype.handle = function (outputFile) {
        return __awaiter(this, void 0, void 0, function () {
            var handler, _a, jsModule, cssModule, html, res;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        handler = this._config[outputFile.outputType];
                        if (!handler) {
                            return [2 /*return*/];
                        }
                        outputFile.minimizedFilePath = getMinimizedPath(outputFile.filePath);
                        if (!(outputFile.outputType === 'html')) return [3 /*break*/, 2];
                        _a = outputFile.entryModule, jsModule = _a.jsModule, cssModule = _a.cssModule;
                        return [4 /*yield*/, outputFile.entryModule.loadHtmlSource.call(__assign({}, outputFile.entryModule, { bundle: __assign({}, outputFile.entryModule.bundle, { scriptsTags: jsModule.outputSource ? "<script src=\"/" + getMinimizedPath(jsModule.outputName) + "\"></script>" : '', stylesTags: cssModule.outputSource ? "<link rel=\"stylesheet\" href=\"/" + getMinimizedPath(cssModule.outputName) + "\" >" : '' }) }))];
                    case 1:
                        html = _b.sent();
                        outputFile.content = html.sourceCode;
                        _b.label = 2;
                    case 2:
                        if (!outputFile.content) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, handler.handle({
                                code: outputFile.content,
                                options: handler.options,
                            })];
                    case 3:
                        res = _b.sent();
                        if (res.warnings) {
                            console.warn(res.warnings);
                        }
                        if (res.error) {
                            throw res.error;
                        }
                        outputFile.minimizedContent = res.code;
                        console.log("minfied " + outputFile.filePath + ", reduced size from " + utils_1.humanizeSize(outputFile.content.length) + " to " + utils_1.humanizeSize(res.code.length));
                        return [4 /*yield*/, outputFile.write({
                                filePath: outputFile.minimizedFilePath,
                                content: res.code,
                            })];
                    case 4:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OutputUglifier.prototype.call = function (that) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return that.apply(that, args);
    };
    OutputUglifier.prototype.apply = function (that, args) {
        that.handle.apply(that, args);
    };
    return OutputUglifier;
}());
function getMinimizedPath(filepath) {
    return filepath.replace(/\.(\w+)$/, function ($0, $1) { return ".min." + $1; });
}
