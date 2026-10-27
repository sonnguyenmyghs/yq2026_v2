/* ==========================================================================
   Module JS: cart-anim — Hiệu ứng "thêm vào giỏ" cao cấp
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Gồm 4 mảng:
     1) Fly-to-cart : ảnh sản phẩm bay theo đường cong bezier tới icon giỏ,
                      nhỏ dần + mờ dần rồi tự xoá khỏi DOM.
     2) Icon giỏ    : nảy nhẹ + vòng sáng vàng, badge đếm tăng ĐÚNG lúc ảnh
                      chạm nơi (giữ số cũ trong lúc bay, không lệch nhịp).
     3) Nút bấm     : chuyển sang "Added" (tích vàng) ~1.2s, chặn spam click.
     4) Cart drawer : panel trượt từ phải, đóng bằng click nền / Esc, khoá cuộn.
                      Dòng hàng + note free ship là HTML tĩnh trong trang; JS chỉ
                      đổi text / class. Riêng khối ảnh bay (.yq-fly), vòng sáng
                      (.yq-fly-ring) và lớp "Added" trên nút là hiệu ứng tạm do JS
                      tạo rồi tự xoá.

   Nguyên tắc an toàn:
     - Không sửa file nào khác; chỉ gắn vào DOM + event có sẵn.
     - Luôn kiểm tra phần tử tồn tại (header có thể được agent khác đổi markup).
     - Tôn trọng prefers-reduced-motion: bỏ hết chuyển động, giữ phản hồi tức thì.
   ========================================================================== */
