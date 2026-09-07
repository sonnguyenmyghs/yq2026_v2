/* ==========================================================================
   GH eStore — Core app (helpers, cart, layout, UI behaviours)
   Requires: jQuery 3, Bootstrap 5, data.js
   ========================================================================== */
(function ($) {
  'use strict';

  var C = GH.config;

  /* ======================================================================
     1. Helpers
     ====================================================================== */
  GH.money = function (n) {
    return C.currencySymbol + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  GH.money0 = function (n) {
    return C.currencySymbol + Math.round(Number(n || 0)).toLocaleString('en-US');
  };
  GH.param = function (key) {
    var m = new RegExp('[?&]' + key + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  };
  GH.escape = function (s) {
    return $('<div/>').text(s == null ? '' : s).html();
  };
  GH.product = function (id) {
    return GH.products.filter(function (p) { return p.id === id; })[0] || null;
  };
  GH.experience = function (id) {
    return GH.experiences.filter(function (e) { return e.id === id; })[0] || null;
  };

  /** Ruột của khối media: ảnh thật nếu có `img`, không thì placeholder gradient. */
  GH.mediaInner = function (item, opts) {
    opts = opts || {};
    if (item && item.img) {
      return '<img src="' + item.img + '" alt="' + GH.escape(item.name || '') + '"' +
             (opts.eager ? '' : ' loading="lazy"') + ' decoding="async">';
    }
    return '<span class="gh-media__ph ph-' + ((item && item.tone) || 3) + '"></span>';
  };

  /** Khối media hoàn chỉnh. */
  GH.media = function (item, extraClass, opts) {
    return '<div class="gh-media ' + (extraClass || '') + '">' + GH.mediaInner(item, opts) + '</div>';
  };

  /* ======================================================================
     2. Cart store (localStorage)
     ====================================================================== */
  var KEY = 'gh_cart_v4';

  GH.cart = {
    items: [],

    load: function () {
      try { this.items = JSON.parse(localStorage.getItem(KEY)) || []; }
      catch (e) { this.items = []; }
      return this.items;
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.items)); } catch (e) {}
      $(document).trigger('gh:cart-changed');
    },
    key: function (id, optId) { return id + '::' + (optId || 'default'); },

    add: function (product, option, qty, extras) {
      qty = qty || 1;
      var opt = option || (product.options && product.options[0]) || { id: 'default', label: '', price: product.price };
      var k = this.key(product.id, opt.id);
      var found = this.items.filter(function (i) { return i.key === k; })[0];

      if (found) {
        found.qty += qty;
      } else {
        this.items.push($.extend({
          key: k,
          id: product.id,
          name: product.name,
          optionId: opt.id,
          optionLabel: opt.label,
          price: opt.price != null ? opt.price : product.price,
          tone: product.tone,
          img: product.img || '',
          catLabel: product.catLabel || '',
          qty: qty
        }, extras || {}));
      }
      this.save();
      return this;
    },
    setQty: function (key, qty) {
      this.items = this.items.filter(function (i) {
        if (i.key === key) { i.qty = Math.max(0, qty); return i.qty > 0; }
        return true;
      });
      this.save();
    },
    remove: function (key) {
      this.items = this.items.filter(function (i) { return i.key !== key; });
      this.save();
    },
    clear: function () { this.items = []; this.save(); },

    count: function () {
      return this.items.reduce(function (s, i) { return s + i.qty; }, 0);
    },
    subtotal: function () {
      return this.items.reduce(function (s, i) { return s + i.price * i.qty + (i.addonFee || 0) * i.qty; }, 0);
    },
    shipping: function () {
      var sub = this.subtotal();
      if (sub <= 0) return 0;
      return sub >= C.freeShippingThreshold ? 0 : C.shipping;
    },
    tax: function () { return this.subtotal() * C.taxRate; },
    total: function () { return this.subtotal() + this.shipping() + this.tax(); },
    toFree: function () { return Math.max(0, C.freeShippingThreshold - this.subtotal()); }
  };
  GH.cart.load();

  /* ======================================================================
     3. Toast
     ====================================================================== */
  GH.toast = function (msg, linkText, linkHref) {
    var $wrap = $('.gh-toast-wrap');
    if (!$wrap.length) $wrap = $('<div class="gh-toast-wrap"></div>').appendTo('body');

    var $t = $(
      '<div class="gh-toast">' +
        '<span class="gh-toast__icon">' + GH.icon('check', 18) + '</span>' +
        '<span>' + GH.escape(msg) + '</span>' +
        (linkText ? '<a href="' + linkHref + '">' + GH.escape(linkText) + '</a>' : '') +
      '</div>'
    ).appendTo($wrap);

    requestAnimationFrame(function () { $t.addClass('is-on'); });
    setTimeout(function () {
      $t.removeClass('is-on');
      setTimeout(function () { $t.remove(); }, 400);
    }, 3600);
  };

  /* ======================================================================
     4. Header / Footer render
     ====================================================================== */
  function navHtml(active) {
    var out = '';
    $.each(GH.nav, function (_, item) {
      if (item.sep) { out += '<li class="gh-nav__sep" aria-hidden="true"></li>'; return; }
      var isActive = item.key === active ? ' is-active' : '';
      var mega = item.mega ? ' data-mega="1"' : '';
      out += '<li class="gh-nav__item' + isActive + '"' + mega + '>' +
               '<a class="gh-nav__link" href="' + item.href + '">' + item.label +
                 (item.mega ? '<span class="gh-caret">' + GH.icon('chevdown', 13) + '</span>' : '') +
               '</a>' +
             '</li>';
    });
    return out;
  }

  function megaHtml() {
    var cols = '';
    $.each(GH.megaMenu, function (_, col) {
      var links = '';
      $.each(col.links, function (_, l) {
        links += '<a class="gh-mega__link" href="' + l[1] + '">' + l[0] + '</a>';
      });
      cols += '<div class="col-lg-3 col-md-4 mb-4 mb-lg-0">' +
                '<div class="gh-mega__col-title">' + col.title + '</div>' + links +
              '</div>';
    });
    return '<div class="gh-mega" id="ghMega">' +
             '<div class="gh-container"><div class="gh-mega__inner"><div class="row">' + cols +
               '<div class="col-lg-3 d-none d-lg-block">' +
                 '<a class="gh-mega__promo" href="personalise.html">' +
                   '<div>' +
                     '<div class="gh-tiny" style="color:var(--gh-gold)">New</div>' +
                     '<h4>Personalise your gift</h4>' +
                     '<span class="gh-link-arrow" style="color:#fff">Add an eCard ' + GH.icon('arrow', 15) + '</span>' +
                   '</div>' +
                 '</a>' +
               '</div>' +
             '</div></div></div>' +
           '</div>';
  }

  function searchHtml() {
    var chips = ['Hampers', 'Chocolate cake', 'Champagne', 'Spa gift', 'Corporate gifting']
      .map(function (t) { return '<button class="gh-chip" type="button" data-suggest="' + t + '">' + t + '</button>'; })
      .join('');
    return '<div class="gh-search" id="ghSearch">' +
             '<div class="gh-container">' +
               '<form class="gh-search__field" id="ghSearchForm" role="search">' +
                 '<input type="search" class="gh-search__input" id="ghSearchInput" placeholder="Search cakes, hampers, experiences…" aria-label="Search">' +
               '</form>' +
               '<div class="gh-search__suggest">' + chips + '</div>' +
             '</div>' +
           '</div>';
  }

  function offcanvasHtml() {
    var links = '';
    $.each(GH.nav, function (_, item) {
      if (item.sep) return;
      links += '<a class="gh-oc__link" href="' + item.href + '">' + item.label + '</a>';
    });
    var subs = '';
    $.each(GH.megaMenu[0].links, function (_, l) {
      subs += '<a class="gh-oc__link" href="' + l[1] + '">' + l[0] + '</a>';
    });
    return '<div class="offcanvas offcanvas-start gh-oc" tabindex="-1" id="ghOffcanvas" aria-label="Menu">' +
             '<div class="offcanvas-header border-bottom">' +
               GH.logo({ tag: 'div', className: 'gh-logo--sm' }) +
               '<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>' +
             '</div>' +
             '<div class="offcanvas-body">' + links +
               '<div class="gh-mega__col-title mt-4">Shop by Category</div>' +
               '<div class="gh-oc__sub">' + subs + '</div>' +
               '<a class="gh-btn gh-btn--gold gh-btn--block mt-4" href="cart.html">View cart</a>' +
             '</div>' +
           '</div>';
  }

  GH.renderHeader = function (active) {
    var html =
      '<header class="gh-header" id="ghHeader">' +
        '<div class="gh-container">' +
          '<div class="gh-header__top">' +
            '<div class="gh-header__tools">' +
              '<button class="gh-iconbtn gh-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#ghOffcanvas" aria-label="Open menu">' + GH.icon('menu', 20) + '</button>' +
              '<button class="gh-iconbtn" type="button" id="ghSearchToggle" aria-label="Search">' + GH.icon('search', 19) + '</button>' +
              '<a class="gh-iconbtn d-none d-lg-inline-flex" href="cart.html" aria-label="Cart">' +
                GH.icon('bag', 19) + '<span class="gh-cart-count" id="ghCartCount">0</span>' +
              '</a>' +
            '</div>' +
            GH.logo() +
            '<div class="gh-header__tools gh-header__tools--end">' +
              '<a class="gh-iconbtn d-none d-lg-inline-flex" href="#" aria-label="Account">' + GH.icon('user', 19) + '</a>' +
              '<a class="gh-iconbtn d-lg-none" href="cart.html" aria-label="Cart">' +
                GH.icon('bag', 19) + '<span class="gh-cart-count" id="ghCartCountM">0</span>' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<nav class="gh-nav" aria-label="Primary">' +
          '<div class="gh-container"><ul class="gh-nav__list">' + navHtml(active) + '</ul></div>' +
        '</nav>' +
        megaHtml() +
        searchHtml() +
      '</header>' +
      offcanvasHtml();

    $('#gh-header').replaceWith(html);
    GH.syncCartBadge();
    $(window).trigger('scroll.ghHeader');
  };

  GH.renderFooter = function () {
    var cols = [
      { title: 'Shop', links: [
        ['Cakes & Pastries','shop.html?cat=cakes'], ['Hampers & Gift Sets','shop.html?cat=celebration'],
        ['Wines & Champagne','shop.html?cat=beverages'], ['Wellness & Spa','shop.html?cat=wellness'],
        ['Brix Merchandise','shop.html?cat=brix'], ['Dining Vouchers','shop.html?cat=dining'],
        ['View All Products','shop.html'] ] },
      { title: 'Experiences', links: [
        ['Dining Experiences','experiences.html'], ['Spa & Wellness','experiences.html'],
        ['Afternoon Tea','experiences.html'], ["Chef's Table",'experiences.html'],
        ['Weekend Staycation','experiences.html'], ['Corporate Gifting','celebrations.html'],
        ['Chinese New Year','shop.html?season=cny'] ] },
      { title: 'Blog & Gift Guides', links: [
        ['Top 10 Luxury Hampers in Singapore','#'], ['How to Plan a Luxury Celebration','#'],
        ['Best Corporate Gift Ideas 2025','#'], ['Spa Gift Ideas for Her','#'],
        ['Wine Pairing Guide','#'], ['CNY Gifting Etiquette','#'] ] },
      { title: 'Help & Info', links: [
        ['FAQs','#'], ['Delivery Information','#'], ['Returns Policy','#'],
        ['Contact Us','#'], ['Terms of Service','#'], ['Privacy Policy','#'] ] }
    ];

    var colHtml = '';
    $.each(cols, function (_, c) {
      var li = '';
      $.each(c.links, function (_, l) { li += '<li><a href="' + l[1] + '">' + l[0] + '</a></li>'; });
      colHtml += '<div class="col-6 col-lg-2 mb-4 mb-lg-0"><h4>' + c.title + '</h4><ul>' + li + '</ul></div>';
    });

    var html =
      '<section class="gh-newsletter">' +
        '<div class="gh-container"><div class="row align-items-center g-3">' +
          '<div class="col-lg-6">' +
            '<h3 class="gh-serif">Stay in the Know</h3>' +
            '<p>New collections, seasonal offers, and exclusive promotions — delivered to your inbox.</p>' +
          '</div>' +
          '<div class="col-lg-6">' +
            '<form class="gh-newsletter__form" id="ghNewsletter" novalidate>' +
              '<input type="email" class="form-control gh-input" placeholder="Your email address" aria-label="Email" required>' +
              '<button class="gh-btn" type="submit">Subscribe</button>' +
            '</form>' +
            '<div class="gh-error" id="ghNewsletterErr">Please enter a valid email address.</div>' +
          '</div>' +
        '</div></div>' +
      '</section>' +

      '<footer class="gh-footer">' +
        '<div class="gh-container"><div class="row">' +
          '<div class="col-lg-4 mb-5 mb-lg-0 pe-lg-5">' +
            GH.logo({ light: true, className: 'gh-logo--footer' }) +
            '<p>Curated cakes, artisan hampers, and premium wines — crafted in our kitchens and delivered with care.</p>' +
            '<div class="gh-social">' +
              '<a href="#" aria-label="LinkedIn">in</a><a href="#" aria-label="Facebook">f</a><a href="#" aria-label="Instagram">ig</a>' +
            '</div>' +
            '<h4>Contact</h4>' +
            '<div class="gh-footer__contact">' +
              '<a href="mailto:singapore@hyatt.com">singapore@hyatt.com</a>' +
              '<a href="tel:+6567321234">+65 6732 1234</a>' +
            '</div>' +
          '</div>' +
          colHtml +
        '</div>' +
        '<div class="gh-footer__bottom">' +
          '<small>&copy; ' + new Date().getFullYear() + ' Grand Hyatt Singapore. All rights reserved.</small>' +
          '<div class="gh-pay"><span>VISA</span><span>MC</span><span>AMEX</span><span>PayNow</span></div>' +
        '</div>' +
      '</div></footer>';

    $('#gh-footer').replaceWith(html);
  };

  /* ======================================================================
     5. Cart badge
     ====================================================================== */
  GH.syncCartBadge = function (bump) {
    var n = GH.cart.count();
    $('#ghCartCount, #ghCartCountM').each(function () {
      var $b = $(this);
      $b.text(n).toggleClass('is-on', n > 0);
      if (bump && n > 0) {
        $b.removeClass('is-bump');
        void this.offsetWidth;
        $b.addClass('is-bump');
      }
    });
  };
  $(document).on('gh:cart-changed', function () { GH.syncCartBadge(true); });

  /* ======================================================================
     6. Reveal on scroll
     ====================================================================== */
  GH.initReveal = function () {
    var $els = $('.gh-reveal');
    if (!$els.length) return;

    if (!('IntersectionObserver' in window)) { $els.addClass('is-in'); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var d = parseInt(el.getAttribute('data-delay') || 0, 10);
          setTimeout(function () { el.classList.add('is-in'); }, d);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    $els.each(function () { io.observe(this); });
  };

  /** Gán delay so le cho các item trong 1 grid */
  GH.stagger = function (selector, step) {
    step = step || 70;
    $(selector).each(function (i) { $(this).attr('data-delay', Math.min(i, 7) * step); });
  };

  /* ======================================================================
     7. Global UI behaviours
     ====================================================================== */
  $(function () {

    /* Sticky header shadow (query lazily: header được render sau ready) */
    $(window).on('scroll.ghHeader', function () {
      $('#ghHeader').toggleClass('is-stuck', window.scrollY > 8);
    });

    /* Mega menu (hover trên desktop, click trên touch) */
    var megaTimer;
    $(document)
      .on('mouseenter', '.gh-nav__item[data-mega]', function () {
        clearTimeout(megaTimer);
        $(this).addClass('is-open');
        $('#ghMega').addClass('is-open');
      })
      .on('mouseleave', '.gh-nav__item[data-mega], #ghMega', function () {
        megaTimer = setTimeout(function () {
          $('.gh-nav__item').removeClass('is-open');
          $('#ghMega').removeClass('is-open');
        }, 180);
      })
      .on('mouseenter', '#ghMega', function () { clearTimeout(megaTimer); });

    /* Search panel */
    $(document).on('click', '#ghSearchToggle', function (e) {
      e.preventDefault();
      var $s = $('#ghSearch');
      $s.slideToggle(220, function () {
        if ($s.is(':visible')) $('#ghSearchInput').trigger('focus');
      });
    });
    $(document).on('click', '[data-suggest]', function () {
      $('#ghSearchInput').val($(this).data('suggest')).trigger('focus');
    });
    $(document).on('submit', '#ghSearchForm', function (e) {
      e.preventDefault();
      var q = $.trim($('#ghSearchInput').val());
      window.location.href = 'shop.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') { $('#ghSearch').slideUp(180); $('#ghMega').removeClass('is-open'); }
    });

    /* Newsletter */
    $(document).on('submit', '#ghNewsletter', function (e) {
      e.preventDefault();
      var $inp = $(this).find('input');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($.trim($inp.val()));
      $inp.toggleClass('is-invalid', !ok);
      $('#ghNewsletterErr').toggleClass('is-on', !ok);
      if (ok) { $inp.val(''); GH.toast('Thank you — you are on the list.'); }
    });

    /* Quick add từ card sản phẩm */
    $(document).on('click', '[data-quickadd]', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var p = GH.product($(this).data('quickadd'));
      if (!p) return;
      GH.cart.add(p, p.options && p.options[0], 1);
      GH.toast(p.name + ' added to cart', 'View cart', 'cart.html');
    });

    /* Smooth anchor scroll */
    $(document).on('click', 'a[href^="#"]:not([data-bs-toggle])', function (e) {
      var id = $(this).attr('href');
      if (id.length < 2) return;
      var $t = $(id);
      if (!$t.length) return;
      e.preventDefault();
      $('html,body').animate({ scrollTop: $t.offset().top - 130 }, 500);
    });

    /* Stepper dùng chung: [data-step="-1|1"] + [data-qty-target] */
    $(document).on('click', '[data-step]', function () {
      var $wrap = $(this).closest('[data-qty]');
      var $val = $wrap.find('[data-qty-val]');
      var min = parseInt($wrap.data('min') || 1, 10);
      var n = Math.max(min, (parseInt($val.text(), 10) || min) + parseInt($(this).data('step'), 10));
      $val.text(n);
      $wrap.trigger('gh:qty', [n]);
    });
  });

})(jQuery);
