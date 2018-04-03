
import { Packer, Module, EntryModule, BuiltResult } from './nspack-interface';
import {humanizeSize} from './utils'

type PackerGetter = () => Packer

export default class NSPackBuiltResult implements BuiltResult {
    private _packer: PackerGetter;
    private _buildTimes: number;
    public modules: {[entryName: string]: EntryModule};
    public updated: boolean = false;


    constructor(packer: Packer){
        this._packer = () => packer
        this._buildTimes = packer.buildTimes
        this.modules = {}
    }

    get packer(): Packer{
        return this._packer()
    }

    buildTimes(): number{
        return this._buildTimes
    }

    spentTimeSeconds(): string{
        return (this.packer.buildSpentTimeMs / 1000).toFixed(3)
    }

    summary(): string{
        const r: string[] = []
        r.push(`Done build. Spent ${this.spentTimeSeconds()}(s)`)

        const tbl: string[][] = []
        for (let module of Object.values(this.modules)){
            tbl.push(['  ' + module.name + ':'])

            if (module.bundle.script && module.bundle.script.valid){
                tbl.push([
                    '',
                    module.bundle.script.outputName,
                    humanizeSize(module.bundle.script.outputSize),
                    module.bundle.script.hash,
                ])
            }

            if (module.bundle.style && module.bundle.style.valid){
                tbl.push([
                    '',
                    module.bundle.style.outputName,
                    humanizeSize(module.bundle.style.outputSize),
                    module.bundle.style.hash,
                ])
            }

            if (module.bundle.html && module.bundle.html.valid){
                tbl.push([
                    '',
                    module.bundle.html.outputName,
                    humanizeSize(module.bundle.html.outputSize),
                    module.bundle.html.hash,
                ])
            }
        }

        r.push(renderTable(tbl))

        r.push("")

        return r.join("\n")
    }
}

function renderTable(table: string[][]): string {
    const r = []

    const maxColsLen = [0, 0, 0, 0]
    for (let row of table){
        for (let i = 0; i < row.length; i++) {
            const cell = row[i]
            if (cell.length > maxColsLen[i]){
                maxColsLen[i] = cell.length
            }
        }
    }

    const maxMaxColsLen = [4, 50, 10, 10]
    for (let i = 0; i < maxMaxColsLen.length; i++){
        if (maxColsLen[i] > maxMaxColsLen[i]) {
            maxColsLen[i] = maxMaxColsLen[i]
        }
    }

    for (let row of table){
        if (row.length <= 0){
            continue
        }

        if (row.length === 1){
            r.push(row[0])
            continue
        } 
        
        r.push(row.map((v, i) => i === 2 ?  padSpaceLeft(v, maxColsLen[i]) : padSpaceRight(v, maxColsLen[i])).join(" "))
    }

    return r.join("\n")
}

function padSpaceLeft(v: string, len: number): string{
    if (v.length >= len) {
        return v
    }

    return new Array(len - v.length).fill(' ').join('') + v
}
function padSpaceRight(v: string, len: number): string{
    if (v.length >= len) {
        return v
    }

    return v + new Array(len - v.length).fill(' ').join('')
}