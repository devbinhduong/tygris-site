export default function (cartId) {
    $.ajax({
        type: 'DELETE',
        url: `/api/storefront/carts/${cartId}`,
        contentType: 'application/json',
        accept: 'application/json',
        success: () => {
        },
        error: () => {
        },
    });
}
