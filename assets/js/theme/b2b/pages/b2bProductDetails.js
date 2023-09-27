import b2bAjax from '../common/ajax';
import advQuantityUtil from '../common/advQuantity';
import _ from 'lodash';
import swal from 'sweetalert2';
import filterEmptyFilesFromForm from '../common/filterEmptyFilesFromForm';
import isB2bUser from '../common/checkB2bUser';

export default {
    get shopPingListBtn() {
        return `<form action="" class="form form-wishlist form-action" data-shoppinglist-add method="post">
        <a aria-controls="shoppinglist-dropdown" aria-expanded="false" class="button dropdown-menu-button" data-dropdown="shoppinglist-dropdown">
            <span>Add to Shopping List</span>
            <i aria-hidden="true" class="icon">
                <svg>
                    <use xlink:href="#icon-chevron-down" />
                </svg>
            </i>
        </a>
        <ul aria-hidden="true" class="dropdown-menu" data-dropdown-content id="shoppinglist-dropdown" tabindex="-1">   
        </ul>
        </form>`;
    },
    init(context, $scope) {
        console.log(123)
        const B2bUser = isB2bUser();
        if (!B2bUser) {
            return;
        }

        const roleId = sessionStorage.getItem('roleId');
        if (!roleId) {
            return false;
        }
        this.context = context;
        // this.listenQuantityChange($scope);
        this.hideWishlist();
        this.addShoppingListBtn($scope);
        this.showShoppingList($scope);
    },
    hideWishlist() {
        $("[action^='/wishlist.php']").hide();
    },
    displayWishlist() {
        $("[action^='/wishlist.php']").show();
    },
    addShoppingListBtn($scope) {
        $('.productView-details .productView-options', $scope).append(this.shopPingListBtn);
    },
    /**
     * to render pdp shoping list list
     * @param {string} customerId
     * @param {string} companyId
     */
    showShoppingList($scope) {
        b2bAjax.getShoppingLists().then((res) => {
            // I think this place don't need swal
            if (res.code === 200) {
                const data = res.data.list;
                let frag = '';
                $.each(data, (index, item) => {
                    frag += `<li><button type="button" class="button" add-to-list data-list-id="${item.id}" data-list-status="${item.status}" >Add to ${item.name}</button></li>`;
                });
                frag += `<li data-list-id><a href="/shopping-lists/" class="button">
                        Create a new list</a></li>`;
                $('#shoppinglist-dropdown', $scope).append(frag);
            }
            this.addToShopingList($scope);
        });
    },
    initAdvQty(sku, resetQty, $scope) {
        const baseSku = $('[data-product-sku]', $scope).text().trim();
        const variantSku = sku || baseSku;
        const $input = $('.form-input--incrementTotal', $scope);

        const B2bUser = isB2bUser();
        if (!B2bUser) {
            return;
        }
        $input.attr('data-advqty-sku', variantSku);
        advQuantityUtil.setUpAdvQtyMulti($input, {
            bindInputEvents: false,
            bindButtonEvents: false,
            resetQty: resetQty || false,
        }, () => {
            $input.change();
        });
    },
    /**
     * to bind input qty change events
     */
    listenQuantityChange($scope) {
        this.$scope = $scope;
        const onQuantityChange = _.debounce((event) => {
            advQuantityUtil.handlePDPQuantityChange(event, this.$scope);
        }, 100);

        $('input[name="qty[]"]', this.$scope).on('change', event => {
            onQuantityChange(event);
        });

        $('input[name="qty[]"]', this.$scope).on('keyup', event => {
            const $input = $(event.currentTarget);
            const $submitBtn = $('#form-action-addToCart', this.$scope);
            advQuantityUtil.validateAdvQty($input, $submitBtn);
        });

        $('[data-quantity-change] button', this.$scope).on('click', (event) => {
            event.preventDefault();
            onQuantityChange(event);
        });
    },
    addToShopingList($scope) {
        this.$scope = $scope;

        const productId = $('input[name=product_id]', this.$scope)[0].value;
        // add item to shopping list
        this.$scope.on('click', '[add-to-list]', async (event) => {
            event.preventDefault();
            const shoppingListId = $(event.target).attr('data-list-id');
            const datas = await b2bAjax.getVariantsByProductId({ productId });
            const data = datas.data;
            const hasVariants = (data.length > 0);
            const sku = $('[data-product-sku]', this.$scope).text().trim();
            let status = false;
            let variantId = productId;
            const qty = $("[name='qty[]']", this.$scope).val();
            if (datas.code !== 200) {
                return swal({
                    text: 'There is an unknown error. Please try again later.',
                    type: 'error',
                });
            }
            // filter current product if has varint id
            if (hasVariants) {
                $.each(data, (index, item) => {
                    if (item.sku === sku) {
                        variantId = item.variantId;
                        status = true;
                    }
                });
            }
            if (!hasVariants || status) {
                const form = $('form[data-cart-item-add]', this.$scope)[0];
                const formData = filterEmptyFilesFromForm(new FormData(form));
                const optionList = [];
                for (const item of formData) {
                    if (item[0].indexOf('attribute') !== -1 && item[1] !== '') {
                        const optionObj = {
                            option_id: item[0],
                            option_value: item[1],
                        };
                        optionList.push(optionObj);
                    }
                }
                const Data = {
                    id: shoppingListId,
                    items: [
                        {
                            productId,
                            variantId,
                            qty,
                            optionList,
                        },
                    ],

                };
                b2bAjax.addProductToShoppingList(Data).then((res) => {
                    if (res.code === 200) {
                        swal({
                            text: 'Product(s) added to shopping list successfully',
                            type: 'success',
                        });
                    }
                });
            } else {
                swal({
                    text: 'Please select all the required product options to add to shopping list',
                    type: 'error',
                });
            }
        });
    },
    hideAddToCartBtn() {
        $('#form-action-addToCart').hide();
    },
};
