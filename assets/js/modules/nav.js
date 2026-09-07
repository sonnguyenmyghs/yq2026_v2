/* ==========================================================================
   Module JS: nav — hành vi của header
   Toàn bộ tương tác header nằm ở đây (app.js chỉ còn phần dựng markup).

   Phụ thuộc class do assets/css/parts/nav.css định nghĩa:
     #ghHeader.is-stuck      đã cuộn khỏi đỉnh  -> đổi nền/đổ bóng
     #ghHeader.is-compact    đang cuộn xuống    -> desktop thu gọn, mobile ẩn header
     #ghHeader.has-panel     có panel đang mở   -> nền đặc + lớp phủ
     #ghHeader.is-searching  ô tìm kiếm đang mở
     .gh-navpanel.is-open    panel (#ghMega / #ghSeasonal) đang mở
     .gh-nav__item.is-open   mục nav đang giữ panel
     .gh-search.is-open      panel tìm kiếm đang mở
   ========================================================================== */
(function ($) {
  'use strict';

  var HEADER = '#ghHeader';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $header() { return $(HEADER); }
  function isDesktop() { return window.matchMedia('(min-width: 992px)').matches; }

  /* ======================================================================
     1. Cuộn: is-stuck (rời đỉnh) + is-compact (đang cuộn xuống)
     ====================================================================== */
  var lastY = 0, ticking = false;

  function onScroll() {
    var y = Math.max(0, window.scrollY || window.pageYOffset || 0);
    var $h = $header();
    if (!$h.length) { lastY = y; return; }

    $h.toggleClass('is-stuck', y > 8);

    // Không thu gọn khi đang mở panel/search, hoặc khi vừa mới rời đỉnh.
    if ($h.hasClass('has-panel') || $h.hasClass('is-searching')) {
      $h.removeClass('is-compact');
    } else if (y < 140) {
      $h.removeClass('is-compact');                 // gần đỉnh: luôn hiện đầy đủ
    } else if (y > lastY + 4) {
      $h.addClass('is-compact');                    // cuộn xuống: thu gọn / ẩn
    } else if (y < lastY - 4) {
      $h.removeClass('is-compact');                 // cuộn lên: hiện lại ngay
    }
    lastY = y;
  }

  // Đăng ký đúng namespace vì app.js gọi $(window).trigger('scroll.ghHeader')
  $(window).on('scroll.ghHeader resize.ghHeader', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; onScroll(); });
  });

  /* ======================================================================
     2. Panel thả xuống: #ghMega (Shop by Category) + #ghSeasonal
     ====================================================================== */
  var closeTimer = null;

  function panelIdOf(kind) { return kind === 'seasonal' ? '#ghSeasonal' : '#ghMega'; }

  function closePanels(immediate) {
    clearTimeout(closeTimer);
    var done = function () {
      $('.gh-navpanel').removeClass('is-open');
      $('.gh-nav__item').removeClass('is-open')
        .find('[aria-expanded]').attr('aria-expanded', 'false');
      $header().removeClass('has-panel');
    };
    if (immediate || reduceMotion) done();
    else closeTimer = setTimeout(done, 160);
  }

  function openPanel(kind, $item) {
    clearTimeout(closeTimer);
    var $panel = $(panelIdOf(kind));
    if (!$panel.length) return;

    $('.gh-navpanel').not($panel).removeClass('is-open');
    $('.gh-nav__item').not($item).removeClass('is-open')
      .find('[aria-expanded]').attr('aria-expanded', 'false');

    $panel.addClass('is-open');
    $item.addClass('is-open').find('[aria-expanded]').attr('aria-expanded', 'true');
    $header().addClass('has-panel').removeClass('is-compact');
    closeSearch();
  }

  // Desktop: hover mở. Mobile/tablet: dùng offcanvas nên bỏ qua.
  $(document)
    .on('mouseenter', '.gh-nav__item--panel', function () {
      if (!isDesktop()) return;
      openPanel($(this).attr('data-panel'), $(this));
    })
    .on('mouseleave', '.gh-nav__item--panel, .gh-navpanel', function () {
      if (!isDesktop()) return;
      closePanels();
    })
    .on('mouseenter', '.gh-navpanel', function () { clearTimeout(closeTimer); });

  // Bấm: mở/đóng (cần cho thiết bị cảm ứng và cho mục Seasonal vốn là <button>)
  $(document).on('click', '.gh-nav__item--panel > .gh-nav__link', function (e) {
    var $item = $(this).closest('.gh-nav__item');
    var kind = $item.attr('data-panel');
    var isOpen = $item.hasClass('is-open');

    // Thẻ <button> (Seasonal) không có link -> luôn chặn mặc định.
    // Thẻ <a> (Shop by Category) chỉ chặn ở lần chạm đầu để mở panel.
    if (this.tagName === 'BUTTON') e.preventDefault();
    else if (!isOpen && !isDesktop()) e.preventDefault();

    if (isOpen) closePanels(true); else openPanel(kind, $item);
  });

  // Bàn phím: mở panel khi focus vào mục có panel
  $(document).on('focusin', '.gh-nav__item--panel > .gh-nav__link', function () {
    var $item = $(this).closest('.gh-nav__item');
    openPanel($item.attr('data-panel'), $item);
  });

  /* ======================================================================
     3. Ô tìm kiếm
     ====================================================================== */
  function searchOpen() { return $('#ghSearch').hasClass('is-open'); }

  function closeSearch() {
    if (!searchOpen()) return;
    $('#ghSearch').removeClass('is-open').attr('aria-hidden', 'true');
    $header().removeClass('is-searching has-panel');
    $('[data-search-toggle][aria-expanded]').attr('aria-expanded', 'false');
  }

  function openSearch() {
    closePanels(true);
    $('#ghSearch').addClass('is-open').attr('aria-hidden', 'false');
    $header().addClass('is-searching has-panel').removeClass('is-compact');
    $('[data-search-toggle][aria-expanded]').attr('aria-expanded', 'true');
    setTimeout(function () { $('#ghSearchInput').trigger('focus'); }, reduceMotion ? 0 : 120);
  }

  $(document).on('click', '[data-search-toggle]', function (e) {
    e.preventDefault();
    if (searchOpen()) closeSearch(); else openSearch();
  });

  $(document).on('click', '[data-search-clear]', function () {
    $('#ghSearchInput').val('').trigger('input').trigger('focus');
  });

  $(document).on('click', '[data-suggest]', function () {
    $('#ghSearchInput').val($(this).attr('data-suggest')).trigger('input').trigger('focus');
  });

  $(document).on('submit', '#ghSearchForm', function (e) {
    e.preventDefault();
    var q = $.trim($('#ghSearchInput').val());
    window.location.href = 'shop.html' + (q ? '?q=' + encodeURIComponent(q) : '');
  });

  /* Phím tắt: "/" mở tìm kiếm, Esc đóng mọi thứ */
  $(document).on('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || (e.target && e.target.isContentEditable);

    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openSearch();
      return;
    }
    if (e.key === 'Escape') {
      closeSearch();
      closePanels(true);
    }
  });

  /* Bấm ra ngoài header thì đóng panel + search */
  $(document).on('click', function (e) {
    if ($(e.target).closest('#ghHeader').length) return;
    closeSearch();
    closePanels(true);
  });

  /* ======================================================================
     4. Badge giỏ hàng trong offcanvas mobile
     ====================================================================== */
  function syncOcBadge() {
    if (!GH.cart) return;
    var n = GH.cart.count();
    $('[data-oc-count]').text(n).toggleClass('is-on', n > 0);
  }

  $(document).on('gh:cart-changed gh:header-ready gh:layout-ready', syncOcBadge);

  /* Đóng panel khi mở offcanvas, và reset trạng thái cuộn sau khi header render */
  $(document).on('show.bs.offcanvas', '#ghOffcanvas', function () {
    closeSearch();
    closePanels(true);
  });

  $(document).on('gh:header-ready', function () {
    lastY = Math.max(0, window.scrollY || 0);
    onScroll();
    syncOcBadge();
  });

  $(function () { onScroll(); });

})(jQuery);
