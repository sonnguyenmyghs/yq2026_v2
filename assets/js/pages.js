/* ==========================================================================
   YQ eStore — Components + page controllers
   ========================================================================== */
(function ($) {
  'use strict';

  var C = YQ.config;

  /* ======================================================================
     1. Components
     ====================================================================== */
  YQ.productCard = function (p, opts) {
    opts = opts || {};
    var badge = p.badge
      ? '<span class="yq-badge ' + (p.badge === 'New' ? 'yq-badge--gold' : (p.badge === 'Seasonal' ? 'yq-badge--light' : '')) + '">' + p.badge + '</span>'
      : '';
    var meta = p.meta ? '<span class="yq-card__cat">' + YQ.icon('gift', 13) + ' ' + p.meta + '</span>' : '';

    return '' +
      '<article class="yq-card yq-reveal">' +
        '<div class="yq-card__mediawrap">' +
          badge +
          '<a class="yq-card__media yq-media yq-zoom d-block" href="product.html?id=' + p.id + '" aria-label="' + YQ.escape(p.name) + '">' +
            YQ.mediaInner(p) +
          '</a>' +
          (opts.quickAdd === false ? '' :
            '<div class="yq-quickadd"><button class="yq-btn yq-btn--sm yq-btn--block" type="button" data-quickadd="' + p.id + '">' +
              YQ.icon('bag', 15) + ' Quick add</button></div>') +
        '</div>' +
        '<div class="yq-card__body">' +
          '<div class="yq-card__cat">' + (p.meta ? p.meta + ' · ' : '') + p.catLabel + '</div>' +
          '<h3 class="yq-card__title"><a href="product.html?id=' + p.id + '">' + YQ.escape(p.name) + '</a></h3>' +
          '<p class="yq-card__desc">' + YQ.escape(p.short || p.desc) + '</p>' +
          '<div class="yq-card__foot">' +
            '<span class="yq-card__price"><small>From</small>' + YQ.money0(p.price) + '</span>' +
            '<a class="yq-link-arrow" href="product.html?id=' + p.id + '">View ' + YQ.icon('arrow', 14) + '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  };

  /** Order summary block (dùng ở cart + checkout) */
  YQ.summaryHtml = function (opts) {
    opts = opts || {};
    var cart = YQ.cart;
    var sub = cart.subtotal(), ship = cart.shipping(), tax = cart.tax(), total = cart.total();
    var toFree = cart.toFree();
    var pct = Math.min(100, (sub / C.freeShippingThreshold) * 100);

    var note = '';
    if (sub > 0 && toFree > 0) {
      note = '<div class="yq-ship-note">' + YQ.icon('truck', 16) +
             '<div class="w-100">Add ' + YQ.money(toFree) + ' more for free shipping' +
               '<div class="yq-ship-bar"><i style="width:' + pct + '%"></i></div>' +
             '</div></div>';
    } else if (sub > 0) {
      note = '<div class="yq-ship-note">' + YQ.icon('check', 16) + '<div>You have unlocked free shipping.</div></div>';
    }

    var lines = '';
    if (opts.showItems) {
      $.each(cart.items, function (_, i) {
        lines += '<div class="d-flex gap-3 align-items-center mb-3">' +
                   '<div class="yq-media" style="width:52px;height:52px;border-radius:8px;flex:none">' +
                     YQ.mediaInner(i) + '</div>' +
                   '<div class="flex-grow-1 min-width-0">' +
                     '<div class="yq-small text-truncate" style="color:var(--yq-ink)">' + YQ.escape(i.name) + '</div>' +
                     '<div class="yq-tiny yq-muted">Qty: ' + i.qty + '</div>' +
                   '</div>' +
                   '<div class="yq-sum__val yq-small">' + YQ.money((i.price + (i.addonFee || 0)) * i.qty) + '</div>' +
                 '</div>';
      });
      if (lines) lines += '<hr style="border-color:var(--yq-line-soft);opacity:1">';
    }

    return '' +
      '<h3 class="yq-serif mb-3" style="font-size:1.3rem">Order summary</h3>' +
      lines +
      '<div class="yq-sum"><span>Subtotal</span><span class="yq-sum__val">' + YQ.money(sub) + '</span></div>' +
      '<div class="yq-sum"><span>Shipping</span><span class="yq-sum__val">' + (ship === 0 ? 'Free' : YQ.money(ship)) + '</span></div>' +
      '<div class="yq-sum"><span>Tax (9%)</span><span class="yq-sum__val">' + YQ.money(tax) + '</span></div>' +
      '<div class="yq-sum yq-sum--total"><span>Total</span><span class="yq-sum__val">' + YQ.money(total) + '</span></div>' +
      (opts.cta ? '<a class="yq-btn yq-btn--block mt-4" href="' + opts.ctaHref + '">' + opts.cta + ' ' + YQ.icon('arrow', 16) + '</a>' : '') +
      note;
  };

  /* ======================================================================
     3. Shop (filters + sort + search)
     ====================================================================== */
  YQ.initShop = function () {
    var state = {
      cat: YQ.param('cat') || 'all',
      season: YQ.param('season') || null,
      q: YQ.param('q') || '',
      sort: 'featured'
    };

    /* Chips */
    $('#shopCats').html(YQ.categories.map(function (c) {
      return '<button class="yq-chip" type="button" data-cat="' + c.id + '">' + c.label + '</button>';
    }).join(''));

    $('#shopSeasons').html(YQ.seasons.map(function (s) {
      return '<button class="yq-chip yq-chip--gold" type="button" data-season="' + s.id + '">' + s.label + '</button>';
    }).join(''));

    function filtered() {
      var q = state.q.toLowerCase();
      var list = YQ.products.filter(function (p) {
        if (state.cat !== 'all' && p.cat !== state.cat) return false;
        if (state.season && (p.seasons || []).indexOf(state.season) === -1) return false;
        if (q && (p.name + ' ' + p.catLabel + ' ' + p.desc).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });

      var s = state.sort;
      list.sort(function (a, b) {
        if (s === 'price-asc')  return a.price - b.price;
        if (s === 'price-desc') return b.price - a.price;
        if (s === 'name')       return a.name.localeCompare(b.name);
        if (s === 'new')        return (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0) || a.rank - b.rank;
        return a.rank - b.rank;
      });
      return list;
    }

    function render() {
      var list = filtered();

      $('#shopCats .yq-chip').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-cat') === state.cat);
      });
      $('#shopSeasons .yq-chip').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-season') === state.season);
      });
      $('#shopCount').text(list.length + ' product' + (list.length === 1 ? '' : 's'));
      $('#shopQuery').toggle(!!state.q).find('b').text(state.q);

      if (!list.length) {
        $('#shopGrid').html(
          '<div class="col-12"><div class="yq-empty">' +
            '<div class="yq-empty__icon">' + YQ.icon('search', 26) + '</div>' +
            '<h3 class="yq-h3 mb-2">No products found</h3>' +
            '<p class="yq-muted mb-4">Try another category or clear your filters.</p>' +
            '<button class="yq-btn yq-btn--yqost" type="button" id="shopReset">Clear filters</button>' +
          '</div></div>'
        );
        return;
      }

      $('#shopGrid').html(list.map(function (p) {
        return '<div class="col-6 col-lg-3">' + YQ.productCard(p) + '</div>';
      }).join(''));

      YQ.stagger('#shopGrid .yq-reveal', 45);
      YQ.initReveal();
    }

    /* Events */
    $(document).on('click', '#shopCats .yq-chip', function () {
      state.cat = $(this).attr('data-cat'); render();
    });
    $(document).on('click', '#shopSeasons .yq-chip', function () {
      var s = $(this).attr('data-season');
      state.season = (state.season === s) ? null : s;
      render();
    });
    $(document).on('change', '#shopSort', function () { state.sort = this.value; render(); });
    $(document).on('click', '#shopReset, #shopClearQuery', function () {
      state = { cat: 'all', season: null, q: '', sort: 'featured' };
      $('#shopSort').val('featured');
      render();
    });

    render();
  };

  /* ======================================================================
     4. Product detail
     ====================================================================== */
  YQ.initProduct = function () {
    var id = YQ.param('id') || YQ.products[0].id;
    var p = YQ.product(id) || YQ.products[0];
    var sel = p.options[0];
    var qty = 1;

    document.title = p.name + ' — Grand Hyatt Singapore';

    /* Gallery.
       Ưu tiên p.gallery = ['a.jpg','b.jpg', ...] nếu sản phẩm có bộ ảnh riêng.
       Không có thì lấy ảnh của các sản phẩm cùng danh mục cho đủ 4 khung. */
    var shots;
    if (p.gallery && p.gallery.length) {
      shots = p.gallery.map(function (src) { return { img: src, name: p.name, tone: p.tone }; });
    } else {
      shots = [p];
      var pool = YQ.products.filter(function (x) { return x.id !== p.id && x.img && x.cat === p.cat; })
        .concat(YQ.products.filter(function (x) { return x.id !== p.id && x.img && x.cat !== p.cat; }));
      for (var i = 0; i < pool.length && shots.length < 4; i++) {
        shots.push({ img: pool[i].img, name: p.name, tone: pool[i].tone });
      }
      while (shots.length < 4) shots.push({ tone: [3, 6, 8][shots.length % 3], name: p.name });
    }
    $('#pdpMain').html(YQ.mediaInner(p, { eager: true }));
    $('#pdpThumbs').html(shots.map(function (sh, i) {
      return '<button class="yq-pdp__thumb' + (i === 0 ? ' is-active' : '') + '" type="button" data-shot="' + i + '">' +
               '<span class="yq-media">' + YQ.mediaInner(sh) + '</span></button>';
    }).join(''));

    /* Info */
    $('#pdpCat').text(p.catLabel);
    $('#pdpTitle').text(p.name);
    $('#pdpDesc').text(p.desc);
    $('#pdpOptionLabel').text(p.optionLabel || 'Select option');
    $('#pdpOptions').html(p.options.map(function (o, i) {
      return '<button class="yq-option' + (i === 0 ? ' is-active' : '') + '" type="button" data-opt="' + o.id + '">' + o.label + '</button>';
    }).join(''));

    function paint() {
      $('#pdpPrice').html(YQ.money0(sel.price) + '<small>per ' + (sel.label.split(' (')[0]) + '</small>');
      $('#pdpAddLabel').text('Add to cart — ' + YQ.money0(sel.price * qty));
    }
    paint();

    /* Related */
    var related = YQ.products.filter(function (x) { return x.id !== p.id && x.cat === p.cat; });
    if (related.length < 4) {
      related = related.concat(YQ.products.filter(function (x) {
        return x.id !== p.id && related.indexOf(x) === -1;
      }));
    }
    $('#pdpRelated').html(related.slice(0, 4).map(function (r) {
      return '<div class="col-6 col-lg-3">' + YQ.productCard(r) + '</div>';
    }).join(''));

    /* Events */
    $(document).on('click', '#pdpThumbs .yq-pdp__thumb', function () {
      $('#pdpThumbs .yq-pdp__thumb').removeClass('is-active');
      $(this).addClass('is-active');
      $('#pdpMain').html(YQ.mediaInner(shots[parseInt($(this).attr('data-shot'), 10)], { eager: true }));
    });

    $(document).on('click', '#pdpOptions .yq-option', function () {
      $('#pdpOptions .yq-option').removeClass('is-active');
      $(this).addClass('is-active');
      var optId = $(this).attr('data-opt');           // attr(): tránh jQuery ép '12' -> 12
      sel = p.options.filter(function (o) { return String(o.id) === optId; })[0] || sel;
      paint();
    });

    $('#pdpQty').on('yq:qty', function (e, n) { qty = n; paint(); });

    $(document).on('click', '#pdpAdd', function () {
      YQ.cart.add(p, sel, qty);
      YQ.toast(p.name + ' added to cart', 'View cart', 'cart.html');
    });

    YQ.stagger('#pdpRelated .yq-reveal');
    YQ.initReveal();
  };

  /* ======================================================================
     5. Experiences
     ====================================================================== */
  /* ======================================================================
     6. Celebrations
     ====================================================================== */
  /* ======================================================================
     7. Cart
     ====================================================================== */
  YQ.initCart = function () {
    function render() {
      var items = YQ.cart.items;

      if (!items.length) {
        $('#cartWrap').html(
          '<div class="col-12"><div class="yq-panel yq-empty">' +
            '<div class="yq-empty__icon">' + YQ.icon('bag', 26) + '</div>' +
            '<h3 class="yq-h3 mb-2">Your cart is empty</h3>' +
            '<p class="yq-muted mb-4">Explore our cakes, hampers, and experiences.</p>' +
            '<a class="yq-btn" href="shop.html">Continue shopping ' + YQ.icon('arrow', 16) + '</a>' +
          '</div></div>'
        );
        return;
      }

      var lines = items.map(function (i) {
        return '' +
          '<div class="yq-line" data-key="' + i.key + '">' +
            '<div class="yq-line__media yq-media">' + YQ.mediaInner(i) + '</div>' +
            '<div class="flex-grow-1">' +
              '<div class="yq-line__title">' + YQ.escape(i.name) + '</div>' +
              '<div class="yq-line__opt">' + YQ.escape(i.optionLabel || '') +
                (i.addonLabel ? ' · ' + YQ.escape(i.addonLabel) : '') + '</div>' +
              '<div class="yq-qty mt-3" data-qty data-min="1">' +
                '<button class="yq-qty__btn" type="button" data-step="-1" aria-label="Decrease">' + YQ.icon('minus', 15) + '</button>' +
                '<span class="yq-qty__val" data-qty-val>' + i.qty + '</span>' +
                '<button class="yq-qty__btn" type="button" data-step="1" aria-label="Increase">' + YQ.icon('plus', 15) + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="text-end">' +
              '<div class="yq-line__price">' + YQ.money((i.price + (i.addonFee || 0)) * i.qty) + '</div>' +
            '</div>' +
            '<button class="yq-line__remove" type="button" data-remove aria-label="Remove">' + YQ.icon('close', 16) + '</button>' +
          '</div>';
      }).join('');

      $('#cartWrap').html(
        '<div class="col-lg-7 col-xl-8 mb-4 mb-lg-0">' +
          '<div class="yq-panel yq-panel--flush">' + lines + '</div>' +
          '<div class="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">' +
            '<a class="yq-link-arrow" href="shop.html">' + YQ.icon('chevleft', 14) + ' Continue shopping</a>' +
            '<button class="yq-btn yq-btn--yqost yq-btn--sm" type="button" id="cartClear">Clear cart</button>' +
          '</div>' +
        '</div>' +
        '<div class="col-lg-5 col-xl-4">' +
          '<div class="yq-panel yq-sticky">' +
            YQ.summaryHtml({ cta: 'Proceed to checkout', ctaHref: 'checkout.html' }) +
            '<div class="yq-trust mt-3 pt-3">' +
              '<span>' + YQ.icon('lock', 15) + 'Secure payment</span>' +
              '<span>' + YQ.icon('truck', 15) + 'Same-day delivery</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    $(document).on('yq:cart-changed', render);

    $(document).on('yq:qty', '#cartWrap [data-qty]', function (e, n) {
      YQ.cart.setQty($(this).closest('.yq-line').data('key'), n);
    });
    $(document).on('click', '#cartWrap [data-remove]', function () {
      YQ.cart.remove($(this).closest('.yq-line').data('key'));
      YQ.toast('Item removed');
    });
    $(document).on('click', '#cartClear', function () {
      YQ.cart.clear();
      YQ.toast('Cart cleared');
    });

    render();
  };

  /* ======================================================================
     8. Checkout (4 bước)
     ====================================================================== */
  YQ.initCheckout = function () {
    var steps = ['Information', 'Shipping', 'Payment', 'Review'];
    var current = 1;

    function paintSteps() {
      $('#coSteps').html(steps.map(function (s, i) {
        var n = i + 1;
        var cls = n === current ? 'is-active' : (n < current ? 'is-done' : '');
        var num = n < current ? YQ.icon('check', 12) : n;
        return (i ? '<span class="yq-step__bar"></span>' : '') +
          '<span class="yq-step ' + cls + '" data-step-idx="' + n + '">' +
            '<span class="yq-step__num">' + num + '</span>' + s +
          '</span>';
      }).join(''));
    }

    function paintSummary() {
      $('#coSummary').html(YQ.summaryHtml({ showItems: true }));
    }

    function show(n) {
      current = n;
      paintSteps();
      $('.co-pane').hide().filter('[data-pane="' + n + '"]').fadeIn(220);
      $('html,body').animate({ scrollTop: $('#coTop').offset().top - 140 }, 350);
    }

    function validate(n) {
      var ok = true;
      $('.co-pane[data-pane="' + n + '"]').find('[required]').each(function () {
        var $f = $(this);
        var v = $.trim($f.val());
        var good = !!v;
        if (good && $f.attr('type') === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        $f.toggleClass('is-invalid', !good);
        $f.closest('.mb-3, .col-md-6, .col-12').find('.yq-error').toggleClass('is-on', !good);
        if (!good) ok = false;
      });
      return ok;
    }

    function paintReview() {
      var g = function (id) { return $.trim($('#' + id).val()) || '—'; };
      $('#coReview').html(
        '<div class="row g-4">' +
          '<div class="col-md-6">' +
            '<div class="yq-tiny yq-muted mb-2">Contact</div>' +
            '<div>' + YQ.escape(g('coFirst') + ' ' + g('coLast')) + '</div>' +
            '<div class="yq-small yq-muted">' + YQ.escape(g('coEmail')) + '</div>' +
            '<div class="yq-small yq-muted">' + YQ.escape(g('coPhone')) + '</div>' +
          '</div>' +
          '<div class="col-md-6">' +
            '<div class="yq-tiny yq-muted mb-2">Delivery</div>' +
            '<div>' + YQ.escape(g('coAddress')) + '</div>' +
            '<div class="yq-small yq-muted">Singapore ' + YQ.escape(g('coPostal')) + '</div>' +
            '<div class="yq-small yq-muted">' + YQ.escape($('#coDate').val() || 'Next available date') + '</div>' +
          '</div>' +
          '<div class="col-12">' +
            '<div class="yq-tiny yq-muted mb-2">Payment</div>' +
            '<div>' + YQ.icon('card', 15) + ' Card ending ' + YQ.escape(($.trim($('#coCard').val()) || '0000').slice(-4)) + '</div>' +
          '</div>' +
        '</div>'
      );
    }

    $(document).on('click', '[data-co-next]', function () {
      var n = parseInt($(this).data('co-next'), 10);
      if (!validate(current)) { YQ.toast('Please complete the required fields'); return; }
      if (n === 4) paintReview();
      show(n);
    });
    $(document).on('click', '[data-co-back]', function () { show(parseInt($(this).data('co-back'), 10)); });
    $(document).on('click', '#coSteps .yq-step.is-done', function () { show(parseInt($(this).data('step-idx'), 10)); });

    $(document).on('click', '#coPlaceOrder', function () {
      var num = 'GH' + Date.now().toString().slice(-8);
      YQ.cart.clear();
      $('#coMain').html(
        '<div class="yq-panel text-center py-5">' +
          '<div class="yq-empty__icon" style="background:var(--yq-gold-soft);color:var(--yq-gold-dark)">' + YQ.icon('check', 28) + '</div>' +
          '<h2 class="yq-h2 mt-3 mb-2">Thank you for your order</h2>' +
          '<p class="yq-muted mb-1">Order <b style="color:var(--yq-ink)">' + num + '</b> is confirmed.</p>' +
          '<p class="yq-muted mb-4">A receipt has been sent to your email.</p>' +
          '<a class="yq-btn" href="index.html">Back to the shop ' + YQ.icon('arrow', 16) + '</a>' +
        '</div>'
      );
      $('#coAside').fadeOut(200);
      $('#coSteps').fadeOut(200);
      $('html,body').animate({ scrollTop: 0 }, 350);
    });

    /* Card number formatting */
    $(document).on('input', '#coCard', function () {
      var v = this.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      this.value = v;
    });
    $(document).on('input', '#coExpiry', function () {
      var v = this.value.replace(/\D/g, '').slice(0, 4);
      this.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
    });

    /* Shipping method */
    $(document).on('click', '.co-ship', function () {
      $('.co-ship').removeClass('is-active');
      $(this).addClass('is-active');
    });

    $(document).on('yq:cart-changed', paintSummary);

    if (!YQ.cart.items.length) {
      $('#coMain').html(
        '<div class="yq-panel yq-empty">' +
          '<div class="yq-empty__icon">' + YQ.icon('bag', 26) + '</div>' +
          '<h3 class="yq-h3 mb-2">Your cart is empty</h3>' +
          '<p class="yq-muted mb-4">Add something lovely before checking out.</p>' +
          '<a class="yq-btn" href="shop.html">Browse the shop ' + YQ.icon('arrow', 16) + '</a>' +
        '</div>'
      );
      $('#coAside, #coSteps').hide();
      return;
    }

    paintSteps();
    paintSummary();
    show(1);
  };

  /* ======================================================================
     9. Personalise (eCard)
     ====================================================================== */
  YQ.initPersonalise = function () {
    var exp = YQ.experience(YQ.param('exp')) || YQ.experiences[0];
    var design = YQ.cardDesigns[0];
    var delivery = 'ecard';

    /* Selected experience summary */
    $('#peExp').html(
      '<div class="d-flex gap-3 align-items-center">' +
        '<div class="yq-media" style="width:66px;height:66px;border-radius:10px;flex:none">' +
          YQ.mediaInner(exp) + '</div>' +
        '<div>' +
          '<div class="yq-tiny yq-muted">Selected experience</div>' +
          '<div class="yq-serif" style="font-size:1.1rem;color:var(--yq-ink)">' + YQ.escape(exp.name) + '</div>' +
          '<div class="yq-small yq-muted">' + exp.duration + ' · ' + exp.place + '</div>' +
        '</div>' +
        '<div class="ms-auto yq-serif" style="font-size:1.1rem;color:var(--yq-ink)">' + YQ.money0(exp.price) + '</div>' +
      '</div>'
    );

    /* Card designs */
    $('#peDesigns').html(YQ.cardDesigns.map(function (d, i) {
      return '<div class="col-6">' +
               '<button class="yq-cardpick' + (i === 0 ? ' is-active' : '') + '" type="button" data-design="' + d.id + '">' +
                 '<span class="yq-cardpick__art ' + d.art + '">' + d.glyph + '</span>' +
                 '<span class="yq-cardpick__name">' + d.name + '</span>' +
               '</button>' +
             '</div>';
    }).join(''));

    function paintPreview() {
      var to  = $.trim($('#peTo').val());
      var msg = $.trim($('#peMsg').val());
      var frm = $.trim($('#peFrom').val());

      $('#peCard').attr('class', 'yq-ecard ' + design.theme);
      $('#peCardTo').text(to ? 'For ' + to : '').toggle(!!to);
      $('#peCardMsg').text(msg ? '“' + msg + '”' : '“Your message will appear here.”');
      $('#peCardFrom').text(frm ? '— ' + frm : '').toggle(!!frm);

      var fee = delivery === 'physical' ? C.physicalCardFee : 0;
      $('#peTotal').text(YQ.money(exp.price + fee));
      $('#peFeeRow').toggle(fee > 0);
      $('#peDeliveryNote').text(delivery === 'physical'
        ? 'Physical card will be posted to the recipient in 2–3 business days.'
        : 'eCard will be sent to recipient’s email upon order confirmation.');
    }

    $(document).on('click', '#peDesigns .yq-cardpick', function () {
      $('#peDesigns .yq-cardpick').removeClass('is-active');
      $(this).addClass('is-active');
      var dId = $(this).attr('data-design');
      design = YQ.cardDesigns.filter(function (d) { return d.id === dId; })[0] || design;
      paintPreview();
    });

    $(document).on('click', '.pe-delivery', function () {
      $('.pe-delivery').removeClass('is-active');
      $(this).addClass('is-active');
      delivery = $(this).attr('data-delivery');
      paintPreview();
    });

    $(document).on('input', '#peTo, #peFrom', paintPreview);
    $(document).on('input', '#peMsg', function () {
      var len = this.value.length;
      $('#peCounter').text(len + ' / 200 characters');
      paintPreview();
    });

    function addToCart(personalised) {
      var fee = (personalised && delivery === 'physical') ? C.physicalCardFee : 0;
      YQ.cart.add(
        { id: exp.id, name: exp.name, tone: exp.tone, price: exp.price, catLabel: 'Experience' },
        { id: (personalised ? design.id + '-' + delivery : 'plain'), label: exp.duration + ' · ' + exp.place, price: exp.price },
        1,
        personalised ? {
          addonFee: fee,
          addonLabel: design.name + ' ' + (delivery === 'physical' ? 'physical card' : 'eCard'),
          giftTo: $.trim($('#peTo').val()),
          giftFrom: $.trim($('#peFrom').val()),
          giftMsg: $.trim($('#peMsg').val())
        } : {}
      );
    }

    $(document).on('click', '#peContinue', function () {
      addToCart(true);
      YQ.toast('Gift personalised and added to cart', 'Review & pay', 'checkout.html');
      setTimeout(function () { window.location.href = 'checkout.html'; }, 700);
    });
    $(document).on('click', '#peSkip', function (e) {
      e.preventDefault();
      addToCart(false);
      window.location.href = 'checkout.html';
    });

    paintPreview();
    YQ.initReveal();
  };

  /* ======================================================================
     10. My Orders (2 tab: Completed orders / Pending payment)
     ====================================================================== */
  YQ.initOrders = function () {
    var TABS = [
      { id: 'completed', label: 'Completed orders' },
      { id: 'pending',   label: 'Pending payment'  }
    ];

    var current = YQ.param('tab');
    if (!TABS.filter(function (t) { return t.id === current; }).length) current = 'completed';

    var open = {};   // id đơn -> đang mở rộng?
    var seen = {};   // tab -> đã vào lần nào chưa (để chỉ tự mở đơn mới nhất 1 lần)

    /* --- tiền: mockup in số trần (88.00), tổng mới kèm mã tiền tệ --- */
    function amt(n) {
      return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /** Ghép 1 dòng đơn với sản phẩm thật; trả null nếu id không còn trong catalogue. */
    function line(row) {
      var p = YQ.product(row.id);
      if (!p) return null;
      var opt = (p.options || []).filter(function (o) { return o.id === row.optionId; })[0];
      var unit = opt && opt.price != null ? opt.price : p.price;
      var qty = row.qty || 1;
      return {
        product: p, option: opt || null, qty: qty,
        unit: unit, sum: unit * qty,
        name: p.name + (opt && opt.label ? ' (' + opt.label + ')' : '')
      };
    }
    function linesOf(order) {
      return (order.items || []).map(line).filter(Boolean);
    }
    function totalOf(lines) {
      return lines.reduce(function (s, l) { return s + l.sum; }, 0);
    }

    function ordersOf(tab) {
      return (YQ.orders || []).filter(function (o) { return o.status === tab; })
        .slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    }

    /* --- markup --- */
    function tabsHtml() {
      return TABS.map(function (t) {
        var n = ordersOf(t.id).length;
        return '<button class="yq-ord__tab' + (t.id === current ? ' is-active' : '') + '" type="button" ' +
                 'data-ord-tab="' + t.id + '" aria-pressed="' + (t.id === current) + '">' +
                 '<span>' + t.label + '</span><em>' + n + '</em>' +
               '</button>';
      }).join('');
    }

    function fullLines(lines) {
      return lines.map(function (l) {
        return '<div class="yq-ord__line">' +
                 '<div class="yq-ord__media yq-media">' + YQ.mediaInner(l.product) + '</div>' +
                 '<div class="yq-ord__info">' +
                   '<div class="yq-ord__name">' + YQ.escape(l.name) + '</div>' +
                   '<div class="yq-ord__qty">Quantity : <em>' + l.qty + '</em></div>' +
                 '</div>' +
                 '<div class="yq-ord__price">' + amt(l.sum) + '</div>' +
               '</div>';
      }).join('');
    }

    function briefLines(lines) {
      return lines.map(function (l) {
        return '<div class="yq-ord__brief">' +
                 '<span class="yq-ord__x">' + l.qty + 'x</span>' +
                 '<span class="yq-ord__briefname">' + YQ.escape(l.name) + '</span>' +
                 '<span class="yq-ord__price">' + amt(l.sum) + '</span>' +
               '</div>';
      }).join('');
    }

    function cardHtml(order) {
      var lines = linesOf(order);
      var isOpen = !!open[order.id];
      var pending = order.status === 'pending';

      var foot = pending
        ? '<a class="yq-btn yq-btn--gold yq-ord__action" href="checkout.html">Pay now ' + YQ.icon('arrow', 15) + '</a>'
        : '<button class="yq-btn yq-btn--gold yq-ord__action" type="button" data-ord-reorder data-yq-add>ReOrder</button>';

      return '<article class="yq-ord__card' + (isOpen ? ' is-open' : '') + '" data-ord-id="' + order.id + '">' +
               '<button class="yq-ord__head" type="button" data-ord-toggle ' +
                 'aria-expanded="' + isOpen + '" aria-controls="yqOrdBody' + order.id + '">' +
                 '<span class="yq-ord__no">#' + YQ.escape(order.id) + '</span>' +
                 (pending ? '<span class="yq-ord__flag">Awaiting payment</span>' : '') +
                 '<span class="yq-ord__time">Order Time: ' + YQ.dateLabel(order.date) + '</span>' +
                 '<span class="yq-ord__chev" aria-hidden="true">' + YQ.icon('chevright', 18) + '</span>' +
               '</button>' +
               '<div class="yq-ord__body" id="yqOrdBody' + order.id + '">' +
                 (isOpen
                   ? fullLines(lines) +
                     '<div class="yq-ord__total">Total: ' + amt(totalOf(lines)) + ' ' + C.currencyCode + '</div>' +
                     '<div class="yq-ord__foot">' + foot + '</div>'
                   : briefLines(lines)) +
               '</div>' +
             '</article>';
    }

    function render() {
      $('#ordTabs').html(tabsHtml());

      var list = ordersOf(current);

      /* Lần đầu vào tab: mở sẵn đơn mới nhất cho giống bản thiết kế.
         Vào lại thì tôn trọng trạng thái người dùng đã bấm (kể cả đóng hết). */
      if (!seen[current]) {
        seen[current] = true;
        if (list.length) open[list[0].id] = true;
      }

      if (!list.length) {
        $('#ordList').html(YQ.localise(
          '<div class="yq-panel yq-empty">' +
            '<div class="yq-empty__icon">' + YQ.icon('box', 26) + '</div>' +
            '<h3 class="yq-h3 mb-2">No ' + (current === 'pending' ? 'pending payments' : 'completed orders') + '</h3>' +
            '<p class="yq-muted mb-4">' +
              (current === 'pending'
                ? 'Everything is paid for — nothing waiting here.'
                : 'Your completed orders will be listed here.') + '</p>' +
            '<a class="yq-btn" href="shop.html">Browse the shop ' + YQ.icon('arrow', 16) + '</a>' +
          '</div>'
        ));
        return;
      }

      $('#ordList').html(YQ.localise(list.map(cardHtml).join('')));
    }

    /* --- sự kiện --- */
    $(document).on('click', '#ordTabs [data-ord-tab]', function () {
      var t = $(this).attr('data-ord-tab');
      if (t === current) return;
      current = t;
      render();
    });

    $(document).on('click', '#ordList [data-ord-toggle]', function () {
      var id = $(this).closest('.yq-ord__card').attr('data-ord-id');
      open[id] = !open[id];
      render();
    });

    $(document).on('click', '#ordList [data-ord-reorder]', function () {
      var id = $(this).closest('.yq-ord__card').attr('data-ord-id');
      var order = (YQ.orders || []).filter(function (o) { return o.id === id; })[0];
      if (!order) return;

      var lines = linesOf(order);
      if (!lines.length) { YQ.toast('These items are no longer available'); return; }

      $.each(lines, function (_, l) { YQ.cart.add(l.product, l.option, l.qty); });
      YQ.toast(lines.length + (lines.length === 1 ? ' item' : ' items') + ' added to your cart',
               'View cart', 'cart.html');
    });

    render();
  };

  /* ======================================================================
     11. Member profile (member/profile.html)
     ====================================================================== */
  YQ.initProfile = function () {
    /* Markup nằm sẵn trong member/profile.html (backend đổ dữ liệu vào HTML).
       Controller này KHÔNG dựng HTML — chỉ bật/tắt chế độ sửa, kiểm tra ô nhập
       và chép giá trị vừa nhập ngược lại phần hiển thị sau khi "Save". Lưu thật
       là việc của backend (form method="post"); demo chặn submit và chỉ cập nhật
       trên trang. */
    var $form = $('#profForm');
    if (!$form.length) return;
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setEditing(on) {
      $form.toggleClass('is-editing', on);
      if (on) {
        var el = $form.find('.yq-prof__control')[0];
        if (el) el.focus();
      }
    }

    /** Ghi nhớ giá trị hiện tại làm "mặc định" để Cancel (form.reset) quay về đúng bản đã lưu. */
    function commitDefaults() {
      $form.find('.yq-prof__control').each(function () {
        if (this.tagName === 'SELECT') {
          $(this).find('option').each(function () { this.defaultSelected = this.selected; });
        } else {
          this.defaultValue = this.value;
        }
      });
    }

    function clearError(el) {
      $(el).removeClass('is-invalid');
      $('[data-err-for="' + el.id + '"]').removeClass('is-on').text('');
    }
    function showError(el, msg) {
      $(el).addClass('is-invalid');
      $('[data-err-for="' + el.id + '"]').text(msg).addClass('is-on');
    }

    function validate() {
      var bad = null;
      $form.find('.yq-prof__control').each(function () {
        clearError(this);
        var v = $.trim(this.value || '');
        if (this.type === 'email' && v && !RE_MAIL.test(v)) {
          showError(this, 'Enter a valid email address');
          bad = bad || this;
        }
      });
      return bad;
    }

    /** Chép giá trị ô nhập -> span hiển thị của từng hàng --edit. */
    function applyToView() {
      $form.find('.yq-prof__row--edit').each(function () {
        var $row = $(this);
        var el = $row.find('.yq-prof__control')[0];
        var $val = $row.find('.yq-prof__value');
        if (!el) return;
        var v = $.trim(el.value || '');
        if (!v) { $val.addClass('is-empty').text('Not provided'); return; }
        $val.removeClass('is-empty').text(el.type === 'date' ? YQ.dateLabel(v) : v);
      });
    }

    /** Thẻ trái: tên, chữ cái đầu, % hoàn thiện — tính lại từ DOM. */
    function refreshCard() {
      var first = $.trim($('#pf_firstName').val() || '');
      var last  = $.trim($('#pf_lastName').val() || '');
      var name  = $.trim(first + ' ' + last);
      $('#profName').text(name || 'Your profile');
      $('#profInitials').text(((first.charAt(0) || name.charAt(0) || '?') + last.charAt(0)).toUpperCase());

      var $rows = $form.find('.yq-prof__row');
      var filled = $rows.filter(function () { return !$(this).find('.yq-prof__value').hasClass('is-empty'); }).length;
      var pct = $rows.length ? Math.round(filled / $rows.length * 100) : 100;
      $('#profPct').text(pct + '%');
      $('#profBar').css('width', pct + '%');

      var missing = $form.find('.yq-prof__row--edit').filter(function () {
        return $(this).find('.yq-prof__value').hasClass('is-empty');
      }).map(function () { return $.trim($(this).find('.yq-prof__label').text()); }).get();
      $('#profHint').text(missing.length
        ? missing.length + (missing.length === 1 ? ' field left: ' : ' fields left: ') +
          missing.slice(0, 3).join(', ') + (missing.length > 3 ? '…' : '')
        : 'Everything is filled in — thank you.');
    }

    $form
      .on('click', '[data-prof-edit]', function () { setEditing(true); })
      .on('click', '[data-prof-cancel]', function () {
        $form[0].reset();
        $form.find('.yq-prof__control').each(function () { clearError(this); });
        setEditing(false);
      })
      .on('submit', function (e) {
        e.preventDefault();                        // demo: không có server nhận POST
        var bad = validate();
        if (bad) { bad.focus(); YQ.toast('Please check the highlighted field'); return; }

        applyToView();
        refreshCard();
        commitDefaults();
        /* Giữ phiên đăng nhập (avatar/lời chào ở header) khớp với hồ sơ vừa sửa. */
        if (YQ.auth && YQ.auth.isIn()) {
          YQ.auth.update({
            first: $.trim($('#pf_firstName').val() || ''),
            last:  $.trim($('#pf_lastName').val() || ''),
            email: $.trim($('#pf_email').val() || '')
          });
        }
        setEditing(false);
        YQ.toast('Profile updated');
      })
      .on('input change', '.yq-prof__control', function () { clearError(this); });

    commitDefaults();
    if (YQ.param('edit') === '1') setEditing(true);
  };

  /* ======================================================================
     12. Change password (member/password.html)
     ====================================================================== */
  YQ.initPassword = function () {
    /* 4 điều kiện; đạt bao nhiêu thì thanh sức mạnh lên bấy nhiêu. */
    var RULES = [
      { id: 'len',   label: 'At least 8 characters', test: function (v) { return v.length >= 8; } },
      { id: 'case',  label: 'Upper and lower case',  test: function (v) { return /[a-z]/.test(v) && /[A-Z]/.test(v); } },
      { id: 'digit', label: 'At least one number',   test: function (v) { return /\d/.test(v); } },
      { id: 'sym',   label: 'At least one symbol',   test: function (v) { return /[^A-Za-z0-9]/.test(v); } }
    ];
    var LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

    function passed(v) {
      return RULES.filter(function (r) { return r.test(v); });
    }

    function pwField(id, label, ac) {
      return '<div class="yq-pw__field">' +
               '<label class="yq-auth__label" for="' + id + '">' + YQ.escape(label) + '</label>' +
               '<div class="yq-auth__pw">' +
                 '<input class="yq-input form-control" type="password" id="' + id + '" autocomplete="' + ac + '">' +
                 '<button class="yq-auth__peek" type="button" data-yq-peek aria-label="Show password">' +
                   YQ.icon('eye', 17) + '</button>' +
               '</div>' +
               '<div class="yq-error" data-err-for="' + id + '"></div>' +
             '</div>';
    }

    function render() {
      var changed = YQ.profile.get('passwordChangedAt');

      $('#pwAside').html(YQ.localise(
        '<div class="yq-prof__card">' +
          '<div class="yq-pw__shield" aria-hidden="true">' + YQ.icon('lock', 30) + '</div>' +
          '<h2 class="yq-prof__name">Account security</h2>' +
          '<p class="yq-pw__lead">Pick something you do not use anywhere else. ' +
            'You stay signed in on this device after changing it.</p>' +
          '<dl class="yq-prof__facts">' +
            '<div><dt>Signed in as</dt><dd>' + YQ.escape(YQ.profile.get('email') || '—') + '</dd></div>' +
            '<div><dt>Last changed</dt><dd>' + (changed ? YQ.dateLabel(changed) : 'Never') + '</dd></div>' +
          '</dl>' +
          '<div class="yq-prof__links">' +
            '<a class="yq-link-arrow" href="member/profile.html">Back to profile ' + YQ.icon('chevright', 14) + '</a>' +
          '</div>' +
        '</div>'
      ));

      $('#pwBody').html(YQ.localise(
        '<section class="yq-prof__group">' +
          '<header class="yq-prof__grouphead">' +
            '<span class="yq-prof__groupico">' + YQ.icon('lock', 17) + '</span>' +
            '<h2 class="yq-prof__grouptitle">New password</h2>' +
          '</header>' +
          '<form class="yq-pw__form" id="pwForm" novalidate>' +
            pwField('pwCurrent', 'Current password', 'current-password') +
            pwField('pwNew', 'New password', 'new-password') +

            '<div class="yq-pw__meter" id="pwMeter" data-score="0">' +
              '<div class="yq-pw__bar"><i></i><i></i><i></i><i></i></div>' +
              '<span class="yq-pw__level" id="pwLevel">Too short</span>' +
            '</div>' +
            '<ul class="yq-pw__rules" id="pwRules">' +
              RULES.map(function (r) {
                return '<li data-rule="' + r.id + '">' +
                         '<span class="yq-pw__tick">' + YQ.icon('check', 12) + '</span>' +
                         YQ.escape(r.label) +
                       '</li>';
              }).join('') +
            '</ul>' +

            pwField('pwConfirm', 'Repeat new password', 'new-password') +
            '<button class="yq-btn yq-btn--block mt-2" type="submit">Update password</button>' +
          '</form>' +
        '</section>'
      ));
    }

    function paintStrength() {
      var v = $('#pwNew').val() || '';
      var hit = passed(v);
      var score = v ? hit.length : 0;

      $('#pwMeter').attr('data-score', score);
      $('#pwLevel').text(LEVELS[score]);
      $('#pwRules li').each(function () {
        var id = $(this).attr('data-rule');
        $(this).toggleClass('is-on', hit.filter(function (r) { return r.id === id; }).length > 0);
      });
    }

    function fail(id, msg) {
      $('#' + id).addClass('is-invalid');
      $('[data-err-for="' + id + '"]').text(msg).addClass('is-on');
      return false;
    }

    $(document)
      .on('input', '#pwNew', paintStrength)
      .on('input', '#pwForm .yq-input', function () {
        $(this).removeClass('is-invalid');
        $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
      })
      .on('submit', '#pwForm', function (e) {
        e.preventDefault();
        $('#pwForm .yq-input').removeClass('is-invalid');
        $('#pwForm .yq-error').removeClass('is-on').text('');

        var cur = $('#pwCurrent').val() || '';
        var nw  = $('#pwNew').val() || '';
        var cf  = $('#pwConfirm').val() || '';
        var ok  = true;

        if (!cur) ok = fail('pwCurrent', 'Enter your current password');
        if (!nw) ok = fail('pwNew', 'Enter a new password') && ok;
        else if (passed(nw).length < RULES.length) ok = fail('pwNew', 'Meet all four requirements below') && ok;
        else if (nw === cur) ok = fail('pwNew', 'New password must differ from the current one') && ok;
        if (cf !== nw) ok = fail('pwConfirm', 'Passwords do not match') && ok;
        if (!ok) return;

        YQ.profile.set({ passwordChangedAt: new Date().toISOString().slice(0, 10) });
        render();
        paintStrength();
        YQ.toast('Password updated');
      });

    render();
    paintStrength();
  };

  /* ======================================================================
     13. Invite friends (member/invite.html)
     ====================================================================== */
  YQ.initInvite = function () {
    var R = YQ.referral || {};
    var KEY = 'yq_invites_v1';
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var sent = [];
    try { sent = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { sent = []; }
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(sent)); } catch (e) {} }

    /* Mã giới thiệu bám theo số thẻ thành viên -> mỗi người một mã. */
    function code() {
      var no = YQ.profile.get('memberNo') || '000000';
      return (R.codePrefix || 'GH-') + no.slice(-6);
    }
    /** Link mời dạng tuyệt đối để dán đi đâu cũng chạy. */
    function link() {
      var rel = YQ.url(R.landing || 'index.html');
      return new URL(rel, window.location.href).href + '?ref=' + encodeURIComponent(code());
    }

    function channelHtml(c) {
      var glyph = YQ.brandIcon ? YQ.brandIcon(c.id, 20) : '';
      if (!glyph) glyph = YQ.icon(c.icon || 'arrow', 19);
      return '<button class="yq-inv__ch yq-inv__ch--' + c.id + '" type="button" data-inv-ch="' + c.id + '">' +
               '<span class="yq-inv__chico">' + glyph + '</span>' +
               '<span>' + YQ.escape(c.label) + '</span>' +
             '</button>';
    }

    function listHtml() {
      if (!sent.length) {
        return '<p class="yq-inv__none">No invitations sent yet. Share your link above to get started.</p>';
      }
      return '<ul class="yq-inv__list">' + sent.map(function (i, idx) {
        return '<li class="yq-inv__row">' +
                 '<span class="yq-inv__who">' + YQ.escape(i.email) + '</span>' +
                 '<span class="yq-inv__when">' + YQ.dateLabel(i.at) + '</span>' +
                 '<span class="yq-inv__state">' + YQ.escape(i.status || 'Invited') + '</span>' +
                 '<button class="yq-inv__rm" type="button" data-inv-rm="' + idx + '" ' +
                   'aria-label="Remove ' + YQ.escape(i.email) + '">' + YQ.icon('close', 14) + '</button>' +
               '</li>';
      }).join('') + '</ul>';
    }

    function render() {
      var reward = YQ.money0(R.reward || 0);

      $('#invAside').html(YQ.localise(
        '<div class="yq-prof__card">' +
          '<div class="yq-inv__gift" aria-hidden="true">' + YQ.icon('gift', 30) + '</div>' +
          '<h2 class="yq-prof__name">Give ' + reward + ', get ' + reward + '</h2>' +
          '<p class="yq-pw__lead">Your friend gets ' + reward + ' off their first order. ' +
            'When they check out, the same lands in your wallet.</p>' +
          '<dl class="yq-prof__facts">' +
            '<div><dt>Invitations sent</dt><dd>' + sent.length + '</dd></div>' +
            '<div><dt>Your code</dt><dd>' + YQ.escape(code()) + '</dd></div>' +
          '</dl>' +
          '<div class="yq-prof__links">' +
            '<a class="yq-link-arrow" href="member/profile.html">Back to profile ' + YQ.icon('chevright', 14) + '</a>' +
          '</div>' +
        '</div>'
      ));

      $('#invBody').html(YQ.localise(
        /* --- chia sẻ link --- */
        '<section class="yq-prof__group">' +
          '<header class="yq-prof__grouphead">' +
            '<span class="yq-prof__groupico">' + YQ.icon('sparkle', 17) + '</span>' +
            '<h2 class="yq-prof__grouptitle">Share your invitation</h2>' +
          '</header>' +
          '<div class="yq-inv__pad">' +
            '<div class="yq-inv__linkbox">' +
              '<input class="yq-input form-control" id="invLink" readonly value="' + YQ.escape(link()) + '" ' +
                'aria-label="Your invitation link">' +
              '<button class="yq-btn yq-btn--sm" type="button" data-inv-ch="copy">' +
                YQ.icon('copy', 15) + 'Copy</button>' +
            '</div>' +
            '<div class="yq-inv__channels">' + (R.channels || []).map(channelHtml).join('') + '</div>' +
          '</div>' +
        '</section>' +

        /* --- mời qua email --- */
        '<section class="yq-prof__group">' +
          '<header class="yq-prof__grouphead">' +
            '<span class="yq-prof__groupico">' + YQ.icon('mail', 17) + '</span>' +
            '<h2 class="yq-prof__grouptitle">Invite by email</h2>' +
          '</header>' +
          '<div class="yq-inv__pad">' +
            '<form id="invForm" novalidate>' +
              '<label class="yq-auth__label" for="invMails">Email addresses</label>' +
              '<textarea class="yq-input form-control" id="invMails" rows="3" ' +
                'placeholder="friend@example.com, another@example.com"></textarea>' +
              '<div class="yq-error" data-err-for="invMails"></div>' +
              '<p class="yq-inv__tip">Separate several addresses with a comma, a space or a new line.</p>' +
              '<button class="yq-btn yq-btn--block mt-1" type="submit">Send invitations</button>' +
            '</form>' +
          '</div>' +
        '</section>' +

        /* --- đã mời --- */
        '<section class="yq-prof__group">' +
          '<header class="yq-prof__grouphead">' +
            '<span class="yq-prof__groupico">' + YQ.icon('users', 17) + '</span>' +
            '<h2 class="yq-prof__grouptitle">Invitations sent</h2>' +
          '</header>' +
          '<div class="yq-inv__pad">' + listHtml() + '</div>' +
        '</section>'
      ));
    }

    /* --- chia sẻ --- */
    function shareUrl(c) {
      return String(c.url || '')
        .replace('{u}', encodeURIComponent(link()))
        .replace('{t}', encodeURIComponent(R.message || ''));
    }
    function mailtoUrl() {
      return 'mailto:?subject=' + encodeURIComponent('An invitation from Grand Hyatt Singapore') +
             '&body=' + encodeURIComponent((R.message || '') + '\n\n' + link());
    }
    function copyLink() {
      var el = document.getElementById('invLink');
      if (el) { el.focus(); el.select(); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link()).then(
          function () { YQ.toast('Invitation link copied'); },
          function () { YQ.toast('Press Ctrl/Cmd + C to copy the link'); }
        );
        return;
      }
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      YQ.toast(done ? 'Invitation link copied' : 'Press Ctrl/Cmd + C to copy the link');
    }

    $(document)
      .on('click', '[data-inv-ch]', function () {
        var id = $(this).attr('data-inv-ch');
        var c = (R.channels || []).filter(function (x) { return x.id === id; })[0] ||
                { id: id, kind: id === 'copy' ? 'copy' : 'share' };

        if (c.kind === 'copy') { copyLink(); return; }
        if (c.kind === 'mail') { window.location.href = mailtoUrl(); return; }

        window.open(shareUrl(c), '_blank', 'noopener,width=640,height=560');
      })

      .on('submit', '#invForm', function (e) {
        e.preventDefault();
        var $ta = $('#invMails');
        $ta.removeClass('is-invalid');
        $('[data-err-for="invMails"]').removeClass('is-on').text('');

        var raw = String($ta.val() || '').split(/[\s,;]+/).filter(Boolean);
        if (!raw.length) {
          $ta.addClass('is-invalid');
          $('[data-err-for="invMails"]').text('Enter at least one email address').addClass('is-on');
          return;
        }
        var bad = raw.filter(function (m) { return !RE_MAIL.test(m); });
        if (bad.length) {
          $ta.addClass('is-invalid');
          $('[data-err-for="invMails"]').text('Not a valid address: ' + bad[0]).addClass('is-on');
          return;
        }

        var today = new Date().toISOString().slice(0, 10);
        var already = sent.map(function (i) { return i.email.toLowerCase(); });
        var fresh = [];
        $.each(raw, function (_, m) {
          if (already.indexOf(m.toLowerCase()) > -1) return;   // đã mời rồi thì bỏ qua
          already.push(m.toLowerCase());
          fresh.push({ email: m, at: today, status: 'Invited' });
        });

        if (!fresh.length) { YQ.toast('Those friends were already invited'); return; }

        sent = fresh.concat(sent);
        persist();
        render();
        YQ.toast(fresh.length + (fresh.length === 1 ? ' invitation sent' : ' invitations sent'));
      })

      .on('click', '[data-inv-rm]', function () {
        var i = parseInt($(this).attr('data-inv-rm'), 10);
        if (isNaN(i)) return;
        sent.splice(i, 1);
        persist();
        render();
      });

    render();
  };

})(jQuery);
