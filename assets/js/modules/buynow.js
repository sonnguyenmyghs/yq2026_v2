/* ==========================================================================
   Module JS: buynow — đường "mua nhanh" (thêm vào giỏ rồi sang thẳng checkout)
   Nạp sau data.js / app.js / pages.js nên dùng được GH.*, jQuery, Bootstrap 5.

   Gồm 3 điểm chạm:
     1. Trang chi tiết (product.html): nút "Buy Now" cạnh "Add to cart",
        nhãn cập nhật theo option + số lượng đang chọn.
     2. Card sản phẩm (home/shop/celebrations): nút "Buy now" trong overlay hover.
     3. Sticky buy bar ở mobile (<992px) khi cuộn qua khỏi nút mua chính.

   Ghi chú: module KHÔNG sửa pages.js — trạng thái PDP được đọc ngược từ DOM
   (`#pdpOptions .gh-option.is-active[data-opt]` và `#pdpQty [data-qty-val]`).
   ========================================================================== */
(function ($) {
  'use strict';

  var CHECKOUT_URL = 'checkout.html';
  var REDIRECT_DELAY = 420;   // ms — đủ để thấy spinner, không làm user chờ lâu
  var busy = false;           // khoá toàn cục: chặn bấm 2 lần gây thêm trùng

  /* ======================================================================
     0. Tiện ích chung
     ====================================================================== */

  /** Icon tia sét — dấu hiệu thị giác cho hành động "mua nhanh". */
  function boltIcon(size) {
    var s = size || 16;
    return '<svg class="gh-i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/></svg>';
  }

  /**
   * Chạy luồng mua nhanh: khoá nút -> thêm vào giỏ -> chuyển sang checkout.
   * @param {jQuery} $btn   nút vừa bấm (để hiện spinner)
   * @param {Object} p      sản phẩm trong GH.products
   * @param {Object} opt    1 phần tử của p.options
   * @param {Number} qty    số lượng
   */
  function runBuyNow($btn, p, opt, qty) {
    if (busy || !p) return;
    busy = true;

    $('[data-buynow], #pdpBuyNow, #pdpBarBuy').addClass('is-disabled');
    $btn.removeClass('is-disabled').addClass('is-buying').attr('aria-busy', 'true');

    GH.cart.add(p, opt, qty || 1);

    setTimeout(function () {
      window.location.href = CHECKOUT_URL;
    }, REDIRECT_DELAY);

    /* Phòng khi trình duyệt chặn/huỷ điều hướng (hoặc user bấm Back):
       trả nút về trạng thái bình thường sau 2.5s. */
    setTimeout(function () {
      busy = false;
      $('[data-buynow], #pdpBuyNow, #pdpBarBuy').removeClass('is-disabled is-buying').removeAttr('aria-busy');
    }, 2500);
  }

  /* ======================================================================
     1. Trang chi tiết sản phẩm (PDP)
     ====================================================================== */

  var pdpProduct = null;      // cache sản phẩm của trang

  function pdpInit() {
    if (pdpProduct) return pdpProduct;
    if (!$('#pdpBuyNow').length || !GH.products || !GH.products.length) return null;
    var id = GH.param('id') || GH.products[0].id;
    pdpProduct = GH.product(id) || GH.products[0];
    return pdpProduct;
  }

  /** Đọc trạng thái đang chọn trực tiếp từ DOM (pages.js giữ state, ta chỉ đọc). */
  function pdpState() {
    var p = pdpInit();
    if (!p) return null;

    var opts = p.options || [];
    // attr() chứ không dùng data(): '12'/'200' bị jQuery ép thành number
    var optId = $('#pdpOptions .gh-option.is-active').attr('data-opt');
    var opt = null;
    if (optId != null) {
      opt = opts.filter(function (o) { return String(o.id) === String(optId); })[0] || null;
    }
    if (!opt) opt = opts[0] || null;

    var qty = parseInt($('#pdpQty [data-qty-val]').first().text(), 10);
    if (!qty || qty < 1) qty = 1;

    return { product: p, option: opt, qty: qty };
  }

  /** Đồng bộ nhãn nút Buy Now + nội dung sticky bar theo option/số lượng. */
  function pdpSync() {
    var st = pdpState();
    if (!st || !st.option) return;

    var line = st.option.price * st.qty;

    $('#pdpBuyLabel').text('Buy Now — ' + GH.money0(line));
    $('#pdpBuyNow').attr('aria-label',
      'Buy now: ' + st.product.name + ' — ' + st.option.label + ' × ' + st.qty);

    $('#pdpBarName').text(st.product.name);
    $('#pdpBarPrice').text(GH.money0(line));
    $('#pdpBarOpt').text(st.option.label + (st.qty > 1 ? ' × ' + st.qty : ''));
  }

  /* ======================================================================
     2. Sticky buy bar (mobile)
     ====================================================================== */

  var barTicking = false;

  function barUpdate() {
    barTicking = false;
    var bar = document.getElementById('pdpBuyBar');
    var anchor = document.getElementById('pdpBuyActions');
    if (!bar || !anchor) return;

    // Chỉ hiện ở mobile; desktop CSS đã display:none nhưng vẫn khoá luôn ở JS
    var isMobile = window.matchMedia('(max-width: 991.98px)').matches;
    var passed = anchor.getBoundingClientRect().bottom < 8;   // đã cuộn qua nút mua chính
    var on = isMobile && passed;

    bar.classList.toggle('is-on', on);
    bar.setAttribute('aria-hidden', on ? 'false' : 'true');
    document.body.classList.toggle('gh-buybar-on', on);
  }

  function barRequest() {
    if (barTicking) return;
    barTicking = true;
    window.requestAnimationFrame(barUpdate);
  }

  /* ======================================================================
     3. Card sản phẩm — chèn nút "Buy now" vào overlay hover
     ====================================================================== */

  /** Chèn nút mua nhanh vào mọi .gh-quickadd chưa được xử lý. */
  function decorateCards() {
    $('.gh-quickadd').not('[data-buynow-ready]').each(function () {
      var $wrap = $(this).attr('data-buynow-ready', '1');
      var id = $wrap.find('[data-quickadd]').attr('data-quickadd');
      if (!id) return;

      var p = GH.product(id);
      var name = p ? p.name : id;

      $wrap.addClass('gh-quickadd--duo').append(
        '<button class="gh-btn gh-btn--sm gh-buynow-mini" type="button" ' +
          'data-buynow="' + id + '" aria-label="Buy now: ' + GH.escape(name) + '">' +
          boltIcon(14) + '<span>Buy now</span>' +
        '</button>'
      );
    });
  }

  var cardTimer = null;
  function decorateSoon() {
    clearTimeout(cardTimer);
    cardTimer = setTimeout(decorateCards, 0);
  }

  /* ======================================================================
     4. Bind
     ====================================================================== */

  /* -- PDP: nút Buy Now chính -- */
  $(document).on('click', '#pdpBuyNow, #pdpBarBuy', function (e) {
    e.preventDefault();
    var st = pdpState();
    if (!st) return;
    runBuyNow($(this), st.product, st.option, st.qty);
  });

  /* -- Card: nút Buy now trong overlay (DOM render động -> uỷ quyền) -- */
  $(document).on('click', '[data-buynow]', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var p = GH.product($(this).attr('data-buynow'));
    if (!p) return;
    runBuyNow($(this), p, p.options && p.options[0], 1);
  });

  /* -- Đồng bộ nhãn khi đổi option / số lượng --
     Handler của pages.js đăng ký SAU module này nên khi handler ta chạy thì
     class .is-active chưa kịp đổi -> hoãn 1 tick rồi mới đọc DOM. */
  $(document).on('click', '#pdpOptions .gh-option', function () { setTimeout(pdpSync, 0); });
  $(document).on('click', '#pdpQty [data-step]', function () { setTimeout(pdpSync, 0); });
  $(document).on('gh:qty', '#pdpQty', function () { setTimeout(pdpSync, 0); });

  /* -- Khởi động sau khi layout render xong -- */
  $(document).on('gh:layout-ready', function () {
    // setTimeout 0: đợi GH.initProduct()/initHome()… trong inline script render xong
    setTimeout(function () {
      decorateCards();
      pdpSync();
      barUpdate();
    }, 0);

    // Card có thể render lại (lọc shop, phân trang…) -> theo dõi DOM
    if (window.MutationObserver && !decorateCards._observing) {
      decorateCards._observing = true;
      new MutationObserver(decorateSoon).observe(document.body, { childList: true, subtree: true });
    }
  });

  /* -- Sticky bar theo scroll/resize -- */
  $(window).on('scroll.ghBuyNow resize.ghBuyNow', barRequest);

  /* Giỏ đổi (kể cả từ tab khác) -> nhãn giá không phụ thuộc giỏ, chỉ cần bar đúng vị trí */
  $(document).on('gh:cart-changed', barRequest);

})(jQuery);
