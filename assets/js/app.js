/* ==========================================================================
   YQ eStore — Core app (helpers, cart, layout, UI behaviours)
   Requires: jQuery 3, Bootstrap 5, data.js
   ========================================================================== */
(function ($) {
  'use strict';

  var C = YQ.config;

  /* ======================================================================
     1. Helpers
     ====================================================================== */
  YQ.money = function (n) {
    return C.currencySymbol + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  YQ.money0 = function (n) {
    return C.currencySymbol + Math.round(Number(n || 0)).toLocaleString('en-US');
  };
  /* % giảm so với giá gốc (compareAt); trả 0 nếu không giảm */
  YQ.discount = function (price, compareAt) {
    price = Number(price || 0); compareAt = Number(compareAt || 0);
    return compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  };
  YQ.param = function (key) {
    var m = new RegExp('[?&]' + key + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  };
  /* ---------- Đường dẫn khi trang nằm trong thư mục con ----------
     Quy ước: MỌI href/src trong data.js và các hàm render đều viết theo GỐC SITE
     ('shop.html', 'assets/img/x.jpg'). Trang trong thư mục con khai báo
     <html data-root="../">, và YQ.localise() dịch lại đúng lúc chèn vào DOM.
     Trang ở gốc thì YQ.root = '' nên cả hai hàm là no-op.

     Chèn HTML có link/ảnh -> bọc YQ.localise(); một giá trị lẻ -> YQ.url().
  */
  YQ.root = document.documentElement.getAttribute('data-root') || '';

  YQ.url = function (h) {
    if (!YQ.root || !h) return h;
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(h) ? h : YQ.root + h;
  };

  YQ.localise = function (html) {
    if (!YQ.root || !html) return html;
    return String(html).replace(
      /\s(href|src)="(?![a-z][a-z0-9+.-]*:|\/\/|\/|#)([^"]*)"/gi,
      function (m, attr, path) { return ' ' + attr + '="' + YQ.root + path + '"'; }
    );
  };

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  /** ISO 'YYYY-MM-DD' -> '02-February-1994'. Chuỗi khác thì trả nguyên. */
  YQ.dateLabel = function (iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return iso || '';
    return p[2] + '-' + (MONTHS[+p[1] - 1] || p[1]) + '-' + p[0];
  };

  YQ.escape = function (s) {
    return $('<div/>').text(s == null ? '' : s).html();
  };
  YQ.product = function (id) {
    return YQ.products.filter(function (p) { return p.id === id; })[0] || null;
  };
  YQ.experience = function (id) {
    return YQ.experiences.filter(function (e) { return e.id === id; })[0] || null;
  };

  /** Ruột của khối media: ảnh thật nếu có `img`, không thì placeholder gradient. */
  YQ.mediaInner = function (item, opts) {
    opts = opts || {};
    if (item && item.img) {
      return '<img src="' + item.img + '" alt="' + YQ.escape(item.name || '') + '"' +
             (opts.eager ? '' : ' loading="lazy"') + ' decoding="async">';
    }
    return '<span class="yq-media__ph ph-' + ((item && item.tone) || 3) + '"></span>';
  };

  /** Khối media hoàn chỉnh. */
  YQ.media = function (item, extraClass, opts) {
    return '<div class="yq-media ' + (extraClass || '') + '">' + YQ.mediaInner(item, opts) + '</div>';
  };

  /* ======================================================================
     2. Cart store (localStorage)
     ====================================================================== */
  var KEY = 'yq_cart_v4';

  YQ.cart = {
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
      if (!this.quiet) $(document).trigger('yq:cart-changed');
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

    /* Nạp giỏ hàng mẫu từ YQ.demoCart (xem chú thích trong data.js).
       Mặc định chỉ chạy khi localStorage chưa có key nào; seed(true) để ép nạp lại. */
    seed: function (force) {
      var self = this;
      var list = YQ.demoCart || [];
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
          var e = YQ.experience(row.exp);
          if (!e) return;
          self.add(
            { id: e.id, name: e.name, tone: e.tone, price: e.price, img: e.img, catLabel: 'Experience' },
            { id: row.optionId || 'default', label: e.duration + ' \u00b7 ' + e.place, price: e.price },
            row.qty || 1, extras
          );
          return;
        }

        var p = YQ.product(row.id);
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
  YQ.cart.load();
  if (YQ.param('demo')) YQ.cart.seed(true);   // ?demo=1 → nạp lại giỏ hàng mẫu

  /* ======================================================================
     2b. Profile store (localStorage) — hồ sơ thành viên
     Trang profile.html giờ là HTML tĩnh, KHÔNG đọc store này. Store chỉ còn
     phục vụ password.html (email, ngày đổi mật khẩu) và invite.html (memberNo).
     ====================================================================== */
  var PKEY = 'yq_profile_v1';

  function hasAnyValue(obj) {
    for (var k in obj) if (obj[k] != null && $.trim(String(obj[k])) !== '') return true;
    return false;
  }

  YQ.profile = {
    data: {},

    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(PKEY); } catch (e) {}
      try { this.data = JSON.parse(raw) || null; } catch (e) { this.data = null; }
      /* Lần đầu (chưa có key) hoặc bản đã lưu rỗng toàn bộ (VD: lưu lúc thiếu YQ.demoProfile)
         -> nạp hồ sơ mẫu. memberNo là read-only nên hồ sơ thật không bao giờ rỗng hết. */
      if (!this.data || !hasAnyValue(this.data)) this.data = $.extend({}, YQ.demoProfile || {});
      return this.data;
    },
    save: function () {
      try { localStorage.setItem(PKEY, JSON.stringify(this.data)); } catch (e) {}
      $(document).trigger('yq:profile-changed', [this.data]);
    },
    get: function (key) {
      var v = this.data[key];
      return v == null ? '' : String(v);
    },
    set: function (patch) { $.extend(this.data, patch || {}); this.save(); return this.data; },

    fullName: function () {
      return $.trim(this.get('firstName') + ' ' + this.get('lastName'));
    }
  };
  YQ.profile.load();

  /* ======================================================================
     3. Toast
     ====================================================================== */
  YQ.toast = function (msg, linkText, linkHref) {
    var $wrap = $('.yq-toast-wrap');
    if (!$wrap.length) $wrap = $('<div class="yq-toast-wrap"></div>').appendTo('body');

    var $t = $(
      '<div class="yq-toast">' +
        '<span class="yq-toast__icon">' + YQ.icon('check', 18) + '</span>' +
        '<span>' + YQ.escape(msg) + '</span>' +
        (linkText ? '<a href="' + YQ.url(linkHref) + '">' + YQ.escape(linkText) + '</a>' : '') +
      '</div>'
    ).appendTo($wrap);

    requestAnimationFrame(function () { $t.addClass('is-on'); });
    setTimeout(function () {
      $t.removeClass('is-on');
      setTimeout(function () { $t.remove(); }, 400);
    }, 3600);
  };

  /* ======================================================================
     4. Header / Footer (markup tĩnh, chỉ init)
     ====================================================================== */
  /* ---------- Header ----------
     Header (#yqHeader + offcanvas #yqOffcanvas) là HTML tĩnh trong từng trang —
     backend include 1 partial, chỉ đổi class .is-active / aria-current của mục nav
     ứng với trang hiện tại. JS không dựng markup, chỉ đồng bộ trạng thái rồi phát
     yq:header-ready để nav.js / account.js / cart-anim.js gắn hành vi. */
  YQ.initHeader = function () {
    YQ.syncCartBadge();
    $(window).trigger('scroll.yqHeader');
    $(document).trigger('yq:header-ready');
  };

  /* ---------- Footer ----------
     Newsletter + footer là HTML tĩnh trong từng trang (khối <!-- FOOTER -->). JS chỉ
     phát yq:layout-ready — các module chờ cả header + footer rồi mới khởi động.
     Form newsletter (#yqNewsletter) xử lý ở mục 7 bên dưới. */
  YQ.initFooter = function () {
    $(document).trigger('yq:layout-ready');
  };

  /* ======================================================================
     5. Cart badge
     ====================================================================== */
  YQ.syncCartBadge = function (bump) {
    /* Chế độ server (có <span id="root" data-base>): số trên badge do backend in sẵn
       và add-to-cart.js cập nhật theo totalItems — không lấy số từ giỏ demo đè lên. */
    if (document.getElementById('root')) return;
    var n = YQ.cart.count();
    $('#yqCartCount, #yqCartCountM').each(function () {
      var $b = $(this);
      $b.text(n).toggleClass('is-on', n > 0);
      if (bump && n > 0) {
        $b.removeClass('is-bump');
        void this.offsetWidth;
        $b.addClass('is-bump');
      }
    });
  };
  $(document).on('yq:cart-changed', function () { YQ.syncCartBadge(true); });

  /* ======================================================================
     6. Reveal on scroll
     ====================================================================== */
  YQ.initReveal = function () {
    var $els = $('.yq-reveal');
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
  YQ.stagger = function (selector, step) {
    step = step || 70;
    $(selector).each(function (i) { $(this).attr('data-delay', Math.min(i, 7) * step); });
  };

  /* ======================================================================
     7. Global UI behaviours
     ====================================================================== */
  $(function () {

    /* Header (sticky/thu gọn khi cuộn, mega menu, panel Seasonal, ô search,
       offcanvas mobile): xem assets/js/modules/nav.js — handler `scroll.yqHeader`
       cũng được đăng ký ở đó nên $(window).trigger('scroll.yqHeader') vẫn chạy. */

    /* Newsletter */
    $(document).on('submit', '#yqNewsletter', function (e) {
      e.preventDefault();
      var $inp = $(this).find('input');
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($.trim($inp.val()));
      $inp.toggleClass('is-invalid', !ok);
      $('#yqNewsletterErr').toggleClass('is-on', !ok);
      if (ok) { $inp.val(''); YQ.toast('Thank you — you are on the list.'); }
    });

    /* Add to cart / Buy now trên card + PDP: xem assets/js/modules/add-to-cart.js */

    /* Smooth anchor scroll */
    $(document).on('click', 'a[href^="#"]:not([data-bs-toggle])', function (e) {
      var id = $(this).attr('href');
      if (id.length < 2) return;
      var $t = $(id);
      if (!$t.length) return;
      e.preventDefault();
      $('html,body').animate({ scrollTop: $t.offset().top - 130 }, 500);
    });

    /* Stepper dùng chung: [data-qty data-min] > [data-step="-1|1"] + [data-qty-val]
       [data-qty-val] là <span> (giỏ demo) hoặc <input name="cart[ID]"> (template backend:
       giá trị nằm trong input để form cập nhật giỏ của server submit được). */
    $(document).on('click', '[data-step]', function () {
      var $wrap = $(this).closest('[data-qty]');
      var $val = $wrap.find('[data-qty-val]');
      var isInput = $val.is('input');
      var min = $wrap.attr('data-min') != null ? parseInt($wrap.attr('data-min'), 10) : 1;
      var current = parseInt(isInput ? $val.val() : $val.text(), 10);
      if (isNaN(current)) current = min;
      var n = Math.max(min, current + parseInt($(this).data('step'), 10));
      if (isInput) $val.val(n).trigger('change');
      else $val.text(n);
      $wrap.trigger('yq:qty', [n]);
    });
  });

})(jQuery);
