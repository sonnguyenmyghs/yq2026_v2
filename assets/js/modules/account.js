/* ==========================================================================
   Module JS: account — popup Log in / Register + popup member #yqAcctPop
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Gồm 3 mảng:
     1) YQ.auth      : trạng thái đăng nhập ĐỌC từ HTML server in (#yqMemberBtn có / không).
                       Không lưu gì ở localStorage — phiên do backend PHP quản lý.
     2) Popup auth   : "Connect Via" + 5 nút social, 2 tab Log in / Register Now,
                       kèm pane quên mật khẩu. Bootstrap modal, markup là HTML tĩnh
                       (#yqAuthModal, khối AUTH POPUP sau footer mỗi trang).
     3) Popup member : #yqAcctPop — dropdown thả dưới avatar, dùng chung desktop +
                       mobile. Nằm trong MEMBER COMPONENT #yqMemberSlot ở header (server
                       in 1 trong 2 bản ở đúng chỗ đó: khách = nút + AUTH POPUP, thành
                       viên = nút + #yqAcctPop). Gồm lời chào + danh sách chức năng +
                       Logout, và pane con (My wallet) thay chỗ ngay trong khối.
                       JS chỉ điền tên, đo mũi tên, bật/tắt. Đóng khi bấm ra ngoài /
                       Esc / header thu gọn lúc cuộn.

   Nguyên tắc an toàn (giống các module khác):
     - Chỉ móc vào DOM + event có sẵn: nút account trong #yqMemberSlot ở header,
       và event yq:header-ready.
     - Xoá file này thì mất đúng popup account, phần còn lại của site vẫn chạy.

   Log in: form #yqLoginForm POST thẳng lên server (email, password, remember), JS
   chỉ chặn khi email thiếu @ hoặc mật khẩu trống. Nút social là link thường (không
   có JS). Register: form #yqRegForm có thuộc tính action (template production
   member/register-step2-production.html) thì kiểm tra xong để form POST thẳng lên
   server; không có action (popup demo) thì chạy demo qua "6. Chỗ nối API".
   ========================================================================== */
