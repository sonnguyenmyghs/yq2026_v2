/* ==========================================================================
   Module JS: banner
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Thời điểm chạy:
     $(document).on('yq:header-ready', fn)  -> sau khi header render xong
     $(document).on('yq:layout-ready', fn)  -> sau khi cả header + footer xong
     $(document).on('yq:cart-changed', fn)  -> mỗi khi giỏ hàng đổi
   Dùng event uỷ quyền ($(document).on('click', sel, fn)) cho DOM render động.

   Chức năng: hero carousel ở trang chủ
     - tự chuyển slide + thanh tiến trình
     - nút prev/next, dot indicator, phím mũi tên
     - dừng khi hover / focus / tab ẩn
     - vuốt (swipe) trên mobile
     - tôn trọng prefers-reduced-motion (không tự chạy)
   ========================================================================== */
(function ($) {
  'use strict';

  /* Thời lượng mỗi slide (ms) */
  var SLIDE_MS = 6200;
  /* Ngưỡng vuốt tối thiểu (px) để tính là đổi slide */
  var SWIPE_MIN = 45;

  /* Media query "giảm chuyển động" — hỗ trợ cả trình duyệt cũ */
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function prefersReduced() { return !!(mqReduce && mqReduce.matches); }

  /* Mũi tên nhỏ dùng trong nút CTA của promo banner */
  function arrowSvg() {
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           '<path d="M4 12h15"/><polyline points="13 6 19 12 13 18"/></svg>';
  }

  /* ======================================================================
     Hero slider
     ====================================================================== */
  function initHeroSlider() {
    var $root = $('#yqHeroSlider');
    if (!$root.length || $root.data('yqBannerInit')) return;
    $root.data('yqBannerInit', true);

    var $slides = $root.find('.yq-heroslide');
    var total = $slides.length;
    if (!total) return;

    /* Chỉ 1 slide thì không cần bộ điều khiển */
    if (total < 2) {
      $slides.addClass('is-active').attr('aria-hidden', 'false');
      $root.find('.yq-heroslider__foot, .yq-heroslider__prog').remove();
      return;
    }

    /* ---------- Dựng bộ điều khiển ---------- */
    var $ctrl = $root.find('.yq-heroslider__ctrl');
    var $prev = $(
      '<button type="button" class="yq-heroslider__btn" data-hero="prev" aria-label="Previous slide">' +
      YQ.icon('chevleft', 18) + '</button>');
    var $next = $(
      '<button type="button" class="yq-heroslider__btn" data-hero="next" aria-label="Next slide">' +
      YQ.icon('chevright', 18) + '</button>');
    $ctrl.find('.yq-heroslider__arrows').append($prev, $next);

    var $dots = $ctrl.find('.yq-heroslider__dots');
    $slides.each(function (i) {
      var label = $(this).data('title') || ('Slide ' + (i + 1));
      $dots.append(
        '<button type="button" class="yq-heroslider__dot" data-hero-go="' + i + '" role="tab" ' +
        'aria-label="' + YQ.escape(String(label)) + '" aria-selected="false"></button>'
      );
    });

    var $count = $ctrl.find('.yq-heroslider__count');
    var $prog = $root.find('.yq-heroslider__prog i');

    /* ---------- Trạng thái ---------- */
    var cur = 0;
    var elapsed = 0;      // ms đã trôi của slide hiện tại
    var lastTs = 0;       // mốc thời gian của khung hình trước
    var rafId = null;
    var hovering = false;
    var focusing = false;

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function paint() {
      $slides.each(function (i) {
        var on = (i === cur);
        $(this).toggleClass('is-active', on).attr('aria-hidden', on ? 'false' : 'true');
        /* Ảnh/nút của slide ẩn không được tab tới */
        $(this).find('a, button').attr('tabindex', on ? null : '-1');
      });
      $dots.children().each(function (i) {
        $(this).toggleClass('is-on', i === cur).attr('aria-selected', i === cur ? 'true' : 'false');
      });
      if ($count.length) $count.html('<b>' + pad(cur + 1) + '</b> / ' + pad(total));
    }

    function setProg(ratio) {
      if (!$prog.length) return;
      $prog.css('width', Math.max(0, Math.min(1, ratio)) * 100 + '%');
    }

    /** Chuyển tới slide index (tự vòng lại) */
    function go(index) {
      cur = ((index % total) + total) % total;
      elapsed = 0;
      lastTs = 0;
      setProg(0);
      paint();
    }

    /* ---------- Vòng lặp auto-play ---------- */
    function frame(ts) {
      rafId = window.requestAnimationFrame(frame);
      if (!lastTs) { lastTs = ts; return; }
      /* Chặn bước nhảy lớn khi tab vừa được bật lại */
      var dt = Math.min(ts - lastTs, 120);
      lastTs = ts;
      elapsed += dt;
      setProg(elapsed / SLIDE_MS);
      if (elapsed >= SLIDE_MS) go(cur + 1);
    }

    function canPlay() {
      return !prefersReduced() && !hovering && !focusing && !document.hidden;
    }

    function play() {
      if (rafId || !canPlay()) return;
      lastTs = 0;
      $root.removeClass('is-paused');
      rafId = window.requestAnimationFrame(frame);
    }

    function pause() {
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
      $root.addClass('is-paused');
    }

    /** Gọi sau mỗi thay đổi trạng thái để bật/tắt cho đúng */
    function sync() { if (canPlay()) play(); else pause(); }

    /* ---------- Sự kiện ---------- */
    $root.on('click', '[data-hero="prev"]', function () { go(cur - 1); sync(); });
    $root.on('click', '[data-hero="next"]', function () { go(cur + 1); sync(); });
    $root.on('click', '[data-hero-go]', function () { go(parseInt($(this).attr('data-hero-go'), 10)); sync(); });

    /* Dừng khi rê chuột lên banner */
    $root.on('mouseenter', function () { hovering = true; sync(); });
    $root.on('mouseleave', function () { hovering = false; sync(); });

    /* Dừng khi bàn phím đang focus trong banner (bàn phím & screen reader) */
    $root.on('focusin', function () { focusing = true; sync(); });
    $root.on('focusout', function () { focusing = false; sync(); });

    /* Dừng khi tab bị ẩn */
    $(document).on('visibilitychange.yqBanner', sync);

    /* Phím mũi tên khi banner đang được focus */
    $root.on('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(cur - 1); sync(); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { go(cur + 1); sync(); e.preventDefault(); }
    });

    /* Vuốt trên mobile */
    var tx = 0, ty = 0, tracking = false;
    $root.on('touchstart', function (e) {
      var t = e.originalEvent.touches[0];
      tx = t.clientX; ty = t.clientY; tracking = true;
      hovering = true; sync();                       // tạm dừng trong lúc vuốt
    });
    $root.on('touchmove', function (e) {
      if (!tracking) return;
      var t = e.originalEvent.touches[0];
      /* Vuốt ngang rõ rệt -> chặn cuộn dọc để thao tác mượt */
      if (Math.abs(t.clientX - tx) > Math.abs(t.clientY - ty) + 8 && e.cancelable) e.preventDefault();
    });
    $root.on('touchend touchcancel', function (e) {
      if (!tracking) return;
      tracking = false;
      var t = (e.originalEvent.changedTouches || [])[0];
      if (t) {
        var dx = t.clientX - tx, dy = t.clientY - ty;
        if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? cur + 1 : cur - 1);
      }
      hovering = false; sync();
    });

    /* Người dùng đổi thiết lập "giảm chuyển động" ngay lúc đang xem */
    if (mqReduce) {
      if (mqReduce.addEventListener) mqReduce.addEventListener('change', sync);
      else if (mqReduce.addListener) mqReduce.addListener(sync);
    }

    /* ---------- Khởi động ---------- */
    go(0);
    sync();
  }

  /* ======================================================================
     Promo strip: chèn icon mũi tên vào các CTA
     ====================================================================== */
  function initPromoStrip() {
    $('.yq-promo__cta').each(function () {
      var $el = $(this);
      if ($el.find('svg').length) return;
      $el.append(arrowSvg());
    });
  }

  /* ======================================================================
     Điểm vào
     ====================================================================== */
  function boot() {
    initHeroSlider();
    initPromoStrip();
  }

  $(document).on('yq:layout-ready', boot);
  /* Dự phòng: nếu vì lý do nào đó layout-ready không bắn, vẫn chạy sau ready */
  $(function () { setTimeout(boot, 0); });

})(jQuery);
