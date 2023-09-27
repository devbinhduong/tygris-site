export default function (storeTimeZone, date) {
    // local date
    const localDate = date || new Date();
    const localTime = localDate.getTime();
    // local offset
    const localOffset = localDate.getTimezoneOffset() * 60000;
    // 8*60*60*1000
    // UTC Time
    const utcTime = localTime + localOffset;
    // store setting time zone
    const timeZone = storeTimeZone;
    // store setting time
    const zonetime = utcTime + (60 * 60 * 1000 * timeZone);
    // store setting date
    const zoneDate = new Date(zonetime);
    return zoneDate;
}
