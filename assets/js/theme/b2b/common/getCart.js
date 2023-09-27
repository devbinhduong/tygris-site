export default function () {
    return new Promise((resolve) => {
        $.ajax({
            type: 'GET',
            url: '/api/storefront/carts',
            contentType: 'application/json',
            accept: 'application/json',
            async: false,
            success: (data) => {
                resolve(data);
            },
            error: () => {
                resolve('');
            },
        });
    });
}
