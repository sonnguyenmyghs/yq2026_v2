/* ==========================================================================
   Module JS: account — popup Log in / Register + panel member "My Functions"
   Nạp sau data.js / app.js / pages.js nên dùng được YQ.*, jQuery, Bootstrap 5.

   Gồm 4 mảng:
     1) YQ.auth      : lưu người dùng ở localStorage (KHÔNG lưu mật khẩu).
     2) Popup auth   : "Connect Via" + 5 nút social, 2 tab Log in / Register Now,
                       kèm pane quên mật khẩu. Bootstrap modal, markup là HTML tĩnh
                       (#yqAuthModal, khối AUTH POPUP sau footer mỗi trang).
     3) Popup member : dropdown thả xuống dưới avatar ở header (desktop, >= 992px):
                       lời chào + danh sách chức năng + Logout. Markup là HTML tĩnh
                       (#yqAcctPop trong khối HEADER), JS chỉ điền tên + bật/tắt.
                       Đóng khi bấm ra ngoài / Esc / header thu gọn lúc cuộn.
     4) Panel member : "My Functions" trượt từ phải (Bootstrap offcanvas) — dùng ở
                       mobile (nút Account nằm trong menu offcanvas nên không có chỗ
                       neo dropdown) và cho các mục có `view` (pane con như My Wallet).

   Danh sách chức năng: mảng MENU ở mục 4 (mặc định); khai báo YQ.memberMenu trong
   data.js thì thay thế được mà không sửa module.

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

  /* Menu member cho panel "My Functions" (mobile). Dropdown desktop là HTML tĩnh
     trong header — đổi menu thì sửa cả #yqAcctPop ở mọi trang.
       href   -> điều hướng sang trang thật
       view   -> mở pane con trong panel "My Functions" (dropdown sẽ mở panel tại pane đó)
       action -> 'logout'
     Có href thì view bị bỏ qua. */
  var MENU = YQ.memberMenu || [
    { key: 'profile',  label: 'My profile',      icon: 'user',     href: 'member/profile.html' },
    { key: 'orders',   label: 'My orders',       icon: 'bag',      href: 'member/orders.html' },
    { key: 'wallet',   label: 'My wallet',       icon: 'wallet',   view: 'wallet' },
    { key: 'password', label: 'Change password', icon: 'lock',     href: 'member/password.html' },
    { key: 'invite',   label: 'Invite friends',  icon: 'userplus', href: 'member/invite.html' },
    { key: 'logout',   label: 'Logout',          icon: 'logout',   action: 'logout' }
  ];

  function isDesktop() { return window.matchMedia('(min-width: 992px)').matches; }

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

  /* Khu member (<html data-member-area>: các trang trong member/) chỉ vào được khi
     đã đăng nhập — production server chặn ở cổng và in sẵn trạng thái đăng nhập.
     Bản demo: chưa đăng nhập thì tự đăng nhập bằng hồ sơ mẫu (YQ.profile, cùng dữ liệu
     trang profile hiển thị) để avatar ở header mở được menu user thay vì popup Log in. */
  if (!YQ.auth.isIn() && document.documentElement.hasAttribute('data-member-area')) {
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

  /** Tên hiển thị của nút social, lấy từ data-yq-label trong HTML. */
  function socialLabel(id) {
    return $('[data-yq-social="' + id + '"]').attr('data-yq-label') || id;
  }

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
     4. Panel member "My Functions"
     ====================================================================== */
  var memberOc = null;

  function menuHtml() {
    return MENU.map(function (m) {
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

  function openMember(view) {
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    buildMember();
    paintMember();
    view && views[view] ? showView(view) : showMain();
    memberOc.show();
  }
  function closeMember() { if (memberOc) memberOc.hide(); }

  /* ======================================================================
     4b. Popup member — dropdown dưới avatar ở header (desktop)
     Markup là HTML tĩnh trong khối HEADER mỗi trang (#yqAcctPop, ngay sau avatar
     để Tab đi đúng thứ tự). Mục trang đang xem đã đánh dấu sẵn trong HTML
     (.is-current + aria-current). JS chỉ điền tên/email lúc mở và bật/tắt.
     ====================================================================== */
  var POP = '#yqAcctPop';

  function buildPop() {
    var $pop = $(POP);
    return $pop.length ? $pop : null;
  }

  function paintPop() {
    var u = YQ.auth.user || {};
    $('#yqAcctAvatar').text(YQ.auth.initial());
    $('#yqAcctName').text('Hi, ' + YQ.auth.name());
    $('#yqAcctMail').text(u.email || '').prop('hidden', !u.email);
  }

  function popOpen() { return $(POP).hasClass('is-open'); }

  function openPop() {
    var $pop = buildPop();
    if (!$pop) return;
    paintPop();
    /* Mũi tên chỉ đúng giữa avatar: đo khoảng cách từ mép phải khối neo tới tâm nút */
    var a = $pop.parent()[0].getBoundingClientRect();
    var b = $('#yqAccountBtn')[0].getBoundingClientRect();
    $pop[0].style.setProperty('--yq-acct-caret', Math.round(a.right - (b.left + b.width / 2)) + 'px');
    $pop.prop('hidden', false);
    /* force reflow để transition chạy từ trạng thái ẩn */
    void $pop[0].offsetWidth;
    $pop.addClass('is-open');
    $('#yqAccountBtn').attr('aria-expanded', 'true');
    $(document).on('keydown.yqAcct', function (e) {
      if (e.key === 'Escape') { closePop(); $('#yqAccountBtn').trigger('focus'); }
    });
  }

  function closePop() {
    var $pop = $(POP);
    if (!$pop.length || !popOpen()) return;
    $pop.removeClass('is-open');
    $('#yqAccountBtn').attr('aria-expanded', 'false');
    $(document).off('keydown.yqAcct');
    var done = function () { if (!popOpen()) $pop.prop('hidden', true); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 240);
  }

  function togglePop() { popOpen() ? closePop() : openPop(); }

  /* Bấm ra ngoài / header thu gọn / đổi breakpoint -> đóng */
  $(document).on('pointerdown', function (e) {
    if (!popOpen()) return;
    if ($(e.target).closest(POP + ', #yqAccountBtn').length) return;
    closePop();
  });
  $(window).on('resize.yqAcct', function () { if (popOpen() && !isDesktop()) closePop(); });
  $(window).on('scroll.yqAcct', function () {
    if (popOpen() && $('#yqHeader').hasClass('is-compact')) closePop();
  });
  /* Tab ra khỏi popup (sang icon giỏ chẳng hạn) -> đóng để không bỏ sót popup mở lơ lửng */
  $(document).on('focusin', function (e) {
    if (!popOpen()) return;
    if ($(e.target).closest(POP + ', #yqAccountBtn').length) return;
    closePop();
  });
  /* Rê chuột mở mega menu / Seasonal hoặc mở ô tìm kiếm -> nhường chỗ */
  $(document).on('mouseenter', '.yq-nav__item--panel', function () { closePop(); })
             .on('click', '[data-search-toggle]', function () { closePop(); });

  /* ======================================================================
     5. Nút account ở header
     ====================================================================== */
  function paintHeader() {
    var on = YQ.auth.isIn();
    var $btn = $('#yqAccountBtn');
    if ($btn.length) {
      $btn.toggleClass('is-signed', on)
          .attr('aria-label', on ? 'My account — ' + YQ.auth.name() : 'Account')
          .attr('title', on ? 'Hi, ' + YQ.auth.name() : 'Log in or register')
          .attr('aria-haspopup', on ? 'dialog' : null)
          .attr('aria-expanded', on ? 'false' : null)
          .html(on ? '<span class="yq-acct-initial">' + esc(YQ.auth.initial()) + '</span>' : YQ.icon('user', 19));
    }
    $('[data-yq-account-label]').text(on ? YQ.auth.name() : 'Account');
    /* Đăng xuất / đổi tên -> đóng, lần mở sau paintPop() điền lại tên mới */
    closePop();
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
    if (!YQ.auth.isIn()) { openAuth('login'); return; }
    /* Desktop: avatar ở header -> dropdown. Còn lại -> panel trượt. */
    if (this.id === 'yqAccountBtn' && isDesktop()) togglePop();
    else openMember();
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
      $btn.toggleClass('is-on', show)               // CSS đổi icon mắt / mắt gạch
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

    /* --- popup member (dropdown): mục có view -> mở panel tại pane đó --- */
    .on('click', '#yqAcctPop [data-yq-view]', function () {
      var v = $(this).attr('data-yq-view');
      closePop();
      openMember(v);
    })
    .on('click', '#yqAcctPop a[href]', function () { closePop(); })

    /* --- panel member: điều hướng pane --- */
    .on('click', '#yqMemberPanel [data-yq-view]', function () {
      var v = $(this).attr('data-yq-view');
      v ? showView(v) : showMain();
    })
    .on('click', '#yqAcctPop [data-yq-do="logout"], #yqMemberPanel [data-yq-do="logout"]', function () {
      closePop();
      closeMember();
      YQ.auth.signOut();
      YQ.toast('You have been logged out');
      /* Đang ở khu member thì rời đi — trang này chỉ dành cho người đã đăng nhập */
      if (document.documentElement.hasAttribute('data-member-area')) {
        setTimeout(function () { window.location.href = YQ.url('index.html'); }, 900);
      }
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
      $m.find('[data-yq-peek]').removeClass('is-on').attr('aria-label', 'Show password');
      clearErrors($m);
    })
    .on('hidden.bs.offcanvas', '#yqMemberPanel', showMain);

  /* API nhỏ cho trang khác gọi: YQ.account.login() / .register() / .member() */
  YQ.account = {
    login:    function () { openAuth('login'); },
    register: function () { openAuth('register'); },
    member:   openMember,                       // .member('wallet') mở thẳng pane con
    popup:    function () { YQ.auth.isIn() ? openPop() : openAuth('login'); },
    close:    function () { closeAuth(); closeMember(); closePop(); },
    logout:   function () { YQ.auth.signOut(); }
  };

  paintHeader();
})(jQuery);
