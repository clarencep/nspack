// cls && mocha --require ./test/bootloader.js test\utils.parallel.test.js
const assert = require('power-assert')
const utils = require('../src/es6/utils')
const {parallel} = utils


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe("Test parallelLimit()", function(){
    it("run 5 parallel jobs should take 1x time", async () => {
        const beginTime = Date.now()
        await parallel([
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
        ], 3)

        const endTime = Date.now()
        const spentTime = endTime - beginTime
        assert(Math.abs(spentTime - 100) < 100)
    })
})

