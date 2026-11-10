/* ==========================================================================
   Module JS: checkout-voucher — bản PRODUCTION (dùng cho voucher/checkout-production.html)

   Cùng luồng với checkout-voucher.js (demo) nhưng nối API thật:
     - Promo: POST /cart?action=check_promo&code=…  (cùng API với checkout-v2-production.js)
       huỷ mã: POST /reward/?act=delete_gift&code=…
     - Số điện thoại: intl-tel-input v25 cho #phone_register -> hidden register[phone]
     - Submit: validate rồi để form POST lên server (không chặn).
   JS không dựng markup: chỉ đổi class / text / val / ẩn-hiện khối có sẵn.
   Cần nạp sau jQuery + intlTelInput.min.js. Base URL lấy từ #root[data-base] (layout có sẵn).
   ========================================================================== */
jQuery(function ($) {
    var baseUrl = $('#root').data('base') || '';
    var toNum = function (v) { return parseFloat(String(v == null ? '' : v).replace(/,/g, '')) || 0; };
    var formatPrice = function (n) {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    };

    /* ---------------------------------------------------------------
       Số điện thoại (giống inline script template voucher cũ: hidden register[phone])
       --------------------------------------------------------------- */
    var phoneInput = document.querySelector('#phone_register');
    var phoneResult = document.querySelector('#result_register');
    var iti = null;
    if (phoneInput && window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: 'sg',
            hiddenInput: function () { return { phone: 'register[phone]' }; },
            loadUtils: function () { return import('https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.0/build/js/utils.js'); }
        });
        /* input + countrychange: bắt cả dán / autofill / đổi mã nước (không chỉ keyup) */
        var checkPhone = function () {
            var ok = !!iti.isValidNumber();
            phoneResult.style.color = ok ? 'green' : 'red';
            phoneResult.textContent = ok ? 'Valid phone number' : 'Invalid phone number';
            phoneInput.classList.toggle('error', !ok);
        };
        ['keyup', 'input', 'countrychange'].forEach(function (ev) { phoneInput.addEventListener(ev, checkPhone); });
    }

    /* For myself / Send as a gift: xử lý trong checkout-voucher-gift.js (nạp trước file này) */
    var gift = window.cvvGift || { isGift: function () { return false; }, saved: function () { return false; }, open: function () {} };
    var isGift = gift.isGift;

    /* ---------------------------------------------------------------
       Promo code
       --------------------------------------------------------------- */
    var resetTotal = function () {
        var base = toNum($('#total-default-no-promo').val());
        $('#div-total-cost').attr('data-price', base).text(formatPrice(base));
    };

    $('#btn-check-promocode').on('click', function (e) {
        e.preventDefault();
        var code = $.trim($('#input-promo-code').val());
        if (!code) return;
        var $btn = $(this).text('…').prop('disabled', true);
        $.ajax({
            url: baseUrl + '/cart?action=check_promo&code=' + encodeURIComponent(code),
            type: 'post',
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function (data_j) {
            if (data_j.status == 1) {
                $('#div-total-cost').html(data_j.total_cost_show).attr('data-price', data_j.total_cost);
                $('#input-promo-code').attr('readonly', true);
                $('#input-hidden-promo-code').val(code);
                $('#btn-check-promocode').hide();
                $('#btn-cancel-promocode').show();
                $('#div-show-discount-promo').removeClass('d-none').show();
                $('#name-show-discount-promo').html(data_j.name_discount);
                $('#costdiscount-show-discount-promo').html(data_j.cost_discount_show + ' ' + data_j.currency).attr('data-discount', data_j.cost_discount);
                $('#warning-promo').show().html(data_j.message).css('color', 'green');
                $('#checkDiscount').val(data_j.cost_discount);
            } else {
                $('#warning-promo').show().html(data_j.message).css('color', 'red');
            }
        }).fail(function () {
            $('#warning-promo').show().text('An error occurred, please try again').css('color', 'red');
        }).always(function () {
            $btn.text('Apply').prop('disabled', false);
        });
    });
    $('#input-promo-code').on('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); $('#btn-check-promocode').trigger('click'); }
    });
    $('#btn-cancel-promocode').on('click', function () {
        var code = $('#input-promo-code').val();
        $.post(baseUrl + '/reward/?act=delete_gift&code=' + encodeURIComponent(code));
        $('#costdiscount-show-discount-promo').attr('data-discount', 0).text('');
        $('#btn-check-promocode').show();
        $('#input-promo-code').attr('readonly', false).val('');
        $('#input-hidden-promo-code').val('');
        $(this).hide();
        $('#div-show-discount-promo').hide();
        $('#warning-promo').hide();
        $('#checkDiscount').val('');
        resetTotal();
    });

    /* ---------------------------------------------------------------
       Validate — dừng ở lỗi đầu tiên, thứ tự = thứ tự form
       --------------------------------------------------------------- */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var isMember = function () { return !!$.trim($('#input__isMember').val()); };
    var isGuest = function () { return !isMember(); };
    var filled = function ($el) { return !!$.trim($el.val()); };
    var emailOk = function ($el) { return EMAIL_RE.test($.trim($el.val())); };
    var phoneOk = function ($el) { return filled($el) && (iti ? iti.isValidNumber() : $el.val().length > 6); };

    var RULES = [
        { when: isMember, field: '.input__member__firstname', ok: filled },
        { when: isMember, field: '.input__member__lastname', ok: filled },
        { when: isGuest, field: '.input__guest__email', ok: emailOk },
        { when: isGuest, field: '.input__guest__reemail', focus: true, ok: function ($el) {
            return filled($el) && $.trim($el.val()).toLowerCase() === $.trim($('.input__guest__email').val()).toLowerCase();
        } },
        { when: isGuest, field: '.input__guest__firstname', ok: filled },
        { when: isGuest, field: '.input__guest__lastname', ok: filled },
        { when: isGuest, field: '#phone_register', ok: phoneOk },
        /* Send as a gift nhưng chưa Save người nhận -> mở lại panel */
        { when: isGift, field: '.input__receive__name', scroll: '.cvv-gift', ok: function () { return gift.saved(); },
          mark: function () { gift.open(); } },
        { field: '#becomeamember', ok: function ($el) { return $el.is(':checked'); }, scroll: '.agree--zone',
          mark: function () { $('.agree--zone').addClass('null'); } }
    ];

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

    var submitting = false;
    $('.confirm--order--btn').on('click', function (e) {
        e.preventDefault();
        if (submitting) return;
        $('.pay--part .form-control').not('#phone_register').removeClass('error null');
        $('.agree--zone').removeClass('null');
        var bad = firstInvalid();
        if (bad) { showError(bad); return; }
        if (iti && isGuest()) $('input[type="hidden"][name="register[phone]"]').val(iti.getNumber());
        /* Banner mẫu -> không gửi phần file rỗng card_banner_file */
        $('#cvvBannerFile').prop('disabled', $('#cvvBannerFile').prop('disabled') || $('#cvvCardBanner').val() !== 'upload');
        submitting = true;
        $(this).prop('disabled', true).val('Processing…');
        $('.inform--frm')[0].submit();
    });
    /* Quay lại bằng nút Back (bfcache) -> mở khoá nút Pay Now */
    window.addEventListener('pageshow', function (e) {
        if (!e.persisted) return;
        submitting = false;
        $('.confirm--order--btn').prop('disabled', false).val('Pay Now');
    });
});
