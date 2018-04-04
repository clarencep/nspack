// cls && mocha --require ./test/bootloader.js test\utils.serial.test.js
const assert = require('power-assert')
const utils = require('../src/es6/utils')
const {serial} = utils


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe("Test serial()", function(){
    it("run 5 serial jobs should take 5x time", async () => {
        const beginTime = Date.now()
        await serial([
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
            () => sleep(100),
        ])

        const endTime = Date.now()
        const spentTime = endTime - beginTime
        assert(Math.abs(spentTime - 500) < 100)
    })
})

