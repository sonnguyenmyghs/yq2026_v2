/*
  YQEmail — ráp email voucher + e-card trên trình duyệt (dùng chung cho email/preview.html và checkout "Preview full email").
  Không cần jQuery, không build. Cách ráp giống backend: chọn email/parts/card-<layout>.html, thay %biến%,
  chèn vào %gift_card% của email/voucher-gift.html rồi thay biến của khung. Chi tiết biến: email/README.md.

  API:
    YQEmail.build(vars, opts) -> Promise<string>   tài liệu HTML đầy đủ cho iframe.srcdoc
      opts.layout   'classic' | 'overlay' | 'split' | 'minimal' | 'none'   (mặc định 'classic')
      opts.base     URL thư mục email/ (kết thúc bằng '/'); mặc định suy từ src của chính file này
      opts.endpoint URL tuỳ chọn: có thì POST vars (+ layout) dạng form, server trả HTML email thật
      opts.client   'normal' | 'gmail' | 'nobg'  — giả lập email client (xem simulate)
      opts.emulateCrop true: cắt ảnh trên trình duyệt giống backend (overlay 592x460 @1x vì thuộc tính background
                    không co giãn; split 416x600 = @2x của 208x300) cho card_banner_overlay / card_banner_split;
                    bỏ qua khi có endpoint (backend tự cắt)
    YQEmail.crop(url, w, h) -> Promise<string>  data URL JPEG cắt kiểu cover, canh giữa; lỗi -> trả lại url gốc
    YQEmail.simulate(html, client) -> string
    YQEmail.fill(template, vars) -> string        xoá comment HTML (kể cả khối MSO), thay %tên%

  vars: chữ thường (module tự escape &<>"):  recipient_name sender_name gift_message card_bg card_banner
        card_banner_overlay card_banner_split gift_url redeem_date product_name redeem_expiry voucher preheader
        (gift_message: thêm xuống dòng -> <br>)
        HTML thô (đuôi _html, chèn nguyên): qr_code_html -> %qr_code%, product_description_html -> %product_description%
  Email không có video (banner chỉ là ảnh) — không còn %card_video_cta% / card_video_cta_html.
  Biến đã biết mà thiếu -> chuỗi rỗng. %token% lạ (không có trong danh sách) để nguyên để dễ thấy lỗi template.
*/
(function (w) {
  'use strict';

  var TEXT = ['recipient_name', 'sender_name', 'gift_message', 'card_bg', 'card_banner', 'card_banner_overlay', 'card_banner_split', 'gift_url',
    'redeem_date', 'product_name', 'redeem_expiry', 'voucher', 'preheader'];
  var HTML = ['qr_code', 'product_description'];
  var LAYOUTS = ['classic', 'overlay', 'split', 'minimal', 'none'];

  // Thư mục email/ suy từ src của script: …/assets/js/modules/voucher/email-render.js -> …/email/
  var me = document.currentScript && document.currentScript.src;
  var DEFAULT_BASE = me ? new URL('../../../../email/', me).href : new URL('email/', location.href).href;

  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };

  // Chuẩn hoá vars người gọi -> map %tên% đã an toàn để chèn
  var prepare = function (vars) {
    vars = vars || {};
    var out = {};
    TEXT.forEach(function (k) { out[k] = esc(vars[k]); });
    out.gift_message = out.gift_message.replace(/\r?\n/g, '<br>');
    HTML.forEach(function (k) { out[k] = vars[k + '_html'] == null ? '' : String(vars[k + '_html']); });
    return out;
  };

  // Xoá comment (tài liệu + khối <!--[if mso]>…<![endif]-->), thay %tên% một lượt (giá trị chèn vào không bị quét lại)
  var fill = function (template, vars) {
    vars = vars || {};
    return String(template).replace(/<!--[\s\S]*?-->/g, '').replace(/%([a-z_]+)%/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m;
    });
  };

  /* Giả lập email client (theo caniemail):
     gmail: Gmail web xoá CẢ thuộc tính style nếu có url()
     nobg : Outlook Windows (Word) / Gmail với tài khoản không phải Google — không có ảnh nền (thuộc tính background + CSS url()) */
  var simulate = function (html, client) {
    if (client !== 'gmail' && client !== 'nobg') return html;
    var full = /<html[\s>]/i.test(html);
    var doc = new DOMParser().parseFromString(full ? html : '<div id="yqEmailRoot">' + html + '</div>', 'text/html');
    doc.querySelectorAll('[style]').forEach(function (el) {
      var st = el.getAttribute('style');
      if (st.indexOf('url(') < 0) return;
      if (client === 'gmail') el.removeAttribute('style');
      else el.setAttribute('style', st.replace(/background:\s*([^;]*?)url\([^)]*\)[^;]*;?/g, 'background-color:$1;').replace(/background-image:[^;]*;?/g, ''));
    });
    if (client === 'nobg') doc.querySelectorAll('[background]').forEach(function (el) { el.removeAttribute('background'); });
    return full ? '<!DOCTYPE html>' + doc.documentElement.outerHTML : doc.getElementById('yqEmailRoot').innerHTML;
  };

  var cache = {};
  var get = function (url) {
    if (!cache[url]) {
      cache[url] = fetch(url).then(function (r) {
        if (!r.ok) throw new Error('Cannot load ' + url + ' (' + r.status + ')');
        return r.text();
      });
      cache[url].catch(function () { delete cache[url]; }); // lỗi thì lần sau tải lại
    }
    return cache[url];
  };

  var wrap = function (body, base) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<base href="' + esc(base) + '"></head><body style="margin:0;">' + body + '</body></html>';
  };

  /* Cắt ảnh kiểu "cover" canh giữa ra data URL (giả lập bước backend cắt sẵn ảnh cho email) */
  var crop = function (url, cw, ch) {
    return new Promise(function (resolve) {
      if (!url) { resolve(url); return; }
      var im = new Image();
      if (!/^(blob|data):/.test(url)) im.crossOrigin = 'anonymous';
      im.onload = function () {
        try {
          var c = document.createElement('canvas'); c.width = cw; c.height = ch;
          var s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
          var w2 = im.naturalWidth * s, h2 = im.naturalHeight * s;
          c.getContext('2d').drawImage(im, (cw - w2) / 2, (ch - h2) / 2, w2, h2);
          resolve(c.toDataURL('image/jpeg', 0.85));
        } catch (e) { resolve(url); }   // ảnh khác domain không CORS -> dùng ảnh gốc
      };
      im.onerror = function () { resolve(url); };
      im.src = url;
    });
  };
  var CROPS = { card_banner_overlay: [592, 460], card_banner_split: [416, 600] };   // overlay 1x (thuộc tính background không co giãn) / split @2x của 208x300

  var build = function (vars, opts) {
    opts = opts || {};
    if (opts.emulateCrop && !opts.endpoint) {
      var o2 = {}; for (var k0 in opts) o2[k0] = opts[k0]; o2.emulateCrop = false;
      var v2 = {}; for (var k1 in vars || {}) v2[k1] = vars[k1];
      var jobs = Object.keys(CROPS).filter(function (k) { return v2[k]; }).map(function (k) {
        return crop(v2[k], CROPS[k][0], CROPS[k][1]).then(function (u) { v2[k] = u; });
      });
      return Promise.all(jobs).then(function () { return build(v2, o2); });
    }
    var layout = LAYOUTS.indexOf(opts.layout) >= 0 ? opts.layout : 'classic';
    var base = new URL(opts.base || DEFAULT_BASE, location.href).href;
    var client = opts.client || 'normal';

    // Backend render email thật (mã voucher / QR mẫu)
    if (opts.endpoint) {
      var body = new URLSearchParams();
      Object.keys(vars || {}).forEach(function (k) { if (vars[k] != null) body.append(k, vars[k]); });
      body.set('layout', layout);
      return fetch(opts.endpoint, { method: 'POST', body: body, credentials: 'same-origin' }).then(function (r) {
        if (!r.ok) throw new Error('Preview endpoint ' + r.status);
        return r.text();
      }).then(function (html) {
        if (!/<html[\s>]/i.test(html)) html = wrap(html, base);
        return simulate(html, client);
      });
    }

    var v = prepare(vars);
    return Promise.all([get(base + 'voucher-gift.html'), get(base + 'parts/card-' + layout + '.html')]).then(function (r) {
      v.gift_card = fill(r[1], v);
      return wrap(simulate(fill(r[0], v), client), base);
    });
  };

  w.YQEmail = { build: build, simulate: simulate, fill: fill, crop: crop };
})(window);
