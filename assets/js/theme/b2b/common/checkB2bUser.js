export default function () {
    return Boolean(sessionStorage.getItem('companyId') && (sessionStorage.getItem('companyStatus') === '1') || (sessionStorage.getItem('roleId') === '3'));
}
