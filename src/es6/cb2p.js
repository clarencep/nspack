export default function cb2p(f) {
    return function (...args) {
        const _this = this;
        return new Promise((resolve, reject) => {
            f.call(_this, ...args, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    };
}
