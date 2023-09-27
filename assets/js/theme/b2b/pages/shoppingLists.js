import b2bAjax from '../common/ajax';
import checkB2bUser from '../common/checkB2bUser';
import '../tools/jqPaginator';
import swal from 'sweetalert2';
import statusNameByCode from '../common/shoppingListStatusName';

export default {
    init() {
        const gRoleId = sessionStorage.getItem('roleId');
        const $overlay = window.b2b.$overlay;
        const companyId = sessionStorage.getItem('companyId');
        window.b2b.isShowAll = 1;
        const isB2bUer = checkB2bUser();
        if (!isB2bUer) {
            window.location.href = '/';
        }
        if (gRoleId === '0' || gRoleId === '1') {
            $('#show_status_30').remove();
        }
        if (gRoleId === '3' && !companyId) {
            $('#show_status_30').remove();
            window.location.href = '/dashboard/';
        }

        this.loadTable($overlay, gRoleId);
        this.statusSwitch();

        $('#add_new_shoppingList').on('click', (e) => {
            e.preventDefault();
            const $form = $(e.target).parents('form');
            const name = $('#list_name', $form).val();
            const description = $('#list_comment', $form).val() || ' ';
            let status = '30';
            if (gRoleId === '0' || gRoleId === '1' || gRoleId === '3') {
                status = '0';
            }

            const data = {
                name,
                description,
                status,
            };
            $('#add_new_shoppingList').prop('disabled', true);
            b2bAjax.createShopingList(data).then((res) => {
                $('#add_new_shoppingList').prop('disabled', false);
                if (res.code !== 200) {
                    if (res.data.name) {
                        return swal({
                            type: 'error',
                            text: 'Please fill in a Shopping List Name',
                        });
                    }
                } else {
                    $('#list_name', $form).val('');
                    $('#list_comment', $form).val('');
                }
                this.loadTable($overlay, gRoleId);
                $('#modal-shopping-list-new-form').find('.modal-close').eq(0).click();
            });
        });
        // delete shopping list
        $('body').on('click', '[data-delete-list]', (e) => {
            const shoppingListId = $(e.target).attr('data-list-id');
            swal({
                text: 'Are you sure you want to delete this shopping list?',
                type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sure',
                closeOnConfirm: false,
            }).then(() => {
                b2bAjax.deleteShopingList(shoppingListId).then((res) => {
                    if (res.code !== 200) {
                        return swal({
                            text: 'Shopping List was not deleted. Please try again.',
                            type: 'error',
                        });
                    }
                    this.loadTable($overlay, gRoleId);
                });
            });
        });
        $('body').on('submit', '#modal-shopping-list-new-form .form', (e) => {
            e.preventDefault();
            $('#add_new_shoppingList', $(e.target)).trigger('click');
            return false;
        });
    },
    statusSwitch() {
        const $statusSwitchBtn = $('[filter-status]');
        const $shoppingListsTable = $('#shopping_lists_table');

        $statusSwitchBtn.on('click', (event) => {
            event.preventDefault();

            $(event.target).hide().siblings('[filter-status]').show();
            const status = $(event.target).attr('data-status-value');

            $shoppingListsTable.attr('css-status', status);
            if (status === 'all') {
                const allnum = $shoppingListsTable.find('tbody tr').length;
                $('#num_items').text(allnum);
            } else {
                const currentStatusNum = $shoppingListsTable.find(`tbody tr[data-status="${status}"]`).length;
                $('#num_items').text(currentStatusNum);
            }

            if (status === 'all') {
                window.b2b.isShowAll = '1';
                this.loadTable();
            } else if (status === '30') {
                // draf
                window.b2b.isShowAll = '2';
                this.loadTable();
            } else if (status === '0') {
                // approve
                window.b2b.isShowAll = '0';
                this.loadTable();
            } else if (status === '40') {
                // ready for approve
                window.b2b.isShowAll = '3';
                this.loadTable();
            }
        });
    },
    loadTable() {
        const gRoleId = sessionStorage.getItem('roleId');
        const $shoppingListsTable = $('#shopping_lists_table');
        const limit = '10';
        let offset = '0';
        let pageNumber = 1;
        const isShowAll = window.b2b.isShowAll;
        $shoppingListsTable.find('tbody').html('');
        window.b2b.$overlay.show();
        // TODO:REDUCE
        if (gRoleId === '0' || gRoleId === '1' || gRoleId === '3') {
            $shoppingListsTable.find('thead').html(`<tr>
                    <th>Name &amp; Description</th>
                    <th>Created By</th>
                    <th class="t-align-r">Items</th>
                    <th>Latest Activity</th>
                    <th>Status</th>
                    <th class="">Action</th>
                </tr>`);
        } else {
            $shoppingListsTable.find('thead').html(`<tr>
                    <th>Name &amp; Description</th>
                    <th class="t-align-r">Items</th>
                    <th>Latest Activity</th>
                    <th>Status</th>
                    <th class="t-align-l">Action</th>
                </tr>`);
        }
        b2bAjax.getShoppingListsInfo({ offset, limit, isShowAll }).then((res) => {
            this.renderTable(res.data.list, gRoleId);
            const pageTotalCount = res.data.pagination.totalCount;
            const pageLimit = res.data.pagination.limit;
            const allnum = $shoppingListsTable.find('tbody tr').length;

            $('#num_items').text(allnum);
            if (Math.ceil(pageTotalCount / pageLimit) === 0) {
                $('#jqPagination').html('');
                return;
            }
            $('#jqPagination').jqPaginator({
                totalPages: Math.ceil(pageTotalCount / pageLimit),
                visiblePages: 5,
                currentPage: pageNumber,
                onPageChange: (num) => {
                    if (pageNumber === num) return;
                    window.b2b.$overlay.show();
                    pageNumber = num;
                    offset = (num - 1) * limit;
                    b2bAjax.getShoppingListsInfo({ offset, limit, isShowAll: window.b2b.isShowAll }).then((respose) => {
                        this.renderTable(respose.data.list, gRoleId);
                    });
                },
            });
        });
    },
    renderTable(data, roleId) {
        const gRoleId = String(roleId);
        window.b2b.$overlay.show();

        let frag = '';
        $.each(data, (index, listData) => {
            const comment = listData.description;
            const createBy = `${listData.customerInfo.firstName} ${listData.customerInfo.lastName}`;
            const listItemNum = listData.totalCount;
            const latestDate = new Date(parseInt(listData.createdAt, 10) * 1000).toLocaleDateString().replace(/\//g, '/');
            const deleteBtn = this.deleteBtn(listData);
            const statusName = statusNameByCode(listData.status);
            // need  to reduce code

            if (gRoleId === '0' || gRoleId === '1' || gRoleId === '3') {
                if (listData.status.toString() !== '30') {
                    frag += `<tr data-status="${listData.status}" data-list="${JSON.stringify(listData)}">
                <td>
                    <div class="cell-line-name">${listData.name}</div>
                    <div class="cell-line-description">${comment}</div>
                </td>
                <td><span class="mobile-td-lable">Created By:</span>${createBy}</td>
                <td class="t-align-c"><span class="mobile-td-lable">Items:</span>${listItemNum}</td>
                <td><span class="mobile-td-lable">Latest Activity:</span>${latestDate}</td>
                <td><span class="mobile-td-lable">Status:</span>${statusName || ''}</td>
                <td class="t-align-r actions-field"><a class="button button--primary button--small" href="/shopping-list/?list_id=${listData.id}">View</a>${deleteBtn}</td>
            </tr>`;
                }
            } else {
                frag += `<tr data-status="${listData.status}" data-list="${JSON.stringify(listData)}">
                <td>
                    <div class="cell-line-name">${listData.name}</div>
                    <div class="cell-line-description">${comment}</div>
                </td>
                <td class="t-align-c"><span class="mobile-td-lable">Items:</span>${listItemNum}</td>
                <td><span class="mobile-td-lable">Latest Activity:</span>${latestDate}</td>
                <td><span class="mobile-td-lable">Status:</span>${statusName || ''}</td>
                <td class="t-align-r actions-field"><a class="button button--primary button--small" href="/shopping-list/?list_id=${listData.id}">View</a>${deleteBtn}</td>
            </tr>`;
            }
        });
        $('#shopping_lists_table').find('tbody').html(frag);
        const $shoppingListsTable = $('#shopping_lists_table');
        const allnum = $shoppingListsTable.find('tbody tr').length;
        $('#num_items').text(allnum);
        window.b2b.$overlay.hide();
    },
    deleteBtn(listData, gRoleId) {
        let deleteBtn = '';
        let isOwn = false;
        const userId = sessionStorage.getItem('userId');
        // own list(for all user) and not the ready for approval status(for junior buyer)
        const notReadyForApproval = (listData.status.toString() !== '40');
        const notJuniorApproval = !(gRoleId === '0' && listData.status.toString() !== '30');
        const listUserId = listData.customerInfo.userId;

        if (listUserId && (listUserId.toString() === userId)) {
            isOwn = true;
        }
        if (isOwn && notReadyForApproval && notJuniorApproval) {
            deleteBtn = `<a class="button button--small" href="javascript:void(0);" data-delete-list data-list-id="${listData.id}">Delete</a>`;
        } else {
            deleteBtn = '<a class="button button--small" href="javascript:void(0);" disabled>Delete</a>';
        }
        return deleteBtn;
    },
};
