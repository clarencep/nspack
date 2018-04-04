"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function cb2p(f) {
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = this;
        return new Promise(function (resolve, reject) {
            f.call.apply(f, [_this].concat(args, [function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                }]));
        });
    };
}
exports.default = cb2p;
