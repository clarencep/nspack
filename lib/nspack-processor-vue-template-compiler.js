var regeneratorRuntime = require("regenerator-runtime");
var vueTplCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler');

module.exports = function (module, packer) {
    var res = vueTplCompiler.compile(module.source);
    if (res.errors.length > 0) {
        throw new Error('Failed to compile vue template ' + module.fullPathName + ': ' + res.errors.join("\n"));
    }

    var lines = ['exports.render = ', toFunction(res.render), 'exports.staticRenderFns = ['];

    res.staticRenderFns.forEach(function (fn) {
        lines.push(toFunction(fn));
    });

    lines.push(']');

    module.builtSource = lines.join("\n");
    module.builtType = 'js';
};

function toFunction(funcBody) {
    return transpile('function render(){' + funcBody + '}');
}