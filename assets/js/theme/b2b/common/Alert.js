import swal from 'sweetalert2';

/**
 * Alert object
 * @example
 * // display an error Alert
 * import Alert from 'relative-path/Alert';
 * Alert.error(errorMessage);
 */
export default {
    error(text) {
        swal({
            type: 'error',
            text,
        });
    },
    success(text) {
        swal({
            type: 'success',
            text,
        });
    },
    warning(text) {
        swal({
            type: 'warning',
            text,
        });
    },
    info(text) {
        swal({
            type: 'info',
            text,
        });
    },
};
