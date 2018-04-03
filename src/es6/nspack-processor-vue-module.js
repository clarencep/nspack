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
const split_vue_module_1 = require("./split-vue-module");
function default_1(module, packer) {
    return __awaiter(this, void 0, void 0, function* () {
        module.builtType = 'js';
        const { template, script, style } = yield split_vue_module_1.default(module, packer);
        const lines = [];
        if (style) {
            module.dependencies.push(style);
            lines.push(`__require_module__(${style.id})`);
        }
        if (script) {
            module.dependencies.push(script);
            lines.push(`const component = __extract_default__(__require_module__(${script.id}))`);
        }
        else {
            lines.push(`const component = {}`);
        }
        if (template) {
            module.dependencies.push(template);
            lines.push(`module.exports = {...component, ...__require_module__(${template.id})}`);
        }
        else {
            lines.push(`module.exports = component`);
        }
        module.builtSource = lines.join("\n");
    });
}
exports.default = default_1;
