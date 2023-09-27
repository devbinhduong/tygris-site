import b2bAjax from '../../common/ajax';
import dashboard from '../../pages/dashboard';

export default function () {
    const companyId = sessionStorage.getItem('companyId');
    const quoteCompany = sessionStorage.getItem('quoteCompany');
    const userId = sessionStorage.getItem('userId');

    if (quoteCompany) {
        b2bAjax.endMasqueradeCompany(userId, companyId)
            .then(res => {
                if (res.code !== 200) {
                    return;
                }
                sessionStorage.removeItem('quoteCompany');
                dashboard.endMasquerade();
            })
            .catch(error => window.b2b.Alert.error(error));
    }
}
