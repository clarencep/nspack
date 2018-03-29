var regeneratorRuntime = require("regenerator-runtime");
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var extend = Object.assign;
var debug = require('debug')('nspack');

var _require = require('./utils'),
    tryFStat = _require.tryFStat,
    readFile = _require.readFile;

module.exports = function () {
    function NSPackModule(attributes, packer) {
        _classCallCheck(this, NSPackModule);

        this._packer = function () {
            return packer;
        };
        attributes && extend(this, attributes);

        if (this.relativePath === undefined) {
            this.relativePath = path.relative(this.packer._config.entryBase, this.fullPathName);
        }

        if (this.type === undefined) {
            this.type = path.extname(this.fullPathName).replace(/^./, '').toLowerCase();
        }

        if (this.fullFileDirName === undefined) {
            this.fullFileDirName = path.dirname(this.fullPathName);
        }

        this.dependencies = [];
    }

    _createClass(NSPackModule, [{
        key: 'loadSource',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                var readFileAt;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!((this.needUpdate || this.source === undefined) && !this.isExternal && !this.isInternal)) {
                                    _context.next = 8;
                                    break;
                                }

                                this.packer.debugLevel > 1 && debug("read module source from file: %o, module: %o", this.fullPathName, this);

                                readFileAt = Date.now();
                                _context.next = 5;
                                return readFile(this.fullPathName, "utf8");

                            case 5:
                                this.source = _context.sent;

                                this.sourceUpdatedAt = readFileAt;
                                return _context.abrupt('return');

                            case 8:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function loadSource() {
                return _ref.apply(this, arguments);
            }

            return loadSource;
        }()
    }, {
        key: '_checkIfNeedUpdate0',
        value: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                var stat;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!(!this.isInternal && !this.isExternal)) {
                                    _context2.next = 7;
                                    break;
                                }

                                _context2.next = 3;
                                return tryFStat(this.fullPathName);

                            case 3:
                                stat = _context2.sent;

                                if (!(!stat || !stat.isFile() || +stat.mtimeMs > this.sourceUpdatedAt)) {
                                    _context2.next = 7;
                                    break;
                                }

                                this.packer.debugLevel > 3 && debug("source updated: %o, at %o", this.fullPathName, stat);
                                return _context2.abrupt('return', this.needUpdate = true);

                            case 7:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function _checkIfNeedUpdate0() {
                return _ref2.apply(this, arguments);
            }

            return _checkIfNeedUpdate0;
        }()
    }, {
        key: '_checkIfNeedUpdate1',
        value: function _checkIfNeedUpdate1() {
            if (this.needUpdate) {
                return true;
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.dependencies[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var dependModule = _step.value;

                    if (dependModule._checkIfNeedUpdate1()) {
                        return this.needUpdate = true;
                    }
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
        }
    }, {
        key: 'packer',
        get: function get() {
            return this._packer();
        }
    }]);

    return NSPackModule;
}();