export default function (arr) {
    for (let i = 0; i < arr.length; i++) {
        sessionStorage.removeItem(arr[i]);
    }
}
