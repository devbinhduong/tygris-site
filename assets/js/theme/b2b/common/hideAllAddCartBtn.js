export default function () {
    const hideBtnStyle = `<style>
        #form-action-addToCart,#add_to_cart,#add_to_cart_csv,[advqty-card-addtocart],[href*='/cart.php?action=add'],[href='/user-management/'],[href='/cart.php']
        {display:none!important};
        </style>`;
    $('head').append(hideBtnStyle);
}
