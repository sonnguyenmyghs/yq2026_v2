/* ==========================================================================
   Forget password — dùng chung bản demo (member/forget.html) và production
   (member/forget-production.html). Cùng luồng với script của template cũ:
   - ô #inputForget nhận email HOẶC số điện thoại (intl-tel-input v12, jQuery plugin)
   - thêm 3 hidden: forget[input_type] (mobile | email), forget[dialing_code], forget[country_code]
   - hiddenInput forget[email] do plugin tạo
   - gõ chữ cái -> ẩn cờ quốc gia; số hợp lệ -> input_type = mobile, còn lại = email
   Giá trị cũ đọc từ data-* của form (backend in vào HTML), không in biến trong JS.
   Viết an toàn với template engine: jQuery thay ký hiệu đô-la, ngoặc nhọn không cùng dòng.
   ========================================================================== */
jQuery(function () {
    var form = jQuery('#yqForgetForm');
    var telInput = jQuery('#inputForget');
    if (!form.length || !telInput.length || !telInput.intlTelInput) {
        return;
    }

    var typeValue = form.attr('data-input-type') || 'mobile';
    var dialingValue = form.attr('data-dialing-code') || '';
    var countryValue = form.attr('data-country-code') || '';
    var wrap = telInput.parent();

    var addHidden = function (name, value) {
        var el = jQuery('<input>');
        el.attr('type', 'hidden');
        el.attr('name', name);
        el.val(value);
        wrap.append(el);
        return el;
    };
    var inputType = addHidden('forget[input_type]', typeValue);
    var inputDialing = addHidden('forget[dialing_code]', dialingValue);
    var inputCountry = addHidden('forget[country_code]', countryValue);

    var hideFlag = function (status) {
        var flag = telInput.parent().find('.selected-flag');
        if (status) {
            flag.hide();
            telInput.css('padding-left', '15px');
        } else {
            flag.show();
            telInput.css('padding-left', '52px');
        }
    };

    var opts = new Object();
    opts.initialCountry = 'auto';
    opts.hiddenInput = 'forget[email]';
    opts.geoIpLookup = function (callback) {
        jQuery.get('https://ipinfo.io', function () {
            return true;
        }, 'jsonp').always(function (resp) {
            var code = (resp && resp.country) ? resp.country : '';
            callback(code);
        });
    };
    opts.customPlaceholder = function (selectedCountryPlaceholder) {
        return 'Email | ' + selectedCountryPlaceholder;
    };
    opts.utilsScript = '//cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.0.0/js/utils.js';
    telInput.intlTelInput(opts);

    if (countryValue) {
        telInput.intlTelInput('setCountry', countryValue);
    }
    hideFlag(typeValue === 'email');

    telInput.on('keyup blur', function () {
        var isText = false;
        var isEmail = false;
        var val = jQuery.trim(telInput.val());
        if (val) {
            isText = /[a-zA-Z]/.test(val);
            isEmail = !telInput.intlTelInput('isValidNumber');
        }
        inputType.val(isEmail ? 'email' : 'mobile');
        hideFlag(isText);
        telInput.removeClass('is-invalid');
    });

    telInput.on('countrychange', function (e, countryData) {
        if (countryData) {
            inputDialing.val(countryData.dialCode);
            inputCountry.val(countryData.iso2);
        }
    });

    /* Ô trống -> báo lỗi tại chỗ, không gửi */
    form.on('submit', function (e) {
        if (!jQuery.trim(telInput.val())) {
            e.preventDefault();
            telInput.addClass('is-invalid').trigger('focus');
        }
    });
});
