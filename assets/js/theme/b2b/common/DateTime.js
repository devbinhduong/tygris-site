export default {
    /**
     * @function formateTimestampToLocal
     * @param {string} timestamp
     */
    formateTimestampToLocal(timestamp) {
        return new Date(parseInt(timestamp, 10) * 1000).toLocaleDateString().replace(/\//g, '/');
    },
    getMonthDayYear(timestamp) {
        const y = new Date(parseInt(timestamp, 10) * 1000).getFullYear();
        const m = new Date(parseInt(timestamp, 10) * 1000).getMonth() + 1;
        const d = new Date(parseInt(timestamp, 10) * 1000).getDate();
        return `${m}/${d}/${y}`;
    },
};
