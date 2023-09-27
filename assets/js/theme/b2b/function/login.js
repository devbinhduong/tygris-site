import b2bAjax from '../common/ajax';
import initPageFunction from './initPageFunction';
import swal from 'sweetalert2';
import hideAddToCartBtn from '../common/hideAllAddCartBtn';


/**
 * @function b2bUser b2bUser logic
 * @return void
 * @param {string} customerId
 * @param {object} context BC's context
 */
export async function b2bUser(customerId, context) {
    const hasCompanyId = Boolean(sessionStorage.getItem('companyId'));
    const Status = sessionStorage.getItem('companyStatus');
    const roleId = sessionStorage.getItem('roleId');
    const salerRepInAgain = sessionStorage.getItem('salerRepInAgain');
    /**
     * need to getCompany call when there is no companyId in the session storage
     */
    if (!hasCompanyId || !Status) {
        const res = await b2bAjax.getCompany(customerId);
        const {
            data: {
                companyId = '',
                companyStatus = '',
                companyName = '',
            } = {},
            code,
        } = res;

        if (code !== 200) {
            // console.log(text);
        }
        if (roleId === '2') {
            hideAddToCartBtn();
        }
        // if saler rep first comming
        if (roleId === '3' && !salerRepInAgain) {
            sessionStorage.removeItem('salerRepInAgain', 'true');
        }

        if (roleId && roleId !== '3') {
            sessionStorage.setItem('companyId', companyId);
            sessionStorage.setItem('companyStatus', companyStatus);
        }

        if (companyStatus === '1') {
            sessionStorage.removeItem('isBtcUser');
        }

        if (companyStatus && companyStatus !== '1' && roleId !== '3') {
            sessionStorage.setItem('isBtcUser', 'true');
        }
        if (companyName) {
            sessionStorage.setItem('companyName', companyName);
        }
    }

    window.b2b.initB2bButton();
    initPageFunction(context);
}

/**
 * need to init B2b functionalities when users without roleId login at the first time
 * @function initB2bUser
 * @param {string} customerId
 * @param {object} context
 * @return void
 */
export async function initB2bUser(customerId, context) {
    const res = await b2bAjax.getUserRole(customerId);
    const SalerRep = sessionStorage.getItem('SalerRep');
    const {
        data: {
            roleId,
            userId,
        },
        code,
    } = res;

    if (code !== 200) {
        // console.log(text);
    }
    if (!roleId) {
        return false;
    }
    if (roleId === '2') {
        hideAddToCartBtn();
    }
    sessionStorage.setItem('roleId', roleId);
    sessionStorage.setItem('userId', userId);

    if (roleId.toString() === '3' && !SalerRep) {
        // if seler rep first commming
        b2bAjax.getSelerep(customerId).then(result => {
            if (result.code !== 200) {
                return swal({
                    type: 'error',
                    text: result.message,
                });
            }

            const masqueradeCompanyId = result.data.companyId;
            if (masqueradeCompanyId) {
                b2bAjax.endMasqueradeCompany(userId, masqueradeCompanyId).then(() => {
                    sessionStorage.setItem('SalerRep', 'true');
                    window.location.href = '/dashboard/';
                });
            } else {
                sessionStorage.setItem('SalerRep', 'true');
                window.location.href = '/dashboard/';
            }
        });
    } else {
        b2bUser(userId, context);
    }
}
