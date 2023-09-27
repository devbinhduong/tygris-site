import $ from 'jquery';
import b2bAjax from '../common/ajax';
import nod from '../../common/nod';
import formUtils from '../common/formUtils';
import swal from 'sweetalert2';
import config from '../config';
import getToken from '../common/getToken';
import getBCToken from '../common/getBCToken';
import clearSeesionStorage from '../function/clearSeesionStorage';

export default function (customer) {
    const inspect = formUtils();
    const {
        storeHash: bypassStoreHash,
    } = config;
    const customerId = customer.id;
    const companyFormSelector = '[data-create-company-form]';
    const $companyForm = $('[data-create-company-form]');
    const $companyFormParent = $companyForm.parent();
    const $companyFormSubmitBtn = $companyForm.find('input[type=submit]');
    // const email = customer.email;
    let bcToken;

    const newCompanyValidator = nod({
        button: `${companyFormSelector} input[type="submit"]`,
    });
    const companyStatus = {
        0: 'pendding',
        1: 'aprrove',
        2: 'reject',
    };
    newCompanyValidator.add([{
        selector: `${companyFormSelector} input[name="company_name"]`,
        validate: (cb, val) => {
            const result = val.length;
            cb(result);
        },
        errorMessage: "This field can't be null.",
    }, {
        selector: `${companyFormSelector} input[name="company_user_firstName"]`,
        validate: (cb, val) => {
            const result = val.length;
            cb(result);
        },
        errorMessage: "This field can't be null.",
    }, {
        selector: `${companyFormSelector} input[name="company_user_lastName"]`,
        validate: (cb, val) => {
            const result = val.length;
            cb(result);
        },
        errorMessage: "This field can't be null.",
    }, {
        selector: `${companyFormSelector} input[name="company_user_phone"]`,
        validate: (cb, val) => {
            const result = inspect.isB2BPhoneNumber(val);
            cb(result);
        },
        errorMessage: 'Please enter a valid phone number.',
    }, {
        selector: `${companyFormSelector} input[name="company_user_email"]`,
        validate: (cb, val) => {
            const result = inspect.isB2BEmail(val);
            cb(result);
        },
        errorMessage: 'Please enter a valid email.',
    }]);

    $companyForm.on('submit', (event) => {
        event.preventDefault();
        newCompanyValidator.performCheck();
        if (newCompanyValidator.areAll('valid')) {
            // ajax submit form
            const companyId = $('#company_id', $companyForm).val();
            const companyName = $('#company_name', $companyForm).val();
            const companyAddressStreet1 = $('#company_address_street', $companyForm).val();
            const companyAddressStreet2 = $('#company_address_street2', $companyForm).val();
            const companyAddressCity = $('#company_address_city', $companyForm).val();
            const companyAddressState = $('#company_address_state', $companyForm).val();
            const companyAddressZip = $('#company_address_zip', $companyForm).val();
            const companyUserPhone = $('#company_user_phone', $companyForm).val();
            const companyUseremail = $('#company_user_email', $companyForm).val();
            const companyUserFirstName = $('#company_user_firstName', $companyForm).val();
            const companyUserLastName = $('#company_user_lastName', $companyForm).val();

            if ($companyFormSubmitBtn.attr('data-submit-type') && $companyFormSubmitBtn.attr('data-submit-type') === 'resubmit') {
                // update company info
                const updateCompanyInfoData = {
                    storeHash: bypassStoreHash,
                    companyName,
                    city: companyAddressCity,
                    zipCode: companyAddressZip,
                    addressLine1: companyAddressStreet1,
                    addressLine2: companyAddressStreet2,
                    companyEmail: companyUseremail,
                    phoneNumber: companyUserPhone,
                    state: companyAddressState,
                    companyStatus: '0',
                    bcToken,
                };

                b2bAjax.updateCompanyInfo(companyId, updateCompanyInfoData).then((res) => {
                    if (res.code !== 200) {
                        return swal({ text: res.message, type: 'error' });
                    }
                    swal({
                        allowOutsideClick: false,
                        type: 'success',
                        text: 'Please wait at least 24 hours for approval. Check on this page for the approval status.',
                        showCancelButton: false,
                    }).then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // apply new company
                const companyInfo = {
                    storeHash: bypassStoreHash,
                    companyName,
                    city: companyAddressCity,
                    state: companyAddressState,
                    zipCode: companyAddressZip,
                    addressLine1: companyAddressStreet1,
                    addressLine2: companyAddressStreet2,
                    companyEmail: companyUseremail,
                    companyPhoneNumber: companyUserPhone,
                    companyFirstName: companyUserFirstName,
                    companyLastName: companyUserLastName,
                    customerId,
                };
                // return;
                b2bAjax.createCompany(companyInfo).then((res) => {
                    if (res.code !== 200) {
                        return swal({ text: res.message, type: 'error' });
                    }
                    swal({
                        allowOutsideClick: false,
                        type: 'success',
                        text: 'Please wait at least 24 hours for approval. Check on this page for the approval status.',
                        showCancelButton: false,
                    }).then(() => {
                        window.location.reload();
                    });
                });
            }
        }
    });

    // init page
    getBCToken(config.appClientId).then(response => {
        bcToken = response.data;
        getToken(bcToken).then(Response => {
            const token = Response.data.token;
            if (!token) {
                $companyForm.show();
                return;
            }
            sessionStorage.setItem('b2bToken', token);
            b2bAjax.getUserRole(customerId).then(result => {
                if (result.code !== 200) {
                    return;
                }
                const userId = result.data.userId;
                sessionStorage.setItem('userId', userId);
                b2bAjax.initCompanyRegisterPage(userId).then((res) => {
                    // get companyUsersData);
                    const companyData = res.data;
                    if (companyData && Object.keys(companyData).length === 0) {
                        $companyForm.show();
                        return false;
                    }
                    const fieldsMap = [
                        { selector: '#company_name', value: companyData.companyName },
                        { selector: '#company_address_street', value: companyData.addressLine1 },
                        { selector: '#company_address_street2', value: companyData.addressLine2 },
                        { selector: '#company_address_city', value: companyData.city },
                        { selector: '#company_address_state', value: companyData.state },
                        { selector: '#company_address_zip', value: companyData.zipCode },
                        { selector: '#company_user_firstName', value: companyData.firstName },
                        { selector: '#company_user_lastName', value: companyData.lastName },
                        { selector: '#company_user_phone', value: companyData.phone },
                        { selector: '#company_user_email', value: companyData.email },
                    ];
                    switch (companyData.companyStatus) {
                    case '0':
                        $companyFormParent.html(`<div class="company-state-info"><p style="margin-bottom:0.75rem;">
                        Company application status: ${companyStatus[companyData.companyStatus]}</p>Your application is under review, please wait...</div>`);
                        break;
                    case '1':
                        clearSeesionStorage();
                        $companyFormParent.html('<div class="company-state-info">You are already in company</div>');
                        window.location.href = '/';
                        break;
                    case '2':
                        $companyForm.show();
                        $companyFormSubmitBtn.val('RESUBMIT').attr('data-submit-type', 'resubmit');
                        $companyFormParent.prepend(`<div class="company-state-info"><p style="margin-bottom:0.75rem;">
                        Company application status: ${companyStatus[companyData.companyStatus]}</p>Your application has been rejected, you can resubmit your application.</div>`);

                        // hidden fields
                        $('#company_id', $companyForm).val(companyData.companyId);
                        $('#company_customer_role', $companyForm).val(companyData.customers[0].role);
                        $('#company_customer_id', $companyForm).val(companyData.customers[0].id);

                        for (let i = 0; i < fieldsMap.length; i++) {
                            if (fieldsMap[i].value) {
                                $(fieldsMap[i].selector, $companyForm).val(fieldsMap[i].value);
                            }
                        }
                        break;
                    // improvement: need to discuss about the solution for dealing with the code `3` and `4`
                    case '3':
                        $companyFormParent.html('<div class="company-state-info"><p style="margin-bottom:0.75rem;"></p>Your Company cannot be used, please wait...</div>');
                        break;
                    case '4':
                        $companyFormParent.html('<div class="company-state-info"><p style="margin-bottom:0.75rem;"></p>Your Company cannot be used, please wait...</div>');
                        break;
                    default:
                        break;
                    }
                });
            });
        });
    }).catch(error => {
        swal({
            type: 'error',
            text: error,
        });
    });
}
