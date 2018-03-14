var fs = require('fs')
var path = require('path')

var LIB_PATH = path.join(__dirname, '../lib')

fs.readdir(LIB_PATH, function(err, files){
    if (err){
        dieWithError("Failed to read the lib directory", err)
        return
    }

    files.forEach(function(file){
        console.log("processing " + file + "...")
        var fileFullPath = path.join(LIB_PATH, file)
        fs.readFile(fileFullPath, 'utf8', function(err, data){
            if (err){
                dieWithError("Failed to read file " + file, err)
                return
            }

            data = 'var regeneratorRuntime = require("regenerator-runtime");\n' + data

            fs.writeFile(fileFullPath, data, 'utf8', function(err){
                if (err){
                    dieWithError("Failed to write file " + file, err)
                    return
                }

                console.log("processed " + file + ".")
            })
        })
    })
})

function dieWithError(msg, err){
    console.error(msg, err)
    process.exit(1)
}