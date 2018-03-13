const splitVueModule = require('./split-vue-module')
const jsVarRegex = /^[a-zA-Z0-9_$]+$/

module.exports = {
    // todo...
    js: [
        function (module, packer){
            module.builtType = 'js'
            
            let processRequires = true
            
            const lineRegexHandlers = getJsLinesRegexHandlers((reqModuleNameStrLiteral, strQuote) => {
                const reqModuleName = parseJsStr(reqModuleNameStrLiteral, strQuote)
                const reqModule = packer._resolveModule(moduleName, module.fullFileDirName)
                module.dependencies.push(reqModule)
            })

            const lines = module.source.split("\n")
            for (let i = 0, n = lines.length; i < n; i++){
                let line = lines[i]

                if (processRequires){
                    processRequires = line.indexOf('//#!DONT_PROCESS_REQUIRES') < 0
    
                    if (processRequires){
                        for (let handler of lineRegexHandlers){
                            line = handler[0].replace(line, handler[1])
                        }
                    }
                } else {
                    processRequires = line.indexOf('//#!DO_PROCESS_REQUIRES') < 0
                }

                lines[i] = line
            }

            module.builtSource = lines.join("\n")
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
                lines.push(`require(${style.id})`)
            }

            if (script){
                module.dependencies.push(script)
                lines.push(`const component = require(${script.id})`)
            } else {
                lines.push(`const component = {}`)
            }

            if (template){
                // todo: compile template
                module.dependencies.push(template)
                lines.push(`component.template = require(${template.id})`)
            }

            lines.push(`module.exports = component`)

            module.builtSource = lines.join("\n")
        }
    ],

    text: [
        textProcessor,
    ],
    'vue.template': [
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
            ($0, $1, $2, $3) => ` require(${resolveModuleId($3, $2)}/*${$3}*/)`, // todo: 字符串转义？
        ],
        [
            // import * as foo from 'bar';
            // [0] => `import * as foo from 'bar'`
            // [1] => `foo`
            // [2] => `'`
            // [3] => `bar`
            /import\s+\*\s+as\s+(\S+)\s+from\s+(['"`])(\S+)['"`]/,
            ($0, $1, $2, $3) => `const ${$1} = require(${resolveModuleId($3, $2)})/*${$0}*/`,
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
                ? `const ${$1} = __extract_default__(require(${resolveModuleId($3, $2)}))/*${$0}*/`
                : `const ${$1} = require(${resolveModuleId($3, $2)})/*${$0}*/`
            ),
        ],
    ]
}

function parseJsStr(strLiteral, strQuote){
    // todo...
    return strLiteral
}


