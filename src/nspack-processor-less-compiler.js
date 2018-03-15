const debug = require('debug')('nspack')
const less = require('less')
const LessModuleResolver = require('./less-module-resolver')

const importRegex = /@import ["']([^"']*?)["'];/g // todo: escape string??

module.exports = async function (module, packer){
    module.builtType = 'css'
    

    if (!packer._lessModuleResolver){
        packer._lessModuleResolver = new LessModuleResolver()
    }

    const source = module.source

    const fragments = splitLessSource(source)

    fragments.forEach((x,i) => debug("!!!!!!!!!!!!!fragments[%o]: %o", i, x))

    const builtFragments = await Promise.all(fragments.map(x => buildFragment(x, module, packer)))

    builtFragments.forEach((x,i) => debug("!!!!!!!!!!!!!builtFragments[%o]: %o", i, x))

    module.builtSource = builtFragments.join("")
}

const FRAGMENT_TYPE_CODE = 1
const FRAGMENT_TYPE_IMPORT = 2

function splitLessSource(source){
    const fragments = []

    importRegex.lastIndex = 0

    let i = 0, m

    for(;;){
        m = importRegex.exec(source)
        if (m){
            if (m.index > 0) {
                fragments.push({
                    type: FRAGMENT_TYPE_CODE,
                    code: source.substring(i, m.index),
                })
            } 
            
            fragments.push({
                type: FRAGMENT_TYPE_IMPORT,
                code: m[0],
                module: m[1], // todo: escape string??
            })

            i = importRegex.lastIndex
        } else {
            if (i <= source.length){
                fragments.push({
                    type: FRAGMENT_TYPE_CODE,
                    code: source.substring(i),
                })
            }
            break
        }
    }

    return fragments
}

async function buildFragment(fragment, module, packer){
    if (fragment.type === FRAGMENT_TYPE_CODE) {
        if (fragment.code.length < 30 && isAllWhiteSpace(fragment.code)){
            return ''
        }

        try {
            // debug("compile less code: %o", fragment.code)
            const r = await less.render(fragment.code)
            return r.css
        } catch (e){
            console.error(`Error: failed to compile ${module.fullPathName}, detail:`)
            console.error(e)
            throw new Error(`Error: failed to compile ${module.fullPathName}, detail:` + e)
        }
    }

    if (fragment.type === FRAGMENT_TYPE_IMPORT){
        const importedModule = await resolveLessModule.call(
            packer,
            fragment.module,
            module.fullFileDirName,
        )

        module.dependencies.push(importedModule)
        return '\n/*' + importedModule.relativePath + '*/\n' + importedModule.builtSource
    }

    throw new Error("Invalid fragment type: " + fragment.type)
}

async function resolveLessModule(moduleName, baseDir){
    this.debugLevel > 0 && debug(`resolving %o in %o`, moduleName, baseDir)
    const moduleFullPathName = await resolveLessModuleFullPathName.call(
        this,
        moduleName,
        baseDir,
    )

    if (!moduleFullPathName){
        throw new Error(`failed tor resolve ${moduleName} in ${baseDir}`)
    }

    const module = await this._addModuleIfNotExists({
        name: moduleName,
        baseDir: baseDir,
        fullPathName: moduleFullPathName,
    })

    return await this._processModule(module)
}

/**
 * @this packer
 */
async function resolveLessModuleFullPathName(moduleName, baseDir){
    if (moduleName[0] === '@'){
        return await this._lessModuleResolver.resolveModuleFullPathName(
            path.join(this._config.entryBase, moduleName.substring(1)),
            ''
        )
    }

    return await this._lessModuleResolver.resolveModuleFullPathName(
        moduleName,
        baseDir
    )
}


function isAllWhiteSpace(text){
    return text.trim().length === 0
}

