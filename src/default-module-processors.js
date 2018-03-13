
const debug = require('debug')('nspack')
const splitVueModule = require('./split-vue-module')
const jsVarRegex = /^[a-zA-Z0-9_$]+$/

module.exports = {
    js: [
        async function (module, packer){
            debug("process module %o, source: %o", module.fullPathName, module.source)
            module.builtType = 'js'
            if (!module.source){
                module.builtSource = module.source
                return
            }
            
            let processRequires = true
            let dependenciesProcesses = []

            let resolvingModules = {}
            let resolvingModulesByPlaceholderId = {}
            let nextPlaceholderId = 1
            
            const lineRegexHandlers = getJsLinesRegexHandlers((reqModuleNameStrLiteral, strQuote) => {
                const reqModuleName = parseJsStr(reqModuleNameStrLiteral, strQuote)

                if (reqModuleName in resolvingModules){
                    return resolvingModules[reqModuleName].idPlaceholder
                }

                const idPlaceholderId = nextPlaceholderId++
                const idPlaceholder = `__${idPlaceholderId}_MODULE_ID_PLACEHOLDER__`

                const resolvingInfo = {
                    idPlaceholder,
                    resolving: packer._resolveModule(reqModuleName, module.fullFileDirName)
                                    .then(reqModule => {
                                        resolvingInfo.id = reqModule.id
                                        module.dependencies.push(reqModule)
                                        dependenciesProcesses.push(packer._processModule(reqModule))
                                    })
                }

                resolvingModules[reqModuleName] = resolvingModulesByPlaceholderId[idPlaceholderId] = resolvingInfo

                return idPlaceholder
            })

            const lines = module.source.split("\n")
            for (let i = 0, n = lines.length; i < n; i++){
                let line = lines[i]

                if (processRequires){
                    processRequires = line.indexOf('//#!DONT_PROCESS_REQUIRES') < 0
    
                    if (processRequires){
                        for (let handler of lineRegexHandlers){
                            line = line.replace(handler[0], handler[1])
                        }
                    }
                } else {
                    processRequires = line.indexOf('//#!DO_PROCESS_REQUIRES') < 0
                }

                lines[i] = line
            }

            await Promise.all(Object.values(resolvingModules).map(x => x.resolving))

            for (let i = 0, n = lines.length; i < n; i++){
                lines[i] = lines[i].replace(/__(\d+)_MODULE_ID_PLACEHOLDER__/g, ($0, $1) => resolvingModulesByPlaceholderId[+$1].id)
            }

            module.builtSource = lines.join("\n")

            await Promise.all(dependenciesProcesses)
        }
    ],

    css: [
        function (module, packer){
            module.builtType = 'css'
            module.builtSource = module.source
        }
    ],

    less: [
        function (module, packer){
            module.builtType = 'css'
            // todo...
            module.builtSource = module.source
        }
    ],

    vue: [
        async function (module, packer){
            module.builtType = 'js'
            const {template, script, style} = await splitVueModule(module, packer)

            const lines = []
            if (style){
                module.dependencies.push(style)
                lines.push(`__require_module__(${style.id})`)
            }

            if (script){
                module.dependencies.push(script)
                lines.push(`const component = __require_module__(${script.id})`)
            } else {
                lines.push(`const component = {}`)
            }

            if (template){
                // todo: compile template
                module.dependencies.push(template)
                lines.push(`component.template = __require_module__(${template.id})`)
            }

            lines.push(`module.exports = component`)

            module.builtSource = lines.join("\n")
        }
    ],

    text: [
        textProcessor,
    ],
    'vue.tpl': [
        textProcessor,
    ]
}

function textProcessor(module, packer){
    module.builtType = 'js'
    module.builtSource = `module.exports = ${JSON.stringify(module.source)}`
}

function getJsLinesRegexHandlers(resolveModuleId){
    return [
        [
            /\/\/.*$/,
            () => '',
        ],
        [
            // const foo = require('bar');
            // [0] => " require('bar')"
            // [1] => " "
            // [2] => "'"
            // [3] => "bar"
            /([^0-9a-zA-Z_.$]|^)require\s*\(\s*(['"`])(\S+)['"`]\s*\)/,
            ($0, $1, $2, $3) => ` __require_module__(${resolveModuleId($3, $2)}/*${$3}*/)`, // todo: 字符串转义？
        ],
        [
            // import * as foo from 'bar';
            // [0] => `import * as foo from 'bar'`
            // [1] => `foo`
            // [2] => `'`
            // [3] => `bar`
            /import\s+\*\s+as\s+(\S+)\s+from\s+(['"`])(\S+)['"`]/,
            ($0, $1, $2, $3) => `const ${$1} = __require_module__(${resolveModuleId($3, $2)})/*${$0}*/`,
        ],
        [
            // import foo from 'bar';
            // [0] => `import foo from 'bar'`
            // [1] => `foo`
            // [2] => `'`
            // [3] => `bar`
            // 
            // import {foo, goo} from 'bar';
            // [0] => `import {foo, goo} from 'bar'`
            // [1] => `{foo, goo}`
            // [2] => `'`
            // [3] => `bar`
            /import\s+(.+?)\s+from\s+(['"`])(\S+)['"`]/,
            ($0, $1, $2, $3) => (
                jsVarRegex.test($1) 
                ? `const ${$1} = __extract_default__(__require_module__(${resolveModuleId($3, $2)}))/*${$0}*/`
                : `const ${$1} = __require_module__(${resolveModuleId($3, $2)})/*${$0}*/`
            ),
        ],
        [
            // export default xxx
            // -> module.exports = xxx
            /export\s+default\s+/,
            () => `module.exports = `, // todo: __esModule = true...
        ],
        // todo: export xxx
    ]
}

function parseJsStr(strLiteral, strQuote){
    // todo...
    return strLiteral
}


