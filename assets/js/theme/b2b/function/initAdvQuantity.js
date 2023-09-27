import AdvQuantityUtil from '../common/advQuantity';

/**
 * initialize quantity
 */
export default function () {
    AdvQuantityUtil.globalInit();
    const $advQtyInputs = $('[advqty-card-actions] [advqty-card-input]');
    AdvQuantityUtil.setUpAdvQtyMulti($advQtyInputs, {
        bindInputEvents: true,
        bindButtonEvents: true,
        tips: true,
    }, () => {
        $advQtyInputs.each((lIdx, lItem) => {
            const $input = $(lItem);
            AdvQuantityUtil.handleQuantityChange(null, $input, true);
        });
    });
    /* bind checkout button click start */
    $('body').on('click', '[advqty-checkout-button]', (event) => AdvQuantityUtil.checkCartAdvQty(event));
}
