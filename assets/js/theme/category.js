import { hooks, api } from '@bigcommerce/stencil-utils';
import CatalogPage from './catalog';
import compareProducts from './global/compare-products';
import FacetedSearch from './common/faceted-search';
import { createTranslationDictionary } from '../theme/common/utils/translations-utils';

import customSidebar from './custom/customSidebar';
import customDisplayMode from './custom/customDisplayMode';


export default class Category extends CatalogPage {
    constructor(context) {
        super(context);
        this.validationDictionary = createTranslationDictionary(context);
    }

    setLiveRegionAttributes($element, roleType, ariaLiveStatus) {
        $element.attr({
            role: roleType,
            'aria-live': ariaLiveStatus,
        });
    }

    makeShopByPriceFilterAccessible() {
        if (!$('[data-shop-by-price]').length) return;

        if ($('.navList-action').hasClass('is-active')) {
            $('a.navList-action.is-active').focus();
        }

        $('a.navList-action').on('click', () => this.setLiveRegionAttributes($('span.price-filter-message'), 'status', 'assertive'));
    }

    onReady() {
        this.arrangeFocusOnSortBy();

        $('[data-button-type="add-cart"]').on('click', (e) => this.setLiveRegionAttributes($(e.currentTarget).next(), 'status', 'polite'));

        this.makeShopByPriceFilterAccessible();

        compareProducts(this.context);

        if ($('#facetedSearch').length > 0) {
            this.initFacetedSearch();
        } else {
            this.onSortBySubmit = this.onSortBySubmit.bind(this);
            hooks.on('sortBy-submitted', this.onSortBySubmit);
        }

        $('a.reset-btn').on('click', () => this.setLiveRegionsAttributes($('span.reset-message'), 'status', 'polite'));

        this.ariaNotifyNoProducts();

        /* Custom Start */
        this.viewMoreCategoryDesc();
        customDisplayMode();
        this.showMoreProduct();
    }

    ariaNotifyNoProducts() {
        const $noProductsMessage = $('[data-no-products-notification]');
        if ($noProductsMessage.length) {
            $noProductsMessage.focus();
        }
    }

    initFacetedSearch() {
        const {
            price_min_evaluation: onMinPriceError,
            price_max_evaluation: onMaxPriceError,
            price_min_not_entered: minPriceNotEntered,
            price_max_not_entered: maxPriceNotEntered,
            price_invalid_value: onInvalidPrice,
        } = this.validationDictionary;
        const $productListingContainer = $('#product-listing-container');
        const $facetedSearchContainer = $('#faceted-search-container');
        const productsPerPage = this.context.categoryProductsPerPage;
        const requestOptions = {
            config: {
                category: {
                    shop_by_price: true,
                    products: {
                        limit: productsPerPage,
                    },
                },
            },
            template: {
                productListing: 'category/product-listing',
                sidebar: 'category/sidebar',
            },
            showMore: 'category/show-more',
        };

        this.facetedSearch = new FacetedSearch(requestOptions, (content) => {
            $productListingContainer.html(content.productListing);
            $facetedSearchContainer.html(content.sidebar);

            customSidebar();
            this.showMoreProduct();


            $('body').triggerHandler('compareReset');

            $('html, body').animate({
                scrollTop: 0,
            }, 100);
        }, {
            validationErrorMessages: {
                onMinPriceError,
                onMaxPriceError,
                minPriceNotEntered,
                maxPriceNotEntered,
                onInvalidPrice,
            },
        });
    }

    /* Custom Start */
    viewMoreCategoryDesc() {
        let categoryDesc = document.querySelector(".content__description"),
            viewMoreButton = document.querySelector(".view-more-category-button");
        
        if (!categoryDesc || !viewMoreButton) return;

        viewMoreButton.addEventListener("click", (e) => {
            e.preventDefault();
            categoryDesc.classList.toggle("show");
            viewMoreButton.classList.toggle("show");

            if(categoryDesc.classList.contains("show")) {
                viewMoreButton.innerHTML = "Read Less";
            }
        });
    }

    /* View More Button */
    showMoreProduct() {
        const $productListingContainer = $('#product-listing-container .productListing');
        const nextPage = $('.pagination-item--current').next();
        var clickCount =  1;

        if(nextPage.length == 0) {
            $('#listing-showmoreBtn > a').addClass('btn-disable');
            $('#listing-showmoreBtn > a').text('No More Products');
        }

        $('#listing-showmoreBtn > a').on('click', (event) => {
            event.preventDefault();
            clickCount++;

            var nextPage = $('.pagination-item--current').next(),
                link = nextPage.find("a").attr("href"),
                paginationLength = $('.pagination-item').length - 1;

            if (link == undefined) {
                if (!$('#listing-showmoreBtn > a').hasClass('disable')) {
                    $('#listing-showmoreBtn > a').addClass('disable');
                }
            } else {
                $('#listing-showmoreBtn > a').addClass('loading');

                
                fetch(link)
                    .then((response) => response.text())
                    .then((content) => {
                        var template = document.createElement("div");
                        template.innerHTML = content;

                        let newContent = template.querySelector("#product-listing-container .productListing")
                        $productListingContainer.append(newContent.innerHTML);
                        
                    })
            }

            if (clickCount == paginationLength) {
                $('#listing-showmoreBtn > a').addClass('btn-disable');
                $('#listing-showmoreBtn > a').text('No More Products');
            }
        });

    }
}
