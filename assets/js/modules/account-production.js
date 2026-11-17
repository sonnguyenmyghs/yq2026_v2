/* ==========================================================================
   Module JS: account — bản PRODUCTION (thay account.js trên server thật)
   Nạp sau app.js, cần jQuery + Bootstrap 5 bundle.

   Phiên đăng nhập do backend PHP quản lý. JS KHÔNG lưu gì ở trình duyệt, chỉ đọc HTML server in:
     #yqMemberBtn  [data-yq-member]  : đã đăng nhập  -> bấm mở popup member #yqAcctPop
     #yqAccountBtn [data-yq-account] : chưa đăng nhập -> bấm mở popup Log in #yqAuthModal
   Tên, email, avatar, title của nút: server in sẵn, JS chỉ điền chữ cái đầu từ data-name.

   Gồm:
     1. Chữ cái đầu cho avatar
     2. Popup Log in / Register / Quên mật khẩu: chỉ kiểm tra ô trống / email sai,
        hợp lệ thì để form POST lên server (form phải có action)
     3. Popup member #yqAcctPop: mở / đóng, đo vị trí mũi tên, pane con (My wallet)
     4. Logout là link thật -> trình duyệt đi theo link, không chặn
     5. Template register step 2: xoá field bị tắt, dời field thêm (giống template cũ)

   Bỏ so với account.js (chỉ dùng cho demo): lưu người dùng localStorage, đăng nhập /
   đăng ký giả, toast, tự chuyển trang sau logout, vẽ lại nút khách.
   File viết an toàn với template engine: dùng jQuery, không dùng ký hiệu đô-la,
   không mở và đóng ngoặc nhọn trên cùng một dòng.
   ========================================================================== */
