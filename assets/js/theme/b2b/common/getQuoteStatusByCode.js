/**
 * @function getQuoteStatusByCode
 * @param {string} code one of '0', '1', '2', '3'
 */
export default function (code) {
    const status = {
        0: 'New',
        1: 'Sent',
        2: 'Ordered',
        3: 'Expired',
        4: 'Opened',
        5: 'Draft',
    };
    return status[code];
}
