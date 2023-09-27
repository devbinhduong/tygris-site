export default function (code) {
    const status = {
        0: 'Approved',
        20: 'Deleted',
        30: 'Draft',
        40: 'Ready for Approval',
    };
    return status[code];
}
