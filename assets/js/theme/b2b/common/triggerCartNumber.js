import utils from '@bigcommerce/stencil-utils';
import currencyFormat from './currencyFormat';

export default function () {
    // updata cart number
    const options = {
        template: {
            content: 'b2b/cart-content-data',
            totals: 'cart/totals',
            pageTitle: 'cart/page-title',
            statusMessages: 'cart/status-messages',
        },
    };

    utils.api.cart.getContent(options, (err, response) => {
        const $tempContainer = $(document.createElement('div'));
        $tempContainer.html(response.content);
        const quantityArr = $tempContainer.find('.item').map((i, e) => parseInt($(e).attr('data-item-quantity'), 10)).get();
        const cartQuantity = quantityArr.reduce((result, current) => (result + current));
        $('body').trigger('cart-quantity-update', cartQuantity);
    });
    $.ajax({
        type: 'GET',
        url: '../api/storefront/carts',
        contentType: 'application/json',
        accept: 'application/json',
        async: false,
        success: (data) => {
            if (data && data.length > 0) {
                $('[data-cart-subtotal]').text(currencyFormat(data[0].baseAmount, window.money));
            }
        },
    });
}