(function ($) {
  'use strict';

  if (!window.YQ || !YQ.cart) return;      // fallback êm nếu core chưa sẵn sàng

  var D = document;
  var W = window;

  /* ======================================================================
     0. Cấu hình + tiện ích
     ====================================================================== */
  var CFG = {
    /* Mọi điểm bấm "thêm vào giỏ" hiện có (và [data-buynow] của agent khác
       nếu nó tồn tại — không bắt buộc phải có). */
    /* Buy now (data-buynow="1") đi thẳng sang giỏ nên không bay / không mở drawer. */
    triggers: '.addToCart:not([data-buynow="1"]), [data-quickadd], [data-yq-add]',
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
    var ids = ['yqCartCount', 'yqCartCountM'], i, badge, anchor;
    for (i = 0; i < ids.length; i++) {
      badge = D.getElementById(ids[i]);
      if (!badge) continue;
      anchor = (badge.closest && badge.closest('.yq-iconbtn, a, button')) || badge.parentNode;
      if (liveRect(anchor)) return anchor;
    }
    /* Header có thể đã đổi markup — thử bắt bất kỳ link giỏ nào đang hiện. */
    var alts = D.querySelectorAll('#yqHeader a[href*="cart.html"], header a[href*="cart.html"]');
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
    if ($btn.closest('.yq-pdp, .yq-pdp__gallery').length) {
      $m = $('#pdpMain').find('img, .yq-media__ph').first();
    }
    /* Card sản phẩm / dòng giỏ / panel */
    if (!$m.length) {
      var $scope = $btn.closest('.yq-card, .yq-line, .yq-panel, .yq-feature, article');
      if ($scope.length) {
        $m = $scope.find('.yq-card__mediawrap img, .yq-card__mediawrap .yq-media__ph, .yq-media img, .yq-media__ph').first();
      }
    }

    var mediaEl = $m[0] || null;
    var r = mediaEl ? liveRect(mediaEl) : null;
    var html = '';

    if (r) {
      html = mediaEl.outerHTML;
    } else {
      /* Không thấy ảnh trong DOM → dựng lại từ dữ liệu sản phẩm. */
      var id = $btn.attr('data-productid') || $btn.attr('data-quickadd') ||
               $btn.attr('data-yq-add') || (YQ.param ? YQ.param('id') : null);
      var p = (id && YQ.product) ? YQ.product(id) : null;
      if (p && YQ.mediaInner) html = YQ.mediaInner(p, { eager: true });
      r = liveRect(btn);
      if (!r) return null;
      /* Khung vuông đặt giữa nút bấm */
      var side = 76;
      r = { left: r.left + r.width / 2 - side / 2, top: r.top + r.height / 2 - side / 2, width: side, height: side };
    }
    if (!html) html = '<span class="yq-media__ph ph-2"></span>';

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
    el.className = 'yq-fly';
    el.setAttribute('aria-hidden', 'true');
    el.style.width = src.w + 'px';
    el.style.height = src.h + 'px';
    el.innerHTML = '<div class="yq-fly__box"><div class="yq-fly__media yq-media">' + src.html + '</div></div>';

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

  function $badges() { return $('#yqCartCount, #yqCartCountM'); }

  function paintBadge(n, pop) {
    $badges().each(function () {
      var $b = $(this);
      /* gỡ .is-bump của app.js: badge chỉ được nhảy đúng lúc ảnh chạm giỏ */
      $b.text(n).toggleClass('is-on', n > 0).removeClass('is-bump');
      if (pop && n > 0) {
        $b.removeClass('is-yqcount');
        void this.offsetWidth;          // reflow để chạy lại keyframes
        $b.addClass('is-yqcount');
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
    el.className = 'yq-fly-ring';
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
    $a.removeClass('is-yqcart-hit');
    void anchor.offsetWidth;
    $a.addClass('is-yqcart-hit');
    setTimeout(function () { $a.removeClass('is-yqcart-hit'); }, 700);
  }

  /* ======================================================================
     4. Phản hồi tại nút bấm — trạng thái "Added"
     ====================================================================== */
  function tickIcon() {
    return YQ.icon ? YQ.icon('check', 11)
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" ' +
        'stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 9.5 18 20 6.5"/></svg>';
  }

  function markAdded(btn) {
    if (!btn || !btn.parentNode) return;
    var $b = $(btn);
    if ($b.hasClass('is-yqadded')) return;

    /* Lấy màu chữ THẬT trước khi làm trong suốt — nút quick add và nút PDP
       có nền/màu khác nhau nên không thể hardcode. */
    var fg = W.getComputedStyle(btn).color || 'currentColor';

    var $layer = $('<span class="yq-added-layer" aria-hidden="true">' +
                     '<span class="yq-added-layer__tick">' + tickIcon() + '</span>' +
                     '<span>Added</span>' +
                   '</span>').css('color', fg);

    $b.addClass('is-yqadded').attr('aria-disabled', 'true').append($layer);

    setTimeout(function () {
      $b.removeClass('is-yqadded').removeAttr('aria-disabled');
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

  /* Production: trang có <span id="root" data-base="…"> — giỏ nằm ở session server. */
  function isServer() { return !!D.getElementById('root'); }

  /* Khung sidebar là HTML tĩnh trong mỗi trang (khối <!-- CART SIDEBAR -->, PHP đổ giỏ
     từ session). JS không dựng markup — chỉ lấy tham chiếu tới khung có sẵn. */
  function buildDrawer() {
    if (DR.$el) return true;
    if (!$('#yqCartDrawer').length) return false;
    DR.$el = $('#yqCartDrawer');
    DR.$back = $('.yq-cdrawer-back');
    return true;
  }

  /** Giỏ trống -> ẩn danh sách + footer, hiện khối "Your bag is empty". */
  function syncEmpty() {
    $('#yqCartDrawer').toggleClass('is-empty', $('#yqCdList').children().length === 0);
  }

  /* Bản demo HTML (không có PHP / #root): các dòng trong #yqCdList là HTML tĩnh
     (dòng mẫu thay cho {$contentCartHtml}). JS không dựng dòng nào — chỉ tính lại
     text thành tiền mỗi dòng (data-price × số lượng), số món, subtotal và thanh
     free shipping trên các phần tử đã có. Production: PHP / add-to-cart.js lo hết. */
  function renderDrawer(animate) {
    if (isServer() || !buildDrawer()) return;
    $('#yqCdBody').toggleClass('is-static', animate === false);

    var n = 0, sub = 0;
    $('#yqCdList .yq-cdrawer__row').each(function () {
      var $r = $(this);
      var qty = parseInt($r.find('[data-qty-val]').text(), 10) || 0;
      var line = (parseFloat($r.attr('data-price')) || 0) * qty;
      $r.find('.yq-cdrawer__price').text(YQ.money(line));
      n += qty;
      sub += line;
    });

    $('#yqCdN').text(n === 1 ? '1 item' : n + ' items');
    $('#yqCdTotal').text(YQ.money(sub));

    /* Thanh "còn X nữa để free shipping": 2 note tĩnh loại trừ nhau, JS chỉ đổi text/width */
    var thr = (YQ.config && YQ.config.freeShippingThreshold) || 0;
    var toFree = Math.max(0, thr - sub);
    $('#yqCdToFree').text(YQ.money(toFree));
    $('#yqCdShipBar').css('width', (thr ? Math.min(100, (sub / thr) * 100) : 100) + '%');
    $('#yqCdShipNote').toggleClass('d-none', toFree <= 0);
    $('#yqCdShipFree').toggleClass('d-none', toFree > 0);

    syncEmpty();
  }

  function lockScroll(on) {
    if (on) {
      var sw = W.innerWidth - D.documentElement.clientWidth;
      DR.padPrev = D.body.style.paddingRight;
      if (sw > 0) D.body.style.paddingRight = sw + 'px';
      D.body.classList.add('yq-drawer-open');
    } else {
      D.body.classList.remove('yq-drawer-open');
      D.body.style.paddingRight = DR.padPrev || '';
    }
  }

  /**
   * Mở cart sidebar.
   *   - Production (có #root): nội dung PHP đã in sẵn / add-to-cart.js vừa cập nhật -> chỉ mở.
   *   - Demo: tính lại text trên các dòng tĩnh trong #yqCdList rồi mở (dòng mẫu cố
   *     định — không thêm dòng cho sản phẩm vừa bấm, xem renderDrawer).
   * opts.browsing: mở từ icon giỏ ở header (không phải vừa thêm hàng).
   */
  function openDrawer(newKey, opts) {
    if (!drawerAllowed() || !buildDrawer()) return;
    DR.newKey = newKey || null;
    /* Bấm icon giỏ thì đừng nói "Added to your bag" — không có gì vừa được thêm. */
    $('#yqCdEyebrow').text((opts && opts.browsing) ? 'Your shopping bag' : 'Added to your bag');
    renderDrawer(true);
    syncEmpty();
    showPanel();
  }

  /** Mở panel drawer (nội dung đã được vẽ sẵn). */
  function showPanel() {
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
      var btn = DR.$el.find('[data-yq-cd-close]')[0];
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
    .on('click', '.yq-cdrawer-back, [data-yq-cd-close]', function (e) {
      e.preventDefault();
      closeDrawer();
    })
    /* Demo: gỡ dòng có sẵn / đổi số rồi tính lại text. Production (#root): dòng do
       server in ({$contentCartHtml}) — không đụng tới, giữ hành vi của backend. */
    .on('click', '#yqCartDrawer [data-yq-cd-remove]', function () {
      if (isServer()) return;
      $(this).closest('.yq-cdrawer__row').remove();
      renderDrawer(false);
    })
    .on('yq:qty', '#yqCartDrawer [data-qty]', function () {
      if (isServer()) return;
      renderDrawer(false);
    })
    .on('keydown.yqCartAnim', function (e) {
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

  /* --- Bấm icon giỏ ở header -> mở drawer thay vì sang cart.html ---
     Vẫn để nguyên href="cart.html" làm đường lui: Ctrl/Cmd-click mở tab mới,
     ở cart.html/checkout.html thì đi tiếp như cũ, và không có JS vẫn sang được trang. */
  $(D).on('click', '[data-yq-cart]', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    if (!drawerAllowed()) return;
    /* Chế độ server: chưa có dữ liệu giỏ (chưa add lần nào ở trang này) thì
       đi theo href sang trang giỏ của backend. */
    if (!buildDrawer()) return;          // trang không có khung sidebar -> đi theo href
    e.preventDefault();
    openDrawer(null, { browsing: true });
  });

  /* API nhỏ cho module khác dùng lại (không bắt buộc) */
  YQ.cartDrawer = {
    open: openDrawer, close: closeDrawer, render: renderDrawer,
    show: function (opts) { openDrawer(null, opts); },      // add-to-cart.js (production)
    syncEmpty: syncEmpty
  };

  /* Nội dung PHP in sẵn: đồng bộ trạng thái trống ngay khi tải trang */
  $(syncEmpty);

  /* ======================================================================
     6. Nối dây: click → ghi nhận nguồn, yq:cart-changed → chạy hiệu ứng
     ====================================================================== */
  var pending = null;

  /* Bắt ở pha CAPTURE để luôn lấy được toạ độ + ảnh TRƯỚC khi handler gốc
     của app.js/pages.js chạy (và không bị stopPropagation ảnh hưởng). */
  D.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest(CFG.triggers) : null;
    if (!t || t.disabled || $(t).hasClass('is-yqadded')) return;
    pending = {
      btn: t,
      at: Date.now(),
      before: YQ.cart.count(),
      src: captureSource(t)
    };
  }, true);

  /* Giỏ thật sự đổi → mới phát hiệu ứng (đảm bảo không báo nhầm). */
  $(D).on('yq:cart-changed', function () {
    var p = pending;
    pending = null;

    /* Huỷ mọi hiệu ứng badge đang giữ; app.js đã set badge về số mới nhất. */
    cancelBadgeHold();

    var after = YQ.cart.count();
    var added = p && (Date.now() - p.at <= CFG.pendingMs) && after > p.before;

    if (!added) { if (DR.open) renderDrawer(false); return; }
    play(p, after, true);
  });

  /**
   * Phát hiệu ứng thêm vào giỏ: nút "Added" → bay → badge đếm tăng → (drawer).
   * @param {Object}  p       { btn, before, src } — bản ghi lúc click
   * @param {Number}  after   số lượng trong giỏ sau khi thêm
   * @param {Boolean|Function} drawer  true: mở drawer vẽ từ YQ.cart; function: hàm
   *                          tự mở drawer (giỏ server); false: không mở
   */
  function play(p, after, drawer) {
    var showDrawer = typeof drawer === 'function' ? drawer : (drawer ? openDrawer : function () {});

    /* (3) Nút bấm: chỉ báo "Added" khi giỏ đã đổi thật */
    markAdded(p.btn);

    var newKey = null;
    var last = YQ.cart.items[YQ.cart.items.length - 1];
    /* Khoá dòng vừa thêm để highlight trong drawer */
    var pid = $(p.btn).attr('data-productid') || $(p.btn).attr('data-quickadd') ||
              $(p.btn).attr('data-yq-add') || (YQ.param ? YQ.param('id') : null);
    if (pid) {
      var match = YQ.cart.items.filter(function (i) { return i.id === pid; });
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
      setTimeout(function () { showDrawer(newKey); }, reduced() ? 0 : CFG.drawerMs);
    }

    /* Giảm chuyển động, tab ẩn, hoặc không lấy được ảnh nguồn → phản hồi tức thì */
    if (reduced() || D.hidden || !p.src) {
      paintBadge(after, !reduced());
      showDrawer(newKey);
      if (!reduced() && !D.hidden) hitCart(anchor);
      return;
    }

    /* (2) Giữ badge ở số CŨ trong lúc ảnh còn bay — đếm tăng khi tới nơi */
    gen = ++badgeGen;
    paintBadge(p.before, false);

    /* (1) Bay */
    fly(p.src, dst, arrive);
  }

  /* Giỏ ở server (add-to-cart.js, chế độ production): YQ.cart không đổi nên
     không có yq:cart-changed — module đó gọi thẳng hàm này sau khi AJAX xong. */
  YQ.cartFx = {
    /* onArrive: chạy lúc ảnh chạm giỏ (VD: mở drawer với dữ liệu server). */
    added: function (btn, before, after, onArrive) {
      var p = pending;
      pending = null;
      cancelBadgeHold();
      if (!p || p.btn !== btn) p = { btn: btn, before: before, src: captureSource(btn) };
      p.before = before;
      play(p, after, onArrive || false);
    }
  };

  /* ======================================================================
     7. Dọn dẹp — không để sót phần tử animation trong DOM
     ====================================================================== */
  $(W).on('pagehide beforeunload', function () { flushFlyers(false); });
  $(D).on('visibilitychange', function () { if (D.hidden) flushFlyers(true); });

  /* Header có thể được render lại (agent khác) → đồng bộ lại badge cho chắc */
  $(D).on('yq:header-ready', function () {
    cancelBadgeHold();
    if ($('#root').length) return;       // chế độ server: app.js đã bật badge theo số PHP in sẵn
    paintBadge(YQ.cart.count(), false);
  });

})(jQuery);
