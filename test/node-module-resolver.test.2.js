// cls && mocha --require ./test/bootloader.js test\node-module-resolver.test.2.js
const path = require('path')
const assert = require('power-assert')
const NSPackStub = require('./stubs/nspack-stub')

const debug = require('debug')('test')
const extend = Object.assign

const NodeModuleResolver = require('../src/node-module-resolver')

const NSPACK_SRC_DIR = path.join(__dirname, '../src')
const NSPACK_NODE_MODULES_DIR = path.join(__dirname, '../node_modules')

const tests = [
    {
        moduleName: 'less',
        baseDir: NSPACK_SRC_DIR,
        expected: path.join(NSPACK_NODE_MODULES_DIR, 'less/index.js'),
    },
]


describe('Test NodeModuleResolver 2', function(){
    tests.forEach(({testTitle, moduleName, baseDir, options, expected}, i) => {
        it(testTitle || `test#${i}`, async () => {
            const nmr = new NodeModuleResolver(options)
            assert(expected === await nmr.resolveModuleFullPathName(moduleName, baseDir))
        })
    })
})
