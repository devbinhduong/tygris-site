import utils from '@bigcommerce/stencil-utils';
import { defaultModal } from '../global/modal';
import { load } from 'webfontloader';
import event from '../global/jquery-migrate/event';
import { forEach } from 'lodash';

import megamenuEditor from './megamenuEditor';

export default function(context) {
    const $context = context,
    theme_settings = context.themeSettings;
    
    var scroll_position = $(window).scrollTop();

    var checkJS_load = true;

    function loadFunction() {
        if(checkJS_load) {
            checkJS_load = false;

            /* Add Funcion Here */
            megamenuEditor($context);
            scrollAnimation();

            if(window.innerWidth > 1024) {
                menuDesktopAnimate();
            }

            if(window.innerWidth < 1024) {
                searchMobile();
            }
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
        $(window).on('resize', (e) => {
        });
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

    /* Scroll Animate */
    function scrollAnimation() {
        const sr = ScrollReveal({
            origin: 'top',
            distance: '60px',
            duration: 2500,
        });

        let srElement = document.querySelectorAll('.sr-animate');

        forEach(srElement, (item) => {
            let delay = item.getAttribute('data-sr-delay'),
                origin = item.getAttribute('data-sr-origin');

            if(!delay) delay = 0;
            if(!origin) origin = 'top';

            sr.reveal(item, { delay: delay, origin: origin });
        });
    }

    function menuDesktopAnimate() {
        const sr = ScrollReveal({
            origin: 'left',
            distance: '0',
            duration: 2500,
        });

        let srElement = document.querySelectorAll('.sr-animate-header');

        forEach(srElement, (item) => {
            let delay = item.getAttribute('data-sr-delay'),
                origin = item.getAttribute('data-sr-origin');

            sr.reveal(item, { delay: delay, origin: origin });
        });
    }

    function searchMobile() {
        let searchButton = document.querySelector(".mobileSearch-toggle"),
            searchForm = document.querySelector(".custom-search-mobile");

        searchButton.addEventListener("click", (e) => {
            e.preventDefault();
            searchForm.classList.toggle("is-open");
        })
    }
}