/* ==========================================================================
   Module JS: account — popup Log in / Register + panel member "My Functions"
   Nạp sau data.js / app.js / pages.js nên dùng được GH.*, jQuery, Bootstrap 5.

   Gồm 3 mảng:
     1) GH.auth      : lưu người dùng ở localStorage (KHÔNG lưu mật khẩu).
     2) Popup auth   : "Connect Via" + 5 nút social, 2 tab Log in / Register Now,
                       kèm pane quên mật khẩu. Dựng trên Bootstrap modal.
     3) Panel member : "My Functions" trượt từ phải (Bootstrap offcanvas), danh sách
                       lấy từ GH.memberMenu, có pane con cho profile / password / …

   Nguyên tắc an toàn (giống các module khác):
     - Chỉ móc vào DOM + event có sẵn: nút [data-gh-account] trong header/offcanvas
       do app.js dựng, và event gh:header-ready.
     - Xoá file này thì mất đúng popup account, phần còn lại của site vẫn chạy.

   LƯU Ý: đây là demo frontend, chưa nối backend — mọi email/mật khẩu hợp lệ đều
   đăng nhập được và mật khẩu không được lưu ở đâu cả. Thay 3 hàm trong phần
   "6. Chỗ nối API" bằng lệnh gọi thật khi có server.
   ========================================================================== */
