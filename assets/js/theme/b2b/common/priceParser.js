export default function (price, locales = 'es-US', currency = 'USD') {
    return Number.parseFloat(price).toLocaleString(locales, { style: 'currency', currency });
}
