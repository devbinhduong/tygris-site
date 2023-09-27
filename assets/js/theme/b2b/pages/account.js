import is2bUser from '../common/checkB2bUser';

export default function () {
    if (!is2bUser()) {
        return;
    }
    // b2b user
    const gRoleDefine = {
        0: 'Admin',
        1: 'Senior Buyer',
        2: 'Junior Buyer ',
        3: 'Sale Representative',
    };
    const $accountForm = $('.form[data-edit-account-form]');
    const $accountEmail = $accountForm.find('[data-field-type="EmailAddress"]').parents('.form-field');
    const gCompanyName = sessionStorage.getItem('companyName') || '';
    const $accountOtherFields = $accountForm.find('[data-field-type="CurrentPassword"]').parents('.form-field').nextAll();
    const gRoleId = parseInt(sessionStorage.getItem('roleId'), 10);

    $('#account_companyname').parents('.form-field--inputText').hide();
    if ($accountEmail.length > 0) {
        $(`<div class="form-field form-field--input form-field--inputText">
                <label class="form-label">
                    Company Name
                </label>
                <input type="text" class="form-input" value="${gCompanyName}" disabled>
            </div>
            <div class="form-field form-field--input form-field--inputText" id="b2b-account-role">
                <label class="form-label">
                    Role
                </label>
                <input type="text" class="form-input" value="${gRoleDefine[gRoleId]}" disabled>
            </div>`).insertAfter($accountEmail);

        if ($accountOtherFields.length > 0) {
            $accountOtherFields.insertAfter($('#b2b-account-role'));
        }
    }
}
