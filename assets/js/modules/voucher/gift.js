/* =====================================================================
   Module JS: gift — trang người nhận mở quà (gift.html)
   Bấm phong bì / nút "Open your gift" -> thêm .is-open vào .gf-stage (CSS chạy hiệu ứng),
   "Replay" đóng lại rồi mở lại; nút Copy mã voucher.
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
    var open = function () {
        if ($stage.hasClass('is-open')) return;
        $stage.addClass('is-open');
        $('#gfEnv').attr('aria-expanded', 'true');
        fitHeight();
        setTimeout(function () { $('#gfCard').trigger('focus'); }, reduce ? 0 : 1300);
    };

    $('#gfEnv, #gfOpenBtn').on('click', open);
    $('#gfReplay').on('click', function () {
        $stage.removeClass('is-open');
        $('#gfEnv').attr('aria-expanded', 'false');
        setTimeout(open, 450);
    });
    $(window).on('resize', fitHeight);
    if (/[?&]open=1\b/.test(location.search)) open();

    /* Copy mã voucher */
    $('#gfCopy').on('click', function () {
        var $b = $(this), code = $.trim($('#gfCode').text());
        var done = function () {
            $b.addClass('is-done').text('Copied');
            setTimeout(function () { $b.removeClass('is-done').text('Copy'); }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
        else done();
    });
});
