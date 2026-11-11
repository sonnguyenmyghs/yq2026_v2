/* =====================================================================
   Module JS: gift — trang người nhận mở quà (voucher/gift.html, thiết kế "Luxe Ticket v2")
   Bấm phong bì / nút "Open your gift" -> thêm .is-open vào .gf-stage (CSS chạy hiệu ứng),
   "Replay" đóng lại rồi mở lại; nút Copy mã voucher trên cuống vé (chỉ đổi chữ .gf-copy__txt).
   ?open=1 trên URL -> mở sẵn (dùng khi quay lại trang). JS không dựng markup.
   ===================================================================== */
jQuery(function ($) {
    var $stage = $('#gfStage');
    if (!$stage.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var fitHeight = function () {
        var h = $('#gfCard').outerHeight();
        if (h) $stage[0].style.setProperty('--gf-card-h', h + 'px');
    };
    /* silent = true (mở sẵn bằng ?open=1): không chuyển focus để trang không tự cuộn */
    var open = function (silent) {
        if ($stage.hasClass('is-open')) return;
        $stage.addClass('is-open');
        $('#gfEnv').attr('aria-expanded', 'true');
        fitHeight();
        if (silent === true) return;
        setTimeout(function () {
            var card = document.getElementById('gfCard');
            try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
        }, reduce ? 0 : 1300);
    };

    $('#gfEnv, #gfOpenBtn').on('click', function () { open(); });
    $('#gfReplay').on('click', function () {
        $stage.removeClass('is-open');
        $('#gfEnv').attr('aria-expanded', 'false');
        setTimeout(function () { open(); }, 450);
    });
    $(window).on('resize', fitHeight);
    if (/[?&]open=1\b/.test(location.search)) open(true);

    /* Copy mã voucher — đọc text #gfCode (server in sẵn), chỉ đổi chữ + class của nút */
    var copyTimer;
    $('#gfCopy').on('click', function () {
        var $b = $(this), $t = $b.find('.gf-copy__txt'), code = $.trim($('#gfCode').text());
        var show = function (ok) {
            clearTimeout(copyTimer);
            $b.toggleClass('is-done', ok);
            $t.text(ok ? 'Copied' : 'Select to copy');
            copyTimer = setTimeout(function () { $b.removeClass('is-done'); $t.text('Copy code'); }, 1800);
        };
        var fallback = function () {
            /* Trình duyệt cũ / không phải https: bôi đen mã để khách tự copy */
            var el = document.getElementById('gfCode'), r = document.createRange(), sel = window.getSelection();
            r.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(r);
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) {}
            show(ok);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { show(true); }, fallback);
        else fallback();
    });
});
