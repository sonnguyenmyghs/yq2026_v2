/* ==========================================================================
   personalise.js — trang Personalise (personalise.html)
   - Cách gửi voucher: To me / One recipient / Different recipients (mỗi voucher 1 người, tối đa 10)
   - Thiệp cá nhân TUỲ CHỌN: banner ảnh hoặc video (mẫu có sẵn / tự tải lên), màu thương hiệu, lời nhắn
   - Xem trước thiệp + email voucher (thiệp tự đính kèm)
   Markup là HTML tĩnh: JS chỉ đổi class / hidden / disabled / value / text / src.
   Dữ liệu từng người nhận lưu thẳng trong fieldset [data-pe-slot="n"] của #yqPeForm.
   ========================================================================== */
(function ($) {
  'use strict';

  var MAX = 10;                       // tối đa 10 thiệp / người nhận mỗi đơn
  var MAX_FILE = 20 * 1024 * 1024;    // 20MB cho banner tự tải lên
  var FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  YQ.initPersonalise = function () {
    var $form = $('#yqPeForm');
    if (!$form.length) return;
    var $exp = $('#yqPeExp');

    /* Demo: PHP đã in đúng voucher theo ?exp=. Bản tĩnh chỉ đổi text/src cho khớp. */
    var demo = YQ.experience && YQ.experience(YQ.param('exp'));
    if (demo && demo.id !== $exp.attr('data-exp-id')) {
      $exp.attr({ 'data-exp-id': demo.id, 'data-exp-price': demo.price, 'data-exp-tone': demo.tone });
      $exp.find('.yq-pe-exp__img img').attr({ src: demo.img, alt: demo.name });
      $exp.find('.yq-pe-exp__name').text(demo.name);
      $exp.find('.yq-pe-exp__meta').text(demo.duration + ' · ' + demo.place);
      $exp.find('.yq-pe-exp__price').text(YQ.money0(demo.price));
    }

    var exp = {
      id: $exp.attr('data-exp-id'),
      price: parseFloat($exp.attr('data-exp-price')) || 0,
      tone: parseInt($exp.attr('data-exp-tone'), 10) || 3,
      name: $.trim($exp.find('.yq-pe-exp__name').text()),
      label: $.trim($exp.find('.yq-pe-exp__meta').text())
    };

    var active = 1;      // người nhận đang sửa
    var view = 'card';   // tab xem trước

    /* ---------- trạng thái chung ---------- */
    function qty()     { return Math.min(MAX, Math.max(1, parseInt($('#yqPeQty').val(), 10) || 1)); }
    function mode()    { return $('#yqPeMode').val(); }
    function hasCard() { return $('#yqPeAddCard').val() === '1'; }
    function count()   { return mode() === 'many' ? qty() : 1; }

    /* ---------- đọc / ghi dữ liệu 1 người nhận ---------- */
    function $slot(n) { return $form.find('[data-pe-slot="' + n + '"]'); }
    function $in(n, key) { return $slot(n).find('[name="cards[' + n + '][' + key + ']"]'); }
    function get(n, key) { return $.trim($in(n, key).val() || ''); }
    function set(n, key, v) { $in(n, key).val(v); }

    /** Nguồn media banner của người nhận n: { type, src, poster } */
    function media(n) {
      var id = get(n, 'banner');
      if (id === 'upload') {
        var up = $slot(n).data('pe-upload');
        if (up) return { type: up.type, src: up.url, poster: '' };
      }
      var $b = $('#yqPeBanners [data-banner="' + id + '"]');
      if (!$b.length || id === 'upload') $b = $('#yqPeBanners [data-banner]').first();
      return { type: $b.attr('data-type'), src: $b.attr('data-src'), poster: $b.attr('data-poster') || '' };
    }

    function play(v) { try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }

    function first(name) { return (name || '').split(/\s+/)[0]; }

    function isValid(n) {
      if (mode() === 'me') return true;
      return !!get(n, 'rcp_name') && EMAIL_RE.test(get(n, 'rcp_email'));
    }

    /* ---------- nạp người nhận n vào bộ ô nhập ---------- */
    function load(n) {
      active = n;
      $('#yqPeRcps [data-pe-rcp]').each(function () {
        var on = +$(this).attr('data-pe-rcp') === n;
        $(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false');
      });
      $('[data-pe-field]').each(function () {
        $(this).val(get(n, $(this).attr('data-pe-field'))).removeClass('is-invalid');
      });
      $('[data-pe-err]').removeClass('is-on');
      $('#yqPeCounter').text($('#yqPeMsg').val().length + ' / 200 characters');

      var banner = get(n, 'banner');
      $('#yqPeBanners [data-banner]').each(function () {
        $(this).toggleClass('is-active', $(this).attr('data-banner') === banner);
      });
      var up = $slot(n).data('pe-upload');
      var $up = $('#yqPeUploadBtn');
      $up.toggleClass('has-file', !!up);
      $up.find('img').attr('src', up && up.type === 'image' ? up.url : '').prop('hidden', !(up && up.type === 'image'));
      $up.find('.yq-pe-banner__name').text(up ? (up.type === 'video' ? 'Your video' : 'Your photo') : 'Upload your own');
      $('#yqPeUploadErr').removeClass('is-on');

      var colour = get(n, 'colour');
      $('#yqPeSwatches [data-colour]').each(function () {
        var on = $(this).attr('data-colour') === colour;
        $(this).toggleClass('is-active', on).attr('aria-checked', on ? 'true' : 'false');
      });
      paint();
    }

    /* ---------- bố cục theo số lượng / cách gửi / có thiệp ---------- */
    function layout() {
      var q = qty(), m = mode(), card = hasCard();
      $('#yqPeQty').val(q);

      var $many = $('[data-pe-mode="many"]');
      $many.prop('disabled', q < 2);
      $('#yqPeManyHint').text(q < 2 ? 'Buy 2+ vouchers to split' : 'One voucher per person');
      if (m === 'many' && q < 2) { setMode('one'); return; }

      var c = count();
      if (active > c) active = 1;
      $('#yqPeRcps [data-pe-rcp]').each(function () {
        $(this).prop('hidden', +$(this).attr('data-pe-rcp') > c);
      });
      $('#yqPeRcps').prop('hidden', c < 2);
      for (var n = 1; n <= MAX; n++) $slot(n).prop('disabled', n > c);

      $('#yqPeEditor').prop('hidden', m === 'me' && !card);
      $('#yqPeRcpFields .col-sm-6').last().prop('hidden', m === 'me');
      $('#yqPeNameLbl').html(m === 'me' ? 'Name on card <span class="yq-muted">(optional)</span>' : 'Recipient name <span class="yq-pe-req">*</span>');
      $('#yqPeCardFields').prop('hidden', !card);
      $('#yqPeApplyAll').prop('hidden', !(card && c > 1));

      $('#yqPeEditorTitle').text(card ? (m === 'me' ? 'Your card' : (c > 1 ? 'Recipients & cards' : 'Recipient & card')) : (c > 1 ? 'Recipients' : 'Recipient'));
      $('#yqPeEditorSub').text(c > 1
        ? 'Select each card above to fill in its recipient' + (card ? ', design and message.' : '.')
        : (card ? 'Fill in the card — the preview updates as you type.' : 'We’ll email the voucher straight to them.'));

      $('#yqPeTabCard').prop('hidden', !card);
      if (!card && view === 'card') showView('mail');

      // Tổng tiền
      $('#yqPeLineLbl').text(q + ' × ' + exp.name);
      $('#yqPeLineVal, #yqPeTotal').text(YQ.money(q * exp.price));
      $('#yqPeCardsRow').toggle(card);
      $('#yqPeCardsLbl').text(c + ' personalised card' + (c > 1 ? 's' : ''));
      $('#yqPeSendLbl').text(m === 'me' ? 'Email to you' : (m === 'many' ? 'Email to ' + q + ' recipients' : 'Email to 1 recipient'));

      refreshChips();
      load(active);
    }

    function setMode(m) {
      $('#yqPeMode').val(m);
      $('[data-pe-mode]').each(function () {
        var on = $(this).attr('data-pe-mode') === m;
        $(this).toggleClass('is-active', on).attr('aria-checked', on ? 'true' : 'false');
      });
      $('#yqPeRcps [data-pe-rcp]').removeClass('is-error');
      $('#yqPeFormErr').removeClass('is-on');
      layout();
    }

    function setCard(on) {
      $('#yqPeAddCard').val(on ? '1' : '0');
      $('[data-pe-card]').each(function () {
        var a = $(this).attr('data-pe-card') === (on ? '1' : '0');
        $(this).toggleClass('is-active', a).attr('aria-checked', a ? 'true' : 'false');
      });
      if (on) showView('card');
      layout();
    }

    function showView(v) {
      view = v;
      $('[data-pe-view]').each(function () {
        var on = $(this).attr('data-pe-view') === v;
        $(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false');
      });
      $('[data-pe-pane]').each(function () { $(this).prop('hidden', $(this).attr('data-pe-pane') !== v); });
      var vid = document.getElementById('yqPeCardVideo');
      if (vid && v === 'card' && !vid.hidden) { play(vid); }
    }

    function refreshChips() {
      $('#yqPeRcps [data-pe-rcp]').each(function () {
        var n = +$(this).attr('data-pe-rcp');
        var name = get(n, 'rcp_name');
        $(this).find('.yq-pe-rcp__name').text(name || 'Recipient');
        $(this).toggleClass('is-done', isValid(n) && !!name);
        if (isValid(n)) $(this).removeClass('is-error');
      });
    }

    /* ---------- xem trước thiệp + email ---------- */
    function paint() {
      var n = active, m = mode(), card = hasCard(), c = count();
      var name = get(n, 'rcp_name'), email = get(n, 'rcp_email');
      var msg = get(n, 'message'), from = get(n, 'from_name');
      var per = m === 'many' ? 1 : qty();
      var md = media(n);

      // Thiệp
      $('#yqPeCard').attr('class', 'yq-pe-card yq-pe-card--' + (get(n, 'colour') || 'gold'));
      var vid = document.getElementById('yqPeCardVideo');
      var $img = $('#yqPeCardImg');
      if (md.type === 'video') {
        if (vid.getAttribute('src') !== md.src) { vid.setAttribute('src', md.src); vid.setAttribute('poster', md.poster); }
        vid.hidden = false; $img.prop('hidden', true);
        play(vid);
      } else {
        try { vid.pause(); } catch (e) {}
        vid.hidden = true;
        $img.attr('src', md.src).prop('hidden', false);
      }
      $('#yqPeVideoNote').prop('hidden', md.type !== 'video');
      $('#yqPeCardTo').text('Dear ' + (name || (m === 'me' ? 'Friend' : 'Recipient')) + ',');
      $('#yqPeCardMsg').text(msg || 'Your message will appear here.').toggleClass('is-empty', !msg);
      $('#yqPeCardFrom').text('— ' + (from || 'Your name'));
      $('#yqPeCardGift').text(exp.name);
      $('#yqPeCardCount').text(per + ' voucher' + (per > 1 ? 's' : ''));

      // Email
      $('#yqPeMailTo').text(m === 'me' ? 'Your email (from checkout)' : (email || 'recipient@example.com'));
      $('#yqPeMailSubj').text(m === 'me' ? 'Your vouchers from The Shop are ready'
        : (card && from ? from + ' sent you a gift from The Shop' : 'You’ve received a gift from The Shop'));
      $('#yqPeMailHi').text(m === 'me' ? 'Hi there,' : 'Hi ' + (first(name) || 'there') + ',');
      $('#yqPeMailLead').text(m === 'me'
        ? 'Thank you for your order. Your vouchers are ready to share.'
        : (from && card ? from : 'Someone special') + ' has sent you a gift from The Shop at Grand Hyatt Singapore.');
      $('#yqPeMailExp').text(exp.name);
      $('#yqPeMailQty').text(per + ' × voucher');
      $('#yqPeMailAtt').prop('hidden', !card);
      var thumb = md.type === 'video' ? md.poster : md.src;
      $('#yqPeMailThumb').attr('src', thumb || '').prop('hidden', !thumb);
      $('#yqPeMailFile').text('Personalised-card-' + (first(name) || ('card-' + n)).replace(/[^\w-]/g, '') + '.pdf');

      $('#yqPeViewFor').text(c > 1 ? 'Card ' + n + ' of ' + c : '');
    }

    /* ---------- sự kiện ---------- */
    $(document).on('click', '[data-pe-qty]', function () {
      $('#yqPeQty').val(qty() + parseInt($(this).attr('data-pe-qty'), 10));
      layout();
    });
    $(document).on('change', '#yqPeQty', layout);

    $(document).on('click', '[data-pe-mode]', function () {
      if (!$(this).prop('disabled')) setMode($(this).attr('data-pe-mode'));
    });
    $(document).on('click', '[data-pe-card]', function () { setCard($(this).attr('data-pe-card') === '1'); });
    $(document).on('click', '[data-pe-view]', function () { showView($(this).attr('data-pe-view')); });
    $(document).on('click', '#yqPeRcps [data-pe-rcp]', function () { load(+$(this).attr('data-pe-rcp')); });

    $(document).on('input', '[data-pe-field]', function () {
      var key = $(this).attr('data-pe-field');
      set(active, key, $(this).val());
      if (key === 'message') $('#yqPeCounter').text(this.value.length + ' / 200 characters');
      $(this).removeClass('is-invalid');
      $('[data-pe-err="' + key + '"]').removeClass('is-on');
      refreshChips();
      paint();
    });

    // Banner mẫu
    $(document).on('click', '#yqPeBanners [data-banner]:not(#yqPeUploadBtn)', function () {
      set(active, 'banner', $(this).attr('data-banner'));
      set(active, 'banner_type', $(this).attr('data-type'));
      load(active);
    });

    // Tự tải banner: đã có file mà chưa chọn → chọn lại; còn lại mở hộp chọn file của người nhận đang sửa
    $(document).on('click', '#yqPeUploadBtn', function () {
      var up = $slot(active).data('pe-upload');
      if (up && get(active, 'banner') !== 'upload') {
        set(active, 'banner', 'upload'); set(active, 'banner_type', up.type); load(active);
        return;
      }
      $in(active, 'banner_file').trigger('click');
    });

    $form.on('change', 'input[type="file"]', function () {
      var n = +$(this).closest('[data-pe-slot]').attr('data-pe-slot');
      var f = this.files && this.files[0];
      if (!f) return;
      if (FILE_TYPES.indexOf(f.type) < 0 || f.size > MAX_FILE) {
        this.value = '';
        $('#yqPeUploadErr').addClass('is-on');
        return;
      }
      var $s = $slot(n), old = $s.data('pe-upload');
      if (old && !isShared(old.url, n)) URL.revokeObjectURL(old.url);
      var type = f.type.indexOf('video/') === 0 ? 'video' : 'image';
      $s.data('pe-upload', { url: URL.createObjectURL(f), type: type });
      set(n, 'banner', 'upload');
      set(n, 'banner_type', type);
      load(n);
    });

    function isShared(url, except) {
      for (var i = 1; i <= MAX; i++) {
        var u = i !== except && $slot(i).data('pe-upload');
        if (u && u.url === url) return true;
      }
      return false;
    }

    $(document).on('click', '#yqPeSwatches [data-colour]', function () {
      set(active, 'colour', $(this).attr('data-colour'));
      load(active);
    });

    // Dùng banner / màu / lời nhắn / người gửi của thiệp đang sửa cho mọi thiệp
    $(document).on('click', '#yqPeApplyAll', function () {
      var c = count(), keys = ['banner', 'banner_type', 'colour', 'message', 'from_name'];
      var up = $slot(active).data('pe-upload');
      var file = $in(active, 'banner_file')[0].files[0];
      for (var n = 1; n <= c; n++) {
        if (n === active) continue;
        keys.forEach(function (k) { set(n, k, get(active, k)); });
        if (up && file) {
          try {
            var dt = new DataTransfer(); dt.items.add(file);
            $in(n, 'banner_file')[0].files = dt.files;
            $slot(n).data('pe-upload', up);
          } catch (e) { set(n, 'banner', 'celebrate'); set(n, 'banner_type', 'video'); }
        }
      }
      refreshChips();
      YQ.toast && YQ.toast('Design applied to all ' + c + ' cards');
    });

    /* ---------- tiếp tục sang thanh toán ---------- */
    $form.on('submit', function (e) {
      var c = count(), bad = [];
      for (var n = 1; n <= c; n++) if (!isValid(n)) bad.push(n);
      $('#yqPeRcps [data-pe-rcp]').each(function () {
        $(this).toggleClass('is-error', bad.indexOf(+$(this).attr('data-pe-rcp')) > -1);
      });

      if (bad.length) {
        e.preventDefault();
        load(bad[0]);
        if (!get(bad[0], 'rcp_name')) { $('#yqPeName').addClass('is-invalid'); $('[data-pe-err="rcp_name"]').addClass('is-on'); }
        if (!EMAIL_RE.test(get(bad[0], 'rcp_email'))) { $('#yqPeEmail').addClass('is-invalid'); $('[data-pe-err="rcp_email"]').addClass('is-on'); }
        $('#yqPeFormErr').toggleClass('is-on', c > 1);
        var top = $('#yqPeEditor').offset().top - 130;
        $('html, body').animate({ scrollTop: top }, 380);
        return;
      }
      $('#yqPeFormErr').removeClass('is-on');

      // Bản demo tĩnh (form có data-yq-demo): lưu vào giỏ localStorage rồi sang checkout.
      // Production: bỏ data-yq-demo để form POST thẳng lên server.
      if ($form.is('[data-yq-demo]')) {
        e.preventDefault();
        var card = hasCard(), cards = [];
        for (var i = 1; i <= c; i++) {
          cards.push({
            to: get(i, 'rcp_name'), email: get(i, 'rcp_email'),
            banner: get(i, 'banner'), bannerType: get(i, 'banner_type'), colour: get(i, 'colour'),
            message: card ? get(i, 'message') : '', from: card ? get(i, 'from_name') : ''
          });
        }
        YQ.cart.add(
          { id: exp.id, name: exp.name, tone: exp.tone, price: exp.price, catLabel: 'Experience' },
          { id: (card ? 'card' : 'plain') + '-' + mode() + '-' + Date.now().toString(36), label: exp.label, price: exp.price },
          qty(),
          {
            addonFee: 0,
            addonLabel: card ? (c + ' personalised card' + (c > 1 ? 's' : '')) : '',
            sendMode: mode(),
            giftTo: cards[0].to, giftFrom: cards[0].from, giftMsg: cards[0].message,
            recipients: cards
          }
        );
        YQ.toast && YQ.toast(card ? 'Gift personalised and added to cart' : 'Added to cart', 'Review & pay', 'checkout.html');
        setTimeout(function () { window.location.href = 'checkout.html'; }, 700);
      }
    });

    layout();
    if (YQ.initReveal) YQ.initReveal();
  };
})(jQuery);
