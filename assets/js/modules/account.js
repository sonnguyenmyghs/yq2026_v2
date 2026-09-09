/* ==========================================================================
   Module JS: account — popup Log in / Register + panel member "My Functions"
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Gồm 3 mảng:
     1) YQ.auth      : lưu người dùng ở localStorage (KHÔNG lưu mật khẩu).
     2) Popup auth   : "Connect Via" + 5 nút social, 2 tab Log in / Register Now,
                       kèm pane quên mật khẩu. Dựng trên Bootstrap modal.
     3) Panel member : "My Functions" trượt từ phải (Bootstrap offcanvas), danh sách
                       lấy từ YQ.memberMenu, có pane con cho profile / password / …

   Nguyên tắc an toàn (giống các module khác):
     - Chỉ móc vào DOM + event có sẵn: nút [data-yq-account] trong header/offcanvas
       do app.js dựng, và event yq:header-ready.
     - Xoá file này thì mất đúng popup account, phần còn lại của site vẫn chạy.

   LƯU Ý: đây là demo frontend, chưa nối backend — mọi email/mật khẩu hợp lệ đều
   đăng nhập được và mật khẩu không được lưu ở đâu cả. Thay 3 hàm trong phần
   "6. Chỗ nối API" bằng lệnh gọi thật khi có server.
   ========================================================================== */
