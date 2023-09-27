import utils from '@bigcommerce/stencil-utils';
import swal from 'sweetalert2';
import b2bAjax from '../common/ajax';

import { priceParser, checkB2bUser } from '../common';
import b2bCart from '../common/b2bCart';
import checkQtyEnable from '../common/checkQtyEnable';

export default function () {
    const $quickOrderPadTable = $('#quick_order_pad_table');
    let gRoleId;
    let bypassCompanyId;
    const tableDefaultRow = 5;
    window.b2b.successNumber = 0;
    const tableTrHtml = `<tr>
            <td class="col-action-left"><sapn class="remove-icon" data-remove-cell>&minus;</span></td>
            <td class="col-sku"><div class="product-info"><input class="form-input" type="text" data-sku><div class="sku-search-results"></div><span class="error-info">Invalid SKU <span>!</span></span></div></td>
            <td class="col-qty"><input class="form-input" type="text" autocomplete="off" data-qty></td>
            <td class="th-col-message"><span data-total-price></span></td>
        </tr>`;


    if (checkB2bUser()) {
        window.b2b.$overlay.hide();
        gRoleId = sessionStorage.getItem('roleId');
        bypassCompanyId = sessionStorage.getItem('companyId');

        if (!gRoleId || !bypassCompanyId) {
            return swal({
                allowOutsideClick: false,
                type: 'error',
                text: 'You can\'t access to this page.',
            }).then(() => {
                window.location.href = '/';
            });
        }

        // init table row
        for (let i = 0; i < tableDefaultRow; i++) {
            $quickOrderPadTable.find('tbody').append(tableTrHtml);
        }
        // qty
        checkQtyEnable().then(res => {
            if (res.data.isEnabled === '1') {
                window.b2b.qtyEnabled = true;
            }
            window.b2b.qtyEnabled = true;
        });
    }
    $('body').on('click', '#drag_upload_csv', () => {
        $('#customer_sku_csv').click();
    });
    $('body').on('change', '.err-data .form-input', (e) => {
        $(e.target).parents('tr').removeClass('err-sku err-data err-qty');
        $(e.target).parents('tr').find('.th-col-message').html('');
    });
    // replace non-number char
    $('body').on('keyup', '[data-qty]', (e) => {
        let cvalue = $(e.target).val();
        cvalue = cvalue.replace(/\D|^0/g, '');
        $(e.target).val(cvalue);
        if (cvalue) {
            $(e.target).removeClass('error');
        }
    });
    $('body').on('afterpaste', '[data-qty]', (e) => {
        let cvalue = $(e.target).val();
        cvalue = cvalue.replace(/\D|^0/g, '');
        $(e.target).val(cvalue);
        if (cvalue) {
            $(e.target).removeClass('error');
        }
    });
    const addProductToCart = (itemArr) => {
        window.b2b.$overlay.show();
        const item = itemArr[itemArr.length - 1];
        const formData = new FormData();
        const elementId = item.elementId;
        formData.append('action', 'add');
        formData.append('product_id', item.productId);
        formData.append('qty[]', item.quantity);

        const optionList = item.optionList ? item.optionList : [];


        for (let i = 0; i < optionList.length; i++) {
            formData.append(`attribute[${optionList[i].option_id}]`, optionList[i].id);
        }
        // // api add product
        utils.api.cart.itemAdd(formData, (err, response) => {
            const errorMessage = err || response.data.error;
            if (errorMessage) {
                $(`[data-element-id=${elementId}]`).find('.th-col-message').html('Out of Stock');
            } else {
                $(`[data-element-id=${elementId}]`).remove();
                window.b2b.successNumber += 1;
            }
            itemArr.pop();
            if (itemArr.length > 0) {
                addProductToCart(itemArr);
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
                window.b2b.$overlay.hide();
                $('.result-message').html(`${window.b2b.successNumber} Line Items has been added to cart`);
            }
        });
    };
    const addErro = (item, message, styleClass) => {
        $(item).parents('tr').toggleClass(styleClass, true);
        $(item).parents('tr').find('.th-col-message').html(message);
    };
    const fiterProductsBysku = (data, skus) => {
        $.each(skus, (index, item) => {
            const value = $(item).val().trim().toUpperCase();

            if (!(data.some(items => (items.variantSku).trim().toUpperCase() === value)) && value) {
                addErro(item, 'Invalid Sku', 'err-sku err-data');
            } else if (data.some(items => (items.variantSku).trim().toUpperCase() === value)) {
                const itemData = data.filter(v => (v.variantSku).trim().toUpperCase() === value)[0];
                const $tr = $(item).parents('tr');
                $tr.attr('data-product-id', itemData.productId);
                $tr.attr('data-element-id', `${itemData.productId}-${index}`);
                $tr.attr('data-product-options', JSON.stringify(itemData.option));
            } else if (!value) {
                addErro(item, '', 'err-data');
            }
        });
    };


    const filterQty = (data, skus) => {
        $.each(skus, (index, item) => {
            const value = $(item).val().trim().toUpperCase();
            const qtyItem = data.find(v => (v.variantSku).trim().toUpperCase() === value);
            const $inputQty = $(item).parents('tr').find('[data-qty]');
            const inputQtyValue = parseInt($inputQty.val(), 10);
            if (value) {
                if (!inputQtyValue) {
                    addErro(item, 'Invalid Quantity', 'err-qty err-data');
                }
                if (qtyItem) {
                    const minQty = parseInt(qtyItem.minOrderQty, 10);
                    if (minQty > inputQtyValue || !inputQtyValue) {
                        addErro(item, `Min Quantity ${minQty}`, 'err-qty err-data');
                    }
                }
            }
        });
    };
    const initAddData = () => {
        window.b2b.successNumber = 0;
        $('.result-message').html('');
    };
    const addToCartCotent = (elements) => {
        if (elements.length === 0) {
            return;
        }
        const $trs = elements;
        const itemArr = [];

        $.each($trs, (index, item) => {
            const $tr = $(item);
            const productObj = {};
            productObj.elementId = $tr.attr('data-element-id');
            productObj.productId = $tr.attr('data-product-id');
            productObj.quantity = $tr.find('[data-qty]').val();
            const optionList = JSON.parse($tr.attr('data-product-options') || '[]');
            if (optionList.length > 0) {
                productObj.optionList = optionList;
            }
            itemArr.push(productObj);
        });
        initAddData();
        addProductToCart(itemArr);
    };

    // add to cart
    $('#add_to_cart').on('click', () => {
        const skuArry = [];
        const $table = $('#quick_order_pad_table');
        const skus = $('[data-sku]', $table);

        window.b2b.$overlay.show();
        $('.result-message').html('');
        $.each(skus, (index, item) => {
            const value = $(item).val().trim();
            if (value) {
                $(item).attr('data-id', `${value}-${index}`);
                skuArry.push(value.toUpperCase());
            }
        });
        const variantSkus = Array.from(new Set(skuArry));

        b2bAjax.getProductsBySkuQuickByPost({ variantSkus })
            .then(res => {
                if (res.code !== 200) {
                    window.b2b.$overlay.hide();
                    return window.b2b.Alert.error(res.message);
                }
                fiterProductsBysku(res.data, skus);
                if (window.b2b.qtyEnabled) {
                    b2bAjax.getAdvQtyBySkusNew({ variantSkus })
                        .then(resp => {
                            if (resp.code !== 200) {
                                return window.b2b.Alert.error(resp.message);
                            }
                            filterQty(resp.data.productQuantityList, skus);
                            const $elments = $('#quick_order_pad_table tbody tr:not(.err-qty):not(.err-data):not(.err-sku)');
                            addToCartCotent($elments);
                        })
                        .catch(error => {
                            window.b2b.$overlay.hide();
                            window.b2b.Alert.error(error);
                        });
                } else {
                    filterQty([], skus);
                    const $elments = $('#quick_order_pad_table tbody tr:not(.err-qty):not(.err-data):not(.err-sku)');
                    addToCartCotent($elments);
                }
            })
            .catch(error => window.b2b.Alert.error(error))
            .finally(() => {
                window.b2b.$overlay.hide();
            });
    });
    // csv upload add to cart
    $('#add_to_cart_csv').on('click', () => {
        const $trs = $('#quick_order_pad_table_csv tbody tr');

        let allVaild = true;
        const itemArr = [];
        $trs.each((index, item) => {
            const $tr = $(item);
            const itemQty = $tr.find('[data-qty]').text();
            const productId = $tr.attr('data-product-id');
            if (productId || itemQty) {
                const inputOptions = [];
                if ($tr.find('.productInfo-options').length) {
                    const $requiredInput = $tr.find('.productInfo-options input[required]');
                    $requiredInput.each((indexInput, itemInput) => {
                        if (!$(itemInput).val()) {
                            allVaild = false;
                        } else {
                            inputOptions.push({
                                option_id: $(itemInput).attr('name').replace('attribute[', '').replace(']', ''),
                                option_value: $(itemInput).val(),
                            });
                        }
                    });
                }
                const productObj = {};
                productObj.productId = $tr.attr('data-product-id');
                productObj.variant_id = $tr.attr('data-variant-id');
                productObj.quantity = itemQty;
                productObj.sku = $tr.attr('data-product-sku');
                let optionList = JSON.parse($tr.attr('data-product-options') || '[]');

                if (inputOptions.length > 0) {
                    optionList = optionList.concat(inputOptions);
                }
                if (optionList.length > 0) {
                    productObj.optionList = optionList;
                }
                itemArr.push(productObj);
            }
        });

        if (!allVaild) {
            return swal({
                type: 'error',
                text: 'Please fill in your product information.',
            });
        }
        if (itemArr.length === 0) {
            return swal({
                type: 'error',
                text: 'Please fill in your product information.',
            });
        }
        b2bCart.addToCart(itemArr, false, false, true);
    });

    // remove line
    $('body').on('click', '[data-remove-cell]', (e) => {
        const $tr = $(e.target).parents('tr');
        $tr.remove();
    });

    // add line
    $('body').on('click', '#add_new_row', () => {
        $quickOrderPadTable.find('tbody').append(tableTrHtml);
    });

    // search sku in catalogProducts
    // file upload
    // sample data: [244, 287, "SKU100", "SKU-9BB3516E", "1", empty]

    const displayCsvProducts = (products) => {
        $('#add_to_cart_csv').prop('disabled', true);
        const $csvCheckInfoContainer = $('#csv_check_info');
        const $csvProdcutsContainer = $('#csv_products_list');
        $csvCheckInfoContainer.html('Loading products...');
        $csvProdcutsContainer.html(`
            <table class="quick-order-pad-table" id="quick_order_pad_table_csv">
                <thead class="has-line">
                    <tr>
                        <th>Variant SKU</th>
                        <th class="th-col-quantity">Quantity</th>
                        <th class="th-col-message"></th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>`);

        const $csvProdcutsTbody = $csvProdcutsContainer.find('tbody');

        const productCount = products.length;

        for (let i = 0; i < productCount; i++) {
            const productId = products[i][0];
            const variantId = products[i][1];
            const variantSku = products[i][2];
            const productQty = (products[i][3]);
            const productOptions = products[i][4];
            const b2bPrice = products[i][5];

            // shopping-list-csv-product-item
            utils.api.product.getById(productId, {
                template: 'b2b/quick-order-pad-product-csv',
            }, (err, response) => {
                if (err) {
                    return swal({
                        text: 'There is an error in the CSV file. Please fix and reupload',
                        type: 'error',
                    });
                }
                const tmpIndex = i;
                const $response = $(response);
                const hasOptions = $response.attr('has-options');

                const tr = `
                    <tr data-variant-id="${variantId}"  data-product-id="${productId}" csv-tr-${i} data-product-sku=${variantSku}>
                        <td class="col-sku">
                            <div class="product-info">
                                <span>${variantSku}</span>
                                ${response}
                        </td>
                        <td class="col-qty"><span data-qty>${productQty}</span></td>
                        <td class="col-price"><span data-total-price>${priceParser(parseFloat(b2bPrice * productQty).toFixed(2))}</span></td>
                    </tr>`;

                $csvProdcutsTbody.append(tr);

                const $tr = $csvProdcutsTbody.find(`tr[csv-tr-${i}]`);

                if (tmpIndex === productCount - 1) {
                    $csvCheckInfoContainer.html('');
                    $('#add_to_cart_csv').prop('disabled', false);
                }

                const $inputOptions = $tr.find('.productInfo-options input.form-input');

                if ($inputOptions.length > 0) {
                    if (productOptions && productOptions.trim() !== '') {
                        const productOptionsArr = productOptions.split(';');
                        $inputOptions.each((index, item) => {
                            if (productOptionsArr && productOptionsArr.length >= index + 1) {
                                $(item).val(productOptionsArr[index]);
                            }
                        });
                    }
                }

                if (hasOptions === 'true') {
                    // get selected options
                    const optionlist = [];
                    optionlist.push((productOptions).map((data) => ({ option_id: data.option_id, option_value: data.id })));
                    $tr.attr('data-product-options', JSON.stringify(optionlist));
                }
            });
        }
    };

    const resetCsvFileUpload = () => {
        $('#csv_check_info').html('');
        $('#csv_products_list').html('');
        $('#customer_sku_csv').val('');
        $('#file_name').html('');
        $('#csv_err_message').html('');
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
                const reader = new FileReader();
                if ((uploadFile.name).indexOf('.csv') === -1) {
                    return swal({
                        text: 'Please upload a CSV file',
                        type: 'error',
                    });
                }
                reader.addEventListener('load', (b) => {
                    resetCsvFileUpload();
                    $('#file_name').html(uploadFile.name);
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
        if (content) {
            originArr = content.split('\n');
        }

        parseCsv.removeEmptyRow(originArr);
        const unEmptyArr = originArr;

        let columns = 0;
        if (unEmptyArr && unEmptyArr.length > 0) {
            const headerRow = unEmptyArr[0];
            const headerArr = headerRow.split(',');

            parseCsv.removeEmptyRow(headerArr);
            columns = headerArr.length;
        } else {
            $csvCheckInfoContainer.html('<div class="checking-info-box">Empty file, please upload another.</div>');
            return null;
        }

        for (let i = 1; i < unEmptyArr.length; i++) {
            const productIdsArr = '';
            const dataItem = unEmptyArr[i].split(',');

            if (dataItem.length > 1) {
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
            const variantSku = [];
            const newData = [];
            csvdataArr.forEach(item => {
                variantSku.push((item.sku).toUpperCase());
            });

            const variantSkus = Array.from(new Set(variantSku));

            b2bAjax.getProductsBySkuQuickByPost({ variantSkus }).then((res) => {
                if (res.code !== 200) return window.b2b.Alert.error(res.message);
                csvdataArr.forEach(cItem => {
                    const hasSku = res.data.some(dataItem => (cItem.sku).toUpperCase() === (dataItem.variantSku).toUpperCase());
                    if (hasSku) {
                        const item = res.data.find(i => (cItem.sku).toUpperCase() === (i.variantSku).toUpperCase());
                        newData.push([
                            item.productId,
                            item.variantId,
                            item.variantSku,
                            cItem.qty,
                            item.option ? item.option : '',
                            item.price,
                        ]);
                    } else {
                        $('#csv_err_message').append(`<div>${cItem.sku} is not a valid SKU</div>`);
                    }
                });

                if (newData.length > 0) {
                    if (window.b2b.qtyEnabled) {
                        b2bAjax.getAdvQtyBySkusNew({ variantSkus }).then((resp) => {
                            if (resp.code !== 200) return window.b2b.Alert.error(resp.message);
                            const data = resp.data.productQuantityList;
                            const csvNewData = [];
                            newData.forEach((newDataItem) => {
                                const newDataSku = newDataItem[2];
                                const newDataQty = newDataItem[3];
                                const respItem = data.find(dataItem => dataItem.variantSku === newDataSku);
                                const reQty = /^(0|\+?[1-9][0-9]*)$/;
                                if (reQty.test(newDataQty)) {
                                    if (respItem) {
                                        const minQty = respItem.minOrderQty;
                                        if (newDataQty >= minQty) {
                                            csvNewData.push(newDataItem);
                                        } else {
                                            $('#csv_err_message').append(`<div>The quantity for ${newDataSku} is not valid</div>`);
                                        }
                                    } else {
                                        csvNewData.push(newDataItem);
                                    }
                                } else {
                                    $('#csv_err_message').append(`<div>The quantity for ${newDataSku} is not valid</div>`);
                                }
                            });

                            if (csvNewData.length > 0) {
                                displayCsvProducts(csvNewData);
                            }
                            $csvCheckInfoContainer.find('.checking-tips').remove();
                        });
                    } else {
                        displayCsvProducts(newData);
                    }
                }
                return newData;
            });
        } else {
            $csvCheckInfoContainer.append(`<div style="font-weight:600;">Your file has ${errorCounter} errors, please correct them and upload the file again.</div>`);
            $csvCheckInfoContainer.find('.checking-tips').remove();
            return parsedata;
        }
    };

    UploadDealcsv.prototype.isEmptyRow = (arr) => {
        const tmpArr = arr.split(',');
        for (let k = 0; k < tmpArr.length; k++) {
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
    // drag to upload csv
    const dragToUploadCsv = () => {
        const dragArea = document.getElementById('drag_upload_csv');
        dragArea.ondragenter = (e) => {
            const target = e.target;
            e.preventDefault();
            target.style.borderColor = '#000';
        };

        dragArea.ondragover = (e) => {
            const target = e.target;
            e.preventDefault();
            target.style.borderColor = '#000';
        };

        dragArea.ondragleave = (e) => {
            const target = e.target;
            e.preventDefault();
            target.style.borderColor = 'transparent';
        };

        dragArea.ondrop = (e) => {
            const target = e.target;
            e.preventDefault();
            target.style.borderColor = 'transparent';
            const uploadFile = e.dataTransfer.files[0];

            // chech file extension
            const reg = new RegExp('[.](csv)$');
            if (!reg.test(uploadFile.name)) {
                return swal({
                    type: 'error',
                    text: 'Please uplaod a CSV file.',
                });
            }
            const reader = new FileReader();
            reader.addEventListener('load', (b) => {
                resetCsvFileUpload();
                $('#file_name').html(uploadFile.name);
                const csvdata = b.target.result;
                parseCsv.validation(csvdata);
            });

            reader.readAsBinaryString(uploadFile);
        };
    };

    dragToUploadCsv();
}
