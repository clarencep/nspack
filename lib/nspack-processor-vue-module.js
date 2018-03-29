var regeneratorRuntime = require("regenerator-runtime");
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var splitVueModule = require('./split-vue-module');

module.exports = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(module, packer) {
        var _ref2, template, script, style, lines;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        module.builtType = 'js';
                        _context.next = 3;
                        return splitVueModule(module, packer);

                    case 3:
                        _ref2 = _context.sent;
                        template = _ref2.template;
                        script = _ref2.script;
                        style = _ref2.style;
                        lines = [];

                        if (style) {
                            module.dependencies.push(style);
                            lines.push('__require_module__(' + style.id + ')');
                        }

                        if (script) {
                            module.dependencies.push(script);
                            lines.push('const component = __extract_default__(__require_module__(' + script.id + '))');
                        } else {
                            lines.push('const component = {}');
                        }

                        if (template) {
                            module.dependencies.push(template);
                            lines.push('module.exports = {...component, ...__require_module__(' + template.id + ')}');
                        } else {
                            lines.push('module.exports = component');
                        }

                        module.builtSource = lines.join("\n");

                    case 12:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function (_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();