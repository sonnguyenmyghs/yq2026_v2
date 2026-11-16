/* ==========================================================================
   Member Profile + Edit Profile — JS dùng chung cho bản demo VÀ production
     member/profile.html, member/profile-production.html            (trang xem, #profView)
     member/changeprofile.html, member/changeprofile-production.html (trang sửa, #pfForm)
   Viết an toàn cho engine template production:
     dùng jQuery thay cho ký hiệu tắt, không biến bắt đầu bằng ký hiệu đô la,
     không đặt cặp ngoặc nhọn trên cùng một dòng.
   JS KHÔNG dựng HTML — chỉ đổi text / class:
     Trang xem : tính chữ cái đầu, phần trăm hoàn thiện, gợi ý các ô còn trống.
     Trang sửa : đánh dấu ô lỗi server trả về (data-error), chọn sẵn select theo input ẩn hd_*,
                 kiểm tra ô bắt buộc + email trước khi POST, chống bấm Save hai lần.
   Bản demo chặn POST bằng cách nghe sự kiện "yqpf:valid" trên form rồi gọi preventDefault.
   ========================================================================== */
(function (jq) {
  'use strict';

  var RE_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@][^\s@]+/;

  function isMail(v) {
    var m = v.match(RE_MAIL);
    return !!m && m[0] === v;
  }

  function clean(s) {
    return jq.trim(String(s == null ? '' : s));
  }

  /** Chữ cái đầu của từ đầu và từ cuối, viết hoa. */
  function initialsOf(name) {
    var parts = clean(name).split(/\s+/);
    var first = parts[0] || '';
    var last = parts.length > 1 ? parts[parts.length - 1] : '';
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || '?';
  }

  /* ---------------------------------------------------------------------
     Trang xem
     --------------------------------------------------------------------- */
  function initView(view) {
    var name = clean(jq('#profName').text());
    jq('#profInitials').text(initialsOf(name));

    /* Chỉ đếm các hàng chính — hàng thêm của backend (.profile-single) không tính. */
    var rows = view.find('.yq-prof__group .yq-prof__row');
    var missing = [];
    rows.each(function () {
      var row = jq(this);
      if (!clean(row.find('.yq-prof__value').text())) {
        missing.push(clean(row.find('.yq-prof__label').text()));
      }
    });

    var total = rows.length;
    var pct = total ? Math.round((total - missing.length) / total * 100) : 100;
    jq('#profPct').text(pct + '%');
    jq('#profBar').css('width', pct + '%');

    var hint = 'Everything is filled in — thank you.';
    if (missing.length) {
      hint = missing.length + (missing.length === 1 ? ' field left: ' : ' fields left: ') +
        missing.slice(0, 3).join(', ') + (missing.length > 3 ? '…' : '');
    }
    jq('#profHint').text(hint);
  }

  /* ---------------------------------------------------------------------
     Trang sửa
     --------------------------------------------------------------------- */
  function fieldOf(el) {
    return jq(el).closest('.yq-pf__field');
  }

  function showError(field, msg) {
    field.addClass('is-invalid');
    field.find('.yq-input').addClass('is-invalid');
    field.find('.yq-error').text(msg).addClass('is-on');
  }

  function clearError(field) {
    field.removeClass('is-invalid');
    field.find('.yq-input').removeClass('is-invalid');
    field.find('.yq-error').removeClass('is-on').text('');
  }

  /** Ô bắt buộc = nhãn có dấu sao (backend in qua star_error) hoặc field có data-required. */
  function isRequired(field) {
    if (field.is('[data-required]')) return true;
    return clean(field.find('.yq-pf__label').first().text()).indexOf('*') > -1;
  }

  function isEmpty(field) {
    var radios = field.find('input[type="radio"]');
    if (radios.length) return !radios.filter(':checked').length;
    var empty = false;
    field.find('input:not([type="hidden"]):not([type="checkbox"]), select').each(function () {
      var v = clean(jq(this).val());
      if (!v || v === '-1') empty = true;
    });
    return empty;
  }

  function scrollToField(field) {
    var opts = new Object();
    opts.scrollTop = Math.max(0, field.offset().top - 140);
    jq('html, body').stop().animate(opts, 300);
  }

  /** Lỗi server: container có data-error = key bị lỗi (vd idcard, email, birthday). */
  function markServerError(form) {
    var box = form.closest('.changeprofile__page__container');
    var key = clean(box.attr('data-error'));
    if (!key) return;

    var target = key === 'birthday'
      ? form.find('[name="birthday_date"]')
      : form.find('[name="profile[' + key + ']"]');
    if (!target.length) return;

    var field = fieldOf(target.first());
    showError(field, 'Please check this field.');
    scrollToField(field);
  }

  /** Select chưa có option selected thì chọn theo input ẩn hd_* (giống template cũ). */
  function syncHidden(selectId, hiddenId) {
    var sel = jq('#' + selectId);
    var want = clean(jq('#' + hiddenId).val());
    if (!sel.length || !want || clean(sel.val())) return;
    if (sel.find('option[value="' + want.replace(/"/g, '') + '"]').length) sel.val(want);
  }

  function validate(form) {
    var bad = null;
    form.find('.yq-pf__field').each(function () {
      var field = jq(this);
      clearError(field);
      if (isRequired(field) && isEmpty(field)) {
        showError(field, 'This field is required.');
        bad = bad || field;
        return;
      }
      var mail = field.find('input[type="email"]');
      if (mail.length && clean(mail.val()) && !isMail(clean(mail.val()))) {
        showError(field, 'Enter a valid email address.');
        bad = bad || field;
      }
    });
    return bad;
  }

  /** Thẻ trái cập nhật tên + chữ cái đầu khi gõ. */
  function syncCard(form) {
    var first = clean(form.find('[name="profile[firstname]"]').val());
    var last = clean(form.find('[name="profile[lastname]"]').val());
    var name = clean(first + ' ' + last);
    if (!name) return;
    jq('#profName').text(name);
    jq('#profInitials').text(initialsOf(name));
  }

  function initEdit(form) {
    syncHidden('nationality', 'hd_nationality');
    syncHidden('country', 'hd_country');
    markServerError(form);
    syncCard(form);

    form.on('input change', 'input, select', function () {
      clearError(fieldOf(this));
    });
    form.on('input', '[name="profile[firstname]"], [name="profile[lastname]"]', function () {
      syncCard(form);
    });

    form.on('submit', function (e) {
      var bad = validate(form);
      if (bad) {
        e.preventDefault();
        scrollToField(bad);
        bad.find('input:not([type="hidden"]), select').first().trigger('focus');
        return;
      }
      var ev = jq.Event('yqpf:valid');
      form.trigger(ev);
      if (ev.isDefaultPrevented()) {
        e.preventDefault();
        return;
      }
      form.find('.yq-pf__save').addClass('is-busy').text('Saving…');
    });
  }

  jq(function () {
    var view = jq('#profView');
    if (view.length) initView(view);
    var form = jq('#pfForm');
    if (form.length) initEdit(form);
  });
})(jQuery);
