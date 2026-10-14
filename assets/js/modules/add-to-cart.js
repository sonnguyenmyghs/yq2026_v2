/* ==========================================================================
   Module JS: add-to-cart — nút "Add to cart" / "Buy now" theo cấu trúc template cũ
   Nạp sau data.js / app.js / pages.js / cart-anim.js.

   Giữ nguyên hợp đồng với backend cũ để không phải đổi server:
     - Nút: .addToCart + data-productid / data-quantity / data-attribute
            data-buynow="1" (mua nhanh) · data-var="1" (sang trang chi tiết để chọn)
            data-page="1" (card ở trang list) · data-go
     - Thuộc tính: #form-list-attribute (serialize gửi kèm), .redeem_attreibute,
            .status-product-attribute, .product--attr[data-max] .single--attribute input,
            .sku--variable--max / .sku--variable--cur, .sec--product--detail
            (.noo__need__choose, data-addon="use__addon__version")
     - AJAX: POST baseUrl + '/cart/?action=addCart&product_id=…&quantity=…&product_att=…&amoun_att=…'
            response JSON { html, totalItems, totalCost, htmlModal, htmlWarning }

   Hai chế độ:
     - Production: có <span id="root" data-base="…"> → gọi AJAX như cũ.
     - Demo (không có #root): thêm vào YQ.cart (localStorage) bằng id trong data.js.
   ========================================================================== */
