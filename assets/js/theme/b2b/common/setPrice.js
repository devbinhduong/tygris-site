import currencyFormat from './currencyFormat';

export default function (data, $scope, productQuantity) {
    const $products = $(`[data-variant-id=${data.v3_variant_id}]`, $scope);
    const price = data.price.without_tax.formatted;
    const value = data.price.without_tax.value;

    $products.find('[data-product-price-value]')
        .attr('data-product-price-value', value)
        .html(`<span class="product-price">${price}</span>`);
    if (productQuantity) {
        const productSubTotalValue = value * productQuantity;
        const productSubTotal = `${currencyFormat(productSubTotalValue, window.money)}`;
        $products.find('.product-subtotal').html(productSubTotal);
        $products.find('.qty').removeAttr('disabled');
    }
}
