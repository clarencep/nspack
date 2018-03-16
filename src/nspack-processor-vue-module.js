
const splitVueModule = require('./split-vue-module')

module.exports = async function (module, packer){
    module.builtType = 'js'
    const {template, script, style} = await splitVueModule(module, packer)

    const lines = []
    if (style){
        module.dependencies.push(style)
        lines.push(`__require_module__(${style.id})`)
    }

    if (script){
        module.dependencies.push(script)
        lines.push(`const component = __extract_default__(__require_module__(${script.id}))`)
    } else {
        lines.push(`const component = {}`)
    }

    if (template){
        module.dependencies.push(template)
        lines.push(`module.exports = {...component, ...__require_module__(${template.id})}`)
    } else {
        lines.push(`module.exports = component`)
    }

    module.builtSource = lines.join("\n")
}