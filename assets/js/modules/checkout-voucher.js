/* =====================================================================
   Module JS: checkout-voucher — DEMO stand-in cho app_voucher.js (production)
   Trang checkout-voucher.html: giỏ chỉ có sản phẩm loại voucher, không giao hàng.
   JS không dựng markup: chỉ đổi class / .text() / .val() / ẩn-hiện khối có sẵn.

   Khác production (đánh dấu [DEMO]):
     - Promo: tra window.__demoPromoCodes thay cho $.ajax('/cart?action=check_promo&code=…').
     - Submit: chặn form.submit() và hiện khối cảm ơn #cv2Done (production: POST lên server).
   ===================================================================== */
jQuery(function ($) {
    var formatPrice = function (n) {
        return (Math.round(parseFloat(n) * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    var subtotal = function () { return parseFloat($('.inform--money .provisional').data('subtotal')) || 0; };

    /* ---------------------------------------------------------------
       For myself / Send as a gift -> ẩn hiện .div-receive-form
       --------------------------------------------------------------- */
    var isGift = function () { return $('input[name="cvv_for"]:checked').val() === 'gift'; };
    $('input[name="cvv_for"]').on('change', function () {
        var $f = $('.div-receive-form');
        if (isGift()) {
            $f.prop('hidden', false).hide().slideDown(200);
        } else {
            $f.slideUp(200, function () { $f.prop('hidden', true); });
            $f.find('.form-control').removeClass('error null');
        }
    });
    $('.input__receive__note').on('input', function () { $('#cvvNoteCount').text(this.value.length); });

    /* ---------------------------------------------------------------
       Promo code
       --------------------------------------------------------------- */
    var applyPromo = function (code) {
        code = $.trim(code).toUpperCase();
        /* [DEMO] thay cho $.ajax(baseUrl + '/cart?action=check_promo&code=…'); data_j cùng field như server trả về */
        var rule = (window.__demoPromoCodes || {})[code];
        var sub = subtotal();
        var data_j;
        if (!rule) {
            data_j = { status: 0, message: 'This code is not valid.' };
        } else if (rule.min && sub < rule.min) {
            data_j = { status: 0, message: 'This code needs a minimum order of ' + formatPrice(rule.min) + ' SGD.' };
        } else {
            var discount = rule.type === 'pct' ? Math.round(sub * rule.value) / 100 : Math.min(rule.value, sub);
            var total = Math.round((sub - discount) * 100) / 100;
            data_j = {
                status: 1, total_cost: total, total_cost_show: formatPrice(total),
                name_discount: rule.name, cost_discount: discount, cost_discount_show: '−' + formatPrice(discount),
                currency: 'SGD', message: rule.message
            };
        }
        setTimeout(function () {
            if (data_j.status == 1) {
                $('#div-total-cost').text(data_j.total_cost_show);
                $('#input-promo-code').attr('readonly', true);
                $('#input-hidden-promo-code').val(code);
                $('#btn-check-promocode').hide();
                $('#btn-cancel-promocode').show();
                $('#div-show-discount-promo').removeClass('d-none').show();
                $('#name-show-discount-promo').text(data_j.name_discount);
                $('#costdiscount-show-discount-promo').text(data_j.cost_discount_show + ' ' + data_j.currency).attr('data-discount', data_j.cost_discount);
                $('#warning-promo').show().text(data_j.message).css('color', 'green');
                $('#checkDiscount').val(data_j.cost_discount);
            } else {
                $('#warning-promo').show().text(data_j.message).css('color', 'red');
            }
            $('#btn-check-promocode').text('Apply');
        }, 300);
    };

    $('#btn-check-promocode').on('click', function (e) {
        e.preventDefault();
        var code = $('#input-promo-code').val();
        if (!$.trim(code)) return;
        $(this).text('…');
        applyPromo(code);
    });
    $('#input-promo-code').on('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); $('#btn-check-promocode').trigger('click'); }
    });
    $('#btn-cancel-promocode').on('click', function () {
        $('#costdiscount-show-discount-promo').attr('data-discount', 0).text('');
        $('#btn-check-promocode').show();
        $('#input-promo-code').attr('readonly', false).val('');
        $('#input-hidden-promo-code').val('');
        $(this).hide();
        $('#div-show-discount-promo').hide();
        $('#warning-promo').hide();
        $('#checkDiscount').val('');
        $('#div-total-cost').text(formatPrice($('#total-default-no-promo').val()));
    });

    /* ---------------------------------------------------------------
       Validate — dừng ở lỗi đầu tiên, thứ tự = thứ tự form
       --------------------------------------------------------------- */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var isMember = function () { return !!$('#input__isMember').val(); };
    var isGuest = function () { return !isMember(); };
    var filled = function ($el) { return !!$.trim($el.val()); };
    var emailOk = function ($el) { return EMAIL_RE.test($.trim($el.val())); };
    var phoneOk = function ($el) { return filled($el) && !$el.hasClass('error') && $el.val().length > 6; };

    var RULES = [
        { when: isMember, field: '.input__member__email', ok: filled },
        { when: isMember, field: '.input__member__firstname', ok: filled },
        { when: isMember, field: '.input__member__lastname', ok: filled },
        { when: isGuest, field: '.input__guest__email', ok: emailOk },
        { when: isGuest, field: '.input__guest__reemail', focus: true, ok: function ($el) {
            return filled($el) && $.trim($el.val()).toLowerCase() === $.trim($('.input__guest__email').val()).toLowerCase();
        } },
        { when: isGuest, field: '.input__guest__firstname', ok: filled },
        { when: isGuest, field: '.input__guest__lastname', ok: filled },
        { when: isGuest, field: '#phone_register', ok: phoneOk },
        { when: isGift, field: '.input__receive__name', ok: filled, focus: true },
        { when: isGift, field: '.input__receive__email', ok: emailOk, focus: true },
        { field: '#becomeamember', ok: function ($el) { return $el.is(':checked'); }, scroll: '.agree--zone',
          mark: function () { $('.agree--zone').addClass('null'); } }
    ];

    var clearErrors = function () {
        $('.pay--part .form-control').not('#phone_register').removeClass('error null');
        $('.agree--zone').removeClass('null');
    };
    var firstInvalid = function () {
        for (var i = 0; i < RULES.length; i++) {
            var r = RULES[i];
            if (r.when && !r.when()) continue;
            if (!r.ok($(r.field))) return r;
        }
        return null;
    };
    var showError = function (r) {
        var $el = $(r.field);
        if (r.mark) r.mark($el); else $el.addClass('error');
        var $s = $(r.scroll || r.field);
        if ($s.length) $('html, body').animate({ scrollTop: $s.offset().top - 150 }, 400);
        if (r.focus) $el.trigger('focus');
    };

    $(document).on('input change', '.pay--part .form-control.error, .pay--part .form-control.null', function () {
        if (this.id !== 'phone_register') $(this).removeClass('error null');
    });
    $('#becomeamember').on('change', function () { $('.agree--zone').removeClass('null'); });

    $('.confirm--order--btn').on('click', function (e) {
        e.preventDefault();
        clearErrors();
        var bad = firstInvalid();
        if (bad) { showError(bad); return; }
        if (!isGift()) $('.div-receive-form .form-control').val('');   // không gửi thông tin người nhận khi mua cho mình
        $('.inform--frm').trigger('submit');
    });

    /* ---------------------------------------------------------------
       [DEMO] không có backend: chặn submit, hiện khối cảm ơn #cv2Done.
       Production: bỏ block này, form POST lên server.
       --------------------------------------------------------------- */
    $('.inform--frm').on('submit', function (e) {
        e.preventDefault();
        var email = isGift() ? $('.input__receive__email').val()
            : (isMember() ? $('.input__member__email').val() : $('.input__guest__email').val());
        $('#cv2DoneNum').text('GH' + Date.now().toString().slice(-8));
        $('#cv2DoneTotal').text($('#div-total-cost').text());
        $('#cv2DoneEmail').text(email);
        if (window.YQ && YQ.cart && YQ.cart.clear) YQ.cart.clear();
        $('#cv2Main > .pay--part').not('#cv2Done').hide();
        $('#cv2Done').fadeIn(220);
        $('#cv2Aside').fadeOut(200);
        $('html,body').animate({ scrollTop: $('#cv2Top').offset().top - 120 }, 350);
    });
});
