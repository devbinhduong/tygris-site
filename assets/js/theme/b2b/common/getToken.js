import b2bAjax from './ajax';

export default function (bcToken) {
    return new Promise((resolve, reject) => {
        sessionStorage.removeItem('b2bToken');
        b2bAjax.getToken({
            bcToken,
        }).then(response => {
            resolve(response);
        }).catch(error => {
            reject(error);
        });
    });
}
