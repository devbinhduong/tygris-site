import utils from '@bigcommerce/stencil-utils';
import shoppingList from '../pages/shoppingList';
import { currencyFormat } from '../common';

export default function (context) {
    const money = context.b2bSettings.money;
    utils.hooks.on('product-option-change', (event, option) => {
        const $changedOption = $(option);
        const $form = $changedOption.parents('form');
        const productId = $('[name="product_id"]', $form).attr('value');
        const priceContainer = $(event.target).parents('.product-options').find('.product-price');

        // for search results
        const $tr = $changedOption.parents('tr');
        const $sku = $('[data-product-sku]', $tr);
        const $checkbox = $('input[type=checkbox]', $tr);

        utils.api.productAttributes.optionChange(productId, $form.serialize(), (err, result) => {
            if (err) {
                return window.b2b.Alert.error(err);
            }
            const { data = {} } = result;
            const variantId = data.v3_variant_id;
            const { value: priceB2b } = data.price.with_tax || data.price.without_tax;
            const isFormValid = shoppingList.checkRequireInputs($form);

            priceContainer.text(currencyFormat(priceB2b, money));
            $('[data-product-price-value]').attr('data-product-price-value', priceB2b);
            if (data.sku) {
                $sku.html(`<b>SKU: </b>${data.sku}`);
                $('[data-product-base-sku]').attr('data-product-base-sku', data.sku);
            }
            // page right option change

            if (variantId) {
                $tr.attr('data-variant-id', variantId);
            }

            const isAllValid = Boolean(variantId);

            const isDisabledCheckbox = isAllValid && isFormValid;
            $checkbox.prop('disabled', !isDisabledCheckbox)
                .prop('checked', isDisabledCheckbox);
        });
    });
}
