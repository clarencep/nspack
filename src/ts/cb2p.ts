export type Callback<TRes> = (err: any, res: TRes) => void
export type CallbackFunc0<TRes> = (cb: Callback<TRes>) => void
export type CallbackFunc1<A, TRes> = (a: A, cb: Callback<TRes>) => void
export type CallbackFunc2<A, B, TRes> = (a: A, b: B, cb: Callback<TRes>) => void
export type CallbackFunc3<A, B, C, TRes> = (a: A, b: B, c: C, cb: Callback<TRes>) => void

export type PromiseFunc0<T> = () => Promise<T>
export type PromiseFunc1<A, T> = (a: A) => Promise<T>
export type PromiseFunc2<A, B, T> = (a: A, b: B) => Promise<T>
export type PromiseFunc3<A, B, C, T> = (a: A, b: B, c: C) => Promise<T>

export default function cb2p<T>(f: CallbackFunc0<T>): PromiseFunc0<T>;
export default function cb2p<A, T>(f: CallbackFunc1<A, T>): PromiseFunc1<A, T>;
export default function cb2p<A, B, T>(f: CallbackFunc2<A, B, T>): PromiseFunc2<A, B, T>;
export default function cb2p<A, B, C, T>(f: CallbackFunc3<A, B, C, T>): PromiseFunc3<A, B, C, T>;

export default function cb2p(f){
    return function(...args){
        const _this = this
        return new Promise((resolve, reject) => {
            f.call(_this, ...args, (err, res) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(res)
                }
            })
        })
    }
}


