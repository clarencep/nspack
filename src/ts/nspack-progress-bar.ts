const ProgressBar = require('ascii-progress')

export default class NsPackProgressBar {
    private _action: string;
    private _total: number = 0;
    private _processed: number = 0;
    private _bar: any;
    private _beginTime: number;

    constructor(action: string){
        this._action = action
    }

    public addTotal(n=1){
        this._total += 1
        this._onChange()
    }

    public processed(n=1){
        this._processed += 1
        this._onChange()
    }


    private _onChange(){
        if (!this._bar){
            this._bar = new ProgressBar({
                schema: this._action + '... [:bar] :current/:total :percent :spentTime',
                width: 40,
                total: this._total,
                current: 0,
            })

            this._beginTime = Date.now()
        }

        this._bar.total = this._total
        this._bar.current = this._processed
        this._bar.compile({
            spentTime: ((Date.now() - this._beginTime) / 1000).toFixed(1) + 's'
        })
    }
}


