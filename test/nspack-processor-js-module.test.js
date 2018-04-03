// cls && mocha --require ./test/bootloader.js test\default-module-processors__js.test.js
const path = require('path')
const assert = require('power-assert')
const NSPackStub = require('./stubs/nspack-stub')

const debug = require('debug')('test')
const extend = Object.assign

const defaultModuleProcessors = require('../src/es6/nspack-default-processors').default


const stubModules = {
    'foo': 2,
    'bar': 3,
    'baz': 4,
}

const tests = [
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
module.exports = function Hello(){
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
module.exports = function Hello(){
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
const foo = require('foo')
module.exports = foo()
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const foo = __require_module__(${stubModules['foo']}/*foo*/)
module.exports = foo()
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
const foo = require("foo")
module.exports = foo()
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const foo = __require_module__(${stubModules['foo']}/*foo*/)
module.exports = foo()
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
const foo = require(\`foo\`)
module.exports = foo()
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const foo = __require_module__(${stubModules['foo']}/*foo*/)
module.exports = foo()
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
let foo = require('foo')
module.exports = foo()
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
let foo = __require_module__(${stubModules['foo']}/*foo*/)
module.exports = foo()
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
var foo = require('foo')
module.exports = foo()
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
var foo = __require_module__(${stubModules['foo']}/*foo*/)
module.exports = foo()
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
module.exports = require('foo')('bar')
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
module.exports = __require_module__(${stubModules['foo']}/*foo*/)('bar')
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
module.exports = require('foo').bar
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
module.exports = __require_module__(${stubModules['foo']}/*foo*/).bar
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
import * as foo from 'bar'
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const foo = __require_module__(${stubModules['bar']})
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
import foo from 'bar'
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const foo = __extract_default__(__require_module__(${stubModules['bar']}))
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
import {foo, bar, baz} from 'bar'
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const {foo, bar, baz} = __require_module__(${stubModules['bar']})
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
import {foo as bar, bar as baz, zzz} from 'bar'
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
const {foo : bar, bar : baz, zzz} = __require_module__(${stubModules['bar']})
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export default function Hello(){
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.default = function Hello(){
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export default {
    foo: 'bar'
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.default = {
    foo: 'bar'
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export default{
    foo: 'bar'
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.default = {
    foo: 'bar'
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export let foo = function Hello(){
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; let foo = exports.foo = function Hello(){
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export var foo = function Hello(){
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; var foo = exports.foo = function Hello(){
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export const foo = function Hello(){
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; const foo = exports.foo = function Hello(){
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export function Hello(){
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.Hello = function Hello(){
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export function Hello () {
    console.log("Hello world!")
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.Hello = function Hello() {
    console.log("Hello world!")
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export class Hello{
    hi(){
        console.log("Hello world!")
    }
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.Hello = class Hello{
    hi(){
        console.log("Hello world!")
    }
}
`,
        },
    },
    /////////////////////////////////////////////////
    {
        inputModule: makeTestModule({
            source: `
export class He$11o {
    hi(){
        console.log("Hello world!")
    }
}
`
        }),
        expected: {
            builtType: 'js',
            builtSource: `
__set_esModule_flag__(exports)
; exports.He$11o = class He$11o{
    hi(){
        console.log("Hello world!")
    }
}
`,
        },
    },
    /////////////////////////////////////////////////
]

describe("Test js processor", function(){
    tests.forEach(({testTitle, inputModule, expected}, i) => {
        it(testTitle || `test#${i}`, async () => {
            const packer = newPacker()
            
            for (let processor of defaultModuleProcessors.js){
                await processor.call(processor, inputModule, packer)
            }

            assert(inputModule.builtSource)

            for (let key of Object.keys(expected)){
                if (key === 'builtSource'){
                    assert(minify(inputModule.builtSource) === minify(expected.builtSource))
                } else {
                    assert(inputModule[key] === expected[key])
                }
            }
            
        })
    })
})


function makeTestModule(attributes){
    return extend({
        id: 1,
        name: 'test.js',
        file: 'a/b/c/test.js',
        relativePath: 'a/b/c/test.js',
        fullPathName: '/test/a/b/c/test.js',
        fullFileDirName: '/test/a/b/c',
        dependencies: [],
    }, attributes)
}

function newPacker(){
    const packer = new NSPackStub()

    packer._resolveModule = async function(moduleName, baseDir){
        assert(stubModules[moduleName])
        return {
            id: stubModules[moduleName],
            name: moduleName,
        }
    }

    packer._processModule = async function (module){
        module.processed = true
        return module
    }

    return packer
}



function minify(text){
    assert(typeof text === 'string')
    return text.trim().replace(/\s+/g, ' ')
}