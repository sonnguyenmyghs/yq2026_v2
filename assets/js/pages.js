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

})(jQuery);
