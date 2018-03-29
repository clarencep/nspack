var regeneratorRuntime = require("regenerator-runtime");
var tryFStat = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(file) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        return _context.abrupt('return', new Promise(function (resolve) {
                            fs.stat(file, function (err, stats) {
                                if (err) {
                                    resolve(false);
                                } else {
                                    resolve(stats);
                                }
                            });
                        }));

                    case 1:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function tryFStat(_x) {
        return _ref.apply(this, arguments);
    };
}();

var tryReadFileContent = function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(file) {
        var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        return _context2.abrupt('return', new Promise(function (resolve) {
                            fs.readFile(file, encoding, function (err, content) {
                                if (err) {
                                    resolve(false);
                                } else {
                                    resolve(content);
                                }
                            });
                        }));

                    case 1:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function tryReadFileContent(_x2) {
        return _ref2.apply(this, arguments);
    };
}();

var tryReadJsonFileContent = function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(file) {
        var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'utf8';
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        return _context3.abrupt('return', new Promise(function (resolve) {
                            fs.readFile(file, encoding, function (err, content) {
                                if (err) {
                                    resolve(false);
                                } else {
                                    try {
                                        resolve(JSON.parse(content));
                                    } catch (e) {
                                        resolve(false);
                                    }
                                }
                            });
                        }));

                    case 1:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function tryReadJsonFileContent(_x4) {
        return _ref3.apply(this, arguments);
    };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = require('fs');
var debug = require('debug')('nspack');
var cb2p = require('./cb2p');

module.exports = {
    tryFStat: tryFStat,
    tryReadFileContent: tryReadFileContent,
    tryReadJsonFileContent: tryReadJsonFileContent,
    humanizeSize: humanizeSize,
    sleep: sleep,
    readFile: cb2p(fs.readFile)
};

function humanizeSize(sizeInBytes) {
    return (+sizeInBytes / 1000).toFixed(1).replace(/\.0+$/, '') + 'kb';
}

function sleep(timeout) {
    return new Promise(function (resolve) {
        return setTimeout(resolve, timeout);
    });
}