// cls && mocha --require ./test/bootloader.js test\node-module-resolver.test.js
const path = require('path')
const assert = require('power-assert')
const NSPackStub = require('./stubs/nspack-stub')

const debug = require('debug')('test')
const extend = Object.assign

const NodeModuleResolver = require('../src/node-module-resolver')


const aliasTests = [
    /////////////////////////////////////////////////
    {
        alias: {
            '@': '/a/b/c',
            '@/foo': '@/bar',
        },
        expected: {
            '@': '/a/b/c',
            '@/foo': '/a/b/c/bar',
            '@/baz': '/a/b/c/baz',
        }
    },
    ///////////////////////////////////////////////
]

describe('Test NodeModuleResolver alias', function(){
    aliasTests.forEach(({testTitle, alias, expected}, i) => {
        it(testTitle || `test#${i}`, () => {
            const nmr = new NodeModuleResolver({alias})

            for (let moduleName of Object.keys(expected)){
                const expectedPath = expected[moduleName]
                assert(nmr._expandAlias(moduleName) === expectedPath)
            }

        })
    })
})


