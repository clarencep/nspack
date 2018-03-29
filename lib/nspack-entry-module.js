var regeneratorRuntime = require("regenerator-runtime");
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var extend = Object.assign;
module.exports = function () {
    function NSPackEntryModule(attributes, packer) {
        _classCallCheck(this, NSPackEntryModule);

        this._packer = function () {
            return packer;
        };
        attributes && extend(this, attributes);
    }

    _createClass(NSPackEntryModule, [{
        key: "_checkIfNeedUpdate0",
        value: function _checkIfNeedUpdate0() {
            // entry module need not this method

        }
    }, {
        key: "_checkIfNeedUpdate1",
        value: function _checkIfNeedUpdate1() {
            if (this.needUpdate) {
                return;
            }

            var jsNeedUpdates = this.jsModule._checkIfNeedUpdate1();
            var cssNeedUpdates = this.cssModule._checkIfNeedUpdate1();
            return this.needUpdate = jsNeedUpdates || cssNeedUpdates;
        }
    }, {
        key: "packer",
        get: function get() {
            return this._packer();
        }
    }]);

    return NSPackEntryModule;
}();