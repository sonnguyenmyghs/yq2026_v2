/* ==========================================================================
   Change Password — JS PRODUCTION cho member/password-production.html
   Ô giữ id / name của template cũ: pass_current, pass_new, pass_confirm
   (changepass[old], changepass[new], changepass[retype]).
   JS KHÔNG dựng HTML, KHÔNG in dữ liệu mẫu — chỉ:
     - lấy email ở header (#yqAcctMail) đổ vào #pwEmail, trống thì để ẩn dòng
     - tô thanh sức mạnh #pwMeter + text #pwLevel, bật is-on cho #pwRules li đạt
     - kiểm tra form; sai thì chặn submit và hiện lỗi, đúng thì để form POST lên server
   Hiện / ẩn mật khẩu do account-production.js lo (data-yq-peek).
   Viết an toàn cho engine template: jQuery thay ký hiệu tắt, không biến bắt đầu bằng
   ký hiệu đô la, không đặt cặp ngoặc nhọn trên cùng một dòng.
   ========================================================================== */
(function (jq) {
  'use strict';

  var RULES = [
    ['len', function (v)
    {
      return v.length >= 8;
    }],
    ['case', function (v)
    {
      return /[a-z]/.test(v) && /[A-Z]/.test(v);
    }],
    ['digit', function (v)
    {
      return /[0-9]/.test(v);
    }],
    ['sym', function (v)
    {
      return /[^A-Za-z0-9]/.test(v);
    }]
  ];
  var LEVELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

  function passedIds(v)
  {
    var ids = [];
    for (var i = 0; i < RULES.length; i++)
    {
      if (RULES[i][1](v)) ids.push(RULES[i][0]);
    }
    return ids;
  }

  function paintStrength()
  {
    var v = jq('#pass_new').val() || '';
    var ids = passedIds(v);
    var score = v ? ids.length : 0;
    jq('#pwMeter').attr('data-score', score);
    jq('#pwLevel').text(LEVELS[score]);
    jq('#pwRules li').each(function ()
    {
      jq(this).toggleClass('is-on', ids.indexOf(jq(this).attr('data-rule')) > -1);
    });
  }

  function fail(id, msg)
  {
    jq('#' + id).addClass('is-invalid');
    jq('[data-err-for="' + id + '"]').text(msg).addClass('is-on');
    return false;
  }

  function fillEmail()
  {
    var mail = jq.trim(jq('#yqAcctMail').first().text() || '');
    if (mail)
    {
      jq('#pwEmail').text(mail);
      jq('#pwEmailRow').removeAttr('hidden');
    }
  }

  jq(function ()
  {
    var form = jq('#pwForm');
    if (!form.length) return;

    form
      .on('input', '#pass_new', paintStrength)
      .on('input', '.yq-input', function ()
      {
        jq(this).removeClass('is-invalid');
        jq('[data-err-for="' + this.id + '"]').removeClass('is-on').text('');
      })
      .on('submit', function (e)
      {
        form.find('.yq-input').removeClass('is-invalid');
        form.find('.yq-error').removeClass('is-on').text('');

        var cur = jq('#pass_current').val() || '';
        var nw = jq('#pass_new').val() || '';
        var cf = jq('#pass_confirm').val() || '';
        var ok = true;

        if (!cur) ok = fail('pass_current', 'Enter your current password');
        if (!nw) ok = fail('pass_new', 'Enter a new password') && ok;
        else if (passedIds(nw).length < RULES.length) ok = fail('pass_new', 'Meet all four requirements below') && ok;
        else if (nw === cur) ok = fail('pass_new', 'New password must differ from the current one') && ok;
        if (cf !== nw) ok = fail('pass_confirm', 'Passwords do not match') && ok;

        if (!ok)
        {
          e.preventDefault();
          return;
        }
        /* Hợp lệ: để form POST, khoá nút chống bấm hai lần */
        form.find('[type="submit"]').prop('disabled', true).addClass('is-busy');
      });

    fillEmail();
    paintStrength();
  });
})(jQuery);
