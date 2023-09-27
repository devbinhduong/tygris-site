import QuoteTotal from './QuoteTotal';
import b2bAjax from '../../common/ajax';
import dashboard from '../dashboard';
import '../../tools/jquery-ui.min';
import getNowDate from '../../common/getDate';
// import _ from 'lodash';
import utils from '@bigcommerce/stencil-utils';
import initUtileOptionChange from '../../common/initUtileOptionChange';
import shopping from '../shoppingList';
import sessionStorageInfo from '../../common/sessionStorageInfo';
import { urlHelper, currencyFormat } from '../../common';
import hideSelerBox from '../../common/quote/hideSalerepInfobox';

export default class CreateQuote {
    constructor(context) {
        this.context = context;
        this.$b2bWrap = $('#b2b_wrap');
        this.$productListTable = $('#product_list_table');
        this.$companySelect = $('#company_select');
        this.$quoteData = $('#quote_date');
        this.$searchResulte = $('#search_resulte');
        this.$searchBtn = $('#search_single_sku');
        this.$quoteSearchInput = $('#quote_search_input');
        this.resultTable = $('#product_search_result_table');
        this.previewBtn = $('#create_new_quote_button');
        this.data = JSON.parse(sessionStorage.getItem('quotePreviewData')) || {
            productList: [],
        };

        this.$b2bWrap.on('click', this.eventHandler.bind(this, 'click'));
        this.$b2bWrap.on('input', this.eventHandler.bind(this, 'input'));
        this.$b2bWrap.on('change', this.eventHandler.bind(this, 'change'));
    }
    static init(context) {
        const createQuoteInstance = new this(context);
        createQuoteInstance.initPage(context);
    }
    initPage(context) {
        this.limit = 5;
        this.offset = 0;
        this.pagination = {
            limit: 5,
            offset: 0,
            totalCount: 1,
        };
        hideSelerBox();
        this.initCompany();
        this.initDataPicker(context);
        this.bindEvents();
        this.initSessionData();
        initUtileOptionChange(context);
        this.quoteTotal = new QuoteTotal('#quote_total', this.quoteTotalData);
        this.quoteTotal.render();
        // option change
    }
    initDataPicker(context) {
        const storeTimeZone = context.b2bSettings.store_time_zone;
        const defaultStartDate = getNowDate(storeTimeZone);

        this.$quoteData.datepicker({
            minDate: defaultStartDate,
            onSelect() {
            },
        });
    }
    initSessionData() {
        const hasPreivewData = sessionStorage.getItem('quotePreviewData');

        if (hasPreivewData) {
            this.data = JSON.parse(hasPreivewData);

            $('#reference_number').val(this.data.referenceNumber);
            $('#quote_title').val(this.data.quoteTitle);
            $('#quote_description').val(this.data.quoteDescription);
            $('#quote_date').val(this.data.expiredAt);
            $('#additional_infor').val(this.data.additionalInfo);

            this.data.productList.forEach(product => this.appendProductRowToTbody(`${product.productId}-${product.variantId}`));
        }
    }
    bindEvents() {
        this.$companySelect.on('change', () => {
            const value = this.$companySelect.val().trim();
            const userId = sessionStorage.getItem('userId');
            const masqueradeCompanyId = value;

            this.resetCompanyQuote();
            if (!masqueradeCompanyId) return;

            window.b2b.$overlay.show();
            dashboard.beginMasqueradeCompany(masqueradeCompanyId, userId)
                .then((response) => {
                    if (!response) {
                        return window.b2b.Alert.error('Company dashboard binding was unsuccessful. Please try again later.');
                    }
                    dashboard.initCompanyInfo(true, this.context.customer.id, this.initAdress.bind(this));
                    sessionStorage.setItem('quoteCompany', 'true');
                    this.resetProductList();
                })
                .catch(error => window.b2b.Alert.error(error))
                .finally(() => window.b2b.$overlay.hide());
        });

        this.$searchBtn.click(() => {
            this.search();
        });

        $('body').on('click', '#create_new_quote_button', (e) => {
            $('input').blur();
            e.stopPropagation();
            window.b2b.$overlay.show();

            const canPreview = this.validPreview();
            if (!canPreview) {
                return window.b2b.$overlay.hide();
            }

            this.data.referenceNumber = $('#reference_number').val();
            this.data.quoteTitle = $('#quote_title').val();
            this.data.quoteDescription = $('#quote_description').val();
            this.data.expiredAt = $('#quote_date').val();
            this.data.additionalInfo = $('#additional_infor').val();
            this.data.addressInfo = {
                companyAddress: $('#default_company_address').text(),
                companyCity: $('#default_company_city').text(),
                companyCountry: $('#default_company_country').text(),
                companyName: $('#default_company_name').text(),
                label: $('#label').text(),
                companyZipCode: $('#default_company_zipcode').text(),
                companyState: $('#default_company_state').text(),
                firstName: $('#quote_adreess_first').text(),
                lastName: $('#quote_adreess_last').text(),
                phoneNumber: $('#quote_phone').text(),
            };

            sessionStorage.setItem('quotePreviewData', JSON.stringify(this.data));
            window.b2b.$overlay.hide();

            urlHelper.redirect('/quote-detail');
        });

        $('body').on('click', '#save_draft', () => {
            window.b2b.$overlay.show();
            // check
            const canPreview = this.validPreview();
            if (!canPreview) {
                return window.b2b.$overlay.hide();
            }

            const data = Object.assign({}, {
                status: '5',
                companyId: sessionStorage.getItem('companyId'),
                referenceNumber: $('#reference_number').val(),
                title: $('#quote_title').val(),
                description: $('#quote_description').val(),
                expiredAt: $('#quote_date').val(),
                money: this.context.b2bSettings.money,
                productList: this.data.productList,
                additionalInfo: $('#additional_infor').val(),
                addressInfo: {
                    companyAddress: $('#default_company_address').text(),
                    companyCity: $('#default_company_city').text(),
                    companyCountry: $('#default_company_country').text(),
                    companyName: $('#default_company_name').text(),
                    label: $('#label').text(),
                    companyZipCode: $('#default_company_zipcode').text(),
                    companyState: $('#default_company_state').text(),
                    firstName: $('#quote_adreess_first').text(),
                    lastName: $('#quote_adreess_last').text(),
                    phoneNumber: $('#quote_phone').text(),
                },
            }, this.quoteTotalData.quoteData);


            b2bAjax.createQuote(data)
                .then(res => {
                    if (res.code !== 200) {
                        return window.b2b.Alert.error(res.message);
                    }
                    urlHelper.redirect('/quote-list');
                })
                .catch(error => window.b2b.Alert.error(error))
                .finally(() => window.b2b.$overlay.hide());
        });

        $('body').on('focus', '.b2b-erro .form-input', (e) => {
            e.stopPropagation();
            $(e.target).parents('.b2b-erro').toggleClass('b2b-erro', false);
        });

        // 2.3 add adress
        $('body').on('click', '[data-select-address]', (e) => {
            this.selectAdress(e);
        });
        // search address
        $('body').on('keyup', '#address_search_input', (e) => {
            if (e.keyCode === 13) {
                const query = $(e.target).val();
                this.searchAddress(query);
            }
        });
        $('body').on('click', '#address_search_btn', () => {
            const query = $('#address_search_input').val();
            this.searchAddress(query);
        });
    }
    // 2.3 add adress
    searchAddress(query, pagination) {
        const companyId = sessionStorage.getItem('companyId');
        if (!pagination) {
            this.pagination.offset = 0;
        }
        const data = {
            limit: this.pagination.limit,
            offset: this.pagination.offset,
            q: query,
        };
        b2bAjax.getQuoteAdress(companyId, data)
            .then((res) => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);

                const list = res.data.list;
                const addresses = this.renderSelectAddress(list);
                $('#modal-quote-address-form .modal-body').html(addresses);
                if (pagination) {
                    return;
                }
                this.initPagination(res.data.pagination);
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    selectAdress(e) {
        const $target = $(e.currentTarget);
        const companyCity = $target.attr('data-company-city');
        const companyCountry = $target.attr('data-company-country');
        const companyAddress = $target.attr('data-company-address');
        const companyName = $target.attr('data-company-name');
        const label = $target.attr('data-label');
        const companyState = $target.attr('data-company-state');
        const companyZipCode = $target.attr('data-company-zipcode');
        const firstName = $target.attr('data-first-name');
        const lastName = $target.attr('data-last-name');
        const phoneNumber = $target.attr('data-phone');

        $('#default_company_address').html(companyAddress);
        $('#default_company_city').html(companyCity);
        $('#default_company_country').html(companyCountry);
        $('#default_company_name').html(companyName);
        $('#label').html(label);
        $('#default_company_state').html(companyState);
        $('#default_company_zipcode').html(companyZipCode);

        $('#quote_adreess_first').html(firstName);
        $('#quote_adreess_last').html(lastName);
        $('#quote_phone').html(phoneNumber);
        $('#modal-quote-address-form .modal-close').click();
    }
    initAdress(pagination) {
        const companyId = sessionStorage.getItem('companyId');
        if (!companyId) return;

        const data = {
            limit: this.pagination.limit,
            offset: this.pagination.offset,
        };

        b2bAjax.getQuoteAdress(companyId, data)
            .then((res) => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);
                this.renderAddress(res.data);
                if (!pagination) {
                    this.initPagination(res.data.pagination);
                }
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    initPagination(data) {
        const totle = Math.ceil(data.totalCount / this.pagination.limit);
        this.pagination.totalCount = data.totalCount;
        let pageNumber = 1;

        if (totle === 0) {
            return;
        }
        $('#jqPagination').jqPaginator({
            totalPages: Math.ceil(this.pagination.totalCount / this.pagination.limit),
            currentPage: pageNumber,
            onPageChange: (num) => {
                if (pageNumber === num) return;
                pageNumber = num;
                this.pagination.offset = (num - 1) * this.pagination.limit;
                const query = $('#address_search_input').val();
                this.searchAddress(query, true);
            },
        });
    }
    renderAddress(data) {
        const hasPreivewData = sessionStorage.getItem('quotePreviewData');
        const { addressBookStatus, list } = data;
        let defaultAddress;

        if (hasPreivewData) {
            const preivewData = JSON.parse(hasPreivewData);
            defaultAddress = preivewData.addressInfo;
        } else {
            defaultAddress = data.defaultAddress;
        }
        const defaultAddressLabel = defaultAddress.label ? defaultAddress.label : '';
        const selectStatus = list.length > 0 && addressBookStatus === '1';
        const defaultAddressFrage = `
        <span class="form-label">Company Address</span>
        <div class="quote_adress_container 
        ${selectStatus ? 'quote_select_address' : 'address_book_none'}" 
        ${selectStatus ? "data-reveal-id='modal-quote-address-form'" : ''}>
            <div id="label">${defaultAddressLabel}</div>
            <div>
                <span id="quote_adreess_first">${defaultAddress.firstName}</span>
                <span id="quote_adreess_last">${defaultAddress.lastName}</span>
             </div>
             <div>
                <span id="default_company_name">${defaultAddress.companyName} </span>
                <span id="quote_phone">${defaultAddress.phoneNumber}</span>
             </div>
            <div id="default_company_address">${defaultAddress.companyAddress}</div>
            <div>
                <span id="default_company_city">${defaultAddress.companyCity}</span>
                <span id="default_company_state">${defaultAddress.companyState}</span>
                <span id="default_company_zipcode">${defaultAddress.companyZipCode}</span>
            </div>
            <div>
                <span id="default_company_country">${defaultAddress.companyCountry}</span>
            </div>
        </div>
        `;

        if (list.length > 0) {
            const addresses = this.renderSelectAddress(list);
            $('#modal-quote-address-form .modal-body').html(addresses);
        }

        $('#quote_address').html(defaultAddressFrage);
    }

    renderSelectAddress(data) {
        const lists = data.map((list) => `
        <a href="javascript:void(0)" class="address_item" 
        data-company-name="${list.companyName}"
        data-label="${list.label}"
        data-company-address="${list.companyAddress}"
        data-company-city="${list.companyCity}"
        data-company-country="${list.companyCountry}"
        data-company-name="${list.companyName}"
        data-company-state="${list.companyState}"
        data-company-zipcode="${list.companyZipCode}"
        data-first-name="${list.firstName}"
        data-last-name="${list.lastName}"
        data-phone="${list.phoneNumber}"
        data-select-address
        >
        <div>
        ${list.label}
        </div>
            <div>
                <span class="${list.firstName ? '' : 'b2b-hide'}">${list.firstName}</span>
                <span class="${list.lastName ? '' : 'b2b-hide'}">${list.lastName}</span>
            </div>
            <div>
            ${list.companyName} ${list.phoneNumber}
            </div>
            <div>
            ${list.companyAddress}
            </div>
            <div>
                <span>${list.companyCity}</span>
                <span>${list.companyState}</span>
                <span>${list.companyZipCode}</span>
            </div>
            <div>${list.companyCountry}</div>
        </a>
        `).join('');
        return lists;
    }
    resetProductList() {
        $('#subtotal').html('0.00');
        $('#discount').html('0.00');
        $('#grand_total').html('0.00');

        this.data.productList = [];
        this.$productListTable.find('tbody').html('');
        this.$searchResulte.html('');
        sessionStorage.removeItem('quotePreviewData');
    }
    validPreview() {
        const data = ['#reference_number', '#quote_title', '#quote_date'];
        let status = true;

        data.forEach(item => {
            const value = $(item).val().trim();
            const context = $(item).prev().text();
            if (!value) {
                $(item).parents('label.form-field').toggleClass('b2b-erro', true);
                status = false;
                return window.b2b.Alert.error(`${context} cannot be empty`);
            }
            $(item).parents('label.form-field').toggleClass('b2b-erro', false);
        });

        if (this.data.productList.length === 0) {
            status = false;
            window.b2b.Alert.error('Please Add a product');
        }
        return status;
    }
    resetCompanyQuote() {
        sessionStorage.removeItem('quoteProducts');
        this.data = {
            productList: [],
        };
    }
    search() {
        const searchQuery = this.$quoteSearchInput.val();
        window.b2b.$overlay.show();

        utils.api.search.search(searchQuery, {
            template: 'b2b/shopping-list-search-results-data',
        }, (err, response) => {
            const productId = $(response).attr('data-product-id');

            if (err || !productId) {
                window.b2b.$overlay.hide();
                return this.$searchResulte.html('<table class="search-product-table" id="product_search_result_table" product-search-result-table style="margin-bottom:1.5rem;"><tbody><tr><td>No products found.</td></tr></tbody></table>');
            }

            this.getProductHtmlById(productId);
        });
    }

    getProductHtmlById(productId) {
        utils.api.product.getById(productId, {
            template: 'b2b/shopping-list-search-results-quote',
        }, (error, res) => {
            this.$searchResulte.html(`<table class="search-product-table" id="product_search_result_table" product-search-result-table style="margin-bottom:1.5rem;"><tbody>${res}</tbody></table>`);
            window.b2b.$overlay.hide();
        });
    }
    initCompany() {
        const userId = sessionStorage.getItem('userId');
        const filter = {
            limit: 1000,
            offset: 0,
        };

        window.b2b.$overlay.show();
        b2bAjax.getCompanyList(userId, filter)

            .then((res) => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);
                this.initCompanySelect(res.data.list);
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    initCompanySelect(list) {
        const sessionCompanyId = sessionStorage.getItem('companyId');
        const options = list.map(item => `<option action-begin-masquerade value=${item.companyId} data-company-id=${item.companyId} ${sessionCompanyId === item.companyId ? 'selected' : ''}>${item.companyName}</option>`).join('');
        $('#company_select').append(options);
        // 2.3 add adress
        this.initAdress();
    }
    eventHandler(type, event) {
        const fn = this[$(event.target).data(type)];
        if (typeof fn === 'function') {
            event.stopPropagation();
            fn.call(this, event);
        }
    }

    get quoteTotalData() {
        const { money = {} } = this.context.b2bSettings;
        const { productList } = this.data;
        const quoteData = productList.reduce((result, currentProduct) => ({
            subtotal: result.subtotal + currentProduct.basePrice * currentProduct.quantity,
            grandTotal: result.grandTotal + currentProduct.newPrice * currentProduct.quantity,
        }), {
            subtotal: 0,
            grandTotal: 0,
        });
        return {
            subtotal: currencyFormat(quoteData.subtotal, money),
            grandTotal: currencyFormat(quoteData.grandTotal, money),
            discount: currencyFormat((quoteData.grandTotal - quoteData.subtotal), money),
            quoteData: Object.assign({}, quoteData, { discount: (quoteData.grandTotal - quoteData.subtotal) }),
        };
    }

    handleProductAdd() {
        // check to add
        const isSelectCompany = this.isSelectCompany();
        if (!isSelectCompany) {
            return window.b2b.Alert.error('Please select a company');
        }
        const checkedNumber = $('.col-checkbox [data-results-check-box]:checked').length;
        const $form = $('#product_search_result_table form').eq(0);

        if (checkedNumber === 0) {
            return window.b2b.Alert.error('Please Select a Product');
        }

        window.b2b.$overlay.show();

        const newProduct = this.productAddData($form);
        const { productList } = this.data;
        const isInProductList = productList.filter(item => item.variantId === newProduct.variantId && item.productId === newProduct.productId).length > 0;
        /**
         * deal with new product add or just update product quantity.
         */
        if (isInProductList) {
            this.data.productList = productList.map(item => {
                const newItem = Object.assign({}, item);
                if (newItem.variantId === newProduct.variantId) newItem.quantity = item.quantity + 1;
                return newItem;
            });
            this.updateProductRow(`${newProduct.productId}-${newProduct.variantId}`);
        } else {
            this.data.productList.push(newProduct);
            this.appendProductRowToTbody(`${newProduct.productId}-${newProduct.variantId}`);
        }
        this.quoteTotal.update(this.quoteTotalData);
        window.b2b.$overlay.hide();
    }
    isSelectCompany() {
        const { roleId, companyStatus } = sessionStorageInfo();
        return (roleId === '3' && companyStatus === '1');
    }
    productAddData($form) {
        const $tr = $form.parents('tr');
        const sku = $tr.attr('data-product-base-sku');
        const basePrice = $tr.find('.product-price').attr('data-product-price-value');
        const productId = $tr.attr('data-product-id');
        const variantId = $tr.attr('data-variant-id');
        const imageUrl = $tr.find('.col-product-figure img').attr('src');
        const productName = $tr.find('.col-product-info').attr('data-name');
        const options = this.getOptions($form);
        const minQty = $tr.attr('data-min') === '0' ? '1' : $tr.attr('data-min');
        const maxQty = $tr.attr('data-max');
        return {
            sku,
            basePrice,
            discount: 0,
            newPrice: basePrice,
            quantity: 1,
            productId,
            variantId,
            imageUrl,
            productName,
            minQty,
            maxQty,
            options,
        };
    }
    getOptions(form) {
        let requireInputs = shopping.getRequireInputs(form);
        if (!requireInputs) {
            requireInputs = [];
        }
        const formInputs = shopping.getFormInputs(form);
        let options = {};
        if (formInputs.length <= 2) {
            return options;
        }
        for (let i = 0; i < formInputs.length; i++) {
            const item = formInputs[i];
            const itemName = item.name;
            const hasAttr = requireInputs.includes(itemName);
            if (hasAttr) {
                const value = item.value;
                options = Object.assign({}, options, this.getProductData(itemName, value));
            }
        }

        return options;
    }
    getProductData(itemName, value) {
        const $item = $(`[name='${itemName}'][value='${value}']`);
        const dispalyName = $item.attr('data-label-name');
        const title = $item.attr('data-title');

        return {
            [dispalyName]: title,
        };
    }
    findProductByVariantId(id) {
        return this.data.productList.filter(item => `${item.productId}-${item.variantId}` === id)[0];
    }

    appendProductRowToTbody(id) {
        const product = this.findProductByVariantId(id);
        const hasOptions = Object.keys(product.options);
        const options = hasOptions ? Object.keys(product.options).map(option => `
            <P>${option}: ${product.options[option]}</P>
        `).join('') : '';
        const { money = {} } = this.context.b2bSettings;
        const htmlRow = (
            `
                <tr class=product-item-tr" 
                 data-item-row data-variant-id="${product.variantId}" data-id=${product.productId}-${product.variantId}>
                    <td class="product-item-td">
                        <img class="cart-item-fixed-image" src="${product.imageUrl}" alt="${product.productName}" title="${product.productName}" />
                    </td>
                    <td class="product-item-td">
                        <P>${product.productName}</P>
                        <P>SKU: ${product.sku}</P>
                        ${options}
                    </td>
                    <td class="product-item-td product-item-price">
                        ${currencyFormat(product.basePrice, money)}
                    </td>
                    <td class="product-item-td product-item-discount">
                        <label class="quote-inline-from-field" data-row>
                            <input
                                data-input="handleInlineInput"
                                data-change="handleInlineChange"
                                name="discount"
                                data-max="100"
                                data-init-data="${product.discount}"
                                data-variant-id="${product.variantId}"
                                class="input discount-input"
                                type="text"
                                value="${product.discount}"
                            />
                            %
                        </label>
                    </td>
                    <td class="product-item-td product-item-new-price">
                        <label class="quote-inline-from-field" data-row>
                            ${money.currency_location === 'right' ? '' : money.currency_token}
                            <input
                                data-input="handleInlineInput"
                                data-change="handleInlineChange"
                                name="newPrice" 
                                data-max="${product.basePrice}"
                                data-min="0"
                                data-init-data="${product.newPrice}"
                                data-variant-id="${product.variantId}"
                                class="input new-price-input"
                                type="text"
                                value="${product.newPrice}"
                            />
                            ${money.currency_location !== 'right' ? '' : money.currency_token}
                        </label>
                    </td>
                    <td class="product-item-quantity">
                        <label class="quote-inline-from-field">
                            <input
                                data-input="handleInlineInput"
                                data-change="handleInlineChange"
                                name="quantity" 
                                data-init-data="${product.minQty}"
                                data-min="${product.minQty}"
                                data-max="${product.maxQty}"
                                data-variant-id="${product.variantId}"
                                class="input quantity-input"
                                type="text"
                                value="${product.quantity}"
                            />
                        </label>
                    </td>
                    <td class="product-item-line-total">
                        <span class="line-total">${currencyFormat(product.newPrice * product.quantity, money)}</span>
                    </td>
                    <td>
                        <i data-click="handleProductDelete" data-variant-id="${product.variantId}" class="fa fa-delete"></i>
                    </td>
                </tr>
            `
        );

        this.$productListTable.find('tbody').append(htmlRow);
    }

    removeProductRow(itemId) {
        this.$productListTable.find(`tr[data-id=${itemId}]`).remove();
    }

    updateProductRow(id) {
        const { money = {} } = this.context.b2bSettings;
        const product = this.findProductByVariantId(id);
        const $currentDomRow = this.$productListTable.find(`tr[data-id=${id}]`);
        $currentDomRow.find('.quantity-input').val(product.quantity);
        $currentDomRow.find('.new-price-input').val(product.newPrice);
        $currentDomRow.find('.discount-input').val(product.discount);
        $currentDomRow.find('.line-total').html(currencyFormat(product.newPrice * product.quantity, money));
        this.quoteTotal.update(this.quoteTotalData);
    }

    handleProductDelete(e) {
        const $target = $(e.target);
        const itemId = $target.parents('tr').attr('data-id');
        // const variantId = $target.data('variant-id');
        const { productList } = this.data;
        this.data.productList = productList.filter(item => `${item.productId}-${item.variantId}` !== itemId);
        this.removeProductRow(itemId);
        this.quoteTotal.update(this.quoteTotalData);
    }

    valueReplace(val, isFloat = true) {
        if (isFloat) {
            return val.replace(/[^\d^\.]+/g, '')
                .replace('.', '$#$')
                .replace(/\./g, '')
                .replace('$#$', '.');
        }
        return val.replace(/[^\d]+/g, '');
    }

    handleInlineChange(event) {
        const $target = $(event.target);
        const targetName = $target.attr('name');
        const maxVal = parseFloat($target.attr('data-max'));
        const minVal = parseFloat($target.attr('data-min'));
        const initData = $target.attr('data-init-data');
        let targetValue = $target.val();

        if (targetValue && targetValue < minVal) {
            targetValue = minVal;
        }

        if (targetValue && maxVal && targetValue > maxVal && maxVal !== 0) {
            targetValue = maxVal;
        }

        if (!targetValue) targetValue = parseFloat(initData);
        this.updateProductList($target, targetValue, targetName);
    }

    handleInlineInput(event) {
        const $target = $(event.target);
        const targetName = $target.attr('name');
        const targetValue = this.valueReplace($target.val(), targetName !== 'quantity');
        this.updateProductList($target, targetValue, targetName);
    }

    updateProductList($target, targetValue, targetName) {
        const { productList } = this.data;
        this.data.productList = productList.map(product => {
            const newProduct = Object.assign({}, product);
            const id = `${newProduct.productId}-${newProduct.variantId}`;
            if (id === $target.parents('tr').attr('data-id')) {
                switch (targetName) {
                case 'discount':
                    newProduct.discount = targetValue;
                    newProduct.newPrice = Number.isNaN(newProduct.basePrice * (100 - parseFloat(targetValue, 10)) / 100)
                        ? newProduct.basePrice
                        : (newProduct.basePrice * (100 - parseFloat(targetValue, 10)) / 100).toFixed(2);
                    break;
                case 'newPrice':
                    newProduct.newPrice = targetValue;
                    newProduct.discount = ((newProduct.basePrice - targetValue) / newProduct.basePrice * 100).toFixed(2) || 0;
                    break;
                case 'quantity':
                    newProduct.quantity = parseInt(targetValue, 10) || '';
                    break;
                default:
                    break;
                }
            }
            return newProduct;
        });
        this.updateProductRow($target.parents('tr').attr('data-id'));
        this.quoteTotal.update(this.quoteTotalData);
    }
}
