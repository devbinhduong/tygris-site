export default function () {
    return {
        roleId: sessionStorage.getItem('roleId'),
        companyStatus: sessionStorage.getItem('companyStatus'),
    };
}
