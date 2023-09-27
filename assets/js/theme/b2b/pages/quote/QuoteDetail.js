import { urlHelper, currencyFormat } from '../../common';
import QuoteTotal from './QuoteTotal';
import b2bAjax from '../../common/ajax';
import dateTime from '../../common/DateTime';
import formUtils from '../../common/formUtils';
import hideSelerBox from '../../common/quote/hideSalerepInfobox';
import swal from 'sweetalert2';

// 前端导出pdf
// const creatSrctipt = (url = '') => {
//     const tagName = 'script';
//     const doc = window.document;
//     const tag = doc.createElement(tagName);
//     tag.src = url;
//     const heads = doc.getElementsByTagName('head');
//     if (heads.length) heads[0].appendChild(tag);
//     else doc.documentElement.appendChild(tag);
// };
// creatSrctipt('https://bundleb2b-pdf.s3-us-west-2.amazonaws.com/html2pdf_bundle.js');

export default class QuoteDetail {
    constructor(context) {
        this.context = context;
        this.doms = {
            $back: $('.back-link'),
            $actions: $('.quote-detail-actions'),
            $productListTable: $('#product_list_table'),
            $quoteInfo: $('.quote-info'),
        };
        this.currencySymbol = context.b2bSettings.money.currency_token;
        this.data = {
            productList: [],
        };
        this.quoteIdKey = 'quote-id';
        this.pagination = {
            limit: 4,
            offset: 0,
            totalCount: 1,
        };
        this.fromEdit = urlHelper.searchParams.has('edit');
    }
    static init(context) {
        const quoteDetailInstance = new this(context);
        quoteDetailInstance.initPage(context);
    }

