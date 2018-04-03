const NsPacker = extractDefault(require('./nspacker'));
const extend = Object.assign;
module.exports = NsPacker;
extend(module.exports, {
    hooks: {
        OutputUglifier: extractDefault(require('./nspack-hook-output-uglifier')),
    },
});
function extractDefault(module) {
    return module ? (module.__esModule ? module.default : module) : undefined;
}
