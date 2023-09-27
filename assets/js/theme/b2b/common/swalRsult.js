import swal from 'sweetalert2';

export default function (res) {
    if (res.code !== 200) {
        swal({
            text: res.message,
            type: 'error',
        });
    } else {
        swal({
            text: res.message,
            type: 'success',
        });
    }
}
