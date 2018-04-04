"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// <style lang="less">
// [0] => `lang="less"`
// [1] => `less`
const styleLangRe = /lang=['"]?([a-zA-Z0-9]+)['"]?/;
function splitVueModule(vueModule, packer) {
    return __awaiter(this, void 0, void 0, function* () {
        const vueSource = vueModule.source + '';
        const templateText = searchTextAroundTag('template', vueSource);
        const scriptText = searchTextAroundTag('script', vueSource);
        const styleText = searchTextAroundTag('style', vueSource);
        let template, script, style; // modules
        const jobs = [];
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
                .then(m => {
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
                .then(m => {
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
                .then(m => {
                style = m;
            }));
        }
        yield Promise.all(jobs);
        return { template, script, style };
    });
}
exports.default = splitVueModule;
// vueContent = "<template>This is a template</template>\n<script>export default {}</script>\n<style lang='less'>.ff{}</style>"
// searchTextAroundTag("template", vueContent)
// searchTextAroundTag("script", vueContent)
// searchTextAroundTag("style", vueContent)
function searchTextAroundTag(tagName, source) {
    const tagBegin = '<' + tagName;
    const tagBeginRe = new RegExp(tagBegin + '(>|\\s)', 'g');
    const tagEnd = '</' + tagName + '>';
    const tagSearchRe = new RegExp(`(?:${tagBegin}(?:>|\\s))|(?:${tagEnd})`, 'g');
    let n = 0;
    let m = tagBeginRe.exec(source);
    if (!m) {
        return false;
    }
    let firstTagBeginPos = m.index;
    let contentBeginPos = firstTagBeginPos + m[0].length;
    if (m[0][m[0].length - 1] !== '>') {
        const x = source.indexOf('>', firstTagBeginPos);
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
            const begin = contentBeginPos;
            const end = m.index;
            const res = {
                begin, end,
                text: source.substring(begin, end)
            };
            if (tagName === 'style') {
                const t = source.substring(firstTagBeginPos, contentBeginPos).match(styleLangRe);
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
    return sourceCode.replace(/(^|[^0-9a-zA-Z_.$])export\s+default\s+/mg, ($0, $1) => $1 + 'module.exports = ');
}
