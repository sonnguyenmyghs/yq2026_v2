/* ==========================================================================
   Module JS: checkout-voucher-gift — "Send as a gift" (dùng chung cho demo + production)

   Chọn "Send as a gift" -> mở panel trượt #cvvGiftPanel (Bootstrap offcanvas) — personalise cho 1 người nhận:
     1. Người nhận: 3 input CŨ name_receive / email_receive / note_receive (backend đang đọc).
     2. Thiệp cá nhân (tuỳ chọn): card_add, banner mẫu ảnh/video hoặc tự tải (card_banner, card_banner_type,
        card_banner_file), màu thương hiệu (card_colour) + xem trước thiệp.
   Save -> thẻ tóm tắt #cvvPeDone (Edit / Remove). Đóng panel khi chưa Save -> quay về "For myself".
   Dùng class của personalise.css (.yq-pe-banner, .yq-pe-swatch, .yq-pe-card).
   JS không dựng markup: chỉ đổi text / val / src / class / hidden của khối có sẵn.

   Xuất ra window.cvvGift = { isGift(), open(), saved() } cho file validate (checkout-voucher*.js).
   ========================================================================== */
jQuery(function ($) {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var MAX_FILE = 20 * 1024 * 1024;
    var FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];

    var $panel = $('#cvvGiftPanel');
    if (!$panel.length) return;
    var panel = (window.bootstrap && bootstrap.Offcanvas) ? bootstrap.Offcanvas.getOrCreateInstance($panel[0]) : null;
    var $name = $('.input__receive__name');
    var $mail = $('.input__receive__email');
    var $note = $('.input__receive__note');
    var $add = $('#cvvCardAdd');
    var $banner = $('#cvvCardBanner');
    var $bannerType = $('#cvvCardBannerType');
    var $colour = $('#cvvCardColour');
    var $file = $('#cvvBannerFile');
    var $upBtn = $('#cvvUploadBtn');
    var upload = null;   // { url, type } file người dùng tự tải
    var saved = null;    // ảnh chụp lần Save gần nhất

    var val = function ($el) { return $.trim($el.val() || ''); };
    var isGift = function () { return $('input[name="cvv_for"]:checked').val() === 'gift'; };
    var setMode = function (gift) { $('input[name="cvv_for"][value="' + (gift ? 'gift' : 'me') + '"]').prop('checked', true); };
    var hasCard = function () { return $add.is(':checked'); };
    var buyerName = function () { return val($('.input__guest__firstname')) || val($('.input__member__firstname')); };
    var bannerName = function () {
        return $banner.val() === 'upload' ? 'Your own ' + ($bannerType.val() || 'banner')
            : $.trim($('#cvvBanners [data-banner="' + $banner.val() + '"] .yq-pe-banner__name').text());
    };
    var colourName = function () { return $.trim($('#cvvSwatches [data-colour="' + $colour.val() + '"]').text()); };

    /* ---------- xem trước thiệp ---------- */
    var renderMedia = function () {
        var id = $banner.val(), src, type, poster = '';
        if (id === 'upload' && upload) {
            src = upload.url; type = upload.type;
        } else {
            var $b = $('#cvvBanners [data-banner="' + id + '"]');
            if (!$b.length || id === 'upload') $b = $('#cvvBanners [data-banner]').first();
            src = $b.attr('data-src'); type = $b.attr('data-type'); poster = $b.attr('data-poster') || '';
        }
        var video = $('#cvvCardVideo')[0], $img = $('#cvvCardImg');
        if (type === 'video') {
            $img.prop('hidden', true).attr('src', '');
            if (video.getAttribute('src') !== src) { video.setAttribute('src', src); video.setAttribute('poster', poster); }
            video.hidden = false;
            var p = video.play && video.play(); if (p && p.catch) p.catch(function () {});
        } else {
            video.pause && video.pause(); video.hidden = true;
            $img.attr('src', src).prop('hidden', false);
        }
    };
    var renderBannerState = function () {
        var id = $banner.val();
        $('#cvvBanners [data-banner]').each(function () { $(this).toggleClass('is-active', $(this).attr('data-banner') === id); });
        $('#cvvSwatches [data-colour]').each(function () {
            var on = $(this).attr('data-colour') === $colour.val();
            $(this).toggleClass('is-active', on).attr('aria-checked', on ? 'true' : 'false');
        });
        $('#cvvCard').attr('class', 'yq-pe-card yq-pe-card--' + ($colour.val() || 'gold'));
        renderMedia();
    };
    var updatePreview = function () {
        var msg = val($note);
        $('#cvvPvTo').text(val($name) || 'Recipient');
        $('#cvvPvMsg').text(msg || 'Your message will appear here.').toggleClass('is-empty', !msg);
        $('#cvvPvFrom').text(buyerName() || '—');
        $('#cvvNoteCount').text(($note.val() || '').length);
    };
    var toggleCard = function () {
        var on = hasCard();
        $('#cvvCardFields').prop('hidden', !on);
        $('#cvvCardFields').find('input').prop('disabled', !on);   // tắt thiệp -> không POST field card_*
        if (on) renderBannerState(); else { var v = $('#cvvCardVideo')[0]; v && v.pause && v.pause(); }
    };

    /* ---------- thẻ tóm tắt ở checkout ---------- */
    var showSummary = function () {
        var msg = val($note);
        $('#cvvPeTo').text('To ' + val($name) + ' · ' + val($mail));
        $('#cvvPeMsg').text(msg ? '“' + msg + '”' : '').prop('hidden', !msg);
        $('#cvvPeCard').text('Personalised card · ' + bannerName() + ' · ' + colourName()).prop('hidden', !hasCard());
        $('#cvvPeDone').prop('hidden', false);
    };

    var snapshot = function () {
        return { name: $name.val(), email: $mail.val(), note: $note.val(), add: hasCard(),
                 banner: $banner.val(), type: $bannerType.val(), colour: $colour.val() };
    };
    var restore = function (s) {
        $name.val(s.name); $mail.val(s.email); $note.val(s.note); $add.prop('checked', s.add);
        $banner.val(s.banner); $bannerType.val(s.type); $colour.val(s.colour);
        $name.add($mail).removeClass('error');
        toggleCard(); updatePreview();
    };
    var clearGift = function () {
        saved = null;
        restore({ name: '', email: '', note: '', add: false, banner: 'celebrate', type: 'video', colour: 'gold' });
        $file.val(''); upload = null;
        $upBtn.removeClass('has-file').find('img').attr('src', '').prop('hidden', true);
        $('#cvvUploadErr').prop('hidden', true);
        $('#cvvPeDone').prop('hidden', true);
        setMode(false);
    };

    var open = function () {
        updatePreview(); toggleCard();
        if (panel) panel.show(); else $panel.addClass('show');
    };
    var close = function () { if (panel) panel.hide(); else $panel.removeClass('show'); };

    /* ---------- sự kiện ---------- */
    $('input[name="cvv_for"]').on('change', function () { if (isGift()) open(); else clearGift(); });
    $('.cvv-for__opt--gift').on('click', function () { if (isGift() && saved) open(); });
    $('#cvvPeEdit').on('click', open);
    $('#cvvPeRemove').on('click', clearGift);
    $name.add($note).on('input', updatePreview);
    $name.add($mail).on('input', function () { $(this).removeClass('error'); });
    $add.on('change', toggleCard);

    $(document).on('click', '#cvvBanners [data-banner]', function () {
        var id = $(this).attr('data-banner');
        $('#cvvUploadErr').prop('hidden', true);
        if (id === 'upload') {
            if (!upload) { $file.trigger('click'); return; }
            $banner.val('upload'); $bannerType.val(upload.type);
        } else {
            $banner.val(id); $bannerType.val($(this).attr('data-type'));
        }
        renderBannerState();
    });
    $file.on('change', function () {
        var f = this.files && this.files[0];
        if (!f) return;
        if (FILE_TYPES.indexOf(f.type) < 0 || f.size > MAX_FILE) {
            $('#cvvUploadErr').prop('hidden', false); this.value = ''; return;
        }
        if (upload) URL.revokeObjectURL(upload.url);
        var type = f.type.indexOf('video') === 0 ? 'video' : 'image';
        upload = { url: URL.createObjectURL(f), type: type };
        $upBtn.addClass('has-file').find('img').attr('src', type === 'image' ? upload.url : '').prop('hidden', type !== 'image');
        $banner.val('upload'); $bannerType.val(type);
        renderBannerState();
    });
    $(document).on('click', '#cvvSwatches [data-colour]', function () {
        $colour.val($(this).attr('data-colour'));
        renderBannerState();
    });

    $('#cvvGiftSave').on('click', function () {
        $name.toggleClass('error', !val($name));
        $mail.toggleClass('error', !EMAIL_RE.test(val($mail)));
        if ($name.hasClass('error')) { $name.trigger('focus'); return; }
        if ($mail.hasClass('error')) { $mail.trigger('focus'); return; }
        if (hasCard() && $banner.val() === 'upload' && !upload) { $('#cvvUploadErr').prop('hidden', false); return; }
        saved = snapshot();
        setMode(true);
        showSummary();
        close();
    });

    /* Đóng panel: chưa Save -> về For myself; đã Save -> bỏ thay đổi chưa lưu */
    $panel.on('hidden.bs.offcanvas', function () {
        var v = $('#cvvCardVideo')[0]; v && v.pause && v.pause();
        if (!saved) { clearGift(); return; }
        restore(saved);
        setMode(true);
    });

    /* Server trả form về (lỗi) với người nhận đã điền -> giữ trạng thái quà (file upload phải chọn lại) */
    if (val($name) && EMAIL_RE.test(val($mail))) {
        saved = snapshot();
        setMode(true);
        showSummary();
    }
    updatePreview();

    window.cvvGift = {
        isGift: isGift,
        saved: function () { return !!saved; },
        open: open
    };
});
