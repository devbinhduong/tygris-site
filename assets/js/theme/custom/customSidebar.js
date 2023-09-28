import utils from '@bigcommerce/stencil-utils';

export default function(context) {
    var checkJS_load = true;

    function loadFunction() {
        if(checkJS_load) {
            checkJS_load = false;
            showFilterMobile();
        }
    }

    $(document).on('keydown mousemove touchstart', (e) => {
        loadFunction();
    });

    /* Resize */
    $(window).on('resize', (e) => {
        showFilterMobile();
    });

    /* Left Sidebar */
    function showLeftSidebar() {
        let body = document.body;
        body.classList.add("show-sidebar");

        function closeSidebar() {
            let closeSidebarButton = document.querySelector(".custom-close-sidebar");

            closeSidebarButton.addEventListener("click", (e) => {
                e.preventDefault();
                body.classList.remove("show-sidebar");
            });
        }

        closeSidebar();
    }

    function showFilterMobile() {
        let filterMobileButton = document.querySelector(".custom-filter-button-mobile"),
            body = document.body;

        if(!filterMobileButton) return;

        filterMobileButton.addEventListener("click", (e) => {
            e.preventDefault();
            showLeftSidebar();
        });

        if(body.classList.contains("page-type-category")|| body.classList.contains("page-type-brand") || body.classList.contains("page-type-search")) {
            let facetedSearch = document.querySelectorAll("#facetedSearch-navList"),
                sidebarContent = document.querySelector(".sidebar-content"),
                cmsBlockImage = document.querySelectorAll(".custom-category-banner"),
                desktopSidebar = document.querySelector("#faceted-search-container nav");

            if(facetedSearch) {
                if(window.innerWidth < 1024) {
                    /* Remove When Filter */
                    if(facetedSearch.length > 1) {
                        sidebarContent.removeChild(facetedSearch[1]);
                        sidebarContent.removeChild(cmsBlockImage[1]);
    
                        body.classList.remove("show-sidebar");
                    }
    
                    /* Append facetedSearch To Sidebar */
                    sidebarContent?.appendChild(facetedSearch[0]);
                    sidebarContent?.appendChild(cmsBlockImage[0]);
                } else {
                    desktopSidebar?.appendChild(facetedSearch[0]);
                    desktopSidebar?.appendChild(cmsBlockImage[0]);
                }
            }

        }
    }

}
