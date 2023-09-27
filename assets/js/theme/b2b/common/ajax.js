import swal from 'sweetalert2';
import config from '../config';

class B2BAjax {
    constructor({ baseUrl = '' }) {
        this.baseUrl = baseUrl;
    }
    base(type, url, data, hasOverlay) {
        const $ele = $('#b2b_loading_overlay');
        const b2bToken = sessionStorage.getItem('b2bToken');

        if ($ele.length > 0 && hasOverlay) {
            $ele.show();
        }
        const ajaxConfig = {
            data,
        };

        if (type !== 'get') {
            ajaxConfig.contentType = 'application/json';
            ajaxConfig.data = JSON.stringify(data);
        }
        return new Promise((resolve, reject) => {
            $.ajax(Object.assign(ajaxConfig, {
                type,
                url: `${this.baseUrl}${url}`,
                headers: {
                    authToken: b2bToken,
                },
                beforeSend: (XMLHttpRequest) => {
                    if (b2bToken) {
                        XMLHttpRequest.setRequestHeader('authToken', b2bToken);
                    }
                },
                success: (resp) => {
                    resolve(resp);
                },
                error: () => {
                    swal({
                        text: 'There is a network error. Please try again later',
                        type: 'error',
                    });
                    reject();
                },
                complete: () => {
                    if ($ele.length > 0) {
                        $ele.hide();
                    }
                },
            }));
        });
    }

    get(url, data, hasOverlay) {
        return this.base('get', url, data, hasOverlay);
    }

    post(url, data) {
        return this.base('post', url, data);
    }

    delete(url, data) {
        return this.base('delete', url, data);
    }

    put(url, data) {
        return this.base('put', url, data);
    }
}

