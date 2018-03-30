#!/usr/bin/env node
var nspack = require('./index.js')
var debug = require('debug')('nspack')

var args = process.argv.slice(2)
var command = args[0]

process.on('uncaughtException', function (err) {
    console.log("\nUncaught exception: ", err);
    console.log("\n", err.stack);
    process.exit(2); 
});

process.on('unhandledRejection', function (err) {
    console.log("\nUncaught rejection: ", err);
    console.log("\n", err.stack);
    process.exit(3); 
});

if (isHelpCommand(command)){
    printHelp()
    exit(1)
} else if (command === 'watch'){
    args.shift()
    runWatch(args)
} else if (command === 'build' || command === undefined){
    args.shift()
    runBuild(args)
} else {
    printHelp()
    exit(1)
}

function isHelpCommand(cmd){
    return '-? -h --help help /? /h /help'.split(' ').indexOf((cmd + '').toLowerCase()) >= 0
}

function printHelp(){
    process.stdout.write([
        "Usage:  nspack [command] [args]",
        "",
        "Commands:",
        "   help  -- show this help message",
        "   build -- build the project",
        "   watch -- build and watch the project",
        "",
    ].join("\n"))
}

function runBuild(args){
    debug("parsing nspack arguments...")
    var cfg = parseBuildWatchArgs(args, {
        usage: [
            "Usage:  nspack build [options]",
            "",
            "Options:",
            "   -h/--help             -- show this help message",
            "   -D/--directory <dir>  -- set the working directory",
            "   -c/--config <file>    -- use the file specified as config file",
            "",
        ].join("\n")
    })

    debug("loading nspack config...")
    var nspackConfig = loadNspackConfig(cfg)
    var packer = new nspack(nspackConfig)

    debug("begin nspack...")
    return packer.build()
                 .then(res => {
                    debug("done nspack.")
                    console.log(res.summary())
                 })
                 .catch(err => {
                    process.stderr.write("nspack failed: " + (err.stack || err))
                    process.exit(1)
                 })
}

function runWatch(args){
    debug("parsing nspack arguments...")
    var cfg = parseBuildWatchArgs(args, {
        usage: [
            "Usage:  nspack watch [options]",
            "",
            "Options:",
            "   -h/--help             -- show this help message",
            "   -D/--directory <dir>  -- set the working directory",
            "   -c/--config <file>    -- use the file specified as config file",
            "",
        ].join("\n")
    })

    debug("loading nspack config...")
    var nspackConfig = loadNspackConfig(cfg)
    var packer = new nspack(nspackConfig)

    debug("begin nspack watching...")
    return packer.watch(
        // doneCallback: async? (err:Error, res:NSPackBuiltResult) => void
        (err, res) => {
            if (err){
                debug("nspack finished with error:", err)
                return
            }

            debug("done nspack.")
            console.log(res.summary())
        },
        // beginCallback: async? (void) => void
        () => {
            debug("begin nspack...")
        }
    )
}

function parseBuildWatchArgs(args, options){
    if (isHelpCommand(args[0])){
        process.stdout.write(options.usage)
        exit(1)
    }

    var cfg = {}

    while (args.length > 0){
        if (args[0] === '-D' || args[0] === '--directory'){
            if (args[1] === undefined){
                return dieWithError(11, "Error: working directory not specified!")
            }

            cfg.workingDirectory = args[1]
            args.splice(0, 2)
        } else if (args[0] === '-c' || args[0] === '--config'){
            if (args[1] === undefined){
                return dieWithError(12, "Error: configuration file not specified!")
            }

            cfg.configFile = args[1]

            args.splice(0, 2)
        } else {
            return dieWithError(13, "Error: unknown option or argument: " + args[0])
        }
    }
    
    return cfg;
}


function loadNspackConfig(cfg){
    if (cfg.workingDirectory){
        process.chdir(cfg.workingDirectory)
    }

    // try use the working directory's nspack
    try {
        var wdNspack = require('nspack')
        nspack = wdNspack
    } catch (e){}

    var configFileName = require('path').resolve(process.cwd(), cfg.configFile || 'nspack.config.js')
    return require(configFileName)
}

function exit(code){
    process.exit(code || 0)
}

function dieWithError(code, msg){
    process.stderr.write(msg + "\n")
    process.exit(code)
}

