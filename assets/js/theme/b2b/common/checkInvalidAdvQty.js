export default function (item) {
    const $listUpdate = $('#update_list_items');
    const $listAddToCart = $('#add_to_cart');

    if ($(item).find('input.qty').hasClass('not-valid-inc') || $('#shopping_list_table').find('input.qty').hasClass('not-valid-min') || $('#shopping_list_table').find('input.qty').hasClass('invalidAdvQty')) {
        $listUpdate.attr('disabled', true);
        $listAddToCart.attr('disabled', true);
    } else {
        $listUpdate.removeAttr('disabled');
        $listAddToCart.removeAttr('disabled');
    }
}