(function ($) {
  'use strict';

  if (!window.GH || !GH.icon) return;               // core chưa sẵn sàng
  var BS = window.bootstrap;
  if (!BS || !BS.Modal || !BS.Offcanvas) return;    // cần Bootstrap 5 bundle

  var esc = GH.escape;
  var KEY = 'gh_user_v1';

  /* ======================================================================
     1. Auth store
     ====================================================================== */
  GH.auth = {
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
      $(document).trigger('gh:auth-changed', [this.user]);
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
  GH.auth.load();

  /* ======================================================================
     2. Tiện ích form
     ====================================================================== */
  var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function field(id, label, type, ph, opts) {
    opts = opts || {};
    var input = '<input type="' + type + '" class="gh-input form-control" id="' + id + '"' +
                ' placeholder="' + esc(ph || '') + '"' +
                (opts.autocomplete ? ' autocomplete="' + opts.autocomplete + '"' : '') + '>';

    if (type === 'password') {
      input = '<div class="gh-auth__pw">' + input +
                '<button class="gh-auth__peek" type="button" data-gh-peek aria-label="Show password">' +
                  GH.icon('eye', 17) +
                '</button>' +
              '</div>';
    }
    return (label ? '<label class="gh-auth__label" for="' + id + '">' + esc(label) + '</label>' : '') +
           input +
           '<div class="gh-error" data-err-for="' + id + '"></div>';
  }

  function fail($el, msg) {
    $el.addClass('is-invalid');
    $('[data-err-for="' + $el.attr('id') + '"]').text(msg).addClass('is-on');
    return false;
  }
  function clearErrors($scope) {
    $scope.find('.gh-input').removeClass('is-invalid');
    $scope.find('.gh-error').removeClass('is-on').text('');
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
    var s = (GH.socialLogins || []).filter(function (x) { return x.id === id; })[0];
    return (s && s.label) || id;
  }

  function socialHtml() {
    return (GH.socialLogins || []).map(function (s) {
      return '<button class="gh-auth__soc" type="button" data-gh-social="' + s.id + '" ' +
               'aria-label="Continue with ' + esc(s.label) + '" title="Continue with ' + esc(s.label) + '">' +
               GH.brandIcon(s.id, 20) +
             '</button>';
    }).join('');
  }

  function buildAuth() {
    if (authModal) return;

    var html =
      '<div class="modal fade gh-auth" id="ghAuthModal" tabindex="-1" aria-labelledby="ghAuthTitle" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">' +
          '<div class="modal-content">' +
            '<button class="gh-auth__close" type="button" data-bs-dismiss="modal" aria-label="Close">' +
              GH.icon('close', 22) + '</button>' +
            '<div class="modal-body">' +

              '<h2 class="gh-auth__title" id="ghAuthTitle">Connect Via</h2>' +
              '<div class="gh-auth__social">' + socialHtml() + '</div>' +
              '<p class="gh-auth__or">Or</p>' +

              '<div class="gh-auth__tabs" role="tablist">' +
                '<button class="gh-auth__tab is-active" type="button" role="tab" data-gh-tab="login" aria-selected="true">Log in</button>' +
                '<button class="gh-auth__tab" type="button" role="tab" data-gh-tab="register" aria-selected="false">Register Now</button>' +
              '</div>' +

              /* --- pane Log in --- */
              '<form class="gh-auth__pane" data-gh-pane="login" id="ghLoginForm" novalidate>' +
                '<div class="gh-auth__row">' +
                  '<div>' + field('ghAuthEmail', 'Email', 'email', 'you@example.com', { autocomplete: 'email' }) + '</div>' +
                  '<div>' + field('ghAuthPass', 'Password', 'password', '', { autocomplete: 'current-password' }) + '</div>' +
                '</div>' +
                '<div class="gh-auth__meta">' +
                  '<label class="gh-auth__check">' +
                    '<input type="checkbox" id="ghAuthKeep" checked><span>Keep me logged in</span>' +
                  '</label>' +
                  '<button class="gh-auth__forgot" type="button" data-gh-forgot>Forgot your password?</button>' +
                '</div>' +
                '<button class="gh-btn gh-btn--block" type="submit">Log in</button>' +
              '</form>' +

              /* --- pane Register --- */
              '<form class="gh-auth__pane" data-gh-pane="register" id="ghRegForm" novalidate hidden>' +
                '<div class="gh-auth__box">' +
                  '<p class="gh-auth__hint">Please fill out the following information</p>' +
                  '<div class="gh-auth__grid">' +
                    '<div class="gh-auth__side">Email*</div>' +
                    '<div>' + field('ghRegEmail', '', 'email', 'Your email address', { autocomplete: 'email' }) + '</div>' +

                    '<div class="gh-auth__side">Password*</div>' +
                    '<div class="gh-auth__stack">' +
                      '<div>' + field('ghRegPass', '', 'password', 'Your password', { autocomplete: 'new-password' }) + '</div>' +
                      '<div>' + field('ghRegPass2', '', 'password', 'Repeated password', { autocomplete: 'new-password' }) + '</div>' +
                    '</div>' +

                    '<div class="gh-auth__side">Your Name*</div>' +
                    '<div class="gh-auth__duo">' +
                      '<div>' + field('ghRegFirst', '', 'text', 'First Name', { autocomplete: 'given-name' }) + '</div>' +
                      '<div>' + field('ghRegLast', '', 'text', 'Last Name', { autocomplete: 'family-name' }) + '</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
                '<label class="gh-auth__check">' +
                  '<input type="checkbox" id="ghRegPromo" checked><span>I agree to receive promotion material</span>' +
                '</label>' +
                '<button class="gh-btn gh-btn--ghost gh-btn--block gh-auth__submit" type="submit">Submit</button>' +
              '</form>' +

              /* --- pane quên mật khẩu --- */
              '<form class="gh-auth__pane" data-gh-pane="forgot" id="ghForgotForm" novalidate hidden>' +
                '<button class="gh-auth__back" type="button" data-gh-tab="login">' +
                  GH.icon('chevleft', 14) + 'Back to log in</button>' +
                '<p class="gh-auth__hint">Enter your email and we will send you a link to reset your password.</p>' +
                '<div>' + field('ghFgEmail', 'Email', 'email', 'you@example.com', { autocomplete: 'email' }) + '</div>' +
                '<button class="gh-btn gh-btn--block gh-auth__submit" type="submit">Send reset link</button>' +
              '</form>' +

              '<p class="gh-auth__note">Demo store — no account data leaves this browser.</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    $(GH.localise(html)).appendTo('body');
    authModal = new BS.Modal(document.getElementById('ghAuthModal'));
  }

  /** Chuyển pane trong popup: 'login' | 'register' | 'forgot'. */
  function showPane(name) {
    var $m = $('#ghAuthModal');
    clearErrors($m);
    $m.find('.gh-auth__pane').each(function () {
      $(this).prop('hidden', $(this).attr('data-gh-pane') !== name);
    });
    $m.find('.gh-auth__tab').each(function () {
      var on = $(this).attr('data-gh-tab') === name;
      $(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false');
    });
    $m.find('.gh-auth__tabs').prop('hidden', name === 'forgot');
    setTimeout(function () {
      var el = $m.find('.gh-auth__pane:not([hidden]) .gh-input')[0];
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
    return (GH.memberMenu || []).map(function (m) {
      var tag = m.href ? 'a' : 'button';
      var attrs = m.href
        ? ' href="' + m.href + '"'
        : ' type="button"' + (m.view ? ' data-gh-view="' + m.view + '"' : '') +
          (m.action ? ' data-gh-do="' + m.action + '"' : '');
      return '<' + tag + ' class="gh-mfn__item"' + attrs + '>' +
               '<span class="gh-mfn__dot" aria-hidden="true"></span>' +
               '<span class="gh-mfn__txt">' + esc(m.label) + '</span>' +
               '<span class="gh-mfn__ico">' + GH.icon(m.icon, 19) + '</span>' +
             '</' + tag + '>';
    }).join('');
  }

  function buildMember() {
    if (memberOc) return;

    var html =
      '<aside class="offcanvas offcanvas-end gh-mfn" tabindex="-1" id="ghMemberPanel" aria-labelledby="ghMfnTitle">' +
        '<div class="gh-mfn__head">' +
          '<h2 class="gh-mfn__title" id="ghMfnTitle">My Functions</h2>' +
          '<button class="gh-mfn__close" type="button" data-bs-dismiss="offcanvas" aria-label="Close">' +
            GH.icon('close', 20) + '</button>' +
        '</div>' +
        '<div class="gh-mfn__body">' +
          '<div id="ghMfnMain">' +
            '<div class="gh-mfn__hello">' +
              '<p class="gh-mfn__hi" id="ghMfnHi"></p>' +
              '<a class="gh-btn gh-btn--sm" href="member/profile.html?edit=1">Edit</a>' +
            '</div>' +
            '<div class="gh-mfn__list">' + menuHtml() + '</div>' +
          '</div>' +
          '<div class="gh-mfn__pane" id="ghMfnPane" hidden></div>' +
        '</div>' +
      '</aside>';

    $(GH.localise(html)).appendTo('body');
    memberOc = new BS.Offcanvas(document.getElementById('ghMemberPanel'));
  }

  /* --- nội dung các pane con --- */
  var views = {
    wallet: function () {
      return {
        title: 'My wallet',
        lead: 'Store credit and gift-card balance, applied automatically at checkout.',
        body: '<div class="gh-mfn__stat"><b>' + GH.money(0) + '</b><span>available credit</span></div>' +
              '<a class="gh-btn gh-btn--ghost gh-btn--block" href="shop.html?cat=dining">Buy a dining voucher ' + GH.icon('arrow', 15) + '</a>'
      };
    }
  };

  function showMain() {
    $('#ghMfnPane').prop('hidden', true).empty();
    $('#ghMfnMain').prop('hidden', false);
  }

  function showView(name) {
    var make = views[name];
    if (!make) return;
    var v = make();

    $('#ghMfnMain').prop('hidden', true);
    $('#ghMfnPane').prop('hidden', false).html(GH.localise(
      '<button class="gh-auth__back" type="button" data-gh-view="">' +
        GH.icon('chevleft', 14) + 'My Functions</button>' +
      '<h3 class="gh-mfn__sub">' + esc(v.title) + '</h3>' +
      '<p class="gh-mfn__lead">' + v.lead + '</p>' +
      v.body
    ));
    if (v.fill) v.fill();
  }

  function paintMember() {
    if (!memberOc) return;
    var n = GH.auth.name();
    var mail = (GH.auth.user || {}).email || '';
    $('#ghMfnHi').html('Hi, <em>' + esc(n) + '</em>' +
      (mail ? '<span class="gh-mfn__mail">' + esc(mail) + '</span>' : ''));
  }

  function openMember() {
    if (!GH.auth.isIn()) { openAuth('login'); return; }
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
    var on = GH.auth.isIn();
    var $btn = $('#ghAccountBtn');
    if ($btn.length) {
      $btn.toggleClass('is-signed', on)
          .attr('aria-label', on ? 'My Functions — ' + GH.auth.name() : 'Account')
          .attr('title', on ? 'Hi, ' + GH.auth.name() : 'Log in or register')
          .html(on ? '<span class="gh-acct-initial">' + esc(GH.auth.initial()) + '</span>' : GH.icon('user', 19));
    }
    $('[data-gh-account-label]').text(on ? GH.auth.name() : 'Account');
  }

  $(document).on('gh:header-ready gh:auth-changed', paintHeader);

  $(document).on('click', '[data-gh-account]', function (e) {
    e.preventDefault();
    /* Trên mobile nút nằm trong offcanvas menu — đóng nó trước cho khỏi chồng lớp. */
    var oc = document.getElementById('ghOffcanvas');
    var inst = oc && BS.Offcanvas.getInstance(oc);
    if (inst && $(this).closest('#ghOffcanvas').length) {
      $(oc).one('hidden.bs.offcanvas', function () {
        GH.auth.isIn() ? openMember() : openAuth('login');
      });
      inst.hide();
      return;
    }
    GH.auth.isIn() ? openMember() : openAuth('login');
  });

  /* ======================================================================
     6. Chỗ nối API — thay 3 hàm này bằng lệnh gọi backend thật
     ====================================================================== */
  function apiLogin(email) {
    /* Demo: nhận mọi thông tin hợp lệ. Mật khẩu KHÔNG được lưu.
       Giữ lại tên đã đăng ký trước đó nếu trùng email. */
    var prev = GH.auth.user;
    var keep = (prev && prev.email === email) ? prev : {};
    return GH.auth.signIn({ email: email, first: keep.first || '', last: keep.last || '', promo: !!keep.promo });
  }
  function apiRegister(data) { return GH.auth.signIn(data); }
  function apiSocial(id) {
    var prev = GH.auth.user || {};
    return GH.auth.signIn({
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
    .on('click', '#ghAuthModal [data-gh-tab]', function () { showPane($(this).attr('data-gh-tab')); })
    .on('click', '#ghAuthModal [data-gh-forgot]', function () {
      $('#ghFgEmail').val(val('ghAuthEmail'));
      showPane('forgot');
    })
    .on('click', '[data-gh-peek]', function () {
      var $btn = $(this);
      var $in = $btn.siblings('.gh-input');
      var show = $in.attr('type') === 'password';
      $in.attr('type', show ? 'text' : 'password');
      $btn.html(GH.icon(show ? 'eyeoff' : 'eye', 17))
          .attr('aria-label', show ? 'Hide password' : 'Show password');
    })

    /* --- popup: social --- */
    .on('click', '#ghAuthModal [data-gh-social]', function () {
      var id = $(this).attr('data-gh-social');
      apiSocial(id);
      closeAuth();
      GH.toast('Signed in with ' + socialLabel(id));
    })

    /* --- popup: Log in --- */
    .on('submit', '#ghLoginForm', function (e) {
      e.preventDefault();
      var $f = $(this);
      clearErrors($f);
      var ok = check('ghAuthEmail', { required: true, email: true, label: 'Email' });
      ok = check('ghAuthPass', { required: true, label: 'Password' }) && ok;
      if (!ok) return;

      apiLogin(val('ghAuthEmail'));
      closeAuth();
      GH.toast('Welcome back, ' + GH.auth.name());
    })

    /* --- popup: Register --- */
    .on('submit', '#ghRegForm', function (e) {
      e.preventDefault();
      var $f = $(this);
      clearErrors($f);
      var ok = check('ghRegEmail', { required: true, email: true, label: 'Email' });
      ok = check('ghRegPass', { required: true, min: 6, label: 'Password' }) && ok;
      ok = check('ghRegPass2', { required: true, same: val('ghRegPass'), label: 'Repeated password' }) && ok;
      ok = check('ghRegFirst', { required: true, label: 'First name' }) && ok;
      ok = check('ghRegLast', { required: true, label: 'Last name' }) && ok;
      if (!ok) return;

      apiRegister({
        email: val('ghRegEmail'),
        first: val('ghRegFirst'),
        last: val('ghRegLast'),
        promo: $('#ghRegPromo').is(':checked')
      });
      closeAuth();
      GH.toast('Welcome, ' + GH.auth.name() + ' — your account is ready');
    })

    /* --- popup: quên mật khẩu --- */
    .on('submit', '#ghForgotForm', function (e) {
      e.preventDefault();
      clearErrors($(this));
      if (!check('ghFgEmail', { required: true, email: true, label: 'Email' })) return;
      var mail = val('ghFgEmail');
      closeAuth();
      GH.toast('Reset link sent to ' + mail);
    })

    /* --- panel member: điều hướng pane --- */
    .on('click', '#ghMemberPanel [data-gh-view]', function () {
      var v = $(this).attr('data-gh-view');
      v ? showView(v) : showMain();
    })
    .on('click', '#ghMemberPanel [data-gh-do="logout"]', function () {
      GH.auth.signOut();
      closeMember();
      GH.toast('You have been logged out');
    })

    /* --- panel member: các form con --- */

    /* Gõ lại thì bỏ trạng thái lỗi cho đỡ khó chịu */
    .on('input', '#ghAuthModal .gh-input, #ghMemberPanel .gh-input', function () {
      $(this).removeClass('is-invalid');
      $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
    })

    /* Mở lại popup thì luôn về tab Log in, xoá dữ liệu cũ */
    .on('hidden.bs.modal', '#ghAuthModal', function () {
      var $m = $(this);
      $m.find('form').each(function () { this.reset(); });
      /* form.reset() không trả lại type cho ô đã bấm "hiện mật khẩu" */
      $m.find('.gh-auth__pw .gh-input').attr('type', 'password');
      $m.find('[data-gh-peek]').html(GH.icon('eye', 17)).attr('aria-label', 'Show password');
      clearErrors($m);
    })
    .on('hidden.bs.offcanvas', '#ghMemberPanel', showMain);

  /* API nhỏ cho trang khác gọi: GH.account.login() / .register() / .member() */
  GH.account = {
    login:    function () { openAuth('login'); },
    register: function () { openAuth('register'); },
    member:   openMember,
    close:    function () { closeAuth(); closeMember(); },
    logout:   function () { GH.auth.signOut(); }
  };

  paintHeader();
})(jQuery);