const b2bAjax = new B2BAjax({
    baseUrl: config.apiRootUrl,
});
const getToken = (data) => b2bAjax.post('/api/v2/login', data);
const getUserRole = (userId) => b2bAjax.get(`/api/v2/users/${userId}?isBcId=1`);
const getAdvQtyState = () => b2bAjax.get('/api/v2/store-configs/switch-status?key=interval_quantity');
const getCompany = (customerId) => b2bAjax.get(`/api/v2/customers/${customerId}/companies`);
const getProductsBySku = (data) => b2bAjax.get('/api/v2/catalogs/quickProduct', data);
const getAdvQtyBySkus = (data) => b2bAjax.get('/api/v2/qty/quantity-limit-list', data);
const getAdvQtyBySkusNew = (data) => b2bAjax.post('/api/v2/qty/quantity-limit-list', data);
const getCartAdvQtyCheckState = (data) => b2bAjax.get(`/api/v2/qty/cartLimit/${data}`);
const getShoppingLists = () => b2bAjax.get('/api/v2/shoppinglists/lists');
const getVariantsByProductId = (data) => b2bAjax.get('/api/v2/catalogs/variants', data, true);
const getShoppingListsInfo = (data) => b2bAjax.get('/api/v2/shoppinglists', data);
const addProductToShoppingList = (data) => b2bAjax.post('/api/v2/shoppinglists/items', data);
const createShopingList = (data) => b2bAjax.post('/api/v2/shoppinglists', data);
const deleteShopingList = (shoppingListId) => b2bAjax.delete(`/api/v2/shoppinglists/${shoppingListId}`);
const getShoppingListItems = (data) => b2bAjax.get('/api/v2/shoppinglists/items', data);
const updateShoppingList = (data) => b2bAjax.put('/api/v2/shoppinglists', data);
const checkAvailableProducts = (data) => b2bAjax.get('/api/v2/catalog/products/availablity', data);
const deleteShopingListItme = (shoppingListId, itemId) => b2bAjax.delete(`/api/v2/shoppinglists/${shoppingListId}/items/${itemId}`);
const updateShoppingListItme = (data) => b2bAjax.put('/api/v2/shoppinglists/items', data);
const getCompanyList = (salesRepId, data) => b2bAjax.get(`/api/v2/sales-reps/${salesRepId}/companies`, data);
const beginMasqueradeCompany = (companyId, customerId) => b2bAjax.put(`/api/v2/sales-reps/${customerId}/companies/${companyId}/begin-masq`);
const endMasqueradeCompany = (customerId, companyId) => b2bAjax.put(`/api/v2/sales-reps/${customerId}/companies/${companyId}/end-masq`);
const getOrderList = (data) => b2bAjax.get('/api/v2/orders', data);
const getOrderListImage = (data) => b2bAjax.get('/api/v2/orders/images', data);
const getOrderProducts = (orderId) => b2bAjax.get(`/api/v2/orders/${orderId}/products`);
const getOrderDetail = (orderId) => b2bAjax.get(`/api/v2/orders/${orderId}/details`);
const updateCompany = (companyId, data) => b2bAjax.put(`/api/v2/companies/${companyId}/basic-info`, data);
const initPage = (customerId) => b2bAjax.get(`/api/v2/customers/${customerId}/companies`);
const creatCompany = (bypassStoreHash, data) => b2bAjax.post(`/api/v2/companies/${bypassStoreHash}`, data);
const updateCompanyInfo = (companyId, data) => b2bAjax.put(`/api/v2/companies/${companyId}/basic-info`, data);
const initCompanyRegisterPage = (customerId) => b2bAjax.get(`/api/v2/customers/${customerId}/companies`);
const createCompany = (data) => b2bAjax.post('/api/v2/frontend/companies', data);
const getCompanyUser = (companyId, data) => b2bAjax.get(`/api/v2/companies/${companyId}/users`, data);
const inspectCustomerEmail = (email, data) => b2bAjax.get(`/api/v2/companies/validations/backend/user-emails/${email}`, data);
const saveNewUser = (data) => b2bAjax.post('/api/v2/users', data);
const updateUserInfo = (userId, data) => b2bAjax.put(`/api/v2/users/${userId}`, data);
const deleteUser = (userId) => b2bAjax.delete(`/api/v2/users/${userId}`);
const getSelerep = (customerId) => b2bAjax.get(`/api/v2/sales-reps/${customerId}/companies/masquerading`);
const getAddressBookBySearch = (companyId, data) => b2bAjax.post(`/api/v2/companies/${companyId}/addresses/searches`, data);
const getCountries = () => b2bAjax.get('/api/v2/companies/addresses/countries');
const createAddressBook = (companyId, data) => b2bAjax.post(`/api/v2/companies/${companyId}/addresses`, data);
const getAddressById = (companyId, addressId) => b2bAjax.get(`/api/v2/companies/${companyId}/addresses/${addressId}`);
const updateAddressBook = (companyId, addressId, data) => b2bAjax.put(`/api/v2/companies/${companyId}/addresses/${addressId}`, data);
const deleteAddressBook = (companyId, addressId, data) => b2bAjax.put(`/api/v2/companies/${companyId}/addresses/${addressId}/activation`, data);
const getDefaultAddressesByCompanyId = (companyId) => b2bAjax.get(`/api/v2/companies/${companyId}/default-addresses`);
const getAddressPermission = () => b2bAjax.get('/api/v2/companies/addresses/permission');
const getQuoteList = (params) => b2bAjax.get('/api/v2/quotes', params);
const deleteQuoteList = (quoteId) => b2bAjax.delete(`/api/v2/quotes/${quoteId}`);
const quoteCheckout = (quoteId) => b2bAjax.post(`/api/v2/quotes/${quoteId}/checkout`);
const deleteCheckoutInfo = (quoteId) => b2bAjax.delete(`/api/v2/quotes/${quoteId}/checkout`);
const getDefaultAddresses = (companyId) => b2bAjax.get(`/api/v2/quotes/info/store-company/${companyId}`);
const createQuote = (data) => b2bAjax.post('/api/v2/quotes', data);
const getQuote = (quoteId) => b2bAjax.get(`/api/v2/quotes/${quoteId}`);
const sendEmail = (data) => b2bAjax.post('/api/v2/emails/quotes', data);
const getProductsBySkuQuick = (data) => b2bAjax.get('/api/v2/catalogs/quick-order-pad', data);
const getProductsBySkuQuickByPost = (data) => b2bAjax.post('/api/v2/catalogs/quick-order-pad', data);
const getQuoteAdress = (companyId, data) => b2bAjax.get(`/api/v2/companies/${companyId}/addresses/searches`, data);
const updateQuote = (quoteId, data) => b2bAjax.put(`/api/v2/quotes/${quoteId}`, data);
const exportPDF = (quoteId) => b2bAjax.get(`/api/v2/quotes/${quoteId}/pdf-export`);
const getShoppingListItemsExtension = (data) => b2bAjax.get('/api/v2/shoppinglists/items-extension', data);
export default {
    getToken,
    getUserRole,
    getAdvQtyState,
    getCompany,
    getProductsBySku,
    getAdvQtyBySkus,
    getCartAdvQtyCheckState,
    getShoppingLists,
    getVariantsByProductId,
    getShoppingListsInfo,
    addProductToShoppingList,
    createShopingList,
    deleteShopingList,
    getShoppingListItems,
    updateShoppingList,
    checkAvailableProducts,
    deleteShopingListItme,
    updateShoppingListItme,
    getCompanyList,
    beginMasqueradeCompany,
    endMasqueradeCompany,
    getOrderList,
    getOrderListImage,
    getOrderProducts,
    getOrderDetail,
    updateCompany,
    initPage,
    creatCompany,
    updateCompanyInfo,
    initCompanyRegisterPage,
    createCompany,
    getCompanyUser,
    inspectCustomerEmail,
    saveNewUser,
    updateUserInfo,
    deleteUser,
    getSelerep,
    getAddressBookBySearch,
    getCountries,
    getAddressById,
    createAddressBook,
    updateAddressBook,
    deleteAddressBook,
    getDefaultAddressesByCompanyId,
    getAddressPermission,
    getQuoteList,
    deleteQuoteList,
    quoteCheckout,
    deleteCheckoutInfo,
    getDefaultAddresses,
    createQuote,
    getQuote,
    sendEmail,
    getProductsBySkuQuick,
    getQuoteAdress,
    updateQuote,
    exportPDF,
    getShoppingListItemsExtension,
    getProductsBySkuQuickByPost,
    getAdvQtyBySkusNew,
};
