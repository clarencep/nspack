import * as fs from 'fs'


export type ModuleBuiltType = "js" | "css" | "html"

export interface BuiltResult{
    readonly packer: Packer;
    readonly updated: boolean;
    readonly modules: {[entryName: string]: EntryModule};
    summary(): string;
    buildTimes(): number;
    spentTimeSeconds(): string;
}

export interface NewModule {
    id?: number;
    name: string;
    baseDir: string;

    file?: string;
    fullPathName?: string;
    relativePath?: string;
    fullFileDirName?: string;

    type?: string;
    isExternal?: boolean;
    isInternal?: boolean;
    needUpdate?: boolean;
    processed?: boolean;

    source?: string|Buffer;
    builtType?: ModuleBuiltType;
    builtSource?: string|Buffer;

    resolvingParents?: string;
    resolvingParentsAndSelf?: string;

    libName?: string;
    libTarget?: string;
    amdExecOnDef?: boolean;
}

export interface Module extends NewModule {
    id: number;
    name: string;
    baseDir: string;

    type: string;
    source?: string|Buffer;
    builtType: ModuleBuiltType;
    builtSource: string|Buffer;

    file?: string;
    relativePath: string;
    fullPathName: string;
    fullFileDirName: string;

    dependencies: Module[];

    resolvingParents: string;
    resolvingParentsAndSelf: string;

    outputSource?: string|Buffer;
    outputName?: string;

    processed: boolean;
    needUpdate: boolean;
    cssExtracted: boolean;

    libName: string;
    libTarget: string;
    amdExecOnDef: boolean;
    fresh: boolean;

    _checkIfNeedUpdate0(): Promise<boolean>;
    _checkIfNeedUpdate1(): boolean;
}

export interface ModuleBundle{
    valid: boolean;
    outputName: string;
    outputSource: string|Buffer,
    outputSize: number;
    hash: string;
}

export type EntryContentReader = (entry: EntryModule) => EntryContent|Promise<EntryContent>

export interface NewEntryModule {
    name?: string,
    js: EntryContentReader;
    css: EntryContentReader;
    html: EntryContentReader;
    libName?: string;
    libTarget?: string;
    amdExecOnDef?: boolean;
    ignoreMissingCss?: boolean;
    extractCssFromJs?: boolean;
}

export interface EntryModule extends NewEntryModule {
    name: string,
    jsModule: Module,
    cssModule: Module,
    bundle: EntryModuleBundle,

    js: EntryContentReader;
    css: EntryContentReader;
    html: EntryContentReader;

    entry: {
        name: string;
        baseDir: string;
    },

    libName?: string;
    libTarget?: string;
    amdExecOnDef?: boolean;
    ignoreMissingCss?: boolean;
    extractCssFromJs?: boolean;

    processed: boolean;
    needUpdate: boolean;

    loadJsSource(): Promise<EntryContent>;
    loadCssSource(): Promise<EntryContent>;
    loadHtmlSource(): Promise<EntryContent>;

    _checkIfNeedUpdate0(): boolean;
    _checkIfNeedUpdate1(): boolean;
}

 
export interface EntryModuleBundle {
    script?: ModuleBundle,
    style?: ModuleBundle,
    html?: ModuleBundle,
    scriptsTags: string,
    stylesTags: string,
}


export interface Packer {
    buildTimes: number;
    buildSpentTimeMs: number;
    debugLevel: number;

    _lessModuleResolver: ModuleResolver;
    _config: PackerConfig;

    addOrUpdateModule(module: NewModule): Promise<Module>;

    _addModuleIfNotExists(module: NewModule): Promise<Module>;
    _resolveModule(moduleName: string, baseDir: string, resolvingPath: string): Promise<Module>;
    _processModule(module: Module);
}

export interface ModuleResolver{
    resolveModuleFullPathName(moduleName: string, baseDir: string): Promise<string>;
}