(function (jq) {
    'use strict';

    if (!window.bootstrap || !window.bootstrap.Modal) {
        return;
    }
    var BS = window.bootstrap;
    var YQ = window.YQ = window.YQ || new Object();

    var BTN = '#yqAccountBtn, #yqMemberBtn';
    var POP = '#yqAcctPop';
    var SIGNED_IN = !!document.getElementById('yqMemberBtn');
    /* email: a@b.cc — viết không dùng ký hiệu đô-la / ngoặc nhọn để engine không đụng vào */
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@][^\s@]+(?![\s\S])/;

    /* Dọn dữ liệu bản demo cũ còn sót ở máy khách (gây "Hi, ..." trên nút khách sau logout) */
    try {
        window.localStorage.removeItem('yq_user_v1');
    } catch (err) {
        /* trình duyệt chặn storage: bỏ qua */
    }

    function btnEl() {
        return jq(BTN).first();
    }

    /* ======================================================================
       1. Chữ cái đầu: server in tên vào data-name, JS lấy ký tự đầu viết hoa
       ====================================================================== */
    function initialOf(name) {
        return (jq.trim(name || '').charAt(0) || '?').toUpperCase();
    }
    jq('.yq-acct-initial[data-name], .yq-acct__avatar[data-name]').each(function () {
        jq(this).text(initialOf(jq(this).attr('data-name')));
    });

    /* Trạng thái cho module khác hỏi (chỉ đọc) */
    var memberName = jq.trim(jq('#yqMemberBtn [data-name]').attr('data-name') || '');
    YQ.auth = new Object();
    YQ.auth.isIn = function () {
        return SIGNED_IN;
    };
    YQ.auth.name = function () {
        return SIGNED_IN ? memberName : '';
    };
    YQ.auth.initial = function () {
        return initialOf(memberName);
    };
    YQ.auth.update = function () {
        return null;                                 // hồ sơ đổi qua server, JS không giữ bản sao
    };

    /* ======================================================================
       2. Kiểm tra form
       ====================================================================== */
    function fail(el, msg) {
        el.addClass('is-invalid');
        jq('[data-err-for="' + el.attr('id') + '"]').text(msg).addClass('is-on');
        return false;
    }
    function clearErrors(scope) {
        scope.find('.yq-input').removeClass('is-invalid');
        scope.find('.yq-error').removeClass('is-on').text('');
    }
    function val(id) {
        return jq.trim(jq('#' + id).val() || '');
    }
    /* flags: chuỗi gồm required / email / at (chỉ cần có @). same: ô phải bằng chuỗi này */
    function check(id, label, flags, same) {
        var el = jq('#' + id);
        if (!el.length) {
            return true;                             // field bị backend tắt
        }
        var v = jq.trim(el.val() || '');
        var has = function (f) {
            return (' ' + flags + ' ').indexOf(' ' + f + ' ') !== -1;
        };
        if (has('required') && !v) {
            return fail(el, label + ' is required');
        }
        if (has('email') && v && !RE_MAIL.test(v)) {
            return fail(el, 'Enter a valid email address');
        }
        if (has('at') && v && v.indexOf('@') < 0) {
            return fail(el, 'Enter a valid email address');
        }
        if (same !== undefined && v !== same) {
            return fail(el, 'Passwords do not match');
        }
        return true;
    }

    /* ======================================================================
       3. Popup Log in / Register / Quên mật khẩu (#yqAuthModal)
       ====================================================================== */
    var authModal = null;

    function buildAuth() {
        if (authModal) {
            return true;
        }
        var el = document.getElementById('yqAuthModal');
        if (!el) {
            return false;
        }
        authModal = new BS.Modal(el);
        return true;
    }

    /* name: 'login' | 'register' | 'forgot' */
    function showPane(name) {
        var m = jq('#yqAuthModal');
        clearErrors(m);
        m.find('.yq-auth__pane').each(function () {
            jq(this).prop('hidden', jq(this).attr('data-yq-pane') !== name);
        });
        m.find('.yq-auth__tab').each(function () {
            var on = jq(this).attr('data-yq-tab') === name;
            jq(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false');
        });
        m.find('.yq-auth__tabs').prop('hidden', name === 'forgot');
        setTimeout(function () {
            var input = m.find('.yq-auth__pane:not([hidden]) .yq-input')[0];
            if (input) {
                input.focus();
            }
        }, 120);
    }

    function openAuth(pane) {
        if (!buildAuth()) {
            return;
        }
        showPane(pane || 'login');
        authModal.show();
    }
    function closeAuth() {
        if (authModal) {
            authModal.hide();
        }
    }

    /* ======================================================================
       4. Popup member #yqAcctPop — dropdown dưới avatar
       ====================================================================== */
    function panes() {
        return jq(POP + ' [data-yq-acct-pane]');
    }
    function hasView(name) {
        return !!name && panes().filter('[data-yq-acct-pane="' + name + '"]').length > 0;
    }
    function showMain() {
        panes().prop('hidden', true);
        jq('#yqAcctMain').prop('hidden', false);
    }
    function showView(name) {
        if (!hasView(name)) {
            return;
        }
        jq('#yqAcctMain').prop('hidden', true);
        panes().each(function () {
            jq(this).prop('hidden', jq(this).attr('data-yq-acct-pane') !== name);
        });
    }

    /* Popup thẳng mép phải khối tools, mũi tên chỉ đúng tâm avatar */
    function place() {
        var pop = jq(POP)[0];
        var btn = btnEl()[0];
        if (!pop || !btn) {
            return;
        }
        var tools = jq(btn).closest('.yq-header__tools')[0] || btn;
        var t = tools.getBoundingClientRect();
        var b = btn.getBoundingClientRect();
        var shift = Math.max(0, Math.round(t.right - b.right));
        pop.style.setProperty('--yq-acct-shift', shift + 'px');
        pop.style.setProperty('--yq-acct-caret', Math.round(shift + b.width / 2) + 'px');
    }

    function popOpen() {
        return jq(POP).hasClass('is-open');
    }

    /* view = tên pane con (VD 'wallet') để mở thẳng pane đó */
    function openPop(view) {
        var pop = jq(POP);
        if (!pop.length) {
            return;
        }
        if (!SIGNED_IN) {
            openAuth('login');
            return;
        }
        if (hasView(view)) {
            showView(view);
        } else {
            showMain();
        }
        place();
        pop.prop('hidden', false);
        void pop[0].offsetWidth;                     // reflow để transition chạy từ trạng thái ẩn
        pop.addClass('is-open');
        btnEl().attr('aria-expanded', 'true');
        jq(document).off('keydown.yqAcct').on('keydown.yqAcct', function (e) {
            if (e.key === 'Escape') {
                closePop();
                btnEl().trigger('focus');
            }
        });
    }

    function closePop() {
        var pop = jq(POP);
        if (!pop.length || !popOpen()) {
            return;
        }
        pop.removeClass('is-open');
        btnEl().attr('aria-expanded', 'false');
        jq(document).off('keydown.yqAcct');
        var done = function () {
            if (!popOpen()) {
                pop.prop('hidden', true);
                showMain();
            }
        };
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            done();
        } else {
            setTimeout(done, 240);
        }
    }

    /* Bấm ra ngoài / Tab ra ngoài -> đóng; đổi kích thước -> đo lại; header thu gọn lúc cuộn -> đóng */
    function outside(e) {
        return !jq(e.target).closest(POP + ', ' + BTN).length;
    }
    jq(document).on('pointerdown focusin', function (e) {
        if (popOpen() && outside(e)) {
            closePop();
        }
    });
    jq(window).on('resize.yqAcct', function () {
        if (popOpen()) {
            place();
        }
    });
    jq(window).on('scroll.yqAcct', function () {
        if (popOpen() && jq('#yqHeader').hasClass('is-compact')) {
            closePop();
        }
    });
    /* Mở mega menu hoặc ô tìm kiếm -> nhường chỗ */
    jq(document).on('mouseenter', '.yq-nav__item--panel', closePop)
                .on('click', '[data-search-toggle]', closePop)
                .on('yq:header-ready', closePop);

    /* Nút account ở header */
    jq(document).on('click', '[data-yq-account], [data-yq-member]', function (e) {
        e.preventDefault();
        if (!SIGNED_IN) {
            openAuth('login');
            return;
        }
        if (popOpen()) {
            closePop();
        } else {
            openPop();
        }
    });

    /* ======================================================================
       Sự kiện form + popup
       ====================================================================== */
    jq(document)
        .on('click', '#yqAuthModal [data-yq-tab]', function () {
            showPane(jq(this).attr('data-yq-tab'));
        })
        .on('click', '#yqAuthModal [data-yq-forgot]', function () {
            jq('#yqFgEmail').val(val('yqAuthEmail'));
            showPane('forgot');
        })
        /* Hiện / ẩn mật khẩu */
        .on('click', '[data-yq-peek]', function () {
            var peek = jq(this);
            var input = peek.siblings('.yq-input');
            var show = input.attr('type') === 'password';
            input.attr('type', show ? 'text' : 'password');
            peek.toggleClass('is-on', show).attr('aria-label', show ? 'Hide password' : 'Show password');
        })

        /* Log in: chặn khi email thiếu @ hoặc mật khẩu trống, còn lại POST lên server */
        .on('submit', '#yqLoginForm', function (e) {
            clearErrors(jq(this));
            var ok = check('yqAuthEmail', 'Email', 'required at');
            ok = check('yqAuthPass', 'Password', 'required') && ok;
            if (!ok) {
                e.preventDefault();
            }
        })

        /* Register (popup hoặc member/register-step2-production.html, POST name="step2") */
        .on('submit', '#yqRegForm', function (e) {
            var form = jq(this);
            clearErrors(form);
            var ok = check('yqRegEmail', 'Email', 'required email');
            ok = check('yqRegPass', 'Password', 'required') && ok;
            ok = check('yqRegPass2', 'Repeated password', 'required', val('yqRegPass')) && ok;
            ok = check('yqRegFirst', 'First name', 'required') && ok;
            ok = check('yqRegLast', 'Last name', 'required') && ok;
            ok = check('yqRegCountry', 'Country', 'required') && ok;
            if (form.find('[name="gender"]').length && !form.find('[name="gender"]:checked').length) {
                jq('[data-err-for="yqRegGender"]').text('Please choose an option').addClass('is-on');
                ok = false;
            }
            if (form.find('#yqRegTerms').length && !jq('#yqRegTerms').is(':checked')) {
                jq('[data-err-for="yqRegTerms"]').text('Please accept the Terms and Privacy Policy').addClass('is-on');
                ok = false;
            }
            if (!ok) {
                e.preventDefault();
            }
        })

        /* Quên mật khẩu: kiểm tra email rồi để form POST (form cần action tới trang /forget của server) */
        .on('submit', '#yqForgotForm', function (e) {
            clearErrors(jq(this));
            if (!check('yqFgEmail', 'Email', 'required email')) {
                e.preventDefault();
            }
        })

        /* Popup member: pane con, link, logout */
        .on('click', POP + ' [data-yq-view]', function () {
            var v = jq(this).attr('data-yq-view');
            if (v) {
                showView(v);
            } else {
                showMain();
            }
        })
        .on('click', POP + ' a[href]', function () {
            closePop();                              // Logout cũng là link: để trình duyệt đi theo href
        })

        /* Gõ lại thì bỏ trạng thái lỗi */
        .on('input change', '#yqAuthModal .yq-input, #yqAcctPop .yq-input, #yqRegForm .yq-input', function () {
            jq(this).removeClass('is-invalid');
            jq('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
        })
        .on('change', '#yqRegForm [name="gender"], #yqRegTerms', function () {
            var id = this.name === 'gender' ? 'yqRegGender' : 'yqRegTerms';
            jq('[data-err-for="' + id + '"]').removeClass('is-on').text('');
        })

        /* Đóng popup auth -> xoá dữ liệu đã gõ, lần sau mở lại về tab Log in */
        .on('hidden.bs.modal', '#yqAuthModal', function () {
            var m = jq(this);
            m.find('form').each(function () {
                this.reset();
            });
            m.find('.yq-auth__pw .yq-input').attr('type', 'password');
            m.find('[data-yq-peek]').removeClass('is-on').attr('aria-label', 'Show password');
            clearErrors(m);
        });

    /* ======================================================================
       5. Template register step 2 (cấu trúc old/register_step2.html)
       - field backend tắt (inputDisabled) -> xoá khỏi DOM để không POST
       - field thêm (sectionExtra) có data-field / data-location -> dời tới trước / sau field đó
       ====================================================================== */
    jq(function () {
        jq('.register_step_2 .inputDisabled').remove();
        jq('.register_step_2 .sectionExtra').each(function () {
            var obj = jq(this);
            var field = obj.attr('data-field');
            if (field) {
                var spot = obj.closest('form').find('.' + field).first();
                var content = obj.clone().removeClass('sectionExtra');
                obj.remove();
                if (!spot.length) {
                    return;
                }
                if (obj.attr('data-location') === 'before') {
                    spot.before(content);
                } else {
                    spot.after(content);
                }
            }
            obj.removeClass('sectionExtra');
        });
    });

    /* API nhỏ cho trang khác: YQ.account.login() / .register() / .member('wallet') / .close() */
    YQ.account = new Object();
    YQ.account.login = function () {
        openAuth('login');
    };
    YQ.account.register = function () {
        openAuth('register');
    };
    YQ.account.member = openPop;
    YQ.account.close = function () {
        closeAuth();
        closePop();
    };
})(jQuery);
