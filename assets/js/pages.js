/* ==========================================================================
   YQ eStore — Components + page controllers
   ========================================================================== */
(function ($) {
  'use strict';

  var C = YQ.config;

  /* ======================================================================
     1. Components — (đã bỏ YQ.priceHtml / YQ.summaryHtml: giá và order summary
        giờ là HTML tĩnh do PHP in sẵn trong từng trang)
     ====================================================================== */

  /* ======================================================================
     3. Shop (filters + sort + search)
     ====================================================================== */
  YQ.initShop = function () {
    var state = {
      cat: YQ.param('cat') || 'all',
      season: YQ.param('season') || null,
      q: YQ.param('q') || '',
      sort: 'featured'
    };

    /* Chip danh mục (#shopCats [data-cat]), chip mùa (#shopSeasons [data-season]) và
       #shopGrid đều là HTML tĩnh trong shop.html — JS không dựng gì, chỉ ẩn/hiện,
       đánh dấu chip đang chọn và sắp lại thứ tự các cột theo data-* của chúng. */
    var $grid = $('#shopGrid');
    var $items = $grid.children();

    function match($el) {
      var q = state.q.toLowerCase();
      if (state.cat !== 'all' && $el.attr('data-cat') !== state.cat) return false;
      if (state.season && (' ' + $el.attr('data-seasons') + ' ').indexOf(' ' + state.season + ' ') === -1) return false;
      if (q && $el.find('.yq-card__body').text().toLowerCase().indexOf(q) === -1) return false;
      return true;
    }

    function sorted() {
      var s = state.sort;
      function num($el, k) { return parseFloat($el.attr('data-' + k)) || 0; }
      return $items.get().sort(function (a, b) {
        var $a = $(a), $b = $(b);
        if (s === 'price-asc')  return num($a, 'price') - num($b, 'price');
        if (s === 'price-desc') return num($b, 'price') - num($a, 'price');
        if (s === 'name')       return $a.attr('data-name').localeCompare($b.attr('data-name'));
        if (s === 'new')        return num($b, 'new') - num($a, 'new') || num($a, 'rank') - num($b, 'rank');
        return num($a, 'rank') - num($b, 'rank');
      });
    }

    function render() {
      $('#shopCats .yq-chip').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-cat') === state.cat);
      });
      $('#shopSeasons .yq-chip').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-season') === state.season);
      });
      $('#shopQuery').toggle(!!state.q).find('b').text(state.q);

      var shown = 0;
      $grid.append(sorted());
      $items.each(function () {
        var ok = match($(this));
        $(this).toggle(ok);
        if (ok) shown++;
      });

      $('#shopCount').text(shown + ' product' + (shown === 1 ? '' : 's'));
      $grid.toggle(shown > 0);
      $('#shopEmpty').toggle(shown === 0);

      YQ.stagger('#shopGrid > :visible .yq-reveal', 45);
      YQ.initReveal();
    }

    /* Events */
    $(document).on('click', '#shopCats .yq-chip', function () {
      state.cat = $(this).attr('data-cat'); render();
    });
    $(document).on('click', '#shopSeasons .yq-chip', function () {
      var s = $(this).attr('data-season');
      state.season = (state.season === s) ? null : s;
      render();
    });
    $(document).on('change', '#shopSort', function () { state.sort = this.value; render(); });
    $(document).on('click', '#shopReset, #shopClearQuery', function () {
      state = { cat: 'all', season: null, q: '', sort: 'featured' };
      $('#shopSort').val('featured');
      render();
    });

    render();
  };

  /* ======================================================================
     4. Product detail
     ====================================================================== */
  YQ.initProduct = function () {
    /* Toàn bộ nội dung PDP (gallery, info, giá, thuộc tính, related) là HTML tĩnh
       — backend PHP in sẵn, JS không tính giá. JS chỉ xử lý:
         - bấm thumb -> đổi ảnh chính
       (thuộc tính: modules/attributes.js · thêm giỏ: modules/add-to-cart.js) */
    $(document).on('click', '#pdpThumbs .yq-pdp__thumb', function () {
      $('#pdpThumbs .yq-pdp__thumb').removeClass('is-active');
      $(this).addClass('is-active');
      // Chép ảnh của thumb lên khung chính, bỏ lazy để ảnh lớn tải ngay
      var $shot = $(this).find('.yq-media').children().first().clone();
      $shot.removeAttr('loading');
      $('#pdpMain').empty().append($shot);
    });

    YQ.stagger('#pdpRelated .yq-reveal');
    YQ.initReveal();
  };

  /* ======================================================================
     5. Experiences
     ====================================================================== */
  /* ======================================================================
     6. Celebrations
     ====================================================================== */
  /* ======================================================================
     7. Cart
     ====================================================================== */
  YQ.initCart = function () {
    // Toàn bộ markup (các dòng .yq-line, order summary, giỏ trống #cartEmpty) là HTML tĩnh trong cart.html
    // — PHP in sẵn từ session. JS không dựng dòng nào: chỉ đổi text giá/tổng khi đổi số lượng,
    // gỡ dòng có sẵn khi bấm X và bật khối giỏ trống khi hết dòng (demo, chưa gọi API).

    /* Tính lại thành tiền mỗi dòng (data-price × số lượng) + subtotal/ship/thuế/tổng,
       rồi chỉ đổi text / width trên các phần tử đã có. */
    function recalc() {
      var sub = 0;
      $('#cartLines .yq-line').each(function () {
        var qty = parseInt($(this).find('[data-qty-val]').text(), 10) || 0;
        var line = (parseFloat($(this).attr('data-price')) || 0) * qty;
        $(this).find('.yq-line__price').text(YQ.money(line));
        sub += line;
      });

      var ship = (sub <= 0 || sub >= C.freeShippingThreshold) ? 0 : C.shipping;
      var tax = sub * C.taxRate;
      var toFree = Math.max(0, C.freeShippingThreshold - sub);

      $('#cartSubtotal').text(YQ.money(sub));
      $('#cartShipping').text(ship === 0 ? 'Free' : YQ.money(ship));
      $('#cartTax').text(YQ.money(tax));
      $('#cartTotal').text(YQ.money(sub + ship + tax));

      // 2 note free ship loại trừ nhau
      $('#cartToFree').text(YQ.money(toFree));
      $('#cartShipBar').css('width', Math.min(100, (sub / C.freeShippingThreshold) * 100) + '%');
      $('#cartShipNote').toggleClass('d-none', !(sub > 0 && toFree > 0));
      $('#cartShipFree').toggleClass('d-none', !(sub > 0 && toFree === 0));

      // Hết dòng -> ẩn layout, hiện khối giỏ trống
      var empty = !$('#cartLines .yq-line').length;
      $('#cartWrap').toggleClass('d-none', empty);
      $('#cartEmpty').toggleClass('d-none', !empty);
    }

    $(document).on('yq:qty', '#cartWrap [data-qty]', recalc);   // stepper chung (app.js) đã đổi số
    $(document).on('click', '#cartWrap [data-remove]', function () {
      $(this).closest('.yq-line').remove();
      recalc();
      YQ.toast('Item removed');
    });
    $(document).on('click', '#cartClear', function () {
      $('#cartLines .yq-line').remove();
      recalc();
      YQ.toast('Cart cleared');
    });
  };

  /* ======================================================================
     8. Checkout (4 bước)
     ====================================================================== */
  YQ.initCheckout = function () {
    // Toàn bộ markup (thanh bước, summary, review, màn cảm ơn, giỏ trống) là HTML tĩnh trong checkout.html
    // — JS chỉ chuyển bước, validate, đổ text vào review và bật/tắt các khối có sẵn.
    var current = 1;

    function paintSteps() {
      $('#coSteps .yq-step').each(function () {
        var n = parseInt($(this).data('step-idx'), 10);
        var done = n < current;
        $(this).toggleClass('is-active', n === current).toggleClass('is-done', done);
        $(this).find('.yq-step__n').prop('hidden', done);
        $(this).find('.yq-step__ok').prop('hidden', !done);
      });
    }

    function show(n) {
      current = n;
      paintSteps();
      $('.co-pane').hide().filter('[data-pane="' + n + '"]').fadeIn(220);
      $('html,body').animate({ scrollTop: $('#coTop').offset().top - 140 }, 350);
    }

    function validate(n) {
      var ok = true;
      $('.co-pane[data-pane="' + n + '"]').find('[required]').each(function () {
        var $f = $(this);
        var v = $.trim($f.val());
        var good = !!v;
        if (good && $f.attr('type') === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        $f.toggleClass('is-invalid', !good);
        $f.closest('.mb-3, .col-md-6, .col-12').find('.yq-error').toggleClass('is-on', !good);
        if (!good) ok = false;
      });
      return ok;
    }

    function fillReview() {
      $('#coReview [data-co-review]').each(function () {
        var id = $(this).data('co-review');
        var v = $.trim($('#' + id).val());
        if (id === 'coCard') v = (v || '0000').slice(-4);
        if (id === 'coDate') v = v || 'Next available date';
        $(this).text(v || '—');
      });
    }

    $(document).on('click', '[data-co-next]', function () {
      var n = parseInt($(this).data('co-next'), 10);
      if (!validate(current)) { YQ.toast('Please complete the required fields'); return; }
      if (n === 4) fillReview();
      show(n);
    });
    $(document).on('click', '[data-co-back]', function () { show(parseInt($(this).data('co-back'), 10)); });
    $(document).on('click', '#coSteps .yq-step.is-done', function () { show(parseInt($(this).data('step-idx'), 10)); });

    $(document).on('click', '#coPlaceOrder', function () {
      YQ.cart.clear();
      $('#coOrderNo').text('GH' + Date.now().toString().slice(-8));   // demo — production: {$order_code}
      $('.co-pane').hide();
      $('#coDone').fadeIn(220);
      $('#coAside').fadeOut(200);
      $('#coSteps').fadeOut(200);
      $('html,body').animate({ scrollTop: 0 }, 350);
    });

    /* Card number formatting */
    $(document).on('input', '#coCard', function () {
      var v = this.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      this.value = v;
    });
    $(document).on('input', '#coExpiry', function () {
      var v = this.value.replace(/\D/g, '').slice(0, 4);
      this.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
    });

    /* Shipping method */
    $(document).on('click', '.co-ship', function () {
      $('.co-ship').removeClass('is-active');
      $(this).addClass('is-active');
    });

    paintSteps();
  };

  /* ======================================================================
     9. Personalise (eCard)
     ====================================================================== */
  YQ.initPersonalise = function () {
    // Toàn bộ markup (trải nghiệm đã chọn, mẫu thiệp, cách giao, tổng tiền) là HTML tĩnh trong personalise.html
    // — JS chỉ đổi class is-active / theme thiệp, đổ text vào preview + tổng tiền và thêm vào giỏ.
    var $exp = $('#peExp');

    /* Demo: PHP đã in đúng trải nghiệm theo ?exp=. Ở bản tĩnh, nếu ?exp= khác mẫu
       thì chỉ đổi text/src/data-* của các phần tử có sẵn cho khớp (không dựng HTML). */
    var demo = YQ.experience(YQ.param('exp'));
    if (demo && demo.id !== $exp.attr('data-exp-id')) {
      $exp.attr({ 'data-exp-id': demo.id, 'data-exp-price': demo.price, 'data-exp-tone': demo.tone });
      $exp.find('.pe-exp__img img').attr({ src: demo.img, alt: demo.name });
      $exp.find('.pe-exp__name').text(demo.name);
      $exp.find('.pe-exp__meta').text(demo.duration + ' · ' + demo.place);
      $exp.find('.pe-exp__price').text(YQ.money0(demo.price));
      $('#peBase').text(YQ.money(demo.price));
    }

    /* Thông tin trải nghiệm đọc lại từ data-* / text của #peExp (PHP in sẵn) */
    var exp = {
      id: $exp.attr('data-exp-id'),
      price: parseFloat($exp.attr('data-exp-price')) || 0,
      tone: parseInt($exp.attr('data-exp-tone'), 10) || 3,
      name: $.trim($exp.find('.pe-exp__name').text()),
      label: $.trim($exp.find('.pe-exp__meta').text())
    };

    /* Mẫu thiệp + cách giao đang chọn = nút có class is-active */
    function $design()   { return $('#peDesigns .yq-cardpick.is-active'); }
    function $delivery() { return $('.pe-delivery.is-active'); }

    function paintPreview() {
      var to  = $.trim($('#peTo').val());
      var msg = $.trim($('#peMsg').val());
      var frm = $.trim($('#peFrom').val());

      $('#peCard').attr('class', $.trim('yq-ecard ' + ($design().attr('data-theme') || '')));
      $('#peCardTo').text(to ? 'For ' + to : '').toggle(!!to);
      $('#peCardMsg').text(msg ? '“' + msg + '”' : '“Your message will appear here.”');
      $('#peCardFrom').text(frm ? '— ' + frm : '').toggle(!!frm);

      var fee = parseFloat($delivery().attr('data-fee')) || 0;
      $('#peTotal').text(YQ.money(exp.price + fee));
      $('#peFeeRow').toggle(fee > 0);
      $('#peDeliveryNote').text($delivery().attr('data-note') || '');
    }

    $(document).on('click', '#peDesigns .yq-cardpick', function () {
      $('#peDesigns .yq-cardpick').removeClass('is-active');
      $(this).addClass('is-active');
      paintPreview();
    });

    $(document).on('click', '.pe-delivery', function () {
      $('.pe-delivery').removeClass('is-active');
      $(this).addClass('is-active');
      paintPreview();
    });

    $(document).on('input', '#peTo, #peFrom', paintPreview);
    $(document).on('input', '#peMsg', function () {
      var len = this.value.length;
      $('#peCounter').text(len + ' / 200 characters');
      paintPreview();
    });

    function addToCart(personalised) {
      var delivery = $delivery().attr('data-delivery');
      var fee = personalised ? (parseFloat($delivery().attr('data-fee')) || 0) : 0;
      YQ.cart.add(
        { id: exp.id, name: exp.name, tone: exp.tone, price: exp.price, catLabel: 'Experience' },
        { id: (personalised ? $design().attr('data-design') + '-' + delivery : 'plain'), label: exp.label, price: exp.price },
        1,
        personalised ? {
          addonFee: fee,
          addonLabel: $.trim($design().find('.yq-cardpick__name').text()) + ' ' + (delivery === 'physical' ? 'physical card' : 'eCard'),
          giftTo: $.trim($('#peTo').val()),
          giftFrom: $.trim($('#peFrom').val()),
          giftMsg: $.trim($('#peMsg').val())
        } : {}
      );
    }

    $(document).on('click', '#peContinue', function () {
      addToCart(true);
      YQ.toast('Gift personalised and added to cart', 'Review & pay', 'checkout.html');
      setTimeout(function () { window.location.href = 'checkout.html'; }, 700);
    });
    $(document).on('click', '#peSkip', function (e) {
      e.preventDefault();
      addToCart(false);
      window.location.href = 'checkout.html';
    });

    paintPreview();
    YQ.initReveal();
  };

  /* ======================================================================
     10. My Orders (2 tab: Completed orders / Pending payment)
     ====================================================================== */
  YQ.initOrders = function () {
    // Toàn bộ markup (2 tab, các thẻ đơn ở cả 2 dạng rút gọn/đầy đủ, khối rỗng) là HTML tĩnh trong member/orders.html
    // — JS chỉ chuyển tab, mở/đóng thẻ đơn (class + hidden) và xử lý ReOrder.
    var TABS = ['completed', 'pending'];

    /** Mở 1 tab: bật class/aria trên nút, hiện pane tương ứng, ẩn pane còn lại. */
    function showTab(id) {
      $('#ordTabs [data-ord-tab]').each(function () {
        var on = $(this).attr('data-ord-tab') === id;
        $(this).toggleClass('is-active', on).attr('aria-pressed', on ? 'true' : 'false');
      });
      $('#ordList [data-ord-pane]').each(function () {
        $(this).prop('hidden', $(this).attr('data-ord-pane') !== id);
      });
    }

    /** Mở/đóng 1 thẻ đơn: đổi class is-open + aria, ẩn/hiện khối rút gọn và khối đầy đủ. */
    function setOpen($card, on) {
      $card.toggleClass('is-open', on);
      $card.find('[data-ord-toggle]').attr('aria-expanded', on ? 'true' : 'false');
      $card.find('.yq-ord__briefs').prop('hidden', on);
      $card.find('.yq-ord__full').prop('hidden', !on);
    }

    /** Ghép 1 dòng đơn với sản phẩm thật (chỉ dùng cho ReOrder); trả null nếu id không còn trong catalogue. */
    function line(row) {
      var p = YQ.product(row.id);
      if (!p) return null;
      var opt = (p.options || []).filter(function (o) { return o.id === row.optionId; })[0];
      var unit = opt && opt.price != null ? opt.price : p.price;
      var qty = row.qty || 1;
      return {
        product: p, option: opt || null, qty: qty,
        unit: unit, sum: unit * qty,
        name: p.name + (opt && opt.label ? ' (' + opt.label + ')' : '')
      };
    }
    function linesOf(order) {
      return (order.items || []).map(line).filter(Boolean);
    }

    /* --- sự kiện --- */
    $(document).on('click', '#ordTabs [data-ord-tab]', function () {
      showTab($(this).attr('data-ord-tab'));
    });

    $(document).on('click', '#ordList [data-ord-toggle]', function () {
      var $card = $(this).closest('.yq-ord__card');
      setOpen($card, !$card.hasClass('is-open'));
    });

    $(document).on('click', '#ordList [data-ord-reorder]', function () {
      var id = $(this).closest('.yq-ord__card').attr('data-ord-id');
      var order = (YQ.orders || []).filter(function (o) { return o.id === id; })[0];
      if (!order) return;

      var lines = linesOf(order);
      if (!lines.length) { YQ.toast('These items are no longer available'); return; }

      $.each(lines, function (_, l) { YQ.cart.add(l.product, l.option, l.qty); });
      YQ.toast(lines.length + (lines.length === 1 ? ' item' : ' items') + ' added to your cart',
               'View cart', 'cart.html');
    });

    /* ?tab=pending -> mở sẵn tab chờ thanh toán (production: PHP in sẵn tab theo {$currentTab}). */
    var tab = YQ.param('tab');
    if (TABS.indexOf(tab) > -1) showTab(tab);
  };

  /* ======================================================================
     11. Member profile (member/profile.html)
     ====================================================================== */
  YQ.initProfile = function () {
    /* Markup nằm sẵn trong member/profile.html (backend đổ dữ liệu vào HTML).
       Controller này KHÔNG dựng HTML — chỉ bật/tắt chế độ sửa, kiểm tra ô nhập
       và chép giá trị vừa nhập ngược lại phần hiển thị sau khi "Save". Lưu thật
       là việc của backend (form method="post"); demo chặn submit và chỉ cập nhật
       trên trang. */
    var $form = $('#profForm');
    if (!$form.length) return;
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setEditing(on) {
      $form.toggleClass('is-editing', on);
      if (on) {
        var el = $form.find('.yq-prof__control')[0];
        if (el) el.focus();
      }
    }

    /** Ghi nhớ giá trị hiện tại làm "mặc định" để Cancel (form.reset) quay về đúng bản đã lưu. */
    function commitDefaults() {
      $form.find('.yq-prof__control').each(function () {
        if (this.tagName === 'SELECT') {
          $(this).find('option').each(function () { this.defaultSelected = this.selected; });
        } else {
          this.defaultValue = this.value;
        }
      });
    }

    function clearError(el) {
      $(el).removeClass('is-invalid');
      $('[data-err-for="' + el.id + '"]').removeClass('is-on').text('');
    }
    function showError(el, msg) {
      $(el).addClass('is-invalid');
      $('[data-err-for="' + el.id + '"]').text(msg).addClass('is-on');
    }

    function validate() {
      var bad = null;
      $form.find('.yq-prof__control').each(function () {
        clearError(this);
        var v = $.trim(this.value || '');
        if (this.type === 'email' && v && !RE_MAIL.test(v)) {
          showError(this, 'Enter a valid email address');
          bad = bad || this;
        }
      });
      return bad;
    }

    /** Chép giá trị ô nhập -> span hiển thị của từng hàng --edit. */
    function applyToView() {
      $form.find('.yq-prof__row--edit').each(function () {
        var $row = $(this);
        var el = $row.find('.yq-prof__control')[0];
        var $val = $row.find('.yq-prof__value');
        if (!el) return;
        var v = $.trim(el.value || '');
        if (!v) { $val.addClass('is-empty').text('Not provided'); return; }
        $val.removeClass('is-empty').text(el.type === 'date' ? YQ.dateLabel(v) : v);
      });
    }

    /** Thẻ trái: tên, chữ cái đầu, % hoàn thiện — tính lại từ DOM. */
    function refreshCard() {
      var first = $.trim($('#pf_firstName').val() || '');
      var last  = $.trim($('#pf_lastName').val() || '');
      var name  = $.trim(first + ' ' + last);
      $('#profName').text(name || 'Your profile');
      $('#profInitials').text(((first.charAt(0) || name.charAt(0) || '?') + last.charAt(0)).toUpperCase());

      var $rows = $form.find('.yq-prof__row');
      var filled = $rows.filter(function () { return !$(this).find('.yq-prof__value').hasClass('is-empty'); }).length;
      var pct = $rows.length ? Math.round(filled / $rows.length * 100) : 100;
      $('#profPct').text(pct + '%');
      $('#profBar').css('width', pct + '%');

      var missing = $form.find('.yq-prof__row--edit').filter(function () {
        return $(this).find('.yq-prof__value').hasClass('is-empty');
      }).map(function () { return $.trim($(this).find('.yq-prof__label').text()); }).get();
      $('#profHint').text(missing.length
        ? missing.length + (missing.length === 1 ? ' field left: ' : ' fields left: ') +
          missing.slice(0, 3).join(', ') + (missing.length > 3 ? '…' : '')
        : 'Everything is filled in — thank you.');
    }

    $form
      .on('click', '[data-prof-edit]', function () { setEditing(true); })
      .on('click', '[data-prof-cancel]', function () {
        $form[0].reset();
        $form.find('.yq-prof__control').each(function () { clearError(this); });
        setEditing(false);
      })
      .on('submit', function (e) {
        e.preventDefault();                        // demo: không có server nhận POST
        var bad = validate();
        if (bad) { bad.focus(); YQ.toast('Please check the highlighted field'); return; }

        applyToView();
        refreshCard();
        commitDefaults();
        /* Giữ phiên đăng nhập (avatar/lời chào ở header) khớp với hồ sơ vừa sửa. */
        if (YQ.auth && YQ.auth.isIn()) {
          YQ.auth.update({
            first: $.trim($('#pf_firstName').val() || ''),
            last:  $.trim($('#pf_lastName').val() || ''),
            email: $.trim($('#pf_email').val() || '')
          });
        }
        setEditing(false);
        YQ.toast('Profile updated');
      })
      .on('input change', '.yq-prof__control', function () { clearError(this); });

    commitDefaults();
    if (YQ.param('edit') === '1') setEditing(true);
  };

  /* ======================================================================
     12. Change password (member/password.html)
     ====================================================================== */
  YQ.initPassword = function () {
    /* Markup (thẻ #pwAside, form #pwForm, thanh sức mạnh, danh sách điều kiện) là HTML tĩnh
       trong member/password.html — JS chỉ tô thanh sức mạnh, bật is-on cho điều kiện đạt,
       validate và đổ text "Signed in as" / "Last changed" từ phiên demo. */
    var $form = $('#pwForm');
    if (!$form.length) return;

    /* 4 điều kiện; đạt bao nhiêu thì thanh sức mạnh lên bấy nhiêu.
       id khớp với li[data-rule] trong #pwRules (nhãn chữ nằm trong HTML). */
    var RULES = [
      { id: 'len',   test: function (v) { return v.length >= 8; } },
      { id: 'case',  test: function (v) { return /[a-z]/.test(v) && /[A-Z]/.test(v); } },
      { id: 'digit', test: function (v) { return /\d/.test(v); } },
      { id: 'sym',   test: function (v) { return /[^A-Za-z0-9]/.test(v); } }
    ];
    var LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

    function passed(v) {
      return RULES.filter(function (r) { return r.test(v); });
    }

    /** Demo: đổ email phiên đăng nhập + ngày đổi mật khẩu gần nhất (production PHP in sẵn). */
    function fillFacts() {
      var email = YQ.profile.get('email');
      var changed = YQ.profile.get('passwordChangedAt');
      if (email) $('#pwEmail').text(email);
      $('#pwChanged').text(changed ? YQ.dateLabel(changed) : 'Never');
    }

    /** Tô thanh sức mạnh + tick điều kiện theo ô "New password". */
    function paintStrength() {
      var v = $('#pwNew').val() || '';
      var hit = passed(v);
      var score = v ? hit.length : 0;

      $('#pwMeter').attr('data-score', score);
      $('#pwLevel').text(LEVELS[score]);
      $('#pwRules li').each(function () {
        var id = $(this).attr('data-rule');
        $(this).toggleClass('is-on', hit.filter(function (r) { return r.id === id; }).length > 0);
      });
    }

    function fail(id, msg) {
      $('#' + id).addClass('is-invalid');
      $('[data-err-for="' + id + '"]').text(msg).addClass('is-on');
      return false;
    }

    $(document)
      .on('input', '#pwNew', paintStrength)
      .on('input', '#pwForm .yq-input', function () {
        $(this).removeClass('is-invalid');
        $('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
      })
      .on('submit', '#pwForm', function (e) {
        e.preventDefault();
        $('#pwForm .yq-input').removeClass('is-invalid');
        $('#pwForm .yq-error').removeClass('is-on').text('');

        var cur = $('#pwCurrent').val() || '';
        var nw  = $('#pwNew').val() || '';
        var cf  = $('#pwConfirm').val() || '';
        var ok  = true;

        if (!cur) ok = fail('pwCurrent', 'Enter your current password');
        if (!nw) ok = fail('pwNew', 'Enter a new password') && ok;
        else if (passed(nw).length < RULES.length) ok = fail('pwNew', 'Meet all four requirements below') && ok;
        else if (nw === cur) ok = fail('pwNew', 'New password must differ from the current one') && ok;
        if (cf !== nw) ok = fail('pwConfirm', 'Passwords do not match') && ok;
        if (!ok) return;

        /* Demo: không có server nhận POST — lưu ngày đổi, cập nhật text, xoá trắng form.
           Production: bỏ preventDefault, form post lên server; PHP in lại trang với ngày mới. */
        YQ.profile.set({ passwordChangedAt: new Date().toISOString().slice(0, 10) });
        $form[0].reset();
        $form.find('.yq-input[type="text"]').attr('type', 'password');          // trả các ô đang "peek" về ẩn
        $form.find('[data-yq-peek]').removeClass('is-on').attr('aria-label', 'Show password');
        fillFacts();
        paintStrength();
        YQ.toast('Password updated');
      });

    fillFacts();
    paintStrength();
  };

  /* ======================================================================
     13. Invite friends (member/invite.html)
     ====================================================================== */
  YQ.initInvite = function () {
    // Toàn bộ markup (thẻ ưu đãi, link mời, nút chia sẻ, form, danh sách đã mời, trạng thái trống) là HTML tĩnh
    // trong member/invite.html — JS chỉ validate, copy link, mở cửa sổ chia sẻ, thêm/bỏ dòng và bật/tắt khối có sẵn.
    var R = YQ.referral || {};
    var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var $list = $('#invList');
    var $link = $('#invLink');
    var tpl = document.getElementById('invRowTpl');

    /* Link mời PHP in sẵn ở #invLink ({$ref_link}). Bản demo in link tương đối
       -> đổi sang tuyệt đối để dán đi đâu cũng chạy (link tuyệt đối thì giữ nguyên). */
    function link() { return String($link.val() || ''); }
    try { $link.val(new URL(link(), window.location.href).href); } catch (e) {}

    /* Đếm lại số lời mời + bật/tắt "chưa mời ai" theo số dòng đang có trong #invList. */
    function sync() {
      var n = $list.children('.yq-inv__row').length;
      $('#invCount').text(n);
      $list.prop('hidden', !n);
      $('#invNone').prop('hidden', !!n);
    }

    /* Thêm 1 dòng: clone khung template#invRowTpl rồi chỉ set text/attr (không ghép chuỗi HTML). */
    function addRow(email, iso) {
      var $row = $(tpl.content.querySelector('.yq-inv__row').cloneNode(true));
      $row.find('.yq-inv__who').text(email);
      $row.find('.yq-inv__when').text(YQ.dateLabel(iso));
      $row.find('[data-inv-rm]').attr({ 'data-inv-rm': email, 'aria-label': 'Remove ' + email });
      $list.prepend($row);
    }

    /* --- chia sẻ (URL Facebook/LINE ghép từ YQ.referral.channels + link đang in ở #invLink) --- */
    function shareUrl(c) {
      return String(c.url || '')
        .replace('{u}', encodeURIComponent(link()))
        .replace('{t}', encodeURIComponent(R.message || ''));
    }
    function mailtoUrl() {
      return 'mailto:?subject=' + encodeURIComponent('An invitation from Grand Hyatt Singapore') +
             '&body=' + encodeURIComponent((R.message || '') + '\n\n' + link());
    }
    function copyLink() {
      var el = document.getElementById('invLink');
      if (el) { el.focus(); el.select(); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link()).then(
          function () { YQ.toast('Invitation link copied'); },
          function () { YQ.toast('Press Ctrl/Cmd + C to copy the link'); }
        );
        return;
      }
      var done = false;
      try { done = document.execCommand('copy'); } catch (e) {}
      YQ.toast(done ? 'Invitation link copied' : 'Press Ctrl/Cmd + C to copy the link');
    }

    $(document)
      .on('click', '[data-inv-ch]', function () {
        var id = $(this).attr('data-inv-ch');
        var c = (R.channels || []).filter(function (x) { return x.id === id; })[0] ||
                { id: id, kind: id === 'copy' ? 'copy' : 'share' };

        if (c.kind === 'copy') { copyLink(); return; }
        if (c.kind === 'mail') { window.location.href = mailtoUrl(); return; }

        window.open(shareUrl(c), '_blank', 'noopener,width=640,height=560');
      })

      .on('submit', '#invForm', function (e) {
        e.preventDefault();
        var $ta = $('#invMails');
        $ta.removeClass('is-invalid');
        $('[data-err-for="invMails"]').removeClass('is-on').text('');

        var raw = String($ta.val() || '').split(/[\s,;]+/).filter(Boolean);
        if (!raw.length) {
          $ta.addClass('is-invalid');
          $('[data-err-for="invMails"]').text('Enter at least one email address').addClass('is-on');
          return;
        }
        var bad = raw.filter(function (m) { return !RE_MAIL.test(m); });
        if (bad.length) {
          $ta.addClass('is-invalid');
          $('[data-err-for="invMails"]').text('Not a valid address: ' + bad[0]).addClass('is-on');
          return;
        }

        // Production: form POST lên server ({$_BASE}/member/invite/?action=send), PHP in lại danh sách.
        // Bản demo: thêm dòng ngay trên trang (clone template), tải lại trang thì về dữ liệu mẫu.
        var today = new Date().toISOString().slice(0, 10);
        var already = $list.find('.yq-inv__who').map(function () { return $(this).text().toLowerCase(); }).get();
        var fresh = [];
        $.each(raw, function (_, m) {
          if (already.indexOf(m.toLowerCase()) > -1) return;   // đã mời rồi thì bỏ qua
          already.push(m.toLowerCase());
          fresh.push(m);
        });

        if (!fresh.length) { YQ.toast('Those friends were already invited'); return; }

        $.each(fresh.slice().reverse(), function (_, m) { addRow(m, today); });   // giữ đúng thứ tự gõ, mới nhất lên đầu
        $ta.val('');
        sync();
        YQ.toast(fresh.length + (fresh.length === 1 ? ' invitation sent' : ' invitations sent'));
      })

      /* Xoá lời mời — production gọi server xoá theo data-inv-rm ({$inv.id}); demo chỉ bỏ dòng khỏi trang. */
      .on('click', '[data-inv-rm]', function () {
        $(this).closest('.yq-inv__row').remove();
        sync();
      });

    sync();
  };

})(jQuery);
