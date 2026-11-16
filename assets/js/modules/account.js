/* ==========================================================================
   Module JS: account — popup Log in / Register + popup member #yqAcctPop
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Gồm 3 mảng:
     1) YQ.auth      : lưu người dùng ở localStorage (KHÔNG lưu mật khẩu).
     2) Popup auth   : "Connect Via" + 5 nút social, 2 tab Log in / Register Now,
                       kèm pane quên mật khẩu. Bootstrap modal, markup là HTML tĩnh
                       (#yqAuthModal, khối AUTH POPUP sau footer mỗi trang).
     3) Popup member : #yqAcctPop — MỘT khối HTML tĩnh (khối MEMBER POPUP ngay sau
                       HEADER) dùng chung: desktop (>= 992px) là dropdown thả dưới
                       avatar ở header; mobile là drawer trượt từ phải, mở từ nút
                       Account trong menu offcanvas. Gồm lời chào + danh sách chức
                       năng + Logout, và pane con (My wallet) thay chỗ ngay trong khối.
                       JS chỉ điền tên, đặt vị trí, bật/tắt. Đóng khi bấm ra ngoài /
                       Esc / nút đóng (mobile) / header thu gọn lúc cuộn (desktop).

   Nguyên tắc an toàn (giống các module khác):
     - Chỉ móc vào DOM + event có sẵn: nút [data-yq-account] trong header/offcanvas
       do app.js dựng, và event yq:header-ready.
     - Xoá file này thì mất đúng popup account, phần còn lại của site vẫn chạy.

   Log in: form #yqLoginForm POST thẳng lên server (email, password, remember), JS
   chỉ chặn khi email thiếu @ hoặc mật khẩu trống. Nút social là link thường (không
   có JS). Register vẫn là demo — thay hàm trong phần "6. Chỗ nối API" khi có server.
   ========================================================================== */