(function ($) {
  'use strict';

  if (!window.YQ || !YQ.icon) return;               // core chưa sẵn sàng
  var BS = window.bootstrap;
  if (!BS || !BS.Modal || !BS.Offcanvas) return;    // cần Bootstrap 5 bundle

  var esc = YQ.escape;
  var KEY = 'yq_user_v1';

  /* ======================================================================
     1. Auth store
     ====================================================================== */
  YQ.auth = {
    user: null,

    load: function () {
      try { this.user = JSON.parse(localStorage.getItem(KEY)) || null; }
      catch (e) { this.user = null; }
      return this.user;
    },
    save: function () {
      try {
        if (this.user) localStorage.setItem(KEY, JSON.stringify(this.user));
        else localStorage.removeItem(KEY);
      } catch (e) {}
      $(document).trigger('yq:auth-changed', [this.user]);
    },
    isIn: function () { return !!this.user; },

    /** Tên hiển thị: ưu tiên first name, không có thì lấy phần trước @ của email. */
    name: function () {
      var u = this.user;
      if (!u) return '';
      return u.first || (u.email || '').split('@')[0] || 'there';
    },
    initial: function () {
      return (this.name().charAt(0) || '?').toUpperCase();
    },

    signIn: function (data) {
      this.user = $.extend({ email: '', first: '', last: '', promo: false }, data || {});
      this.user.at = Date.now();
      this.save();
      return this.user;
    },
    update: function (data) {
      if (!this.user) return null;
      this.user = $.extend(this.user, data || {});
      this.save();
      return this.user;
    },
    signOut: function () { this.user = null; this.save(); }
  };
  YQ.auth.load();

  /* ======================================================================
     2. Tiện ích form
     ====================================================================== */
  var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function field(id, label, type, ph, opts) {
    opts = opts || {};
    var input = '<input type="' + type + '" class="yq-input form-control" id="' + id + '"' +
                ' placeholder="' + esc(ph || '') + '"' +
                (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') + '>';

    if (type === 'password') {
      input = '<div class="yq-auth__pw">' + input +
                '<button class="yq-auth__peek" type="button" data-yq-peek aria-label="Show password">' +
                  YQ.icon('eye', 17) +
                '</button>' +
              '</div>';
    }
    return (label ? '<label class="yq-auth__label" for="' + id + '">' + esc(label) + '</label>' : '') +
           input +
           '<div class="yq-error" data-err-for="' + id + '"></div>';
  }

  function fail($el, msg) {
    $el.addClass('is-invalid');
    $('[data-err-for="' + $el.attr('id') + '"]').text(msg).addClass('is-on');
    return false;
  }
  function clearErrors($scope) {
    $scope.find('.yq-input').removeClass('is-invalid');
    $scope.find('.yq-error').removeClass('is-on').text('');
  }
  function val(id) { return $.trim($('#' + id).val() || ''); }

  /** Kiểm tra 1 ô; rules: {required, email, min, same} */
  function check(id, rules) {
    var $el = $('#' + id);
    var v = $.trim($el.val() || '');
    if (rules.required && !v) return fail($el, rules.label + ' is required');
    if (rules.email && v && !RE_MAIL.test(v)) return fail($el, 'Enter a valid email address');
    if (rules.min && v.length < rules.min) return fail($el, 'Use at least ' + rules.min + ' characters');
    if (rules.same != null && v !== rules.same) return fail($el, 'Passwords do not match');
    return true;
  }

  /* ======================================================================
     3. Popup Log in / Register
     ====================================================================== */
  var authModal = null;

  function socialLabel(id) {
    var s = (YQ.socialLogins || []).filter(function (x) { return x.id === id; })[0];
    return (s && s.label) || id;
  }

  function socialHtml() {
    return (YQ.socialLogins || []).map(function (s) {
      return '<button class="yq-auth__soc" type="button" data-yq-social="' + s.id + '" ' +
               'aria-label="Continue with ' + esc(s.label) + '" title="Continue with ' + esc(s.label) + '">' +
               YQ.brandIcon(s.id, 20) +
             '</button>';
    }).join('');
  }

  function buildAuth() {
    if (authModal) return;

    var html =
      '<div class="modal fade yq-auth" id="yqAuthModal" tabindex="-1" aria-labelledby="yqAuthTitle" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
          '<div class="modal-content">' +
            '<button class="yq-auth__close" type="button" data-bs-dismiss="modal" aria-label="Close">' +
              YQ.icon('close', 22) + '</button>' +
            '<div class="modal-body">' +

              '<h2 class="yq-auth__title" id="yqAuthTitle">Connect Via</h2>' +
              '<div class="yq-auth__social">' + socialHtml() + '</div>' +
              '<p class="yq-auth__or">Or</p>' +

              '<div class="yq-auth__tabs" role="tablist">' +
                '<button class="yq-auth__tab is-active" type="button" role="tab" data-yq-tab="login" aria-selected="true">Log in</button>' +
                '<button class="yq-auth__tab" type="button" role="tab" data-yq-tab="register" aria-selected="false">Register Now</button>' +
              '</div>' +

              /* --- pane Log in --- */
              '<form class="yq-auth__pane" data-yq-pane="login" id="yqLoginForm" novalidate>' +
                '<div class="yq-auth__row">' +
                  '<div>' + field('yqAuthEmail', 'Email', 'email', 'you@example.com', { autocomplete: 'email' }) + '</div>' +
                  '<div>' + field('yqAuthPass', 'Password', 'password', '', { autocomplete: 'current-password' }) + '</div>' +
                '</div>' +
                '<div class="yq-auth__meta">' +
                  '<label class="yq-auth__check">' +
                    '<input type="checkbox" id="yqAuthKeep" checked><span>Keep me logged in</span>' +
                  '</label>' +
                  '<button class="yq-auth__forgot" type="button" data-yq-forgot>Forgot your password?</button>' +
                '</div>' +
                '<button class="yq-btn yq-btn--block" type="submit">Log in</button>' +
              '</form>' +

              /* --- pane Register --- */
              '<form class="yq-auth__pane" data-yq-pane="register" id="yqRegForm" novalidate hidden>' +
                '<div class="yq-auth__box">' +
                  '<p class="yq-auth__hint">Please fill out the following information</p>' +
                  '<div class="yq-auth__grid">' +
                    '<div class="yq-auth__side">Email*</div>' +
                    '<div>' + field('yqRegEmail', '', 'email', 'Your email address', { autocomplete: 'email' }) + '</div>' +

                    '<div class="yq-auth__side">Password*</div>' +
                    '<div class="yq-auth__stack">' +
                      '<div>' + field('yqRegPass', '', 'password', 'Your password', { autocomplete: 'new-password' }) + '</div>' +
                      '<div>' + field('yqRegPass2', '', 'password', 'Repeated password', { autocomplete: 'new-password' }) + '</div>' +
                    '</div>' +

                    '<div class="yq-auth__side">Your Name*</div>' +
                    '<div class="yq-auth__duo">' +
                      '<div>' + field('yqRegFirst', '', 'text', 'First Name', { autocomplete: 'given-name' }) + '</div>' +
                      '<div>' + field('yqRegLast', '', 'text', 'Last Name', { autocomplete: 'family-name' }) + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<label class="yq-auth__check">' +
                  '<input type="checkbox" id="yqRegPromo" checked><span>I agree to receive promotion material</span>' +
                '</label>' +
                '<button class="yq-btn yq-btn--yqost yq-btn--block yq-auth__submit" type="submit">Submit</button>' +
              '</form>' +

              /* --- pane quên mật khẩu --- */
              '<form class="yq-auth__pane" data-yq-pane="forgot" id="yqForgotForm" novalidate hidden>' +
                '<button class="yq-auth__back" type="button" data-yq-tab="login">' +
                  YQ.icon('chevleft', 14) + 'Back to log in</button>' +
                '<p class="yq-auth__hint">Enter your email and we will send you a link to reset your password.</p>' +
                '<div>' + field('yqFgEmail', 'Email', 'email', 'you@example.com', { autocomplete: 'email' }) + '</div>' +
                '<button class="yq-btn yq-btn--block yq-auth__submit" type="submit">Send reset link</button>' +
              '</form>' +

              '<p class="yq-auth__note">Demo store — no account data leaves this browser.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    $(YQ.localise(html)).appendTo('body');
    authModal = new BS.Modal(document.getElementById('yqAuthModal'));
  }

  /** Chuyển pane trong popup: 'login' | 'register' | 'forgot'. */
  function showPane(name) {
    var $m = $('#yqAuthModal');
    clearErrors($m);
    $m.find('.yq-auth__pane').each(function () {
      $(this).prop('hidden', $(this).attr('data-yq-pane') !== name);
    });
    $m.find('.yq-auth__tab').each(function () {
      var on = $(this).attr('data-yq-tab') === name;
      $(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false');
    });
    $m.find('.yq-auth__tabs').prop('hidden', name === 'forgot');
    setTimeout(function () {
      var el = $m.find('.yq-auth__pane:not([hidden]) .yq-input')[0];
      if (el) el.focus();
    }, 120);
  }

  function openAuth(pane) {
    buildAuth();
    showPane(pane || 'login');
    authModal.show();
  }
  function closeAuth() { if (authModal) authModal.hide(); }

  /* ======================================================================
     4. Panel member "My Functions"
     ====================================================================== */
  var memberOc = null;

  function menuHtml() {
    return (YQ.memberMenu || []).map(function (m) {
      var tag = m.href ? 'a' : 'button';
      var attrs = m.href
        ? ' href="' + m.href + '"'
        : ' type="button"' + (m.view ? ' data-yq-view="' + m.view + '"' : '') +
          (m.action ? ' data-yq-do="' + m.action + '"' : '');
      return '<' + tag + ' class="yq-mfn__item"' + attrs + '>' +
               '<span class="yq-mfn__dot" aria-hidden="true"></span>' +
               '<span class="yq-mfn__txt">' + esc(m.label) + '</span>' +
               '<span class="yq-mfn__ico">' + YQ.icon(m.icon, 19) + '</span>' +
             '</' + tag + '>';
    }).join('');
  }

  function buildMember() {
    if (memberOc) return;

    var html =
      '<aside class="offcanvas offcanvas-end yq-mfn" tabindex="-1" id="yqMemberPanel" aria-labelledby="yqMfnTitle">' +
        '<div class="yq-mfn__head">' +
          '<h2 class="yq-mfn__title" id="yqMfnTitle">My Functions</h2>' +
          '<button class="yq-mfn__close" type="button" data-bs-dismiss="offcanvas" aria-label="Close">' +
            YQ.icon('close', 20) + '</button>' +
        '</div>' +
        '<div class="yq-mfn__body">' +
          '<div id="yqMfnMain">' +
            '<div class="yq-mfn__hello">' +
              '<p class="yq-mfn__hi" id="yqMfnHi"></p>' +
              '<a class="yq-btn yq-btn--sm" href="member/profile.html?edit=1">Edit</a>' +
            '</div>' +
            '<div class="yq-mfn__list">' + menuHtml() + '</div>' +
          '</div>' +
          '<div class="yq-mfn__pane" id="yqMfnPane" hidden></div>' +
        '</div>' +
      '</aside>';

    $(YQ.localise(html)).appendTo('body');
    memberOc = new BS.Offcanvas(document.getElementById('yqMemberPanel'));
  }

  /* --- nội dung các pane con --- */
  var views = {
    wallet: function () {
      return {
        title: 'My wallet',
        lead: 'Store credit and gift-card balance, applied automatically at checkout.',
        body: '<div class="yq-mfn__stat"><b>' + YQ.money(0) + '</b><span>available credit</span></div>' +
              '<a class="yq-btn yq-btn--yqost yq-btn--block" href="shop.html?cat=dining">Buy a dining voucher ' + YQ.icon('arrow', 15) + '</a>'
      };
    }
  };

  function showMain() {
    $('#yqMfnPane').prop('hidden', true).empty();
    $('#yqMfnMain').prop('hidden', false);
  }

  function showView(name) {
    var make = views[name];
    if (!make) return;
    var v = make();

    $('#yqMfnMain').prop('hidden', true);
    $('#yqMfnPane').prop('hidden', false).html(YQ.localise(
      '<button class="yq-auth__back" type="button" data-yq-view="">' +
        YQ.icon('chevleft', 14) + 'My Functions</button>' +
      '<h3 class="yq-mfn__sub">' + esc(v.title) + '</h3>' +
      '<p class="yq-mfn__lead">' + v.lead + '</p>' +
      v.body
    ));
    if (v.fill) v.fill();
  }

  function paintMember() {
    if (!memberOc) return;
    var n = YQ.auth.name();
    var mail = (YQ.auth.user || {}).email || '';
    $('#yqMfnHi').html('Hi, <em>' + esc(n) + '</em>' +
      (mail ? '<span class="yq-mfn__mail">' + esc(mail) + '</span>' : ''));
  }

  function openMember() {
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    buildMember();
    paintMember();
    showMain();
    memberOc.show();
  }
  function closeMember() { if (memberOc) memberOc.hide(); }

  /* ======================================================================
     5. Nút account ở header
     ====================================================================== */
  function paintHeader() {
    var on = YQ.auth.isIn();
    var $btn = $('#yqAccountBtn');
    if ($btn.length) {
      $btn.toggleClass('is-signed', on)
          .attr('aria-label', on ? 'My Functions — ' + YQ.auth.name() : 'Account')
          .attr('title', on ? 'Hi, ' + YQ.auth.name() : 'Log in or register')
          .html(on ? '<span class="yq-acct-initial">' + esc(YQ.auth.initial()) + '</span>' : YQ.icon('user', 19));
    }
    $('[data-yq-account-label]').text(on ? YQ.auth.name() : 'Account');
  }

  $(document).on('yq:header-ready yq:auth-changed', paintHeader);

  $(document).on('click', '[data-yq-account]', function (e) {
    e.preventDefault();
    /* Trên mobile nút nằm trong offcanvas menu — đóng nó trước cho khỏi chồng lớp. */
    var oc = document.getElementById('yqOffcanvas');
    var inst = oc && BS.Offcanvas.getInstance(oc);
    if (inst && $(this).closest('#yqOffcanvas').length) {
      $(oc).one('hidden.bs.offcanvas', function () {
        YQ.auth.isIn() ? openMember() : openAuth('login');
      });
      inst.hide();
      return;
    }
    YQ.auth.isIn() ? openMember() : openAuth('login');
  });

  /* ======================================================================
     6. Chỗ nối API — thay 3 hàm này bằng lệnh gọi backend thật
     ====================================================================== */
  function apiLogin(email) {
    /* Demo: nhận mọi thông tin hợp lệ. Mật khẩu KHÔNG được lưu.
       Giữ lại tên đã đăng ký trước đó nếu trùng email. */
    var prev = YQ.auth.user;
    var keep = (prev && prev.email === email) ? prev : {};
    return YQ.auth.signIn({ email: email, first: keep.first || '', last: keep.last || '', promo: !!keep.promo });
  }
  function apiRegister(data) { return YQ.auth.signIn(data); }
  function apiSocial(id) {
    var prev = YQ.auth.user || {};
    return YQ.auth.signIn({
      email: prev.email || (id + '@example.com'),
      first: prev.first || socialLabel(id),
      last:  prev.last  || '',
      promo: !!prev.promo
    });
  }

  /* ======================================================================
     7. Sự kiện
     ====================================================================== */
  $(document)
    /* --- popup: tab + quên mật khẩu + hiện/ẩn mật khẩu --- */
    .on('click', '#yqAuthModal [data-yq-tab]', function () { showPane($(this).attr('data-yq-tab')); })
    .on('click', '#yqAuthModal [data-yq-forgot]', function () {
      $('#yqFgEmail').val(val('yqAuthEmail'));
      showPane('forgot');
    })
    .on('click', '[data-yq-peek]', function () {
      var $btn = $(this);
      var $in = $btn.siblings('.yq-input');
      var show = $in.attr('type') === 'password';
      $in.attr('type', show ? 'text' : 'password');
      $btn.html(YQ.icon(show ? 'eyeoff' : 'eye', 17))
          .attr('aria-label', show ? 'Hide password' : 'Show password');
    })

    /* --- popup: social --- */
    .on('click', '#yqAuthModal [data-yq-social]', function () {
      var id = $(this).attr('data-yq-social');
      apiSocial(id);
      closeAuth();
      YQ.toast('Signed in with ' + socialLabel(id));
    })

    /* --- popup: Log in --- */
    .on('submit', '#yqLoginForm', function (e) {
      e.preventDefault();
      var $f = $(this);
      clearErrors($f);
      var ok = check('yqAuthEmail', { required: true, email: true, label: 'Email' });
      ok = check('yqAuthPass', { required: true, label: 'Password' }) && ok;
      if (!ok) return;

      apiLogin(val('yqAuthEmail'));
      closeAuth();
      YQ.toast('Welcome back, ' + YQ.auth.name());
    })

    /* --- popup: Register --- */
    .on('submit', '#yqRegForm', function (e) {
      e.preventDefault();
      var $f = $(this);
      clearErrors($f);
      var ok = check('yqRegEmail', { required: true, email: true, label: 'Email' });
      ok = check('yqRegPass', { required: true, min: 6, label: 'Password' }) && ok;
      ok = check('yqRegPass2', { required: true, same: val('yqRegPass'), label: 'Repeated password' }) && ok;
      ok = check('yqRegFirst', { required: true, label: 'First name' }) && ok;
      ok = check('yqRegLast', { required: true, label: 'Last name' }) && ok;
      if (!ok) return;

      apiRegister({
        email: val('yqRegEmail'),
        first: val('yqRegFirst'),
        last: val('yqRegLast'),
        promo: $('#yqRegPromo').is(':checked')
      });
      closeAuth();
      YQ.toast('Welcome, ' + YQ.auth.name() + ' — your account is ready');
    })

    /* --- popup: quên mật khẩu --- */
    .on('submit', '#yqForgotForm', function (e) {
      e.preventDefault();
      clearErrors($(this));
      if (!check('yqFgEmail', { required: true, email: true, label: 'Email' })) return;
      var mail = val('yqFgEmail');
      closeAuth();
      YQ.toast('Reset link sent to ' + mail);
    })

    /* --- panel member: điều hướng pane --- */
    .on('click', '#yqMemberPanel [data-yq-view]', function () {
      var v = $(this).attr('data-yq-view');
      v ? showView(v) : showMain();
    })
    .on('click', '#yqMemberPanel [data-yq-do="logout"]', function () {
      YQ.auth.signOut();
      closeMember();
      YQ.toast('You have been logged out');
    })

    /* --- panel member: các form con --- */

    /* Gõ lại thì bỏ trạng thái lỗi cho đỡ khó chịu */
    .on('input', '#yqAuthModal .yq-input, #yqMemberPanel .yq-input', function () {
      $(this).removeClass('is-invalid');
      $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
    })

    /* Mở lại popup thì luôn về tab Log in, xoá dữ liệu cũ */
    .on('hidden.bs.modal', '#yqAuthModal', function () {
      var $m = $(this);
      $m.find('form').each(function () { this.reset(); });
      /* form.reset() không trả lại type cho ô đã bấm "hiện mật khẩu" */
      $m.find('.yq-auth__pw .yq-input').attr('type', 'password');
      $m.find('[data-yq-peek]').html(YQ.icon('eye', 17)).attr('aria-label', 'Show password');
      clearErrors($m);
    })
    .on('hidden.bs.offcanvas', '#yqMemberPanel', showMain);

  /* API nhỏ cho trang khác gọi: YQ.account.login() / .register() / .member() */
  YQ.account = {
    login:    function () { openAuth('login'); },
    register: function () { openAuth('register'); },
    member:   openMember,
    close:    function () { closeAuth(); closeMember(); },
    logout:   function () { YQ.auth.signOut(); }
  };

  paintHeader();
})(jQuery);
