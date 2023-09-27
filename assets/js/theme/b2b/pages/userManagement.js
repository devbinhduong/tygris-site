import $ from 'jquery';
import b2bAjax from '../common/ajax';
import nod from '../../common/nod';
import formUtils from '../common/formUtils';
import swal from 'sweetalert2';
import '../tools/jqPaginator';

export default function () {
    const inspect = formUtils();
    let gRoleId = '';
    let companyId = '';
    let emailStatus = '';
    let userInfo = '';

    const $userTable = $('#user_management_table');
    const $newUserModal = $('#modal-user-management-new-form');
    const $editUserModal = $('#modal-user-management-edit-form');
    window.b2b.roleId = ['0', '1', '2'];
    const $overlay = $('#b2b_loading_overlay');
    window.b2b.offset = 0;
    window.b2b.limit = 10;
    const loadTable = (init) => {
        $overlay.show();
        let role = '';
        const initUserInfo = (data) => {
            if (gRoleId === '1') {
                const thead = `<tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
            </tr>`;

                $userTable.find('thead').html(thead);
            }
            if (data.list) {
                const dataList = data.list;
                for (let i = 0; i < dataList.length; i++) {
                    const userdata = dataList[i];
                    if (userdata.role === '0') {
                        role = 'Admin';
                    } else if (userdata.role === '1') {
                        role = 'Senior Buyer';
                    } else if (userdata.role === '2') {
                        role = 'Junior Buyer';
                    }

                    let tr = '';
                    if (gRoleId === '0') {
                        tr = `<tr data-user='${JSON.stringify(userdata)}'>
                        <td><span class="mobile-td-lable">Name:</span>${userdata.firstName} ${userdata.lastName}</td>
                        <td><span class="mobile-td-lable">Email:</span>${userdata.email}</td>
                        <td><span class="mobile-td-lable">Role:</span>${role}</td>
                        <td class="actions-field t-align-c flex-center">
                            <a href="#" data-reveal-id="modal-user-management-edit-form" class="button button--primary button--small" data-edit-user>Edit</a>
                            <span class="actions-split">|</span>
                            <a href="#" data-delete-user class="button button--small">Delete</a></td>
                    </tr>`;
                    } else if (gRoleId === '1') {
                        tr = `<tr data-user='${JSON.stringify(userdata)}'>
                        <td><span class="mobile-td-lable">Name:</span>${userdata.firstName} ${userdata.lastName}</td>
                        <td><span class="mobile-td-lable">Email:</span>${userdata.email}</td>
                        <td><span class="mobile-td-lable">Role:</span>${role}</td>
                    </tr>`;
                    }

                    $userTable.find('tbody').append(tr);
                }

                $('#num_items').text($userTable.find('tbody tr').length);
            }
        };
        const datas = {
            limit: window.b2b.limit,
            offset: window.b2b.offset,
            role: window.b2b.roleId,
        };
        b2bAjax.getCompanyUser(companyId, datas).then((res) => {
            const usersData = res.data;
            if (res.code !== 200) {
                return swal({ text: res.message, type: 'error' });
            }
            $overlay.hide();

            $userTable.find('tbody').html('');
            initUserInfo(usersData);
            if (init) {
                $('.table-wrap').after(`<div class="pagination">
                <ul class="pagination-list" id="jqPagination"></ul>
                </div>`);
                let pageNumber = 1;
                const pageTotalCount = res.data.pagination.totalCount;
                const pageLimit = res.data.pagination.limit;
                const totle = Math.ceil(pageTotalCount / pageLimit);
                if (totle === 0) {
                    return;
                }
                $('#jqPagination').jqPaginator({
                    totalPages: Math.ceil(pageTotalCount / pageLimit),
                    visiblePages: 10,
                    currentPage: pageNumber,
                    onPageChange(num) {
                        if (pageNumber === num) return;
                        pageNumber = num;
                        window.b2b.offset = (num - 1) * 10;
                        const data = {
                            limit: window.b2b.limit,
                            offset: window.b2b.offset,
                            role: window.b2b.roleId,
                        };
                        b2bAjax.getCompanyUser(companyId, data).then((rej) => {
                            const userData = rej.data;
                            if (res.code !== 200) {
                                return swal({ text: res.message, type: 'error' });
                            }
                            $overlay.hide();

                            $userTable.find('tbody').html('');
                            initUserInfo(userData);
                        });
                    },

                });
            }
        });
    };

    $newUserModal.find('.modal-close').on('click', () => {
        // reset data
        $newUserModal.find('form').eq(0)[0].reset();
        // reset style
        $newUserModal.find('.form-fieldset').eq(0).children().removeClass('form-field--error').removeClass('form-field--success');
        const fields = $newUserModal.find('.form-fieldset').eq(0).children();
        fields.find('span').css({
            display: 'none',
        });
    });
    const checkCustomerEmail = () => {
        const email = $('#email', $newUserModal).val();
        const roleValue = {
            role: $('#role_id', $newUserModal).val(),
        };
        return new Promise((resolve) => {
            b2bAjax.inspectCustomerEmail(email, roleValue).then((res) => {
                const data = res.data;
                if (res.code !== 200) {
                    const messages = res.data.role ? res.data.role : res.data.store_hash;
                    return swal({ text: messages, type: 'error' });
                }
                emailStatus = data.isValid;
                resolve(res, emailStatus);
            });
        });
    };

    const getNewUserInfo = () => {
        if (userInfo && userInfo !== null) {
            $(`${'#modal-user-management-new-form form'} input[name="first_name"]`).val(userInfo.firstName);
            $(`${'#modal-user-management-new-form form'} input[name="last_name"]`).val(userInfo.lastName);
            $(`${'#modal-user-management-new-form form'} input[name="phone"]`).val(userInfo.phoneNumber);
        }
    };

    const interval = setInterval(() => {
        if (sessionStorage.getItem('companyStatus') && sessionStorage.getItem('roleId')) {
            clearInterval(interval);

            gRoleId = sessionStorage.getItem('roleId');
            companyId = sessionStorage.getItem('companyId');
            if (gRoleId === '0') {
                loadTable(true);
            } else if (gRoleId === '1') {
                $('.toolbar-actions').remove();
                loadTable(true);
            } else {
                alert('You have no access to this page.');
                window.location.href = '/account.php';
            }
        }
    }, 100);


    const newUserValidator = nod({
        button: '#modal-user-management-new-form form input[type="button"]',
    });

    const newUserFormSelector = '#modal-user-management-new-form form';

    newUserValidator.add([
        {
            selector: `${newUserFormSelector} input[name="first_name"]`,
            validate: (cb, val) => {
                const result = val.length;
                cb(result);
            },
            errorMessage: 'The ‘First Name’ field can’t be left empty.',
        }, {
            selector: `${newUserFormSelector} input[name="last_name"]`,
            validate: (cb, val) => {
                const result = val.length;
                cb(result);
            },
            errorMessage: 'The ‘Last Name’ field can’t be left empty',
        }, {
            selector: `${newUserFormSelector} input[name="phone"]`,
            validate: ['min-length:1', (cb, val) => {
                const result = inspect.isB2BPhoneNumber(val);
                cb(result);
            }],
            errorMessage: ['The ‘Phone Number’ field can’t be left empty', 'Please enter a valid phone number.'],
        },

    ]);

    // clear email-input style,just a input reset function
    const resetEmail = (status, prompt) => {
        emailStatus = status;
        const nodeEmail = $(`${newUserFormSelector} input[name="email"]`);
        nodeEmail.parent().removeClass('form-field--error');
        nodeEmail.parent().removeClass('form-field--success');
        nodeEmail.next().removeClass('form-inlineMessage');
        nodeEmail.next().css({
            display: 'none',
        });
        if (prompt) {
            nodeEmail.next().html(prompt);
        }
        if (status === '0') {
            $(`${newUserFormSelector} .form-field--success`).removeClass('form-field--success');
        }
    };
    const resetEmailValue = () => {
        $(`${newUserFormSelector} input[name="phone"]`).val('');
        $(`${newUserFormSelector} input[name="first_name"]`).val('');
        $(`${newUserFormSelector} input[name="last_name"]`).val('');
    };
    $(`${newUserFormSelector} input[name="email"]`).on('change', () => {
        const nodeEmail = $(`${newUserFormSelector} input[name="email"]`);
        const val = nodeEmail.val();
        const pattern = inspect.isB2BEmail;
        const verify = pattern(val);
        resetEmailValue();
        if (verify) {
            checkCustomerEmail(val).then((res) => {
                let prompt = '';
                const status = res.data.isValid;
                userInfo = res.data.userInfo;
                // record status and handle dom
                if (status === '1') {
                    if (userInfo && Object.keys(userInfo).length !== 0) {
                        getNewUserInfo(val);
                        emailStatus = '1';
                        resetEmail('1');
                        nodeEmail.parent().addClass('form-field--success');
                        $(`${newUserFormSelector} input[name="phone"]`).val(userInfo.phone);
                        $(`${newUserFormSelector} input[name="first_name"]`).attr('disabled', false);
                        $(`${newUserFormSelector} input[name="last_name"]`).attr('disabled', false);
                        $(`${newUserFormSelector} input[name="phone"]`).attr('disabled', false);
                    } else {
                        resetEmail('1');
                        nodeEmail.parent().addClass('form-field--success');
                    }
                    $(`${newUserFormSelector} input[name="first_name"]`).attr('disabled', false);
                    $(`${newUserFormSelector} input[name="last_name"]`).attr('disabled', false);
                    $(`${newUserFormSelector} input[name="phone"]`).attr('disabled', false);
                } else if (status === '0') {
                    emailStatus = '0';
                    prompt = 'This user already exists. Please update information to add a new user';
                    resetEmail('0', prompt);
                    nodeEmail.parent().addClass('form-field--error');
                    nodeEmail.next().css({
                        display: 'inline',
                        'margin-top': '5px',
                    });
                    nodeEmail.next().addClass('form-inlineMessage');
                    $(`${newUserFormSelector} input[name="first_name"]`).attr('disabled', true);
                    $(`${newUserFormSelector} input[name="last_name"]`).attr('disabled', true);
                    $(`${newUserFormSelector} input[name="phone"]`).attr('disabled', true);
                }
            });
        } else {
            const status = '';
            const prompt = 'Please enter a valid email address.';
            resetEmail(status, prompt);
            nodeEmail.parent().addClass('form-field--error');
            nodeEmail.next().css({
                display: 'inline',
                'margin-top': '5px',
            });
            nodeEmail.next().addClass('form-inlineMessage');
        }
    });

    // save new user
    $('#save_new_user').on('click', () => {
        newUserValidator.performCheck();
        const nodeEmail = $(`${newUserFormSelector} input[name="email"]`);
        if (!nodeEmail.val()) {
            const prompt = 'The ‘Email’ field can’t be left empty.';
            nodeEmail.parent().addClass('form-field--error');
            nodeEmail.next().css({
                display: 'inline',
                'margin-top': '5px',
            });
            nodeEmail.next().addClass('form-inlineMessage');
            nodeEmail.next().html(prompt);
        }
        if (!newUserValidator.areAll('valid')) {
            return;
        }


        const userData = {
            firstName: $('#first_name', '#modal-user-management-new-form').val(),
            lastName: $('#last_name', '#modal-user-management-new-form').val(),
            email: $('#email', '#modal-user-management-new-form').val(),
            phoneNumber: $('#phone', '#modal-user-management-new-form').val(),
            role: $('#role_id', '#modal-user-management-new-form').val(),

        };
        $overlay.show();
        b2bAjax.saveNewUser(userData).then((res) => {
            if (res.code !== 200) {
                swal({
                    text: res.message,
                    type: 'error',
                });
            }
            if (res.data) {
                $newUserModal.find('.modal-close').eq(0).click();
                loadTable();
            }
        });
    });

    // open edit user modal
    $userTable.on('click', '[data-edit-user]', (event) => {
        const $target = $(event.target);
        const $form = $editUserModal.find('form');
        const userData = $target.parents('tr').attr('data-user');
        const userDataJson = $.parseJSON(userData);
        $('#first_name', $form).val(userDataJson.firstName);
        $('#last_name', $form).val(userDataJson.lastName);
        $('#email', $form).val(userDataJson.email);
        $('#phone', $form).val(userDataJson.phoneNumber);
        $('#role_id', $form).val(userDataJson.role);
        $('#user_id', $form).val(userDataJson.id);

        $editUserModal.find('.modal-close').on('click', () => {
            // reset data
            $editUserModal.find('form').eq(0)[0].reset();
            // reset style
            $editUserModal.find('.form-fieldset').eq(0).children().removeClass('form-field--error').removeClass('form-field--success');
            const fields = $editUserModal.find('.form-fieldset').eq(0).children();
            fields.find('span').css({
                display: 'none',
            });
        });
    });

    const updateUserValidator = nod({
        button: '#modal-user-management-edit-form form input[type="button"]',
    });

    const updateUserFormSelector = '#modal-user-management-edit-form form';

    updateUserValidator.add([
        {
            selector: `${updateUserFormSelector} input[name="first_name"]`,
            validate: (cb, val) => {
                const result = val.length;

                cb(result);
            },
            errorMessage: 'The ‘First Name’ field can’t be left empty.',
        }, {
            selector: `${updateUserFormSelector} input[name="last_name"]`,
            validate: (cb, val) => {
                const result = val.length;

                cb(result);
            },
            errorMessage: 'The ‘Last Name’ field can’t be left empty.',
        }, {
            selector: `${updateUserFormSelector} input[name="email"]`,
            validate: (cb, val) => {
                const result = inspect.isB2BEmail(val);
                cb(result);
            },
            errorMessage: 'Please enter a valid email.',
        }, {
            selector: `${updateUserFormSelector} input[name="phone"]`,
            validate: (cb, val) => {
                const result = inspect.isB2BPhoneNumber(val);

                cb(result);
            },
            errorMessage: 'Please enter a valid phone number.',
        }]);

    // update user
    $('#update_user').on('click', () => {
        updateUserValidator.performCheck();
        if (!updateUserValidator.areAll('valid')) {
            return;
        }

        const userId = $('#user_id', '#modal-user-management-edit-form').val();


        const userData = {
            firstName: $('#first_name', '#modal-user-management-edit-form').val(),
            lastName: $('#last_name', '#modal-user-management-edit-form').val(),
            email: $('#email', '#modal-user-management-edit-form').val(),
            phoneNumber: $('#phone', '#modal-user-management-edit-form').val(),
            role: $('#role_id', '#modal-user-management-edit-form').val(),
        };
        $overlay.show();
        b2bAjax.updateUserInfo(userId, userData).then((res) => {
            if (res.code !== 200) {
                return swal({ text: res.message, type: 'error' });
            }
            $editUserModal.find('.modal-close').eq(0).click();
            loadTable();
        });
    });

    $userTable.on('click', '[data-delete-user]', (event) => {
        swal({
            text: 'Are you sure you want to delete this user?',
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sure',
            closeOnConfirm: false,
        }).then(() => {
            const $target = $(event.target);
            const userDate = $target.parents('tr').attr('data-user');
            const userId = JSON.parse(userDate).id;
            $overlay.show();

            b2bAjax.deleteUser(userId).then((res) => {
                if (res.code !== 200) {
                    return swal({ text: res.message, type: 'error' });
                }
                swal({
                    text: 'You have successfully deleted the user',
                    type: 'success',
                });
                loadTable();
            });
        });
    });
}
