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
            homeProductsListID();

            if(window.innerWidth > 1024) {
                menuDesktopAnimate();
                activeMansory();
            }

            if(window.innerWidth < 1024) {
                searchMobile();
                closeMenuMobileSidebar();
            }

            if(window.innerWidth < 550) {
                footerMobileTab();
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
            footerMobileTab();
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

    function closeMenuMobileSidebar () {
        let closeSidebarButton = document.querySelector(".custom-close-menuSidebar");

        closeSidebarButton.addEventListener("click", (e) => {
            e.preventDefault();
            document.querySelector(".mobileMenu-toggle").click();
        });
    }

    function footerMobileTab () {
        let footerTabTitle = document.querySelectorAll(".footer-info-col");

        for (let item of footerTabTitle) {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                item.classList.toggle("is-open");
            })
        }
    }
    function homeProductsListID() {
        var $options;

        $(document).ready(function () {
            const tScroll = $(this).scrollTop();

            homeListId(tScroll);
        });

        $(window).on('scroll', (e) => {
            const $target = $(e.currentTarget);
            const tScroll = $target.scrollTop();

            homeListId(tScroll);
        });

        function homeListId(tScroll) {
            if ($('.productsByListId[data-list-id]').length > 0) {
                $('.productsByListId[data-list-id]').each((index, element) => {
                    let thisOffetTop = $(element).offset().top - (screen.height) * 1.5;
                    
                    if (tScroll > thisOffetTop && !$(element).hasClass('is-loaded')) {
                        $(element).addClass('is-loaded');

                        var $prodWrapId = $(element).attr('id'),
                            $wrap,
                            $listId = $(element).data('list-id');
                        var homeProColumn = $(element).parents('.product-block').data('columns');
                        var dots = $(element).parents('.product-block').data('dots');
                        var limit = $(element).parents('.product-block').data('limit');

                        if ($(element).find('.productCarousel1').length > 0) {
                            $wrap = $(element).find('.productCarousel1');
                            $options = {
                                template: 'custom/homepage/ajax-products-by-list-id-temp-carousel'
                            };
                        }

                        if (!$('#product-by-list-' + $prodWrapId + ' .productCarousel1 .productCarousel-slide').length) {
                            if ($listId.length > 1) {
                                loadListID($listId, $options, $wrap, homeProColumn, dots, limit);
                            } else {
                                loadListID($($listId), $options, $wrap, homeProColumn, dots, limit);
                            }

                        }
                    }
                });
            }
        }

        function loadListID(id, options, wrap, homeProColumn, dots, limit) {

            if (id.length <= 1) {
                var arr = id;
            } else {
                var arr = id.split(',');
            }

            if (id.length > homeProColumn) {
                var list = arr.slice(0, parseInt(limit));
            } else {
                var list = arr;
            }

            var num = 0;

            for (var i = 0; i <= list.length; i++) {
                var $prodId = list[i];

                if ($prodId != undefined) {
                    utils.api.product.getById($prodId, options, (err, response) => {
                        let hasProd = $(response).find('.card').data('product-id');
                        if (hasProd != undefined && hasProd != '' && hasProd != null && !$(response).find('.page-content--err').length) {
                            if (wrap.hasClass('slick-slider')) {
                                wrap.slick('unslick');
                                wrap.append(response);
                            } else {
                                wrap.append(response);
                            }
                        }

                        num++;

                        if (num == list.length) {
                            wrap.parents('.productsByListId[data-list-id]').find('.custom_productLoading').remove();
                            wrap.parents('.productsByListId[data-list-id]').addClass('show');
                            if (wrap.hasClass('productCarousel1')) {
                                slickCarouselListId(wrap, homeProColumn, dots);
                            }
                            return;
                        }
                    });
                }
            }
        }

        function slickCarouselListId($wrap, homeProColumn, dots) {
            $wrap.slick({
                infinite: false,
                slidesToShow: 2,
                slidesToScroll: 2,
                dots: false,
                arrows: false,
                mobileFirst: true,
                nextArrow: "<svg class='slick-next slick-arrow'><use xlink:href='#slick-arrow-next'></use></svg>",
                prevArrow: "<svg class='slick-prev slick-arrow'><use xlink:href='#slick-arrow-prev'></use></svg>",
                responsive: [
                    {
                        breakpoint: 1280,
                        settings: {
                            slidesToShow: homeProColumn,
                            slidesToScroll: homeProColumn,
                            arrows: true,
                            dots: dots
                        }
                    },
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: homeProColumn - 2,
                            slidesToScroll: homeProColumn - 2,
                            arrows: true,
                            dots: dots
                        }
                    },
                    {
                        breakpoint: 767,
                        settings: {
                            slidesToShow: homeProColumn - 2,
                            slidesToScroll: homeProColumn - 2,
                            arrows: false,
                            dots: false
                        }
                    }
                ]
            });
        }
    }

    function mansoryMenu() {
        var navPageList = document.querySelectorAll('.navPage-subMenu-list');
        for(let item of navPageList) {
            var msnry = new Masonry( item, {
                itemSelector: '.navPage-subMenu-item',
                columnWidth: '.navPage-subMenu-item',
            });
        }
    }

    function activeMansory() {
        let menuList = document.querySelector('.custom-header .navPages-list'),
            menuItems = menuList.querySelectorAll('.navPages-item');

        forEach(menuItems, (item) => {
            
            /* Event Hover In */
            item.addEventListener('mouseover', (e) => {
                setTimeout(() => {
                    mansoryMenu();
                }, 500);
            })
        });
    }


}