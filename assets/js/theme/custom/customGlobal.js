import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import { load } from 'webfontloader';
import event from '../global/jquery-migrate/event';
import { forEach } from 'lodash';

export default function(context) {
    const $context = context,
    theme_settings = context.themeSettings;
    
    var scroll_position = $(window).scrollTop();

    var checkJS_load = true;

    function loadFunction() {
        if(checkJS_load) {
            checkJS_load = false;

            /* Add Funcion Here */
            // activeMansory();
        }
    }

    function eventLoad() {
        /* Load Event */
        $(document).ready(function(){
            const wWidth = window.innerWidth,
                tScroll = $(this).scrollTop();

            var slickWrapperList = $('.section-slick');

            /* Loop All Slick Slider */
            forEach(slickWrapperList, (slickWrapperItem) => {
                slickCarousel($(slickWrapperItem));
            })

        })

        /* Scroll Event */
        $(window).on("scroll", (e) => {
            const $target = $(e.currentTarget);
            const $scrollTop = $target.scrollTop();

            loadFunction();
        })

        /* Mouse Over Touch Start */
        $(document).on('keydown mousemove touchstart', (e) => {
            loadFunction();
        });

        /* Resize */
        $(window).on('resize', (e) => {});
    }
    eventLoad();

    /* Slick Function */
    function slickCarousel(wrap) {
        const showDesktop = wrap.data('slick-show-desktop'),
            showTablet = wrap.data('slick-show-tablet'),
            showMobile = wrap.data('slick-show-mobile'),
            showDotbars = wrap.data('dots-bar');

        wrap.slick({
            dots: showDotbars,
            arrows: true,
            infinite: false,
            mobileFirst: true,
            slidesToShow: showMobile,
            slidesToScroll: 1,

            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: showDesktop
                    }
                },
                {
                    breakpoint: 767,
                    settings: {
                        slidesToShow: showTablet
                    }
                }
            ]
        });
    }

    function mansoryMenu() {
        var container = document.querySelector('.navPage-subMenu-list');
        var msnry = new Masonry( container, {
            itemSelector: '.navPage-subMenu-item',
            columnWidth: '.navPage-subMenu-item',
            gutter: 20,
        });
    }

    function activeMansory() {
        let menuList = document.querySelector('.custom-header .navPages-list'),
            menuItems = menuList.querySelectorAll('.navPages-item');

        forEach(menuItems, (item) => {
            /* Hover Event For Menu Item */
            const action = item.querySelector('.navPages-action'),
                subMenu = item.querySelector('.navPage-subMenu');

            if(!subMenu) return;
            
            /* Event Hover In */
            item.addEventListener('mouseover', (e) => {
                action.classList.add('is-open');
                subMenu.classList.add('is-open');

                /* Run Mansory */
                mansoryMenu();
            })

            /* Event Hover Out */
            item.addEventListener('mouseleave', (e) => {
                action.classList.remove('is-open');
                subMenu.classList.remove('is-open');
            })
        });
    }
}