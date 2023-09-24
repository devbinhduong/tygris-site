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
            homeProductsListID();
            contactUsForm();
            sectionScroll();

            if(window.innerWidth > 1024) {
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

            scrollAnimation(tScroll);
        })

        /* Scroll Event */
        $(window).on("scroll", (e) => {
            const $target = $(e.currentTarget);
            const tScroll = $target.scrollTop();

            loadFunction();
            scrollAnimation(tScroll);
        })

        /* Mouse Over Touch Start */
        $(document).on('keydown mousemove touchstart', (e) => {
            loadFunction();
        });

        /* Resize */
        $(window).on('resize', (e) => {
            if(window.innerWidth > 1024) {
                activeMansory();
            }
            if(window.innerWidth < 1024) {
                searchMobile();
                closeMenuMobileSidebar();
                footerMobileTab();
            }
            
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

    function searchMobile() {
        let searchButton = document.querySelector(".mobileSearch-toggle"),
            searchForm = document.querySelector(".custom-search-mobile"),
            searchInput = searchForm.querySelector("#nav-menu-quick-search");

        searchButton.addEventListener("click", (e) => {
            e.preventDefault();
            searchForm.classList.toggle("is-open");
        })

        searchInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
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
                }, 200);
            });


            /* Add row below Menu Item */
            item.addEventListener('mouseover', (e) => {
                let menuListSub = item.querySelector('.navPage-subMenu'),
                links = item.querySelector('.navPages-action.has-subcategories');

                if(menuListSub && links) {
                    menuListSub.addEventListener('mouseover', function() {
                        links.classList.add('hovered');
                    });

                    menuListSub.addEventListener('mouseout', function() {
                        links.classList.remove('hovered');
                    });
                }
            });
            
        });

    }

    /* Scroll Animation */
    function scrollAnimation(tScroll) {
        const $element = $('.custom-animation');

        if ($element.length) {
            $element.each(function(i) {
                const $elementTop = $element.eq(i).offset().top - screen.height + 50;
                const $elementBottom = $element.eq(i).offset().top + screen.height - 50;
                var img = $element.eq(i).find('img');

                if (tScroll < $elementBottom && tScroll > $elementTop) {
                    $element.eq(i).addClass('animated');
                }
            });
        }
    }

    function contactUsForm () {
        $(document).on('click', '#contact-ask-an-expert-button', event => {
            var ask_proceed = true,
                mailTo = context.themeSettings.contact_us_receive_mail,
                contactFirstName = $('#contact-ask-an-expert-form input[name="contact_first_name"]').val(),
                contactSurName = $('#contact-ask-an-expert-form input[name="contact_surname"]').val(),
                contactEmail = $('#contact-ask-an-expert-form input[name="contact_email"]').val(),
                contactPhone = $('#contact-ask-an-expert-form input[name="contact_phone"]').val(),
                contactAddress = $('#contact-ask-an-expert-form input[name="contact_address"]').val(),
                contactCity = $('#contact-ask-an-expert-form input[name="contact_city"]').val(),
                contactCountry = $('#contact-ask-an-expert-form input[name="contact_country"]').val(),
                contactPostCode = $('#contact-ask-an-expert-form input[name="contact_post-code"]').val(),
                contactIndustry = $('#contact-ask-an-expert-form select[name="contact_industrial"]').val(),
                contactMessage = $('#contact-ask-an-expert-form textarea[name=comment_area]').val(),


                message = "<div style='border: 1px solid #e6e6e6;padding: 30px;max-width: 500px;margin: 0 auto;'>\
                            <h2 style='margin-top:0;margin-bottom:30px;color: #000000;'>Contact Us</h2>\
                            <p style='border-bottom: 1px solid #e6e6e6;padding-bottom: 23px;margin-bottom:25px;color: #000000;'>You received a new message from Contact Us form.</p>\
                            <table style='width:100%;'>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>First Name: </strong></td><td>" + contactFirstName + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>SurName: </strong></td><td>" + contactSurName + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Email Address: </strong></td><td>" + contactEmail + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Phone Number: </strong></td><td>" + contactPhone + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Address: </strong></td><td>" + contactAddress + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>City: </strong></td><td>" + contactCity + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Country: </strong></td><td>" + contactCountry + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Post Code: </strong></td><td>" + contactPostCode + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Industry: </strong></td><td>" + contactIndustry + "</td></tr>\
                        <tr><td style='padding-right: 10px;vertical-align: top;width:50%;'><strong>Question: </strong></td><td>" + contactMessage + "</td></tr>\
                    </table></div>";

            $("#contact-ask-an-expert-form input[required], #contact-ask-an-expert-form textarea[required], #contact-ask-an-expert-form select[required]").each((index, el) => {
                if (!$.trim($(el).val())) {
                    $(el).parent('.form-field').removeClass('form-field--success').addClass('form-field--error');
                    ask_proceed = false;
                } else {
                    $(el).parent('.form-field').removeClass('form-field--error').addClass('form-field--success');
                }

                var email_reg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

                if ($(el).attr("name") == "contact_email" && !email_reg.test($.trim($(el).val()))) {
                    $(el).parent('.form-field').removeClass('form-field--success').addClass('form-field--error');
                    ask_proceed = false;
                }
            });

            if (ask_proceed) {
                var ask_post_data = {
                    "api": "i_send_mail",
                    "from_name": contactFirstName,
                    "email": mailTo,
                    "email_from": contactEmail,
                    "message": message
                };

                $.post('https://themevale.net/tools/sendmail/quotecart/sendmail.php', ask_post_data, (response) => {
                    if (response.type == 'error') {
                        var output = '<div class="alertBox alertBox--error"><p class="alertBox-message">' + response.text + '</p></div>';
                    } else {
                        var output = '<div class="alertBox alertBox--success"><p class="alertBox-message">Thank you. We\'ve received your feedback and will respond shortly.</p></div>';
                        $("#contact-ask-an-expert-form  input[required], #contact-ask-an-expert-form textarea[required]").val('');
                        $("#contact-ask-an-expert-form").hide();
                    }
                    $("#contact-ask-an-expert-results").hide().html(output).show();
                }, 'json');
            }
        });
    }

    function sectionScroll() {
        let scrollList = document.querySelectorAll(".scroll-title");

        for (let scrollItem of scrollList) {
            scrollItem.addEventListener("click", (e) => {
                e.preventDefault();
                
                let itemHref = scrollItem.getAttribute("href");

                for (let item of scrollList) {
                    item.classList.remove("is-active");
                }

                scrollItem.classList.add("is-active");

              $('html, body').animate({
                scrollTop: $(itemHref).offset().top
              }, 1000);
            })
        }
    }
}