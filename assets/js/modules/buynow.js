/* ==========================================================================
   Module JS: buynow — đường "mua nhanh" (thêm vào giỏ rồi sang thẳng checkout)
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Click (thêm vào giỏ + chuyển trang) do add-to-cart.js xử lý: mọi nút Buy now
   là `.addToCart[data-buynow="1"]` theo cấu trúc template cũ. Module này chỉ còn:
     1. Trang chi tiết (product.html): nhãn "Buy Now — $…" theo option + số lượng.
     2. Sticky buy bar ở mobile (<992px) khi cuộn qua khỏi nút mua chính.

   Ghi chú: module KHÔNG sửa pages.js — trạng thái PDP được đọc ngược từ DOM
   (`#pdpTitle`, `#pdpOptions .yq-option.is-active[data-price]` và `#pdpQty [data-qty-val]`).
   ========================================================================== */
(function ($) {
  'use strict';

  /* ======================================================================
     1. Trang chi tiết sản phẩm (PDP)
     ====================================================================== */

  /** Đọc trạng thái đang chọn trực tiếp từ DOM tĩnh (tên, option active + data-price, số lượng). */
  function pdpState() {
    if (!$('#pdpBuyNow').length) return null;
    var $opt = $('#pdpOptions .yq-option.is-active').first();
    if (!$opt.length) $opt = $('#pdpOptions .yq-option').first();

    var qty = parseInt($('#pdpQty [data-qty-val]').first().text(), 10);
    if (!qty || qty < 1) qty = 1;

    return {
      product: { name: $.trim($('#pdpTitle').text()) },
      option: $opt.length ? { label: $.trim($opt.text()), price: parseFloat($opt.attr('data-price')) || 0 } : null,
      qty: qty
    };
  }

  /** Đồng bộ nhãn nút Buy Now + nội dung sticky bar theo option/số lượng. */
  function pdpSync() {
    var st = pdpState();
    if (!st || !st.option) return;

    var line = st.option.price * st.qty;

    $('#pdpBuyLabel').text('Buy Now — ' + YQ.money0(line));
    $('#pdpBuyNow').attr('aria-label',
      'Buy now: ' + st.product.name + ' — ' + st.option.label + ' × ' + st.qty);

    $('#pdpBarName').text(st.product.name);
    $('#pdpBarPrice').text(YQ.money0(line));
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
    document.body.classList.toggle('yq-buybar-on', on);
  }

  function barRequest() {
    if (barTicking) return;
    barTicking = true;
    window.requestAnimationFrame(barUpdate);
  }

  /* ======================================================================
     3. Bind
     ====================================================================== */

  /* -- Đồng bộ nhãn khi đổi option / số lượng --
     Handler của pages.js đăng ký SAU module này nên khi handler ta chạy thì
     class .is-active chưa kịp đổi -> hoãn 1 tick rồi mới đọc DOM. */
  $(document).on('click', '#pdpOptions .yq-option', function () { setTimeout(pdpSync, 0); });
  $(document).on('click', '#pdpQty [data-step]', function () { setTimeout(pdpSync, 0); });
  $(document).on('yq:qty', '#pdpQty', function () { setTimeout(pdpSync, 0); });

  /* -- Khởi động sau khi layout render xong -- */
  $(document).on('yq:layout-ready', function () {
    // setTimeout 0: đợi YQ.initProduct()/initHome()… trong inline script render xong
    setTimeout(function () {
      pdpSync();
      barUpdate();
    }, 0);
  });

  /* -- Sticky bar theo scroll/resize -- */
  $(window).on('scroll.yqBuyNow resize.yqBuyNow', barRequest);

  /* Giỏ đổi (kể cả từ tab khác) -> nhãn giá không phụ thuộc giỏ, chỉ cần bar đúng vị trí */
  $(document).on('yq:cart-changed', barRequest);

})(jQuery);
