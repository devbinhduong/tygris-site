import $ from 'jquery';
import swal from 'sweetalert2';
import b2bCart from './b2bCart';
import b2bAjax from './ajax';
import isB2bUser from './checkB2bUser';
import checkInvalidAdvQty from '../common/checkInvalidAdvQty';

// get advance quantity by multi skus
function validateAdvQty($input, $submitBtn) {
    const $messageContainer = $input.attr('adv-message-tip') === 'true' ? $('#adv_tip') : $input.parent();
    const qty = Number.parseInt($input.val(), 10) || 1;
    const minQty = Number.parseInt($input.attr('data-adv-min-qty'), 10) || 1;
    const incrementQty = Number.parseInt($input.attr('data-adv-increment-qty'), 10) || 1;
    const $cartBtn = $input.siblings('[advqty-card-addtocart]');

    const $minQtyMsg = $messageContainer.find('[data-min-qty-msg]');
    const $incrementQtyMsg = $messageContainer.find('[data-increment-qty-msg]');

    let invalidCount = 0;
    if (qty < minQty) {
        $minQtyMsg.addClass('not-valid-advqty');
        $input.addClass('not-valid-min');
        invalidCount++;
    } else {
        $minQtyMsg.removeClass('not-valid-advqty');
        $input.removeClass('not-valid-min');
    }
    if ((qty % incrementQty) !== 0) {
        $incrementQtyMsg.addClass('not-valid-advqty');
        $input.addClass('not-valid-inc');
        invalidCount++;
    } else {
        $incrementQtyMsg.removeClass('not-valid-advqty');
        $input.removeClass('not-valid-inc');
    }

    if (invalidCount > 0) {
        $cartBtn.prop('disabled', true);
        if ($submitBtn && $submitBtn.length > 0) {
            $submitBtn.prop('disabled', true);
        }
    } else {
        $cartBtn.prop('disabled', false);
        if ($submitBtn && $submitBtn.length > 0) {
            $submitBtn.prop('disabled', false);
        }
    }
    checkInvalidAdvQty('#shopping_list_table');
    checkInvalidAdvQty('[product-search-result-table]');
    return invalidCount;
}

function showMultiValideMessage($inputs, message) {
    let invalidCount = 0;
    $inputs.toArray().forEach(input => {
        const $input = $(input);
        const qty = Number($input.val());
        const minQty = Number.parseInt($input.attr('data-adv-min-qty'), 10) || 1;
        const incrementQty = Number.parseInt($input.attr('data-adv-increment-qty'), 10) || 1;
        // check interval qty
        if (qty < minQty || (qty % incrementQty) !== 0) {
            invalidCount++;
            $input.addClass('invalidAdvQty');
        }
    });

    // alert customer
    if (invalidCount !== 0) {
        swal({
            text: message || 'Please review your cart, one or more items have an invalid quantity.',
            type: 'error',
        });
    }
}
function getMinQty(minOrder, increment) {
    let minQty;
    if (minOrder === 0 || increment === 0) {
        minQty = minOrder || increment;
    } else {
        minQty = minOrder % increment === 0 ? minOrder : (Number.parseInt(minOrder / increment, 10) + 1) * increment;
    }
    return minQty;
}

// handle quantity changes
function handleQuantityChange(event, $inputItem) {
    const $target = event === null ? $inputItem : $(event.currentTarget);
    const $input = $target.parent().find('input');
    let quantityMin = Number.parseInt($input.data('quantityMin'), 10) || 1;
    const quantityMax = Number.parseInt($input.data('quantityMax'), 10) || 0;
    const advQuantityMIn = Number.parseInt($input.attr('data-adv-min-qty'), 10) || 1;
    const advQuantityIncrement = Number.parseInt($input.attr('data-adv-increment-qty'), 10) || 1;
    let qty = Number.parseInt($input.val(), 10) || 1;
    // get min qty by advQuantityMIn and advQuantityIncrement
    quantityMin = getMinQty(advQuantityMIn, advQuantityIncrement);
    // if user clicked a button, increment or decrement the qty
    if ($target.hasClass('button')) {
        qty = $target.data('action') === 'inc' ?
            qty + advQuantityIncrement :
            qty - advQuantityIncrement;
    }

    // check min/max qty
    if (qty < quantityMin) {
        qty = quantityMin;
    } else if (qty > quantityMax && quantityMax !== 0) {
        qty = quantityMax;
    }
    // check interval qty
    if ((qty % advQuantityIncrement) !== 0) {
        qty += (advQuantityIncrement - (qty % advQuantityIncrement)); // correct the quantity for the user
    }
    $input.val(qty); // apply quantity to the input
    validateAdvQty($input);
}

