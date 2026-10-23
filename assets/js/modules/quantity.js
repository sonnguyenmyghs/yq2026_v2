/* ==========================================================================
   Module JS: quantity — số lượng ở trang chi tiết: giới hạn min/max + giá theo bậc
   Port từ script của old/member_redeemtion_detail_dev.html, dùng lại đúng biến PHP cũ
   (PHP in vào HTML, JS chỉ đọc):

     <input type="hidden" id="min_voucher_buy"   value="{$_product_min_redeem}">
     <input type="hidden" id="max_voucher_buy"   value="{$_product_max_redeem}">
     <input type="hidden" class="best__price__check" value="{$best__price__check}">
     <input type="hidden" id="arr_best_price"    value='$arrBestPrice__Json'>
         -> [{"name": số lượng từ, "price": giá}, ...]  (tăng dần theo name)

   Bộ +/-: .btns--count > .minus / .input__quantity / .plus (giống template cũ).
   Mọi .input__quantity trên trang (bộ chính + popup v3) luôn cùng 1 giá trị.
   Giá đổi ở mọi ".pd--price span" (giá chính + sticky bar).
   ========================================================================== */
$(function () {

    if (!$('.input__quantity').length) return;

    var min = parseInt($('#min_voucher_buy').val()) || 1;
    var max = parseInt($('#max_voucher_buy').val()) || 0;      // 0 = không giới hạn
    var useBestPrice = $('.best__price__check').val() == 1;
    var basePrice = $('.pd--price span').first().text();        // giá gốc PHP in ({$product_cost_format})

    var bestPrices = [];
    try { bestPrices = JSON.parse($('#arr_best_price').val() || '[]') || []; } catch (e) { bestPrices = []; }

    // Câu cảnh báo giống template cũ
    function warn() {
        var text = max > 1
            ? 'Quantity requirement for this offer is ' + min + ' to ' + max
            : 'Quantity requirement for this offer is ' + min;
        $('#warning-min-max-voucher').html(text);
    }

    // Giá theo bậc: lấy bậc cao nhất mà số lượng đạt tới, chưa tới bậc nào thì giá gốc
    function updatePrice(number) {
        if (!useBestPrice) return;
        var price = basePrice;
        $.each(bestPrices, function (i, tier) {
            if (number >= parseInt(tier.name)) price = tier.price;
        });
        $('.pd--price span').html(price);
    }

    function setQuantity(number) {
        $('.input__quantity').val(number);
        $('.addToCart').attr('data-quantity', number);
        $('#warning-min-max-voucher').html('');
        updatePrice(number);
    }

    $(document).on('click', '.btns--count .plus', function () {
        var number = (parseInt($('.input__quantity').val()) || 0) + 1;
        if (max >= 1 && number > max) {
            warn();
            return;
        }
        setQuantity(number);
    });

    $(document).on('click', '.btns--count .minus', function () {
        var number = (parseInt($('.input__quantity').val()) || 0) - 1;
        if (min > 1 && number < min) {
            warn();
            return;
        }
        setQuantity(number > 0 ? number : 1);
    });

    // Gõ tay số lượng: kéo về trong khoảng min/max
    $(document).on('change', '.input__quantity', function () {
        var typed = parseInt($(this).val()) || min;
        var number = typed < min ? min : typed;
        if (max >= 1 && number > max) number = max;
        setQuantity(number);
        if (number != typed) warn();
    });

    setQuantity(Math.max(min, parseInt($('.input__quantity').val()) || min));
});
