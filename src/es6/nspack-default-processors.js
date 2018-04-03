"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nspack_processor_js_module_1 = require("./nspack-processor-js-module");
const nspack_processor_json_1 = require("./nspack-processor-json");
const nspack_processor_css_optimizer_1 = require("./nspack-processor-css-optimizer");
const nspack_processor_less_compiler_1 = require("./nspack-processor-less-compiler");
const dataUrlProcessor = require("./nspack-processor-data-url");
const nspack_processor_vue_module_1 = require("./nspack-processor-vue-module");
const nspack_processor_vue_template_compiler_1 = require("./nspack-processor-vue-template-compiler");
const map = {
    js: [
        nspack_processor_js_module_1.default,
    ],
    json: [
        nspack_processor_json_1.default,
    ],
    css: [
        nspack_processor_css_optimizer_1.default,
    ],
    less: [
        nspack_processor_less_compiler_1.default,
        nspack_processor_css_optimizer_1.default,
    ],
    vue: [
        nspack_processor_vue_module_1.default,
    ],
    text: [
        textProcessor,
    ],
    'vue.tpl': [
        nspack_processor_vue_template_compiler_1.default,
    ],
    bmp: [dataUrlProcessor.withMimeType('image/bmp')],
    png: [dataUrlProcessor.withMimeType('image/png')],
    jpg: [dataUrlProcessor.withMimeType('image/jpeg')],
    jpeg: [dataUrlProcessor.withMimeType('image/jpeg')],
    gif: [dataUrlProcessor.withMimeType('image/gif')],
    webp: [dataUrlProcessor.withMimeType('image/webp')],
    ico: [dataUrlProcessor.withMimeType('image/x-icon')],
};
exports.default = map;
function textProcessor(module, packer) {
    module.builtType = 'js';
    module.builtSource = `module.exports = ${JSON.stringify(module.source)}`;
}