function handleQuantityKeyup(event) {
    const $input = $(event.currentTarget);
    $input.val($input.val().replace(/[^\d]/g, ''));
    validateAdvQty($input);
}
const onQuantityChange = (event) => {
    handleQuantityChange(event);
};

function bindInputEvents($input) {
    $input.on('change', event => onQuantityChange(event));
    $input.on('keyup', event => handleQuantityKeyup(event));
}

function bindButtonEvents($input) {
    const $button = $input.siblings('button[data-action]');
    $button.on('click', event => onQuantityChange(event));
}

function clearAdvQty($input) {
    const $qtyContainer = $input.parent();
    $qtyContainer.find('.advqty_message').remove();
    $qtyContainer.find('input').removeAttr('data-adv-min-qty').removeAttr('data-adv-increment-qty');
}
function hoverShow($input) {
    const $advTip = $('#adv_tip');
    $input.on('mouseenter', (event) => {
        const $target = $(event.currentTarget);
        const $message = $target.siblings('.advqty_message');
        if ($message.length > 0) {
            $advTip.html($message.clone()).fadeIn();
            validateAdvQty($target);
        }
    }).on('mouseleave', () => {
        $advTip.fadeOut();
    }).on('mousemove', (event) => {
        const top = event.pageY + 10;
        const left = event.pageX + 10;
        $advTip.css({
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
        });
    });
}
function getCartId() {
    return new Promise((res) => {
        $.ajax({
            type: 'GET',
            url: '/api/storefront/carts',
            contentType: 'application/json',
            accept: 'application/json',
            success: (data) => {
                if (data && data.length > 0) {
                    res(data[0].id);
                }
            },
            error: () => {
                swal({
                    text: 'error',
                    type: 'error',
                });
            },
        });
    });
}

async function checkIsValidCart(event) {
    try {
        const cartId = await getCartId();
        const passedCheck = await b2bAjax.getCartAdvQtyCheckState(cartId);
        if (passedCheck.data.isAllowed === '1') {
            const $target = $(event.currentTarget);
            window.location.href = $target.attr('href') || '/checkout.php';
        } else {
            return swal({
                text: 'Please review your cart, one or more items have an invalid quantity.',
                type: 'error',
            });
        }
    } catch (err) {
        swal({
            text: 'Unknown Error',
            type: 'error',
        });
    }
}

function clearCardAdvqty($input) {
    const $normalCardAddtoCardBtns = $input.parents('.card').find('[no-advqty-card-addToCart]');
    const $advQtyCardIncrement = $input.parents('.card').find('[advqty-card-actions]');
    $normalCardAddtoCardBtns.show();
    $advQtyCardIncrement.remove();
}

