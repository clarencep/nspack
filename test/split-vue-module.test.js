const assert = require('power-assert')
const NSPackStub = require('./stubs/nspack-stub')
const splitVueModule = require('../lib/split-vue-module')
const debug = require('debug')('test')
const extend = Object.assign

const tests = [
    {
        testTitle: 'test a normal vue file',
        vueModule: makeTestVueModule({
            source: `
<template>
    <div>Foo bar</div>
</template>
<script>
    export default {
        data(){
            return {}
        }
    }
</script>
<style>
    div{color: red}
</style>`
        }),
        expectedTemplate: {
            source: `<div>Foo bar</div>`,
            type: 'vue.tpl',
        },
        expectedScript: {
            source: `module.exports = { data(){ return {} } }`,
            type: 'js',
        },
        expectedStyle: {
            source: `div{color: red}`,
            type: 'css',
        }
    },

    {
        testTitle: 'test a vue file without template',
        vueModule: makeTestVueModule({
            source: `
<script>
    export default {
        data(){
            return {}
        }
    }
</script>
<style>
    div{color: red}
</style>`
        }),
        expectedTemplate: undefined,
        expectedScript: {
            source: `module.exports = { data(){ return {} } }`,
            type: 'js',
        },
        expectedStyle: {
            source: `div{color: red}`,
            type: 'css',
        }
    },
    {
        testTitle: 'test a vue file without script',
        vueModule: makeTestVueModule({
            source: `
<template>
    <div>Foo bar</div>
</template>
<style>
    div{color: red}
</style>`
        }),
        expectedTemplate: {
            source: `<div>Foo bar</div>`,
            type: 'vue.tpl',
        },
        expectedScript: undefined,
        expectedStyle: {
            source: `div{color: red}`,
            type: 'css',
        }
    },
    {
        testTitle: 'test a vue file without style',
        vueModule: makeTestVueModule({
            source: `
<template>
    <div>Foo bar</div>
</template>
<script>
    export default {
        data(){
            return {}
        }
    }
</script>`
        }),
        expectedTemplate: {
            source: `<div>Foo bar</div>`,
            type: 'vue.tpl',
        },
        expectedScript: {
            source: `module.exports = { data(){ return {} } }`,
            type: 'js',
        },
        expectedStyle: undefined,
    },
    
    {
        testTitle: 'test a vue file using commonjs',
        vueModule: makeTestVueModule({
            source: `
<template>
    <div>Foo bar</div>
</template>
<script>
    module.exports = {
        data(){
            return {}
        }
    }
</script>
<style>
    div{color: red}
</style>`
        }),
        expectedTemplate: {
            source: `<div>Foo bar</div>`,
            type: 'vue.tpl',
        },
        expectedScript: {
            source: `module.exports = { data(){ return {} } }`,
            type: 'js',
        },
        expectedStyle: {
            source: `div{color: red}`,
            type: 'css',
        }
    },
]

describe("Test splitVueModule", function(){

    tests.forEach(({testTitle, vueModule, expectedTemplate, expectedScript, expectedStyle}, i) => {
        it(testTitle || `test#${i}`, async function(){
            const packer = new NSPackStub()            
            const {template, script, style} = await splitVueModule(vueModule, packer)
            // debug({template, script, style} )
            if (expectedTemplate){
                assert(template)
                assert(minify(template.source) === expectedTemplate.source)
                Object.keys(expectedTemplate)
                      .filter(x => x !== 'source')
                      .forEach(key => {
                          assert(template[key] === expectedTemplate[key])
                      })
            } else {
                assert(!template)
            }
            
            if (expectedScript){
                assert(script)
                assert(minify(script.source) === expectedScript.source)
                Object.keys(expectedScript)
                      .filter(x => x !== 'source')
                      .forEach(key => {
                          assert(script[key] === expectedScript[key])
                      })
            } else {
                assert(!script)
            }
            
            if (expectedStyle){
                assert(style)
                assert(minify(style.source) === expectedStyle.source)
                Object.keys(expectedStyle)
                      .filter(x => x !== 'source')
                      .forEach(key => {
                          assert(style[key] === expectedStyle[key])
                      })
            } else {
                assert(!style)
            }
        })
    })
})


function minify(text){
    assert(typeof text === 'string')
    return text.trim().replace(/\s+/g, ' ')
}


function makeTestVueModule(attributes){
    return extend({
        name: 'test.vue',
        fullPathName: '/test/a/b/c/test.vue',
        relativePath: 'a/b/c/test.vue',
        baseDir: '/test/a/b/c',
        type: 'vue',
        source: undefined,
    }, attributes)
}