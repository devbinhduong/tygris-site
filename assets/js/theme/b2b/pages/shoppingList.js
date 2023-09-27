import b2bAjax from '../common/ajax';
import swal from 'sweetalert2';
import Url from 'url';
import utils from '@bigcommerce/stencil-utils';
import _ from 'lodash';
import { defaultModal } from '../../global/modal';
import AdvQuantityUtil from '../common/advQuantity';
// import b2bCart from '../common/b2bCart';
import filterEmptyFilesFromForm from '../common/filterEmptyFilesFromForm';
import isB2bUser from '../common/checkB2bUser';
import currencyFormat from '../common/currencyFormat';
import getPrice from '../common/getPrice';
import getCsrfToken from '../common/getCsrfToken';
import setPrice from '../common/setPrice';
import addProducts from '../common/addProducts';

export default {
    listDataStatus: { },
    ShoppingListInfo: { },

    init(context) {
        window.money = context.b2bSettings.money;
        const userId = sessionStorage.getItem('userId');
        const url = Url.parse(window.location.href, true);
        const listID = url.query.list_id || '';
        const roleId = sessionStorage.getItem('roleId');

        this.checkListId(listID);
        window.b2b.gTierPrice = {};
        window.b2b.shoppingListId = listID;
        window.b2b.$overlay.show();
        window.b2b.userId = userId;
        window.b2b.roleId = roleId;
        window.b2b.offset = 0;
        window.b2b.limit = 100;
        if (!isB2bUser()) {
            window.location.href = '/';
        }
        this.initCart();
        this.getShoppingListItems(true);
        this.initBtn(listID);
        this.initCsv();
        window.b2b.csrfToken = getCsrfToken();
    },
    getShoppingListItems(init) {
        b2bAjax.getShoppingListItemsExtension({ id: window.b2b.shoppingListId, offset: window.b2b.offset, limit: window.b2b.limit }).then((res) => {
            if (res.code !== 200) {
                // console.log(res.message);
                return swal({
                    text: res.message,
                    type: 'error',
                });
            }
            const listData = res.data;
            this.ShoppingListInfo = res.data;
            window.b2b.shoppingListStatus = listData.status;
            window.b2b.isOwner = listData.isOwner;
            this.listDataStatus = listData.status;
            $('#list_name').val(res.data.name);
            $('#list_comment').val(res.data.description);
            this.loadTable(window.b2b.shoppingListId, window.b2b.userId, listData, window.b2b.roleId);
            if (init) {
                this.initJqPagenation(res.data);
            }
        });
    },
    initJqPagenation(data, reload) {
        if ($('.b2b-column-right #jqPagination').length === 0) {
            $('.b2b-column-right').append(`<ul class="pagination-list" id="jqPagination"></ul>
            `);
        }
        if (reload) {
            $('.b2b-column-right #jqPagination').html('');
        }
        $('#totle_list_products').html(`| ${data.pagination.totalCount} Total`);
        let pageNumber = 1;
        const that = this;
        const pageLimit = 100;
        const totle = Math.ceil(data.pagination.totalCount / pageLimit);
        if (totle === 0) {
            $('#jqPagination').html('');
            return;
        }
        $('#jqPagination').jqPaginator({
            totalPages: Math.ceil(data.pagination.totalCount / pageLimit),
            visiblePages: 10,
            currentPage: pageNumber,
            onPageChange(num) {
                if (pageNumber === num) return;
                window.b2b.$overlay.show();

                pageNumber = num;

                window.b2b.offset = (num - 1) * 100;
                that.getShoppingListItems();
            },
        });
    },
    setStatusSelector(listStatu) {
        const gRoleId = sessionStorage.getItem('roleId');
        const $statusSelect = $('#shopping_list_status');
        const updateListSelector = '[update-list-items]';
        const gListStatusObj = {
            0: 'Approved',
            20: 'Deleted',
            30: 'Draft',
            40: 'Ready for Approval',
        };
        const listStatus = String(listStatu);
        if (gRoleId === '2') {
            // junior buyer
            if (listStatus === '30') {
                $statusSelect.html(`
                <option value="${listStatus}" selected>${gListStatusObj[listStatus]}</option>
                <option value="40">${gListStatusObj[40]}</option>
            `);
                $statusSelect.val(listStatus);
            } else {
                $statusSelect.html(`<option value="${listStatus}">${gListStatusObj[listStatus]}</option>`);
                $statusSelect.val(listStatus);
                $('[data-update-status]').remove();
                $('#select_all').remove();
                $('[data-delete-items]').remove();
                $(`${updateListSelector}`).remove();
                $('.b2b-column-right').css('width', '100%');
            }
        } else if (gRoleId === '0' || gRoleId === '1') {
            // admin & senior buyer
            if (listStatus === '40') {
                $statusSelect.html(`
                <option value="${listStatus}" selected>${gListStatusObj[listStatus]}</option>
                <option value="0">${gListStatusObj['0']}</option>
                <option value="30">${gListStatusObj['30']}</option>
            `);
                this.readyApprovalStatus(listStatus);
            } else {
                $statusSelect.html(`<option value="${listStatus}">${gListStatusObj[listStatus]}</option>`);
                $('[data-update-status]').remove();
            }
        } else if (gRoleId === '3') {
            $statusSelect.html(`<option value="${listStatus}">${gListStatusObj[listStatus]}</option>`);
            $('[data-update-status]').remove();
            this.readyApprovalStatus(listStatus);
        }

        this.hideReadyApprovalBtn(listStatus, gRoleId);
    },
    initCsv() {
        const resetCsvFileUpload = () => {
            $('#csv_check_info').html('');
            $('#csv_products_list').html('');
            $('#customer_sku_csv').val('');
        };
        // after upload csv file, directly add csv products to list
        const addCsvProductsToList = (products) => {
            const data = {
                id: window.b2b.shoppingListId,
                items: [],
            };
            for (const item of products) {
                const optionList = [];
                for (const optionListItem of item[4]) {
                    optionList.push({
                        option_id: `attribute[${optionListItem.option_id}]`,
                        option_value: `${optionListItem.id}`,
                    });
                }
                data.items.push({
                    productId: item[0],
                    variantId: item[1],
                    qty: item[3],
                    optionList,
                });
            }
            this.addToShoppingList(data, true);
        };
        const UploadDealcsv = () => {};
        const parseCsv = new UploadDealcsv();
        /* ------ Method for read uploded csv file ------*/
        UploadDealcsv.prototype.getCsv = () => {
            const input = document.getElementById('customer_sku_csv');
            input.addEventListener('change', (e) => {
                const that = e.target;
                if (that.files && that.files[0]) {
                    const uploadFile = that.files[0];
                    if ((uploadFile.name).indexOf('.csv') === -1) {
                        return swal({
                            text: 'Please upload a CSV file',
                            type: 'error',
                        });
                    }
                    const reader = new FileReader();
                    reader.addEventListener('load', (b) => {
                        resetCsvFileUpload();
                        const csvdata = b.target.result;
                        parseCsv.validation(csvdata);
                    });
                    reader.readAsBinaryString(uploadFile);
                }
            });
        };
        // /*------- Method for parse csv data and display --------------*/
        // eslint-disable-next-line func-names
        UploadDealcsv.prototype.validation = function (content) {
            const $csvCheckInfoContainer = $('#csv_check_info');
            $csvCheckInfoContainer.html('<p class="checking-tips">Checking file...</p>');
            const parsedata = [];
            let originArr = [];
            let errorCounter = 0;
            window.b2b.$overlay.show();
            if (content) {
                originArr = content.split('\n');
            }

            parseCsv.removeEmptyRow(originArr);
            const unEmptyArr = originArr;

            let columns = 0;
            if (unEmptyArr && unEmptyArr.length > 0) {
                const headerRow = unEmptyArr[0];
                const headerArr = headerRow.split(',');
                // ["variant_sku", "qty", "options", "", ""]
                parseCsv.removeEmptyRow(headerArr);
                columns = headerArr.length;
            } else {
                $csvCheckInfoContainer.html('<div class="checking-info-box">Empty file, please upload another.</div>');
                return null;
            }
            for (let i = 1; i < unEmptyArr.length; i++) {
                const productIdsArr = '';
                const dataItem = unEmptyArr[i].split(',');

                parseCsv.removeEmptyRow(dataItem);

                let errorInfo = '';
                if (dataItem.length > columns) {
                    errorInfo += 'redundant data; ';
                } else {
                    dataItem.length = columns;
                }
                if (!dataItem[0]) {
                    errorInfo += 'variant_sku can\'t be empty; ';
                }
                if (!(dataItem[1]).replace(/[\r\n]/g, '') || (dataItem[1]).replace(/[\r\n]/g, '') === '0') {
                    errorInfo += 'qty can\'t be empty; ';
                }
                if (/\./.test(dataItem[1]) || /\-/.test(dataItem[1])) {
                    errorInfo += 'qty must be an integer; ';
                }

                if (errorInfo.trim() !== '') {
                    errorCounter++;
                    $csvCheckInfoContainer.append(`<div>#ROW ${i + 1}: ${errorInfo}</div>`);
                }
                const productDataArr = productIdsArr.concat(dataItem);
                parsedata.push(productDataArr);
            }

            if (errorCounter === 0) {
                // advQty check
                const csvdataArr = parsedata.map((item) => ({
                    sku: item.split(',')[0],
                    qty: Number.parseInt(item.split(',')[1], 10),
                }));
                const keywords = [];
                parsedata.forEach(item => {
                    keywords.push(item.split(',')[0]);
                });
                let variantSkus = [];
                const newData = [];
                csvdataArr.forEach(item => {
                    variantSkus.push(item.sku);
                });
                variantSkus = Array.from(new Set(variantSkus));
                b2bAjax.getProductsBySkuQuickByPost({ variantSkus }).then((res) => {
                    res.data.forEach(item => {
                        csvdataArr.forEach(cItem => {
                            if (item.variantSku === cItem.sku) {
                                newData.push([
                                    item.productId,
                                    item.variantId,
                                    item.variantSku,
                                    cItem.qty,
                                    item.option ? item.option : '',
                                ]);
                            }
                        });
                    });
                    if (newData.length > 0) {
                        AdvQuantityUtil.csvProductsQtyCheck(csvdataArr, () => {
                            $csvCheckInfoContainer.html('<div>File has been processed</div>');
                            addCsvProductsToList(newData);
                        }, () => {
                            $csvCheckInfoContainer.append('<div style="font-weight:600;">Your file doesn\'t pass our "Advance Quantity" check, please correct them and upload the file again.</div>');
                            $csvCheckInfoContainer.find('.checking-tips').remove();
                        });
                    } else {
                        $csvCheckInfoContainer.html('<div class="checking-info-box">File could not be processed. Please re-upload with correct data.</div>');
                    }
                    return newData;
                });
            } else {
                $csvCheckInfoContainer.append(`<div style="font-weight:600;">Your file has ${errorCounter} errors, please correct them and upload the file again.</div>`);
                $csvCheckInfoContainer.find('.checking-tips').remove();
                window.b2b.$overlay.hide();
                return parsedata;
            }
        };

        UploadDealcsv.prototype.isEmptyRow = (arr) => {
            // [,,,,,]
            const tmpArr = arr.split(',');
            for (let k = 0; k < tmpArr.length; k++) {
                // if (tmpArr[k] && tmpArr[k] !== '' && tmpArr[k] !== null) {
                if (tmpArr[k]) {
                    return false;
                }
            }
            return true;
        };
        UploadDealcsv.prototype.removeEmptyRow = (arr) => {
            const tmpArr = arr;
            if (parseCsv.isEmptyRow(tmpArr[tmpArr.length - 1])) {
                tmpArr.pop();
                parseCsv.removeEmptyRow(tmpArr);
            } else {
                return tmpArr;
            }
        };

        parseCsv.getCsv();
    },
    // if Ready for Approval
    readyApprovalStatus(listStatus) {
        if (listStatus === '40') {
            const updateListSelector = '[update-list-items]';

            $('#select_all').remove();
            $('[data-delete-items]').remove();
            $(`${updateListSelector}`).remove();
            $('.b2b-column-right').css('width', '100%');
            $('#add_to_cart').hide();
        }
    },
    // if Ready for Approval,user can not change
    hideReadyApprovalBtn(listStatus) {
        const frageStyle = `
            <style>
            [update-list-items],.action-lists{
                display:none!important;
            }
            .col-checkbox{
                opacity:0;
            }
            </style>
        `;
        const status = listStatus === '40';

        if (status) {
            $('head').append(frageStyle);
        }
    },
    addToShoppingList(item, last) {
        b2bAjax.addProductToShoppingList(item).then((res) => {
            if (res.code !== 200) {
                swal({
                    text: res.message,
                    type: 'error',
                });
            }

            if (res.code === 200 && last) {
                swal({
                    text: 'Product(s) added to the shopping list successfully.',
                    type: 'success',
                });
                this.reloadTable();
            }
            window.b2b.$overlay.hide();
            $('#csv_check_info').html('');
        });
    },
    initCsvProduct($response, productQty, variantId, $csvProdcutsTbody, productOptions, $checkBox) {
        let optionList = [];
        if (productOptions.length > 0) {
            $.each(productOptions, (i, option) => {
                optionList.push({
                    option_id: `attribute[${option.id}]`,
                    option_value: `${option.option_id}`,
                });
            });
        }
        optionList = JSON.stringify(optionList);
        $response.find('#product_qty_id').val(productQty);
        $response.attr('data-variant-id', variantId);
        $response.attr('data-product-options', optionList);
        $checkBox.prop('checked', true);
        $csvProdcutsTbody.append($response);
    },
    checkListId(listID) {
        // check list id if is exsit
        if (!listID) {
            swal({
                text: 'The shopping list you are to looking is not exist.',
                type: 'error',
            });
            window.location.href = '/shopping-lists/';
        }
    },
    initCart() {
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
    },
    loadTable(listID, userId, listData, roleId) {
        const $shoppingListTable = $('#shopping_list_table');
        const $selectAll = $('#select_all');
        const listStatus = String(listData.status);

        window.b2b.$overlay.show();
        $shoppingListTable.find('tbody').html('');
        $selectAll.prop('checked', false);
        $('#unavailable_info_box').hide();

        this.setStatusSelector(listStatus);
        if (listData.customerInfo.id !== userId) {
            if ($('#delete_list').length > 0) {
                $('#delete_list').remove();
            }
        }

        this.renderListInformation(listData);
        this.renderListProducts(listData);

        // sale rep can't modify other customer's shopping-list
        if (roleId === '3' && window.b2b.isOwner !== '1') {
            $('.rename-shopping-list').hide();
        }

        if (roleId === '0' || roleId === '1' || roleId === '3') {
            if (listStatus === '40') {
                $('.toolbar-actions').html(`
                    <button href="javascript:void(0);" class="action action--primary" id="pending_approval">Approve Shopping List</button>
                    <button href="javascript:void(0);" class="action" id="reject_approval">Revert to Draft</button>`);
                $('.table-toolbar .action-links').remove();
                $('#quick_add_section').remove();
                $('[data-rename-list]').remove();
            } else if (listStatus === '30' && roleId !== '3') {
                $('#add_to_cart').remove();
            }
        } else if (roleId === '2') {
            $('#add_to_cart').remove();
            if (listStatus !== '30') {
                $('.toolbar-actions').remove();
                $('.table-toolbar .action-links').remove();
                $('#quick_add_section').remove();
                $('[data-rename-list]').remove();
            }
        }
        window.b2b.$overlay.hide();
    },
    renderListInformation(listData) {
        let listInfoHtml = '';

        if (listData.createdAt) {
            const createdAt = new Date(parseInt(listData.createdAt, 10)).toLocaleDateString().replace(/\//g, '/');
            listInfoHtml += `
                        <div>
                            <b>Date Created: </b><span>${createdAt}</span>
                        </div>`;
        }
        if (listData.updatedAt) {
            const updatedAt = new Date(parseInt(listData.updatedAt, 10)).toLocaleDateString().replace(/\//g, '/');
            listInfoHtml += `
                        <div>
                            <b>Last Updated: </b><span>${updatedAt}</span>
                        </div>`;
        }
        if (listData.customerInfo) {
            let createdBy;
            if (listData.customerInfo.firstName) {
                createdBy = `${listData.customerInfo.firstName} `;
            }
            if (listData.customerInfo.lastName) {
                createdBy += listData.customerInfo.lastName;
            }

            listInfoHtml += `
                        <div>
                            <b>Created By: </b><span>${createdBy}</span>
                        </div>`;
        }
        $('#shopping_list_detail').html(listInfoHtml);

        $('#shopping_list_name').text(listData.name);
        $('#list_comment').text(listData.description);
        if (listData.description && listData.description.trim() !== '') {
            $('#shopping_list_comment').html(`<b>Descriptions: </b>${listData.description}`);
        } else {
            $('#shopping_list_comment').html(' ');
        }
    },
    renderListProducts(listData) {
        if (listData.products && listData.products.length > 0) {
            // const listItems = listData.products;
            const listItemsData = listData.products;
            const gListObj = {};
            const $shoppingListTable = $('#shopping_list_table');
            const gRoleId = sessionStorage.getItem('roleId');

            // this.checkproductsAvailable(listData.products).then(res => {
            // const availablesProducts = res.availables;
            gListObj.products = [];
            $('#num_items').text(listItemsData.length);

            for (let z = 0; z < listItemsData.length; z++) {
                const listItemData = listItemsData[z];
                const productId = listItemData.productId;
                const variantId = listItemData.variantId;
                const productQuantity = parseInt(listItemData.qty, 10);
                const optionsList = listItemData.optionsList || [];
                const optionListData = JSON.stringify(optionsList);
                const indexI = z;
                const productTitle = listItemData.productName;
                let productImage = '';
                // let inCatalog = true;
                let listStatus = window.b2b.shoppingListStatus;
                listStatus = String(listStatus);
                const varaintOptionList = optionsList;
                const itemId = listItemData.itemId;
                if (listItemData.primaryImage && listItemData.primaryImage.urlThumbnail) {
                    productImage = listItemData.primaryImage.urlThumbnail;
                }

                const productSku = listItemData.variantSku ? listItemData.variantSku : listItemData.baseSku;

                const productPriceValue = parseFloat(listItemData.basePrice).toFixed(2);
                // const productPrice = `$${productPriceValue}`;
                const productUrl = listItemData.productUrl;


                gListObj.products.push({
                    product_id: productId,
                    variant_id: variantId,
                    qty: productQuantity,
                    options_list: optionsList,
                });

                const tr = `<tr data-index="${indexI}" data-index-${indexI} data-product-${productId} data-product-id="${productId}" data-variant-id="${variantId}" data-in-catalog="true" data-product-options='${optionListData}' data-item-id='${itemId}'>
                            <td class="col-checkbox"><input type="checkbox"></td>
                            <td class="col-product-info">

                                <div class="product-iamge"><img src="${productImage}" alt="${productTitle}"></div>
                                <div class="product-description">
                                    <div class="product-title"><a href="${productUrl}">${productTitle}</a></div>
                                    <div class="product-options"></div>
                                    <div class="product-attribute product-sku"><span>SKU: </span>${productSku}</div>
                                </div>
                            </td>
                            <td class="t-align-r col-product-price" data-product-price-value="${productPriceValue}"><span class="mobile-td-lable">Price:</span><span class="product-price" data-main-price="${productPriceValue}" ><span class="loading-span"></span></span></td>
                            <td class="t-align-r col-product-qty" data-product-quantity><span class="mobile-td-lable">Qty:</span><input type="text" value="${productQuantity}" class="input-text qty" autocomplete="off" data-advqty-sku="${productSku}" disabled></td>
                            <td class="t-align-r col-action">
                                <div class="action-wrap">
                                    <div class="product-subtotal"><span class="mobile-td-lable">Subtotal:</span><span class="product-subtotal-span"><span class="loading-span"></span></span></div>
                                    <div class="action-lists">

                                        <a class="button button--primary button--small" href="javascript:void(0);" update-list-items>Update Quantity</a>
                                        <a class="button button--primary button--small square list-button-remove" href="javascript:void(0);"><i class="fa fa-delete" data-delete-item></i></a>
                                    </div>
                                </div>

                            </td>
                        </tr>`;
                utils.api.product.getById(productId, {
                    template: 'b2b/product-view-data',
                }, (err, response) => {
                    this.productDetail(response, productId, indexI, optionsList, productQuantity, varaintOptionList);
                });
                $shoppingListTable.find('tbody').append(tr);

                // DO NOT USE product_id, the items may has same product_id
                $(`tr[data-index-${indexI}]`).find('input.qty').bind('change', (event) => {
                    this.qtyChange(event);
                }).on('keyup', (event) => {
                    AdvQuantityUtil.handleQuantityKeyup(event);
                });
                if (listStatus === '40') {
                    $('.col-action .action-lists').hide();
                    $shoppingListTable.find('tbody input').prop('disabled', true);
                }

                if (gRoleId === '2') {
                    if (listStatus === '0') {
                        $('.col-action .action-lists').hide();
                        $shoppingListTable.find('tbody input').prop('disabled', true);
                    }
                }
                const $scope = $('#shopping_list_table');
                setTimeout(() => {
                    getPrice(listItemData.productId, optionsList).then((response) => {
                        if (response) {
                            setPrice(response, $scope, productQuantity);
                        }
                    });
                }, 20);
            }
            // set up advqty
            const $qtyInputs = $shoppingListTable.find('tbody input.qty');
            AdvQuantityUtil.setUpAdvQtyMulti($qtyInputs, {
                bindInputEvents: false,
                bindButtonEvents: false,
                tips: true,
                multiCheck: false,
                multiCheckMsg: 'Please review your shopping list, one or more items have an invalid quantity.',
            });
            // });
        } else {
            $('#num_items').text('0');
        }
    },
    productDetail(response, productId, indexI, optionList, productQuantity, varaintOptionList) {
        const tepProductId = productId;
        const tmpIndex = indexI;
        const $productInfo = $(response);
        const productUrl = $productInfo.attr('data-product-url');
        $(`[data-product-${tepProductId}]`).find('.product-title a').attr('href', productUrl);
        $(`[data-product-${tepProductId}]`).find('[product-url]').attr('href', productUrl);

        // hundle options
        const optionsStr = $productInfo.attr('data-product-options');
        if (optionsStr && optionsStr !== '[]') {
            const optionsArr = JSON.parse(optionsStr);
            const selectedOptionsArr = optionList;
            const pickListArr = [];
            const productIds = [];
            const listStatus = window.b2b.shoppingListStatus;
            const gRoleId = sessionStorage.getItem('roleId');

            let optionHtml = '';

            for (let oi = 0; oi < optionsArr.length; oi++) {
                const option = optionsArr[oi];
                const optionId = `attribute[${option.id}]`;
                const optionRequired = option.required;
                let optionExist = false;
                for (let oj = 0; oj < selectedOptionsArr.length; oj++) {
                    const selectedOption = selectedOptionsArr[oj];
                    if (optionId === selectedOption.option_id) {
                        optionExist = true;

                        if (option.partial === 'input-text') {
                            optionHtml += `<span class="option-name">${option.display_name}:</span> ${selectedOption.option_value} </br>`;
                        } else if (option.partial === 'input-checkbox') {
                            optionHtml += `<span class="option-name">${option.display_name}:</span> Yes </br>`;
                        } else if (option.values) {
                            const optionValues = option.values;

                            for (let ok = 0; ok < optionValues.length; ok++) {
                                if (optionValues[ok].id === selectedOption.option_value) {
                                    optionHtml += `<span class="option-name">${option.display_name}:</span> ${optionValues[ok].label} </br>`;
                                    // pick list option
                                    if (option.partial === 'product-list') {
                                        const pickedOptionId = option.id;
                                        const pickedOptionValue = optionValues[ok].id;
                                        const pickedProductId = optionValues[ok].data;
                                        pickListArr.push({
                                            pickedOptionId,
                                            pickedOptionValue,
                                            pickedProductId,
                                        });
                                        productIds.push(pickedProductId);
                                    }
                                }
                            }
                        }
                    }
                }
                // has required option, and this option not exist
                if (optionRequired && !optionExist) {
                    optionHtml += `<span class="option-name">${option.display_name}:</span> <i class="no-option-value-tip" no-option-value>Click 'Edit Options' to set a value for this option.</i> </br>`;
                }
            }

            const $priceSpan = $(`[data-index-${tmpIndex}]`).find('.product-price');
            // pick list option
            if (productIds && productIds.length > 0) {
                this.getTierPriceByProductIdMulti(productIds, productQuantity, () => {
                    this.getVariantOptions($priceSpan, pickListArr, varaintOptionList);
                });
            }

            $(`tr[data-index-${tmpIndex}]`).find('.product-options').html(optionHtml);

            if (listStatus !== '40' && gRoleId !== '2') {
                $(`tr[data-index-${tmpIndex}]`).find('.action-lists .list-button-remove').before('<a class="button button--primary button--small" href="#" data-edit-option><i class="fa fa-edit"></i> Edit Options</a>');
            }
            if (listStatus === '30' && gRoleId === '2') {
                $(`tr[data-index-${tmpIndex}]`).find('.action-lists .list-button-remove').before('<a class="button button--primary button--small" href="#" data-edit-option><i class="fa fa-edit"></i> Edit Options</a>');
            }
        }
    },
    async checkproductsAvailable(data) {
        return new Promise((resolve) => {
            let products = {};
            const prodtctArry = [];
            $.each(data, (index, item) => {
                prodtctArry.push(item.productId);
            });
            const params = prodtctArry.join('|');
            b2bAjax.checkAvailableProducts(params).then((res) => {
                if (res.code !== 200) {
                    return swal({
                        text: res.message,
                        type: 'error',
                    });
                }
                products = res.data;
                resolve(products);
            });
        });
    },
    initBtn(listID) {
        const $selectAll = $('#select_all');
        const $shoppingListTable = $('#shopping_list_table');
        // stagger searching for 200ms after last input
        window.b2b.doSearch = _.debounce((searchQuery) => {
            if (searchQuery.length < 2) return null;
            $('#loading-span').show();
            $('.more-results').hide();
            $('#product_search_results').html('');
            utils.api.search.search(searchQuery, {
                template: 'b2b/shopping-list-search-results-data',
            }, (err, response) => {
                $('#loading-span').hide();
                const productIds = [];
                const re = /data-product-id="(\w+)"/g;
                while (re.exec(response)) {
                    productIds.push(RegExp.$1);
                }
                if (err || productIds.length === 0) {
                    return $('#product_search_results').html('<div style="margin-bottom:1.5rem;">No products found.</div>');
                }

                const limit = 3;
                const searchProduct = (productId) => new Promise((resolve) => {
                    $('#product_search_results').append(`<table class="search-product-table ${productId}" id="product_search_result_table" product-search-result-table style="margin-bottom:1.5rem;"><tbody id="${productId}" class="loading-span"></tbody></table>`);
                    utils.api.product.getById(productId, {
                        template: 'b2b/shopping-list-search-results-item',
                    }, (error, res) => {
                        $(`#${productId}`).removeClass('loading-span').html(res);
                        const sku = $(res).attr('data-product-base-sku');
                        const $qtyInput = $(`#product_search_results input[name=${productId}]`);
                        const $optionLabels = $(`#product_search_result_table.${productId}`).find('label[data-product-attribute-value]');
                        $.each($optionLabels, (index, item) => {
                            const $optionLabel = $(item);
                            const $optionInput = $optionLabel.prev();
                            const optionId = $optionLabel.attr('for');
                            const newOptionId = `s_${index}_${optionId}`;
                            $optionLabel.attr('for', newOptionId);
                            $optionInput.attr('id', newOptionId);
                        });
                        $qtyInput.attr('data-advqty-sku', sku);
                        this.setUpSearchResultsAdvQty($qtyInput);
                        resolve();
                    });
                });

                let searchs = [];
                const showProduct = (keep) => {
                    if (!keep) $('#product_search_results').html('');
                    searchs = productIds.splice(0, limit).map(item => searchProduct(item));
                    Promise.all(searchs).then(() => {
                        $('.more-results').toggle(!!productIds.length);
                    });
                };
                $('.more-results').off('click').on('click', () => {
                    showProduct(true);
                });
                showProduct();
            });
        }, 500);
        // rename list
        $('#rename_list').on('click', (e) => {
            const $form = $(e.target).parents('form');
            const name = $('#list_name', $form).val();
            const description = $('#list_comment', $form).val() || ' ';
            const id = listID;
            const status = window.b2b.shoppingListStatus;
            if (name === '') {
                return swal({
                    type: 'error',
                    text: 'Please fill in a Shopping List Name',
                });
            }
            this.ShoppingListInfo = Object.assign(this.ShoppingListInfo, {
                name,
                description,
            });
            window.b2b.$overlay.show();
            b2bAjax.updateShoppingList({
                name, description, status, id,
            }).then((res) => {
                if (res.code !== 200) {
                    if (res.data.name) {
                        return swal({
                            type: 'error',
                            text: 'Name can not be empty',
                        });
                    }
                    if (res.data.description) {
                        return swal({
                            type: 'error',
                            text: 'Description can not be empty',
                        });
                    }
                }
                swal({
                    text: 'Shopping List Info changed successfully',
                    type: 'success',
                });
                this.renderListInformation(this.ShoppingListInfo);
                $('#modal-shopping-list-rename-form').find('.modal-close').eq(0).click();
            });
        });
        // select
        $selectAll.on('click', () => {
            if ($selectAll.prop('checked') === true) {
                $shoppingListTable.find('.col-checkbox input[type=checkbox]').prop('checked', true);
                $shoppingListTable.find('.col-checkbox input[type=checkbox]:disabled').prop('checked', false);
            } else {
                $shoppingListTable.find('.col-checkbox input[type=checkbox]').prop('checked', false);
            }
        });
        $('#search_single_sku').on('click', () => {
            const searchQuery = $('#product_search_input').val();
            if (searchQuery.length >= 2) {
                window.b2b.doSearch(searchQuery);
            } else if (searchQuery.length === 0) {
                $('#product_search_results').html('');
            }
        });
        $('#product_search_input').on('keyup', () => {
            const searchQuery = $('#product_search_input').val();
            if (searchQuery.length === 0) $('#product_search_results').html('');
            else window.b2b.doSearch(searchQuery);
        });
        // list - edit - options
        $('body').on('click', '[data-edit-option]', event => {
            const $target = $(event.currentTarget);
            const $tr = $target.parents('tr');
            const productId = $tr.attr('data-product-id');
            const variantId = $tr.attr('data-variant-id');
            const itemIndex = $tr.attr('data-index');
            const itemOptions = $tr.attr('data-product-options');
            const skuHtml = $tr.find('.product-sku').html();
            window.b2b.shopingListItemId = $(event.target).parents('tr').attr('data-item-id');

            event.preventDefault();
            // edit item in cart
            this.listEditOptions(productId, variantId, itemIndex, itemOptions, skuHtml);
        });
        // delete all
        $('body').on('click', '[data-delete-items]', () => {
            const $checkedInputs = $shoppingListTable.find('tbody tr input[type=checkbox]:checked');
            if ($checkedInputs.length === 0) {
                return swal({
                    text: 'Please select an item',
                    type: 'error',
                });
            }
            swal({
                text: 'Are you sure you want to delete selected item(s) from the shopping list?',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ff0000',
                confirmButtonText: 'Delete',
            }).then(() => {
                $checkedInputs.each((index, item) => {
                    const shoppingListId = window.b2b.shoppingListId;
                    const itemId = $(item).parents('tr').attr('data-item-id');
                    const lastItem = ($checkedInputs.length === (index + 1));
                    window.b2b.$overlay.show();
                    this.deletItem(shoppingListId, itemId, lastItem);
                });
            }).catch(() => {
                // console.info('cancel del item(s)');
            });
        });
        // delete one
        $('body').on('click', '[data-delete-item]', (event) => {
            swal({
                text: 'Are you sure you want to delete selected item from the shopping list?',
                type: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ff0000',
                confirmButtonText: 'Delete',
                closeOnConfirm: false,
            }).then(() => {
                const shoppingListId = window.b2b.shoppingListId;
                const itemId = $(event.target).parents('tr').attr('data-item-id');
                window.b2b.$overlay.show();
                this.deletItem(shoppingListId, itemId, true);
            }).catch(() => {
                // console.info('cancel del item');
            });
        });
        // update item qty
        $('body').on('click', '[update-list-items]', (event) => {
            const $this = $(event.target);
            const shoppinglistId = window.b2b.shoppingListId;
            const itemId = $this.parents('tr').attr('data-item-id');
            const qty = $this.parents('tr').find('input.qty')[0].value;
            window.b2b.$overlay.show();
            b2bAjax.updateShoppingListItme({ shoppinglistId, itemId, qty }).then(() => {
                swal({
                    type: 'success',
                    text: 'Product quantity updated successfully',
                });
                this.reloadTable();
            });
        });
        // save option click
        $('body').on('click', '[data-update-option]', event => {
            // update items
            window.b2b.$overlay.show();
            const optionList = [];
            const $target = $(event.target);
            const $modal = $target.parents('.modal');
            const form = $('form', $modal)[0];
            const formData = filterEmptyFilesFromForm(new FormData(form));
            $target.prop('disabled', true);
            for (const item of formData) {
                if (item[0].indexOf('attribute') !== -1 && item[1] !== '') {
                    const optionObj = {
                        option_id: item[0],
                        option_value: item[1],
                    };
                    optionList.push(optionObj);
                }
            }
            const variantId = $('#variant_id_container').attr('data-variant-id');

            if (!variantId) {
                return swal({
                    text: 'No variant Id',
                    type: 'error',
                });
            }
            const data = {
                shoppinglistId: window.b2b.shoppingListId,
                itemId: window.b2b.shopingListItemId,
                optionList,
                variantId,
            };

            b2bAjax.updateShoppingListItme(data).then(() => {
                defaultModal().close();
                swal({
                    type: 'success',
                    text: 'Product options updated successfully',
                });
                this.reloadTable();
            });
        });
        $('body').on('submit', '#modal-shopping-list-rename-form .form', (e) => {
            $('#rename_list', $(e.target)).trigger('click');
            return false;
        });
        // option change
        utils.hooks.on('product-option-change', (event, option) => {
            const $changedOption = $(option);
            const $form = $changedOption.parents('form');
            const $messageBox = $('.alertMessageBox');
            const productId = $('[name="product_id"]', $form).attr('value');
            const priceContainer = $(event.target).parents('.product-options').find('.product-price');
            // for edit options
            const $submit = $('#btn_option_update', $form);
            const $skuModal = $form.parents('.modal-body').find('[data-product-sku]');


            // for search results
            const $tr = $changedOption.parents('tr');
            const $sku = $('[data-product-sku]', $tr);
            const $checkbox = $('input[type=checkbox]', $tr);

            $submit.prop('disabled', true);
            $checkbox.prop('disabled', true);
            utils.api.productAttributes.optionChange(productId, $form.serialize(), (err, result) => {
                const data = result.data || {};
                const variantId = data.v3_variant_id;
                const hasActiveModal = $('body').hasClass('has-activeModal');
                let priceB2b;
                if (data.price.with_tax) {
                    priceB2b = data.price.with_tax.value;
                }

                if (data.price.without_tax) {
                    priceB2b = data.price.without_tax.value;
                }
                priceContainer.text(currencyFormat(priceB2b, window.money));
                if (err) {
                    return swal({
                        text: err,
                        type: 'error',
                    });
                }
                if (data.sku) {
                    $sku.html(`<b>SKU: </b>${data.sku}`);
                    $skuModal.html(`SKU: ${data.sku}`);
                }
                // page right option change
                if (hasActiveModal) {
                    if (variantId) {
                        $('#variant_id_container').attr('data-variant-id', variantId);
                    }
                    let allValid = true;
                    let validInput = true;
                    if (data.purchasing_message) {
                        $('p.alertBox-message', $messageBox).text(data.purchasing_message);
                        allValid = false;
                        $messageBox.show();
                    } else {
                        $messageBox.hide();
                    }
                    if (!data.purchasable || !data.instock) {
                        allValid = false;
                    }
                    // required text field
                    const $textInputs = $form.find('input.form-input[required]');
                    $textInputs.each((index, item) => {
                        const $textInput = $(item);
                        if ($textInput.val().trim() === '') {
                            validInput = false;
                        }
                    });
                    if (allValid && validInput) {
                        $submit.prop('disabled', false);
                    } else {
                        $submit.prop('disabled', true);
                    }
                    $textInputs.bind('keyup', (e) => {
                        if ($(e.target).val() && allValid) {
                            $submit.prop('disabled', false);
                        } else {
                            $submit.prop('disabled', true);
                        }
                    });
                } else {
                    if (variantId) {
                        $(`#product_search_result_table.${productId} tr`).attr('data-variant-id', variantId);
                    }
                    // page left option change
                    // set up advqty
                    const $qtyInputSingle = $(`input[name=${productId}]`, $tr);
                    const $qtyInputMulti = $(`input[name=${productId}]`, $tr);

                    if ($form.parents('#product_search_results').length > 0) {
                        $qtyInputSingle.attr('data-advqty-sku', data.sku);
                        this.setUpSearchResultsAdvQty($qtyInputSingle, true);
                    } else {
                        $qtyInputMulti.attr('data-advqty-sku', data.sku);
                        this.setUpSearchResultsAdvQty($qtyInputMulti, true);
                    }
                    // from search results
                    $checkbox.prop('disabled', true);
                    let allValid = true;
                    if (data.purchasing_message) {
                        $('p.alertBox-message', $messageBox).text(data.purchasing_message);
                        allValid = false;
                        $messageBox.show();
                    } else {
                        $messageBox.hide();
                    }

                    if (!data.purchasable || !data.instock) {
                        allValid = false;
                    }

                    // required text field
                    const $textInputs = $tr.find('input.form-input[required]');
                    let validInput = true;
                    $textInputs.each((index, item) => {
                        const $textInput = $(item);
                        if (!$textInput.val() || $textInput.val().trim() === '') {
                            validInput = false;
                        }
                    });
                    if (allValid && validInput) {
                        $checkbox.prop('disabled', false);
                    } else {
                        $checkbox.prop('checked', false);
                        $checkbox.prop('disabled', true);
                    }

                    $textInputs.bind('keyup', (e) => {
                        const $tableCheckbox = $(e.target).parents('tr').find('input[type=checkbox]');
                        if ($(this).val() && allValid) {
                            $tableCheckbox.prop('disabled', false);
                        } else {
                            $tableCheckbox.prop('disabled', true);
                            $tableCheckbox.prop('checked', false);
                        }
                    });
                }
            });
        });
        $('#add_to_cart').on('click', () => {
            window.b2b.$overlay.show();
            const itemArr = [];
            let allOptionsValid = true;
            let invalidAdvQtyCount = 0;
            const $checkedItems = $shoppingListTable.find('.col-checkbox input[type=checkbox]:checked');
            $checkedItems.each((index, item) => {
                const productObj = {};
                const $tr = $(item).parents('tr');

                // check advqty
                if ($tr.find('.not-valid-min').length > 0 || $tr.find('.not-valid-inc').length > 0) {
                    invalidAdvQtyCount++;
                }

                productObj.productId = $tr.attr('data-product-id');
                productObj.variantId = $tr.attr('data-variant-id');
                productObj.quantity = $tr.find('[data-product-quantity] input').val();
                const optionList = $tr.attr('data-product-options');
                if (optionList) {
                    productObj.optionList = JSON.parse(optionList);
                }
                if ($tr.find('[no-option-value]').length) {
                    allOptionsValid = false;
                }

                itemArr.push(productObj);
            });
            // advQty check
            const hasErro = invalidAdvQtyCount > 0 || $('#shopping_list_table tbody tr').length === 0 || itemArr.length === 0 || !allOptionsValid;
            if (hasErro) {
                window.b2b.$overlay.hide();
            }
            if (invalidAdvQtyCount > 0) {
                return swal({
                    text: 'Please review your shopping list, one or more items have an invalid quantity.',
                    type: 'error',
                });
            }

            if ($('#shopping_list_table tbody tr').length === 0) {
                return swal({
                    text: 'You have no products in list.',
                    type: 'error',
                });
            }

            if (itemArr.length === 0) {
                return swal({
                    text: 'Please select at least one item to add to cart..',
                    type: 'error',
                });
            }

            if (!allOptionsValid) {
                return swal({
                    text: 'Please fill out product options first.',
                    type: 'error',
                });
            }
            const addProductsData = {
                lineItems: [],
            };
            addProductsData.lineItems = itemArr.map((item) => Object.assign({}, {
                quantity: item.quantity,
                productId: item.productId,
                variantId: item.variantId,
            }));
            addProducts(addProductsData);
            // b2bCart.addToCart(itemArr, true);
        });
        // reject pending list, for Senior buyer and Admin,change status from 40->30
        $('body').on('click', '#page_bottom_cart_nav', () => {
            $('#page_bottom_cart_nav').toggleClass('is-open');
            $('#page_bottom_cart').toggleClass('is-open');
        });
        // clear cart
        $('body').on('click', '#clear_cart', () => {
            window.b2b.$overlay.show();
            $.ajax({
                type: 'GET',
                url: '../api/storefront/carts',
                contentType: 'application/json',
                accept: 'application/json',
                async: true,
                success: (data) => {
                    if (data && data.length > 0) {
                        const cartItemsAll = data[0].lineItems.physicalItems;
                        const cartItems = cartItemsAll.filter((item) => item.parentId === null);
                        // return cartItemIDs
                        this.clearCart(cartItems);
                    } else {
                        // no cart
                        return swal({
                            type: 'Shopping List was cleared successfully',
                            text: 'success',
                        });
                    }
                },
                error: () => {
                    window.b2b.$overlay.hide();
                    swal({
                        type: 'error',
                        text: 'There has some error, please try again.',
                    });
                },
            });
        });
        $('body').on('click', '#search_skus', () => {
            try {
                const $inputVal = $('#product_search_skus').val();
                const arry = $inputVal.split(',');
                const newArry = [];
                $.each(arry, (index, item) => {
                    const newItem = item.replace(/^\s*|\s*$/g, '');
                    newArry.push(newItem);
                });
                let frage = '';

                window.b2b.$overlay.show();
                b2bAjax.getProductsBySkuQuick({ variantSku: newArry }).then((res) => {
                    const data = res.data;
                    if (res.code !== 200) {
                        return swal({
                            text: res.message,
                            type: 'error',
                        });
                    }
                    if (data.length > 0) {
                        $('#skus_search_results').html('<div class="product-qty-label form-label">Qty: <small>*</small></div><table class="search-product-table" product-search-result-table style="margin-bottom:1.5rem;"><tbody></tbody></table>');
                        $.each(data, (index, item) => {
                            let optionList = [];
                            if (item.option.length > 0) {
                                $.each(item.option, (i, option) => {
                                    optionList.push({
                                        option_id: `attribute[${option.option_id}]`,
                                        option_value: `${option.id}`,
                                    });
                                });
                            }

                            this.getImage(item.productId, `img_id_${item.productId}_${index}`);
                            optionList = JSON.stringify(optionList);

                            frage += `<tr data-product-id=${item.productId} data-variant-id="${item.variantId}" data-product-options=${optionList}>
                            <td class="col-checkbox"><input type="checkbox" data-results-check-box data-product-id="${item.productId}" data-variant-id="${item.variantId}"></td>
                            <td class="col-product-figure"><img src="../../../../img/ProductDefault.gif" alt="${item.productName}" title="${item.productName}" data-img-id="img_id_${item.productId}_${index}"></td>
                            <td class="col-product-info">${item.productName}<br/>
                            <b>SKU:</b> ${item.variantSku}</td>
                            <td class="col-product-price" data-product-price data-product-price-value="${item.price}"><span class="loading-span"><span></td>
                            <td class="product-qty-col"><input class="form-input" type="text" id="product_qty_${item.productId}" name="product_qty_${item.productId}" data-advqty-sku="${item.variantSku}" value="1"></td>
                        </tr>`;
                            const $scope = $('#skus_search_results');
                            // Asynchronous processing
                            setTimeout(() => {
                                getPrice(item.productId, JSON.parse(optionList)).then((response) => {
                                    if (response) {
                                        setPrice(response, $scope);
                                    }
                                });
                            }, 20);
                        });
                    } else {
                        frage = `<tr><td colspan="5">No products found for "${$inputVal}".</td></tr>`;
                    }
                    $('#skus_search_results').find('[product-search-result-table] tbody').html(frage);

                    // set up advqty
                    const $qtyInputs = $('#skus_search_results').find('[product-search-result-table] tbody .form-input');
                    this.setUpSearchResultsAdvQty($qtyInputs);
                });
            } catch (err) {
                swal({
                    text: 'Unknown Error',
                    type: 'error',
                });
            }
        });
        // add select items to shopping list
        $('body').on('click', '#add_items_to_list', () => {
            const $resultTable = $('[product-search-result-table]');
            const $checkedProducts = $resultTable.find('[data-results-check-box]:checked');
            // let passStatus = true;
            this.checkInputNull();
            if ($resultTable.find('tr').length === 0) {
                return swal({
                    text: 'Please search for products by SKU/product name or add from file',
                    type: 'error',
                });
            }
            if ($checkedProducts.length === 0) {
                return swal({
                    text: 'Please select products you want to add to list',
                    type: 'error',
                });
            }
            const checkNum = /^[1-9]\d*$/;
            const addToShoppingListData = [];
            for (let i = 0; i < $checkedProducts.length; i++) {
                const item = $checkedProducts.eq(i);
                const singleProductQuantity = $(item).parent().parent().find('.form-input').val();
                if (!checkNum.test(singleProductQuantity)) {
                    $(item).focus();
                    return swal({
                        text: 'Please enter a valid quantity',
                        type: 'error',
                    });
                }

                // check top search
                const form = $(item).parent().parent().find('form');
                const checkAddStatus = this.checkRequireInputs(form);
                if (checkAddStatus) {
                    const optionList = [];
                    const $tr = $(item).parents('tr');
                    const formInputsArry = this.getFormInputs(form);
                    for (let j = 0; j < formInputsArry.length; j++) {
                        const jtem = formInputsArry[j];
                        const name = jtem.name;
                        const value = jtem.value;
                        if (name.indexOf('attribute[') > -1) {
                            optionList.push({
                                option_id: name,
                                option_value: value,
                            });
                        }
                    }
                    if (optionList.length > 0) {
                        $tr.attr('data-product-options', JSON.stringify(optionList));
                    }
                }
                // build arry shoppong list data
                if (checkAddStatus) {
                    // first tr no varaint id, search varaint id
                    const $tr = $(item).parents('tr');

                    const qty = $($tr).find('.product-qty-col input').val();
                    const productId = $tr.attr('data-product-id');
                    let variantId = $tr.attr('data-variant-id');
                    let optionList = $tr.attr('data-product-options');
                    if (!productId || (!variantId && $tr.find('[data-product-attribute]').length > 0)) {
                        return swal({
                            text: 'Some Prodcuts No varaint Id or Product Id',
                            type: 'error',
                        });
                    }
                    if (!variantId) {
                        variantId = productId;
                    }
                    optionList = optionList ? JSON.parse(optionList) : '';
                    const productItem = {
                        id: window.b2b.shoppingListId,
                        items: [
                            {
                                productId,
                                variantId,
                                qty,
                                optionList,
                            },
                        ],
                        _checkAddStatus: true,
                    };
                    addToShoppingListData.push(productItem);
                }
            }
            $.each(addToShoppingListData, (index, item) => {
                const last = (addToShoppingListData.length === index + 1);
                if (item._checkAddStatus) this.addToShoppingList(item, last);
            });
        });
        // change list status
        $('body').on('click', '[data-update-status]', () => {
            const $trs = $shoppingListTable.find('tbody tr');
            const gRoleId = sessionStorage.getItem('roleId');
            const $statusSelect = $('#shopping_list_status');
            const newStatus = $statusSelect.val();
            const status = newStatus;
            const id = window.b2b.shoppingListId;

            if (gRoleId === '2' && $trs.length === 0) {
                return swal({
                    text: 'You have no items in your list.',
                    type: 'error',
                });
            }
            // if status not changed, dont do anything

            if (window.b2b.shoppingListStatus === newStatus) {
                return false;
            }

            window.b2b.$overlay.show();

            b2bAjax.updateShoppingList({
                status, id,
            }).then((res) => {
                if (res.code === 200) {
                    swal({
                        text: 'Shopping list status updated successfully',
                        type: 'success',
                    }).then(() => {
                        if (gRoleId === '2' && newStatus === '40') {
                            window.location.reload();
                        } else if ((gRoleId === '0' || gRoleId === '1') && newStatus === '0') {
                            // submit for approval
                            window.location.reload();
                        } else if ((gRoleId === '0' || gRoleId === '1') && newStatus === '30') {
                            // reject submit
                            window.location.href = '/shopping-lists/';
                        }
                    });
                    setTimeout(() => {
                        if (gRoleId === '2' && newStatus === '40') {
                            window.location.reload();
                        } else if ((gRoleId === '0' || gRoleId === '1') && newStatus === '0') {
                            // submit for approval
                            window.location.reload();
                        } else if ((gRoleId === '0' || gRoleId === '1') && newStatus === '30') {
                            // reject submit
                            window.location.href = '/shopping-lists/';
                        }
                    }, 3000);
                } else {
                    swal({
                        text: res.message,
                        type: 'error',
                    });
                }
            });
        });
    },
    getRequireInputs(form) {
        const $requireInputs = $('[required]', form);
        const attrArry = [];
        if ($requireInputs.length === 0) {
            return false;
        }
        $.each($requireInputs, (index, item) => {
            if (item.hasAttribute('required')) {
                const attr = $(item).attr('name');
                attrArry.push(attr);
            }
        });
        const productAttr = Array.from(new Set(attrArry));
        return productAttr;
    },
    getFormInputs(form) {
        const attributeArry = form.serializeArray();
        return attributeArry;
    },
    checkRequireInputs(form) {
        let status = true;
        const requireInputsArry = this.getRequireInputs(form);
        const formInputsArry = this.getFormInputs(form);
        for (let i = 0; i < requireInputsArry.length; i++) {
            const item = requireInputsArry[i];
            let hasAttribute = false;
            for (let j = 0; j < formInputsArry.length; j++) {
                const formItem = formInputsArry[j];
                const formItemName = formItem.name;
                const formItemValue = formItem.value;
                if (formItemName === item) {
                    hasAttribute = true;
                    if (!formItemValue) {
                        status = false;
                    }
                }
            }
            if (!hasAttribute) {
                status = false;
            }
        }
        return status;
    },
    checkInputNull() {
        const $inputs = $('#quick_add_section').find('[data-results-check-box]:checked');
        $.each($inputs, (index, item) => {
            const $parent = $(item).parents('tr').find('.product-qty-col .form-input');
            const val = $parent.val();

            if (!val || val === '') {
                return swal({
                    text: 'Please enter a quantity',
                    type: 'error',
                });
            }
        });
    },
    getImage(productId, imgId) {
        utils.api.product.getById(productId, {
            template: 'b2b/shopping-list-search-results-item',
        }, (err, response) => {
            const img = $(response).find('.col-product-figure img').attr('src');
            $(`[data-img-id=${imgId}]`).attr('src', img);
        });
    },
    // clear cart contents
    clearCart(cartItemArr) {
        const cartitem = cartItemArr[cartItemArr.length - 1];
        window.b2b.$overlay.show();
        utils.api.cart.itemRemove(cartitem.id, (err, response) => {
            if (response.data.status === 'succeed') {
                cartItemArr.pop();

                if (cartItemArr.length > 0) {
                    this.clearCart(cartItemArr);
                } else {
                    window.b2b.$overlay.hide();
                    $('body').trigger('cart-quantity-update', 0);
                    $('[data-cart-subtotal]').text('$0.00');
                }
            } else {
                window.b2b.$overlay.hide();
                swal({
                    text: 'Shopping List was not cleared. Please try again.',
                    type: 'error',
                });
            }
        });
    },
    setUpSearchResultsAdvQty($qtyInputs, resetQty) {
        AdvQuantityUtil.setUpAdvQtyMulti($qtyInputs, {
            bindInputEvents: true,
            bindButtonEvents: false,
            tips: true,
            resetQty: resetQty || false,
        }, () => {
            $qtyInputs.each((lIdx, lItem) => {
                const $input = $(lItem);
                $input.trigger('change');
            });
        });
    },
    deletItem(shoppingListId, itemId, lastItem) {
        b2bAjax.deleteShopingListItme(shoppingListId, itemId).then(res => {
            if (res.code !== 200) {
                return swal({
                    text: res.message,
                    type: 'error',
                });
            }
            if (lastItem && res.code === 200) {
                this.reloadTable();
                return swal({
                    text: 'Product(s) deleted from the shopping list successfully',
                    type: 'success',
                });
            }
        });
    },
    reloadTable() {
        window.b2b.$overlay.show();
        const roleId = sessionStorage.getItem('roleId');
        const id = window.b2b.shoppingListId;
        const listID = window.b2b.shoppingListId;
        const userId = sessionStorage.getItem('userId');
        window.b2b.offset = 0;
        b2bAjax.getShoppingListItemsExtension({ id, offset: window.b2b.offset, limit: 100 }).then((res) => {
            if (res.code !== 200) {
                return swal({ text: res.message, type: 'error' });
            }
            const listData = res.data;
            this.loadTable(listID, userId, listData, roleId);
            this.initJqPagenation(res.data, true);
        });
    },
    qtyChange(event) {
        AdvQuantityUtil.handleQuantityChange(event);
        let qty = $(event.target).val();
        if (!qty) {
            qty = 1;
        }
        if (Number.isNaN(qty)) {
            return swal({
                text: 'please enter a number',
                type: 'error',
            });
        }
        const $target = $(event.target);
        const basePrice = $($target.parents('tr').find('[data-product-price-value]')).attr('data-product-price-value');
        const subPrice = currencyFormat((parseFloat(basePrice).toFixed(2)) * qty, window.money);
        const $subPriceContainer = $target.parents('tr').find('.product-subtotal-span');
        $subPriceContainer.text(subPrice);
    },
    // for simple products
    getTierPriceByProductIdMulti(productIds, qty, cb) {
        const productId = productIds[productIds.length - 1];
        const gTierPrice = window.b2b.gTierPrice;
        if (gTierPrice[productId]) {
            productIds.pop();
            if (productIds.length === 0) {
                if (cb) {
                    cb();
                }
            } else {
                this.getTierPriceByProductIdMulti(productIds, qty, cb);
            }
        } else {
            utils.api.product.getById(productId, {
                template: 'b2b/product-view-data',
            }, (err, response) => {
                const basePrice = $(response).attr('data-product-price-value');
                gTierPrice[productId] = basePrice;
                productIds.pop();
                if (productIds.length === 0) {
                    if (cb) {
                        cb();
                    }
                } else {
                    this.getTierPriceByProductIdMulti(productIds, qty, cb);
                }
            });
        }
    },
    getVariantOptions($priceSpan, pickListArr, varaintOptionList) {
        const gMasterPrcie = $priceSpan.attr('data-main-price');
        let productPrice = parseFloat(gMasterPrcie).toFixed(2);
        if (varaintOptionList) {
            const options = varaintOptionList;

            for (let i = 0; i < pickListArr.length; i++) {
                const pickedOptionId = pickListArr[i].pickedOptionId;
                const pickedOptionValue = pickListArr[i].pickedOptionValue;
                const pickedProductId = pickListArr[i].pickedProductId;

                let showCustomPrice = true;

                for (let j = 0; j < options.length; j++) {
                    const optionId = options[j].option_id;
                    const optionValue = options[j].option_value;

                    if (pickedOptionId === optionId && pickedOptionValue === optionValue) {
                        showCustomPrice = false;
                    }
                }

                if (showCustomPrice) {
                    const pickListProductPrice = window.b2b.gTierPrice[pickedProductId] || 0;
                    productPrice = parseFloat(parseFloat(productPrice) + parseFloat(pickListProductPrice)).toFixed(2);
                }
            }
        }

        $priceSpan.text(`${currencyFormat(parseFloat(productPrice), window.money)}`);
        // for list
        if ($priceSpan.parents('tr').find('.product-subtotal-span').length > 0) {
            const qty = $priceSpan.parents('tr').find('input.qty').val();
            const totlePriceValue = currencyFormat(parseFloat(qty * productPrice).toFixed(2), window.money);
            $priceSpan.parents('tr').find('.product-subtotal-span').text(totlePriceValue);
        }
    },
    initProductListOptionPrice() {
        const $pickListOptions = $('.form-field[data-product-attribute="product-list"]');
        if ($pickListOptions.length > 0) {
            $.each($pickListOptions, (index, option) => {
                const $formRadios = $(option).find('input.form-radio');
                $.each($formRadios, (i, radio) => {
                    const productId = $(radio).attr('data-product-id');
                    if (!window.b2b.gTierPrice[productId]) {
                        this.getTierPriceByProductId(productId, 1);
                    }
                });
            });
        }
    },
    listEditOptions(productId, variantId, itemIndex, itemOptions, skuHtml) {
        const modal = defaultModal();
        modal.open();

        utils.api.product.getById(productId, {
            template: 'b2b/modals/configure-product',
        }, (err, response) => {
            modal.updateContent(response);
            modal.$content.find('#index_container').attr('data-index', itemIndex);
            modal.$content.find('#variant_id_container').attr('data-variant-id', variantId);
            modal.$content.find('[data-product-sku]').html(skuHtml);

            const options = JSON.parse(itemOptions);

            for (let j = 0; j < options.length; j++) {
                const optionName = options[j].option_id;
                const optionValue = options[j].option_value;

                const $option = modal.$content.find(`[type!="hidden"][name="${optionName}"]`);
                if ($option.length > 0) {
                    if ($option.attr('type') === 'radio') {
                        $option.each((index, item) => {
                            if ($(item).val() === optionValue) {
                                $(item).prop('checked', true);
                            }
                        });
                    } else if ($option.attr('type') === 'checkbox') {
                        $option.prop('checked', true);
                    } else {
                        $option.val(optionValue);
                    }
                }
            }
        });
    },
};
