/* ==========================================================================
   Invite friends — dùng chung bản demo (member/invite.html) và production
   (member/invite-production.html). Giữ luồng template cũ: form POST thẳng
   invite[mail_to] / invite[mail_content] / invite[mail_subject] + token.
   JS chỉ thêm:
   - nút Copy link mời (#invLink)
   - nút chia sẻ a[data-inv-share] mở cửa sổ nhỏ (href do backend in sẵn, chặn popup thì đi theo link)
   - kiểm tra ô Mail To (nhiều email, ngăn bằng dấu phẩy) + ô nội dung trước khi gửi
   Viết an toàn với template engine: jQuery thay ký hiệu đô-la, ngoặc nhọn không cùng dòng.
   ========================================================================== */
jQuery(function () {
    var form = jQuery('#invForm');
    var linkInput = jQuery('#invLink');
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@][^\s@]+(?![\s\S])/;

    /* --- copy link --- */
    var copyBtn = jQuery('[data-inv-copy]');
    var copyLabel = copyBtn.find('[data-inv-copy-label]');
    var copyText = copyLabel.text();
    var copyTimer = null;

    var copyDone = function (ok) {
        copyLabel.text(ok ? 'Copied' : 'Press Ctrl/Cmd + C');
        copyBtn.toggleClass('is-done', ok);
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
            copyLabel.text(copyText);
            copyBtn.removeClass('is-done');
        }, 2200);
    };

    copyBtn.on('click', function () {
        var el = linkInput.get(0);
        var val = String(linkInput.val() || '');
        if (!el || !val) {
            return;
        }
        el.focus();
        el.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(val).then(function () {
                copyDone(true);
            }, function () {
                copyDone(false);
            });
            return;
        }
        var ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (err) {
            ok = false;
        }
        copyDone(ok);
    });

    /* --- chia sẻ: mở cửa sổ nhỏ, bị chặn popup thì để link mở tab mới như bình thường --- */
    jQuery(document).on('click', 'a[data-inv-share]', function (e) {
        var href = jQuery(this).attr('href');
        if (!href || window.innerWidth < 768) {
            return;
        }
        var win = window.open(href, 'yqInviteShare', 'width=640,height=600');
        if (win) {
            win.opener = null;
            e.preventDefault();
        }
    });

    if (!form.length) {
        return;
    }

    /* --- kiểm tra form email --- */
    var mailTo = jQuery('#invMailTo');
    var content = jQuery('#invContent');

    var showErr = function (field, msg) {
        var box = form.find('[data-err-for="' + field.attr('id') + '"]');
        field.toggleClass('is-invalid', !!msg);
        box.text(msg || '').toggleClass('is-on', !!msg);
    };

    var checkMails = function () {
        var list = String(mailTo.val() || '').split(/[\s,;]+/).filter(Boolean);
        if (!list.length) {
            return 'Enter at least one email address.';
        }
        var bad = list.filter(function (m) {
            return !RE_MAIL.test(m);
        });
        if (bad.length) {
            return 'Not a valid email address: ' + bad[0];
        }
        return '';
    };

    mailTo.on('blur', function () {
        if (jQuery.trim(mailTo.val())) {
            showErr(mailTo, checkMails());
        }
    });
    mailTo.on('input', function () {
        if (mailTo.hasClass('is-invalid')) {
            showErr(mailTo, checkMails());
        }
    });
    content.on('input', function () {
        if (jQuery.trim(content.val())) {
            showErr(content, '');
        }
    });

    form.on('submit', function (e) {
        var mailErr = checkMails();
        var contentErr = jQuery.trim(content.val()) ? '' : 'Write a short message for your friends.';
        showErr(mailTo, mailErr);
        showErr(content, contentErr);
        if (mailErr || contentErr) {
            e.preventDefault();
            (mailErr ? mailTo : content).trigger('focus');
        }
    });
});
