
// reload the package.
require('..')

// 加载power-assert的loader，让assert更简单
require('intelli-espower-loader')

//*#!For node.js v6.9:///////////////////////////////////
// 启用babel实时转译功能
require('babel-register')({
    "presets": [
        [
            "latest",
            {
                "targets": {
                    "node": "6.9"
                },
                "es2015": {
                    "modules": false
                }
            }
        ],
        "stage-2"
    ]
})
////////////////////////////////////////////////*/

