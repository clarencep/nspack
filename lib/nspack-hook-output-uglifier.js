var regeneratorRuntime = require("regenerator-runtime");
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var extend = Object.assign;

var _require = require('./utils'),
    humanizeSize = _require.humanizeSize;

module.exports = {
    defaultInstance: getDefaultUglifier,
    defaultConfig: getDefaultConfig,
    withConfig: function withConfig(config) {
        return new OutputUglifier(config);
    },
    apply: function apply(that, args) {
        var _that$defaultInstance;

        return (_that$defaultInstance = that.defaultInstance()).handle.apply(_that$defaultInstance, _toConsumableArray(args));
    },
    call: function call(that) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        return that.apply(that, args);
    }
};

var defaultUglifier = void 0;

function getDefaultUglifier() {
    if (!defaultUglifier) {
        defaultUglifier = new OutputUglifier();
    }

    return defaultUglifier;
}

function getDefaultConfig() {
    var UglifyJs = require('uglify-js');
    var postcss = require('postcss');
    var autoprefixer = require('autoprefixer');
    var cssnano = require('cssnano');
    var HtmlMinifier = require('html-minifier');

    return {
        js: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: function handle(_ref) {
                var code = _ref.code,
                    options = _ref.options;
                return UglifyJs.minify(code, options);
            },
            options: {}
        },
        css: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: function handle(_ref2) {
                var code = _ref2.code,
                    options = _ref2.options;

                return postcss([autoprefixer, new cssnano({
                    preset: 'default',
                    zindex: false, // if z-index changes, something may goes wrong
                    reduceIdents: false // if reduceIdents is true, keyframes' names will be minfied. I don't like that.
                })]).process(code, { from: undefined, to: undefined }).then(function (res) {
                    return {
                        code: res.css
                    };
                });
            },
            options: {}
        },
        html: {
            /**
             * @return {{code,error,warnings}|Promise<{code,error,warnings}>}
             */
            handle: function handle(_ref3) {
                var code = _ref3.code,
                    options = _ref3.options;

                return {
                    code: HtmlMinifier.minify(code, options)
                };
            },
            options: {
                collapseWhitespace: true,
                removeAttributeQuotes: true
            }
        }
    };
}

var OutputUglifier = function () {
    function OutputUglifier(config) {
        _classCallCheck(this, OutputUglifier);

        this._config = extend(getDefaultConfig(), config || {});
    }

    /**
     * 
     * @param {{
     *          packer,
                entryModule,
                outputName, outputType,
                filePath, fileDir,
                content,
                write,
            }} outputFile 
    */


    _createClass(OutputUglifier, [{
        key: 'handle',
        value: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(outputFile) {
                var handler, _outputFile$entryModu, jsModule, cssModule, res;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                handler = this._config[outputFile.outputType];

                                if (handler) {
                                    _context.next = 3;
                                    break;
                                }

                                return _context.abrupt('return');

                            case 3:

                                outputFile.minimizedFilePath = getMinimizedPath(outputFile.filePath);

                                if (!(outputFile.outputType === 'html')) {
                                    _context.next = 9;
                                    break;
                                }

                                _outputFile$entryModu = outputFile.entryModule, jsModule = _outputFile$entryModu.jsModule, cssModule = _outputFile$entryModu.cssModule;
                                _context.next = 8;
                                return outputFile.entryModule.html(_extends({}, outputFile.entryModule, {
                                    bundle: _extends({}, outputFile.entryModule.bundle, {
                                        scriptsTags: jsModule.outputSource ? '<script src="/' + getMinimizedPath(jsModule.outputName) + '"></script>' : '',
                                        stylesTags: cssModule.outputSource ? '<link rel="stylesheet" href="/' + getMinimizedPath(cssModule.outputName) + '" >' : ''
                                    })
                                }));

                            case 8:
                                outputFile.content = _context.sent;

                            case 9:
                                if (outputFile.content) {
                                    _context.next = 11;
                                    break;
                                }

                                return _context.abrupt('return');

                            case 11:
                                _context.next = 13;
                                return handler.handle({
                                    code: outputFile.content,
                                    options: handler.options
                                });

                            case 13:
                                res = _context.sent;


                                if (res.warnings) {
                                    console.warn(res.warnings);
                                }

                                if (!res.error) {
                                    _context.next = 17;
                                    break;
                                }

                                throw res.error;

                            case 17:

                                outputFile.minimizedContent = res.code;
                                console.log('minfied ' + outputFile.filePath + ', reduced size from ' + humanizeSize(outputFile.content.length) + ' to ' + humanizeSize(res.code.length));

                                _context.next = 21;
                                return outputFile.write({
                                    filePath: outputFile.minimizedFilePath,
                                    content: res.code
                                });

                            case 21:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function handle(_x) {
                return _ref4.apply(this, arguments);
            }

            return handle;
        }()
    }, {
        key: 'call',
        value: function call(that) {
            for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                args[_key2 - 1] = arguments[_key2];
            }

            return that.apply(that, args);
        }
    }, {
        key: 'apply',
        value: function apply(that, args) {
            that.handle.apply(that, _toConsumableArray(args));
        }
    }]);

    return OutputUglifier;
}();

function getMinimizedPath(filepath) {
    return filepath.replace(/\.(\w+)$/, function ($0, $1) {
        return '.min.' + $1;
    });
}