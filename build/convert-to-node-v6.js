var fs = require('fs')
var path = require('path')

var PACKAGE_ROOT = path.join(__dirname, '..')

var packageInfoMod = {

  "dependencies": {
    "babel": "^6.23.0",
    "babel-core": "^6.26.0",
    "babel-polyfill": "^6.26.0",
    "debug": "^3.1.0",
    "md5": "^2.2.1"
  },
  "devDependencies": {
    "babel-cli": "^6.26.0",
    "babel-plugin-transform-regenerator": "^6.26.0",
    "babel-plugin-transform-runtime": "^6.23.0",
    "babel-preset-es2015": "^6.24.1",
    "babel-preset-latest": "^6.24.1",
    "babel-preset-stage-2": "^6.24.1",
    "intelli-espower-loader": "^1.0.1",
    "mocha": "^5.0.4",
    "power-assert": "^1.4.4"
  },
  "engines": {
    "node": ">=6.9"
  }
}

console.log("updating package.json...")
var packageJsonFile = path.join(PACKAGE_ROOT, 'package.json')
var packageJsonText = fs.readFileSync(packageJsonFile, 'utf8')
var packageInfo = JSON.parse(packageJsonText)
packageInfo = Object.assign(packageInfo, packageInfoMod) 
packageInfo.version = packageInfo.version.replace(/^9/, '0')
fs.writeFileSync(packageJsonFile, JSON.stringify(packageInfo, null, '  '), 'utf8')

console.log("updating .travis.yml")
var travisYmlFile = path.join(PACKAGE_ROOT, '.travis.yml')
replaceInFile(travisYmlFile, /^(\s+)-(\s+)'9.3'/m, function($0, $1){
    return $1 + ["- '6.9'", "- '7'", "- '8'", "- '9'"].join("\n" + $1)
})

console.log("updating index.js")
replaceInFile(
    path.join(PACKAGE_ROOT, 'index.js'),
    /\.\/src/,
    './lib'
)

replaceInFile(
    path.join(PACKAGE_ROOT, 'index.js'),
    /^/,
    "require('babel-polyfill')\n"
)

console.log("updating test/bootloader.js")
replaceInFile(
    path.join(PACKAGE_ROOT, 'test/bootloader.js'),
    /\/\*#!For node\.js v6\.9:/g,
    '//*#!For node.js v6.9:'
)



console.log('processing test files...')
var TEST_ROOT = path.join(PACKAGE_ROOT, 'test')
readdirSyncRec(TEST_ROOT).forEach(file => {
    if (/\.js$/.test(file)){
        replaceInFile(
            path.join(TEST_ROOT, file),
            /\.\.\/src/g,
            '../lib'
        )

        if (file !== 'bootloader.js'){
            replaceInFile(
                path.join(TEST_ROOT, file),
                /^/,
                'var regeneratorRuntime = require("regenerator-runtime");\n'
            )
        }
    }
})

console.log('building source files...')
var spawnSync = require('child_process').spawnSync
var spawnSyncCheckRet = function (cmd, args){
    console.log("RUN %o %o", cmd, args)
    var res = spawnSync(cmd, args, {stdio: 'inherit'})
    if (res.status !== 0){
        console.error("RUN %o %o failed, return code is %o.", cmd, args, res.status)
        process.exit(res.status)
    }
}

spawnSyncCheckRet('npm', ['install', '-d'])
spawnSyncCheckRet('npm', ['run', 'build'])
spawnSyncCheckRet('npm', ['run', 'test'])
spawnSyncCheckRet('git', ['add', '.'])
spawnSyncCheckRet('git', ['commit', '-m', 'convert to node.js v6'])


function replaceInFile(filepath, search, replacement){
    var fileContent = fs.readFileSync(filepath, 'utf8')
    fileContent = fileContent.replace(search, replacement)
    fs.writeFileSync(filepath, fileContent, 'utf8')
}

function readdirSyncRec(rootDir) {
    var r = []

    var f = function(parentDir){
        var files = fs.readdirSync(path.join(rootDir, parentDir))

        files = files.map(function(file){
            return path.join(parentDir, file)
        })

        files.forEach(function(file){
            r.push(file)
        })

        files.forEach(function(file){
            if (path.basename(file).indexOf('.') < 0){
                f(file)
            }
        })
    }
    
    f('.')

    return r
}

