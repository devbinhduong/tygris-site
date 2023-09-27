/**
 * formate current by BigCommerce's default setting from page context
 * @param {object} money BigCommerce's default currency settings
 * money object example
 *    {
 *      "currency_token": "$",
 *      "currency_location": "left",
 *      "decimal_token": ".",
 *      "decimal_places": 2,
 *      "thousands_token": ","
 *    }
 */
export default function (value, money = {}) {
    // default format config
    const currencyToken = money.currency_token || '$';
    const currencyLocation = money.currency_location || 'left';
    const decimalToken = money.decimal_token || '.';
    const decimalPlaces = money.decimal_places || 2;
    const thousandsToken = money.thousands_token || ',';

    // parse value to float
    const number = parseFloat(value);

    // need to return `Invlaid Number` is the value cannot be parse to float.
    if (Number.isNaN(number)) return 'Invalid Number';

    // deal with zero
    if (number === 0) return number.toFixed(2);

    // define negative sign
    const negativeSign = number < 0 ? '-' : '';

    /**
     * 1. get absolute value
     * 2. deal with decimal palace
     * 3. split value to left and right by '.'
     */
    const [left, right] = (Math.abs(number) || 0).toFixed(decimalPlaces).split('.');

    // get start length by left length
    const startLength = left.length > 3 ? left.length % 3 : 0;

    /**
     * 1. formate left split by startLength
     * 2. add thousands token
     */
    const formatedLeft = (startLength ? left.substr(0, startLength) + thousandsToken : '')
        + left.substr(startLength).replace(/(\d{3})(?=\d)/g, `$1${thousandsToken}`);

    // result
    return negativeSign // negative sign
        + (currencyLocation === 'right' ? '' : currencyToken) // if current location is set to `right` will not show currency token
        + formatedLeft // left part
        + decimalToken // decimal token
        + right // right part
        + (currencyLocation !== 'right' ? '' : currencyToken); // if current location is set to `right` will show currency token
}
