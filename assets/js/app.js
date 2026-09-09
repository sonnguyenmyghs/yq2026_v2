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
  /* ---------- Đường dẫn khi trang nằm trong thư mục con ----------
     Quy ước: MỌI href/src trong data.js và các hàm render đều viết theo GỐC SITE
     ('shop.html', 'assets/img/x.jpg'). Trang trong thư mục con khai báo
     <html data-root="../">, và GH.localise() dịch lại đúng lúc chèn vào DOM.
     Trang ở gốc thì GH.root = '' nên cả hai hàm là no-op.

     Chèn HTML có link/ảnh -> bọc GH.localise(); một giá trị lẻ -> GH.url().
  */
  GH.root = document.documentElement.getAttribute('data-root') || '';

  GH.url = function (h) {
    if (!GH.root || !h) return h;
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(h) ? h : GH.root + h;
  };

  GH.localise = function (html) {
    if (!GH.root || !html) return html;
    return String(html).replace(
      /\s(href|src)="(?![a-z][a-z0-9+.-]*:|\/\/|\/|#)([^"]*)"/gi,
      function (m, attr, path) { return ' ' + attr + '="' + GH.root + path + '"'; }
    );
  };

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  /** ISO 'YYYY-MM-DD' -> '02-February-1994'. Chuỗi khác thì trả nguyên. */
  GH.dateLabel = function (iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return iso || '';
    return p[2] + '-' + (MONTHS[+p[1] - 1] || p[1]) + '-' + p[0];
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
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) {}
      try { this.items = JSON.parse(raw) || []; }
      catch (e) { this.items = []; }
      if (raw === null) this.seed();   // lần đầu vào site: nạp giỏ hàng mẫu
      return this.items;
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(this.items)); } catch (e) {}
      if (!this.quiet) $(document).trigger('gh:cart-changed');
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

    /* Nạp giỏ hàng mẫu từ GH.demoCart (xem chú thích trong data.js).
       Mặc định chỉ chạy khi localStorage chưa có key nào; seed(true) để ép nạp lại. */
    seed: function (force) {
      var self = this;
      var list = GH.demoCart || [];
      if (!list.length) return this;

      if (!force) {
        var raw = null;
        try { raw = localStorage.getItem(KEY); } catch (e) {}
        if (raw !== null) return this;
      }

      self.items = [];
      self.quiet = true;
      $.each(list, function (_, row) {
        var extras = {};
        if (row.addonLabel) extras.addonLabel = row.addonLabel;
        if (row.addonFee)   extras.addonFee   = row.addonFee;

        if (row.exp) {
          var e = GH.experience(row.exp);
          if (!e) return;
          self.add(
            { id: e.id, name: e.name, tone: e.tone, price: e.price, img: e.img, catLabel: 'Experience' },
            { id: row.optionId || 'default', label: e.duration + ' \u00b7 ' + e.place, price: e.price },
            row.qty || 1, extras
          );
          return;
        }

        var p = GH.product(row.id);
        if (!p) return;
        var opt = (p.options || []).filter(function (o) { return o.id === row.optionId; })[0];
        self.add(p, opt, row.qty || 1, extras);
      });
      self.quiet = false;
      self.save();
      return this;
    },

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
  if (GH.param('demo')) GH.cart.seed(true);   // ?demo=1 → nạp lại giỏ hàng mẫu

  /* ======================================================================
     2b. Profile store (localStorage) — hồ sơ thành viên
     ====================================================================== */
  var PKEY = 'gh_profile_v1';

  GH.profile = {
    data: {},

    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(PKEY); } catch (e) {}
      try { this.data = JSON.parse(raw) || null; } catch (e) { this.data = null; }
      if (!this.data) this.data = $.extend({}, GH.demoProfile || {});   // lần đầu: hồ sơ mẫu
      return this.data;
    },
    save: function () {
      try { localStorage.setItem(PKEY, JSON.stringify(this.data)); } catch (e) {}
      $(document).trigger('gh:profile-changed', [this.data]);
    },
    get: function (key) {
      var v = this.data[key];
      return v == null ? '' : String(v);
    },
    set: function (patch) { $.extend(this.data, patch || {}); this.save(); return this.data; },

    fullName: function () {
      return $.trim(this.get('firstName') + ' ' + this.get('lastName'));
    },

    /** Bao nhiêu % số trường đã điền — dùng cho thanh "profile complete". */
    completeness: function () {
      var all = [];
      $.each(GH.profileGroups || [], function (_, g) {
        $.each(g.fields, function (_, f) { all.push(f.key); });
      });
      if (!all.length) return 100;
      var self = this;
      var done = all.filter(function (k) { return $.trim(self.get(k)) !== ''; }).length;
      return Math.round(done / all.length * 100);
    },
    missing: function () {
      var self = this, out = [];
      $.each(GH.profileGroups || [], function (_, g) {
        $.each(g.fields, function (_, f) {
          if (!f.ro && $.trim(self.get(f.key)) === '') out.push(f.label);
        });
      });
      return out;
    }
  };
  GH.profile.load();

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
        (linkText ? '<a href="' + GH.url(linkHref) + '">' + GH.escape(linkText) + '</a>' : '') +
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
  /* ---------- Helper dùng chung cho header ---------- */

  /** Mục nav (hoặc con của nó) có đang là trang hiện tại không? */
  function navIsActive(item, active) {
    if (!active) return false;
    if (item.key === active) return true;
    return (item.children || []).filter(function (c) { return c.key === active; }).length > 0;
  }

  /** id của panel thả xuống ứng với loại panel. */
  function panelId(kind) { return kind === 'seasonal' ? 'ghSeasonal' : 'ghMega'; }

  /** Danh sách con của một mục nav: children thủ công, hoặc lấy từ 1 cột mega. */
  function navChildren(item) {
    if (item.children) return item.children;
    var col = (item.megaIndex != null) ? GH.megaMenu[item.megaIndex] : null;
    if (!col) return [];
    return col.links.map(function (l) { return { label: l[0], href: l[1] }; });
  }

  /* ---------- Hàng nav chính (desktop) ----------
     Chỉ 5 mục: 4 mục chính + "Seasonal" gom nhóm mùa vụ vào panel thả xuống.
     Mục có panel: dùng <a> nếu có trang thật, dùng <button> nếu chỉ là nhóm. */
  function navHtml(active) {
    var out = '';
    $.each(GH.nav, function (_, item) {
      if (item.sep) return;                       // separator của bản cũ: bỏ

      var on    = navIsActive(item, active);
      var pid   = item.panel ? panelId(item.panel) : '';
      var cls   = 'gh-nav__item' + (on ? ' is-active' : '') + (item.panel ? ' gh-nav__item--panel' : '');
      var caret = item.panel ? '<span class="gh-nav__caret" aria-hidden="true">' + GH.icon('chevdown', 12) + '</span>' : '';
      var inner = '<span class="gh-nav__label">' + item.label + '</span>' + caret;
      var pop   = item.panel ? ' aria-haspopup="true" aria-expanded="false" aria-controls="' + pid + '"' : '';
      var link  = item.href
        ? '<a class="gh-nav__link" href="' + item.href + '"' + (on ? ' aria-current="page"' : '') + pop + '>' + inner + '</a>'
        : '<button class="gh-nav__link" type="button"' + pop + '>' + inner + '</button>';

      out += '<li class="' + cls + '"' + (item.panel ? ' data-panel="' + item.panel + '"' : '') + '>' + link + '</li>';
    });
    return out;
  }

  /* ---------- Hai panel thả xuống: #ghMega (Shop by Category) + #ghSeasonal ---------- */
  function megaHtml() {
    /* --- Panel 1: mega 3 cột danh mục + 1 thẻ khuyến mãi --- */
    var cols = '';
    $.each(GH.megaMenu, function (_, col) {
      var links = '';
      $.each(col.links, function (_, l) {
        links += '<a class="gh-mega__link" href="' + l[1] + '">' +
                   '<span>' + l[0] + '</span>' + GH.icon('chevright', 13) +
                 '</a>';
      });
      var title = col.href
        ? '<a class="gh-mega__col-title" href="' + col.href + '">' + col.title + '</a>'
        : '<div class="gh-mega__col-title">' + col.title + '</div>';
      cols += '<div class="col-lg-3 col-md-4"><div class="gh-mega__col">' + title + links + '</div></div>';
    });

    var mega =
      '<div class="gh-navpanel gh-mega" id="ghMega" role="region" aria-label="Shop by Category">' +
        '<div class="gh-container"><div class="gh-mega__inner"><div class="row g-4">' + cols +
          '<div class="col-lg-3 d-none d-lg-block">' +
            '<a class="gh-mega__promo" href="personalise.html">' +
              '<span class="gh-mega__promo-media"><img src="assets/img/p-grand-hamper.jpg" alt="" loading="lazy" decoding="async"></span>' +
              '<span class="gh-mega__promo-body">' +
                '<span class="gh-mega__promo-eyebrow">New</span>' +
                '<span class="gh-mega__promo-title">Personalise your gift</span>' +
                '<span class="gh-mega__promo-cta">Add an eCard ' + GH.icon('arrow', 15) + '</span>' +
              '</span>' +
            '</a>' +
          '</div>' +
        '</div></div></div>' +
      '</div>';

    /* --- Panel 2: Seasonal — 5 chiến dịch mùa vụ dạng thẻ dọc --- */
    var item = GH.nav.filter(function (n) { return n.panel === 'seasonal'; })[0] || {};
    var cards = '';
    $.each(item.children || [], function (_, c) {
      cards +=
        '<a class="gh-season__card" href="' + c.href + '">' +
          '<span class="gh-season__ico" aria-hidden="true">' + GH.icon(c.icon || 'sparkle', 19) + '</span>' +
          '<span class="gh-season__name">' + c.label +
            (c.tag ? '<em class="gh-season__tag">' + c.tag + '</em>' : '') +
          '</span>' +
          (c.desc ? '<span class="gh-season__desc">' + c.desc + '</span>' : '') +
          '<span class="gh-season__go" aria-hidden="true">' + GH.icon('arrow', 15) + '</span>' +
        '</a>';
    });

    var seasonal =
      '<div class="gh-navpanel gh-season" id="ghSeasonal" role="region" aria-label="Seasonal collections">' +
        '<div class="gh-container"><div class="gh-season__inner">' +
          '<div class="gh-season__head">' +
            '<div>' +
              '<div class="gh-season__eyebrow">Seasonal &amp; Occasions</div>' +
              (item.intro ? '<p class="gh-season__intro">' + item.intro + '</p>' : '') +
            '</div>' +
            '<a class="gh-season__all" href="shop.html">Browse all offers ' + GH.icon('arrow', 15) + '</a>' +
          '</div>' +
          '<div class="gh-season__grid">' + cards + '</div>' +
        '</div></div>' +
      '</div>';

    return mega + seasonal;
  }

  /* ---------- Panel tìm kiếm ---------- */
  function searchHtml() {
    var chips = ['Hampers', 'Chocolate cake', 'Champagne', 'Spa gift', 'Corporate gifting']
      .map(function (t) { return '<button class="gh-chip" type="button" data-suggest="' + t + '">' + t + '</button>'; })
      .join('');
    return '<div class="gh-search" id="ghSearch" aria-hidden="true">' +
             '<div class="gh-container">' +
               '<form class="gh-search__field" id="ghSearchForm" role="search">' +
                 '<span class="gh-search__ico" aria-hidden="true">' + GH.icon('search', 21) + '</span>' +
                 '<input type="search" class="gh-search__input" id="ghSearchInput" autocomplete="off" ' +
                   'placeholder="Search cakes, hampers, experiences\u2026" aria-label="Search">' +
                 '<button class="gh-search__clear" type="button" data-search-clear aria-label="Clear search">' + GH.icon('close', 15) + '</button>' +
                 '<button class="gh-search__go" type="submit">Search' + GH.icon('arrow', 15) + '</button>' +
               '</form>' +
               '<div class="gh-search__meta">' +
                 '<span class="gh-search__label">Popular searches</span>' +
                 '<div class="gh-search__suggest">' + chips + '</div>' +
               '</div>' +
             '</div>' +
           '</div>';
  }

  /* ---------- Offcanvas (mobile) ----------
     Mỗi mục có submenu -> 1 nhóm accordion (Bootstrap collapse):
     bấm nhãn để sang trang, bấm mũi tên để mở/đóng danh sách con. */
  function offcanvasHtml(active) {
    var groups = '';
    $.each(GH.nav, function (i, item) {
      if (item.sep) return;

      var kids = navChildren(item);
      var on   = navIsActive(item, active);

      if (!kids.length) {
        groups += '<a class="gh-oc__link' + (on ? ' is-active' : '') + '" href="' + item.href + '">' + item.label + '</a>';
        return;
      }

      var id = 'ghOcGrp' + i;
      var subs = '';
      $.each(kids, function (_, k) {
        subs += '<a class="gh-oc__sublink' + (k.key && k.key === active ? ' is-active' : '') + '" href="' + k.href + '">' +
                  '<span>' + k.label + '</span>' + GH.icon('chevright', 13) +
                '</a>';
      });

      var toggleAttrs = ' type="button" data-bs-toggle="collapse" data-bs-target="#' + id + '"' +
                        ' aria-expanded="' + (on ? 'true' : 'false') + '" aria-controls="' + id + '"';
      var chev = '<span class="gh-oc__chev" aria-hidden="true">' + GH.icon('chevdown', 16) + '</span>';

      var head = item.href
        ? '<div class="gh-oc__row">' +
            '<a class="gh-oc__link' + (on ? ' is-active' : '') + '" href="' + item.href + '">' + item.label + '</a>' +
            '<button class="gh-oc__toggle' + (on ? '' : ' collapsed') + '"' + toggleAttrs +
              ' aria-label="Show ' + item.label + ' submenu">' + chev + '</button>' +
          '</div>'
        : '<button class="gh-oc__link gh-oc__link--full' + (on ? ' is-active' : '') + ' gh-oc__toggle' + (on ? '' : ' collapsed') + '"' +
            toggleAttrs + '>' + item.label + chev + '</button>';

      groups += '<div class="gh-oc__group">' + head +
                  '<div class="collapse' + (on ? ' show' : '') + '" id="' + id + '">' +
                    '<div class="gh-oc__sub">' + subs + '</div>' +
                  '</div>' +
                '</div>';
    });

    return '<div class="offcanvas offcanvas-start gh-oc" tabindex="-1" id="ghOffcanvas" aria-label="Menu">' +
             '<div class="offcanvas-header gh-oc__head">' +
               GH.logo({ tag: 'div', className: 'gh-logo--sm' }) +
               '<button type="button" class="gh-oc__close" data-bs-dismiss="offcanvas" aria-label="Close menu">' + GH.icon('close', 18) + '</button>' +
             '</div>' +
             '<div class="offcanvas-body gh-oc__body">' +
               '<div class="gh-oc__quick">' +
                 '<a class="gh-oc__quicklink" href="cart.html">' + GH.icon('bag', 18) +
                   '<span>Cart</span><em class="gh-oc__badge" data-oc-count>0</em></a>' +
                 '<a class="gh-oc__quicklink" href="#" data-gh-account aria-label="Account">' +
                   GH.icon('user', 18) + '<span data-gh-account-label>Account</span></a>' +
                 '<button class="gh-oc__quicklink" type="button" data-search-toggle data-bs-dismiss="offcanvas">' +
                   GH.icon('search', 18) + '<span>Search</span></button>' +
               '</div>' +
               '<nav class="gh-oc__nav" aria-label="Mobile">' + groups + '</nav>' +
               '<div class="gh-oc__foot">' +
                 '<a class="gh-btn gh-btn--gold gh-btn--block" href="cart.html">View cart</a>' +
                 '<div class="gh-oc__note">' + GH.icon('truck', 16) +
                   '<span>Complimentary delivery above ' + GH.money0(C.freeShippingThreshold) + '</span></div>' +
               '</div>' +
             '</div>' +
           '</div>';
  }

  GH.renderHeader = function (active) {
    var html =
      '<header class="gh-header" id="ghHeader">' +
        '<div class="gh-header__shell">' +
          '<div class="gh-container">' +
            '<div class="gh-header__top">' +
              '<div class="gh-header__tools">' +
                '<button class="gh-iconbtn gh-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#ghOffcanvas" aria-controls="ghOffcanvas" aria-label="Open menu">' + GH.icon('menu', 20) + '</button>' +
                '<button class="gh-searchbtn" type="button" id="ghSearchToggle" data-search-toggle aria-expanded="false" aria-controls="ghSearch">' +
                  GH.icon('search', 17) + '<span class="gh-searchbtn__txt">Search</span>' +
                  '<kbd class="gh-searchbtn__kbd" aria-hidden="true">/</kbd>' +
                '</button>' +
                '<button class="gh-iconbtn gh-searchbtn--icon" type="button" data-search-toggle aria-controls="ghSearch" aria-label="Search">' + GH.icon('search', 19) + '</button>' +
              '</div>' +
              '<div class="gh-header__brand">' + GH.logo() + '</div>' +
              '<div class="gh-header__tools gh-header__tools--end">' +
                '<a class="gh-iconbtn d-none d-lg-inline-flex" href="#" id="ghAccountBtn" data-gh-account aria-label="Account">' + GH.icon('user', 19) + '</a>' +
                '<a class="gh-iconbtn d-none d-lg-inline-flex" href="cart.html" aria-label="Cart">' +
                  GH.icon('bag', 19) + '<span class="gh-cart-count" id="ghCartCount">0</span>' +
                '</a>' +
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
        '</div>' +
      '</header>' +
      offcanvasHtml(active);

    $('#gh-header').replaceWith(GH.localise(html));
    GH.syncCartBadge();
    $(window).trigger('scroll.ghHeader');
    $(document).trigger('gh:header-ready');
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
        ['My Profile','member/profile.html'], ['My Orders','member/orders.html'],
        ['FAQs','#'], ['Delivery Information','#'],
        ['Returns Policy','#'], ['Contact Us','#'], ['Terms of Service','#'],
        ['Privacy Policy','#'] ] }
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

    $('#gh-footer').replaceWith(GH.localise(html));
    $(document).trigger('gh:layout-ready');
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

    /* Header (sticky/thu gọn khi cuộn, mega menu, panel Seasonal, ô search,
       offcanvas mobile): xem assets/js/modules/nav.js — handler `scroll.ghHeader`
       cũng được đăng ký ở đó nên $(window).trigger('scroll.ghHeader') vẫn chạy. */

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
