/* ==========================================================================
   GH eStore — Components + page controllers
   ========================================================================== */
(function ($) {
  'use strict';

  var C = GH.config;

  /* ======================================================================
     1. Components
     ====================================================================== */
  GH.productCard = function (p, opts) {
    opts = opts || {};
    var badge = p.badge
      ? '<span class="gh-badge ' + (p.badge === 'New' ? 'gh-badge--gold' : (p.badge === 'Seasonal' ? 'gh-badge--light' : '')) + '">' + p.badge + '</span>'
      : '';
    var meta = p.meta ? '<span class="gh-card__cat">' + GH.icon('gift', 13) + ' ' + p.meta + '</span>' : '';

    return '' +
      '<article class="gh-card gh-reveal">' +
        '<div class="gh-card__mediawrap">' +
          badge +
          '<a class="gh-card__media gh-media gh-zoom d-block" href="product.html?id=' + p.id + '" aria-label="' + GH.escape(p.name) + '">' +
            GH.mediaInner(p) +
          '</a>' +
          (opts.quickAdd === false ? '' :
            '<div class="gh-quickadd"><button class="gh-btn gh-btn--sm gh-btn--block" type="button" data-quickadd="' + p.id + '">' +
              GH.icon('bag', 15) + ' Quick add</button></div>') +
        '</div>' +
        '<div class="gh-card__body">' +
          '<div class="gh-card__cat">' + (p.meta ? p.meta + ' · ' : '') + p.catLabel + '</div>' +
          '<h3 class="gh-card__title"><a href="product.html?id=' + p.id + '">' + GH.escape(p.name) + '</a></h3>' +
          '<p class="gh-card__desc">' + GH.escape(p.short || p.desc) + '</p>' +
          '<div class="gh-card__foot">' +
            '<span class="gh-card__price"><small>From</small>' + GH.money0(p.price) + '</span>' +
            '<a class="gh-link-arrow" href="product.html?id=' + p.id + '">View ' + GH.icon('arrow', 14) + '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  };

  GH.experienceCard = function (e) {
    var badge = e.badge ? '<span class="gh-badge">' + e.badge + '</span>' : '';
    return '' +
      '<article class="gh-card gh-reveal">' +
        '<div class="gh-card__mediawrap">' +
          badge +
          '<span class="gh-badge gh-badge--rate">' + GH.icon('star', 12) + e.rating.toFixed(1) + '</span>' +
          '<a class="gh-card__media gh-media gh-zoom d-block" href="personalise.html?exp=' + e.id + '">' +
            GH.mediaInner(e) +
          '</a>' +
        '</div>' +
        '<div class="gh-card__body">' +
          '<h3 class="gh-card__title"><a href="personalise.html?exp=' + e.id + '">' + GH.escape(e.name) + '</a></h3>' +
          '<p class="gh-card__desc">' + GH.escape(e.desc) + '</p>' +
          '<div class="gh-exp__meta">' +
            '<span>' + GH.icon('clock', 13) + e.duration + '</span>' +
            '<span>' + GH.icon('pin', 13) + e.place + '</span>' +
            '<span>' + GH.icon('users', 13) + e.reviews + ' reviews</span>' +
          '</div>' +
          '<div class="gh-card__foot">' +
            '<span class="gh-card__price">' + GH.money0(e.price) + '</span>' +
            '<a class="gh-link-arrow" href="personalise.html?exp=' + e.id + '">Book now ' + GH.icon('arrow', 14) + '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  };

  GH.occasionTile = function (o) {
    return '' +
      '<a class="gh-tile gh-zoom gh-reveal" href="' + o.href + '">' +
        '<div class="gh-media">' + GH.mediaInner(o) + '</div>' +
        '<span class="gh-tile__scrim"></span>' +
        '<span class="gh-tile__label">' +
          '<span>' + o.name + '<small>' + o.sub + '</small></span>' +
          '<span class="gh-tile__go">' + GH.icon('arrow', 18) + '</span>' +
        '</span>' +
      '</a>';
  };

  /** Order summary block (dùng ở cart + checkout) */
  GH.summaryHtml = function (opts) {
    opts = opts || {};
    var cart = GH.cart;
    var sub = cart.subtotal(), ship = cart.shipping(), tax = cart.tax(), total = cart.total();
    var toFree = cart.toFree();
    var pct = Math.min(100, (sub / C.freeShippingThreshold) * 100);

    var note = '';
    if (sub > 0 && toFree > 0) {
      note = '<div class="gh-ship-note">' + GH.icon('truck', 16) +
             '<div class="w-100">Add ' + GH.money(toFree) + ' more for free shipping' +
               '<div class="gh-ship-bar"><i style="width:' + pct + '%"></i></div>' +
             '</div></div>';
    } else if (sub > 0) {
      note = '<div class="gh-ship-note">' + GH.icon('check', 16) + '<div>You have unlocked free shipping.</div></div>';
    }

    var lines = '';
    if (opts.showItems) {
      $.each(cart.items, function (_, i) {
        lines += '<div class="d-flex gap-3 align-items-center mb-3">' +
                   '<div class="gh-media" style="width:52px;height:52px;border-radius:8px;flex:none">' +
                     GH.mediaInner(i) + '</div>' +
                   '<div class="flex-grow-1 min-width-0">' +
                     '<div class="gh-small text-truncate" style="color:var(--gh-ink)">' + GH.escape(i.name) + '</div>' +
                     '<div class="gh-tiny gh-muted">Qty: ' + i.qty + '</div>' +
                   '</div>' +
                   '<div class="gh-sum__val gh-small">' + GH.money((i.price + (i.addonFee || 0)) * i.qty) + '</div>' +
                 '</div>';
      });
      if (lines) lines += '<hr style="border-color:var(--gh-line-soft);opacity:1">';
    }

    return '' +
      '<h3 class="gh-serif mb-3" style="font-size:1.3rem">Order summary</h3>' +
      lines +
      '<div class="gh-sum"><span>Subtotal</span><span class="gh-sum__val">' + GH.money(sub) + '</span></div>' +
      '<div class="gh-sum"><span>Shipping</span><span class="gh-sum__val">' + (ship === 0 ? 'Free' : GH.money(ship)) + '</span></div>' +
      '<div class="gh-sum"><span>Tax (9%)</span><span class="gh-sum__val">' + GH.money(tax) + '</span></div>' +
      '<div class="gh-sum gh-sum--total"><span>Total</span><span class="gh-sum__val">' + GH.money(total) + '</span></div>' +
      (opts.cta ? '<a class="gh-btn gh-btn--block mt-4" href="' + opts.ctaHref + '">' + opts.cta + ' ' + GH.icon('arrow', 16) + '</a>' : '') +
      note;
  };

  /* ======================================================================
     2. Home
     ====================================================================== */
  GH.initHome = function () {
    var featured = GH.products.filter(function (p) { return p.featured; }).slice(0, 4);
    var hampers  = GH.products.filter(function (p) { return p.cat === 'celebration' || p.cat === 'beverages'; }).slice(0, 4);

    $('#homeFeatured').html(featured.map(function (p) {
      return '<div class="col-6 col-lg-3">' + GH.productCard(p) + '</div>';
    }).join(''));

    $('#homeHampers').html(hampers.map(function (p) {
      return '<div class="col-6 col-lg-3">' + GH.productCard(p) + '</div>';
    }).join(''));

    $('#homeOccasions').html(GH.occasions.map(function (o) {
      return '<div class="col-6 col-lg-3">' + GH.occasionTile(o) + '</div>';
    }).join(''));

    $('#homeExperiences').html(GH.experiences.slice(0, 3).map(function (e) {
      return '<div class="col-md-6 col-lg-4">' + GH.experienceCard(e) + '</div>';
    }).join(''));

    GH.stagger('#homeFeatured .gh-reveal');
    GH.stagger('#homeHampers .gh-reveal');
    GH.stagger('#homeOccasions .gh-reveal');
    GH.stagger('#homeExperiences .gh-reveal');
    GH.initReveal();
  };

  /* ======================================================================
     3. Shop (filters + sort + search)
     ====================================================================== */
  GH.initShop = function () {
    var state = {
      cat: GH.param('cat') || 'all',
      season: GH.param('season') || null,
      q: GH.param('q') || '',
      sort: 'featured'
    };

    /* Chips */
    $('#shopCats').html(GH.categories.map(function (c) {
      return '<button class="gh-chip" type="button" data-cat="' + c.id + '">' + c.label + '</button>';
    }).join(''));

    $('#shopSeasons').html(GH.seasons.map(function (s) {
      return '<button class="gh-chip gh-chip--gold" type="button" data-season="' + s.id + '">' + s.label + '</button>';
    }).join(''));

    function filtered() {
      var q = state.q.toLowerCase();
      var list = GH.products.filter(function (p) {
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

      $('#shopCats .gh-chip').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-cat') === state.cat);
      });
      $('#shopSeasons .gh-chip').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-season') === state.season);
      });
      $('#shopCount').text(list.length + ' product' + (list.length === 1 ? '' : 's'));
      $('#shopQuery').toggle(!!state.q).find('b').text(state.q);

      if (!list.length) {
        $('#shopGrid').html(
          '<div class="col-12"><div class="gh-empty">' +
            '<div class="gh-empty__icon">' + GH.icon('search', 26) + '</div>' +
            '<h3 class="gh-h3 mb-2">No products found</h3>' +
            '<p class="gh-muted mb-4">Try another category or clear your filters.</p>' +
            '<button class="gh-btn gh-btn--ghost" type="button" id="shopReset">Clear filters</button>' +
          '</div></div>'
        );
        return;
      }

      $('#shopGrid').html(list.map(function (p) {
        return '<div class="col-6 col-lg-3">' + GH.productCard(p) + '</div>';
      }).join(''));

      GH.stagger('#shopGrid .gh-reveal', 45);
      GH.initReveal();
    }

    /* Events */
    $(document).on('click', '#shopCats .gh-chip', function () {
      state.cat = $(this).attr('data-cat'); render();
    });
    $(document).on('click', '#shopSeasons .gh-chip', function () {
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
  GH.initProduct = function () {
    var id = GH.param('id') || GH.products[0].id;
    var p = GH.product(id) || GH.products[0];
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
      var pool = GH.products.filter(function (x) { return x.id !== p.id && x.img && x.cat === p.cat; })
        .concat(GH.products.filter(function (x) { return x.id !== p.id && x.img && x.cat !== p.cat; }));
      for (var i = 0; i < pool.length && shots.length < 4; i++) {
        shots.push({ img: pool[i].img, name: p.name, tone: pool[i].tone });
      }
      while (shots.length < 4) shots.push({ tone: [3, 6, 8][shots.length % 3], name: p.name });
    }
    $('#pdpMain').html(GH.mediaInner(p, { eager: true }));
    $('#pdpThumbs').html(shots.map(function (sh, i) {
      return '<button class="gh-pdp__thumb' + (i === 0 ? ' is-active' : '') + '" type="button" data-shot="' + i + '">' +
               '<span class="gh-media">' + GH.mediaInner(sh) + '</span></button>';
    }).join(''));

    /* Info */
    $('#pdpCat').text(p.catLabel);
    $('#pdpTitle').text(p.name);
    $('#pdpDesc').text(p.desc);
    $('#pdpOptionLabel').text(p.optionLabel || 'Select option');
    $('#pdpOptions').html(p.options.map(function (o, i) {
      return '<button class="gh-option' + (i === 0 ? ' is-active' : '') + '" type="button" data-opt="' + o.id + '">' + o.label + '</button>';
    }).join(''));

    function paint() {
      $('#pdpPrice').html(GH.money0(sel.price) + '<small>per ' + (sel.label.split(' (')[0]) + '</small>');
      $('#pdpAddLabel').text('Add to cart — ' + GH.money0(sel.price * qty));
    }
    paint();

    /* Related */
    var related = GH.products.filter(function (x) { return x.id !== p.id && x.cat === p.cat; });
    if (related.length < 4) {
      related = related.concat(GH.products.filter(function (x) {
        return x.id !== p.id && related.indexOf(x) === -1;
      }));
    }
    $('#pdpRelated').html(related.slice(0, 4).map(function (r) {
      return '<div class="col-6 col-lg-3">' + GH.productCard(r) + '</div>';
    }).join(''));

    /* Events */
    $(document).on('click', '#pdpThumbs .gh-pdp__thumb', function () {
      $('#pdpThumbs .gh-pdp__thumb').removeClass('is-active');
      $(this).addClass('is-active');
      $('#pdpMain').html(GH.mediaInner(shots[parseInt($(this).attr('data-shot'), 10)], { eager: true }));
    });

    $(document).on('click', '#pdpOptions .gh-option', function () {
      $('#pdpOptions .gh-option').removeClass('is-active');
      $(this).addClass('is-active');
      var optId = $(this).attr('data-opt');           // attr(): tránh jQuery ép '12' -> 12
      sel = p.options.filter(function (o) { return String(o.id) === optId; })[0] || sel;
      paint();
    });

    $('#pdpQty').on('gh:qty', function (e, n) { qty = n; paint(); });

    $(document).on('click', '#pdpAdd', function () {
      GH.cart.add(p, sel, qty);
      GH.toast(p.name + ' added to cart', 'View cart', 'cart.html');
    });

    GH.stagger('#pdpRelated .gh-reveal');
    GH.initReveal();
  };

  /* ======================================================================
     5. Experiences
     ====================================================================== */
  GH.initExperiences = function () {
    $('#expGrid').html(GH.experiences.map(function (e) {
      return '<div class="col-md-6 col-lg-4">' + GH.experienceCard(e) + '</div>';
    }).join(''));
    GH.stagger('#expGrid .gh-reveal');
    GH.initReveal();
  };

  /* ======================================================================
     6. Celebrations
     ====================================================================== */
  GH.initCelebrations = function () {
    $('#celOccasions').html(GH.occasions.map(function (o) {
      return '<div class="col-6 col-lg-3">' + GH.occasionTile(o) + '</div>';
    }).join(''));

    var favs = GH.products.filter(function (p) {
      return p.cat === 'celebration' || p.cat === 'beverages' || p.badge === 'Bestseller';
    }).slice(0, 4);

    $('#celFavourites').html(favs.map(function (p) {
      return '<div class="col-6 col-lg-3">' + GH.productCard(p) + '</div>';
    }).join(''));

    var seasonal = GH.products.filter(function (p) { return (p.seasons || []).length; }).slice(0, 4);
    $('#celSeasonal').html(seasonal.map(function (p) {
      return '<div class="col-6 col-lg-3">' + GH.productCard(p) + '</div>';
    }).join(''));

    GH.stagger('#celOccasions .gh-reveal');
    GH.stagger('#celFavourites .gh-reveal');
    GH.stagger('#celSeasonal .gh-reveal');
    GH.initReveal();
  };

  /* ======================================================================
     7. Cart
     ====================================================================== */
  GH.initCart = function () {
    function render() {
      var items = GH.cart.items;

      if (!items.length) {
        $('#cartWrap').html(
          '<div class="col-12"><div class="gh-panel gh-empty">' +
            '<div class="gh-empty__icon">' + GH.icon('bag', 26) + '</div>' +
            '<h3 class="gh-h3 mb-2">Your cart is empty</h3>' +
            '<p class="gh-muted mb-4">Explore our cakes, hampers, and experiences.</p>' +
            '<a class="gh-btn" href="shop.html">Continue shopping ' + GH.icon('arrow', 16) + '</a>' +
          '</div></div>'
        );
        return;
      }

      var lines = items.map(function (i) {
        return '' +
          '<div class="gh-line" data-key="' + i.key + '">' +
            '<div class="gh-line__media gh-media">' + GH.mediaInner(i) + '</div>' +
            '<div class="flex-grow-1">' +
              '<div class="gh-line__title">' + GH.escape(i.name) + '</div>' +
              '<div class="gh-line__opt">' + GH.escape(i.optionLabel || '') +
                (i.addonLabel ? ' · ' + GH.escape(i.addonLabel) : '') + '</div>' +
              '<div class="gh-qty mt-3" data-qty data-min="1">' +
                '<button class="gh-qty__btn" type="button" data-step="-1" aria-label="Decrease">' + GH.icon('minus', 15) + '</button>' +
                '<span class="gh-qty__val" data-qty-val>' + i.qty + '</span>' +
                '<button class="gh-qty__btn" type="button" data-step="1" aria-label="Increase">' + GH.icon('plus', 15) + '</button>' +
              '</div>' +
            '</div>' +
            '<div class="text-end">' +
              '<div class="gh-line__price">' + GH.money((i.price + (i.addonFee || 0)) * i.qty) + '</div>' +
            '</div>' +
            '<button class="gh-line__remove" type="button" data-remove aria-label="Remove">' + GH.icon('close', 16) + '</button>' +
          '</div>';
      }).join('');

      $('#cartWrap').html(
        '<div class="col-lg-7 col-xl-8 mb-4 mb-lg-0">' +
          '<div class="gh-panel gh-panel--flush">' + lines + '</div>' +
          '<div class="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">' +
            '<a class="gh-link-arrow" href="shop.html">' + GH.icon('chevleft', 14) + ' Continue shopping</a>' +
            '<button class="gh-btn gh-btn--ghost gh-btn--sm" type="button" id="cartClear">Clear cart</button>' +
          '</div>' +
        '</div>' +
        '<div class="col-lg-5 col-xl-4">' +
          '<div class="gh-panel gh-sticky">' +
            GH.summaryHtml({ cta: 'Proceed to checkout', ctaHref: 'checkout.html' }) +
            '<div class="gh-trust mt-3 pt-3">' +
              '<span>' + GH.icon('lock', 15) + 'Secure payment</span>' +
              '<span>' + GH.icon('truck', 15) + 'Same-day delivery</span>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    $(document).on('gh:cart-changed', render);

    $(document).on('gh:qty', '#cartWrap [data-qty]', function (e, n) {
      GH.cart.setQty($(this).closest('.gh-line').data('key'), n);
    });
    $(document).on('click', '#cartWrap [data-remove]', function () {
      GH.cart.remove($(this).closest('.gh-line').data('key'));
      GH.toast('Item removed');
    });
    $(document).on('click', '#cartClear', function () {
      GH.cart.clear();
      GH.toast('Cart cleared');
    });

    render();
  };

  /* ======================================================================
     8. Checkout (4 bước)
     ====================================================================== */
  GH.initCheckout = function () {
    var steps = ['Information', 'Shipping', 'Payment', 'Review'];
    var current = 1;

    function paintSteps() {
      $('#coSteps').html(steps.map(function (s, i) {
        var n = i + 1;
        var cls = n === current ? 'is-active' : (n < current ? 'is-done' : '');
        var num = n < current ? GH.icon('check', 12) : n;
        return (i ? '<span class="gh-step__bar"></span>' : '') +
          '<span class="gh-step ' + cls + '" data-step-idx="' + n + '">' +
            '<span class="gh-step__num">' + num + '</span>' + s +
          '</span>';
      }).join(''));
    }

    function paintSummary() {
      $('#coSummary').html(GH.summaryHtml({ showItems: true }));
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
        $f.closest('.mb-3, .col-md-6, .col-12').find('.gh-error').toggleClass('is-on', !good);
        if (!good) ok = false;
      });
      return ok;
    }

    function paintReview() {
      var g = function (id) { return $.trim($('#' + id).val()) || '—'; };
      $('#coReview').html(
        '<div class="row g-4">' +
          '<div class="col-md-6">' +
            '<div class="gh-tiny gh-muted mb-2">Contact</div>' +
            '<div>' + GH.escape(g('coFirst') + ' ' + g('coLast')) + '</div>' +
            '<div class="gh-small gh-muted">' + GH.escape(g('coEmail')) + '</div>' +
            '<div class="gh-small gh-muted">' + GH.escape(g('coPhone')) + '</div>' +
          '</div>' +
          '<div class="col-md-6">' +
            '<div class="gh-tiny gh-muted mb-2">Delivery</div>' +
            '<div>' + GH.escape(g('coAddress')) + '</div>' +
            '<div class="gh-small gh-muted">Singapore ' + GH.escape(g('coPostal')) + '</div>' +
            '<div class="gh-small gh-muted">' + GH.escape($('#coDate').val() || 'Next available date') + '</div>' +
          '</div>' +
          '<div class="col-12">' +
            '<div class="gh-tiny gh-muted mb-2">Payment</div>' +
            '<div>' + GH.icon('card', 15) + ' Card ending ' + GH.escape(($.trim($('#coCard').val()) || '0000').slice(-4)) + '</div>' +
          '</div>' +
        '</div>'
      );
    }

    $(document).on('click', '[data-co-next]', function () {
      var n = parseInt($(this).data('co-next'), 10);
      if (!validate(current)) { GH.toast('Please complete the required fields'); return; }
      if (n === 4) paintReview();
      show(n);
    });
    $(document).on('click', '[data-co-back]', function () { show(parseInt($(this).data('co-back'), 10)); });
    $(document).on('click', '#coSteps .gh-step.is-done', function () { show(parseInt($(this).data('step-idx'), 10)); });

    $(document).on('click', '#coPlaceOrder', function () {
      var num = 'GH' + Date.now().toString().slice(-8);
      GH.cart.clear();
      $('#coMain').html(
        '<div class="gh-panel text-center py-5">' +
          '<div class="gh-empty__icon" style="background:var(--gh-gold-soft);color:var(--gh-gold-dark)">' + GH.icon('check', 28) + '</div>' +
          '<h2 class="gh-h2 mt-3 mb-2">Thank you for your order</h2>' +
          '<p class="gh-muted mb-1">Order <b style="color:var(--gh-ink)">' + num + '</b> is confirmed.</p>' +
          '<p class="gh-muted mb-4">A receipt has been sent to your email.</p>' +
          '<a class="gh-btn" href="index.html">Back to the shop ' + GH.icon('arrow', 16) + '</a>' +
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

    $(document).on('gh:cart-changed', paintSummary);

    if (!GH.cart.items.length) {
      $('#coMain').html(
        '<div class="gh-panel gh-empty">' +
          '<div class="gh-empty__icon">' + GH.icon('bag', 26) + '</div>' +
          '<h3 class="gh-h3 mb-2">Your cart is empty</h3>' +
          '<p class="gh-muted mb-4">Add something lovely before checking out.</p>' +
          '<a class="gh-btn" href="shop.html">Browse the shop ' + GH.icon('arrow', 16) + '</a>' +
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
  GH.initPersonalise = function () {
    var exp = GH.experience(GH.param('exp')) || GH.experiences[0];
    var design = GH.cardDesigns[0];
    var delivery = 'ecard';

    /* Selected experience summary */
    $('#peExp').html(
      '<div class="d-flex gap-3 align-items-center">' +
        '<div class="gh-media" style="width:66px;height:66px;border-radius:10px;flex:none">' +
          GH.mediaInner(exp) + '</div>' +
        '<div>' +
          '<div class="gh-tiny gh-muted">Selected experience</div>' +
          '<div class="gh-serif" style="font-size:1.1rem;color:var(--gh-ink)">' + GH.escape(exp.name) + '</div>' +
          '<div class="gh-small gh-muted">' + exp.duration + ' · ' + exp.place + '</div>' +
        '</div>' +
        '<div class="ms-auto gh-serif" style="font-size:1.1rem;color:var(--gh-ink)">' + GH.money0(exp.price) + '</div>' +
      '</div>'
    );

    /* Card designs */
    $('#peDesigns').html(GH.cardDesigns.map(function (d, i) {
      return '<div class="col-6">' +
               '<button class="gh-cardpick' + (i === 0 ? ' is-active' : '') + '" type="button" data-design="' + d.id + '">' +
                 '<span class="gh-cardpick__art ' + d.art + '">' + d.glyph + '</span>' +
                 '<span class="gh-cardpick__name">' + d.name + '</span>' +
               '</button>' +
             '</div>';
    }).join(''));

    function paintPreview() {
      var to  = $.trim($('#peTo').val());
      var msg = $.trim($('#peMsg').val());
      var frm = $.trim($('#peFrom').val());

      $('#peCard').attr('class', 'gh-ecard ' + design.theme);
      $('#peCardTo').text(to ? 'For ' + to : '').toggle(!!to);
      $('#peCardMsg').text(msg ? '“' + msg + '”' : '“Your message will appear here.”');
      $('#peCardFrom').text(frm ? '— ' + frm : '').toggle(!!frm);

      var fee = delivery === 'physical' ? C.physicalCardFee : 0;
      $('#peTotal').text(GH.money(exp.price + fee));
      $('#peFeeRow').toggle(fee > 0);
      $('#peDeliveryNote').text(delivery === 'physical'
        ? 'Physical card will be posted to the recipient in 2–3 business days.'
        : 'eCard will be sent to recipient’s email upon order confirmation.');
    }

    $(document).on('click', '#peDesigns .gh-cardpick', function () {
      $('#peDesigns .gh-cardpick').removeClass('is-active');
      $(this).addClass('is-active');
      var dId = $(this).attr('data-design');
      design = GH.cardDesigns.filter(function (d) { return d.id === dId; })[0] || design;
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
      GH.cart.add(
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
      GH.toast('Gift personalised and added to cart', 'Review & pay', 'checkout.html');
      setTimeout(function () { window.location.href = 'checkout.html'; }, 700);
    });
    $(document).on('click', '#peSkip', function (e) {
      e.preventDefault();
      addToCart(false);
      window.location.href = 'checkout.html';
    });

    paintPreview();
    GH.initReveal();
  };

  /* ======================================================================
     10. My Orders (2 tab: Completed orders / Pending payment)
     ====================================================================== */
  GH.initOrders = function () {
    var TABS = [
      { id: 'completed', label: 'Completed orders' },
      { id: 'pending',   label: 'Pending payment'  }
    ];

    var current = GH.param('tab');
    if (!TABS.filter(function (t) { return t.id === current; }).length) current = 'completed';

    var open = {};   // id đơn -> đang mở rộng?
    var seen = {};   // tab -> đã vào lần nào chưa (để chỉ tự mở đơn mới nhất 1 lần)

    /* --- tiền: mockup in số trần (88.00), tổng mới kèm mã tiền tệ --- */
    function amt(n) {
      return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /** Ghép 1 dòng đơn với sản phẩm thật; trả null nếu id không còn trong catalogue. */
    function line(row) {
      var p = GH.product(row.id);
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
      return (GH.orders || []).filter(function (o) { return o.status === tab; })
        .slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    }

    /* --- markup --- */
    function tabsHtml() {
      return TABS.map(function (t) {
        var n = ordersOf(t.id).length;
        return '<button class="gh-ord__tab' + (t.id === current ? ' is-active' : '') + '" type="button" ' +
                 'data-ord-tab="' + t.id + '" aria-pressed="' + (t.id === current) + '">' +
                 '<span>' + t.label + '</span><em>' + n + '</em>' +
               '</button>';
      }).join('');
    }

    function fullLines(lines) {
      return lines.map(function (l) {
        return '<div class="gh-ord__line">' +
                 '<div class="gh-ord__media gh-media">' + GH.mediaInner(l.product) + '</div>' +
                 '<div class="gh-ord__info">' +
                   '<div class="gh-ord__name">' + GH.escape(l.name) + '</div>' +
                   '<div class="gh-ord__qty">Quantity : <em>' + l.qty + '</em></div>' +
                 '</div>' +
                 '<div class="gh-ord__price">' + amt(l.sum) + '</div>' +
               '</div>';
      }).join('');
    }

    function briefLines(lines) {
      return lines.map(function (l) {
        return '<div class="gh-ord__brief">' +
                 '<span class="gh-ord__x">' + l.qty + 'x</span>' +
                 '<span class="gh-ord__briefname">' + GH.escape(l.name) + '</span>' +
                 '<span class="gh-ord__price">' + amt(l.sum) + '</span>' +
               '</div>';
      }).join('');
    }

    function cardHtml(order) {
      var lines = linesOf(order);
      var isOpen = !!open[order.id];
      var pending = order.status === 'pending';

      var foot = pending
        ? '<a class="gh-btn gh-btn--gold gh-ord__action" href="checkout.html">Pay now ' + GH.icon('arrow', 15) + '</a>'
        : '<button class="gh-btn gh-btn--gold gh-ord__action" type="button" data-ord-reorder data-gh-add>ReOrder</button>';

      return '<article class="gh-ord__card' + (isOpen ? ' is-open' : '') + '" data-ord-id="' + order.id + '">' +
               '<button class="gh-ord__head" type="button" data-ord-toggle ' +
                 'aria-expanded="' + isOpen + '" aria-controls="ghOrdBody' + order.id + '">' +
                 '<span class="gh-ord__no">#' + GH.escape(order.id) + '</span>' +
                 (pending ? '<span class="gh-ord__flag">Awaiting payment</span>' : '') +
                 '<span class="gh-ord__time">Order Time: ' + GH.dateLabel(order.date) + '</span>' +
                 '<span class="gh-ord__chev" aria-hidden="true">' + GH.icon('chevright', 18) + '</span>' +
               '</button>' +
               '<div class="gh-ord__body" id="ghOrdBody' + order.id + '">' +
                 (isOpen
                   ? fullLines(lines) +
                     '<div class="gh-ord__total">Total: ' + amt(totalOf(lines)) + ' ' + C.currencyCode + '</div>' +
                     '<div class="gh-ord__foot">' + foot + '</div>'
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
        $('#ordList').html(GH.localise(
          '<div class="gh-panel gh-empty">' +
            '<div class="gh-empty__icon">' + GH.icon('box', 26) + '</div>' +
            '<h3 class="gh-h3 mb-2">No ' + (current === 'pending' ? 'pending payments' : 'completed orders') + '</h3>' +
            '<p class="gh-muted mb-4">' +
              (current === 'pending'
                ? 'Everything is paid for — nothing waiting here.'
                : 'Your completed orders will be listed here.') + '</p>' +
            '<a class="gh-btn" href="shop.html">Browse the shop ' + GH.icon('arrow', 16) + '</a>' +
          '</div>'
        ));
        return;
      }

      $('#ordList').html(GH.localise(list.map(cardHtml).join('')));
    }

    /* --- sự kiện --- */
    $(document).on('click', '#ordTabs [data-ord-tab]', function () {
      var t = $(this).attr('data-ord-tab');
      if (t === current) return;
      current = t;
      render();
    });

    $(document).on('click', '#ordList [data-ord-toggle]', function () {
      var id = $(this).closest('.gh-ord__card').attr('data-ord-id');
      open[id] = !open[id];
      render();
    });

    $(document).on('click', '#ordList [data-ord-reorder]', function () {
      var id = $(this).closest('.gh-ord__card').attr('data-ord-id');
      var order = (GH.orders || []).filter(function (o) { return o.id === id; })[0];
      if (!order) return;

      var lines = linesOf(order);
      if (!lines.length) { GH.toast('These items are no longer available'); return; }

      $.each(lines, function (_, l) { GH.cart.add(l.product, l.option, l.qty); });
      GH.toast(lines.length + (lines.length === 1 ? ' item' : ' items') + ' added to your cart',
               'View cart', 'cart.html');
    });

    render();
  };

  /* ======================================================================
     11. Member profile (member/profile.html)
     ====================================================================== */
  GH.initProfile = function () {
    var P = GH.profile;
    var editing = GH.param('edit') === '1';
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function fieldId(key) { return 'pf_' + key; }

    /** Giá trị để hiển thị: ngày thì đổi định dạng, rỗng thì "Not provided". */
    function shown(f) {
      var v = $.trim(P.get(f.key));
      if (!v) return null;
      return f.type === 'date' ? GH.dateLabel(v) : v;
    }

    function inputHtml(f) {
      var v = GH.escape(P.get(f.key));
      var id = fieldId(f.key);
      if (f.type === 'select') {
        var opts = '<option value="">Not provided</option>' +
          (f.options || []).map(function (o) {
            return '<option value="' + GH.escape(o) + '"' + (o === P.get(f.key) ? ' selected' : '') + '>' +
                   GH.escape(o) + '</option>';
          }).join('');
        return '<select class="gh-input gh-prof__control" id="' + id + '">' + opts + '</select>';
      }
      return '<input class="gh-input gh-prof__control" id="' + id + '" type="' +
             (f.type || 'text') + '" value="' + v + '">';
    }

    function rowHtml(f) {
      var val = shown(f);
      var body;

      if (editing && !f.ro) {
        body = inputHtml(f) + '<div class="gh-error" data-err-for="' + fieldId(f.key) + '"></div>';
      } else {
        body = val
          ? '<span class="gh-prof__value">' + GH.escape(val) + '</span>'
          : '<span class="gh-prof__value is-empty">Not provided</span>';
        if (editing && f.ro) body += '<span class="gh-prof__lock">' + GH.icon('lock', 13) + 'Locked</span>';
      }

      return '<div class="gh-prof__row' + (editing && !f.ro ? ' is-editing' : '') + '">' +
               '<dt class="gh-prof__label">' + GH.escape(f.label) + '</dt>' +
               '<dd class="gh-prof__field">' + body + '</dd>' +
             '</div>';
    }

    function groupHtml(g) {
      return '<section class="gh-prof__group">' +
               '<header class="gh-prof__grouphead">' +
                 '<span class="gh-prof__groupico">' + GH.icon(g.icon || 'user', 17) + '</span>' +
                 '<h2 class="gh-prof__grouptitle">' + GH.escape(g.title) + '</h2>' +
               '</header>' +
               '<dl class="gh-prof__rows">' + g.fields.map(rowHtml).join('') + '</dl>' +
             '</section>';
    }

    function asideHtml() {
      var pct = P.completeness();
      var missing = P.missing();
      var name = P.fullName() || 'Your profile';
      var initials = ((P.get('firstName').charAt(0) || name.charAt(0) || '?') +
                      P.get('lastName').charAt(0)).toUpperCase();
      var type = P.get('memberType') || 'Member';
      var no = P.get('memberNo');

      var actions = editing
        ? '<button class="gh-btn gh-btn--block" type="button" id="pfSave">Save changes</button>' +
          '<button class="gh-btn gh-btn--ghost gh-btn--block mt-2" type="button" id="pfCancel">Cancel</button>'
        : '<button class="gh-btn gh-btn--block" type="button" id="pfEdit">Edit my information</button>';

      return '<div class="gh-prof__card">' +
               '<div class="gh-prof__avatar" aria-hidden="true">' + GH.escape(initials) + '</div>' +
               '<h1 class="gh-prof__name">' + GH.escape(name) + '</h1>' +
               '<div class="gh-prof__badges">' +
                 '<span class="gh-prof__chip">' + GH.escape(type) + '</span>' +
                 (no ? '<span class="gh-prof__no">No. ' + GH.escape(no) + '</span>' : '') +
               '</div>' +

               '<div class="gh-prof__meter">' +
                 '<div class="gh-prof__meterhead"><span>Profile complete</span><b>' + pct + '%</b></div>' +
                 '<div class="gh-prof__bar"><i style="width:' + pct + '%"></i></div>' +
                 (missing.length
                   ? '<p class="gh-prof__hint">' + missing.length +
                     (missing.length === 1 ? ' field left: ' : ' fields left: ') +
                     GH.escape(missing.slice(0, 3).join(', ')) +
                     (missing.length > 3 ? '…' : '') + '</p>'
                   : '<p class="gh-prof__hint">Everything is filled in — thank you.</p>') +
               '</div>' +

               '<dl class="gh-prof__facts">' +
                 '<div><dt>Member since</dt><dd>' + (GH.dateLabel(P.get('joinDate')) || '—') + '</dd></div>' +
                 '<div><dt>Valid until</dt><dd>' + (GH.dateLabel(P.get('expiryDate')) || '—') + '</dd></div>' +
               '</dl>' +

               '<div class="gh-prof__actions">' + actions + '</div>' +

               '<div class="gh-prof__links">' +
                 '<a class="gh-link-arrow" href="member/orders.html">My orders ' + GH.icon('chevright', 14) + '</a>' +
               '</div>' +
             '</div>';
    }

    function render() {
      $('#profAside').html(GH.localise(asideHtml()));
      $('#profBody').html(GH.localise((GH.profileGroups || []).map(groupHtml).join('')))
                    .toggleClass('is-editing', editing);
    }

    /* --- lưu --- */
    function collect() {
      var out = {}, bad = null;
      $('#profBody .gh-error').removeClass('is-on').text('');
      $('#profBody .gh-prof__control').removeClass('is-invalid');

      $.each(GH.profileGroups || [], function (_, g) {
        $.each(g.fields, function (_, f) {
          if (f.ro) return;
          var $el = $('#' + fieldId(f.key));
          if (!$el.length) return;
          var v = $.trim($el.val() || '');

          if (f.type === 'email' && v && !RE_MAIL.test(v)) {
            $el.addClass('is-invalid');
            $('[data-err-for="' + fieldId(f.key) + '"]').text('Enter a valid email address').addClass('is-on');
            bad = bad || $el;
            return;
          }
          out[f.key] = v;
        });
      });
      return bad ? null : out;
    }

    $(document)
      .on('click', '#pfEdit', function () { editing = true; render(); })
      .on('click', '#pfCancel', function () { editing = false; render(); })
      .on('click', '#pfSave', function () {
        var patch = collect();
        if (!patch) { GH.toast('Please check the highlighted field'); return; }

        P.set(patch);
        /* Giữ phiên đăng nhập khớp với hồ sơ vừa sửa. */
        if (GH.auth && GH.auth.isIn()) {
          GH.auth.update({ first: patch.firstName, last: patch.lastName, email: patch.email });
        }
        editing = false;
        render();
        GH.toast('Profile updated');
      })
      .on('input change', '#profBody .gh-prof__control', function () {
        $(this).removeClass('is-invalid');
        $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
      });

    render();
  };

  /* ======================================================================
     12. Change password (member/password.html)
     ====================================================================== */
  GH.initPassword = function () {
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
      return '<div class="gh-pw__field">' +
               '<label class="gh-auth__label" for="' + id + '">' + GH.escape(label) + '</label>' +
               '<div class="gh-auth__pw">' +
                 '<input class="gh-input form-control" type="password" id="' + id + '" autocomplete="' + ac + '">' +
                 '<button class="gh-auth__peek" type="button" data-gh-peek aria-label="Show password">' +
                   GH.icon('eye', 17) + '</button>' +
               '</div>' +
               '<div class="gh-error" data-err-for="' + id + '"></div>' +
             '</div>';
    }

    function render() {
      var changed = GH.profile.get('passwordChangedAt');

      $('#pwAside').html(GH.localise(
        '<div class="gh-prof__card">' +
          '<div class="gh-pw__shield" aria-hidden="true">' + GH.icon('lock', 30) + '</div>' +
          '<h2 class="gh-prof__name">Account security</h2>' +
          '<p class="gh-pw__lead">Pick something you do not use anywhere else. ' +
            'You stay signed in on this device after changing it.</p>' +
          '<dl class="gh-prof__facts">' +
            '<div><dt>Signed in as</dt><dd>' + GH.escape(GH.profile.get('email') || '—') + '</dd></div>' +
            '<div><dt>Last changed</dt><dd>' + (changed ? GH.dateLabel(changed) : 'Never') + '</dd></div>' +
          '</dl>' +
          '<div class="gh-prof__links">' +
            '<a class="gh-link-arrow" href="member/profile.html">Back to profile ' + GH.icon('chevright', 14) + '</a>' +
          '</div>' +
        '</div>'
      ));

      $('#pwBody').html(GH.localise(
        '<section class="gh-prof__group">' +
          '<header class="gh-prof__grouphead">' +
            '<span class="gh-prof__groupico">' + GH.icon('lock', 17) + '</span>' +
            '<h2 class="gh-prof__grouptitle">New password</h2>' +
          '</header>' +
          '<form class="gh-pw__form" id="pwForm" novalidate>' +
            pwField('pwCurrent', 'Current password', 'current-password') +
            pwField('pwNew', 'New password', 'new-password') +

            '<div class="gh-pw__meter" id="pwMeter" data-score="0">' +
              '<div class="gh-pw__bar"><i></i><i></i><i></i><i></i></div>' +
              '<span class="gh-pw__level" id="pwLevel">Too short</span>' +
            '</div>' +
            '<ul class="gh-pw__rules" id="pwRules">' +
              RULES.map(function (r) {
                return '<li data-rule="' + r.id + '">' +
                         '<span class="gh-pw__tick">' + GH.icon('check', 12) + '</span>' +
                         GH.escape(r.label) +
                       '</li>';
              }).join('') +
            '</ul>' +

            pwField('pwConfirm', 'Repeat new password', 'new-password') +
            '<button class="gh-btn gh-btn--block mt-2" type="submit">Update password</button>' +
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
      .on('input', '#pwForm .gh-input', function () {
        $(this).removeClass('is-invalid');
        $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
      })
      .on('submit', '#pwForm', function (e) {
        e.preventDefault();
        $('#pwForm .gh-input').removeClass('is-invalid');
        $('#pwForm .gh-error').removeClass('is-on').text('');

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

        GH.profile.set({ passwordChangedAt: new Date().toISOString().slice(0, 10) });
        render();
        paintStrength();
        GH.toast('Password updated');
      });

    render();
    paintStrength();
  };

  /* ======================================================================
     13. Invite friends (member/invite.html)
     ====================================================================== */
  GH.initInvite = function () {
    var R = GH.referral || {};
    var KEY = 'gh_invites_v1';
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var sent = [];
    try { sent = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { sent = []; }
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(sent)); } catch (e) {} }

    /* Mã giới thiệu bám theo số thẻ thành viên -> mỗi người một mã. */
    function code() {
      var no = GH.profile.get('memberNo') || '000000';
      return (R.codePrefix || 'GH-') + no.slice(-6);
    }
    /** Link mời dạng tuyệt đối để dán đi đâu cũng chạy. */
    function link() {
      var rel = GH.url(R.landing || 'index.html');
      return new URL(rel, window.location.href).href + '?ref=' + encodeURIComponent(code());
    }

    function channelHtml(c) {
      var glyph = GH.brandIcon ? GH.brandIcon(c.id, 20) : '';
      if (!glyph) glyph = GH.icon(c.icon || 'arrow', 19);
      return '<button class="gh-inv__ch gh-inv__ch--' + c.id + '" type="button" data-inv-ch="' + c.id + '">' +
               '<span class="gh-inv__chico">' + glyph + '</span>' +
               '<span>' + GH.escape(c.label) + '</span>' +
             '</button>';
    }

    function listHtml() {
      if (!sent.length) {
        return '<p class="gh-inv__none">No invitations sent yet. Share your link above to get started.</p>';
      }
      return '<ul class="gh-inv__list">' + sent.map(function (i, idx) {
        return '<li class="gh-inv__row">' +
                 '<span class="gh-inv__who">' + GH.escape(i.email) + '</span>' +
                 '<span class="gh-inv__when">' + GH.dateLabel(i.at) + '</span>' +
                 '<span class="gh-inv__state">' + GH.escape(i.status || 'Invited') + '</span>' +
                 '<button class="gh-inv__rm" type="button" data-inv-rm="' + idx + '" ' +
                   'aria-label="Remove ' + GH.escape(i.email) + '">' + GH.icon('close', 14) + '</button>' +
               '</li>';
      }).join('') + '</ul>';
    }

    function render() {
      var reward = GH.money0(R.reward || 0);

      $('#invAside').html(GH.localise(
        '<div class="gh-prof__card">' +
          '<div class="gh-inv__gift" aria-hidden="true">' + GH.icon('gift', 30) + '</div>' +
          '<h2 class="gh-prof__name">Give ' + reward + ', get ' + reward + '</h2>' +
          '<p class="gh-pw__lead">Your friend gets ' + reward + ' off their first order. ' +
            'When they check out, the same lands in your wallet.</p>' +
          '<dl class="gh-prof__facts">' +
            '<div><dt>Invitations sent</dt><dd>' + sent.length + '</dd></div>' +
            '<div><dt>Your code</dt><dd>' + GH.escape(code()) + '</dd></div>' +
          '</dl>' +
          '<div class="gh-prof__links">' +
            '<a class="gh-link-arrow" href="member/profile.html">Back to profile ' + GH.icon('chevright', 14) + '</a>' +
          '</div>' +
        '</div>'
      ));

      $('#invBody').html(GH.localise(
        /* --- chia sẻ link --- */
        '<section class="gh-prof__group">' +
          '<header class="gh-prof__grouphead">' +
            '<span class="gh-prof__groupico">' + GH.icon('sparkle', 17) + '</span>' +
            '<h2 class="gh-prof__grouptitle">Share your invitation</h2>' +
          '</header>' +
          '<div class="gh-inv__pad">' +
            '<div class="gh-inv__linkbox">' +
              '<input class="gh-input form-control" id="invLink" readonly value="' + GH.escape(link()) + '" ' +
                'aria-label="Your invitation link">' +
              '<button class="gh-btn gh-btn--sm" type="button" data-inv-ch="copy">' +
                GH.icon('copy', 15) + 'Copy</button>' +
            '</div>' +
            '<div class="gh-inv__channels">' + (R.channels || []).map(channelHtml).join('') + '</div>' +
          '</div>' +
        '</section>' +

        /* --- mời qua email --- */
        '<section class="gh-prof__group">' +
          '<header class="gh-prof__grouphead">' +
            '<span class="gh-prof__groupico">' + GH.icon('mail', 17) + '</span>' +
            '<h2 class="gh-prof__grouptitle">Invite by email</h2>' +
          '</header>' +
          '<div class="gh-inv__pad">' +
            '<form id="invForm" novalidate>' +
              '<label class="gh-auth__label" for="invMails">Email addresses</label>' +
              '<textarea class="gh-input form-control" id="invMails" rows="3" ' +
                'placeholder="friend@example.com, another@example.com"></textarea>' +
              '<div class="gh-error" data-err-for="invMails"></div>' +
              '<p class="gh-inv__tip">Separate several addresses with a comma, a space or a new line.</p>' +
              '<button class="gh-btn gh-btn--block mt-1" type="submit">Send invitations</button>' +
            '</form>' +
          '</div>' +
        '</section>' +

        /* --- đã mời --- */
        '<section class="gh-prof__group">' +
          '<header class="gh-prof__grouphead">' +
            '<span class="gh-prof__groupico">' + GH.icon('users', 17) + '</span>' +
            '<h2 class="gh-prof__grouptitle">Invitations sent</h2>' +
          '</header>' +
          '<div class="gh-inv__pad">' + listHtml() + '</div>' +
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
          function () { GH.toast('Invitation link copied'); },
          function () { GH.toast('Press Ctrl/Cmd + C to copy the link'); }
        );
        return;
      }
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      GH.toast(done ? 'Invitation link copied' : 'Press Ctrl/Cmd + C to copy the link');
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

        if (!fresh.length) { GH.toast('Those friends were already invited'); return; }

        sent = fresh.concat(sent);
        persist();
        render();
        GH.toast(fresh.length + (fresh.length === 1 ? ' invitation sent' : ' invitations sent'));
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
