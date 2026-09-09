/* ==========================================================================
   Module JS: cart-anim — Hiệu ứng "thêm vào giỏ" cao cấp
   Nạp sau data.js / app.js / pages.js nên dùng được GH.*, jQuery, Bootstrap 5.

   Gồm 4 mảng:
     1) Fly-to-cart : ảnh sản phẩm bay theo đường cong bezier tới icon giỏ,
                      nhỏ dần + mờ dần rồi tự xoá khỏi DOM.
     2) Icon giỏ    : nảy nhẹ + vòng sáng vàng, badge đếm tăng ĐÚNG lúc ảnh
                      chạm nơi (giữ số cũ trong lúc bay, không lệch nhịp).
     3) Nút bấm     : chuyển sang "Added" (tích vàng) ~1.2s, chặn spam click.
     4) Cart drawer : panel trượt từ phải, đóng bằng click nền / Esc, khoá cuộn.

   Nguyên tắc an toàn:
     - Không sửa file nào khác; chỉ gắn vào DOM + event có sẵn.
     - Luôn kiểm tra phần tử tồn tại (header có thể được agent khác đổi markup).
     - Tôn trọng prefers-reduced-motion: bỏ hết chuyển động, giữ phản hồi tức thì.
   ========================================================================== */
(function ($) {
  'use strict';

  if (!window.GH || !GH.cart) return;      // fallback êm nếu core chưa sẵn sàng

  var D = document;
  var W = window;

  /* ======================================================================
     0. Cấu hình + tiện ích
     ====================================================================== */
  var CFG = {
    /* Mọi điểm bấm "thêm vào giỏ" hiện có (và [data-buynow] của agent khác
       nếu nó tồn tại — không bắt buộc phải có). */
    triggers: '[data-quickadd], #pdpAdd, [data-buynow], [data-gh-add]',
    flyMs:     780,   // thời gian bay
    addedMs:  1200,   // thời gian nút giữ trạng thái "Added"
    pendingMs: 1200,  // click quá cũ thì bỏ, tránh ăn nhầm cart-changed khác
    drawerMs:  200,   // độ trễ mở drawer sau khi ảnh chạm giỏ
    maxFly:      5    // số phần tử bay tối đa cùng lúc
  };

  function reduced() {
    return !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function raf(fn) {
    return (W.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(fn);
  }
  function cancelRaf(id) {
    (W.cancelAnimationFrame || clearTimeout)(id);
  }
  function now() {
    return (W.performance && W.performance.now) ? W.performance.now() : Date.now();
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /** Rect hợp lệ (phần tử đang thực sự hiển thị)? */
  function liveRect(el) {
    if (!el || !el.getBoundingClientRect) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    return r;
  }

  /** Giải cubic-bezier(x1,y1,x2,y2) — dùng cho easing thời gian bay. */
  function bezierEase(x1, y1, x2, y2) {
    function cx(t, a, b) { return 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t; }
    return function (x) {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x, i, v;
      for (i = 0; i < 24; i++) {          // chia đôi — đủ mượt, không cần đạo hàm
        v = cx(t, x1, x2);
        if (Math.abs(v - x) < 1e-4) break;
        if (v < x) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return cx(t, y1, y2);
    };
  }
  var easeFly = bezierEase(0.42, 0.06, 0.30, 1);   // rời tay êm rồi hút dần vào giỏ

  /* ======================================================================
     1. Xác định nguồn (ảnh sản phẩm) và đích (icon giỏ)
     ====================================================================== */

  /** Icon giỏ đang hiển thị trên header (desktop hoặc mobile). */
  function cartAnchor() {
    var ids = ['ghCartCount', 'ghCartCountM'], i, badge, anchor;
    for (i = 0; i < ids.length; i++) {
      badge = D.getElementById(ids[i]);
      if (!badge) continue;
      anchor = (badge.closest && badge.closest('.gh-iconbtn, a, button')) || badge.parentNode;
      if (liveRect(anchor)) return anchor;
    }
    /* Header có thể đã đổi markup — thử bắt bất kỳ link giỏ nào đang hiện. */
    var alts = D.querySelectorAll('#ghHeader a[href*="cart.html"], header a[href*="cart.html"]');
    for (i = 0; i < alts.length; i++) if (liveRect(alts[i])) return alts[i];
    return null;
  }

  /** Toạ độ đích: tâm icon giỏ, hoặc góc trên phải nếu không tìm thấy. */
  function cartPoint(anchor) {
    var r = anchor && liveRect(anchor);
    if (r) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    return { x: (D.documentElement.clientWidth || W.innerWidth) - 44, y: 44 };
  }

  /** Từ nút bấm → tìm khối ảnh sản phẩm gần nhất + rect nguồn. */
  function captureSource(btn) {
    var $btn = $(btn), $m = $();

    /* Trang chi tiết sản phẩm */
    if (btn.id === 'pdpAdd' || $btn.closest('.gh-pdp, .gh-pdp__gallery').length) {
      $m = $('#pdpMain').find('img, .gh-media__ph').first();
    }
    /* Card sản phẩm / dòng giỏ / panel */
    if (!$m.length) {
      var $scope = $btn.closest('.gh-card, .gh-line, .gh-panel, .gh-feature, article');
      if ($scope.length) {
        $m = $scope.find('.gh-card__mediawrap img, .gh-card__mediawrap .gh-media__ph, .gh-media img, .gh-media__ph').first();
      }
    }

    var mediaEl = $m[0] || null;
    var r = mediaEl ? liveRect(mediaEl) : null;
    var html = '';

    if (r) {
      html = mediaEl.outerHTML;
    } else {
      /* Không thấy ảnh trong DOM → dựng lại từ dữ liệu sản phẩm. */
      var id = $btn.attr('data-quickadd') || $btn.attr('data-buynow') ||
               $btn.attr('data-gh-add') || (GH.param ? GH.param('id') : null);
      var p = (id && GH.product) ? GH.product(id) : null;
      if (p && GH.mediaInner) html = GH.mediaInner(p, { eager: true });
      r = liveRect(btn);
      if (!r) return null;
      /* Khung vuông đặt giữa nút bấm */
      var side = 76;
      r = { left: r.left + r.width / 2 - side / 2, top: r.top + r.height / 2 - side / 2, width: side, height: side };
    }
    if (!html) html = '<span class="gh-media__ph ph-2"></span>';

    /* Giới hạn kích thước khối bay cho gọn gàng */
    var w = clamp(r.width, 60, 148);
    var h = clamp(r.height * (w / r.width), 60, 168);

    return {
      html: html,
      w: w,
      h: h,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2
    };
  }

  /* ======================================================================
     2. Phần tử bay — quản lý vòng đời, không rò rỉ DOM
     ====================================================================== */
  var flyers = [];

  function destroyFlyer(rec, fireArrive) {
    if (rec.done) return;
    rec.done = true;
    if (rec.rafId) cancelRaf(rec.rafId);
    if (rec.guard) clearTimeout(rec.guard);
    if (rec.el && rec.el.parentNode) rec.el.parentNode.removeChild(rec.el);
    var i = flyers.indexOf(rec);
    if (i > -1) flyers.splice(i, 1);
    if (fireArrive && rec.onArrive) rec.onArrive();
  }

  /** Dọn sạch mọi phần tử bay (rời trang / tab ẩn). */
  function flushFlyers(fireArrive) {
    while (flyers.length) destroyFlyer(flyers[0], fireArrive);
  }

  /**
   * Bay từ src {x,y,w,h,html} tới điểm dst {x,y} theo cubic bezier.
   * onArrive() được gọi ĐÚNG lúc khối bay chạm giỏ.
   */
  function fly(src, dst, onArrive) {
    /* Quá nhiều khối đang bay → kết thúc sớm cái cũ nhất (vẫn tính là đã tới). */
    while (flyers.length >= CFG.maxFly) destroyFlyer(flyers[0], true);

    var el = D.createElement('div');
    el.className = 'gh-fly';
    el.setAttribute('aria-hidden', 'true');
    el.style.width = src.w + 'px';
    el.style.height = src.h + 'px';
    el.innerHTML = '<div class="gh-fly__box"><div class="gh-fly__media gh-media">' + src.html + '</div></div>';

    /* Ảnh clone không cần lazy-load nữa */
    var img = el.querySelector('img');
    if (img) { img.removeAttribute('loading'); img.setAttribute('decoding', 'sync'); }

    D.body.appendChild(el);

    var rec = { el: el, onArrive: onArrive, done: false, rafId: 0, guard: 0 };
    flyers.push(rec);

    /* Đường cong: nhấc lên cao rồi vòng về phía giỏ */
    var x0 = src.x, y0 = src.y, x1 = dst.x, y1 = dst.y;
    var dx = x1 - x0, dy = y1 - y0;
    var dist = Math.sqrt(dx * dx + dy * dy);
    /* Icon giỏ nằm sát đỉnh màn hình (y ~ 38px), nên nếu nhấc đường cong lên
       theo dist thì điểm điều khiển thành y âm -> khối bay vọt ra ngoài viewport.
       Kẹp cả hai điểm điều khiển trong vùng nhìn thấy. */
    var TOP_GUARD = 14;                              // mép trên an toàn
    var lift = clamp(dist * 0.26, 56, 170);
    var c1x = x0 + dx * 0.14, c1y = Math.max(TOP_GUARD, y0 - lift);
    var c2x = x0 + dx * 0.70, c2y = Math.max(TOP_GUARD, y1 - lift * 0.5);

    var t0 = now();
    var half = src.w / 2, halfH = src.h / 2;

    function frame() {
      if (rec.done) return;
      var t = clamp((now() - t0) / CFG.flyMs, 0, 1);
      var e = easeFly(t);
      var u = 1 - e;

      var px = u * u * u * x0 + 3 * u * u * e * c1x + 3 * u * e * e * c2x + e * e * e * x1;
      var py = u * u * u * y0 + 3 * u * u * e * c1y + 3 * u * e * e * c2y + e * e * e * y1;

      /* nhô nhẹ lúc rời tay rồi thu nhỏ dần về 0.18 */
      var pop = 1 + 0.10 * Math.sin(Math.PI * clamp(t / 0.3, 0, 1));
      var sc = (1 - 0.82 * e) * pop;
      var rot = 9 * Math.sin(Math.PI * e);
      var op = t < 0.62 ? 1 : clamp(1 - (t - 0.62) / 0.38, 0, 1);

      el.style.opacity = op;
      el.style.transform = 'translate3d(' + (px - half) + 'px,' + (py - halfH) + 'px,0)' +
                           ' scale(' + sc + ') rotate(' + rot + 'deg)';

      if (t < 1) rec.rafId = raf(frame);
      else destroyFlyer(rec, true);
    }

    /* Đặt vị trí đầu ngay lập tức để không nháy ở góc trái trên */
    el.style.opacity = '1';
    el.style.transform = 'translate3d(' + (x0 - half) + 'px,' + (y0 - halfH) + 'px,0) scale(1)';
    rec.rafId = raf(frame);

    /* Chốt an toàn: dù rAF bị treo (tab ẩn) vẫn dọn sạch */
    rec.guard = setTimeout(function () { destroyFlyer(rec, true); }, CFG.flyMs + 700);
  }

  /* ======================================================================
     3. Phản hồi tại icon giỏ: nảy + vòng sáng + badge đếm tăng
     ====================================================================== */
  var badgeGen = 0;      // thế hệ hiệu ứng badge — huỷ hiệu ứng cũ khi giỏ đổi tiếp
  var badgeTimer = null;

  function $badges() { return $('#ghCartCount, #ghCartCountM'); }

  function paintBadge(n, pop) {
    $badges().each(function () {
      var $b = $(this);
      /* gỡ .is-bump của app.js: badge chỉ được nhảy đúng lúc ảnh chạm giỏ */
      $b.text(n).toggleClass('is-on', n > 0).removeClass('is-bump');
      if (pop && n > 0) {
        $b.removeClass('is-ghcount');
        void this.offsetWidth;          // reflow để chạy lại keyframes
        $b.addClass('is-ghcount');
      }
    });
  }

  function cancelBadgeHold() {
    badgeGen++;
    if (badgeTimer) { clearTimeout(badgeTimer); badgeTimer = null; }
  }

  /** Đếm tăng từ from → to, mỗi bước một nhịp pop. */
  function countUp(from, to, gen) {
    var steps = to - from;
    if (steps <= 0 || reduced()) { paintBadge(to, true); return; }
    var per = clamp(Math.round(420 / steps), 90, 190);
    var i = 0;
    (function tick() {
      if (gen !== badgeGen) return;
      i++;
      paintBadge(from + i, true);
      if (i < steps) badgeTimer = setTimeout(tick, per);
      else badgeTimer = null;
    })();
  }

  function ring(pt, size) {
    if (reduced()) return;
    var el = D.createElement('span');
    el.className = 'gh-fly-ring';
    el.setAttribute('aria-hidden', 'true');
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = pt.x + 'px';
    el.style.top = pt.y + 'px';
    D.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
  }

  function hitCart(anchor) {
    if (!anchor || reduced()) return;
    var $a = $(anchor);
    $a.removeClass('is-ghcart-hit');
    void anchor.offsetWidth;
    $a.addClass('is-ghcart-hit');
    setTimeout(function () { $a.removeClass('is-ghcart-hit'); }, 700);
  }

  /* ======================================================================
     4. Phản hồi tại nút bấm — trạng thái "Added"
     ====================================================================== */
  function tickIcon() {
    return GH.icon ? GH.icon('check', 11)
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
        'stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 9.5 18 20 6.5"/></svg>';
  }

  function markAdded(btn) {
    if (!btn || !btn.parentNode) return;
    var $b = $(btn);
    if ($b.hasClass('is-ghadded')) return;

    /* Lấy màu chữ THẬT trước khi làm trong suốt — nút quick add và nút PDP
       có nền/màu khác nhau nên không thể hardcode. */
    var fg = W.getComputedStyle(btn).color || 'currentColor';

    var $layer = $('<span class="gh-added-layer" aria-hidden="true">' +
                     '<span class="gh-added-layer__tick">' + tickIcon() + '</span>' +
                     '<span>Added</span>' +
                   '</span>').css('color', fg);

    $b.addClass('is-ghadded').attr('aria-disabled', 'true').append($layer);

    setTimeout(function () {
      $b.removeClass('is-ghadded').removeAttr('aria-disabled');
      $layer.remove();
    }, CFG.addedMs);
  }

  /* ======================================================================
     5. Cart drawer
     ====================================================================== */
  var DR = { $back: null, $el: null, open: false, lastFocus: null, padPrev: '', hideTimer: null, newKey: null };

  /* Trang giỏ / thanh toán đã hiển thị đầy đủ giỏ rồi → không mở drawer. */
  function drawerAllowed() {
    return !D.getElementById('cartWrap') && !D.getElementById('coSummary');
  }

  function icon(name, size) { return GH.icon ? GH.icon(name, size) : ''; }
  function esc(s) { return GH.escape ? GH.escape(s) : String(s == null ? '' : s); }

  function buildDrawer() {
    if (DR.$el) return;

    DR.$back = $('<div class="gh-cdrawer-back" hidden></div>').appendTo('body');
    DR.$el = $(
      '<aside class="gh-cdrawer" id="ghCartDrawer" role="dialog" aria-modal="true" ' +
             'aria-label="Shopping bag" tabindex="-1" hidden>' +
        '<header class="gh-cdrawer__head">' +
          '<div>' +
            '<span class="gh-cdrawer__eyebrow" id="ghCdEyebrow">Added to your bag</span>' +
            '<h2 class="gh-cdrawer__title">Your bag <small id="ghCdN"></small></h2>' +
          '</div>' +
          '<button class="gh-cdrawer__close" type="button" data-gh-cd-close aria-label="Close">' +
            icon('close', 17) + '</button>' +
        '</header>' +
        '<div class="gh-cdrawer__body" id="ghCdBody"></div>' +
        '<footer class="gh-cdrawer__foot" id="ghCdFoot"></footer>' +
      '</aside>'
    ).appendTo('body');
  }

  function renderDrawer(animate) {
    if (!DR.$el) return;
    $('#ghCdBody').toggleClass('is-static', animate === false);
    var items = GH.cart.items || [];
    var n = GH.cart.count();

    $('#ghCdN').text(n === 1 ? '1 item' : n + ' items');

    if (!items.length) {
      $('#ghCdBody').html(GH.localise(
        '<div class="gh-cdrawer__empty">' +
          '<div class="gh-cdrawer__empty-icon">' + icon('bag', 24) + '</div>' +
          '<h3>Your bag is empty</h3>' +
          '<p>Explore our cakes, hampers, and experiences.</p>' +
          '<a class="gh-btn gh-btn--sm" href="shop.html">Continue shopping ' + icon('arrow', 15) + '</a>' +
        '</div>'
      ));
      $('#ghCdFoot').html(
        '<div class="gh-cdrawer__actions">' +
          '<button class="gh-btn gh-btn--ghost gh-btn--block" type="button" data-gh-cd-close>Close</button>' +
        '</div>'
      );
      return;
    }

    var rows = items.map(function (i, idx) {
      var isNew = DR.newKey && i.key === DR.newKey;
      return '' +
        '<div class="gh-cdrawer__row' + (isNew ? ' is-new' : '') + '" data-key="' + esc(i.key) + '"' +
             ' style="--ghd:' + Math.min(idx, 6) * 55 + 'ms">' +
          '<div class="gh-cdrawer__media gh-media">' + (GH.mediaInner ? GH.mediaInner(i) : '') + '</div>' +
          '<div class="gh-cdrawer__info">' +
            '<div class="gh-cdrawer__name">' + esc(i.name) + '</div>' +
            (i.optionLabel || i.addonLabel
              ? '<div class="gh-cdrawer__opt">' + esc(i.optionLabel || '') +
                  (i.addonLabel ? ' · ' + esc(i.addonLabel) : '') + '</div>'
              : '') +
            '<div class="gh-qty gh-cdrawer__qty" data-qty data-min="1">' +
              '<button class="gh-qty__btn" type="button" data-step="-1" aria-label="Decrease quantity">' + icon('minus', 14) + '</button>' +
              '<span class="gh-qty__val" data-qty-val>' + i.qty + '</span>' +
              '<button class="gh-qty__btn" type="button" data-step="1" aria-label="Increase quantity">' + icon('plus', 14) + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="gh-cdrawer__right">' +
            '<div class="gh-cdrawer__price">' + GH.money((i.price + (i.addonFee || 0)) * i.qty) + '</div>' +
            '<button class="gh-cdrawer__rm" type="button" data-gh-cd-remove aria-label="Remove ' + esc(i.name) + '">' +
              icon('close', 14) + '</button>' +
          '</div>' +
        '</div>';
    }).join('');

    $('#ghCdBody').html(GH.localise(rows));

    var sub = GH.cart.subtotal();
    var toFree = GH.cart.toFree ? GH.cart.toFree() : 0;
    var thr = (GH.config && GH.config.freeShippingThreshold) || 0;
    var pct = thr ? Math.min(100, (sub / thr) * 100) : 100;

    var note = toFree > 0
      ? '<div class="gh-cdrawer__note">' + icon('truck', 15) +
          '<div class="w-100">Add ' + GH.money(toFree) + ' more for free shipping' +
            '<div class="gh-cdrawer__bar"><i style="width:' + pct + '%"></i></div>' +
          '</div></div>'
      : '<div class="gh-cdrawer__note">' + icon('check', 15) + '<div>You have unlocked free shipping.</div></div>';

    $('#ghCdFoot').html(GH.localise(
      '<div class="gh-cdrawer__sum"><span>Subtotal</span><strong>' + GH.money(sub) + '</strong></div>' +
      note +
      '<div class="gh-cdrawer__actions">' +
        '<a class="gh-btn gh-btn--gold gh-btn--block" href="checkout.html">Checkout ' + icon('arrow', 15) + '</a>' +
        '<a class="gh-btn gh-btn--ghost gh-btn--block" href="cart.html">View bag</a>' +
        '<button class="gh-cdrawer__cont" type="button" data-gh-cd-close>Continue shopping</button>' +
      '</div>'
    ));
  }

  function lockScroll(on) {
    if (on) {
      var sw = W.innerWidth - D.documentElement.clientWidth;
      DR.padPrev = D.body.style.paddingRight;
      if (sw > 0) D.body.style.paddingRight = sw + 'px';
      D.body.classList.add('gh-drawer-open');
    } else {
      D.body.classList.remove('gh-drawer-open');
      D.body.style.paddingRight = DR.padPrev || '';
    }
  }

  function openDrawer(newKey) {
    if (!drawerAllowed()) return;
    buildDrawer();
    DR.newKey = newKey || null;
    renderDrawer(true);

    if (DR.open) return;                 // đã mở rồi thì chỉ vẽ lại nội dung
    if (DR.hideTimer) { clearTimeout(DR.hideTimer); DR.hideTimer = null; }

    DR.lastFocus = D.activeElement;
    DR.open = true;
    DR.$back.prop('hidden', false);
    DR.$el.prop('hidden', false);
    lockScroll(true);

    var go = function () { DR.$back.addClass('is-on'); DR.$el.addClass('is-on'); };
    if (reduced()) go(); else raf(function () { raf(go); });

    setTimeout(function () {
      if (!DR.open) return;
      var btn = DR.$el.find('[data-gh-cd-close]')[0];
      if (btn) btn.focus();
      else DR.$el[0].focus();
    }, reduced() ? 0 : 260);
  }

  function closeDrawer() {
    if (!DR.open || !DR.$el) return;
    DR.open = false;
    DR.newKey = null;
    DR.$el.removeClass('is-on');
    DR.$back.removeClass('is-on');
    lockScroll(false);

    DR.hideTimer = setTimeout(function () {
      if (!DR.open) { DR.$el.prop('hidden', true); DR.$back.prop('hidden', true); }
      DR.hideTimer = null;
    }, reduced() ? 0 : 480);

    if (DR.lastFocus && DR.lastFocus.focus && D.contains(DR.lastFocus)) {
      try { DR.lastFocus.focus(); } catch (e) {}
    }
    DR.lastFocus = null;
  }

  /* --- Sự kiện của drawer --- */
  $(D)
    .on('click', '.gh-cdrawer-back, [data-gh-cd-close]', function (e) {
      e.preventDefault();
      closeDrawer();
    })
    .on('click', '#ghCartDrawer [data-gh-cd-remove]', function () {
      var key = $(this).closest('.gh-cdrawer__row').attr('data-key');
      if (key) GH.cart.remove(key);
    })
    .on('gh:qty', '#ghCartDrawer [data-qty]', function (e, n) {
      var key = $(this).closest('.gh-cdrawer__row').attr('data-key');
      if (key) GH.cart.setQty(key, n);
    })
    .on('keydown.ghCartAnim', function (e) {
      if (!DR.open) return;
      if (e.key === 'Escape' || e.keyCode === 27) { closeDrawer(); return; }
      if (e.key !== 'Tab' && e.keyCode !== 9) return;

      /* Bẫy tiêu điểm trong panel */
      var $f = DR.$el.find('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
                     .filter(':visible');
      if (!$f.length) return;
      var first = $f[0], last = $f[$f.length - 1];
      if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
    });

  /* API nhỏ cho module khác dùng lại (không bắt buộc) */
  GH.cartDrawer = { open: openDrawer, close: closeDrawer, render: renderDrawer };

  /* ======================================================================
     6. Nối dây: click → ghi nhận nguồn, gh:cart-changed → chạy hiệu ứng
     ====================================================================== */
  var pending = null;

  /* Bắt ở pha CAPTURE để luôn lấy được toạ độ + ảnh TRƯỚC khi handler gốc
     của app.js/pages.js chạy (và không bị stopPropagation ảnh hưởng). */
  D.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest(CFG.triggers) : null;
    if (!t || t.disabled || $(t).hasClass('is-ghadded')) return;
    pending = {
      btn: t,
      at: Date.now(),
      before: GH.cart.count(),
      src: captureSource(t)
    };
  }, true);

  /* Giỏ thật sự đổi → mới phát hiệu ứng (đảm bảo không báo nhầm). */
  $(D).on('gh:cart-changed', function () {
    var p = pending;
    pending = null;

    /* Huỷ mọi hiệu ứng badge đang giữ; app.js đã set badge về số mới nhất. */
    cancelBadgeHold();

    var after = GH.cart.count();
    var added = p && (Date.now() - p.at <= CFG.pendingMs) && after > p.before;

    if (!added) { if (DR.open) renderDrawer(false); return; }

    /* (3) Nút bấm: chỉ báo "Added" khi giỏ đã đổi thật */
    markAdded(p.btn);

    var newKey = null;
    var last = GH.cart.items[GH.cart.items.length - 1];
    /* Khoá dòng vừa thêm để highlight trong drawer */
    var pid = $(p.btn).attr('data-quickadd') || $(p.btn).attr('data-buynow') ||
              $(p.btn).attr('data-gh-add') || (GH.param ? GH.param('id') : null);
    if (pid) {
      var match = GH.cart.items.filter(function (i) { return i.id === pid; });
      newKey = match.length ? match[match.length - 1].key : null;
    }
    if (!newKey && last) newKey = last.key;

    var anchor = cartAnchor();
    var dst = cartPoint(anchor);
    var gen;

    /* Việc phải làm ĐÚNG lúc "hàng chạm giỏ" */
    function arrive() {
      hitCart(anchor);
      ring(dst, Math.max(46, anchor && liveRect(anchor) ? liveRect(anchor).width * 1.4 : 46));
      countUp(p.before, after, gen);
      setTimeout(function () { openDrawer(newKey); }, reduced() ? 0 : CFG.drawerMs);
    }

    /* Giảm chuyển động, tab ẩn, hoặc không lấy được ảnh nguồn → phản hồi tức thì */
    if (reduced() || D.hidden || !p.src) {
      paintBadge(after, !reduced());
      openDrawer(newKey);
      if (!reduced() && !D.hidden) hitCart(anchor);
      return;
    }

    /* (2) Giữ badge ở số CŨ trong lúc ảnh còn bay — đếm tăng khi tới nơi */
    gen = ++badgeGen;
    paintBadge(p.before, false);

    /* (1) Bay */
    fly(p.src, dst, arrive);
  });

  /* ======================================================================
     7. Dọn dẹp — không để sót phần tử animation trong DOM
     ====================================================================== */
  $(W).on('pagehide beforeunload', function () { flushFlyers(false); });
  $(D).on('visibilitychange', function () { if (D.hidden) flushFlyers(true); });

  /* Header có thể được render lại (agent khác) → đồng bộ lại badge cho chắc */
  $(D).on('gh:header-ready', function () {
    cancelBadgeHold();
    paintBadge(GH.cart.count(), false);
  });

})(jQuery);
