import customMegaMenu from './customMegamenu';
    window.customMegaMenu = customMegaMenu;

export default function(context) {
    var customMegaMenu = new window.customMegaMenu();
    const urlImgLoad = $('.custom-global-block').data("image-load"),
        urlStoreHash = $(".custom-global-block").data("store-hash-image");
    
    var megamenu_item1 = parseInt(context.themeSettings.megamenu_item1),
        megamenu_item2 = parseInt(context.themeSettings.megamenu_item2),
        megamenu_item3 = parseInt(context.themeSettings.megamenu_item3),
        megamenu_item4 = parseInt(context.themeSettings.megamenu_item4),
        megamenu_item5 = parseInt(context.themeSettings.megamenu_item5),
        megamenu_item6 = parseInt(context.themeSettings.megamenu_item6);

    function SetItemMegaMenu(){
        $('.navPages-list > li:not(.navPages-item-toggle)').mouseover(event => {
            var numberItem = $(event.currentTarget).index() + 1;

            if (!$(event.currentTarget).hasClass('has-megamenu')) {
                LoadMegaMenu(numberItem);
            }
        });

        $(document).on('click','#custom-menu-sidebar .navPages-list:not(.navPages-list--user) > li > .navPages-action' , event => {
            var numberItem = $(event.currentTarget).parent().index() + 1;

            if (!$(event.currentTarget).parent().hasClass('has-megamenu')) {
                LoadMegaMenu(numberItem);
            }
        });

        if(context.themeSettings.custom_menu_tab == true) {
            $(document).ready(function() {
                $('body').addClass('menu-is-load');
            });
        }
    }

    function LoadMegaMenu(numberItem){
        if (megamenu_item1 == numberItem) {
            customMegaMenu.menuItem(megamenu_item1).setMegaMenu({
                style: 'style 1',
                imagesRight: '<a class="image custom-image-right" href="'+context.themeSettings.megamenu_item1_link+'">\
                                    <img class="lazyload" src="'+urlImgLoad+'" data-src="'+urlStoreHash+context.themeSettings.megamenu_item1_img+'" alt="'+context.themeSettings.megamenu_item1_img+'" title="'+context.themeSettings.megamenu_item1_img+'"/>\
                                </a>',
            });
        } else if (megamenu_item2 == numberItem) {
            customMegaMenu.menuItem(megamenu_item2).setMegaMenu({
                style: 'style 1',
                imagesRight: '<a class="image custom-image-right" href="'+context.themeSettings.megamenu_item2_link+'">\
                                    <img class="lazyload" src="'+urlImgLoad+'" data-src="'+urlStoreHash+context.themeSettings.megamenu_item2_img+'" alt="'+context.themeSettings.megamenu_item2_img+'" title="'+context.themeSettings.megamenu_item2_img+'"/>\
                                </a>',
            });
        } else if (megamenu_item3 == numberItem) {
            customMegaMenu.menuItem(megamenu_item3).setMegaMenu({
                style: 'style 1',
                imagesRight: '<a class="image custom-image-right" href="'+context.themeSettings.megamenu_item3_link+'">\
                                    <img class="lazyload" src="'+urlImgLoad+'" data-src="'+urlStoreHash+context.themeSettings.megamenu_item3_img+'" alt="'+context.themeSettings.megamenu_item3_img+'" title="'+context.themeSettings.megamenu_item3_img+'"/>\
                                </a>',
            });
        }
        else if (megamenu_item4 == numberItem) {
            customMegaMenu.menuItem(megamenu_item4).setMegaMenu({
                style: 'style 1',
                imagesRight: '<a class="image custom-image-right" href="'+context.themeSettings.megamenu_item4_link+'">\
                                    <img class="lazyload" src="'+urlImgLoad+'" data-src="'+urlStoreHash+context.themeSettings.megamenu_item4_img+'" alt="'+context.themeSettings.megamenu_item4_img+'" title="'+context.themeSettings.megamenu_item4_img+'"/>\
                                </a>',
            });
        }
        else if (megamenu_item5 == numberItem) {
            customMegaMenu.menuItem(megamenu_item5).setMegaMenu({
                style: 'style 1',
                imagesRight: '<a class="image custom-image-right" href="'+context.themeSettings.megamenu_item5_link+'">\
                                    <img class="lazyload" src="'+urlImgLoad+'" data-src="'+urlStoreHash+context.themeSettings.megamenu_item5_img+'" alt="'+context.themeSettings.megamenu_item5_img+'" title="'+context.themeSettings.megamenu_item5_img+'"/>\
                                </a>',
            });
        }
        else if (megamenu_item6 == numberItem) {
            customMegaMenu.menuItem(megamenu_item6).setMegaMenu({
                style: 'style 1',
                imagesRight: '<a class="image custom-image-right" href="'+context.themeSettings.megamenu_item6_link+'">\
                                    <img class="lazyload" src="'+urlImgLoad+'" data-src="'+urlStoreHash+context.themeSettings.megamenu_item6_img+'" alt="'+context.themeSettings.megamenu_item6_img+'" title="'+context.themeSettings.megamenu_item6_img+'"/>\
                                </a>',
            });
        }
        
        else {
            return;
        }
    }

    var setItemMegaMenu = SetItemMegaMenu();
	    window.onload = setItemMegaMenu;
}