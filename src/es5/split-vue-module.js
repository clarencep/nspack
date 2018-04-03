"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// <style lang="less">
// [0] => `lang="less"`
// [1] => `less`
var styleLangRe = /lang=['"]?([a-zA-Z0-9]+)['"]?/;
function splitVueModule(vueModule, packer) {
    return __awaiter(this, void 0, void 0, function () {
        var vueSource, templateText, scriptText, styleText, template, script, style, jobs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    vueSource = vueModule.source + '';
                    templateText = searchTextAroundTag('template', vueSource);
                    scriptText = searchTextAroundTag('script', vueSource);
                    styleText = searchTextAroundTag('style', vueSource);
                    jobs = [];
                    if (templateText) {
                        jobs.push(packer.addOrUpdateModule({
                            name: vueModule.name + '.template',
                            isInternal: true,
                            file: 'internal://' + vueModule.fullPathName + '.template',
                            fullFileDirName: vueModule.fullFileDirName,
                            relativePath: 'internal://' + vueModule.relativePath + '.template',
                            baseDir: vueModule.baseDir,
                            type: 'vue.tpl',
                            source: templateText.text,
                            needUpdate: true,
                        })
                            .then(function (m) {
                            template = m;
                        }));
                    }
                    if (scriptText) {
                        jobs.push(packer.addOrUpdateModule({
                            name: vueModule.name + '.script',
                            isInternal: true,
                            file: 'internal://' + vueModule.fullPathName + '.script',
                            fullFileDirName: vueModule.fullFileDirName,
                            relativePath: 'internal://' + vueModule.relativePath + '.script',
                            baseDir: vueModule.baseDir,
                            type: 'js',
                            source: fixVueScriptExportDefault(scriptText.text),
                            needUpdate: true,
                        })
                            .then(function (m) {
                            script = m;
                        }));
                    }
                    if (styleText) {
                        jobs.push(packer.addOrUpdateModule({
                            name: vueModule.name + '.style',
                            isInternal: true,
                            file: 'internal://' + vueModule.fullPathName + '.style',
                            fullFileDirName: vueModule.fullFileDirName,
                            relativePath: 'internal://' + vueModule.relativePath + '.style',
                            baseDir: vueModule.baseDir,
                            type: styleText.lang || 'css',
                            source: styleText.text,
                            needUpdate: true,
                        })
                            .then(function (m) {
                            style = m;
                        }));
                    }
                    return [4 /*yield*/, Promise.all(jobs)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { template: template, script: script, style: style }];
            }
        });
    });
}
exports.default = splitVueModule;
// vueContent = "<template>This is a template</template>\n<script>export default {}</script>\n<style lang='less'>.ff{}</style>"
// searchTextAroundTag("template", vueContent)
// searchTextAroundTag("script", vueContent)
// searchTextAroundTag("style", vueContent)
function searchTextAroundTag(tagName, source) {
    var tagBegin = '<' + tagName;
    var tagBeginRe = new RegExp(tagBegin + '(>|\\s)', 'g');
    var tagEnd = '</' + tagName + '>';
    var tagSearchRe = new RegExp("(?:" + tagBegin + "(?:>|\\s))|(?:" + tagEnd + ")", 'g');
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
        tagSearchRe.lastIndex = m.index + m[0].length;
        m = tagSearchRe.exec(source);
        if (!m) {
            return false;
        }
        if (m[0] !== tagEnd) {
            n++;
            continue;
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
                var t = source.substring(firstTagBeginPos, contentBeginPos).match(styleLangRe);
                if (t) {
                    res.lang = t[1];
                }
            }
            return res;
        }
    } while (n > 0);
    return false;
}
function fixVueScriptExportDefault(sourceCode) {
    return sourceCode.replace(/(^|[^0-9a-zA-Z_.$])export\s+default\s+/mg, function ($0, $1) { return $1 + 'module.exports = '; });
}
