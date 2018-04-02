var regeneratorRuntime = require("regenerator-runtime");
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// <style lang="less">
// [0] => `lang="less"`
// [1] => `less`
var styleLangRe = /lang=['"]?([a-zA-Z0-9]+)['"]?/;

module.exports = function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(vueModule, packer) {
        var vueSource, templateText, scriptText, styleText, template, script, style, jobs;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        vueSource = vueModule.source;
                        templateText = searchTextAroundTag('template', vueSource);
                        scriptText = searchTextAroundTag('script', vueSource);
                        styleText = searchTextAroundTag('style', vueSource);
                        template = void 0, script = void 0, style = void 0; // modules

                        jobs = [];


                        if (templateText) {
                            jobs.push(packer.addModule({
                                name: vueModule.name + '.template',
                                isInternal: true,
                                file: 'internal://' + vueModule.fullPathName + '.template',
                                fullFileDirName: vueModule.fullFileDirName,
                                relativePath: 'internal://' + vueModule.relativePath + '.template',
                                baseDir: vueModule.baseDir,
                                type: 'vue.tpl',
                                source: templateText.text
                            }).then(function (m) {
                                template = m;
                            }));
                        }

                        if (scriptText) {
                            jobs.push(packer.addModule({
                                name: vueModule.name + '.script',
                                isInternal: true,
                                file: 'internal://' + vueModule.fullPathName + '.script',
                                fullFileDirName: vueModule.fullFileDirName,
                                relativePath: 'internal://' + vueModule.relativePath + '.script',
                                baseDir: vueModule.baseDir,
                                type: 'js',
                                source: fixVueScriptExportDefault(scriptText.text)
                            }).then(function (m) {
                                script = m;
                            }));
                        }

                        if (styleText) {
                            jobs.push(packer.addModule({
                                name: vueModule.name + '.style',
                                isInternal: true,
                                file: 'internal://' + vueModule.fullPathName + '.style',
                                fullFileDirName: vueModule.fullFileDirName,
                                relativePath: 'internal://' + vueModule.relativePath + '.style',
                                baseDir: vueModule.baseDir,
                                type: styleText.lang || 'css',
                                source: styleText.text
                            }).then(function (m) {
                                style = m;
                            }));
                        }

                        _context.next = 11;
                        return Promise.all(jobs);

                    case 11:
                        return _context.abrupt('return', { template: template, script: script, style: style });

                    case 12:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    function splitVueModule(_x, _x2) {
        return _ref.apply(this, arguments);
    }

    return splitVueModule;
}();

// vueContent = "<template>This is a template</template>\n<script>export default {}</script>\n<style lang='less'>.ff{}</style>"
// searchTextAroundTag("template", vueContent)
// searchTextAroundTag("script", vueContent)
// searchTextAroundTag("style", vueContent)
function searchTextAroundTag(tagName, source) {
    var tagBegin = '<' + tagName;
    var tagBeginRe = new RegExp(tagBegin + '(>|\\s)', 'g');
    var tagEnd = '</' + tagName + '>';
    var tagEndRe = new RegExp(tagEnd, 'g');

    var n = 0;
    var m = tagBeginRe.exec(source);
    if (!m) {
        return false;
    }

    var firstTagBeginPos = m.index;
    var contentBeginPos = firstTagBeginPos + m[0].length;
    if (m[0][m[0].length - 1] !== '>') {
        var x = source.indexOf('>', firstTagBeginPos);
        if (x < 0) {
            return false;
        }

        contentBeginPos = x + 1;
    }

    n++;

    do {
        tagEndRe.lastIndex = m.index + m[0].length;
        m = tagEndRe.exec(source);
        if (!m) {
            return false;
        }

        n--;
        if (n === 0) {
            var begin = contentBeginPos;
            var end = m.index;
            var res = {
                begin: begin, end: end,
                text: source.substring(begin, end)
            };

            if (tagName === 'style') {
                m = source.substring(firstTagBeginPos, contentBeginPos).match(styleLangRe);
                if (m) {
                    res.lang = m[1];
                }
            }

            return res;
        }

        tagBeginRe.lastIndex = m.index + m[0].length;
        m = tagBeginRe.exec(source);
        if (!m) {
            return false;
        }
    } while (n > 0);

    return false;
}

function fixVueScriptExportDefault(sourceCode) {
    return sourceCode.replace(/(^|[^0-9a-zA-Z_.$])export\s+default\s+/mg, function ($0, $1) {
        return $1 + 'module.exports = ';
    });
}