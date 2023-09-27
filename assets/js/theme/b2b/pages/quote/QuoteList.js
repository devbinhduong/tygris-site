/**
 * @file QuoteList.js
 */
import b2bAjax from '../../common/ajax';
// import checkB2bUser from '../../common/checkB2bUser';
import urlHelper from '../../common/urlHelper';
import sessionStorageInfo from '../../common/sessionStorageInfo';
import {
    defineReactive,
    DateTime,
    getQuoteStatusByCode,
} from '../../common';

/**
 * @constructor QuoteList
 */
export default class QuoteList {
    /**
     * @param {object} context global stencil context object
     */
    constructor(context) {
        this.context = context;

        this.$quoteListTable = $('#quote_list_table');
        this.$quoteCount = $('#quote_count');
        this.$pagination = $('#jq_pagination');

        this.data = {
            pagination: {
                totalCount: 1,
                offset: 0,
                limit: 10,
            },
        };
        this.initData();

        this.$quoteListTable.on('click', this.onClick.bind(this));
        this.bindGlobalEvent();
    }

    static init(context) {
        const quoteListInstance = new this(context);
        quoteListInstance.getQuoteList();
        quoteListInstance.initPagination();
        quoteListInstance.initBtn();
    }

    onClick(event) {
        const fn = this[$(event.target).data('click')];
        if (typeof fn === 'function') {
            event.stopPropagation();
            fn.call(this, event);
        }
    }

    bindGlobalEvent() {
        $(document).on('click', () => {
            $('.dropdown-menu').hide();
        });
    }

    initData() {
        defineReactive(
            this.data,
            'quoteList',
            [],
            this.renderQuoteList.bind(this),
        );
    }

    toggleDropdown(event) {
        $(event.target)
            .parents('tr')
            .siblings('tr')
            .find('.dropdown-menu')
            .hide();
        $(event.target).siblings('.dropdown-menu').toggle();
    }

    handleDeleteQuote(e) {
        const $target = $(e.target);
        const quoteId = $target.attr('data-quote-id');

        window.b2b.$overlay.show();

        b2bAjax.deleteQuoteList(quoteId)
            .then(resp => {
                if (resp.code !== 200) {
                    return window.b2b.Alert.error(resp.message);
                }

                window.b2b.Alert.success(resp.message);
                this.getQuoteList();
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }

    getQuoteList(page) {
        window.b2b.$overlay.show();
        const {
            pagination,
        } = this.data;

        if (page) {
            pagination.offset = (page - 1) * pagination.limit;
        }

        const { limit, offset } = pagination;

        b2bAjax.getQuoteList({
            limit,
            offset,
        })
            .then(resp => {
                if (resp.code !== 200) return window.b2b.Alert.error(resp.message);
                this.data.quoteList = resp.data.list;
                this.data.pagination = resp.data.pagination;
                this.updatePagination();
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => window.b2b.$overlay.hide());
    }
    showCompanyName() {
        const { roleId, companyStatus } = sessionStorageInfo();
        if (roleId === '3' && companyStatus !== '1') {
            return false;
        }
        return true;
    }
    showEditBtn(quote) {
        const { roleId, companyStatus } = sessionStorageInfo();
        return Boolean(roleId === '3' && companyStatus !== '1' && quote.status !== '2');
    }
    renderQuoteList() {
        const { quoteList } = this.data;
        const showCheck = this.isShowCheckBtn();
        const showDeleteBtn = this.isShowDeleteBtn();
        const showCompanyName = this.showCompanyName();
        const thead = `<tr>
        <th>Reference Number</th>
        <th>Title</th>
        <th class="t-align-c ${showCompanyName ? '' : 'b2b-hide'}"">Sales Rep</th>
        <th class="t-align-c ${showCompanyName ? 'b2b-hide' : ''}">Company Name</th>
        <th class="t-align-c">Created On</th>
        <th class="t-align-c">Status</th>
        <th class="t-align-c">Action</th>
    </tr>`;
        const quoteListHtml = quoteList.map(quote => `
            <tr>
                <td>${quote.referenceNumber}</td>
                <td>${quote.title}</td>
                <td class="t-align-c ${showCompanyName ? '' : 'b2b-hide'}">${quote.salesRep}</td>
                <td class="t-align-c ${showCompanyName ? 'b2b-hide' : ''}">${quote.companyName}</td>
                <td class="t-align-c">${DateTime.formateTimestampToLocal(quote.createdAt)}</td>
                <td class="t-align-c">${getQuoteStatusByCode(quote.status)}</td>
                <td class="t-align-c">
                    <i data-click="toggleDropdown" class="fa fa-ellipsis-v td-action-dropdown"></i>
                    <ul class="dropdown-menu">
                        <li class="dropdown-menu-item"><a href="/quote-detail/?quote-id=${quote.quoteId}">View</a></li>
                        <li class="dropdown-menu-item ${showCheck && quote.status !== '2' && quote.status !== '3' ? '' : 'b2b-hide'}"><a href="javascript:void(0);" data-click="checkout" data-quote-id="${quote.quoteId}">Checkout</a></li>
                        <li class="dropdown-menu-item ${quote.orderId ? '' : 'b2b-hide'}"><a href="/orderdetail/?id=${quote.orderId}" data-quote-id="${quote.quoteId}">View Order</a></li>
                        <li class="dropdown-menu-item ${this.showEditBtn(quote) ? '' : 'b2b-hide'}"><a href="/quote-edit?quote-id=${quote.quoteId}" data-quote-edit">Edit</a></li>
                        <li class="dropdown-menu-item ${showDeleteBtn ? '' : 'b2b-hide'}"><a href="javascript:void(0);" data-click="handleDeleteQuote" data-quote-id="${quote.quoteId}">Delete</a></li>
                    </ul>
                </td>
            </tr>
        `).join('');
        $('#quote_list_table thead').html(thead);
        this.$quoteListTable.find('tbody').html(quoteListHtml);
    }
    initBtn() {
        const { roleId, companyStatus } = sessionStorageInfo();
        const showCreateBtnStatu = (roleId === '3' && companyStatus !== '1');

        if (!showCreateBtnStatu) {
            $('#create_new_quote_button').remove();
        }
    }
    isShowDeleteBtn() {
        const { roleId, companyStatus } = sessionStorageInfo();
        const status = (companyStatus !== '1' && roleId === '3');

        return status;
    }
    isShowCheckBtn() {
        const { roleId, companyStatus } = sessionStorageInfo();
        const status = (companyStatus === '1' && roleId !== '2');

        return status;
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

    get paginationData() {
        const {
            pagination: {
                totalCount,
                limit,
                offset,
            },
        } = this.data;
        let totalPages;
        if (totalCount === 0) {
            totalPages = 1;
        } else {
            totalPages = Math.ceil(totalCount / limit);
        }
        const currentPage = offset / limit + 1;
        return {
            totalPages,
            currentPage,
        };
    }

    updatePagination() {
        const { totalPages, currentPage } = this.paginationData;
        this.$pagination.jqPaginator('option', {
            totalPages,
            currentPage,
        });
        this.$quoteCount.html(this.data.pagination.totalCount);
    }

    initPagination() {
        const { totalPages, currentPage } = this.paginationData;
        this.$pagination.jqPaginator({
            totalPages,
            currentPage,
            onPageChange: (page, type) => {
                if (type === 'init') return false;
                this.getQuoteList(page);
            },
        });
    }
}
