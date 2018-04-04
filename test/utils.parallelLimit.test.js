// cls && mocha --require ./test/bootloader.js test\utils.parallelLimit.test.js
const assert = require('power-assert')
const utils = require('../src/es6/utils')
const {parallelLimit} = utils


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe("Test parallelLimit()", function(){
    it("run 5 parallel jobs limit 1 should take 5x time", async () => {
        const beginTime = Date.now()
        await parallelLimit([
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
        ], 1)

        const endTime = Date.now()
        const spentTime = endTime - beginTime
        assert(Math.abs(spentTime - 500) < 100)
    })

    it("run 5 parallel jobs limit 3 should take 2x time", async () => {
        const beginTime = Date.now()
        await parallelLimit([
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
        ], 3)

        const endTime = Date.now()
        const spentTime = endTime - beginTime
        assert(Math.abs(spentTime - 200) < 100)
    })
})

