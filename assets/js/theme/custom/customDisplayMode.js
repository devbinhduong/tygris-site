export default function() {
    const $productListing = $('#product-listing-container .productListing'),
        $grid = $('#grid-view'),
        $list = $('#list-view'),
        $gridMobile = $('#grid-view-mobile'),
        $listMobile = $('#list-view-mobile');

    $list.on('click', event => {
        if (!$list.hasClass('current-view')) {
            setTimeout(function(){ 
                $list.addClass('current-view');
                $listMobile.addClass('current-view');
                $grid.removeClass('current-view');
                $gridMobile.removeClass('current-view');
                $productListing.removeClass('productGrid').addClass('productList');
            }, 300);
        }
   });

    $grid.on('click', event => {
        if (!$grid.hasClass('current-view')) {
            setTimeout(function(){ 
                $grid.addClass('current-view');
                $gridMobile.addClass('current-view');
                $list.removeClass('current-view');
                $listMobile.removeClass('current-view');
                $productListing.removeClass('productList').addClass('productGrid');
            }, 300);
        }
    });

    $listMobile.on('click', event => {
        if (!$listMobile.hasClass('current-view')) {
            setTimeout(function(){ 
                $list.addClass('current-view');
                $listMobile.addClass('current-view');
                $grid.removeClass('current-view');
                $gridMobile.removeClass('current-view');
                $productListing.removeClass('productGrid').addClass('productList');
            }, 300);
        }
    });

    $gridMobile.on('click', event => {
        if (!$gridMobile.hasClass('current-view')) {
            setTimeout(function(){ 
                $grid.addClass('current-view');
                $gridMobile.addClass('current-view');
                $list.removeClass('current-view');
                $listMobile.removeClass('current-view');
                $productListing.removeClass('productList').addClass('productGrid');
            }, 100);
        }
    });
}
