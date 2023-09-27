import utils from '@bigcommerce/stencil-utils';
import swal from 'sweetalert2';
import currencyFormat from '../common/currencyFormat';

function getCart() {
    return new Promise((res) => {
        $.ajax({
            type: 'GET',
            url: '/api/storefront/carts',
            contentType: 'application/json',
            accept: 'application/json',
            async: false,
            success: (data) => {
                res(data);
            },
            error: (error) => {
                swal({
                    text: error,
                    type: 'error',
                });
            },
        });
    });
}
function addProductToCart(itemArr, attributeStatus, order, isCsv) {
    window.b2b.$overlay.show();
    const item = itemArr[itemArr.length - 1];
    const formData = new FormData();
    const sku = item.sku;
    formData.append('action', 'add');
    formData.append('product_id', item.productId);
    formData.append('qty[]', item.quantity);
    let optionList;
    if (order) {
        optionList = item.optionList ? item.optionList : [];
    } else {
        optionList = item.optionList ? item.optionList[0] : [];
    }

    if (attributeStatus && item.optionList) {
        optionList = item.optionList;
    }
    for (let i = 0; i < optionList.length; i++) {
        if (attributeStatus) {
            formData.append(`${optionList[i].option_id}`, optionList[i].option_value);
        } else {
            formData.append(`attribute[${optionList[i].option_id}]`, optionList[i].option_value);
        }
    }

    // api add product
    utils.api.cart.itemAdd(formData, (err, response) => {
        const errorMessage = err || response.data.error;
        if (errorMessage) {
            const tmp = document.createElement('div');
            tmp.innerHTML = errorMessage;
            window.b2b.$overlay.hide();
            if (!isCsv) {
                return swal({
                    text: tmp.textContent || tmp.innerText,
                    type: 'error',
                });
            }
            $('#csv_err_message').append(`${sku} is out of stock `);
        }

        itemArr.pop();
        if (itemArr.length > 0) {
            addProductToCart(itemArr, attributeStatus, order, isCsv);
        } else {
            const options = {
                template: {
                    content: 'b2b/cart-content-data',
                    totals: 'cart/totals',
                    pageTitle: 'cart/page-title',
                    statusMessages: 'cart/status-messages',
                },
            };
            // updata cart number
            utils.api.cart.getContent(options, (Err, Response) => {
                const divEle = document.createElement('div');
                $(divEle).html(Response.content);
                const $items = $(divEle).find('.item');
                if ($items.length > 0) {
                    let cartQuantity = 0;
                    $.each($items, (index, Item) => {
                        const $cartItem = $(Item);
                        cartQuantity += Number.parseInt($cartItem.attr('data-item-quantity'), 10);
                    });
                    $('body').trigger('cart-quantity-update', cartQuantity);
                }
            });
            if (attributeStatus) {
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

            swal({
                text: 'Product(s) added to shopping cart successfully',
                type: 'success',
            });

            window.b2b.$overlay.hide();
        }
    });
}


const b2bCart = {
    isB2bUser: () => Boolean(sessionStorage.getItem('companyId')),
    getCart: () => {
        getCart();
    },
    addToCart: (itemArr, attributeStatus, order, isCsv) => {
        addProductToCart(itemArr, attributeStatus, order, isCsv);
    },
};

export default b2bCart;
