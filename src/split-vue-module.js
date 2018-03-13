
// <style lang="less">
// [0] => `lang="less"`
// [1] => `less`
const styleLangRe = /lang=['"]?([a-zA-Z0-9]+)['"]?/

module.exports = async function splitVueModule(vueModule, packer){

    const templateTagBegin = /<template(>|\s)/g
    const templateTagEnd = /<\/template>/g
    const scriptTagBegin  = /<script(>|\s)/g
    const scriptTagEnd = /<\/script>/g
    const styleTagBegin = /<style(>|\s)/g
    const styleTagEnd = /<\/style>/g


    const vueSource = vueModule.source
    const templateText = searchTextAroundTag('template', vueSource)
    const scriptText = searchTextAroundTag('script', vueSource)
    const styleText = searchTextAroundTag('style', vueSource)

    let template, script, style // modules

    const jobs = []
    
    if (templateText){
        jobs.push(async () => {
            template = await packer._addModuleIfNotExists({
                name: vueModule.name + '.template',
                isInternal: true,
                file: 'internal://' + vueModule.fullPathName + '.template',
                type: 'vue.template',
                source: templateText.text,
            })

            await packer._processModule(template)
        })
    }

    if (scriptText){
        jobs.push(async () => {
            script = await packer._addModuleIfNotExists({
                name: vueModule.name + '.script',
                isInternal: true,
                file: 'internal://' + vueModule.fullPathName + '.script',
                type: 'js',
                source: scriptText.text,
            })
    
            await packer._processModule(script)
        })
    }


    if (styleText){
        jobs.push(async () => {
            style = await packer._addModuleIfNotExists({
                name: vueModule.name + '.style',
                isInternal: true,
                file: 'internal://' + vueModule.fullPathName + '.style',
                type: styleText.lang || 'css',
                source: styleText.text,
            })
    
            await packer._processModule(script)
        })
    }

    await Promise.all(jobs)

    return {template, script, style}
}

// vueContent = "<template>This is a template</template>\n<script>export default {}</script>\n<style lang='less'>.ff{}</style>"
// searchTextAroundTag("template", vueContent)
// searchTextAroundTag("script", vueContent)
// searchTextAroundTag("style", vueContent)
function searchTextAroundTag(tagName, source){
    const tagBegin = '<' + tagName
    const tagBeginRe = new RegExp(tagBegin + '(>|\\s)', 'g')
    const tagEnd = '</' + tagName + '>'
    const tagEndRe = new RegExp(tagEnd, 'g')

    let n = 0
    let m = tagBeginRe.exec(source)
    if (!m){
        return false
    }


    let firstTagBeginPos =  m.index
    let contentBeginPos = firstTagBeginPos + m[0].length
    if (m[0][m[0].length - 1] !== '>'){
        const x = source.indexOf('>', firstTagBeginPos)
        if (x < 0){
            return false
        }

        contentBeginPos = x + 1
    }

    n++

    do {
        tagEndRe.lastIndex = m.index + m[0].length
        m = tagEndRe.exec(source)
        if (!m) {
            return false
        }

        n--
        if (n === 0){
            const begin = contentBeginPos
            const end = m.index
            const res = {
                begin, end,
                text: source.substring(begin, end)
            }

                
            if (tagName === 'style'){
                m = source.substring(firstTagBeginPos, contentBeginPos).match(styleLangRe)
                if (m){
                    res.lang = m[1]
                }
            }
        
            return res
        }

        tagBeginRe.lastIndex = m.index + m[0].length
        m = tagBeginRe.exec(source)
        if (!m){
            return false
        }
    } while (n > 0)

    return false
}