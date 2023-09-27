import quickOrderPad from '../pages/quick-order-pad';
import shoppingLists from '../pages/shoppingLists';
import initAdvQuantity from './initAdvQuantity';
import shoppingList from '../pages/shoppingList';
import dashboard from '../pages/dashboard';
import orderLists from '../pages/orderLists';
import isB2bUser from '../common/checkB2bUser';
import orderDetail from '../pages/orderDetail';
import account from '../pages/account';
import companyRegister from '../pages/companyRegister';
import userManagement from '../pages/userManagement';
import addressBook from '../pages/addressBook';
import * as quote from '../pages/quote';
import swal from 'sweetalert2';
import quoteCheckoutId from '../common/quote/clearQuoteSession';
import initPermission from '../common/initPermission';
import b2bAjax from '../common/ajax';


const pageUrls = {
    quickOrderPad: 'pages/custom/page/quick-order-pad',
    search: 'pages/search',
    shoppingLists: 'pages/custom/page/shopping-lists',
    shoppingList: 'pages/custom/page/shopping-list',
    dashboard: 'pages/custom/page/dashboard',
    orderLists: 'pages/account/orders/all',
    orderDetail: 'pages/custom/page/order-detail',
    account: 'pages/account/edit',
    companyRegister: 'pages/custom/page/company-register2',
    userManagement: 'pages/custom/page/user-management',
    addressBook: 'pages/custom/page/address-book',
    quoteList: 'pages/custom/page/quote/quote-list',
    quoteDetail: 'pages/custom/page/quote/quote-detail',
    createQuote: 'pages/custom/page/quote/create-quote',
    quoteEdit: 'pages/custom/page/quote/quote-edit',
};
// these pages need permission check
const permissionPage = {
    quickOrderPad: 'pages/custom/page/quick-order-pad',
    shoppingLists: 'pages/custom/page/shopping-lists',
    shoppingList: 'pages/custom/page/shopping-list',
    dashboard: 'pages/custom/page/dashboard',
    userManagement: 'pages/custom/page/user-management',
    addressBook: 'pages/custom/page/address-book',
    quoteList: 'pages/custom/page/quote/quote-list',
    quoteDetail: 'pages/custom/page/quote/quote-detail',
    createQuote: 'pages/custom/page/quote/create-quote',
    quoteEdit: 'pages/custom/page/quote/quote-edit',
};
const quoteCompanyUrls = ['pages/custom/page/quote/quote-detail', 'pages/custom/page/quote/create-quote', 'pages/custom/page/quote/quote-edit'];
/**
 * initialize page function to deal with the `b2b` folder
 * @param {object} context default point to BC's context
 */

export default function (context) {
    const contextTemplate = context.template ? context.template : context.template_file;
    const pageTemplete = contextTemplate.replace(/\\/g, '/');
    const urls = Object.values(permissionPage);
    const b2bPage = urls.some((item) => item === pageTemplete);
    const isClearQuoteCompany = quoteCompanyUrls.includes(pageTemplete);

    if (!isB2bUser()) {
        window.b2b.initB2bButton();
        if (pageUrls.companyRegister === pageTemplete) {
            companyRegister(context.customer);
            return;
        }
        if (b2bPage) {
            initPermission();
            return;
        }
    }
    if (context.cartId) {
        quoteCheckoutId(context.cartId);
    }

    const comment = () => {
        initAdvQuantity();

        switch (pageTemplete) {
        case pageUrls.quickOrderPad:
            quickOrderPad(context.customer);
            break;
        case pageUrls.shoppingLists:
            shoppingLists.init(context.customer);
            break;
        case pageUrls.shoppingList:
            shoppingList.init(context);
            break;
        case pageUrls.dashboard:
            dashboard.init(context.customer, true);
            break;
        case pageUrls.orderLists:
            orderLists.init(context);
            break;
        case pageUrls.orderDetail:
            orderDetail(context);
            break;
        case pageUrls.account:
            account(context);
            break;
        case pageUrls.userManagement:
            userManagement(context.customer);
            break;
        case pageUrls.addressBook:
            addressBook.getAddressActionPermission().then(() => {
                addressBook.init();
            }).catch((error) => swal({
                text: error,
                type: 'error',
            }));
            break;
        case pageUrls.quoteList:
            quote.QuoteList.init(context);
            break;
        case pageUrls.createQuote:
            quote.CreateQuote.init(context);
            break;
        case pageUrls.quoteDetail:
            quote.QuoteDetail.init(context);
            break;
        case pageUrls.quoteEdit:
            quote.QuoteEdit.init(context);
            break;
        default:
            break;
        }
    };
    if (!isClearQuoteCompany) {
        const companyId = sessionStorage.getItem('companyId');
        const userId = sessionStorage.getItem('userId');
        sessionStorage.removeItem('quotePreviewData');
        const quoteCompany = sessionStorage.getItem('quoteCompany');
        if (quoteCompany) {
            b2bAjax.endMasqueradeCompany(userId, companyId).then(res => {
                if (res.code !== 200) {
                    return;
                }

                sessionStorage.removeItem('quoteCompany');
                sessionStorage.removeItem('quotePreviewData');
                sessionStorage.removeItem('companyId');
                sessionStorage.removeItem('companyStatus');
                sessionStorage.removeItem('companyName');

                $('.bottom-end-masquerade').remove();
                $('.salerep-infobox').remove();
                window.b2b.initNavBtn();
                comment();
            });
        } else {
            comment();
        }
    } else {
        comment();
    }
}
