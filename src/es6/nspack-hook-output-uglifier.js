var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { humanizeSize } from "./utils";
const extend = Object.assign;
export default {
    defaultInstance: getDefaultUglifier,
    defaultConfig: getDefaultConfig,
    withConfig: config => new OutputUglifier(config),
    apply(that, args) {
        return that.defaultInstance().handle(...args);
    },
    call(that, ...args) {
        return that.apply(that, args);
    }
};
let defaultUglifier;
function getDefaultUglifier() {
    if (!defaultUglifier) {
        defaultUglifier = new OutputUglifier();
    }
    return defaultUglifier;
}
function getDefaultConfig() {
    const UglifyJs = require('uglify-js');
    const postcss = require('postcss');
    const autoprefixer = require('autoprefixer');
    const cssnano = require('cssnano');
    const HtmlMinifier = require('html-minifier');
    return {
        js: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: ({ code, options }) => UglifyJs.minify(code, options),
            options: {}
        },
        css: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: ({ code, options }) => {
                return postcss([
                    autoprefixer,
                    new cssnano({
                        preset: 'default',
                        zindex: false,
                        reduceIdents: false,
                    })
                ])
                    .process(code, { from: undefined, to: undefined })
                    .then(res => {
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
            handle: ({ code, options }) => {
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
class OutputUglifier {
    constructor(config = {}) {
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
    handle(outputFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const handler = this._config[outputFile.outputType];
            if (!handler) {
                return;
            }
            outputFile.minimizedFilePath = getMinimizedPath(outputFile.filePath);
            if (outputFile.outputType === 'html') {
                const { jsModule, cssModule } = outputFile.entryModule;
                const html = yield outputFile.entryModule.loadHtmlSource.call(Object.assign({}, outputFile.entryModule, { bundle: Object.assign({}, outputFile.entryModule.bundle, { scriptsTags: jsModule.outputSource ? `<script src="/${getMinimizedPath(jsModule.outputName)}"></script>` : '', stylesTags: cssModule.outputSource ? `<link rel="stylesheet" href="/${getMinimizedPath(cssModule.outputName)}" >` : '' }) }));
                outputFile.content = html.sourceCode;
            }
            if (!outputFile.content) {
                return;
            }
            const res = yield handler.handle({
                code: outputFile.content,
                options: handler.options,
            });
            if (res.warnings) {
                console.warn(res.warnings);
            }
            if (res.error) {
                throw res.error;
            }
            outputFile.minimizedContent = res.code;
            console.log(`minfied ${outputFile.filePath}, reduced size from ${humanizeSize(outputFile.content.length)} to ${humanizeSize(res.code.length)}`);
            yield outputFile.write({
                filePath: outputFile.minimizedFilePath,
                content: res.code,
            });
        });
    }
    call(that, ...args) {
        return that.apply(that, args);
    }
    apply(that, args) {
        that.handle(...args);
    }
}
function getMinimizedPath(filepath) {
    return filepath.replace(/\.(\w+)$/, ($0, $1) => `.min.${$1}`);
}