(function ($) {
  'use strict';

  var $root = $('#root');
  var baseUrl = $root.length ? ($root.data('base') || '') : null;   // null = demo
  var SERVER = baseUrl !== null;

  var URL_VIEW_CART = SERVER ? baseUrl + '/cart/?action=view' : 'checkout.html';
  function urlDetail(id) {
    return SERVER ? baseUrl + '/member/redemption/' + id : YQ.url('product.html?id=' + id);
  }

  var REDIRECT_DELAY = 420;   // ms — đủ để thấy spinner Buy now
  var busy = false;           // chặn bấm liên tục gây thêm trùng

  /* ======================================================================
     1. Kiểm tra lựa chọn (giữ nguyên logic template cũ)
     ====================================================================== */
  function shake($el) {
    $el.addClass('shake');
    setTimeout(function () { $el.removeClass('shake'); }, 1200);
  }

  /** variable v1: phải chọn đủ số SKU */
  function invalidVariable() {
    if (!$('.sku--variable--max').length) return false;
    var max = parseInt($('.sku--variable--max').val(), 10);
    var cur = parseInt($('.sku--variable--cur').val() || 0, 10);
    if (cur !== max) { shake($('.sku--variables--zone')); return true; }
    return false;
  }

  /** attribute v2: mỗi nhóm .product--attr phải chọn đúng data-max */
  function invalidAttribute() {
    var $sec = $('.sec--product--detail');
    var noNeed = $sec.hasClass('noo__need__choose');
    var addonVer = $sec.data('addon') === 'use__addon__version';
    var flag = false;

    if (noNeed && !addonVer && $('.product--attr .single--attribute input:checked').length === 0) return false;

    if (addonVer) {
      if ($('.product--attr').find('.single--attribute input:checked').length !== 1) {
        shake($('.product--attr'));
        flag = true;
      }
      return flag;
    }

    $('.product--attr').each(function () {
      var $g = $(this);
      var checked = $g.find('.single--attribute input:checked').length;
      var max = $g.data('max');
      // noo__need__choose: không bắt chọn, nhưng đã chọn thì phải chọn đủ
      if ((noNeed && checked > 0 && checked != max) || (!noNeed && checked != max)) {
        shake($g);
        flag = true;
      }
    });
    return flag;
  }

  /* ======================================================================
     2. Cập nhật giao diện sau khi thêm
     ====================================================================== */
  function paintBadges(n) {
    $('#yqCartCount, #yqCartCountM').text(n).toggleClass('is-on', n > 0);
    $('.cart--header .badge, #cart .badge').html(n);            // header template cũ (nếu còn)
  }

  /** Production: đổ dữ liệu server trả về vào DOM — cùng field như template cũ. */
  function applyServer(data) {
    $('.cart--items').html(data.html);
    $('.cart--header .main-color-text').html(data.totalCost);
    $('#modalShowCartCheckOut').html(data.htmlModal);
    $('#modalShowWarning').html(data.htmlWarning);
    paintBadges(parseInt(data.totalItems, 10) || 0);
    $(document).trigger('yq:cart-server', [data]);              // hook cho drawer / trang khác
  }

  function lock($btn, buynow) {
    busy = true;
    $('.addToCart').addClass('is-disabled');
    $btn.removeClass('is-disabled');
    if (buynow) $btn.addClass('is-buying').attr('aria-busy', 'true');
  }
  function unlock() {
    busy = false;
    $('.addToCart').removeClass('is-disabled is-buying').removeAttr('aria-busy');
  }

  function done($btn, name) {
    if ($btn.data('buynow') == 1) {
      setTimeout(function () { window.location.href = URL_VIEW_CART; }, REDIRECT_DELAY);
      setTimeout(unlock, 2500);           // user bấm Back / điều hướng bị huỷ
      return;
    }
    // form đổi điểm cũ: nút submit-frm-redeem cũng đi thẳng sang giỏ
    if ($btn.hasClass('submit-frm-redeem')) {
      var att = $('.redeem_attreibute').val();
      if ($('.status-product-attribute').val() != 1 || att > 0) window.location.href = URL_VIEW_CART;
    }
    unlock();
    YQ.toast((name || 'Item') + ' added to cart', 'View cart', SERVER ? URL_VIEW_CART : 'cart.html');
  }

  /* ======================================================================
     3. Thêm vào giỏ
     ====================================================================== */
  function addServer($btn, id, qty) {
    var att = $('.redeem_attreibute').val();
    var hasAtt = $('.status-product-attribute').val() == '1';
    var amount = '';

    if (hasAtt && !(att > 0)) { alert('Please select one price!'); return; }
    if (hasAtt) amount = $('.redeem_attreibute option:selected').attr('data-amount');
    else att = '';

    var before = parseInt($('#yqCartCount').text(), 10) || 0;
    var buynow = $btn.data('buynow') == 1;
    lock($btn, buynow);

    $.ajax({
      url: baseUrl + '/cart/?action=addCart&product_id=' + id + '&quantity=' + qty +
           '&product_att=' + att + '&amoun_att=' + amount,
      type: 'post',
      data: $('#form-list-attribute').serialize(),
      dataType: 'text'
    }).done(function (res) {
      var data;
      try { data = typeof res === 'string' ? $.parseJSON(res) : res; } catch (e) { data = null; }
      if (!data) { unlock(); YQ.toast('Could not add to cart. Please try again.'); return; }

      applyServer(data);
      if (!buynow && YQ.cartFx) YQ.cartFx.added($btn[0], before, parseInt(data.totalItems, 10) || 0);
      done($btn, $.trim($btn.closest('.yq-card').find('.yq-card__title').text()) || $.trim($('#pdpTitle').text()));
    }).fail(function () {
      unlock();
      YQ.toast('Could not add to cart. Please try again.');
    });
  }

  /** Demo: option đang chọn ở PDP (nếu nút nằm trong PDP), không thì option đầu tiên. */
  function demoOption(p, $btn) {
    var opts = p.options || [];
    if ($btn.closest('.yq-pdp, #pdpBuyBar').length) {
      var optId = $('#pdpOptions .yq-option.is-active').attr('data-opt');   // attr(): giữ '12' là string
      var hit = opts.filter(function (o) { return String(o.id) === String(optId); })[0];
      if (hit) return hit;
    }
    return opts[0];
  }

  function addDemo($btn, id, qty) {
    var p = YQ.product(String(id));
    if (!p) return;
    var buynow = $btn.data('buynow') == 1;
    lock($btn, buynow);
    YQ.cart.add(p, demoOption(p, $btn), qty);   // cart-anim bắt yq:cart-changed → bay + drawer
    done($btn, p.name);
  }

  $(document).on('click', '.addToCart', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $btn = $(this);
    if (busy || $btn.hasClass('is-yqadded')) return;

    var id = $btn.attr('data-productid');
    var qty = parseInt($btn.attr('data-quantity'), 10) || 1;

    // Card ở trang list chỉ check thuộc tính khi đang ở trang chi tiết
    if (!$btn.data('page')) {
      if (invalidVariable() | invalidAttribute()) return;   // `|`: shake cả hai nhóm cùng lúc
    }

    // Sản phẩm có biến thể → sang trang chi tiết để chọn
    if ($btn.data('var') == 1) { window.location.href = urlDetail(id); return; }

    if (SERVER) addServer($btn, id, qty);
    else addDemo($btn, id, qty);
  });

  /* ======================================================================
     4. PDP: đồng bộ số lượng vào data-quantity của các nút (như #rdChangeQuantity cũ)
     ====================================================================== */
  function syncQty(n) {
    $('.yq-pdp .addToCart, #pdpBuyBar .addToCart').attr('data-quantity', n);
  }
  $(document).on('yq:qty', '#pdpQty', function (e, n) { syncQty(n); });
  $(document).on('change input', '#rdChangeQuantity', function () {
    syncQty(Math.max(1, parseInt(this.value, 10) || 1));
  });

})(jQuery);
