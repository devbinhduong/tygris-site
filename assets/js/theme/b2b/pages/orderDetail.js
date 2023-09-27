import Url from 'url';
import swal from 'sweetalert2';
import { defaultModal } from '../../global/modal';
import isB2bUser from '../common/checkB2bUser';
import b2bAjax from '../common/ajax';
import orderListsPage from './orderLists';
import urlHelper from '../common/urlHelper';
import currencyFormat from '../common/currencyFormat';
import addProducts from '../common/addProducts';

export default function (context) {
    const storeSettings = context.b2bSettings;
    const storeTimeZone = storeSettings.store_time_zone;
    window.money = context.b2bSettings.money;
    const url = Url.parse(window.location.href, true);
    const orderID = url.query.id || '';
    if (!orderID) {
        window.location.href = '/account.php?action=order_status';
        return;
    }

    const bypassCustomerId = context.customer.id;
    // fix a url bug
    $('head').append(`<style>.navBar-item.is-active{
        cursor: pointer;
    }</style>`);
    $('.navBar-item.is-active').click(() => {
        urlHelper.redirect('/account.php?action=order_status');
    });

    const $overlay = window.b2b.$overlay;

    // for init date picker, new Date()
    const getStoreZoneDate = (date) => {
        // local date
        const localDate = date || new Date();
        const localTime = localDate.getTime();
        // local offset
        const localOffset = localDate.getTimezoneOffset() * 60000;
        // 8*60*60*1000
        // UTC Time
        const utcTime = localTime + localOffset;
        // store setting time zone
        const timeZone = storeTimeZone;
        // store setting time
        const zonetime = utcTime + (3600000 * timeZone);
        // store setting date
        const zoneDate = new Date(zonetime);
        return zoneDate;
    };

    const getFormatDate = (date, split) => {
        let formatDate = '';
        const year = date.getFullYear();
        let month = date.getMonth() + 1;
        month = month > 9 ? month : `0${month}`;
        const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;

        if (split === '/') {
            formatDate = `${month}/${day}/${year}`;
        } else {
            formatDate = `${year}-${month}-${day}`;
        }
        return formatDate;
    };
    const dateStyle = (data) => {
        const _date = new Date(data);
        const _year = _date.getFullYear();
        const _month = new Array(12);
        _month[0] = 'January';
        _month[1] = 'February';
        _month[2] = 'March';
        _month[3] = 'April';
        _month[4] = 'May';
        _month[5] = 'June';
        _month[6] = 'July';
        _month[7] = 'August';
        _month[8] = 'September';
        _month[9] = 'October';
        _month[10] = 'November';
        _month[11] = 'December';
        const currentMonth = _month[_date.getMonth()];
        const _day = _date.getDate();
        return (`${_day}th ${currentMonth} ${_year}`);
    };
    let newListModal;
    const openCreateShoppingListModal = () => {
        newListModal = defaultModal();
        newListModal.open({
            size: 'small',
        });
        newListModal.updateContent(`
                <div class="modal-header">
                    <h2 class="modal-header-title">Create Shopping List</h2>
                    <a href="#" class="modal-close" aria-label="close" role="button">
                        <span aria-hidden="true">&#215;</span>
                    </a>
                </div>
                <div class="modal-body">
                    <form class="form" id="new_shopping_list_form" action="" method="post">
                        <fieldset class="form-fieldset">
                            <div class="form-field">
                                <label class="form-label" for="list_name">Shopping List Name
                                    <small>REQUIRED</small>
                                </label>
                                <input class="form-input" type="text" name="list_name" id="list_name">
                            </div>
                            <div class="form-field">
                                <label class="form-label" for="list_comment">Description</label>
                                <textarea class="form-input" name="list_comment" id="list_comment" cols="30" rows="3"></textarea>
                            </div>

                            <div class="form-actions">
                                <input type="submit" class="button button--primary"
                                    value="Save" id="add_new_shoppingList">

                                <a href="#" class="button  modal-close modal-close--button">Cancel</a>
                            </div>

                        </fieldset>
                    </form>
                </div>
            `);
    };
    const loadData = () => {
        $overlay.show();
        b2bAjax.getOrderDetail(orderID).then(res => {
            if (res.code !== 200) {
                return swal({
                    text: res.message,
                    type: 'error',
                });
            }
            const data = res.data;
            if (data) {
                const order = data;
                const orderId = order.id;
                const orderTotal = order.total_inc_tax;
                const orderStatus = order.status;

                const orderCreatedDate = getStoreZoneDate(new Date(order.date_created));
                const orderCreatedDateFormatted = getFormatDate(orderCreatedDate, '/');

                let isOwn = false;
                if (order.customer_info && order.customer_info.id === bypassCustomerId) {
                    isOwn = true;
                }

                $('#heading_order_id').text(orderId);
                const orderTitle = `<h3 class="account-heading">
                Order Contents</h3><ul class="account-list order-list-container"></ul>`;
                $('.account-content').prepend(`${orderTitle}`);

                const orderItemsHtml = '';
                if (data.products) {
                    data.products.forEach((item) => {
                        const productId = item.product_id;

                        let frage = '';
                        const variantId = item.variant_id;
                        let optionHtml = '';
                        const optionsArr = [];
                        if (item.product_options) {
                            optionHtml += '<dl class="definitionList">';

                            item.product_options.forEach((op) => {
                                optionsArr.push({
                                    option_id: `attribute[${op.product_option_id}]`,
                                    option_value: op.value,
                                });

                                optionHtml += `<dt class="definitionList-key">${op.display_name}</dt>
                                                       <dd class="definitionList-value">${op.display_value}</dd>`;
                            });
                            optionHtml += '</dl>';
                        }
                        let checkIputHtml = '';
                        if (variantId) {
                            checkIputHtml = `<div class="account-product-checkItem"> 
                                        <input class="form-checkbox" type="checkbox" id="account-product-id-${variantId}" value="${variantId}" 
                                        data-variant-id="${variantId}" data-product-id="${productId}" data-qty="${item.quantity}" data-options='${JSON.stringify(optionsArr)}'>
                                        <label for="account-product-id-${variantId}" class="form-label">
                                            <span class="is-srOnly">Checkbox ${variantId} label</span>
                                        </label>
                                    </div>`;
                        } else {
                            checkIputHtml = '<div class="account-product-checkItem"></div>';
                        }

                        let brandHtml = '';
                        if (item.brand) {
                            brandHtml += `<h6>${item.brand}</h6>`;
                        }

                        let giftHtml = '';
                        if (item.gift_wrapping_name) {
                            giftHtml += '<dl class="definitionList">';
                            item.product_options.forEach((op) => {
                                optionHtml += `<dt class="definitionList-key">{{lang 'account.orders.gift_wrapping'}}</dt>
                                                   <dd class="definitionList-value">${op.gift_wrapping_name}</dd>`;
                            });
                            giftHtml += '</dl>';
                        }
                        let eventDateHtml = '';
                        if (item.event_date) {
                            eventDateHtml += `
                                <dl class="definitionList">
                                    <dt class="definitionList-key">${item.event_date.name}</dt>
                                    <dd class="definitionList-value">${item.event_date.date}</dd>
                                </dl>`;
                        }
                        frage += `
                            <li class="account-listItem">
                                <div class="account-product account-product--alignMiddle">
                                    ${checkIputHtml}
                                    <div class="account-product-body">
                                        <span class="account-product-price">${currencyFormat(item.base_price, window.money)}</span>
                                        <h5 class="account-product-title">${item.quantity} &#215; ${item.name}</h5>
                                        
                                        ${brandHtml}
                                        ${optionHtml}
                                        ${giftHtml}
                                        ${eventDateHtml}
                                    </div>
                                </div>
                            </li>`;
                        $('.order-list-container').prepend(`${frage}`);
                    });
                }

                let orderTotalHtml = '<dl class="account-orderTotal">';
                if (order.subtotal_ex_tax) {
                    orderTotalHtml += `<dt class="account-orderTotal-key">Subtotal:</dt>
                        <dd class="account-orderTotal-value">${currencyFormat(order.subtotal_ex_tax, window.money)}`;
                }
                if (order.discount_amount && order.discount_amount > 0) {
                    orderTotalHtml += `<dt class="account-orderTotal-key">Discount:</dt>
                        <dd class="account-orderTotal-value">${currencyFormat(order.discount_amount, window.money)}`;
                }
                if (order.coupons && order.coupons.length > 0) {
                    const coupons = order.coupons;
                    const couponCode = coupons[0].code;
                    const couponAmount = coupons[0].discount;
                    orderTotalHtml += `<dt class="account-orderTotal-key">Coupon Code (${couponCode}):</dt>
                        <dd class="account-orderTotal-value">${currencyFormat(couponAmount, window.money)}`;
                }
                if (order.shipping_cost_inc_tax && order.shipping_cost_inc_tax > 0) {
                    orderTotalHtml += `<dt class="account-orderTotal-key">Shipping:</dt>
                        <dd class="account-orderTotal-value">${currencyFormat(order.shipping_cost_inc_tax, window.money)}`;
                }
                if (order.total_tax && order.total_tax > 0) {
                    orderTotalHtml += `<dt class="account-orderTotal-key">Tax:</dt>
                        <dd class="account-orderTotal-value">${currencyFormat(order.total_tax, window.money)}`;
                }
                if (order.total_inc_tax) {
                    orderTotalHtml += `<dt class="account-orderTotal-key">Grand Total:</dt>
                        <dd class="account-orderTotal-value">${currencyFormat(order.total_inc_tax, window.money)}`;
                }
                orderTotalHtml += '</dl>';
                $('.account-content').append(`${orderItemsHtml}${orderTotalHtml}`);

                let sideBarHtml = `
                            <section class="account-sidebar-block">
                                <h3 class="account-heading">Order Details</h3>
                                <dl class="definitionList">
                                    <dt class="definitionList-key">Order status:</dt>
                                    <dd class="definitionList-value">${orderStatus}</dd>
                                    <dt class="definitionList-key">Order date:</dt>
                                    <dd class="definitionList-value">${orderCreatedDateFormatted}</dd>
                                    <dt class="definitionList-key">Order total:</dt>
                                    <dd class="definitionList-value">${currencyFormat(orderTotal, window.money)}</dd>
                                    <dt class="definitionList-key"> Payment method:</dt>
                                    <dd class="definitionList-value">${(order.payment_method === 'PO') ? 'Purchase Order' : order.payment_method}</dd>
                                </dl>`;
                if (isOwn) {
                    sideBarHtml += `<button data-print-invoice="/account.php?action=print_invoice&order_id=${orderId}" class="button">Print Invoice</button>
                            </section>`;
                }

                sideBarHtml += '</section>';

                let shippingAddress;
                let shippingString = '';
                if (data.shippingAddress) {
                    if (data.shippingAddress instanceof Array) {
                        data.shippingAddress.forEach((addressItem) => {
                            shippingString += `<ul class="account-order-address">
                                <li>${addressItem.first_name} ${addressItem.last_name}</li>
                                <li>${addressItem.company}</li>
                                <li>${addressItem.street_1}</li>
                                <li>${addressItem.street_2}</li>
                                <li>${addressItem.city}, ${addressItem.state} ${addressItem.zip}</li>
                                <li>${addressItem.country}</li>
                            </ul>`;
                        });
                    } else {
                        shippingString = `<ul class="account-order-address">
                            <li>${shippingAddress.first_name} ${shippingAddress.last_name}</li>
                            <li>${shippingAddress.company}</li>
                            <li>${shippingAddress.street_1}</li>
                            <li>${shippingAddress.street_2}</li>
                            <li>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</li>
                            <li>${shippingAddress.country}</li>
                        </ul>`;
                    }
                }
                sideBarHtml += `<section class="account-sidebar-block">
                                <h3 class="account-heading">Ship To</h3>
                                ${shippingString}
                            </section>`;

                if (data.billing_address) {
                    sideBarHtml += `
                            <section class="account-sidebar-block">
                                <h3 class="account-heading">Bill To</h3>
                                <ul class="account-order-address">
                                    <li>${data.billing_address.first_name} ${data.billing_address.last_name}</li>
                                    <li>${data.billing_address.company}</li>
                                    <li>${data.billing_address.street_1}</li>
                                    <li>${data.billing_address.street_2}</li>
                                    <li>${data.billing_address.city}, ${data.billing_address.state} ${data.billing_address.zip}</li>
                                    <li>${data.billing_address.country}</li>
                                </ul>
                            </section>`;
                }

                if (data.shipments && data.shipments.length > 0) {
                    let frage = '';
                    const shipments = data.shipments;
                    shipments.forEach((item) => {
                        frage += `
                        <dl class="definitionList">
                            <dt class="definitionList-key">${item.date_created ? 'Date Shipped:' : ''}</dt>
                            <dd class="definitionList-value">${dateStyle(item.date_created)}</dd>
                            <dt class="definitionList-key">${item.shipping_provider ? 'Shipping Provider:' : ''}</dt>
                            <dd class="definitionList-value">${item.shipping_provider}</dd>
                            <dt class="definitionList-key">${item.shipping_method ? 'Shipping Method:' : ''}</dt>
                            <dd class="definitionList-value">${item.shipping_method}</dd>
                            <dt class="definitionList-key">${item.tracking_number ? 'tracking#:' : ''}</dt>
                            <dd class="definitionList-value">
                                ${item.tracking_number}
                            </dd>
                        </dl>`;
                    });
                    sideBarHtml += `
                        <section class="account-sidebar-block">
                            <h3 class="account-heading">Shipping Details</h3>
                            ${frage}
                        </section>
                        `;
                }

                if (data.customer_message) {
                    let frage = '';
                    const items = data.customer_message.split('                   ');
                    frage += `
                        <p>${items[0] ? items[0] : ''}</p>
                        <p>${items[1] ? items[1] : ''}</p>
                        `;

                    sideBarHtml += `
                        <section class="account-sidebar-block">
                            <h3 class="account-heading">Order Comments</h3>
                            ${frage}
                        </section>
                        `;
                }
                if (data.poNumber) {
                    sideBarHtml += `
                        <section class="account-sidebar-block">
                            <h3 class="account-heading">Purchase Order Number</h3>
                            ${data.poNumber}
                        </section>
                        `;
                }


                sideBarHtml += `<section class="account-sidebar-block">
                            <h3 class="account-heading">Actions</h3>
                            <div class="order-details-info">
                                
                                <button reorder-items type="button" class="button">Reorder</button>
                                <button add-to-shopping-list type="button" class="button">Add to New Shopping List</button>
                                
                            </div>
                        </section>`;


                $('.account-sidebar').html(sideBarHtml);
            }
        });
    };

    if (!isB2bUser()) {
        window.location.href = '/';
    } else {
        loadData();
    }


    // bind events
    $('body').on('click', '[data-print-invoice]', (event) => {
        const $target = $(event.target);
        const left = window.screen.availWidth / 2 - 450;
        const top = window.screen.availHeight / 2 - 320;
        const printUrl = $target.data('printInvoice');

        window.open(printUrl, 'orderInvoice', `width=900,height=650,left=${left},top=${top},scrollbars=1`);
    });

    $('body').on('click', '[reorder-items]', () => {
        const $checkedItems = $('input.form-checkbox:checked');
        if (!$checkedItems.length) {
            return swal({
                type: 'error',
                text: 'Please select one or more items to reorder.',
            });
        }
        window.b2b.$overlay.show();
        const itemArr = [];
        $checkedItems.each((index, item) => {
            const $checkbox = $(item);
            const variantId = $checkbox.attr('data-variant-id');
            const productId = $checkbox.attr('data-product-id');
            const qty = parseInt($checkbox.attr('data-qty'), 10);
            const options = $checkbox.attr('data-options');
            let optionList = [];
            if (options) {
                optionList = JSON.parse(options);
            }

            itemArr.push({
                productId,
                variantId,
                quantity: qty,
                optionList,
            });
        });
        // 2.4 change
        const addProductsData = {
            lineItems: [],
        };
        addProductsData.lineItems = itemArr.map((item) => Object.assign({}, {
            quantity: item.quantity,
            productId: item.productId,
            variantId: item.variantId,
        }));
        addProducts(addProductsData);
    });
    $('body').on('click', '[add-to-shopping-list]', () => {
        const $checkedItems = $('input.form-checkbox:checked');
        if (!$checkedItems.length) {
            return swal({
                type: 'error',
                text: 'Please select one or more items.',
            });
        }
        openCreateShoppingListModal();
    });

    $('body').on('submit', '#new_shopping_list_form', (event) => {
        event.preventDefault();
        $('#add_new_shoppingList').prop('disabled', true);
        const $checkedItems = $('input.form-checkbox:checked');
        $(event.target).prop('disabled', true);
        const gRoleId = sessionStorage.getItem('roleId');
        const name = $('#list_name').val();
        const description = $('#list_comment').val() || ' ';
        let status = '30';
        if (gRoleId === '0' || gRoleId === '1' || gRoleId === '3') {
            status = '0';
        }
        if (!$checkedItems.length) {
            return swal({
                type: 'error',
                text: 'Please select one or more items.',
            });
        }
        const productsArr = [];
        $checkedItems.each((index, item) => {
            const $checkbox = $(item);
            const variantId = parseInt($checkbox.attr('data-variant-id'), 10);
            const productId = $checkbox.attr('data-product-id');
            const qty = $checkbox.attr('data-qty');
            const options = $checkbox.attr('data-options');
            let optionList;
            if (options) {
                optionList = JSON.parse(options);
            }
            productsArr.push({
                productId,
                variantId,
                qty,
                optionList,
            });
        });

        const data = {
            name,
            description,
            status,
        };
        b2bAjax.createShopingList(data).then((res) => {
            $('#add_new_shoppingList').prop('disabled', false);
            if (res.code !== 200) {
                return swal({
                    type: 'error',
                    text: 'Please fill in a Shopping List Name',
                });
            }
            $('#modal .modal-close').trigger('click');
            let id = res.data.shopplistId;
            id = String(id);
            orderListsPage.addToShoppingList(id, productsArr);
        });
    });
}
