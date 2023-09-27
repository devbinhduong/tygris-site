export default function () {
    const rules = {
        emailReg: /^([A-Za-z0-9_+-.])+@([A-Za-z0-9\-.])+\.([A-Za-z]{2,22})$/,

        phoneNumberReg: /^1?((\s|-)?)((\([0-9]{3}\))|([0-9]{3}))((\s|-)?)[0-9]{3}((\s|-)?)[0-9]{4}$/,

    };

    const isEmpty = (value) => value.length === 0;

    const isB2BEmail = (email) => rules.emailReg.test(email);

    const isB2BPhoneNumber = (phoneNumber) => rules.phoneNumberReg.test(phoneNumber);

    return {
        isB2BEmail,

        isB2BPhoneNumber,

        isEmpty,
    };
}
