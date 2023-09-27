import b2bAjax from '../common/ajax';
import swal from 'sweetalert2';
import UrlHelper from '../common/urlHelper';
import _ from 'lodash';

export default {
    get impersonationHtml() {
        return '<span class="button button--primary button--small view-action" action-begin-masquerade>Begin Masquerade</span>';
    },

    init(context, isDashbord) {
        const userId = sessionStorage.getItem('userId');
        const roleId = sessionStorage.getItem('roleId');
        window.b2b.customer = context.id;
        window.b2b.userId = userId;
        window.b2b.offset = 0;
        window.b2b.limit = 10;
        window.b2b.isDashbord = isDashbord;
        // if not saler rap
        if (roleId !== '3') {
            UrlHelper.redirect('/account.php');
        }
        window.b2b.$overlay.show();
        this.initUserInfor(context.id);
        this.initCompanyList({
            offset: window.b2b.offset,
            limit: window.b2b.limit,
        });
        this.initBeginMasqueradeBtn();
        this.initEndMasqueradeBTn();
        this.initFilterBtn();
        this.bindEndMasqueradeEvent();
        this.initSearchBtn();
    },
    initFilterBtn() {
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
            this.sortBy = sortBy;
            this.orderBy = orderBy;
            this.getCompanyList(sortBy, orderBy);
        });
    },
    initSearchBtn() {
        const btnSearch = _.debounce((q) => {
            window.b2b.offset = 0;
            window.b2b.limit = 10;
            this.initCompanyList({
                offset: window.b2b.offset,
                limit: window.b2b.limit,
                q,
            });
        }, 600);
        $('body').on('keyup', '.search input', (e) => {
            const q = $(e.target).val();
            btnSearch(q);
            this.q = q;
        });
    },
    getOrderBy() {
        const orderBy = [];
        const $siblings = $('#sale-rep-table [data-sort-filter]');
        $($siblings).each((index, item) => {
            if ($(item).hasClass('asc')) {
                const filterName = $(item).attr('data-sort-filter');
                orderBy.push(filterName);
            }
        });
        return orderBy;
    },
    initUserInfor(userId) {
        b2bAjax.getUserRole(userId).then((res) => {
            if (res.code !== 200) {
                // console.log(res.message);
            }
            this.renderUserInfor(res.data);
        });
    },
    initEndMasqueradeBTn(roleId = sessionStorage.getItem('roleId'), companyId = sessionStorage.getItem('companyId')) {
        const status = (roleId === '3' && companyId);
        const companyName = sessionStorage.getItem('companyName');
        const endMasqueradeLength = ($('.bottom-end-masquerade').length === 0);
        const salerepInfoboxLength = ($('.salerep-infobox').length === 0);

        if (status && endMasqueradeLength) {
            $('.table-wrap').after('<div class="bottom-end-masquerade" style="text-align:right;"><a href="javascript:void(0);" class="button button--primary" end-masquerade>End Masquerade</a></div>');
        }
        if (status && salerepInfoboxLength) {
            $('.navUser').after(`<div class="salerep-infobox"><div class="container" style="overflow:hidden;"><span style="line-height:40px;">Viewing as ${companyName}</span><span class="button button--primary" style="float:right;margin: 0;" end-masquerade>End Masquerade</span></div></div>`);
        }
    },
    bindEndMasqueradeEvent() {
        $('body').on('click', '[end-masquerade]', (event) => {
            event.preventDefault();
            window.b2b.$overlay.show();
            const companyId = sessionStorage.getItem('companyId');
            const userId = sessionStorage.getItem('userId');
            b2bAjax.endMasqueradeCompany(userId, companyId).then(res => {
                if (res.code !== 200) {
                    return swal({
                        text: 'Company dashboard unbinding was unsuccessful. Please try again later.',
                        type: 'error',
                    });
                }
                this.endMasquerade();
                if (window.b2b.isDashbord) {
                    window.b2b.$overlay.show();
                }
            });
        });
    },
    endMasquerade(status) {
        sessionStorage.removeItem('companyId');
        sessionStorage.removeItem('companyStatus');
        sessionStorage.removeItem('companyName');
        $('.bottom-end-masquerade').remove();
        $('.salerep-infobox').remove();
        if (status) return;
        if (!window.b2b.isDashbord) {
            window.location.href = '/dashboard/';
            window.b2b.$overlay.hide();
            return;
        }
        window.b2b.initNavBtn();
        this.getCompanyList();
    },
    initCompanyList(data) {
        b2bAjax.getCompanyList(window.b2b.userId, data).then((res) => {
            this.renderCompanies(res);
            this.initJqPagenation(res.data);
        });
    },

    initBeginMasqueradeBtn() {
        $('body').on('click', '[action-begin-masquerade]', (e) => {
            const $item = $(e.target);
            const masqueradeCompanyId = $item.parents('tr').attr('data-company-id');
            const userId = sessionStorage.getItem('userId');
            window.b2b.$overlay.show();

            const salerepInfoboxExist = $('.salerep-infobox').length > 0;
            if (salerepInfoboxExist) {
                $('.salerep-infobox').remove();
            }

            this.beginMasqueradeCompany(masqueradeCompanyId, userId).then((response) => {
                if (!response) {
                    return swal({
                        text: 'Company dashboard binding was unsuccessful. Please try again later.',
                        type: 'error',
                    });
                }
                this.initCompanyInfo();
            });
        });
    },
    // saler rep start to proxy company
    beginMasqueradeCompany(masqueradeCompanyId, userId) {
        return new Promise((resolve) => {
            b2bAjax.beginMasqueradeCompany(masqueradeCompanyId, userId).then((respose) => {
                if (respose.code !== 200) {
                    return swal({
                        text: 'Company dashboard binding was unsuccessful. Please try again later.',
                        type: 'error',
                    });
                }
                resolve(true);
            });
        });
    },
    initCompanyInfo(status, customerId, fn) {
        const b2bCustomer = customerId || window.b2b.customer;
        window.b2b.$overlay.show();

        b2bAjax.getSelerep(b2bCustomer).then(res => {
            if (res.code !== 200) {
                // console.log(res.message);
            }

            const companyId = res.data.companyId;
            const companyName = res.data.companyName;

            sessionStorage.setItem('companyId', companyId);
            sessionStorage.setItem('companyName', companyName);
            sessionStorage.setItem('companyStatus', res.data.companyStatus);
            sessionStorage.setItem('SalerRep', 'true');
            // 2.3
            if (fn instanceof Function) {
                fn();
            }
            this.initEndMasqueradeBTn();
            window.b2b.initNavBtn();
            if (status) return;
            this.getCompanyList();
        });
    },
    initJqPagenation(data) {
        let pageNumber = 1;
        const pageLimit = 10;
        const that = this;
        const totle = Math.ceil(data.pagination.perCount / pageLimit);
        if (totle === 0) {
            return;
        }
        $('#jqPagination').jqPaginator({
            totalPages: Math.ceil(data.pagination.perCount / pageLimit),
            visiblePages: 10,
            currentPage: pageNumber,
            onPageChange(num) {
                if (pageNumber === num) return;
                window.b2b.$overlay.show();

                pageNumber = num;

                window.b2b.offset = (num - 1) * window.b2b.limit;

                that.getCompanyList(that.sortBy, that.orderBy);
            },
        });
    },
    getCompanyList(sortBy, orderBy) {
        window.b2b.$overlay.show();
        const q = this.q || '';
        const filter = {
            limit: window.b2b.limit,
            offset: window.b2b.offset,
            orderBy,
            sortBy,
            q,
        };

        b2bAjax.getCompanyList(window.b2b.userId, filter).then((res) => {
            this.renderCompanies(res);
        });
    },
    renderUserInfor(data) {
        $('.sale-name').text(`${data.firstName} ${data.lastName}`);
        $('.sale-email').text(data.email);
    },
    // render company list html
    renderCompanies(resopnse) {
        const data = resopnse.data;
        const list = data.list;
        const sessionCompanyId = sessionStorage.getItem('companyId');
        $('.record-total').text(data.pagination.totalCount);
        let frage = '';

        frage += list.map(item => `<tr class="${(sessionCompanyId === item.companyId) ? '' : ''}" id="${item.companyId}" data-company-id="${item.companyId}"><td><span class="company_name">${item.companyName}</span></td>
            <td class="col-product-info">
                <span class="company_admin">${item.companyAdminName}</span>
            </td>
            <td class="t-align-l" >
                <span class="email_address">${item.companyEmail}</span>
            </td>
            <td class="t-align-c col-sale-actions company_admin_impersonation">
            ${(sessionCompanyId === item.companyId) ? "<span class='selected'>selected</span>" : this.impersonationHtml}
        </td></tr>`);

        $('#sale-rep-table').find('tbody').html(frage);
        window.b2b.$overlay.hide();
    },
};
