
const debug = require('debug')('nspack')

module.exports = {
    js: [
        require('./nspack-processor-js-module'),
    ],

    css: [
        require('./nspack-processor-css-optimizer'),
    ],

    less: [
        require('./nspack-processor-less-compiler')
    ],

    vue: [
        require('./nspack-processor-vue-module'),
    ],

    text: [
        textProcessor,
    ],
    'vue.tpl': [
        require('./nspack-processor-vue-template-compiler'),
    ]
}

function textProcessor(module, packer){
    module.builtType = 'js'
    module.builtSource = `module.exports = ${JSON.stringify(module.source)}`
}
