"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ProgressBar = require('ascii-progress');
class NsPackProgressBar {
    constructor(action) {
        this._total = 0;
        this._processed = 0;
        this._visible = false;
        this._action = action;
    }
    addTotal(n = 1) {
        this._total += n;
        this._onChange();
    }
    processed(n = 1) {
        this._processed += n;
        this._onChange();
    }
    show() {
        this._visible = true;
    }
    hide() {
        this._visible = false;
        // todo: how to hide the bar??
    }
    _onChange() {
        if (!this._visible) {
            return;
        }
        if (!this._bar) {
            this._bar = new ProgressBar({
                schema: this._action + '... [:bar] :current/:total :percent :spentTime',
                width: 40,
                total: this._total,
                current: 0,
                blank: '░',
                filled: '█'
            });
            this._beginTime = Date.now();
        }
        this._bar.total = this._total;
        this._bar.current = this._processed;
        this._bar.compile({
            spentTime: ((Date.now() - this._beginTime) / 1000).toFixed(1) + 's'
        });
    }
}
exports.default = NsPackProgressBar;
