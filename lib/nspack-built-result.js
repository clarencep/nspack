var regeneratorRuntime = require("regenerator-runtime");
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./utils'),
    humanizeSize = _require.humanizeSize;

module.exports = function () {
    function NSPackBuiltResult(packer) {
        _classCallCheck(this, NSPackBuiltResult);

        this._packer = function () {
            return packer;
        };
        this._buildTimes = packer.buildTimes;
        this.modules = {};
    }

    _createClass(NSPackBuiltResult, [{
        key: "buildTimes",
        value: function buildTimes() {
            return this._buildTimes;
        }
    }, {
        key: "spentTimeSeconds",
        value: function spentTimeSeconds() {
            return (this.packer.buildSpentTimeMs / 1000).toFixed(3);
        }
    }, {
        key: "summary",
        value: function summary() {
            var r = [];
            r.push("Done build. Spent " + this.spentTimeSeconds() + "(s)");

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = Object.values(this.modules)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _module = _step.value;

                    r.push("    " + _module.name + ":");

                    _module.bundle.script.valid && r.push("        " + _module.bundle.script.outputName + ": \t" + humanizeSize(_module.bundle.script.outputSize) + "\t" + _module.bundle.script.hash.substring(0, 4));

                    _module.bundle.style.valid && r.push("        " + _module.bundle.style.outputName + ": \t" + humanizeSize(_module.bundle.style.outputSize) + "\t" + _module.bundle.style.hash.substring(0, 4));

                    _module.bundle.html.valid && r.push("        " + _module.bundle.html.outputName + ": \t" + humanizeSize(_module.bundle.html.outputSize) + "\t" + _module.bundle.html.hash.substring(0, 4));
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            r.push("");

            return r.join("\n");
        }
    }, {
        key: "packer",
        get: function get() {
            return this._packer();
        }
    }]);

    return NSPackBuiltResult;
}();