(function ($) {
  'use strict';

  if (!window.YQ || !YQ.icon) return;               // core chưa sẵn sàng
  var BS = window.bootstrap;
  if (!BS || !BS.Modal) return;                     // cần Bootstrap 5 bundle



  /* Nút account ở header — server in 1 trong 2 (xem index.html / index-logined.html):
       #yqAccountBtn [data-yq-account] : CHƯA đăng nhập (kèm khối AUTH POPUP)
       #yqMemberBtn  [data-yq-member]  : ĐÃ đăng nhập (in sẵn chữ cái đầu, kèm #yqAcctPop)
     Trang có #yqMemberBtn = server khẳng định đã đăng nhập. */
  var BTN = '#yqAccountBtn, #yqMemberBtn';
  function $btn() { return $(BTN).first(); }
  var SERVER_IN = !!document.getElementById('yqMemberBtn');

  /* Chữ cái đầu: server chỉ in tên đầy đủ vào data-name (VD <span class="yq-acct-initial" data-name="Son">),
     JS lấy ký tự đầu, viết hoa, điền vào. Dùng cho nút #yqMemberBtn và avatar #yqAcctAvatar. */
  function initialOf(name) { return ($.trim(name || '').charAt(0) || '?').toUpperCase(); }
  $('.yq-acct-initial[data-name], .yq-acct__avatar[data-name]').each(function () {
    $(this).text(initialOf($(this).attr('data-name')));
  });

  /* ======================================================================
     1. Trạng thái đăng nhập — backend quản lý phiên, JS KHÔNG dùng localStorage
     Đã đăng nhập  = server in #yqMemberBtn (tên ở data-name, email ở #yqAcctMail).
     Chưa đăng nhập = server in #yqAccountBtn. Đăng nhập / đăng xuất / đổi hồ sơ đều
     qua server (form POST, link logout) rồi tải lại trang -> JS chỉ đọc, không lưu.
     signIn / update / signOut chỉ đổi trong bộ nhớ (popup Register demo không có action);
     tải lại trang là về đúng trạng thái server in.
     ====================================================================== */
  YQ.auth = {
    user: SERVER_IN ? {
      email: $.trim($('#yqAcctMail').text()),
      first: $.trim($('#yqMemberBtn [data-name]').attr('data-name') || ''),
      last: ''
    } : null,

    isIn: function () { return !!this.user; },

    /** Tên hiển thị: ưu tiên first name, không có thì lấy phần trước @ của email. */
    name: function () {
      var u = this.user;
      if (!u) return '';
      return u.first || (u.email || '').split('@')[0] || 'there';
    },
    initial: function () { return initialOf(this.name()); },

    changed: function () { $(document).trigger('yq:auth-changed', [this.user]); },
    signIn: function (data) {
      this.user = $.extend({ email: '', first: '', last: '', promo: false }, data || {});
      this.changed();
      return this.user;
    },
    update: function (data) {
      if (!this.user) return null;
      this.user = $.extend(this.user, data || {});
      this.changed();
      return this.user;
    },
    signOut: function () { this.user = null; this.changed(); }
  };

  /* Dọn dữ liệu bản cũ từng lưu ở máy khách (trước đây gây "Hi, Son" trên nút khách sau khi logout) */
  try { localStorage.removeItem('yq_user_v1'); } catch (e) {}

  /* ======================================================================
     2. Tiện ích form
     ====================================================================== */
  var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  /** Kiểm tra 1 ô; rules: {required, email, at, min, same}
      at: chỉ cần có ký tự @ (form Log in — server mới là nơi kiểm tra thật) */
  function check(id, rules) {
    var $el = $('#' + id);
    if (!$el.length) return true;                   // ô không có trên trang (field bị backend tắt)
    var v = $.trim($el.val() || '');
    if (rules.required && !v) return fail($el, rules.label + ' is required');
    if (rules.email && v && !RE_MAIL.test(v)) return fail($el, 'Enter a valid email address');
    if (rules.at && v && v.indexOf('@') < 0) return fail($el, 'Enter a valid email address');
    if (rules.min && v.length < rules.min) return fail($el, 'Use at least ' + rules.min + ' characters');
    if (rules.same != null && v !== rules.same) return fail($el, 'Passwords do not match');
    return true;
  }

  /* ======================================================================
     3. Popup Log in / Register
     ====================================================================== */
  var authModal = null;

  function buildAuth() {
    if (authModal) return true;
    var el = document.getElementById('yqAuthModal');
    if (!el) return false;                          // trang không có khối AUTH POPUP
    authModal = new BS.Modal(el);
    return true;
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
    if (!buildAuth()) return;
    showPane(pane || 'login');
    authModal.show();
  }
  function closeAuth() { if (authModal) authModal.hide(); }

  /* ======================================================================
     4. Popup member #yqAcctPop — dropdown dưới avatar (desktop + mobile)
     HTML tĩnh trong MEMBER COMPONENT #yqMemberSlot ở header, ngay sau nút avatar
     (Tab đi đúng thứ tự). Mục trang đang xem đã đánh dấu sẵn trong HTML
     (.is-current + aria-current). JS chỉ điền tên/email lúc mở, đo mũi tên,
     bật/tắt hidden/is-open và pane con.
     ====================================================================== */
  var POP = '#yqAcctPop';

  /* Pane con: div.yq-acct__pane[data-yq-acct-pane="<tên>"] trong popup.
     Pane cần đổ dữ liệu lúc mở thì khai báo hàm ở đây (chỉ .text()/.val()). */
  var fills = {};

  function $panes() { return $(POP + ' [data-yq-acct-pane]'); }
  function hasView(name) { return !!name && $panes().filter('[data-yq-acct-pane="' + name + '"]').length > 0; }

  function showMain() {
    $panes().prop('hidden', true);
    $('#yqAcctMain').prop('hidden', false);
  }

  function showView(name) {
    if (!hasView(name)) return;
    $('#yqAcctMain').prop('hidden', true);
    $panes().each(function () {
      $(this).prop('hidden', $(this).attr('data-yq-acct-pane') !== name);
    });
    if (fills[name]) fills[name]();
  }

  function paintPop() {
    if (SERVER_IN) return;                          // server đã in sẵn avatar/tên/email
    var u = YQ.auth.user || {};
    $('#yqAcctAvatar').text(YQ.auth.initial());
    $('#yqAcctName').text('Hi, ' + YQ.auth.name());
    $('#yqAcctMail').text(u.email || '').prop('hidden', !u.email);
  }

  /* Popup thẳng mép phải khối tools (qua cả icon giỏ), mũi tên chỉ đúng tâm avatar */
  function place() {
    var pop = $(POP)[0], btn = $btn()[0];
    if (!pop || !btn) return;
    var tools = $(btn).closest('.yq-header__tools')[0] || btn;
    var t = tools.getBoundingClientRect();
    var b = btn.getBoundingClientRect();
    var shift = Math.max(0, Math.round(t.right - b.right));
    pop.style.setProperty('--yq-acct-shift', shift + 'px');
    pop.style.setProperty('--yq-acct-caret', Math.round(shift + b.width / 2) + 'px');
  }

  function popOpen() { return $(POP).hasClass('is-open'); }

  /** Mở popup; view = tên pane con (VD 'wallet') để mở thẳng pane đó. */
  function openPop(view) {
    var $pop = $(POP);
    if (!$pop.length) return;
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    paintPop();
    hasView(view) ? showView(view) : showMain();
    place();
    $pop.prop('hidden', false);
    /* force reflow để transition chạy từ trạng thái ẩn */
    void $pop[0].offsetWidth;
    $pop.addClass('is-open');
    $btn().attr('aria-expanded', 'true');
    $(document).off('keydown.yqAcct').on('keydown.yqAcct', function (e) {
      if (e.key === 'Escape') { closePop(); $btn().trigger('focus'); }
    });
  }

  function closePop() {
    var $pop = $(POP);
    if (!$pop.length || !popOpen()) return;
    $pop.removeClass('is-open');
    $btn().attr('aria-expanded', 'false');
    $(document).off('keydown.yqAcct');
    var done = function () { if (!popOpen()) { $pop.prop('hidden', true); showMain(); } };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 240);
  }

  function togglePop() { popOpen() ? closePop() : openPop(); }

  /* Bấm ra ngoài -> đóng; đổi kích thước -> đo lại; header thu gọn lúc cuộn -> đóng */
  $(document).on('pointerdown', function (e) {
    if (!popOpen()) return;
    if ($(e.target).closest(POP + ', ' + BTN).length) return;
    closePop();
  });
  $(window).on('resize.yqAcct', function () { if (popOpen()) place(); });
  $(window).on('scroll.yqAcct', function () {
    if (popOpen() && $('#yqHeader').hasClass('is-compact')) closePop();
  });
  /* Tab ra khỏi popup (sang icon giỏ chẳng hạn) -> đóng để không bỏ sót popup mở lơ lửng */
  $(document).on('focusin', function (e) {
    if (!popOpen()) return;
    if ($(e.target).closest(POP + ', ' + BTN).length) return;
    closePop();
  });
  /* Rê chuột mở mega menu / Seasonal hoặc mở ô tìm kiếm -> nhường chỗ */
  $(document).on('mouseenter', '.yq-nav__item--panel', function () { closePop(); })
             .on('click', '[data-search-toggle]', function () { closePop(); });

  /* ======================================================================
     5. Nút account ở header
     ====================================================================== */
  function paintHeader() {
    /* #yqMemberBtn: server đã in đúng trạng thái đăng nhập — không đụng vào.
       #yqAccountBtn: server in sẵn bản khách; chỉ đổi khi popup Register demo đăng nhập trong bộ nhớ. */
    if (SERVER_IN) { closePop(); return; }
    var on = YQ.auth.isIn();
    var $btn = $('#yqAccountBtn');
    if ($btn.length) {
      $btn.toggleClass('is-signed', on)
          .attr('aria-label', on ? 'My account — ' + YQ.auth.name() : 'Account')
          .attr('title', on ? 'Hi, ' + YQ.auth.name() : 'Log in or register')
          .attr('aria-haspopup', on ? 'dialog' : null)
          .attr('aria-expanded', on ? 'false' : null);
      /* Icon user và #yqAcctInitial đều có sẵn trong HTML — chỉ bật/tắt + điền chữ */
      $btn.find('[data-yq-acct-icon]').attr('hidden', on ? '' : null);   // <svg>: dùng attr, không có prop hidden
      $('#yqAcctInitial').text(on ? YQ.auth.initial() : '').prop('hidden', !on);
    }
    /* Đăng xuất / đổi tên -> đóng, lần mở sau paintPop() điền lại tên mới */
    closePop();
  }

  /* Chỉ vẽ lại khi trạng thái đổi trong trang; lúc tải trang giữ nguyên HTML server in */
  $(document).on('yq:auth-changed', paintHeader);
  $(document).on('yq:header-ready', function () { closePop(); });

  $(document).on('click', '[data-yq-account], [data-yq-member]', function (e) {
    e.preventDefault();
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    togglePop();
  });

  /* ======================================================================
     6. Chỗ nối API — thay hàm này bằng lệnh gọi backend thật
     (Log in + social không qua đây: form #yqLoginForm POST thẳng lên server,
     nút social là link <a href> tới trang OAuth do server gắn)
     ====================================================================== */
  function apiRegister(data) { return YQ.auth.signIn(data); }

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
      $btn.toggleClass('is-on', show)               // CSS đổi icon mắt / mắt gạch
          .attr('aria-label', show ? 'Hide password' : 'Show password');
    })

    /* --- popup: Log in ---
       Chỉ chặn khi email thiếu @ hoặc mật khẩu trống; hợp lệ thì để form POST
       (email, password, remember) lên server — server kiểm tra và trả trang đã đăng nhập. */
    .on('submit', '#yqLoginForm', function (e) {
      clearErrors($(this));
      var ok = check('yqAuthEmail', { required: true, at: true, label: 'Email' });
      ok = check('yqAuthPass', { required: true, label: 'Password' }) && ok;
      if (!ok) e.preventDefault();
    })

    /* --- popup: Register --- */
    .on('submit', '#yqRegForm', function (e) {
      var $f = $(this);
      var server = !!$f.attr('action');             // template production: POST lên server
      clearErrors($f);
      var ok = check('yqRegEmail', { required: true, email: true, label: 'Email' });
      /* độ dài tối thiểu do server quyết định -> chỉ áp ở bản demo */
      ok = check('yqRegPass', { required: true, min: server ? 0 : 6, label: 'Password' }) && ok;
      ok = check('yqRegPass2', { required: true, same: val('yqRegPass'), label: 'Repeated password' }) && ok;
      ok = check('yqRegFirst', { required: true, label: 'First name' }) && ok;
      ok = check('yqRegLast', { required: true, label: 'Last name' }) && ok;
      ok = check('yqRegCountry', { required: true, label: 'Country' }) && ok;
      /* radio + checkbox: không có .val() để check() đọc -> kiểm tra riêng */
      if ($f.find('[name="gender"]').length && !$f.find('[name="gender"]:checked').length) {
        $('[data-err-for="yqRegGender"]').text('Please choose an option').addClass('is-on');
        ok = false;
      }
      if ($f.find('#yqRegTerms').length && !$('#yqRegTerms').is(':checked')) {
        $('[data-err-for="yqRegTerms"]').text('Please accept the Terms and Privacy Policy').addClass('is-on');
        ok = false;
      }
      if (server) {
        if (!ok) e.preventDefault();               // hợp lệ: để form POST (name="step2")
        return;
      }
      e.preventDefault();
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

    /* --- popup member: điều hướng pane con, đóng, link --- */
    .on('click', '#yqAcctPop [data-yq-view]', function () {
      var v = $(this).attr('data-yq-view');
      v ? showView(v) : showMain();
    })
    .on('click', '#yqAcctPop a[href]', function () { closePop(); })
    .on('click', '#yqAcctPop [data-yq-do="logout"]', function () {
      /* Production: Logout là <a href=".../?action=logout"> — để trình duyệt đi theo link, server huỷ phiên */
      var href = $(this).attr('href');
      if (href && href !== '#') return;
      closePop();
      YQ.auth.signOut();
      YQ.toast('You have been logged out');
      /* Đang ở khu member, hoặc trang server in bản đã đăng nhập (#yqMemberBtn), thì rời đi —
         production: Logout là link tới URL đăng xuất của server, server trả về bản chưa đăng nhập */
      if (SERVER_IN || document.documentElement.hasAttribute('data-member-area')) {
        setTimeout(function () { window.location.href = YQ.url('index.html'); }, 900);
      }
    })

    /* Gõ lại thì bỏ trạng thái lỗi cho đỡ khó chịu */
    .on('input change', '#yqAuthModal .yq-input, #yqAcctPop .yq-input, #yqRegForm .yq-input', function () {
      $(this).removeClass('is-invalid');
      $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
    })
    .on('change', '#yqRegForm [name="gender"], #yqRegTerms', function () {
      var id = this.name === 'gender' ? 'yqRegGender' : 'yqRegTerms';
      $('[data-err-for="' + id + '"]').removeClass('is-on').text('');
    })

    /* Mở lại popup thì luôn về tab Log in, xoá dữ liệu cũ */
    .on('hidden.bs.modal', '#yqAuthModal', function () {
      var $m = $(this);
      $m.find('form').each(function () { this.reset(); });
      /* form.reset() không trả lại type cho ô đã bấm "hiện mật khẩu" */
      $m.find('.yq-auth__pw .yq-input').attr('type', 'password');
      $m.find('[data-yq-peek]').removeClass('is-on').attr('aria-label', 'Show password');
      clearErrors($m);
    });

  /* Template production register (cấu trúc cũ old/register_step2.html):
     - field backend tắt có class inputDisabled -> xoá khỏi DOM để không POST
     - field thêm (sectionExtra, in từ signup_extra_single) có data-field / data-location
       -> dời tới trước / sau field có class trùng data-field */
  $(function () {
    $('.register_step_2 .inputDisabled').remove();
    $('.register_step_2 .sectionExtra').each(function () {
      var obj = $(this);
      var field = obj.attr('data-field');
      if (field) {
        var spot = obj.closest('form').find('.' + field).first();
        var content = obj.clone().removeClass('sectionExtra');
        obj.remove();
        if (!spot.length) return;
        if (obj.attr('data-location') === 'before') spot.before(content);
        else spot.after(content);
      }
      obj.removeClass('sectionExtra');
    });
  });

  /* API nhỏ cho trang khác gọi: YQ.account.login() / .register() / .member() */
  YQ.account = {
    login:    function () { openAuth('login'); },
    register: function () { openAuth('register'); },
    member:   openPop,                          // .member('wallet') mở thẳng pane con
    popup:    function () { openPop(); },
    close:    function () { closeAuth(); closePop(); },
    logout:   function () { YQ.auth.signOut(); }
  };

})(jQuery);