    get hasQuoteId() {
        return urlHelper.searchParams.has(this.quoteIdKey) && !!urlHelper.searchParams.get(this.quoteIdKey);
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
    bindEvents() {
        const selectEmailContainer = $('#select_email_container');

        $('body').on('click', '#save', () => {
            this.saveQuote();
        });

        $('body').on('click', '#email-send-btn', (e) => {
            e.stopPropagation();
            this.sendEmail();
        });

        $('body').on('focus', '#quote_eamil_input', () => {
            $('#quote_eamil_input').parents('.quote-input').toggleClass('b2b-erro', false);
        });

        $('body').on('click', '#quote_checkout', (e) => {
            this.checkout(e);
        });

        // 2.3
        $('body').on('click', '#email_select_btn', () => {
            selectEmailContainer.toggleClass('b2b-hide');
            this.searchEmail(true);
        });

        $('body').on('click', '#select_email_container .modal_close', () => {
            selectEmailContainer.toggleClass('b2b-hide');
        });

        // search email
        $('body').on('click', '#email_search_btn', () => {
            this.pagination.offset = 0;
            this.pagination.limit = 4;
            this.searchEmail(true);
        });

        // 2.3 select a email
        $('body').on('click', '#select_email_container [data-select-email]', (e) => {
            const value = $(e.target).text().trim();
            selectEmailContainer.toggleClass('b2b-hide');
            $('#quote_eamil_input').val(value);
        });

        $('body').on('keyup', '#address_search_input', (e) => {
            if (e.keyCode === 13) {
                this.pagination.offset = 0;
                this.pagination.limit = 4;
                this.searchEmail(true);
            }
        });

        $('body').on('click', '#update_quote', () => {
            this.updateQuote();
        });

        $('body').on('click', '#save_draft', () => {
            this.saveQuote(true);
        });
        $('body').on('click', '#publish_dfrat', () => {
            this.updateQuote(true);
        });
        // export pdf
        $('body').on('click', '#export_pdf', () => {
            this.exportPDF();
        });
        //  print dpf
        $('body').on('click', '#print_pdf', () => {
            this.printPDF();
        });
    }
    printPDF() {
        const styleContent = `
            @page {
                size: auto;  /* auto is the initial value */
                margin: 0mm; /* this affects the margin in the printer settings */
            }
            @media (min-width: 801px) {
                .body {
                    margin-top: 0;
                }
            }
            .body {
                margin-top: 0;
            }
            body > :not(.body) {
                display: none;
            }
            .body > :not(.container) {
                display: none;
            }
            .account > :not(.b2b-wrap) {
                display: none;
            }
            .b2b-wrap > :not(.quote-detail) {
                display: none;
            }
        `;
        const style = document.createElement('style');
        style.media = 'print';
        style.innerHTML = styleContent;
        document.head.appendChild(style);
        window.print();
    }
    exportPDF() {
        window.b2b.$overlay.show();
        // 前端导出PDF
        // const exportElement = document.querySelector('.quote-detail');
        // window._html2pdf(exportElement, {
        //     mode: 'adaptive',
        //     pagesplit: true,
        //     position: {
        //         x: 20,
        //         y: 20,
        //     },
        //     useDefaultFoot: false,
        //     useCORS: false,
        //     filename: this.data.quoteInfo.referenceNumber,
        //     outputType: 'save',
        //     isToggleStyle: true,
        //     onComplete: () => {
        //         window.b2b.$overlay.hide();
        //     },
        // });
        const quoteId = urlHelper.searchParams.get(this.quoteIdKey);
        b2bAjax.exportPDF(quoteId).then((res) => {
            if (res.code !== 200) {
                return swal({
                    type: 'error',
                    text: res.message,
                });
            }
            window.b2b.$overlay.hide();
            window.open(res.data.url, '_blank');
        });
    }
    updateQuote(publish) {
        const quotePreviewData = JSON.parse(sessionStorage.getItem('quotePreviewData'));
        const quoteId = quotePreviewData.quoteId;
        const data = quotePreviewData;
        if (publish) {
            data.status = '0';
        }
        window.b2b.$overlay.show();
        b2bAjax.updateQuote(quoteId, data)
            .then((res) => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);
                window.b2b.Alert.success('Success');
                urlHelper.redirect('/quote-list');
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    searchEmail(init) {
        const companyId = this.companyId;
        const q = $('#address_search_input').val();
        const data = {
            offset: this.pagination.offset,
            limit: this.pagination.limit,
            role: ['0', '1', '2'],
            q,
        };

        b2bAjax.getCompanyUser(companyId, data)
            .then(res => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);

                const lists = res.data.list;
                if (lists.length > 0) {
                    const emails = this.renderEmail(lists);
                    $('#select_email_container .modal-body').html(emails);
                } else {
                    $('#select_email_container .modal-body').html('');
                }
                if (init) {
                    this.initPagination(res.data.pagination);
                }
            })
            .catch(error => window.b2b.Alert.error(error));
    }
    initPagination(data) {
        const totle = Math.ceil(data.totalCount / this.pagination.limit);
        this.pagination.totalCount = data.totalCount;
        let pageNumber = 1;

        if (totle === 0) {
            this.pagination.totalCount = 1;
        }

        $('#jqPagination').jqPaginator({
            totalPages: Math.ceil(this.pagination.totalCount / this.pagination.limit),
            currentPage: pageNumber,
            onPageChange: (num) => {
                if (pageNumber === num) return;
                pageNumber = num;
                this.pagination.offset = (num - 1) * this.pagination.limit;
                this.searchEmail(false);
            },
        });
    }
    renderEmail(data) {
        const lists = data.map((list) => `
        <a href="javascript:void(0)" class="address_item" 
        data-select-email
        >
            <div>
               ${list.email}
            </div>
        </a>
        `).join('');
        return lists;
    }
    sendEmail() {
        const $email = $('#quote_eamil_input');
        const email = $email.val().trim();
        const checkEmail = formUtils().isB2BEmail(email);
        const quoteId = urlHelper.searchParams.get(this.quoteIdKey);
        const quoteUrl = window.location.href;
        const data = {
            email,
            quoteId,
            quoteUrl,
        };

        $('#email-send-btn').attr('disabled', true);

        if (!checkEmail) {
            $email.parents('.quote-input').toggleClass('b2b-erro', true);
            $email.parents('.quote-input').find('.err-tips').html('Please enter a valid email address.');
            $('#email-send-btn').attr('disabled', false);
            return;
        }

        window.b2b.$overlay.show();

        b2bAjax.sendEmail(data)
            .then(res => {
                if (res.code !== 200) {
                    return window.b2b.Alert.error(res.message);
                }
                $email.parents('.quote-input').toggleClass('b2b-erro', false);
                $('.modal-close').click();
                urlHelper.redirect('/quote-list');
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => {
                window.b2b.$overlay.hide();
            });
    }
    initPage() {
        const isDetailPage = this.hasQuoteId;
        const quoteId = urlHelper.searchParams.get(this.quoteIdKey);
        const companyId = sessionStorage.getItem('companyId');

        this.initBackText();
        this.bindEvents();
        if (isDetailPage) {
            window.b2b.$overlay.show();

            this.initEmailBtn();

            b2bAjax.getQuote(quoteId)
                .then(res => {
                    if (res.code !== 200) {
                        return window.b2b.Alert.error(res.message);
                    }
                    this.initDrafText(res.data, true);
                    this.initActionButtons(res.data);
                    this.data = res.data;
                    this.data.productList = res.data.quoteInfo.productList;
                    this.renderProductsData(this.data.productList);
                    this.renderQuoteInfo(this.data.quoteInfo);
                    // 2.3 add saler rep information
                    this.renderSalseInfor(this.data.salesRepInfo);
                    this.renderDefualtAdress(res, true);
                    this.quoteTotal = new QuoteTotal('#quote_total', this.quoteTotalData);
                    this.quoteTotal.render();
                    this.initCheckOutBtn();
                    this.companyId = this.data.companyInfo.companyId;
                })
                .catch(error => window.b2b.Alert.error(error))
                .finally(() => window.b2b.$overlay.hide());
        } else {
            this.data = JSON.parse(sessionStorage.getItem('quotePreviewData'));
            this.renderProductsData(this.data.productList);
            this.renderQuoteInfo(this.data, true);

            hideSelerBox();
            this.initActionButtons();
            window.b2b.$overlay.show();

            b2bAjax.getDefaultAddresses(companyId)
                .then(res => {
                    if (res.code !== 200) {
                        return window.b2b.Alert.error(res.message);
                    }
                    this.initDrafText();
                    this.renderDefualtAdress(res, false);
                    // 2.3 add saler rep information
                    this.renderSalseInfor(res.data.salesRepInfo);
                    this.quoteTotal = new QuoteTotal('#quote_total', this.quoteTotalData);
                    this.quoteTotal.render();
                })
                .catch(error => window.b2b.Alert.error(error))
                .finally(() => window.b2b.$overlay.hide());
        }
    }
    initDrafText(data, isDetailPage) {
        if (isDetailPage) {
            const status = data.quoteInfo.status;
            if (status === '5') {
                $('#draft-container').html('<h3>Draft</h3>');
            }
        } else {
            const quotePreviewData = JSON.parse(sessionStorage.getItem('quotePreviewData'));
            const status = quotePreviewData.status;
            if (status === '5' || !status) {
                $('#draft-container').html('<h3>Draft</h3>');
            }
        }
    }
    initEmailBtn() {
        const roleId = sessionStorage.getItem('roleId');
        const companyStatus = sessionStorage.getItem('companyStatus');

        if (companyStatus !== '1' && roleId === '3') {
            const style = `<style id="style_email">
            #send_email {display:inline-block;}
            </style>`;
            $('head').append(style);
        }
    }
    checkout(e) {
        const $target = $(e.target);
        const quoteId = $target.attr('data-quote-id');

        window.b2b.$overlay.show();

        b2bAjax.quoteCheckout(quoteId)
            .then(res => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);

                const checkouUrl = res.data.checkoutUrl;
                localStorage.setItem('quoteCheckoutId', quoteId);
                urlHelper.redirect(checkouUrl);
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    initCheckOutBtn() {
        const roleId = sessionStorage.getItem('roleId');
        const companyStatus = sessionStorage.getItem('companyStatus');
        const showCheckOut = (roleId !== '2') && companyStatus === '1';
        const quoteId = urlHelper.searchParams.get(this.quoteIdKey);

        if (showCheckOut) {
            $('[data-send-email]').after(`<a class="button button--small" 
            javascript:'volid(0)' id="quote_checkout" data-quote-id="${quoteId}">Checkout</a>`);
        }
    }
    renderDefualtAdress(res, DetailPage) {
        const storeInfo = res.data.storeInfo;
        const quotePreviewData = JSON.parse(sessionStorage.getItem('quotePreviewData'));
        const companyInfo = DetailPage ? res.data.companyInfo : quotePreviewData.addressInfo;

        const companryInfo = `<div>
                    <h5 class="quote-item-title">
                    ${companyInfo.companyName}
                    </h5>
                    <div class="quote-item">
                    <span class="${companyInfo.label ? '' : 'b2b-hide'}">${companyInfo.label}</span>
                    </div>
                    <div class="quote-item">
                        <span class="${companyInfo.firstName ? '' : 'b2b-hide'}">${companyInfo.firstName}</span>
                        <span class="${companyInfo.lastName ? '' : 'b2b-hide'}">${companyInfo.lastName}</span>
                    </div>
                    <div class="quote-item">
                        <span class="${companyInfo.phoneNumber ? '' : 'b2b-hide'}">${companyInfo.phoneNumber}</span>
                    </div>
                    <div class="${companyInfo.companyAddress ? 'quote-item' : 'b2b-hide'}">
                        <span>${companyInfo.companyAddress}</span>
                    </div>
                    <div class="quote-item">
                        <span class="${companyInfo.companyCity ? '' : 'b2b-hide'}">${companyInfo.companyCity},</span> 
                        <span class="${companyInfo.companyState ? '' : 'b2b-hide'}">${companyInfo.companyState},</span>
                        <span class="${companyInfo.companyZipCode ? '' : 'b2b-hide'}">${companyInfo.companyZipCode}</span>
                    </div>
                    <div class="${companyInfo.companyCountry ? 'quote-item' : 'b2b-hide'}">
                        <span>${companyInfo.companyCountry}</span>
                    </div>
                </div>`;

        const storeAddress = `<div>
                    <h5 class="quote-item-title">
                       ${storeInfo.storeName}
                    </h5>
                    <div class="${storeInfo.storeAddress ? 'quote-item' : 'b2b-hide'}">
                        <span>${storeInfo.storeAddress}</span>
                    </div>
                    <div class="${storeInfo.storeCountry ? 'quote-item' : 'b2b-hide'}">
                    <span>${storeInfo.storeCountry}</span>
                </div>
                </div>`;
        $('#store_address').html(storeAddress);
        $('#company_addressed').html(companryInfo);
    }
    renderQuoteInfo(data, preview) {
        let expiredAt;
        if (preview) {
            expiredAt = data.expiredAt;
        } else {
            expiredAt = dateTime.formateTimestampToLocal(data.expiredAt);
        }
        const quoteInfo = `<div>
            <h5 class="quote-item-title" class="${data.referenceNumber ? 'quote-item' : 'b2b-hide'}">
                Reference Number: ${data.referenceNumber}
            </h5>
            <div class="${data.createdAt ? 'quote-item' : 'b2b-hide'}">
                <span>Issued on: </span>  
                <span>${dateTime.formateTimestampToLocal(data.createdAt)}</span>
            </div>
            <div class="${data.expiredAt ? 'quote-item' : 'b2b-hide'}">
                <span>Expiration Date: </span>
                <span>${expiredAt}</span>
            </div>
        </div>`;
        $('#quote_info').html(quoteInfo);

        // 2.3 additionalInfo
        if (data.additionalInfo) {
            $('#additional_infor').html(`<h2>Notes</h2>
            <div style="word-break: break-all;">${data.additionalInfo}</div>`);
        }
    }
    renderSalseInfor(data) {
        if (!data) return;

        const salseInfor = `
        <div class="seler_infor">
            <div class="${data ? 'quote-item' : 'b2b-hide'}">Sales Representative:</div>
            <div class="${(data.firstName && data.lastName) ? 'quote-item' : 'b2b-hide'}">
                <span>${data.firstName}</span>  
                <span>${data.lastName}</span>
            </div>
            <div class="${data.phoneNumber ? 'quote-item' : 'b2b-hide'}">
                <span>${data.phoneNumber}</span>
            </div>
            <div class="${data.email ? 'quote-item' : 'b2b-hide'}">
                <span>${data.email}</span>
            </div>
        </div>`;

        $('#quote_info').append(salseInfor);
    }
    renderProductsData(data) {
        data.forEach(product => this.appendProductRowToTbody(`${product.productId}-${product.variantId}`));
    }
    initBackText() {
        const backText = this.hasQuoteId ? 'Back to all Quotes' : 'Back to Edit';
        let link = this.hasQuoteId ? '/quote-list' : '/create-quote';
        const number = -1;
        if (this.fromEdit) {
            link = `javascript:history.go(${number})`;
        }

        this.doms.$back.html(`
            <a class="link" href="${link}">
                <i class="fa fa-arrow-circle-left" ></i>
                <span>
                    ${backText}
                </span>
            </a>
        `);
    }
    findProductByVariantId(id) {
        return this.data.productList.filter(item => `${item.productId}-${item.variantId}` === id)[0];
    }
    appendProductRowToTbody(id) {
        const product = this.findProductByVariantId(id);
        const hasOptions = Object.keys(product.options);
        const { money = {} } = this.context.b2bSettings;
        const options = hasOptions ? Object.keys(product.options).map(option => `
            <P>${option}: ${product.options[option]}</P>
        `).join('') : '';

        const htmlRow = (
            `
                <tr class=product-item-tr" 
                 data-item-row data-variant-id="${product.variantId}" data-id=${product.productId}-${product.variantId}>
                    <td class="product-item-td product-item-img">
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
                            ${product.discount} %
                        </label>
                    </td>
                    <td class="product-item-td product-item-new-price">
                        <label class="quote-inline-from-field" data-row>
                        ${currencyFormat(product.newPrice, money)}
                        </label>
                    </td>
                    <td class="product-item-quantity">
                        <label class="quote-inline-from-field">
                        ${product.quantity}
                        </label>
                    </td>
                    <td class="product-item-line-total">
                        <span class="line-total">${currencyFormat((product.newPrice * product.quantity).toFixed(2), money)}</span>
                    </td>
                </tr>
            `
        );

        this.doms.$productListTable.find('tbody').append(htmlRow);
    }
    saveQuote(draft) {
        const previewData = JSON.parse(sessionStorage.getItem('quotePreviewData'));
        const additionalInfo = previewData.additionalInfo;
        const addressInfo = previewData.addressInfo;
        const draftStatus = draft ? { status: '5' } : {};
        const data = Object.assign({}, {
            companyId: sessionStorage.getItem('companyId'),
            referenceNumber: this.data.referenceNumber,
            title: this.data.quoteTitle,
            description: this.data.quoteDescription,
            expiredAt: this.data.expiredAt,
            money: this.context.b2bSettings.money,
            productList: this.data.productList,
            additionalInfo,
            addressInfo,
        }, this.quoteTotalData.quoteData, draftStatus);

        window.b2b.$overlay.show();
        b2bAjax.createQuote(data)
            .then(res => {
                if (res.code !== 200) {
                    return window.b2b.Alert.error(res.message);
                }
                urlHelper.redirect('/quote-list');
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    initActionButtons(data) {
        let status;
        if (data && data.quoteInfo) {
            status = data.quoteInfo.status;
        } else {
            status = JSON.parse(sessionStorage.getItem('quotePreviewData')).status;
        }

        const actionsHtml = this.hasQuoteId ? `
            <a class="button button--primary button--small" id="print_pdf" href="javascript:void(0);">
                <i class="fa fa-print"></i>
            </a>
            <a class="button button--primary button--small" id="export_pdf" href="javascript:void(0);">
                <i class="fa fa-file-pdf-o"></i>
            </a>
            <a class="button button--primary button--small ${status === '5' ? 'b2b-hide' : ''}" id="send_email"  data-send-email href="javascript:void(0);" data-reveal-id="modal-quote-email-form">
                <i class="fa fa-envelope"></i>
            </a>
        ` : `
            <a class="button button--small" id="cancel_create" href="/quote-list">Cancel</a>
            <a class="button button--small ${this.fromEdit ? '' : 'b2b-hide'}" id="update_quote" href="javascript:void(0);">Update</a>
            <a class="button button--small ${!status ? '' : 'b2b-hide'}" id="save_draft" href="javascript:void(0);">Save as Draft</a>
            <a class="button button--primary button--small ${status !== '2' && !this.fromEdit ? '' : 'b2b-hide'}" id="save" href="javascript:void(0);">Publish</a>
            <a class="button button--primary button--small ${status === '5' && this.fromEdit ? '' : 'b2b-hide'}" id="publish_dfrat" href="javascript:void(0);">Publish</a>
        `;
        this.doms.$actions.html(actionsHtml);
    }
}