export type EntryFilePath = string
export type EntrySourceCode = string|Buffer
export type EntryContent = {filePath?: EntryFilePath, sourceCode?: EntrySourceCode} 
export type EntryResolver = (entry: EntryModule) => Promise<EntrySourceCode|EntryContent>
export type EntryConfigItem = EntryFilePath | EntryContent | EntryResolver
export type LibTarget = "umd" | "amd" | "commonjs" | ""
export interface EntryConfig  {
    js?: EntryConfigItem,
    css?: EntryConfigItem,
    html?: EntryConfigItem,
    extractCssFromJs?: boolean,
    ignoreMissingCss?: boolean,
    libName?: string, // default is this entry's name (in which all backslashes ('\') will be replaced by slash ('/') )
    libTarget?: LibTarget, // default is no libTarget (just execute the module in an IIFE)
    amdExecOnDef?: boolean, // default is true 
}

export type EntryOutputConfig = {
    js?: string;
    css?: string;
    html?: string;
}

export interface Hook {
    apply: (self: Hook, ...args) => any
}

export type BabelRc = false // no babel
    | string // the .babelrc file path (base from working directory)
    | true | undefined // use default '.babelrc' (base from working directory)
    | {[key: string]: any} // directly specify the babel configuration object


export type ModuleProcessor = (module: Module, packer: Packer) => void

export interface OutputHookFileInfo {
    packer: Packer,
    entryModule: EntryModule,
    outputName: string,
    outputType: ModuleBuiltType,
    filePath: string,
    fileDir: string,
    content: string|Buffer,
    write(f: {filePath: string, content: string|Buffer}): Promise<any>,

    [key: string]: any,
}

export interface FileSystem{
    stat(fileDir: string, cb: (err: Error, stat: fs.Stats) => void);
    mkdir(fileDir: string, cb: (err: Error) => void);
    writeFile(filepath: string, data: string|Buffer, encoding: string|null, cb: (err: Error) => void);
}

export type PackerConfigResolver = () => PackerConfig|Promise<PackerConfig>
export type PackerConfigArg = PackerConfig | PackerConfigResolver

export interface PackerConfig {
    // the base directory for inputs -- then you can use relative path in EntryConfig
    entryBase?: string; // default is the working directory

    // the entries, which are required
    entry: {
        [name: string]: EntryConfig;
    },

    // filter the entry to be built 
    // -- entries will be built only if this filter evaluated to `true`
    // -- it is helpful when you just wanna build one or several entries temporarily.
    entryFilter?: (entryName: string, entryConfig: EntryConfig) => boolean,

    // the base directory for output -- then you can use relative path in EntryOutputConfig
    outputBase?: string; // default is the `dist` directory in working directory

    // specify the output file pathes and names
    output?: {
        // <entry-name> => <entry-output-config>
        // - <entry-name>: the name of the entry, should be the same with previous config.entry configuration.
        [entryName: string]: EntryOutputConfig;
    },

    // the output hash manifests:
    outputHashManifests?: {
        json?: string; // specify the manifests JSON file
        jsonp?: string; // specify the manifests JSONP file
        jsonpCallback?: string; // the callback function name for JSONP
    },

    // the hash length for `[hash]` in output file name, default is `6`
    hashLength?: number,

    resolve?: {
        // specify the extensions when resolving module
        extensions?: string[];

        // specify module alias
        // default: { '@': config.entryBase }
        alias?: {
            [name:string]: string;
        }
    },

    // module processors will be invoked before a module is bundled.
    moduleProcessors?: {
        [moduleType: string]: ModuleProcessor[],
    },

    externals?: {
        // <module-name> => <module-definition>
        // - <module-name>: can be used in require() or import 
        // - <module-definition>: a js expression, whose value is the module.
        [name: string]: string;
    },
    // hooks are something accepts inputs, processes inputs and can stop the normal packing process by returning false.
    // a hook must provide a apply() method, like a function.
    // the simplest hook is just a function.
    hooks?: {
        [hookPoint: string]: Hook;
    },
    // specify the interval in ms for checking filesystem changes in watching process.
    watchInterval?: number;

    // specify the debug level - higher level produce more debug outputs
    debugLevel?: number;

    // specify the output file system to use.
    fs?: FileSystem;

    // specify the babel configuration
    babelrc?: BabelRc;
}