(function ($) {
  'use strict';

  if (!window.YQ || !YQ.icon) return;               // core chưa sẵn sàng
  var BS = window.bootstrap;
  if (!BS || !BS.Modal || !BS.Offcanvas) return;    // cần Bootstrap 5 bundle (Modal + Offcanvas menu mobile)

  var KEY = 'yq_user_v1';

  function isDesktop() { return window.matchMedia('(min-width: 992px)').matches; }

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
    initial: function () { return initialOf(this.name()); },

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

  /* Khu member (<html data-member-area>: các trang trong member/) chỉ vào được khi
     đã đăng nhập — production server chặn ở cổng và in sẵn trạng thái đăng nhập.
     Trang có #yqMemberBtn (server in bản đã đăng nhập, VD index-logined.html) cũng vậy.
     Bản demo: chưa đăng nhập thì tự đăng nhập bằng hồ sơ mẫu (YQ.profile, cùng dữ liệu
     trang profile hiển thị) để avatar ở header mở được menu user thay vì popup Log in. */
  if (!YQ.auth.isIn() && (SERVER_IN || document.documentElement.hasAttribute('data-member-area'))) {
    var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var P = YQ.profile;
    YQ.auth.signIn({
      email: P ? P.get('email') : '',
      first: P ? cap(P.get('firstName')) : '',
      last:  P ? cap(P.get('lastName')) : ''
    });
  }

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
     4. Popup member #yqAcctPop — MỘT khối HTML tĩnh cho cả desktop và mobile
     (khối MEMBER POPUP ngay sau HEADER, ở cấp <body>).
       - Desktop (>= 992px): dropdown dưới avatar — place() đo avatar, đặt
         --yq-acct-top / --yq-acct-right / --yq-acct-caret.
       - Mobile: CSS biến chính khối đó thành drawer trượt từ phải.
     Mục trang đang xem đã đánh dấu sẵn trong HTML (.is-current + aria-current).
     JS chỉ điền tên/email lúc mở, đặt vị trí, bật/tắt hidden/is-open và pane con.
     ====================================================================== */
  var POP = '#yqAcctPop';
  var popDesk = true;                               // lúc mở đang ở desktop hay mobile

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

  /* Desktop: neo khối dưới avatar. Mobile: xoá biến, CSS lo vị trí drawer. */
  function place() {
    var pop = $(POP)[0];
    if (!pop) return;
    var st = pop.style;
    var btn = $btn()[0];
    if (!isDesktop() || !btn || !btn.offsetParent) {
      st.removeProperty('--yq-acct-top');
      st.removeProperty('--yq-acct-right');
      st.removeProperty('--yq-acct-caret');
      return;
    }
    var anchor = $(btn).closest('.yq-acct-anchor')[0] || btn;
    var a = anchor.getBoundingClientRect();
    var b = btn.getBoundingClientRect();
    st.setProperty('--yq-acct-top', Math.round(a.bottom + 12) + 'px');
    st.setProperty('--yq-acct-right', Math.round(document.documentElement.clientWidth - a.right) + 'px');
    st.setProperty('--yq-acct-caret', Math.round(a.right - (b.left + b.width / 2)) + 'px');
  }

  function popOpen() { return $(POP).hasClass('is-open'); }

  /** Mở popup; view = tên pane con (VD 'wallet') để mở thẳng pane đó. */
  function openPop(view) {
    var $pop = $(POP);
    if (!$pop.length) return;
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    paintPop();
    hasView(view) ? showView(view) : showMain();
    popDesk = isDesktop();
    place();
    $pop.prop('hidden', false);
    /* force reflow để transition chạy từ trạng thái ẩn */
    void $pop[0].offsetWidth;
    $pop.addClass('is-open');
    $('html').toggleClass('yq-acct-lock', !popDesk);
    $btn().attr('aria-expanded', 'true');
    /* Khối không nằm ngay sau avatar trong DOM -> đưa focus vào để Tab đi tiếp trong popup */
    var f = popDesk ? $pop[0] : $pop.find('[data-yq-acct-close]')[0];
    if (f) f.focus({ preventScroll: true });
    $(document).off('keydown.yqAcct').on('keydown.yqAcct', function (e) {
      if (e.key === 'Escape') { closePop(); if (popDesk) $btn().trigger('focus'); }
    });
  }

  function closePop() {
    var $pop = $(POP);
    if (!$pop.length || !popOpen()) return;
    $pop.removeClass('is-open');
    $('html').removeClass('yq-acct-lock');
    $btn().attr('aria-expanded', 'false');
    $(document).off('keydown.yqAcct');
    var done = function () { if (!popOpen()) { $pop.prop('hidden', true); showMain(); } };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 340);
  }

  function togglePop() { popOpen() ? closePop() : openPop(); }

  /* Bấm ra ngoài (mobile: bấm vào nền mờ) -> đóng */
  $(document).on('pointerdown', function (e) {
    if (!popOpen()) return;
    if ($(e.target).closest(POP + ', ' + BTN).length) return;
    closePop();
  });
  /* Đổi breakpoint -> đóng; cùng breakpoint -> neo lại theo avatar */
  $(window).on('resize.yqAcct', function () {
    if (!popOpen()) return;
    if (isDesktop() !== popDesk) closePop(); else place();
  });
  /* Desktop: header thu gọn lúc cuộn -> đóng; chưa thu gọn -> bám theo avatar */
  $(window).on('scroll.yqAcct', function () {
    if (!popOpen() || !popDesk) return;
    if ($('#yqHeader').hasClass('is-compact')) closePop(); else place();
  });
  /* Tab ra khỏi popup (sang icon giỏ chẳng hạn) -> đóng để không bỏ sót popup mở lơ lửng */
  $(document).on('focusin', function (e) {
    if (!popOpen()) return;
    if ($(e.target).closest(POP + ', ' + BTN).length) return;
    closePop();
  });
  /* Rê chuột mở mega menu / Seasonal hoặc mở ô tìm kiếm -> nhường chỗ */
  $(document).on('mouseenter', '.yq-nav__item--panel', function () { if (popDesk) closePop(); })
             .on('click', '[data-search-toggle]', function () { closePop(); });

  /* ======================================================================
     5. Nút account ở header
     ====================================================================== */
  function paintHeader() {
    /* #yqMemberBtn: server đã in đúng trạng thái đăng nhập — không đụng vào.
       Chỉ #yqAccountBtn (demo Register ngay trên trang chưa đăng nhập) mới đổi qua lại. */
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
    $('[data-yq-account-label]').text(on ? YQ.auth.name() : 'Account');
    /* Đăng xuất / đổi tên -> đóng, lần mở sau paintPop() điền lại tên mới */
    closePop();
  }

  $(document).on('yq:header-ready yq:auth-changed', paintHeader);

  $(document).on('click', '[data-yq-account], [data-yq-member]', function (e) {
    e.preventDefault();
    /* Trên mobile nút nằm trong offcanvas menu — đóng nó trước cho khỏi chồng lớp. */
    var oc = document.getElementById('yqOffcanvas');
    var inst = oc && BS.Offcanvas.getInstance(oc);
    if (inst && $(this).closest('#yqOffcanvas').length) {
      $(oc).one('hidden.bs.offcanvas', function () {
        /* chờ Bootstrap trả focus về nút burger xong mới mở, kẻo focusin đóng ngay */
        setTimeout(function () { YQ.auth.isIn() ? openPop() : openAuth('login'); }, 0);
      });
      inst.hide();
      return;
    }
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    /* Cùng một popup: desktop thả dưới avatar, mobile thành drawer (CSS) */
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
      e.preventDefault();
      var $f = $(this);
      clearErrors($f);
      var ok = check('yqRegEmail', { required: true, email: true, label: 'Email' });
      ok = check('yqRegPass', { required: true, min: 6, label: 'Password' }) && ok;
      ok = check('yqRegPass2', { required: true, same: val('yqRegPass'), label: 'Repeated password' }) && ok;
      ok = check('yqRegFirst', { required: true, label: 'First name' }) && ok;
      ok = check('yqRegLast', { required: true, label: 'Last name' }) && ok;
      ok = check('yqRegCountry', { required: true, label: 'Country' }) && ok;
      /* radio + checkbox: không có .val() để check() đọc -> kiểm tra riêng */
      if (!$f.find('[name="gender"]:checked').length) {
        $('[data-err-for="yqRegGender"]').text('Please choose an option').addClass('is-on');
        ok = false;
      }
      if (!$('#yqRegTerms').is(':checked')) {
        $('[data-err-for="yqRegTerms"]').text('Please accept the Terms and Privacy Policy').addClass('is-on');
        ok = false;
      }
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
    .on('click', '#yqAcctPop [data-yq-acct-close]', function () { closePop(); })
    .on('click', '#yqAcctPop a[href]', function () { closePop(); })
    .on('click', '#yqAcctPop [data-yq-do="logout"]', function () {
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
    .on('input', '#yqAuthModal .yq-input, #yqAcctPop .yq-input', function () {
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

  /* API nhỏ cho trang khác gọi: YQ.account.login() / .register() / .member() */
  YQ.account = {
    login:    function () { openAuth('login'); },
    register: function () { openAuth('register'); },
    member:   openPop,                          // .member('wallet') mở thẳng pane con
    popup:    function () { openPop(); },
    close:    function () { closeAuth(); closePop(); },
    logout:   function () { YQ.auth.signOut(); }
  };

  paintHeader();
})(jQuery);
