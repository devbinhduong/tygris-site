import utils from '@bigcommerce/stencil-utils';

export default class customMegamenu{
    constructor() {}

    menuItem(num) {
        return {
            setMegaMenu(param) {
                param = $.extend({
                    imagesRight: ''
                }, param);

                var $scope = $('.navPages-list:not(.navPages-list--user) > li:nth-child('+num+')');

                if(!$scope.hasClass('navPages-item-toggle')){
                    const subMegaMenu = $scope.find('> .navPage-subMenu'),
                          subMenuList = subMegaMenu.find('> .navPage-subMenu-list:not(.navPage-subMenu-links)');
                    
                    if(!$scope.hasClass('has-megamenu')){
                        $scope.addClass('has-megamenu style-1');

                        if(!subMegaMenu.find('.imageArea').length){
                            subMegaMenu.append('<div class="imageArea"><div class="megamenu-right-item">'+param.imagesRight+'</div></div>');
                        }
                    }
                }

                return this;
            }
        }
    }
}
