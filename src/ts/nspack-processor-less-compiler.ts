import LessModuleResolver from './less-module-resolver'
import { Module, Packer } from './nspack-interface';
import * as path from 'path'

const debug = require('debug')('nspack')
const less = require('less')

enum FragmentType {
    Code = 1,
    ImportStatement,
}

interface Fragment {
    type: FragmentType,
    code: string,
    module?: string,
}

const importRegex = /@import ["']([^"']*?)["'];/g // todo: escape string??

export default async function (module: Module, packer: Packer){
    module.builtType = 'css'
    
    if (!packer._lessModuleResolver){
        packer._lessModuleResolver = new LessModuleResolver(packer._config.resolve)
    }

    const source = module.source + ''

    const fragments = splitLessSource(source)

    packer.debugLevel > 4 &&
        fragments.forEach((x,i) => debug("!!!!!!!!!!!!!fragments[%o]: %o", i, x))

    const builtFragments = await Promise.all(fragments.map(x => buildFragment(x, module, packer)))

    packer.debugLevel > 4 &&
        builtFragments.forEach((x,i) => debug("!!!!!!!!!!!!!builtFragments[%o]: %o", i, x))

    module.builtSource = builtFragments.join("")

    packer.debugLevel > 4 &&
        debug("module %o build result: %o", module.relativePath, module.builtSource)
}

function splitLessSource(source: string): Fragment[]{
    const fragments = []

    importRegex.lastIndex = 0

    let i = 0, m

    for(;;){
        m = importRegex.exec(source)
        if (m){
            if (m.index > 0) {
                fragments.push({
                    type: FragmentType.Code,
                    code: source.substring(i, m.index),
                })
            } 
            
            fragments.push({
                type: FragmentType.ImportStatement,
                code: m[0],
                module: m[1], // todo: escape string??
            })

            i = importRegex.lastIndex
        } else {
            if (i <= source.length){
                fragments.push({
                    type: FragmentType.Code,
                    code: source.substring(i),
                })
            }
            break
        }
    }

    return fragments
}

async function buildFragment(fragment: Fragment, module: Module, packer: Packer) : Promise<string>{
    if (fragment.type === FragmentType.Code) {
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

    if (fragment.type === FragmentType.ImportStatement){
        const importedModule: Module = await resolveLessModule.call(
            packer,
            fragment.module,
            module.fullFileDirName,
        )

        module.dependencies.push(importedModule)
        return '\n/*' + importedModule.relativePath + '*/\n' + importedModule.builtSource
    }

    throw new Error("Invalid fragment type: " + fragment.type)
}

async function resolveLessModule(this: Packer, moduleName: string, baseDir: string): Promise<Module>{
    this.debugLevel > 0 && debug(`resolving %o in %o`, moduleName, baseDir)
    const moduleFullPathName: string = await resolveLessModuleFullPathName.call(
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
async function resolveLessModuleFullPathName(this: Packer, moduleName: string, baseDir: string): Promise<string>{
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


function isAllWhiteSpace(text: string): boolean{
    return text.trim().length === 0
}

