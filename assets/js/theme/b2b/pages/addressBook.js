import b2bAjax from '../common/ajax';
import swal from 'sweetalert2';
import nod from '../../common/nod';
import formUtils from '../common/formUtils';

export default {
    get sessionStorageUserId() {
        return sessionStorage.getItem('userId') || '';
    },
    get sessionStorageCompanyId() {
        return sessionStorage.getItem('companyId') || '';
    },
    get sessionStorageRoleId() {
        return sessionStorage.getItem('roleId') || '';
    },
    get sessionStorageIsEnabledB2bAddressBook() {
        return sessionStorage.getItem('isEnabledB2bAddressBook') || '';
    },
    get hasPagePermission() {
        return this.sessionStorageRoleId && this.sessionStorageCompanyId && this.sessionStorageIsEnabledB2bAddressBook === '1';
    },
    get tipStringMap() {
        return {
            add: 'Address add',
            edit: 'Address editing',
            action: 'Address action',
            delete: 'Address delete',
            setDefaultShipping: 'Set default shipping address',
            setDefaultBilling: 'Set default billing address',
        };
    },

    init() {
        window.b2b.offset = 0;
        window.b2b.limit = 10;
        window.b2b.$overlay.show();
        if (!this.hasPagePermission) {
            return swal({
                allowOutsideClick: false,
                type: 'error',
                text: 'You can\'t access to this page.',
            }).then(() => {
                let redirect = '/';
                if (this.sessionStorageRoleId === '3') redirect = '/dashboard/';
                window.location.href = redirect;
            });
        }
        b2bAjax.getAddressBookBySearch(this.sessionStorageCompanyId, {
            offset: window.b2b.offset,
            limit: window.b2b.limit,
        }).then((res) => {
            if (res.code !== 200) {
                return swal({
                    text: res.message,
                    type: 'error',
                });
            }
            this.getDefaultAddress();
            this.renderAddressBook(res.data);
            this.initJqPagination(res.data);
        }).catch((error) => swal({
            text: error,
            type: 'error',
        }));

        b2bAjax.getCountries().then((res) => {
            if (res.code !== 200) {
                return swal({
                    text: res.message,
                    type: 'error',
                });
            }
            this.renderSelectOption(res.data);
        }).catch((error) => swal({
            text: error,
            type: 'error',
        }));
        this.initSearchBarEven();
        this.initAddressBookListEven();
        this.initAddAddressBookEven();
        this.initEditAddressBookEven();
    },

    // render address book list html
    renderAddressBook(data) {
        const list = data.list || [];
        let frage = '';
        frage += list.map(item => `<tr id='${item.addressId}' data-address='${JSON.stringify(item)}'>
            <td class="t-align-c">${item.firstName}</td>
            <td class="t-align-c">${item.lastName}</td>
            <td class="t-align-c">${item.addressLine1} ${item.addressLine2}</td>
            <td class="t-align-c">${item.label}</td>
            <td class="t-align-c">${item.city}</td>
            <td class="t-align-c">${item.country.countryName}</td>
            <td class="t-align-c">${item.zipCode}</td>
            <td class="t-align-c">${item.state.stateName}</td>
            <td class="t-align-c">${item.phoneNumber}</td>
            <td class="t-align-c toggle-shipping">${item.isShipping === '0' ? '' : '<i class="fa fa-check"></i>'}</td>
            <td class="t-align-c toggle-billing">${item.isBilling === '0' ? '' : '<i class="fa fa-check"></i>'}</td>
            <td class="t-align-c actions-field address_book_list_action">
            <div class="dropdown dropdown-wrap dropdown-action-wrap">
                <i class="fa fa-ellipsis-v td-action-dropdown"></i>
                <ul class="dropdown-menu">
                    <li class="dropdown-menu-item" data-edit-address data-reveal-id="modal-address-book-edit-form"><a href="javascript:void(0);">Edit</a></li>
                    ${item.isDefaultBilling === '0' ? '<li class="dropdown-menu-item" data-set-billing><a href="javascript:void(0);">Set as default billing</a></li>' : ''}
                    ${item.isDefaultShipping === '0' ? '<li class="dropdown-menu-item" data-set-shipping><a href="javascript:void(0);">Set as default shipping</a></li>' : ''}
                    <li class="dropdown-menu-item" data-delete-address><a href="javascript:void(0);">Delete</a></li>
                </ul>
            </div>
            </td></tr>`);

        $('.address-lists-table').find('tbody').html(frage);
    },

    // render select option
    renderSelectOption(res) {
        const list = res.list || [];
        let frage = '<option value="">Please Select</option>';
        frage += list.map(item => `<option value="${item.countryName}" data-country='${JSON.stringify(item)}'>${item.countryName}</option>`);

        $('#country_filter').html(frage);
        $('#new_country').html(frage);
        $('#edit_country').html(frage);
    },

    initDefaultAddress(address, addressTypeName) {
        let defaultListHtml = '';
        if (Object.keys(address).length === 0) {
            defaultListHtml = `<ul class="address-details address-details--postal">
                <li>No default ${addressTypeName.toLowerCase()} address</li>
            </ul>`;
        } else {
            const addressLabel = address.label ? `<li>${address.label}</li>` : '';
            defaultListHtml = `<ul class="address-details address-details--postal">
                ${addressLabel}
                <li>${address.firstName} ${address.lastName}</li>
                <li>${address.addressLine1} ${address.addressLine2}</li>
                <li>${address.city}, ${address.state.stateName}${address.zipCode}</li>
                <li>${address.country.countryName}</li>
            </ul>
            <dl class="address-details">
                <dt class="address-label">Phone:</dt>
                <dd class="address-description">${address.phoneNumber}</dd>
            </dl>`;
        }
        $('.addressList').append(`<li class="address address-default">
            <div class="panel panel--address">
                <div class="panel-body">
                    <h5 class="address-title">Default ${addressTypeName} Address</h5>
                    ${defaultListHtml}
                </div>
            </div>
        </li>`);
    },

    getDefaultAddress() {
        b2bAjax.getDefaultAddressesByCompanyId(this.sessionStorageCompanyId).then((res) => {
            $('.addressList').empty();
            if (res.code !== 200) {
                this.initDefaultAddress('', 'Billing');
                this.initDefaultAddress('', 'Shipping');
                return swal({ text: res.message, type: 'error' });
            }
            this.initDefaultAddress(res.data.billing, 'Billing');
            this.initDefaultAddress(res.data.shipping, 'Shipping');
            window.b2b.$overlay.hide();
        }).catch((error) => swal({
            text: error,
            type: 'error',
        }));
    },

    getAddressBookList(initPagination) {
        window.b2b.$overlay.show();
        const filter = {
            limit: window.b2b.limit,
            offset: window.b2b.offset,
            q: $('#keyword').val().trim(),
            filters: {
                firstName: $('#firstName_filter').val(),
                lastName: $('#lastName_filter').val(),
                address: $('#address_filter').val(),
                city: $('#city_filter').val(),
                country: $('#country_filter').val(),
                state: $('#state_filter_input').hasClass('hide') ? $('#state_filter_select').val() : $('#state_filter_input').val(),
                zipCode: $('#zipcode_filter').val(),
                phoneNumber: $('#phoneNumber_filter').val(),
                label: $('#addressLabel_filter').val(),
                addressType: {
                    isShipping: $('#isShipping_filter').is(':checked') ? '1' : '',
                    isBilling: $('#isBilling_filter').is(':checked') ? '1' : '',
                },
            },
        };
        b2bAjax.getAddressBookBySearch(this.sessionStorageCompanyId, filter).then((res) => {
            if (res.code !== 200) {
                return swal({
                    text: res.message,
                    type: 'error',
                });
            }
            this.renderAddressBook(res.data);
            if (initPagination) this.initJqPagination(res.data);
            this.getDefaultAddress();
        }).catch((error) => swal({
            text: error,
            type: 'error',
        }));
    },

    initJqPagination(data) {
        let pageNumber = 1;
        const pageLimit = 10;
        const that = this;
        const total = Math.ceil(data.pagination.totalCount / pageLimit);
        if (total === 0) {
            return;
        }
        $('#jqPagination').jqPaginator({
            totalPages: Math.ceil(data.pagination.totalCount / pageLimit),
            visiblePages: 10,
            currentPage: pageNumber,
            onPageChange(num) {
                if (pageNumber === num && data.pagination.offset === '0') return;
                window.b2b.$overlay.show();
                pageNumber = num;
                window.b2b.offset = (num - 1) * window.b2b.limit;
                that.getAddressBookList(false);
            },
        });
    },

    checkActionPermission(checkType) {
        if (checkType === undefined || !checkType) return false;
        if (sessionStorage.getItem('hasActionPermission') === '0') {
            swal({
                type: 'error',
                text: `${this.tipStringMap[checkType]} has been disabled by the system administrators.`,
            });
            return false;
        }
        return true;
    },

    renderStateSelect(target, element) {
        const countryData = target.find('option:selected').data('country');
        if (countryData.states.length > 0) {
            let frage = '';
            frage += countryData.states.map(item => `<option value="${item.stateName}" data-states='${JSON.stringify(item)}'>${item.stateName}</option>`);
            element.find('.state_select').html(frage).removeClass('hide').siblings('input[type="text"]').addClass('hide');
        } else {
            element.find('.state_select').addClass('hide').siblings('input[type="text"]').val('').removeClass('hide');
        }
        element.find('.state_select').siblings('span').hide().parent().removeClass('form-field--success form-field--error');
    },

    initSearchBarEven() {
        $('body').on('click', '#filter_open_button', (event) => {
            event.stopPropagation();
            $('.filter-box').toggleClass('hide');
        });

        $('body').on('click', '#filter_cancel_button', (event) => {
            event.stopPropagation();
            $('.filter-box').find('#state_filter_select').addClass('hide').siblings('input[type="text"]').removeClass('hide');
            document.querySelector('.filter-box').reset();
            this.getAddressBookList(true);
        });

        $('body').on('keydown', '#keyword', (event) => {
            if (event.which === 13) this.getAddressBookList(true);
        });

        $('body').on('input', '#keyword', (event) => {
            event.stopPropagation();
            $('.search-input-box').find('.button-clear').toggleClass('hide', $(event.target).val() === '');
        });

        $('body').on('click', '.button-clear', (event) => {
            event.stopPropagation();
            $('#keyword').val('').siblings('.button-clear').addClass('hide');
            this.getAddressBookList(true);
        });

        $('body').on('click', '#filter_apply_button', (event) => {
            event.stopPropagation();
            this.getAddressBookList(true);
        });

        $('body').on('click', '#search_button', (event) => {
            event.stopPropagation();
            this.getAddressBookList(true);
        });

        $('.body').on('change', '#country_filter', (event) => {
            const $target = $(event.target);
            this.renderStateSelect($target, $('.filter-box'));
        });
    },

    initAddAddressBookEven() {
        const newAddressBookValidator = nod({
            button: '#modal-address-book-new-form form input[type="button"]',
        });

        const newAddressBookFormSelector = '#modal-address-book-new-form form';
        newAddressBookValidator.add([
            {
                selector: `${newAddressBookFormSelector} input[name="first_name"]`,
                validate: 'presence',
                errorMessage: 'The ‘First Name’ field can’t be left empty.',
            }, {
                selector: `${newAddressBookFormSelector} input[name="last_name"]`,
                validate: 'presence',
                errorMessage: 'The ‘Last Name’ field can’t be left empty',
            }, {
                selector: `${newAddressBookFormSelector} input[name="address_line1"]`,
                validate: 'presence',
                errorMessage: 'The ‘Address Line 1’ field can’t be left empty',
            }, {
                selector: `${newAddressBookFormSelector} input[name="city"]`,
                validate: 'presence',
                errorMessage: 'The ‘City’ field can’t be left empty',
            }, {
                selector: `${newAddressBookFormSelector} select[name="country"]`,
                validate: 'presence',
                errorMessage: 'The ‘Country’ field can’t be left empty',
            }, {
                selector: `${newAddressBookFormSelector} input[name="zipcode"]`,
                validate: 'presence',
                errorMessage: 'The ‘Zipcode’ field can’t be left empty',
            }, {
                selector: `${newAddressBookFormSelector} input[name="state_input"]`,
                validate(callback, value) {
                    if ($('#modal-address-book-new-form').find('#new_state_input').hasClass('hide')) {
                        callback(true);
                    } else {
                        callback(value !== '');
                    }
                },
                errorMessage: 'The ‘State’ field can’t be left empty',
            }, {
                selector: `${newAddressBookFormSelector} input[name="phone_number"]`,
                validate(callback, value) {
                    if (value.length > 0) {
                        callback(formUtils().isB2BPhoneNumber(value));
                    } else {
                        callback(true);
                    }
                },
                errorMessage: 'Please enter a valid phone number.',
            },
        ]);

        $('body').on('click', '#add_new_address_button', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('add')) {
                const modalLocation = $(event.target).data('reveal-id');
                $(`#${modalLocation}`).foundation('reveal', 'open');
                newAddressBookValidator.areAll('invalid');
            }
        });

        $('#modal-address-book-new-form').on('click', '#save_new_address', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('add')) {
                newAddressBookValidator.performCheck();
                if (!newAddressBookValidator.areAll('valid')) {
                    return;
                }
                const addressBookData = {
                    firstName: $('#new_first_name', '#modal-address-book-new-form').val(),
                    lastName: $('#new_last_name', '#modal-address-book-new-form').val(),
                    addressLine1: $('#new_address_line1', '#modal-address-book-new-form').val(),
                    addressLine2: $('#new_address_line2', '#modal-address-book-new-form').val(),
                    label: $('#address_label', '#modal-address-book-new-form').val(),
                    city: $('#new_city', '#modal-address-book-new-form').val(),
                    country: {
                        countryName: $('#new_country', '#modal-address-book-new-form').val(),
                        countryCode: $('#new_country', '#modal-address-book-new-form').find('option:selected').data('country').countryCode,
                    },
                    zipCode: $('#new_zipcode', '#modal-address-book-new-form').val(),
                    state: {
                        stateName: $('#new_state_input', '#modal-address-book-new-form').hasClass('hide') ? $('#new_state_select', '#modal-address-book-new-form').val() : $('#new_state_input', '#modal-address-book-new-form').val(),
                        stateCode: $('#new_state_input', '#modal-address-book-new-form').hasClass('hide') ? $('#new_state_select', '#modal-address-book-new-form').find('option:selected').data('states').stateCode : '',
                    },
                    phoneNumber: $('#new_phone_number', '#modal-address-book-new-form').val(),
                    isShipping: $('#new_is_shipping', '#modal-address-book-new-form').is(':checked') ? '1' : '0',
                    isDefaultShipping: $('#new_is_default_shipping', '#modal-address-book-new-form').is(':checked') && $('#new_is_shipping', '#modal-address-book-new-form').is(':checked') ? '1' : '0',
                    isBilling: $('#new_is_billing', '#modal-address-book-new-form').is(':checked') ? '1' : '0',
                    isDefaultBilling: $('#new_is_default_billing', '#modal-address-book-new-form').is(':checked') && $('#new_is_billing', '#modal-address-book-new-form').is(':checked') ? '1' : '0',
                };
                window.b2b.$overlay.show();
                b2bAjax.createAddressBook(this.sessionStorageCompanyId, addressBookData).then((res) => {
                    if (res.code !== 200) {
                        swal({
                            text: res.message,
                            type: 'error',
                        });
                        return;
                    }
                    if (res.data) {
                        this.getAddressBookList(true);
                        $('#modal-address-book-new-form').find('.modal-close').eq(0).click();
                    }
                }).catch((error) => swal({
                    text: error,
                    type: 'error',
                }));
            }
        });

        $('#modal-address-book-new-form').on('click', '.modal-close', () => {
            const fields = $('#modal-address-book-new-form').find('.form-fieldset').eq(0).children();
            $('#modal-address-book-new-form').find('form').eq(0)[0].reset();
            setTimeout(() => {
                fields.find('.children_checkbox').addClass('hide');
                fields.removeClass('form-field--error form-field--success');
                fields.find('span').css({
                    display: 'none',
                });
            }, 500);
        });

        $('#modal-address-book-new-form').on('change', '#new_country', (event) => {
            const $target = $(event.target);
            this.renderStateSelect($target, $('#modal-address-book-new-form'));
        });
    },

    initAddressBookListEven() {
        $(document).on('click', () => {
            $('.dropdown-action-wrap .dropdown-menu').hide();
        });

        $('body').on('click', '#new_is_shipping, #new_is_billing, #edit_is_shipping, #edit_is_billing', (event) => {
            event.stopPropagation();
            const $target = $(event.target);
            $target.siblings('.children_checkbox').toggleClass('hide').find('input[type="checkbox"]:checked').prop('checked', false);
        });

        $('.address-lists-table').on('click', '.td-action-dropdown', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('action')) {
                $('.dropdown-menu').hide();
                const $target = $(event.target);
                $target.siblings('.dropdown-menu').show();
            }
        });

        $('.address-lists-table').on('click', '[data-delete-address]', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('delete')) {
                swal({
                    text: 'Are you sure you want to delete the address?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sure',
                    closeOnConfirm: false,
                }).then(() => {
                    const $target = $(event.target);
                    const addressId = $target.parents('tr').attr('id');
                    window.b2b.$overlay.show();

                    b2bAjax.deleteAddressBook(this.sessionStorageCompanyId, addressId, { isActive: 0 }).then((res) => {
                        if (res.code !== 200) {
                            return swal({ text: res.message, type: 'error' });
                        }
                        swal({
                            text: 'You have successfully deleted the address',
                            type: 'success',
                        });
                        this.getAddressBookList(true);
                    }).catch((error) => {
                        swal({ text: error, type: 'error' });
                    });
                }).catch(() => {});
            }
        });

        $('.address-lists-table').on('click', '[data-set-shipping]', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('setDefaultShipping')) {
                swal({
                    text: 'Are you sure you want to set the address as default shipping address?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sure',
                    closeOnConfirm: false,
                }).then(() => {
                    const $target = $(event.target);
                    const addressId = $target.parents('tr').attr('id');
                    const data = $target.parents('tr').data('address');
                    window.b2b.$overlay.show();
                    data.isShipping = '1';
                    data.isDefaultShipping = '1';
                    b2bAjax.updateAddressBook(this.sessionStorageCompanyId, addressId, data).then((res) => {
                        if (res.code !== 200) {
                            return swal({ text: res.message, type: 'error' });
                        }
                        swal({
                            text: 'You have successfully set the address to default',
                            type: 'success',
                        });
                        this.getAddressBookList(true);
                    }).catch((error) => {
                        swal({ text: error, type: 'error' });
                    });
                }).catch(() => {});
            }
        });

        $('.address-lists-table').on('click', '[data-set-billing]', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('setDefaultBilling')) {
                swal({
                    text: 'Are you sure you want to set the address as default billing address?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sure',
                    closeOnConfirm: false,
                }).then(() => {
                    const $target = $(event.target);
                    const addressId = $target.parents('tr').attr('id');
                    const data = $target.parents('tr').data('address');
                    window.b2b.$overlay.show();
                    data.isBilling = '1';
                    data.isDefaultBilling = '1';
                    b2bAjax.updateAddressBook(this.sessionStorageCompanyId, addressId, data).then((res) => {
                        if (res.code !== 200) {
                            return swal({ text: res.message, type: 'error' });
                        }
                        swal({
                            text: 'You have successfully set the address to default',
                            type: 'success',
                        });
                        this.getAddressBookList(true);
                    }).catch((error) => {
                        swal({ text: error, type: 'error' });
                    });
                }).catch(() => {});
            }
        });
    },

    initEditAddressBookEven() {
        const editAddressBookValidator = nod({
            button: '#modal-address-book-edit-form form input[type="button"]',
        });

        const editAddressBookFormSelector = '#modal-address-book-edit-form form';
        editAddressBookValidator.add([
            {
                selector: `${editAddressBookFormSelector} input[name="first_name"]`,
                validate: 'presence',
                errorMessage: 'The ‘First Name’ field can’t be left empty.',
            }, {
                selector: `${editAddressBookFormSelector} input[name="last_name"]`,
                validate: 'presence',
                errorMessage: 'The ‘Last Name’ field can’t be left empty',
            }, {
                selector: `${editAddressBookFormSelector} input[name="address_line1"]`,
                validate: 'presence',
                errorMessage: 'The ‘Address Line 1’ field can’t be left empty',
            }, {
                selector: `${editAddressBookFormSelector} input[name="city"]`,
                validate: 'presence',
                errorMessage: 'The ‘City’ field can’t be left empty',
            }, {
                selector: `${editAddressBookFormSelector} select[name="country"]`,
                validate: 'presence',
                errorMessage: 'The ‘Country’ field can’t be left empty',
            }, {
                selector: `${editAddressBookFormSelector} input[name="zipcode"]`,
                validate: 'presence',
                errorMessage: 'The ‘Zipcode’ field can’t be left empty',
            }, {
                selector: `${editAddressBookFormSelector} input[name="state_input"]`,
                validate(callback, value) {
                    if ($('#modal-address-book-edit-form').find('#edit_state_input').hasClass('hide')) {
                        callback(true);
                    } else {
                        callback(value !== '');
                    }
                },
                errorMessage: 'The ‘State’ field can’t be left empty',
            }, {
                selector: `${editAddressBookFormSelector} input[name="phone_number"]`,
                validate(callback, value) {
                    if (value.length > 0) {
                        callback(formUtils().isB2BPhoneNumber(value));
                    } else {
                        callback(true);
                    }
                },
                errorMessage: 'Please enter a valid phone number.',
            },
        ]);

        $('.address-lists-table').on('click', '[data-edit-address]', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('edit')) {
                const $target = $(event.target);
                const $form = $('#modal-address-book-edit-form').find('form');
                const addressId = $target.parents('tr').attr('id');
                const modalLocation = $target.parent().data('reveal-id');
                window.b2b.$overlay.show();
                b2bAjax.getAddressById(this.sessionStorageCompanyId, addressId).then((res) => {
                    if (res.code !== 200) {
                        return swal({ text: res.message, type: 'error' });
                    }
                    $('#edit_first_name', $form).val(res.data.firstName);
                    $('#edit_last_name', $form).val(res.data.lastName);
                    $('#edit_address_line1', $form).val(res.data.addressLine1);
                    $('#edit_address_line2', $form).val(res.data.addressLine2);
                    $('#edit_address_label', $form).val(res.data.label);
                    $('#edit_city', $form).val(res.data.city);
                    $('#edit_country', $form).val(res.data.country.countryName);
                    if (res.data.country.countryCode !== '') {
                        this.renderStateSelect($('#edit_country', $form), $('#modal-address-book-edit-form'));
                    }
                    $('#edit_zipcode', $form).val(res.data.zipCode);
                    if (res.data.state.stateCode) {
                        $('#edit_state_select', $form).removeClass('hide').val(res.data.state.stateName).siblings('input[type="text"]').addClass('hide');
                    } else {
                        $('#edit_state_input', $form).val(res.data.state.stateName);
                    }
                    $('#edit_phone_number', $form).val(res.data.phoneNumber);
                    $('#edit_address_id', $form).val(res.data.addressId);
                    if (res.data.isShipping === '1') {
                        $('#edit_is_shipping', $form).prop('checked', true).siblings('.children_checkbox').removeClass('hide');
                        $('#edit_is_default_shipping', $form).prop('checked', res.data.isDefaultShipping === '1');
                    }
                    if (res.data.isBilling === '1') {
                        $('#edit_is_billing', $form).prop('checked', true).siblings('.children_checkbox').removeClass('hide');
                        $('#edit_is_default_billing', $form).prop('checked', res.data.isDefaultBilling === '1');
                    }
                    $(`#${modalLocation}`).foundation('reveal', 'open');
                    editAddressBookValidator.areAll('invalid');
                    window.b2b.$overlay.hide();
                }).catch((error) => {
                    swal({ text: error, type: 'error' });
                });
            }
        });

        $('#modal-address-book-edit-form').on('click', '#update_address', (event) => {
            event.stopPropagation();
            if (this.checkActionPermission('edit')) {
                editAddressBookValidator.performCheck();
                if (!editAddressBookValidator.areAll('valid')) {
                    return;
                }
                const addressId = $('#edit_address_id', '#modal-address-book-edit-form').val();
                const addressBookData = {
                    firstName: $('#edit_first_name', '#modal-address-book-edit-form').val(),
                    lastName: $('#edit_last_name', '#modal-address-book-edit-form').val(),
                    addressLine1: $('#edit_address_line1', '#modal-address-book-edit-form').val(),
                    addressLine2: $('#edit_address_line2', '#modal-address-book-edit-form').val(),
                    label: $('#edit_address_label', '#modal-address-book-edit-form').val(),
                    city: $('#edit_city', '#modal-address-book-edit-form').val(),
                    country: {
                        countryName: $('#edit_country', '#modal-address-book-edit-form').val(),
                        countryCode: $('#edit_country', '#modal-address-book-edit-form').find('option:selected').data('country').countryCode,
                    },
                    zipCode: $('#edit_zipcode', '#modal-address-book-edit-form').val(),
                    state: {
                        stateName: $('#edit_state_input', '#modal-address-book-edit-form').hasClass('hide') ? $('#edit_state_select', '#modal-address-book-edit-form').val() : $('#edit_state_input', '#modal-address-book-edit-form').val(),
                        stateCode: $('#edit_state_input', '#modal-address-book-edit-form').hasClass('hide') ? $('#edit_state_select', '#modal-address-book-edit-form').find('option:selected').data('states').stateCode : '',
                    },
                    phoneNumber: $('#edit_phone_number', '#modal-address-book-edit-form').val(),
                    isShipping: $('#edit_is_shipping', '#modal-address-book-edit-form').is(':checked') ? '1' : '0',
                    isDefaultShipping: $('#edit_is_default_shipping', '#modal-address-book-edit-form').is(':checked') && $('#edit_is_shipping', '#modal-address-book-edit-form').is(':checked') ? '1' : '0',
                    isBilling: $('#edit_is_billing', '#modal-address-book-edit-form').is(':checked') ? '1' : '0',
                    isDefaultBilling: $('#edit_is_default_billing', '#modal-address-book-edit-form').is(':checked') && $('#edit_is_billing', '#modal-address-book-edit-form').is(':checked') ? '1' : '0',
                };
                window.b2b.$overlay.show();
                b2bAjax.updateAddressBook(this.sessionStorageCompanyId, addressId, addressBookData).then((res) => {
                    if (res.code !== 200) {
                        swal({
                            text: res.message,
                            type: 'error',
                        });
                        return;
                    }
                    if (res.data) {
                        this.getAddressBookList(true);
                        $('#modal-address-book-edit-form').find('.modal-close').eq(0).click();
                    }
                }).catch((error) => {
                    swal({ text: error, type: 'error' });
                });
            }
        });

        $('#modal-address-book-edit-form').on('change', '#edit_country', (event) => {
            const $target = $(event.target);
            this.renderStateSelect($target, $('#modal-address-book-edit-form'));
        });

        $('#modal-address-book-edit-form').on('click', '.modal-close', () => {
            const fields = $('#modal-address-book-edit-form').find('.form-fieldset').eq(0).children();
            $('#modal-address-book-edit-form').find('form').eq(0)[0].reset();
            fields.find('.children_checkbox').addClass('hide');
            fields.removeClass('form-field--error form-field--success');
            fields.find('span').css({
                display: 'none',
            });
        });
    },

    getAddressActionPermission() {
        return new Promise((resolve, reject) => {
            b2bAjax.getAddressPermission().then((res) => {
                if (res.code !== 200) {
                    return swal({
                        text: res.message,
                        type: 'error',
                    });
                }
                sessionStorage.setItem('hasActionPermission', res.data.isAllow);
                sessionStorage.setItem('isEnabledB2bAddressBook', res.data.isEnabled);
                resolve(res.data);
            }).catch((error) => reject(error));
        });
    },
};
