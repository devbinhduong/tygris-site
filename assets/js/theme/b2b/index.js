/**
 * init b2b functions
 */
import B2b from './init';
import { initB2bUser } from './function/login';

import clearSeesionStorage from './function/clearSeesionStorage';
import getToken from './common/getToken';
import getBCToken from './common/getBCToken';
import hideAddToCartBtn from './common/hideAllAddCartBtn';
import config from './config';
import initPageFunction from './function/initPageFunction';
import swal from 'sweetalert2';
import noLoginRedirectToLogin from './common/noLoginRedirectToLogin';

// put the B2b instance to window, so that we can call it globally.
window.b2b = new B2b();

export default async function () {
    // checkLogin
    const isLogin = !!this.context.customer;
    if (!isLogin) {
        clearSeesionStorage();
        noLoginRedirectToLogin(this.context);
        return;
    }

    const loginEmail = this.context.customer.email;
    const sessionStorageEmail = sessionStorage.getItem('email');
    const roleId = sessionStorage.getItem('roleId');
    const b2bToken = sessionStorage.getItem('b2bToken');
    const customerId = this.context.customer.id;
    let apiToken;
    const isBtcUser = sessionStorage.getItem('isBtcUser');

    const initBCToken = () => new Promise((resolve, reject) => {
        getBCToken(config.appClientId).then(response => {
            resolve(response);
        }).catch(error => {
            swal({
                text: 'Something went wrong,Please contact us.',
                type: 'error',
            });
            reject(error);
        });
    });

    const initApi = () => new Promise((resolve, reject) => {
        initBCToken().then(bcTokenResponse => {
            getToken(bcTokenResponse.data).then(response => {
                if (!response.data) {
                    return;
                }
                apiToken = response.data.token;
                sessionStorage.setItem('email', loginEmail);
                if (!apiToken) {
                    sessionStorage.setItem('isBtcUser', 'true');
                    initPageFunction(this.context);
                    return;
                }
                sessionStorage.setItem('b2bToken', apiToken);
                resolve(true);
            });
        }).catch(error => {
            reject(error);
        });
    });

    const switchRoleId = () => {
    // check role id
        switch (roleId) {
        // junior buyer
        case '2':
            initB2bUser(customerId, this.context);
            hideAddToCartBtn();
            break;
        // handle no roleId, admin ,saler rap
        default:
            initB2bUser(customerId, this.context);
            break;
        }
    };
    const initB2bUserByToken = () => {
        initApi().then((res) => {
            if (res) {
                switchRoleId(roleId);
            }
        });
    };

    window.b2b.init();
    if (loginEmail !== sessionStorageEmail) {
        clearSeesionStorage();
        initB2bUserByToken();
    } else {
        if (isBtcUser) {
            initPageFunction(this.context);
            return;
        }
        if (!b2bToken) {
            initB2bUserByToken();
            return;
        }
        switchRoleId();
    }
}
