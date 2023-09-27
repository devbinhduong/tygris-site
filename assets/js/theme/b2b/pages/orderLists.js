import isB2bUser from '../common/checkB2bUser';
import swal from 'sweetalert2';
import b2bAjax from '../common/ajax';
import '../tools/jquery-ui.min';
import '../tools/jqPaginator';
// import b2bCart from '../common/b2bCart';
import { defaultModal } from '../../global/modal';
import currencyFormat from '../common/currencyFormat';
import addProducts from '../common/addProducts';

export default {
    get accountContent() {
        return `
        <h3 class="account-heading">Orders</h3>
        <div class="filter-by-date">From:
            <input type="text" id="orderFromDate" readOnly /> To:
            <input type="text" id="orderToDate" readOnly />
            <a style="display:none;" class="button button--primary button--small" href="javascript:void(0);" data-search-date>Search</a></div>
    `;
    },
    get tableToolBar() {
        return `
        <div class="table-toolbar top">
            <div class="action-links" data-value="0">
                <a class="action-link button button--small" href="javascript:void(0);" filter-user data-user-value="0" style="display:none;">Show All Company Orders</a>
                <a class="action-link button button--small" href="javascript:void(0);" filter-user data-user-value="1">Show My Orders</a>
            </div>
        </div>
        <h3 class="account-heading">Orders</h3>
        <div class="filter-by-date">From:
            <input type="text" id="orderFromDate" readOnly /> To:
            <input type="text" id="orderToDate" readOnly />
            <a style="display:none;" class="button button--primary button--small" href="javascript:void(0);" data-search-date>Search</a></div>
    `;
    },
    get selerRepHasCompnay() {
        return `
        <div class="table-toolbar top">
            <div class="action-links">
                <a class="action-link button button--small" href="javascript:void(0);" filter-user data-user-value="0" style="display:none;">Show All Company Orders</a>
                <a class="action-link button button--small" href="javascript:void(0);" filter-user data-user-value="1">Show My Orders</a>
            </div>
        </div>
        <h3 class="account-heading">Orders</h3>
        <div class="filter-by-date">From:
            <input type="text" id="orderFromDate" readOnly /> To:
            <input type="text" id="orderToDate" readOnly />
            <a style="display:none;" class="button button--primary button--small" href="javascript:void(0);" data-search-date>Search</a></div>
    `;
    },
    get selerRepNoCompnay() {
        return `
        <h3 class="account-heading">Orders</h3>
        <div class="filter-by-date">From:
            <input type="text" id="orderFromDate" readOnly /> To:
            <input type="text" id="orderToDate" readOnly />
            <a style="display:none;" class="button button--primary button--small" href="javascript:void(0);" data-search-date>Search</a></div>
    `;
    },
    init(context) {
        const storeSettings = context.b2bSettings;
        const storeTimeZone = storeSettings.store_time_zone;
        window.b2b.storeTimeZone = storeTimeZone;
        window.b2b.offset = 0;
        window.b2b.limit = 10;
        window.money = context.b2bSettings.money;
        if (!isB2bUser()) {
            return;
        }
        this.initPage();
        this.initDatePicker();
        this.initBtn();
    },
    getOrderList(sortBy, orderBy) {
        const isShowMy = $('.action-links').attr('data-value');
        const beginDateAt = $('#orderFromDate').val();
        const endDateAt = $('#orderToDate').val();
        const data = {
            beginDateAt,
            endDateAt,
            limit: window.b2b.limit,
            offset: window.b2b.offset,
            orderBy,
            sortBy,
            isShowMy,
        };
        return new Promise(resolve => {
            b2bAjax.getOrderList(data).then(res => {
                resolve(res);
            });
        });
    },
    initDatePicker() {
        const that = this;
        // this function is limit search one year;
        // const getDateDay = (dtMax) => {
        //     const dd = dtMax.getDate();
        //     const mm = dtMax.getMonth() + 1;
        //     const y = dtMax.getFullYear();
        //     return `${mm}/${dd}/${y}`;
        // };

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
            const timeZone = window.b2b.storeTimeZone;
            // store setting time
            const zonetime = utcTime + (3600000 * timeZone);
            // store setting date
            const zoneDate = new Date(zonetime);
            return zoneDate;
        };

        const defaultStartDate = getStoreZoneDate();
        const defaultEndDate = getStoreZoneDate();
        const startMinDate = getStoreZoneDate();
        defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
        startMinDate.setMonth(startMinDate.getMonth() - 12);

        const start = $('#orderFromDate');
        const end = $('#orderToDate');
        start.datepicker({
            maxDate: defaultEndDate,
            onSelect(selected) {
                const dtMax = new Date(selected);
                const dtMin = new Date(selected);
                dtMin.setDate(dtMin.getDate());
                dtMax.setMonth(dtMax.getMonth() + 12);
                // this function is limit search one year;
                // const now = getStoreZoneDate();
                // const nowDate = getDateDay(now);
                // const dateN = new Date(nowDate);

                // let maxDate = dtMax;
                // let minDate = dtMin;

                // if (dtMax.getTime() >= dateN.getTime()) {
                //     maxDate = dateN;
                // }
                // if (dtMin.getTime() >= dateN.getTime()) {
                //     minDate = dateN;
                // }

                // end.datepicker('option', 'maxDate', maxDate);
                // end.datepicker('option', 'minDate', minDate);

                if (end.val() && start.val()) {
                    $('th.asc').removeClass('asc');
                    that.renderTable(true);
                }
            },
        });
        start.datepicker('setDate', defaultStartDate);

        end.datepicker({
            maxDate: defaultEndDate,
            // minDate: defaultStartDate,
            onSelect(selected) {
                const dtMax = new Date(selected);
                const dtMin = new Date(selected);
                dtMin.setMonth(dtMax.getMonth() - 12);
                dtMax.setMonth(dtMax.getMonth());

                if (end.val() && start.val()) {
                    $('th.asc').removeClass('asc');
                    that.renderTable(true);
                }
            },
        });
        end.datepicker('setDate', defaultEndDate);

        window.b2b.startTime = $('#orderFromDate').val();
        window.b2b.endTime = $('#orderToDate').val();
        that.renderTable(true);
    },
    // for init date picker, new Date()
    getStoreZoneDate(date) {
        // local date
        const localDate = date || new Date();
        const localTime = localDate.getTime();
        // local offset
        const localOffset = localDate.getTimezoneOffset() * 60000;
        // 8*60*60*1000
        // UTC Time
        const utcTime = localTime + localOffset;
        // store setting time zone
        const timeZone = window.b2b.storeTimeZone;
        // store setting time
        const zonetime = utcTime + (3600000 * timeZone);
        // store setting date
        const zoneDate = new Date(zonetime);
        return zoneDate;
    },
    initPage() {
        const roleId = sessionStorage.getItem('roleId');
        $('.account').addClass('b2b-wrap order-lists-wrap').removeClass('account--fixed');
        switch (roleId) {
        // admin
        case '0':
            this.initAdminSenior();
            this.initConment();
            this.hidebtn();
            break;
        // senior
        case '1':
            this.initAdminSenior();
            this.initConment();
            this.hidebtn();
            break;
        // junior
        case '2':
            this.initJunior();
            this.hidebtn();
            break;
        // saler rep
        case '3':
            this.initSelerRep();
            this.hidebtn();
            break;
        default:
            break;
        }
    },
    initSelerRep() {
        const companyStatus = sessionStorage.getItem('companyStatus');
        if (companyStatus === '1') {
            $('.account-content').empty().show().append(this.selerRepHasCompnay);
            $('.account-content').append(`<div class="table-wrap">
            <table class="order-lists-table">
                <thead>
                    <tr>
                        <th></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="bcOrderId">Order Number<span class="filter-icon" data-sort-th data-sort-filter="bcOrderId"></span></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="totalIncTax">Product Total<span class="filter-icon" data-sort-th data-sort-filter="totalIncTax"></span></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="createdAt">Order Placed<span class="filter-icon" data-sort-th data-sort-filter="createdAt"></span></th>
                        <th class="t-align-c">Last Updated</th>
                        <th class="t-align-c">Created By</th>
                        <th class="t-align-c">Status</th>
                        <th class="t-align-c">Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            </div>`);
        } else {
            $('.account-content').empty().show().append(this.selerRepNoCompnay);
            $('.account-content').append(`<div class="table-wrap">
            <table class="order-lists-table">
                <thead>
                    <tr>
                        <th></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="bcOrderId">Order Number<span class="filter-icon" data-sort-th data-sort-filter="bcOrderId"></span></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="totalIncTax">Product Total<span class="filter-icon" data-sort-th data-sort-filter="totalIncTax"></span></th>
                        <th class="t-align-c" data-sort-th data-sort-filter="createdAt">Order Placed<span class="filter-icon" data-sort-th data-sort-filter="createdAt"></span></th>
                        <th class="t-align-c">Last Updated</th>
                        <th class="t-align-c">Company Name</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            </div>`);
        }
        $('.table-wrap').after(`<div class="pagination">
        <ul class="pagination-list" id="jqPagination"></ul>
        </div>`);
    },
    initAdminSenior() {
        $('.account-content').empty().show().append(this.tableToolBar);
    },
    initConment() {
        $('.account-content').append(`<div class="table-wrap">
                <table class="order-lists-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th class="t-align-c" data-sort-th data-sort-filter="bcOrderId">Order Number<span class="filter-icon" data-sort-th data-sort-filter="bcOrderId"></span></th>
                            <th class="t-align-c" data-sort-th data-sort-filter="totalIncTax">Product Total<span class="filter-icon" data-sort-th data-sort-filter="totalIncTax"></span></th>
                            <th class="t-align-c" data-sort-th data-sort-filter="createdAt">Order Placed<span class="filter-icon" data-sort-th data-sort-filter="createdAt"></span></th>
                            <th class="t-align-c">Last Updated</th>
                            <th class="t-align-c">Created By</th>
                            <th class="t-align-c">Status</th>
                            <th class="t-align-c">Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
                </div>`);
        $('.table-wrap').after(`<div class="pagination">
        <ul class="pagination-list" id="jqPagination"></ul>
        </div>`);
    },
    hidebtn() {
        const roleId = sessionStorage.getItem('roleId');
        const companyStatus = sessionStorage.getItem('companyStatus');
        if (roleId === '2' || (roleId === '3' && companyStatus !== '1')) {
            $('[reorder-items]').attr('disabled');
            $('[add-shopping-items]').attr('disabled');
        }
    },
    initJunior() {
        $('.account-content').empty().show().append(this.selerRepNoCompnay);
        $('.account-content').append(`<div class="table-wrap">
        <table class="order-lists-table">
            <thead>
                <tr>
                    <th></th>
                    <th class="t-align-c" data-sort-th data-sort-filter="bcOrderId">Order Number<span class="filter-icon" data-sort-th data-sort-filter="bcOrderId"></span></th>
                    <th class="t-align-c" data-sort-th data-sort-filter="totalIncTax">Product Total<span class="filter-icon" data-sort-th data-sort-filter="totalIncTax"></span></th>
                    <th class="t-align-c" data-sort-th data-sort-filter="createdAt">Order Placed<span class="filter-icon" data-sort-th data-sort-filter="createdAt"></span></th>
                    <th class="t-align-c">Last Updated</th>
                    <th class="t-align-c">Company Name</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        </div>`);
        $('.table-wrap').after(`<div class="pagination">
        <ul class="pagination-list" id="jqPagination"></ul>
        </div>`);
    },
    initJqPagenation(data) {
        if (!data) {
            return;
        }
        let pageNumber = 1;
        const pageLimit = 10;
        const that = this;
        let total = Math.ceil(data.totalCount / pageLimit);
        if (data.totalCount === 0) {
            total = 1;
            window.b2b.offset = 0;
        }
        $('#jqPagination').jqPaginator({
            totalPages: total,
            visiblePages: 10,
            currentPage: pageNumber,
            onPageChange(num) {
                if (pageNumber === num) return;
                window.b2b.$overlay.show();
                pageNumber = num;
                window.b2b.offset = (num - 1) * window.b2b.limit;
                that.renderTable();
            },
        });
    },
    renderTable(init, sortBy, orderBy) {
        window.b2b.$overlay.show();
        if (init) {
            window.b2b.offset = 0;
        }
        this.getOrderList(sortBy, orderBy).then(res => {
            const gRoleId = sessionStorage.getItem('roleId');
            const companyStatus = sessionStorage.getItem('companyStatus');
            const $orderListsTbody = $('.order-lists-table tbody');
            const lists = res.data.list;
            const idList = [];
            let frage = '';
            $.each(lists, (index, item) => {
                const id = String(item.orderId);
                idList.push(id);
                const createTime = new Date(parseInt(item.createdAt, 10) * 1000).toLocaleDateString().replace(/\//g, '/');
                const updateTime = new Date(parseInt(item.updatedAt, 10) * 1000).toLocaleDateString().replace(/\//g, '/');
                if (gRoleId === '3' && companyStatus !== '1' || gRoleId === '2') {
                    frage += `
                        <tr data-order-id="${item.orderId}" data-order-status="${item.orderStatus}">
                        <td class="col-thumbnail"><img src="" alt=""></td>
                        <td class="t-align-c"><a href="/orderdetail/?id=${item.orderId}">#${item.orderId}</a></td>
                        <td class="t-align-c">${currencyFormat(item.totalIncTax, window.money)}</td>
                        <td class="t-align-c">${createTime}</td>
                        <td class="t-align-c">${updateTime}</td>
                        <td class="t-align-c">${item.companyName}</td>
                        <a href="javascript:void(0);" class="reorder-button button button--primary button--small" reorder-items>Reorder</a>
                        <a href="javascript:void(0);" class="shoppinglist-button button button--small" add-shopping-items>Add to New Shopping List</a>
                        `;
                } else {
                    frage += `
                    <tr data-order-id="${item.orderId}" data-order-status="${item.orderStatus}">
                    <td class="col-thumbnail"><img src="" alt=""></td>
                    <td class="t-align-c"><a href="/orderdetail/?id=${item.orderId}">#${item.orderId}</a></td>
                    <td class="t-align-c">${currencyFormat(item.totalIncTax, window.money)}</td>
                    <td class="t-align-c">${createTime}</td>
                    <td class="t-align-c">${updateTime}</td>
                    <td class="t-align-c">${item.firstName}  ${item.lastName}</td>
                    <td class=" t-align-c"><span class="account-orderStatus-label order-status-text">${item.orderStatus}</span></td>
                    <td class="actions-field">
                    <a href="javascript:void(0);" class="reorder-button button button--primary button--small" reorder-items  ${gRoleId === 2 ? 'disabled' : ''}>Reorder</a>
                    <a href="javascript:void(0);" class="shoppinglist-button button button--small" add-shopping-items>Add to New Shopping List</a>
                        `;
                }
            });
            $orderListsTbody.html(frage);
            if (init) {
                this.initJqPagenation(res.data.paginator);
            }
            this.renderImage(idList);
            window.b2b.$overlay.hide();
        });
    },
    initBtn() {
        $('body').on('click', 'th[data-sort-th]', (event) => {
            event.stopPropagation();
            const $target = $(event.currentTarget);
            const hasClass = $target.hasClass('asc');
            window.b2b.$overlay.show();
            let sortBy;
            let orderBy;
            if (hasClass) {
                $target.removeClass('asc');
                sortBy = 'DESC';
                orderBy = $target.attr('data-sort-filter');
            } else {
                $('.asc').removeClass('asc');
                $target.addClass('asc');
                sortBy = 'ASC';
                orderBy = $target.attr('data-sort-filter');
            }
            this.renderTable(false, sortBy, orderBy);
        });
        $('body').on('click', '[filter-user]', (event) => {
            const $item = $(event.target);
            const value = $item.attr('data-user-value');
            $item.parent().attr('data-value', value);
            $item.siblings().show();
            $item.hide();
            this.renderTable(true);
        });
        $('body').on('click', '[reorder-items]', (event) => {
            event.preventDefault();
            window.b2b.$overlay.show();
            const cartId = $(event.target).parents('[data-order-id]').attr('data-order-id');
            this.getOrderData(cartId).then(res => {
                if (res.code !== 200) {
                    return swal({
                        text: res.message,
                        type: 'error',
                    });
                }
                const addProductsData = {
                    lineItems: [],
                };
                addProductsData.lineItems = res.data.map((item) => Object.assign({}, {
                    quantity: item.quantity,
                    productId: item.productId,
                    variantId: item.variantId,
                }));
                addProducts(addProductsData);
                // b2bCart.addToCart(res.data, false, true);
            });
        });
        $('body').on('click', '[add-shopping-items]', (event) => {
            window.b2b.$overlay.show();
            event.preventDefault();
            const cartId = $(event.target).parents('[data-order-id]').attr('data-order-id');
            this.getOrderData(cartId).then(res => {
                if (res.code !== 200) {
                    return swal({
                        text: res.message,
                        type: 'error',
                    });
                }
                if (res.data.length === 0) {
                    return swal({
                        text: 'Error',
                        type: 'error',
                    });
                }
                window.b2b.$overlay.hide();
                this.openCreateShoppingListModal(res.data);
            });
        });
        $('body').on('click', '#add_new_shoppingList', (event) => {
            event.preventDefault();
            $(event.target).prop('disabled', true);
            const gRoleId = sessionStorage.getItem('roleId');
            const $form = $(event.target).parents('form');
            const name = $('#list_name', $form).val();
            const description = $('#list_comment', $form).val() || ' ';
            let status = '30';
            let products = $form.attr('data-product');
            if (gRoleId === '0' || gRoleId === '1' || gRoleId === '3') {
                status = '0';
            }

            const data = {
                name,
                description,
                status,
            };

            b2bAjax.createShopingList(data).then((res) => {
                $('#add_new_shoppingList').prop('disabled', false);
                if (res.code !== 200) {
                    return swal({
                        text: 'Please fill in a Shopping List Name',
                        type: 'error',
                    });
                }
                const id = res.data.shopplistId;
                products = this.addAttribute(JSON.parse(products));
                this.addToShoppingList(id, products);
            });
        });
    },
    addAttribute(products) {
        const newData = [];
        $.each(products, (index, item) => {
            const optionList = item.optionList;
            const newOptionList = [];
            $.each(optionList, (i, option) => {
                newOptionList.push({
                    option_value: option.option_value,
                    option_id: `attribute[${option.option_id}]`,
                });
            });
            newData.push({
                productId: item.productId,
                qty: item.quantity,
                optionList: newOptionList,
                variantId: item.variantId,
            });
        });
        return newData;
    },
    addToShoppingList(id, items) {
        b2bAjax.addProductToShoppingList({ id, items }).then(res => {
            if (res.code === 200) {
                swal({
                    text: 'Product(s) added to the shopping list successfully.',
                    type: 'success',
                });
                $('#modal .modal-close').trigger('click');
            } else {
                if (res.data.name) {
                    return swal({
                        type: 'error',
                        text: 'Name can not be empty',
                    });
                }
                swal({
                    text: 'There is an unknown error. Please try again later.',
                    type: 'error',
                });
            }
            $('#add_new_shoppingList').prop('disabled', false);
        });
    },
    openCreateShoppingListModal(data) {
        const newListModal = defaultModal();
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
                <form class="form" id="new_shopping_list_form" action="" method="post" data-product=${JSON.stringify(data)}>
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
    },
    getOrderData(cartId) {
        return new Promise(resolve => {
            b2bAjax.getOrderProducts(cartId).then(res => {
                resolve(res);
            });
        });
    },
    renderImage(data) {
        b2bAjax.getOrderListImage({ orderIds: data }).then(res => {
            const orderLists = res.data;
            const items = $('tr[data-order-id]');
            $.each(items, (index, item) => {
                const TrId = $(item).attr('data-order-id');
                $.each(orderLists, (i, product) => {
                    const img = product.imageUrl;
                    if (TrId === product.orderId) {
                        $(item).find('.col-thumbnail img').attr('src', img);
                    }
                });
            });
        });
    },
};