const advQuantity = {
    checkAllAdvQty: ($inputs) => {
        $inputs.each((idx, input) => {
            const $input = $(input);
            validateAdvQty($input);
        });
    },
    globalInit: () => {
        // add to cart
        $('body').on('click', '[advqty-card-actions] [advqty-card-addToCart]', (event) => {
            const $addToCartButton = $(event.target);
            const quantity = $addToCartButton.siblings('[advqty-card-input]').val();
            const productId = $addToCartButton.attr('data-product-id');
            if (isB2bUser()) {
                const itemArr = [{
                    productId,
                    quantity,
                }];
                b2bCart.addToCart(itemArr);
            } else {
                // b2c user
                const addHref = `${$addToCartButton.attr('data-href')}&qty[]=${quantity}`;
                window.location.href = addHref;
            }
        });
        // qty change
        $('body').on('change', '[advqty-card-actions] [advqty-card-input]', (event) => advQuantity.handleQuantityChange(event));
    },
    clearAdvQty: ($input) => {
        clearAdvQty($input);
    },
    getMinQty: (minOrder, increment) => getMinQty(minOrder, increment),
    validateAdvQty: ($input, $submitBtn) => validateAdvQty($input, $submitBtn),
    handleQuantityChange: (event, $inputItem) => {
        handleQuantityChange(event, $inputItem);
    },
    handleQuantityKeyup: (event) => {
        handleQuantityKeyup(event);
    },
    handlePDPQuantityChange(event, $scope) {
        /**
         * handle quantity changes
         */
        const $target = $(event.currentTarget);
        const $input = $('.form-input--incrementTotal', $scope);
        let quantityMin = Number.parseInt($input.data('quantityMin'), 10) || 1;
        const quantityMax = Number.parseInt($input.data('quantityMax'), 10) || 0;
        const advQuantityMIn = Number.parseInt($input.attr('data-adv-min-qty'), 10) || 1;
        const advQuantityIncrement = Number.parseInt($input.attr('data-adv-increment-qty'), 10) || 1;

        const $addToCartBtn = $('#form-action-addToCart', $scope);

        let qty = Number.parseInt($input.val(), 10) || 1;

        // handles very first button click to get quantity in line with the interval

        // set min to interval so user can't go to 0

        quantityMin = getMinQty(advQuantityMIn, advQuantityIncrement);
        // if user clicked a button, increment or decrement the qty
        if ($target.hasClass('button')) {
            qty = $target.data('action') === 'inc' ?
                qty + advQuantityIncrement :
                qty - advQuantityIncrement;
        }

        // check min/max qty
        if (qty < quantityMin) {
            qty = quantityMin;
        } else if (qty > quantityMax && quantityMax !== 0) {
            qty = quantityMax;
        }

        // check interval qty
        if ((qty % advQuantityIncrement) !== 0) {
            qty += (advQuantityIncrement - (qty % advQuantityIncrement)); // correct the quantity for the user
        }

        $input.val(qty); // apply quantity to the input
        validateAdvQty($input, $addToCartBtn);
    },
    csvProductsQtyCheck: (itemArr, _passcheckCb, _notpasscheckCb) => {
        /* itemArr:
         *   [{sku: "SKU074", qty: "1"}
         *   {sku: "SKU077", qty: "2"}
         *   {sku: "SKU-9BB3516E", qty: "4"}
         *   {sku: "SKU-B829C968", qty: "1"}]
         */
        const variantSkus = itemArr.map((item) => item.sku);
        const qtyArr = itemArr.map((item) => item.qty);
        b2bAjax.getAdvQtyState().then(() => b2bAjax.getAdvQtyBySkusNew({ variantSkus }), () => {
            if (_passcheckCb) {
                _passcheckCb();
            }
            return [];
        }).then((res) => {
            let invalideQtyCount = 0;
            variantSkus.forEach((sku, idx) => {
                if (!res.data) {
                    return;
                }
                const match = res.data.productQuantityList.filter(row => row.variantSku === sku);
                if (match.length === 0) return;
                const qtyInfo = match[0];
                const qty = Number.parseInt(qtyArr[idx], 10) || 0;
                const qtyMin = getMinQty(qtyInfo.minOrderQty, qtyInfo.qtyIncrement);

                const qtyIncrement = Number.parseInt(qtyInfo.qtyIncrement, 10) || 1;

                if (qty < qtyMin || (qty % qtyIncrement) !== 0) {
                    invalideQtyCount++;
                }
            });

            if (invalideQtyCount > 0) {
                if (_notpasscheckCb) {
                    _notpasscheckCb();
                }
            } else if (_passcheckCb) {
                _passcheckCb();
            }
        }, () => {
            if (_passcheckCb) {
                _passcheckCb();
            }
        }).catch(error => {
            swal({ text: error, type: 'error' });
        });
    },

    setUpAdvQtyMulti: ($inputs, cOptions, _cb) => {
        if (!isB2bUser()) {
            return;
        }
        /* params:
            bindInputEvents: true,    //input change and keyup
            bindButtonEvents: true,   //button Events
            tips: false,              // true: hover tips(not removed)
            multiCheck: false,        // more input tips show onetime
            multiCheckMsg:            // more input valid message
        */
        const options = $.extend({}, {
            bindInputEvents: true,
            bindButtonEvents: true,
            tips: false,
            resetQty: false,
            multiCheck: false,
            multiCheckMsg: 'Please review your items, one or more items have an invalid quantity.',
        }, cOptions);
        const skus = [];
        const $normalCardAddtoCardBtns = $('[no-advqty-card-addToCart]');
        const $advQtyCardIncrement = $('[advqty-card-actions]');
        $inputs.toArray().forEach((input) => {
            const $input = $(input);
            const sku = $input.attr('data-advqty-sku');
            if (sku !== '' && (typeof sku !== 'undefined')) {
                skus.push(sku);
            }
            clearAdvQty($input);
        });
        if (skus.length === 0) return;

        b2bAjax.getAdvQtyState().then((res) => {
            if (res.code !== 200) {
                $normalCardAddtoCardBtns.show();
                $advQtyCardIncrement.hide();
                return [];
            }
            if (res.data.isEnabled === '1') {
                return b2bAjax.getAdvQtyBySkus({ variantSkus: skus.join('|').toString() });
            }
        }).then((res) => {
            if (!res) {
                return;
            }
            $inputs.toArray().forEach((input) => {
                if (!res.data) {
                    return;
                }
                const $input = $(input);
                const $qtyContainer = $input.parent();
                const sku = $input.attr('data-advqty-sku');
                const match = res.data.productQuantityList.filter(row => row.variantSku === sku);
                if (match.length === 0) {
                    if (options.bindInputEvents) {
                        bindInputEvents($input);
                    }

                    if (options.bindButtonEvents) {
                        bindButtonEvents($input);
                    }

                    clearCardAdvqty($input);

                    return;
                }

                const qtyInfo = match[0];
                $input.attr('data-adv-min-qty', qtyInfo.minOrderQty).attr('data-adv-increment-qty', qtyInfo.qtyIncrement);
                $qtyContainer.append('<div class="advqty_message"></div>');
                if (qtyInfo.minOrderQty && qtyInfo.minOrderQty !== 0) {
                    $qtyContainer.find('.advqty_message').append(`<div data-min-qty-msg >Min Order Qty is ${qtyInfo.minOrderQty}</div>`);
                }
                if (qtyInfo.qtyIncrement && qtyInfo.qtyIncrement !== 0) {
                    $qtyContainer.find('.advqty_message').append(`<div data-increment-qty-msg >Order in Multiples of ${qtyInfo.qtyIncrement}</div>`);
                }
                if (options.bindInputEvents) {
                    bindInputEvents($input);
                }

                if (options.bindButtonEvents) {
                    bindButtonEvents($input);
                }

                if (options.tips) {
                    $input.attr('adv-message-tip', true);
                    hoverShow($input);
                } else {
                    $input.removeAttr('adv-message-tip');
                }

                if (options.resetQty) {
                    const newQty = getMinQty(qtyInfo.minOrderQty, qtyInfo.qtyIncrement);
                    $input.val(newQty || 1);
                }

                // $input.change();
                validateAdvQty($input);
                // show documents
                $normalCardAddtoCardBtns.hide();
                $advQtyCardIncrement.show();

                if (_cb) {
                    _cb();
                }
            });
            if (options.multiCheck) {
                showMultiValideMessage($inputs, options.multiCheckMsg);
            }
        });
    },
    checkCartAdvQty: (event) => {
        if (!isB2bUser()) {
            return;
        }
        event.preventDefault();
        window.b2b.$overlay.show();
        checkIsValidCart(event);
    },
};

export default advQuantity;
