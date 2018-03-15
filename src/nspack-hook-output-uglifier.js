const extend = Object.assign
const {humanizeSize} = require('./utils')

module.exports = {
    defaultInstance: getDefaultUglifier,
    defaultConfig: getDefaultConfig,
    withConfig: config => new OutputUglifier(config),
    apply(that, args){
        return that.defaultInstance().handle(...args)
    },
    call(that, ...args){
        return that.apply(that, args)
    }
}

let defaultUglifier

function getDefaultUglifier(){
    if (!defaultUglifier){
        defaultUglifier = new OutputUglifier()
    }

    return defaultUglifier
}

function getDefaultConfig(){
    const UglifyJs = require('uglify-js')
    const postcss = require('postcss')
    const autoprefixer = require('autoprefixer')
    const cssnano = require('cssnano')
    const HtmlMinifier = require('html-minifier')

    return {
        js: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: ({code, options}) => UglifyJs.minify(code, options),
            options: {}
        },
        css: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: ({code, options}) => {
                return postcss([
                            autoprefixer,
                            new cssnano({
                                preset: 'default',
                                zindex: false, // if z-index changes, something may goes wrong
                                reduceIdents: false, // if reduceIdents is true, keyframes' names will be minfied. I don't like that.
                            })
                        ])
                        .process(code)
                        .then(res => {
                            return {
                                code: res.css,
                            }
                        })
            },
            options: {},
        },
        html: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: ({code, options}) => {
                return {
                    code: HtmlMinifier.minify(code, options)
                }
            },
            options: {
                collapseWhitespace: true,
                removeAttributeQuotes: true,
            },
        },
    }
}

class OutputUglifier{
    constructor(config){
        this._config = extend(getDefaultConfig(), config || {})
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
    async handle(outputFile){
        const handler = this._config[outputFile.outputType]
        if (!handler){
            return
        }

        outputFile.minimizedFilePath = getMinimizedPath(outputFile.filePath)

        if (outputFile.outputType === 'html'){
            const {jsModule, cssModule} = outputFile.entryModule
            outputFile.content = await outputFile.entryModule.html({
                ...outputFile.entryModule,
                bundle: {
                    ...outputFile.entryModule.bundle,
                    scriptsTags: jsModule.outputSource ? `<script src="/${getMinimizedPath(jsModule.outputName)}"></script>` : '',
                    stylesTags: cssModule.outputSource ? `<link rel="stylesheet" href="/${getMinimizedPath(cssModule.outputName)}" >` : '',
                }
            })
        }

        if (!outputFile.content){
            return
        }

        const res = await handler.handle({
            code: outputFile.content,
            options: handler.options,
        })

        if (res.warnings){
            console.warn(res.warnings)
        }

        if (res.error){
            throw res.error
        }

        outputFile.minimizedContent = res.code
        console.log(`minfied ${outputFile.filePath}, reduced size from ${humanizeSize(outputFile.content.length)} to ${humanizeSize(res.code.length)}`)

        await outputFile.write({
            filePath: outputFile.minimizedFilePath,
            content: res.code,
        })
    }

    call(that, ...args){
        return that.apply(that, args)
    }

    apply(that, args){
        that.handle(...args)
    }
}


function getMinimizedPath(filepath){
    return filepath.replace(/\.(\w+)$/, ($0, $1) => `.min.${$1}`)
}