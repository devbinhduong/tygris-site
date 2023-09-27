export default function () {
    const str = $('#b2b-crf-token').html();
    str.match(/"csrf_token":"(\w*)"/);
    return RegExp.$1;
}
