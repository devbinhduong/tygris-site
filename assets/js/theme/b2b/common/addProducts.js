import getCart from './getCart';
import triggerCartNumber from './triggerCartNumber';

export default function (data) {
    getCart().then(res => {
        const hasCart = res[0];
        const url = hasCart ? `/api/storefront/carts/${res[0].id}/items` : '/api/storefront/carts';

        $.ajax({
            type: 'POST',
            url,
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: () => {
                window.b2b.Alert.success('Success');
                triggerCartNumber();
            },
            error: (error) => {
                window.b2b.Alert.error(error.responseJSON.detail || error.responseJSON.error);
            },
            complete: () => {
                window.b2b.$overlay.hide();
            },
        });
    });
}
