/* ==========================================================================
   Module JS: buynow — đường "mua nhanh" (thêm vào giỏ rồi sang thẳng checkout)
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Click (thêm vào giỏ + chuyển trang) do add-to-cart.js xử lý: mọi nút Buy now
   là `.addToCart[data-buynow="1"]` theo cấu trúc template cũ. Module này chỉ còn
   sticky buy bar ở mobile (<992px) khi cuộn qua khỏi nút mua chính.
   Giá / nhãn nút là HTML do PHP in sẵn, JS không đổi.
   ========================================================================== */
(function ($) {
  'use strict';

  /* ======================================================================
     1. Sticky buy bar (mobile)
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
     2. Bind
     ====================================================================== */

  /* -- Khởi động sau khi layout render xong -- */
  $(document).on('yq:layout-ready', function () {
    // setTimeout 0: đợi YQ.initProduct()/initHome()… trong inline script render xong
    setTimeout(barUpdate, 0);
  });

  /* -- Sticky bar theo scroll/resize -- */
  $(window).on('scroll.yqBuyNow resize.yqBuyNow', barRequest);

  /* Giỏ đổi (kể cả từ tab khác) -> nhãn giá không phụ thuộc giỏ, chỉ cần bar đúng vị trí */
  $(document).on('yq:cart-changed', barRequest);

})(jQuery);
