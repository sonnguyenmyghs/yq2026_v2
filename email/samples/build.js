#!/usr/bin/env node
/*
  Tạo email mẫu tĩnh (đã thay hết %biến%) để review: node email/samples/build.js
  Không cần thư viện. Ráp GIỐNG backend (xem email/README.md "Cách ráp"):
    1. Xoá comment tài liệu nhưng GIỮ khối Outlook <!--[if mso]> / <!--[if gte mso 9]> … <![endif]-->
    2. Thay biến của khối thiệp (parts/card-<layout>.html) -> HTML thiệp
    3. Thay biến của khung (voucher-gift.html), %gift_card% = HTML thiệp
    Thay MỘT lượt (giá trị đã chèn không bị quét lại). Biến chữ escape & < > " ; %gift_message% thêm <br>.
  Ảnh dùng đường dẫn tương đối ../../assets/img/... để xem trên máy; gửi thử thật phải là URL https tuyệt đối.
  Overlay / split trỏ vào ảnh gốc (chưa cắt) — production phải cắt sẵn (overlay 546x420, split 416x600).
*/
'use strict';
var fs = require('fs');
var path = require('path');

var EMAIL = path.join(__dirname, '..');
var OUT = __dirname;
var IMG = '../../assets/img/';

var read = function (f) { return fs.readFileSync(path.join(EMAIL, f), 'utf8'); };
var esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
};
// Bước 1: giống regex PHP trong README: /<!--(?!\[if)[\s\S]*?-->/
var strip = function (tpl) { return tpl.replace(/<!--(?!\[if)[\s\S]*?-->/g, ''); };
// Thay một lượt; token lạ để nguyên (sẽ bị báo lỗi ở cuối)
var fill = function (tpl, vars) {
  return tpl.replace(/%([a-z_]+)%/g, function (m, k) {
    return Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m;
  });
};

// Màu nhạt của card_bg (giống YQEmail.tint / checkout card_line_hex): trộn amount phần trắng
var tint = function (hex, amount) {
  return '#' + [1, 3, 5].map(function (i) {
    var c = parseInt(hex.substr(i, 2), 16);
    return ('0' + Math.round(c + (255 - c) * amount).toString(16)).slice(-2);
  }).join('').toUpperCase();
};

var TEXT = ['preheader', 'gift_url', 'recipient_name', 'sender_name', 'gift_message', 'card_bg', 'card_line', 'card_banner',
  'card_banner_overlay', 'card_banner_split', 'redeem_date', 'product_name', 'redeem_expiry', 'voucher',
  'outlet_name', 'voucher_summary', 'outlet_phone', 'terms_url', 'order_ref'];

var base = {
  preheader: 'James sent you a gift from The Shop',
  gift_url: '../../voucher/gift.html',
  recipient_name: 'Sarah Tan',
  sender_name: 'James',
  gift_message: 'Merry Christmas! Enjoy a festive evening on us — you deserve it.',
  redeem_date: '10 Nov 2026',   // dòng "Purchased on … · Ref …" của khung
  product_name: 'Christmas Eve Dinner Buffet at StraitsKitchen',
  redeem_expiry: '24 Dec 2026',
  voucher: 'GH-8F3K-2Q7M',
  // Biến MỚI (Luxe Ticket v2 — email/DESIGN-TICKET.md)
  outlet_name: 'StraitsKitchen',
  voucher_summary: 'Dinner buffet for 1 adult \u00b7 24 Dec 2026, 6\u201310 PM',
  outlet_phone: '+65 6732 1234',
  terms_url: '../../voucher/gift.html#terms',
  order_ref: 'GH12345678',
  // Biến HTML (chèn nguyên)
  qr_code: '<img src="' + IMG + 'qr-sample.png" width="120" height="120" alt="QR code" style="display:block;width:120px;height:120px;border:0;">',
  voucher_terms_short: '<ul style="margin:0 0 0 18px;padding:0;">' +
    '<li style="margin:0 0 6px;padding:0;">Valid for one adult on 24 Dec 2026.</li>' +
    '<li style="margin:0 0 6px;padding:0;">Advance reservation required; subject to availability.</li>' +
    '<li style="margin:0;padding:0;">Non-refundable, no cash value, one-time use.</li></ul>'
  // %product_description% không còn trong email (hiện ở voucher/gift.html)
};

var SAMPLES = [
  { layout: 'classic', card_bg: '#816653', banner: 'o-festive.jpg', note: 'Classic · Christmas banner (o-festive.jpg) · Auto colour #816653' },
  { layout: 'overlay', card_bg: '#B9353F', banner: 'o-festive.jpg', note: 'Overlay · Christmas banner as background · Warm Crimson #B9353F' },
  { layout: 'split', card_bg: '#6F2613', banner: 'o-anniversaries.jpg', note: 'Split · Anniversary banner (o-anniversaries.jpg) · Deep Terracotta #6F2613' },
  { layout: 'minimal', card_bg: '#8C7145', banner: '', note: 'Minimal · no image · Burnished Gold #8C7145' },
  { layout: 'none', card_bg: '#8C7145', banner: '', note: 'No card (self-purchase) · hero banner + gold ticket (backend passes #8C7145)' }
];

var frame = strip(read('voucher-gift.html'));
var problems = [];

SAMPLES.forEach(function (s) {
  var raw = {};
  for (var k in base) raw[k] = base[k];
  raw.card_bg = s.card_bg;
  raw.card_line = tint(s.card_bg, 0.35);
  if (s.layout === 'none') {
    raw.preheader = 'Your eVoucher from The Shop';
    raw.gift_message = '';        // card-none không có khối lời chúc
    raw.recipient_name = 'James Lim';   // mua cho mình: dòng "for …" trên vé = tên người mua
  }
  var url = s.banner ? IMG + s.banner : '';
  raw.card_banner = url; raw.card_banner_overlay = url; raw.card_banner_split = url;

  var v = {};
  Object.keys(raw).forEach(function (k) { v[k] = TEXT.indexOf(k) >= 0 ? esc(raw[k]) : raw[k]; });
  v.gift_message = v.gift_message.replace(/\r?\n/g, '<br>');

  v.gift_card = fill(strip(read('parts/card-' + s.layout + '.html')), v);
  var body = fill(frame, v);

  var html = '<!DOCTYPE html>\n<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">\n' +
    '<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="robots" content="noindex, nofollow">\n<title>A gift for you from James — sample (' + s.layout + ')</title>\n</head>\n' +
    '<body style="margin:0;padding:0;background-color:#F6F4EF;">\n' + body.trim() + '\n</body>\n</html>\n';

  var left = html.match(/%[a-z_]+%/g);
  if (left) problems.push(s.layout + ': ' + left.join(' '));
  fs.writeFileSync(path.join(OUT, s.layout + '.html'), html);
  console.log('wrote email/samples/' + s.layout + '.html');
});

if (problems.length) { console.error('Token chưa thay:\n' + problems.join('\n')); process.exit(1); }
