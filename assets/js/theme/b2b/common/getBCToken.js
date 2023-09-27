// Get currently logged-in customer's BC token in order to send it to API for verification.
// appClientId: your app's client ID

export default function (appClientId) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: '/customer/current.jwt',
            data: {
                app_client_id: appClientId,
            },
            success: (data) => {
                resolve({
                    code: 200,
                    data,
                });
            },
            error: () => {
                reject();
            },
        });
    });
}
