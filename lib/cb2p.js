var regeneratorRuntime = require("regenerator-runtime");
module.exports = function cb2p(f) {
    return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = this;
        return new Promise(function (resolve, reject) {
            f.call.apply(f, [_this].concat(args, [function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            }]));
        });
    };
};