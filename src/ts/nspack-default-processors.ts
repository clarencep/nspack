import jsModuleProcessor  from './nspack-processor-js-module'
import jsonProcessor from './nspack-processor-json'
import cssOptimizerProcessor from './nspack-processor-css-optimizer'
import lessCompilerProcessor from './nspack-processor-less-compiler'
import * as dataUrlProcessor from './nspack-processor-data-url'
import vueModuleProcessor from './nspack-processor-vue-module'
import vueTemplateCompiler from './nspack-processor-vue-template-compiler'

import {Module, Packer, ModuleProcessor} from './nspack-interface'

export type DefaultProcessorMap = {
    [type: string]: ModuleProcessor[]
}

const map: DefaultProcessorMap = {
    js: [
        jsModuleProcessor,
    ],

    json: [
        jsonProcessor,
    ],

    css: [
        cssOptimizerProcessor,
    ],

    less: [
        lessCompilerProcessor,
        cssOptimizerProcessor,
    ],

    vue: [
        vueModuleProcessor,
    ],

    text: [
        textProcessor,
    ],
    
    'vue.tpl': [
        vueTemplateCompiler,
    ],

    bmp:  [ dataUrlProcessor.withMimeType('image/bmp') ],
    png:  [ dataUrlProcessor.withMimeType('image/png') ],
    jpg:  [ dataUrlProcessor.withMimeType('image/jpeg') ],
    jpeg: [ dataUrlProcessor.withMimeType('image/jpeg') ],
    gif:  [ dataUrlProcessor.withMimeType('image/gif') ],
    webp: [ dataUrlProcessor.withMimeType('image/webp') ],
    ico:  [ dataUrlProcessor.withMimeType('image/x-icon') ],
}

export default map

function textProcessor(module: Module, packer: Packer){
    module.builtType = 'js'
    module.builtSource = `module.exports = ${JSON.stringify(module.source)}`
}
