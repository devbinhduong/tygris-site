import 'focus-within-polyfill';

import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import privacyCookieNotification from './global/cookieNotification';
import carousel from './common/carousel';
import svgInjector from './global/svg-injector';

import customGlobal from './custom/customGlobal';
import customSidebar from './custom/customSidebar';

export default class Global extends PageManager {
    onReady() {
        const { cartId, secureBaseUrl } = this.context;
        cartPreview(secureBaseUrl, cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel(this.context);
        menu();
        mobileMenuToggle();
        privacyCookieNotification();
        svgInjector();

        customGlobal(this.context);
        customSidebar();

        /* BundleB2B */
        const {
            store_hash,
        } = this.context;
        const inPages = () => {
            const urlArray = [
                '/buy-again/',
                '/address-book/',
                '/quote/',
                '/quotes-list/',
                '/dashboard/',
                '/order-detail/',
                '/quick-order-pad/',
                '/shopping-list/',
                '/shopping-lists/',
                '/user-management/',
                '/invoices/',
                '/invoice-payment/',
                '/invoice-details/',
                '/invoice-payment-receipt/',
                '/account.php',
            ];
            const current = window.location.pathname;
            return urlArray.includes(current);
        };
        if (!inPages()) {
            document.querySelector('.body').style.display = "block";
        }
        const autoLoader = async () => {
            await fetch(`https://api.bundleb2b.net/api/v2/stores/auto-loaders?storeHash=${store_hash}`).then(response => {
                return response.json();
            }).then(data => {
                const {
                    code,
                    data: {
                        storefrontUrl,
                    },
                    message,
                } = data;
                if (code === 200) {
                    $('body').append(`<script src="${storefrontUrl}"></script>`);
                } else {
                    console.error(message);
                }
            }).catch(error => {
                console.error(error);
            });
        };
        autoLoader();
        window.b3themeConfig = window.b3themeConfig || {};
        window.b3themeConfig.useContainers = {
            'tpa.button.container': '.header .themevale_header-PC .themevale_header-top .navUser',
            'quickOrderPad.button.container': '.header .themevale_header-PC .themevale_header-top .navUser',
            'myQuote.button.container': '.header .themevale_header-PC .themevale_header-top .navUser',
        };
        window.b3themeConfig.useJavaScript = {
            login: {
                callback(login) {
                    document.querySelector('.body').style.display = "block";

                    const hideWishlists = () => {
                        const hideStyle = `
                            <style>
                                /* product cards */
                                .card-button-wishlist {
                                    display: none !important;
                                }

                                /* navUser */
                                .navUser-item--wishList {
                                    display: none !important;
                                }
                            </style>
                        `;
                        $('head').append(hideStyle);
                    };

                    const renderB3Dropdown = () => {
                        // check if has b3 items already then remove
                        const $b3Items = $('#navPages-account-topbar .b3_item');
                        if ($b3Items && $b3Items.length) {
                            $b3Items.remove();
                        }

                        // render b3 dropdown items
                        login.renderB3Navs({
                            containerSelector: '#navPages-account-topbar',
                            navItemClassName: 'dropdown-menu-item b3_item',
                            navActionClassName: 'dropdown_menu_action',
                            insertType: 'beforeend',
                        });

                        // reposition log out link
                        const $itemLogOut = $('.item_log_out');
                        const $accountTopBar = $('#navPages-account-topbar');
                        if ($itemLogOut && $itemLogOut.length) {
                            $accountTopBar.append($itemLogOut);
                        }
                    };

                    login.watch = {
                        endMasqueradeCompany: () => {
                            // remove the global endMasqueradeContainer
                            const {
                                endMasqueradeContainerSelector,
                            } = login.state;
                            if (document.querySelector(endMasqueradeContainerSelector)) {
                                document.querySelector(endMasqueradeContainerSelector).remove();
                            }

                            login.removeQuickOrderPadBtn();
                            login.renderNavs();

                            // re-render b3 dropdown
                            renderB3Dropdown();
                        },
                        beginMasqueradeCompany: async () => {
                            await login.getIsShowAddressBook();
                            login.renderNavs();

                            // re-render b3 dropdown
                            renderB3Dropdown();
                        },
                    }

                    if (login.isB2BUser) {
                        hideWishlists();
                        renderB3Dropdown();
                    }
                },
            },
        };
        /* BundleB2B */
    }
}
