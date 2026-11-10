/* ==========================================================================
   Module JS: checkout-voucher-gift — "Send as a gift" (dùng chung cho demo + production)

   Chọn "Send as a gift" -> mở panel rộng #cvvGiftPanel (Bootstrap offcanvas):
     Trái  1. Người nhận — 3 input CŨ name_receive / email_receive / note_receive.
           2. Thiết kế e-card (tuỳ chọn): banner (chỉ ảnh: ảnh mẫu hoặc ảnh tự tải JPG/PNG/WebP ≤ 10MB), layout, màu.
     Phải  Xem trước THIỆP (giống email/parts/card-*.html) + dòng giải thích + nút "Preview full email":
           mở hộp #cvvEmailPv (div tĩnh trong panel, role=dialog) với iframe; nội dung = YQEmail.build(vars, opts)
           của email-render.js (nạp TRƯỚC file này). opts lấy từ data-email-base / data-email-endpoint của panel.
   Gợi ý tự động: dò tên/loại voucher (data-card-theme | data-voucher-name | .summary__list--items)
     theo data-tags của banner mẫu -> chọn banner + layout gợi ý (data-layout) + màu "Auto".
     Khách tự chọn mục nào thì mục đó không bị ghi đè; "Reset to suggestion" trả về gợi ý.
   Màu Auto: đọc pixel ảnh banner (canvas) -> màu chủ đạo, làm tối tới khi chữ trắng đạt tương phản 4.5:1.
   Save -> thẻ tóm tắt #cvvPeDone. Đóng panel khi chưa Save -> về "For myself".
   JS không dựng markup: chỉ đổi text / val / src / class / hidden / biến CSS.

   Xuất window.cvvGift = { isGift(), open(), saved(), refreshSuggestion() } cho file validate (checkout-voucher*.js).
   ========================================================================== */
