
const debug = require('debug')('nspack')
const dataUrlProcessor = require('./nspack-processor-data-url')

module.exports = {
    js: [
        require('./nspack-processor-js-module'),
    ],

    json: [
        require('./nspack-processor-json'),
    ],

    css: [
        require('./nspack-processor-css-optimizer'),
    ],

    less: [
        require('./nspack-processor-less-compiler'),
        require('./nspack-processor-css-optimizer'),
    ],

    vue: [
        require('./nspack-processor-vue-module'),
    ],

    text: [
        textProcessor,
    ],
    
    'vue.tpl': [
        require('./nspack-processor-vue-template-compiler'),
    ],

    bmp:  [ dataUrlProcessor.withMimeType('image/bmp') ],
    png:  [ dataUrlProcessor.withMimeType('image/png') ],
    jpg:  [ dataUrlProcessor.withMimeType('image/jpeg') ],
    jpeg: [ dataUrlProcessor.withMimeType('image/jpeg') ],
    gif:  [ dataUrlProcessor.withMimeType('image/gif') ],
    webp: [ dataUrlProcessor.withMimeType('image/webp') ],
    ico:  [ dataUrlProcessor.withMimeType('image/x-icon') ],
}

function textProcessor(module, packer){
    module.builtType = 'js'
    module.builtSource = `module.exports = ${JSON.stringify(module.source)}`
}
