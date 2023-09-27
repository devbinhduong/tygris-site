/**
 * @function defineReactive
 * @param {object} object which data will be add reactive key
 * @param {string} key
 * @param {any} initialValue
 * @param {function} [cb] callback function for setter
 */
export default function (object, key, initialValue, cb = () => {}) {
    const o = object;
    let value = initialValue;
    return Object.defineProperty(o, key, {
        get() {
            return value;
        },
        set(val) {
            value = val;
            cb();
        },
    });
}