(function (SCRIPT_SRC) {
jQuery(function ($) {
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var MAX_FILE = 10 * 1024 * 1024;
    var FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var DEFAULT_HEX = '#8C7145';
    var LAYOUT_NAMES = { classic: 'Classic', overlay: 'Overlay', split: 'Split', minimal: 'Minimal' };

    var $panel = $('#cvvGiftPanel');
    if (!$panel.length) return;
    var panel = (window.bootstrap && bootstrap.Offcanvas) ? bootstrap.Offcanvas.getOrCreateInstance($panel[0]) : null;
    var $name = $('.input__receive__name'), $mail = $('.input__receive__email'), $note = $('.input__receive__note');
    var $add = $('#cvvCardAdd');
    var $banner = $('#cvvCardBanner');
    var $layout = $('#cvvCardLayout'), $colour = $('#cvvCardColour'), $hex = $('#cvvCardColourHex');
    var $file = $('#cvvBannerFile'), $upBtn = $('#cvvUploadBtn');
    var $card = $('#cvvCard'), $img = $('#cvvCardImg');
    var $pv = $('#cvvEmailPv'), pvFrame = $('#cvvEmailPvFrame')[0];

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    /* Ảnh QR mẫu: …/assets/js/modules/voucher/checkout-voucher-gift.js -> …/assets/img/qr-sample.svg (demo lẫn skin production) */
    var QR_SAMPLE = new URL('../../../img/qr-sample.svg', SCRIPT_SRC).href;

    var lastFile = null;                                 // File hợp lệ gần nhất (khôi phục khi file mới bị từ chối)
    var upload = null;                                   // { url } ảnh khách tự tải (blob URL)
    var autoHex = DEFAULT_HEX;                           // màu Auto lấy từ banner hiện tại
    var touched = { banner: false, layout: false, colour: false };
    var suggestion = { banner: 'celebrate', layout: 'overlay', theme: 'Celebrate' };
    var saved = null;

    var val = function ($el) { return $.trim($el.val() || ''); };
    var abs = function (u) { try { return u ? new URL(u, location.href).href : ''; } catch (e) { return u || ''; } };
    var isGift = function () { return $('input[name="cvv_for"]:checked').val() === 'gift'; };
    var setMode = function (gift) { $('input[name="cvv_for"][value="' + (gift ? 'gift' : 'me') + '"]').prop('checked', true); };
    var hasCard = function () { return true; };   // e-card luôn có (input ẩn card_add = 1)
    var buyerName = function () { return val($('.input__guest__firstname')) || val($('.input__member__firstname')); };
    var $preset = function (id) { return $('#cvvBanners [data-banner="' + id + '"]'); };
    var bannerName = function () {
        return $banner.val() === 'upload' ? 'Your own photo' : $.trim($preset($banner.val()).find('.yq-pe-banner__name').text());
    };
    var colourName = function () {
        return $colour.val() === 'auto' ? 'Auto colour' : $.trim($('#cvvSwatches [data-colour="' + $colour.val() + '"]').text());
    };

    /* ======================= Gợi ý theo voucher ======================= */
    /* Text trong giỏ: nối các text node bằng dấu cách (markup giỏ thường không có xuống dòng / khoảng trắng giữa thẻ) */
    var cartText = function () {
        return $.trim($('.summary__list--items').find('*').addBack().contents().filter(function () { return this.nodeType === 3; })
            .map(function () { return this.nodeValue; }).get().join(' ').replace(/\s+/g, ' '));
    };
    var voucherText = function () {
        return $panel.attr('data-voucher-name') || cartText() || '';
    };
    var detectSuggestion = function () {
        var theme = $.trim($panel.attr('data-card-theme') || '');
        var $best = theme ? $preset(theme).filter('[data-tags]') : $();
        if (!$best.length) {
            var text = ' ' + voucherText().toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ', bestScore = 0;
            $('#cvvBanners [data-tags]').each(function () {
                var score = 0;
                $.each(($(this).attr('data-tags') || '').split(/\s+/), function (i, tag) {
                    if (tag && text.indexOf(' ' + tag) > -1) score += tag.length > 3 ? 2 : 1;
                });
                if ($(this).attr('data-kind') === 'occasion') score *= 3;   // dịp (sinh nhật, Giáng sinh…) ưu tiên hơn loại sản phẩm
                if (score > bestScore) { bestScore = score; $best = $(this); }
            });
        }
        if (!$best.length) $best = $('#cvvBanners [data-fallback]').first();
        if (!$best.length) $best = $('#cvvBanners [data-tags]').first();
        suggestion = {
            banner: $best.attr('data-banner'),
            layout: $best.attr('data-layout') || 'classic',
            theme: $.trim($best.find('.yq-pe-banner__name').text())
        };
        var name = productName();
        if (name === DEFAULT_PRODUCT) name = '';
        $('#cvvSuggestFor').text(name.length > 60 ? name.slice(0, 57) + '…' : (name || 'your voucher'));
        $('#cvvSuggestTheme').text(suggestion.theme);
        $('#cvvBanners [data-banner]').removeClass('is-suggested');
        $preset(suggestion.banner).addClass('is-suggested');
        $('#cvvLayouts [data-layout]').removeClass('is-suggested');
        $('#cvvLayouts [data-layout="' + suggestion.layout + '"]').addClass('is-suggested');
        filterIdeas();
    };
    /* Mẫu lời nhắn: hiện nút có data-themes chứa id banner gợi ý hoặc "any" (tối đa 4) */
    var filterIdeas = function () {
        var theme = suggestion.banner, shown = 0;
        $('.cvv-idea').each(function () {
            var t = ' ' + ($(this).attr('data-themes') || '') + ' ';
            var ok = (t.indexOf(' ' + theme + ' ') > -1 || t.indexOf(' any ') > -1) && shown < 4;
            if (ok) shown++;
            $(this).prop('hidden', !ok);
        });
    };
    var applySuggestion = function (force) {
        if (force || !touched.banner) selectBanner(suggestion.banner, false);
        if (force || !touched.layout) setLayout(suggestion.layout, false);
        if (force || !touched.colour) setColour('auto', false);
        if (force) touched = { banner: false, layout: false, colour: false };
        updateSuggestBar();
    };
    var updateSuggestBar = function () {
        $('#cvvSuggestReset').prop('hidden', !(touched.banner || touched.layout || touched.colour));
    };

    /* ======================= Màu Auto từ ảnh ======================= */
    var lum = function (r, g, b) {
        var f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    var toHex = function (r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); };
    /* Màu chủ đạo: gom pixel theo ô màu, ưu tiên màu có độ bão hoà, bỏ gần trắng / gần đen */
    var dominant = function (source) {
        try {
            var c = document.createElement('canvas'), w = 40, h = 40;
            c.width = w; c.height = h;
            var ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(source, 0, 0, w, h);
            var d = ctx.getImageData(0, 0, w, h).data, buckets = {}, grey = {};
            for (var i = 0; i < d.length; i += 4) {
                var r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
                var max = Math.max(r, g, b), min = Math.min(r, g, b);
                if (a < 200 || max > 245 && min > 230 || max < 55) continue;   // bỏ gần trắng / quá tối (bóng đổ)
                var sat = max ? (max - min) / max : 0;
                if (sat < 0.22) { grey.n = (grey.n || 0) + 1; continue; }   // bỏ pixel xám/trung tính, chỉ dùng khi ảnh toàn xám
                var key = (r >> 5) + ',' + (g >> 5) + ',' + (b >> 5);
                var k = buckets[key] || (buckets[key] = { n: 0, w: 0, r: 0, g: 0, b: 0 });
                var wgt = 1 + sat * 3;
                k.n++; k.w += wgt; k.r += r; k.g += g; k.b += b;
            }
            var best = null;
            $.each(buckets, function (key, k) { if (!best || k.w > best.w) best = k; });
            if (!best || best.n < 6) return null;   // ảnh gần như không có màu (grey.n chiếm hết) -> dùng màu mặc định
            var R = best.r / best.n, G = best.g / best.n, B = best.b / best.n;
            /* làm tối tới khi chữ trắng đạt 4.5:1 (lum <= 0.183) */
            for (var s = 0; s < 20 && lum(R, G, B) > 0.183; s++) { R *= 0.9; G *= 0.9; B *= 0.9; }
            return toHex(R, G, B);
        } catch (e) { return null; }   // ảnh khác domain (canvas bị khoá) -> giữ màu mặc định
    };
    var autoSeq = 0;   // mỗi lần đổi banner tăng lên; kết quả của lần cũ (ảnh tải xong muộn) bị bỏ qua
    var computeAuto = function () {
        var seq = ++autoSeq;
        var id = $banner.val(), done = function (hex) {
            if (seq !== autoSeq) return;
            autoHex = hex || DEFAULT_HEX;
            $('#cvvAutoSwatch')[0].style.setProperty('--sw', autoHex);
            if ($colour.val() === 'auto') applyColour();
        };
        var src = id === 'upload' ? (upload && upload.url) : $preset(id).attr('data-src');
        if (!src) { done(null); return; }
        var im = new Image();
        if (!/^blob:/.test(src)) im.crossOrigin = 'anonymous';
        im.onload = function () { done(dominant(im)); };
        im.onerror = function () { done(null); };
        im.src = src;
    };

    /* ======================= Áp lựa chọn lên thiệp ======================= */
    var applyColour = function () {
        var c = $colour.val(), el = $card[0];
        var hex = c === 'auto' ? autoHex : ($('#cvvSwatches [data-colour="' + c + '"]').attr('data-hex') || DEFAULT_HEX);
        if (c === 'auto') {
            el.style.setProperty('--c-bg', autoHex);
            el.style.setProperty('--c-line', 'rgba(255,255,255,.35)');
            el.style.setProperty('--c-soft', 'rgba(255,255,255,.74)');
        } else {
            el.style.removeProperty('--c-bg'); el.style.removeProperty('--c-line'); el.style.removeProperty('--c-soft');
        }
        $hex.val(hex);
        $card.attr('class', 'yq-pe-card cvv-ecard is-' + ($layout.val() || 'classic') + (c === 'auto' ? '' : ' yq-pe-card--' + c));
        $('#cvvSwatches [data-colour]').each(function () {
            var on = $(this).attr('data-colour') === c;
            $(this).toggleClass('is-active', on).attr('aria-checked', on ? 'true' : 'false');
        });
    };
    var setColour = function (c, byUser) {
        $colour.val(c);
        if (byUser) { touched.colour = true; updateSuggestBar(); }
        applyColour();
    };
    var setLayout = function (l, byUser) {
        $layout.val(l);
        if (byUser) { touched.layout = true; updateSuggestBar(); }
        $('#cvvLayouts [data-layout]').each(function () {
            var on = $(this).attr('data-layout') === l;
            $(this).toggleClass('is-active', on).attr('aria-checked', on ? 'true' : 'false');
        });
        applyColour();
    };
    var renderMedia = function () {
        var id = $banner.val();
        $img.attr('src', id === 'upload' ? (upload ? upload.url : '') : ($preset(id).attr('data-src') || ''));
    };
    var selectBanner = function (id, byUser) {
        var $b = $preset(id);
        if (id !== 'upload' && !$b.length) return;
        $banner.val(id);
        $('#cvvBanners [data-banner]').each(function () { $(this).toggleClass('is-active', $(this).attr('data-banner') === id); });
        if (byUser) {
            touched.banner = true;
            if (!touched.layout && $b.attr('data-layout')) setLayout($b.attr('data-layout'), false);   // layout đi theo banner nếu khách chưa tự chọn
            updateSuggestBar();
        }
        renderMedia();
        computeAuto();
    };

    /* ======================= Xem trước thiệp + tóm tắt ======================= */
    var updatePreview = function () {
        var msg = val($note), to = val($name), from = buyerName();
        $('#cvvPvTo').text(to || 'Recipient');
        $('#cvvPvRcp, #cvvPvRcpNone').text(to || 'Your recipient');
        $('#cvvPvMsg').text(msg || 'Your message will appear here.').toggleClass('is-empty', !msg);
        $('#cvvPvFrom').text(from || 'a friend');   // cùng fallback với email
        $('#cvvSignAs').text(from || 'a friend');
        $('.cvv-idea').each(function () { $(this).toggleClass('is-active', $(this).attr('data-msg') === msg); });
        $('#cvvNoteCount').text(($note.val() || '').length);
    };
    var toggleCard = function () {
        var on = hasCard();
        $('#cvvCardFields').prop('hidden', !on);
        /* card_* (kể cả card_add) chỉ POST khi đang "Send as a gift"; For myself -> tắt để backend không nhận thiệp thừa */
        $('#cvvCardFields input').add($add).prop('disabled', !(on && isGift()));
        $card.prop('hidden', !on);
        $('#cvvPvLine').prop('hidden', !on);
        if (on) renderMedia();
    };
    var showSummary = function () {
        var msg = val($note);
        $('#cvvPeTo').text('To ' + val($name) + ' · ' + val($mail));
        $('#cvvPeMsg').text(msg ? '“' + msg + '”' : '').prop('hidden', !msg);
        $('#cvvPeCard').text('Personalised e-card · ' + bannerName() + ' · ' + (LAYOUT_NAMES[$layout.val()] || '') + ' · ' + colourName())
            .prop('hidden', !hasCard());
        $('#cvvPeDone').prop('hidden', false);
    };

    /* ======================= Xem trước cả email (hộp #cvvEmailPv) ======================= */
    /* Tên voucher: data-voucher-name của panel, không có thì dòng đầu trong giỏ (.summary__list--items) */
    var DEFAULT_PRODUCT = 'Your e-voucher from The Shop';
    var productName = function () {
        return $.trim($panel.attr('data-voucher-name') || $('.summary__list--items p').first().find('span').first().contents().first().text() || '')
            || DEFAULT_PRODUCT;
    };
    var escHtml = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    /* Ảnh banner cho email: ảnh mẫu (URL tuyệt đối) hoặc ảnh khách tự tải (blob URL) */
    var bannerStill = function () {
        if ($banner.val() !== 'upload') return abs($preset($banner.val()).attr('data-src'));
        return upload ? upload.url : '';
    };
    /* Biến cho YQEmail.build — mã voucher / QR / hạn dùng là MẪU (chỉ có thật sau khi thanh toán) */
    var emailVars = function () {
        var d = new Date(), from = buyerName() || 'a friend';
        var giftUrl = abs($panel.attr('data-gift-url')) || '#';
        var still = hasCard() ? bannerStill() : '';
        return {
            recipient_name: val($name) || 'Recipient',
            sender_name: from,
            gift_message: val($note),
            card_bg: $hex.val() || DEFAULT_HEX,
            card_banner: still,
            card_banner_overlay: still,
            card_banner_split: still,
            gift_url: giftUrl,
            redeem_date: d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(),
            product_name: productName(),
            redeem_expiry: $.trim($panel.attr('data-voucher-expiry') || '') || 'Confirmed after payment',
            voucher: 'GH-XXXX-XXXX',
            qr_code_html: '<img src="' + escHtml(QR_SAMPLE) + '" width="120" height="120" alt="Sample QR code" style="display:block;border:0;">',
            product_description_html: escHtml($.trim($panel.attr('data-voucher-desc') || '') || 'Full voucher details, terms and how to redeem are included in this email.'),
            preheader: from + ' sent you a gift from The Shop'
        };
    };
    var pvSeq = 0, pvReturn = null;
    var pvState = function (state) {   // 'ok' | 'loading' | 'unavailable' | 'error'
        $pv.toggleClass('is-loading', state === 'loading');
        pvFrame.hidden = state === 'unavailable' || state === 'error';
        $('#cvvEmailPvMsg').prop('hidden', state !== 'unavailable');
        $('#cvvEmailPvErr').prop('hidden', state !== 'error');
    };
    var renderEmail = function () {
        var seq = ++pvSeq;
        if (!window.YQEmail || typeof window.YQEmail.build !== 'function') { pvState('unavailable'); return; }
        var opts = { layout: hasCard() ? ($layout.val() || 'classic') : 'none', endpoint: $panel.attr('data-email-endpoint') || '', client: 'normal', emulateCrop: true };
        if ($panel.attr('data-email-base')) opts.base = $panel.attr('data-email-base');   // trống -> module tự suy thư mục email/
        pvState('loading');
        var fail = function () { if (seq === pvSeq) pvState('error'); };
        var build = function (o) { return Promise.resolve().then(function () { return window.YQEmail.build(emailVars(), o); }); };
        /* endpoint lỗi -> thử ráp từ template tĩnh email/ (email/README.md); vẫn lỗi -> hiện #cvvEmailPvErr */
        var p = build(opts);
        if (opts.endpoint) p = p.then(null, function () { return build($.extend({}, opts, { endpoint: '' })); });
        p.then(function (html) {
            if (seq !== pvSeq) return;
            if (!html) { fail(); return; }
            pvFrame.srcdoc = html;
            pvState('ok');
        }, fail);
    };
    var setPvWidth = function (w) {
        $pv.toggleClass('is-mobile', w === 'mobile');
        $pv.find('[data-width]').each(function () {
            var on = $(this).attr('data-width') === w;
            $(this).toggleClass('is-active', on).attr('aria-pressed', on ? 'true' : 'false');
        });
    };
    var openEmail = function () {
        pvReturn = document.activeElement;
        $panel.children().not($pv).attr('inert', '');   // phần còn lại của panel không nhận focus / click khi hộp mở
        $pv.prop('hidden', false);
        $('#cvvEmailPvClose').trigger('focus');
        renderEmail();
    };
    var closeEmail = function (noFocus) {
        if ($pv.prop('hidden')) return;
        pvSeq++;
        $pv.prop('hidden', true);
        $panel.children().removeAttr('inert');
        if (!noFocus && pvReturn && pvReturn.focus) pvReturn.focus();
        pvReturn = null;
    };

    /* ======================= Lưu / huỷ ======================= */
    var snapshot = function () {
        return { name: $name.val(), email: $mail.val(), note: $note.val(), add: hasCard(), banner: $banner.val(),
                 layout: $layout.val(), colour: $colour.val(), touched: $.extend({}, touched) };
    };
    var restore = function (s) {
        $name.val(s.name); $mail.val(s.email); $note.val(s.note);
        touched = $.extend({}, s.touched);
        $name.add($mail).removeClass('error');
        $('.cvv-ferr').prop('hidden', true);
        selectBanner(s.banner, false);
        $layout.val(s.layout); setLayout(s.layout, false); setColour(s.colour, false);
        toggleCard(); updatePreview(); updateSuggestBar();
    };
    var clearGift = function () {
        saved = null;
        $file.val('');
        if (upload) URL.revokeObjectURL(upload.url);
        upload = null; lastFile = null;
        $upBtn.removeClass('has-file').find('img').attr('src', '').prop('hidden', true);
        $('#cvvUpTxt').text('Photo');
        $('#cvvUpName').text('Upload your own');
        $('#cvvUploadErr').prop('hidden', true);
        $name.add($mail).add($note).val('').removeClass('error');
        touched = { banner: false, layout: false, colour: false };
        applySuggestion(true);
        setMode(false);
        toggleCard(); updatePreview();
        $('#cvvPeDone').prop('hidden', true);
    };
    var open = function () {
        updatePreview(); toggleCard();
        if (panel) panel.show(); else $panel.addClass('show');
    };
    var close = function () { if (panel) panel.hide(); else $panel.removeClass('show'); };

    /* ======================= Sự kiện ======================= */
    $('input[name="cvv_for"]').on('change', function () { if (isGift()) open(); else clearGift(); });
    $('.cvv-for__opt--gift').on('click', function () { if (isGift() && saved) open(); });
    $('#cvvPeEdit').on('click', open);
    $('#cvvPeRemove').on('click', clearGift);
    $name.add($note).add($mail).on('input', updatePreview);
    $name.add($mail).on('input', function () {
        $(this).removeClass('error');
        $('#' + this.id + 'Err').prop('hidden', true);
    });
    /* Ô email: báo lỗi khi rời ô nếu đã gõ mà sai định dạng */
    $mail.on('blur', function () {
        var bad = !!val($mail) && !EMAIL_RE.test(val($mail));
        $mail.toggleClass('error', bad); $('#cvvRcpEmailErr').prop('hidden', !bad);
    });
    $(document).on('click', '.cvv-idea', function () {
        $note.val($(this).attr('data-msg')).trigger('input').trigger('focus');
    });
    $(document).on('input', '.input__guest__firstname, .input__member__firstname', updatePreview);
    $('#cvvSuggestReset').on('click', function () { applySuggestion(true); });

    $(document).on('click', '#cvvBanners [data-banner]', function () {
        var id = $(this).attr('data-banner');
        $('#cvvUploadErr').prop('hidden', true);
        /* Upload: chưa có file, hoặc đang chọn sẵn ô upload -> mở hộp chọn file (đổi ảnh khác) */
        if (id === 'upload' && (!upload || $banner.val() === 'upload')) { $file.trigger('click'); return; }
        selectBanner(id, true);
    });
    $file.on('change', function () {
        var f = this.files && this.files[0];
        if (!f) return;
        if (FILE_TYPES.indexOf(f.type) < 0 || f.size > MAX_FILE) {
            $('#cvvUploadErr').prop('hidden', false);
            /* giữ file hợp lệ trước đó (nếu có) để form vẫn gửi đúng card_banner_file */
            try { var dt = new DataTransfer(); if (lastFile) dt.items.add(lastFile); this.files = dt.files; } catch (err) { this.value = ''; }
            if (!lastFile && $banner.val() === 'upload') applySuggestion(true);
            return;
        }
        lastFile = f;
        if (upload) URL.revokeObjectURL(upload.url);
        upload = { url: URL.createObjectURL(f) };
        $upBtn.addClass('has-file').find('img').attr('src', upload.url).prop('hidden', false);
        $('#cvvUpTxt').text('Change');
        $('#cvvUpName').text('Your photo');
        selectBanner('upload', true);
    });
    $(document).on('click', '#cvvLayouts [data-layout]', function () { setLayout($(this).attr('data-layout'), true); });
    $(document).on('click', '#cvvSwatches [data-colour]', function () { setColour($(this).attr('data-colour'), true); });

    $('#cvvGiftSave').on('click', function () {
        $name.toggleClass('error', !val($name));
        $mail.toggleClass('error', !EMAIL_RE.test(val($mail)));
        $('#cvvRcpNameErr').prop('hidden', !$name.hasClass('error'));
        $('#cvvRcpEmailErr').prop('hidden', !$mail.hasClass('error'));
        if ($name.hasClass('error')) { $name.trigger('focus'); return; }
        if ($mail.hasClass('error')) { $mail.trigger('focus'); return; }
        if (hasCard() && $banner.val() === 'upload' && (!upload || !($file[0].files && $file[0].files.length))) { $('#cvvUploadErr').prop('hidden', false); return; }
        saved = snapshot();
        setMode(true);
        showSummary();
        close();
    });
    $('#cvvEmailPvOpen').on('click', openEmail);
    $('#cvvEmailPvClose').on('click', function () { closeEmail(); });
    $pv.on('click', '[data-width]', function () { setPvWidth($(this).attr('data-width')); });
    $pv.on('click', function (e) { if (e.target === this) closeEmail(); });   // bấm nền mờ quanh hộp
    /* Esc chỉ đóng hộp, không lan lên offcanvas (Bootstrap nghe keydown trên chính panel) */
    $pv.on('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeEmail(); }
    });
    /* Focus nằm trong iframe thì keydown không ra tới trang -> nghe thêm trong tài liệu của iframe (srcdoc cùng origin) */
    pvFrame.addEventListener('load', function () {
        try {
            pvFrame.contentDocument.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeEmail(); });
        } catch (e) { /* không truy cập được tài liệu iframe -> chỉ Esc ngoài iframe */ }
    });
    $panel.on('hide.bs.offcanvas', function () { closeEmail(true); });
    $panel.on('hidden.bs.offcanvas', function () {
        if (!saved) { clearGift(); return; }
        setMode(true);
        restore(saved);
    });

    /* ======================= Khởi tạo ======================= */
    detectSuggestion();
    applySuggestion(true);
    toggleCard();
    updatePreview();
    /* Server trả form về (lỗi) với người nhận đã điền -> giữ trạng thái quà (thiết kế thiệp về gợi ý; file phải chọn lại) */
    if (val($name) && EMAIL_RE.test(val($mail))) {
        saved = snapshot();
        setMode(true);
        toggleCard();
        showSummary();
    } else if (val($name) || val($mail)) {
        /* có người nhận nhưng thiếu / sai email -> giữ chế độ quà, chưa Save: Pay Now sẽ mở lại panel (không POST người nhận dở dang ở For myself) */
        setMode(true);
        toggleCard();
    }

    window.cvvGift = {
        isGift: isGift,
        saved: function () { return !!saved; },
        open: open,
        /* gọi lại khi giỏ / tên voucher thay đổi: chỉ đổi những mục khách chưa tự chọn */
        refreshSuggestion: function () { detectSuggestion(); applySuggestion(false); }
    };
});
})((document.currentScript && document.currentScript.src) || location.href);
