import b2bAjax from '../ajax';
import deleteCart from '../deleteCart';

export default function (cartId) {
    const quoteCheckoutId = localStorage.getItem('quoteCheckoutId');

    if (quoteCheckoutId) {
        b2bAjax.deleteCheckoutInfo(quoteCheckoutId)

            .then(res => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);

                localStorage.removeItem('quoteCheckoutId');
                deleteCart(cartId);
                $('body').trigger('cart-quantity-update', 0);
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
}
