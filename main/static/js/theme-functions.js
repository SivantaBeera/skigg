jQuery.noConflict();

jQuery(".form-trigger-btn, .form-trigger").on("click", function (e) {
    var href = jQuery(this).attr("href");
    if (href.indexOf("http") > -1 || href.indexOf("//") > -1) {
        return;
    }
    e.preventDefault();
    var $container = jQuery("#popup-form-container");
    $container.fadeIn("fast", function () {
        $container.find("#custom-from-container").data("gform").updateTopProgress();
        $container.find('input.skigg-from-step-control').focus();
    });
});

jQuery(".skigg-header-menu-trigger").on("click", function (e) {
    e.preventDefault();
    jQuery("#popup-menu-container").fadeIn("fast");
});

jQuery(".close-theme-modal").on("click", function (e) {
    var href = jQuery(this).attr("href");
    if (href.indexOf("http") > -1 || href.indexOf("//") > -1) {
        return;
    }
    e.preventDefault();
    jQuery(this).closest('.theme-modal').fadeOut("fast");
});

jQuery("a.leadership-view-bio").on("click", function (e) {
    e.preventDefault();
    var modal_uid = jQuery(this).attr("href");
    jQuery(modal_uid).fadeIn("fast");
});


/* HOME */

function inView($el, tolerance) {
    tolerance = (typeof tolerance !== "undefined") ? tolerance : 0;
    var $win = jQuery(window), wST = $win.scrollTop(), wH = $win.height(), elTop = $el.offset().top;
    return ((wST + wH) - tolerance) >= elTop;
}

var is_colliding = function ($el1, $el2) {
    var d1_offset = $el1.offset();
    var d1_height = $el1.outerHeight(true);
    var d1_width = $el1.outerWidth(true);
    var d1_distance_from_top = d1_offset.top + d1_height;
    var d1_distance_from_left = d1_offset.left + d1_width;

    var d2_offset = $el2.offset();
    var d2_height = $el2.outerHeight(true);
    var d2_width = $el2.outerWidth(true);
    var d2_distance_from_top = d2_offset.top + d2_height;
    var d2_distance_from_left = d2_offset.left + d2_width;

    // Return whether it IS colliding
    return !(d1_distance_from_top < d2_offset.top || d1_offset.top > d2_distance_from_top || d1_distance_from_left < d2_offset.left || d1_offset.left > d2_distance_from_left);
};

var DYNAMIC_WORDS = js.words_animation;

var HOMEPAGE = {
    ui: {},
    init: function () {
        var self = this;
        for (var i = 1; i <= 11; i++) {
            this.ui['$section' + i] = jQuery(".skigg-section" + i);
            // this.ui['$section' + i + 'InView'] = false;
        }
        this.ui.$section2_wrapper = jQuery(".skigg-section2-wrapper");
        jQuery('.navi-section-list').stickynav({sectionSelector: 'div.trackable'});

        this.binds();
        this.onWinScroll();
    },
    onWinScroll: function () {
        var self = this;
        var $win = jQuery(window), wST = $win.scrollTop();

        if (inView(this.ui.$section1) && !this.ui.$section1.hasClass('visisted')) {
            this.ui.$section1.addClass('visisted');
            this.ui.$section1.find('h1').empty();
            new Typed(this.ui.$section1.find('h1')[0], {
                stringsElement: '#skigg-section1-text-animation',
                showCursor: false,
                typeSpeed: 30,
                onComplete: function () {
                    new Typed(self.ui.$section1.find('h1 .typed-word-animation')[0], {
                        strings: DYNAMIC_WORDS,
                        showCursor: false,
                        startDelay: 1000,
                        backDelay: 1000,
                        typeSpeed: 75
                    });
                }
            });
        }
        this.throttle(this.navCheck, 10);
    },
    navCheck: function () {
        var self = this, $navs = jQuery('.navi-section-list a'), hScrollMiddle = jQuery(window).scrollTop() + (jQuery(window).height() / 2);
        $navs.removeClass('blue');
        $navs.each(function () {
            var $anchor = jQuery(this);
            if (is_colliding($anchor, self.ui.$section3) || is_colliding($anchor, self.ui.$section4)) {
                $anchor.addClass('blue');
            } else {
                $anchor.removeClass('blue');
            }
        });
    },
    binds: function () {
        var self = this;
        jQuery(window).on("scroll.homepage", function () {
            self.onWinScroll();
        });
    },
    throttle: function (func, delay) {
        var self = this;

        clearTimeout(this.timer);
        this.timer = setTimeout(function () {
            func.apply(self, []);
        }, delay);
    }
}

var PAGE_COMMON = {
    init: function () {
        var self = this;
        self.$header = jQuery('.skigg-header');
        if (!self.$header.length) {
            return;
        }
        self.$footer_btn = jQuery('.skigg-footer .form-trigger-btn:visible');
        self.$header = jQuery('.skigg-header');

        var $win = jQuery(window);
        jQuery(window).on("scroll.common", function () {
            var wST = $win.scrollTop();
            self.$header[wST > 0 ? 'addClass' : 'removeClass']('fixed');

            if (inView(self.$footer_btn)) {
                self.$header.hide();
            } else {
                self.$header.show();
            }

        });
        $win.trigger("scroll");
    }
}

jQuery(function () {
    PAGE_COMMON.init();
    if (jQuery('.home-page-body').length) {
        HOMEPAGE.init();
    }
});