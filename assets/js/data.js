/* ==========================================================================
   YQ eStore — Data layer (nav, icons, products, experiences)
   Thay bằng API/CMS thật khi tích hợp backend.
   ========================================================================== */
window.YQ = window.YQ || {};

/* ---------- Inline SVG icons ---------- */
YQ.icon = function (name, size) {
  var s = size || 18;
  var p = {
    search:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/>',
    bag:      '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    bolt:     '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>',
    user:     '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c1.2-3.6 4-5.2 7-5.2s5.8 1.6 7 5.2"/>',
    menu:     '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close:    '<path d="M6 6l12 12M18 6L6 18"/>',
    chevdown: '<polyline points="6 9 12 15 18 9"/>',
    chevright:'<polyline points="9 6 15 12 9 18"/>',
    chevleft: '<polyline points="15 6 9 12 15 18"/>',
    arrow:    '<path d="M4 12h15"/><polyline points="13 6 19 12 13 18"/>',
    check:    '<polyline points="4 12.5 9.5 18 20 6.5"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    minus:    '<path d="M5 12h14"/>',
    star:     '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z" fill="currentColor" stroke="none"/>',
    clock:    '<circle cx="12" cy="12" r="8.5"/><polyline points="12 7.5 12 12 15 13.8"/>',
    pin:      '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    users:    '<circle cx="9" cy="9" r="3.2"/><path d="M3 19c.9-3 3.3-4.4 6-4.4S14.1 16 15 19"/><path d="M16 6.2A3.2 3.2 0 0 1 16 13"/><path d="M17.5 14.8c2 .6 3.4 2 4 4.2"/>',
    truck:    '<path d="M2 7h11v9H2z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    lock:     '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>',
    leaf:     '<path d="M20 4C10 4 4 9 4 16c0 2 .7 3.4.7 3.4S9 12 19 9c0 0-5.5 3.5-8 11 6.5 1 9-4 9-16Z"/>',
    gift:     '<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M3.5 13h17M12 9v11.5"/><path d="M12 9S10.8 4.5 8.5 4.5a2.2 2.2 0 0 0 0 4.5H12Zm0 0s1.2-4.5 3.5-4.5a2.2 2.2 0 0 1 0 4.5H12Z"/>',
    mail:     '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="m3.8 7 8.2 6 8.2-6"/>',
    box:      '<path d="M12 3 20.5 7.5v9L12 21 3.5 16.5v-9L12 3Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    phone:    '<path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/>',
    sparkle:  '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z"/>',
    heart:    '<path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20Z"/>',
    refresh:  '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8"/><polyline points="20 4 20 8.5 15.5 8.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 16"/><polyline points="4 20 4 15.5 8.5 15.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3.5v3.2M16 3.5v3.2"/>',
    card:     '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18"/>',
    wallet:   '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a1.5 1.5 0 0 1 0 3H5.5"/><rect x="3" y="7.5" width="18" height="11.5" rx="2.2"/><circle cx="16.5" cy="13.2" r="1.15" fill="currentColor" stroke="none"/>',
    userplus: '<circle cx="10" cy="8" r="3.4"/><path d="M3.5 20c1.1-3.6 3.6-5.2 6.5-5.2 1 0 1.9.2 2.7.5"/><path d="M17.5 14v6M14.5 17h6"/>',
    logout:   '<path d="M14 4.5h3.8A2.2 2.2 0 0 1 20 6.7v10.6a2.2 2.2 0 0 1-2.2 2.2H14"/><path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H16"/>',
    copy:     '<rect x="9" y="9" width="11.5" height="11.5" rx="2.2"/><path d="M15 5.5A2.2 2.2 0 0 0 12.8 3.5H5.7A2.2 2.2 0 0 0 3.5 5.7v7.1A2.2 2.2 0 0 0 5.5 15"/>',
    link:     '<path d="M10.5 13.5a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1 1"/><path d="M13.5 10.5a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1-1"/>',
    eye:      '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.9"/>',
    eyeoff:   '<path d="M4 4.5 20 20M9.6 6.9A9.6 9.6 0 0 1 12 6.5c6 0 9.5 5.5 9.5 5.5a17 17 0 0 1-3.4 3.9"/><path d="M6.4 8.2A16.6 16.6 0 0 0 2.5 12S6 17.5 12 17.5c1 0 1.9-.15 2.7-.4"/><path d="M9.9 9.9a2.9 2.9 0 0 0 4.1 4.1"/>'
  }[name] || '';
  return '<svg class="yq-i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
         p + '</svg>';
};

/* ---------- Brand glyph (nút social login) ----------
   Logo hãng có viewBox riêng nên tách khỏi YQ.icon (bộ icon nét 24x24).
   Đường path lấy từ bộ Font Awesome Free brands (CC BY 4.0); tên và biểu tượng
   là nhãn hiệu của chủ sở hữu — chỉ dùng để chỉ nhà cung cấp đăng nhập.
*/
YQ.brandIcon = function (name, size) {
  var g = {
    facebook:  ['0 0 320 512', 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z'],
    twitter:   ['0 0 512 512', 'M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558A296.63 296.63 0 0 1 0 416.827a217.17 217.17 0 0 0 25.34 1.3c49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772a132.6 132.6 0 0 0 19.818 1.624 105 105 0 0 0 27.614-3.573C58.855 288.828 22.792 246.596 22.792 195.59v-1.299a105.5 105.5 0 0 0 47.432 13.319c-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807a121 121 0 0 1-2.599-24.04c0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827a209 209 0 0 0 60.426-16.243 225 225 0 0 1-52.628 54.253z'],
    linkedin:  ['0 0 448 512', 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3z'],
    google:    ['0 0 488 512', 'M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z'],
    microsoft: ['0 0 448 512', 'M0 32h214.6v214.6H0zm233.4 0H448v214.6H233.4zM0 265.4h214.6V480H0zm233.4 0H448V480H233.4z'],
    line:      ['0 0 448 512', 'M272.1 204.2v71.1c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.1 0-2.1-.6-2.6-1.3l-32.6-44v42.2c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.8 0-3.2-1.4-3.2-3.2v-71.1c0-1.8 1.4-3.2 3.2-3.2H219c1 0 2.1.5 2.6 1.4l32.6 44v-42.2c0-1.8 1.4-3.2 3.2-3.2h11.4c1.8-.1 3.3 1.4 3.3 3.1zm-82-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 1.8 1.4 3.2 3.2 3.2h11.4c1.8 0 3.2-1.4 3.2-3.2v-71.1c0-1.7-1.4-3.2-3.2-3.2zm-27.5 59.6h-31.1v-56.4c0-1.8-1.4-3.2-3.2-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 .9.3 1.6.9 2.2.6.5 1.3.9 2.2.9h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.7-1.4-3.2-3.1-3.2zM332.1 201h-45.7c-1.7 0-3.2 1.4-3.2 3.2v71.1c0 1.7 1.4 3.2 3.2 3.2h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2V234c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2v-11.4c-.1-1.7-1.5-3.2-3.2-3.2zM448 113.7V399c-.1 63.6-51.9 115.1-115.6 115H63c-63.6-.1-115.1-52-115-115.6V113c.1-63.6 52-115.1 115.6-115H385c63.6.1 115.1 51.9 115 115.7zm-107.4 99.9c0-70.5-70.7-127.8-157.5-127.8S25.6 143.1 25.6 213.6c0 63.2 56.1 116.1 131.8 126.1 18.5 4 16.4 10.8 12.2 35.8-.7 4-3.2 15.7 13.8 8.6s91.6-54 125-92.4c23-25.3 33.2-51 33.2-78.1z']
  }[name];
  if (!g) return '';
  return '<svg class="yq-brandi" width="' + (size || 18) + '" height="' + (size || 18) + '" ' +
         'viewBox="' + g[0] + '" fill="currentColor" aria-hidden="true"><path d="' + g[1] + '"/></svg>';
};

/* ---------- Logo ----------
   Mặc định: lockup dựng bằng HTML/CSS (nét mảnh, giãn chữ) — luôn sắc nét, đổi màu 1 dòng CSS.
   Có logo chính thức? Gán đường dẫn vào YQ.logoImage (và YQ.logoImageLight cho nền tối)
   là toàn site tự chuyển sang dùng ảnh, không phải sửa gì thêm.
   VD: YQ.logoImage = 'assets/img/logo-grand-hyatt.png';
*/
YQ.logoImage = null;        // logo cho nền sáng (header)
YQ.logoImageLight = null;   // logo đảo màu cho nền tối (footer)

YQ.logo = function (opts) {
  opts = opts || {};
  var light = !!opts.light;
  var cls = 'yq-logo' + (light ? ' yq-logo--light' : '') + (opts.className ? ' ' + opts.className : '');
  var label = 'Grand Hyatt Singapore';
  var img = light ? (YQ.logoImageLight || YQ.logoImage) : YQ.logoImage;

  var inner = img
    ? '<img class="yq-logo__img" src="' + img + '" alt="' + label + '">'
    : '<span class="yq-logo__mark">' +
        '<span class="yq-logo__word">Grand</span>' +
        '<span class="yq-logo__bar" aria-hidden="true"></span>' +
        '<span class="yq-logo__word">Hyatt</span>' +
        '<span class="yq-logo__tm" aria-hidden="true">\u2122</span>' +
      '</span>' +
      '<span class="yq-logo__sub">Singapore</span>';

  if (opts.tag === 'div') return '<div class="' + cls + '" role="img" aria-label="' + label + '">' + inner + '</div>';
  return '<a class="' + cls + '" href="' + (opts.href || 'index.html') + '" aria-label="' + label + '">' + inner + '</a>';
};

/* ---------- Products ----------
   CHỈ dùng cho giỏ hàng demo (localStorage): tra tên/giá/ảnh theo data-productid khi
   Add to cart, giỏ mẫu, đơn hàng mẫu. Card, chip danh mục và trang chi tiết đều là
   HTML tĩnh — sửa sản phẩm hiển thị thì sửa HTML, không sửa ở đây. */
/* badge: 'Bestseller' | 'New' | 'Seasonal' — nhãn thường.
   promo: nhãn khuyến mãi ('Limited Time Offer', 'Early Bird'…) — hiện cùng badge trên ribbon.
   compareAt: giá gốc trước giảm (ở sản phẩm = giá "From", ở option = giá option);
   % giảm tự tính bằng YQ.discount(price, compareAt). */
YQ.products = [
  {
    id: 'signature-chocolate-cake', img:'assets/img/shop/cake-chocolate-gold.jpg', name: 'Signature Chocolate Cake',
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 1, badge: 'Bestseller',
    price: 78, seasons: ['festive'], featured: true, rank: 1,
    gallery: ['assets/img/shop/group-cakes.jpg', 'assets/img/lifestyle/cake-table.jpg'],
    desc: 'A modern classic—layers of velvety chocolate sponge, silky ganache, and refined finishes. Available in three sizes to suit any celebration.',
    short: 'A modern classic—layers of velvety chocolate sponge, silky ganache, and refined finishes.',
    optionLabel: 'Select option',
    options: [
      { id: 'small',  label: 'Small (6-inch, serves 6)',   price: 78 },
      { id: 'medium', label: 'Medium (8-inch, serves 10)', price: 108 },
      { id: 'large',  label: 'Large (10-inch, serves 14)', price: 148 }
    ]
  },
  {
    id: 'grand-pralines', img:'assets/img/shop/pralines-25.jpg', name: 'Grand Pralines Collection',
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 8, badge: 'Bestseller',
    price: 58, seasons: ['festive','cny'], featured: true, rank: 2,
    gallery: ['assets/img/shop/pralines-16.jpg'],
    desc: '24 handcrafted pralines in an elegant gold gift box. Dark, milk, and white chocolate shells filled with single-origin ganache.',
    short: '24 handcrafted pralines in an elegant gold gift box. Dark, milk, and white chocolate.',
    optionLabel: 'Box size',
    options: [
      { id: '12', label: '12 pieces', price: 58 },
      { id: '24', label: '24 pieces', price: 98 }
    ]
  },
  {
    id: 'the-grand-hamper', img:'assets/img/shop/hamper-grand.jpg', name: 'The Grand Hamper',
    cat: 'celebration', catLabel: 'Hampers', tone: 3, badge: 'Bestseller',
    price: 218, seasons: ['festive','cny'], featured: true, rank: 3, meta: '12 items',
    desc: 'Our signature seasonal selection featuring artisan treats, preserves, fine teas, and a bottle of house champagne—presented in a hand-woven basket.',
    short: 'Our signature seasonal selection featuring artisan treats, preserves, and fine teas.',
    optionLabel: 'Presentation',
    options: [
      { id: 'classic', label: 'Classic basket', price: 218 },
      { id: 'deluxe',  label: 'Deluxe with champagne', price: 328 }
    ]
  },
  {
    id: 'gh-champagne-brut', img:'assets/img/p-champagne.jpg', name: 'Grand Hyatt Champagne Brut',
    cat: 'beverages', catLabel: 'Wine & Champagne', tone: 4, badge: 'Bestseller',
    price: 128, seasons: ['festive','nye'], featured: true, rank: 4,
    desc: 'Our house champagne—crisp, elegant, with fine bubbles and notes of white peach, brioche, and citrus zest.',
    short: 'Our house champagne—crisp, elegant, with fine bubbles and notes of white peach.',
    optionLabel: 'Format',
    options: [
      { id: 'bottle', label: 'Bottle (750ml)', price: 128 },
      { id: 'duo',    label: 'Gift duo (2 bottles)', price: 238 }
    ]
  },
  {
    id: 'the-pantry-hamper', img:'assets/img/shop/hamper-pantry.jpg', name: 'The Pantry Hamper',
    cat: 'celebration', catLabel: 'Hampers', tone: 6, badge: 'New', promo: 'Limited Time Offer',
    price: 168, compareAt: 210, seasons: ['festive'], featured: true, rank: 5, meta: '8 items',
    desc: 'A collection of gourmet pantry essentials—artisan honey, olive oil, preserves, and hand-baked crackers from our kitchens.',
    short: 'A collection of gourmet pantry essentials—artisan honey, preserves, and crackers.',
    optionLabel: 'Presentation',
    options: [{ id: 'std', label: 'Signature basket', price: 168, compareAt: 210 }]
  },
  {
    id: 'cellar-selection-trio', img:'assets/img/p-cellar-trio.jpg', name: 'Cellar Selection Trio',
    cat: 'beverages', catLabel: 'Wine & Champagne', tone: 5, badge: 'New', promo: 'Limited Time Offer',
    price: 288, compareAt: 480, seasons: ['festive','nye'], featured: true, rank: 6, meta: '3 bottles',
    desc: 'Three bottles of our finest wines—one red, one white, one sparkling—selected by our head sommelier and presented in a wooden case.',
    short: 'Three bottles of our finest wines—one red, one white, one sparkling.',
    optionLabel: 'Case',
    options: [{ id: 'trio', label: 'Wooden gift case', price: 288, compareAt: 480 }]
  },
  {
    id: 'artisan-cookie-box', img:'assets/img/p-cookies.jpg', name: 'Artisan Cookie Box',
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 3, badge: 'New',
    price: 48, seasons: [], rank: 7,
    desc: 'Sixteen hand-baked cookies in four flavours—brown butter, double chocolate, pistachio, and salted caramel.',
    short: 'Sixteen hand-baked cookies in four flavours, packed in a keepsake tin.',
    optionLabel: 'Tin size',
    options: [
      { id: '16', label: '16 cookies', price: 48 },
      { id: '32', label: '32 cookies', price: 88 }
    ]
  },
  {
    id: 'damai-wellness-set', img:'assets/img/p-spa-set.jpg', name: 'Damai Spa Wellness Set',
    cat: 'wellness', catLabel: 'Wellness & Spa', tone: 6, badge: 'New',
    price: 188, seasons: ['retreats'], rank: 8,
    desc: 'Signature bath oils, a hand-poured candle, and a plush towel set from Damai Spa—an at-home ritual of calm.',
    short: 'Signature bath oils, a hand-poured candle, and a plush towel set from Damai Spa.',
    optionLabel: 'Set',
    options: [
      { id: 'essential', label: 'Essential set', price: 188 },
      { id: 'complete',  label: 'Complete ritual', price: 268 }
    ]
  },
  {
    id: 'brix-tote', img:'assets/img/p-tote.jpg', name: 'Brix Signature Tote',
    cat: 'brix', catLabel: 'Brix Merchandise', tone: 7,
    price: 68, seasons: [], rank: 9,
    desc: 'Heavyweight canvas tote with embroidered Brix insignia and leather-trimmed handles.',
    short: 'Heavyweight canvas tote with embroidered Brix insignia and leather trim.',
    optionLabel: 'Colour',
    options: [
      { id: 'sand',  label: 'Sand', price: 68 },
      { id: 'ink',   label: 'Ink', price: 68 }
    ]
  },
  {
    id: 'grand-dining-voucher', img:'assets/img/p-dining-voucher.jpg', name: 'Grand Dining Voucher',
    cat: 'dining', catLabel: 'Dining Vouchers', tone: 2,
    price: 200, seasons: ['fathers'], rank: 10,
    desc: 'A dining credit valid at all Grand Hyatt Singapore restaurants and bars. Delivered as an eCard or a printed card.',
    short: 'A dining credit valid at all Grand Hyatt Singapore restaurants and bars.',
    optionLabel: 'Value',
    options: [
      { id: '100', label: '$100', price: 100 },
      { id: '200', label: '$200', price: 200 },
      { id: '500', label: '$500', price: 500 }
    ]
  },
  {
    id: 'afternoon-tea-two', img:'assets/img/p-afternoon-tea.jpg', name: 'Afternoon Tea for Two',
    cat: 'dining', catLabel: 'Dining', tone: 3,
    price: 68, seasons: ['fathers'], rank: 11,
    desc: 'An elegant afternoon tea at The Lounge with premium teas, warm scones, and delicate pastries for two guests.',
    short: 'Premium teas, warm scones, and delicate pastries at The Lounge, for two.',
    optionLabel: 'Sitting',
    options: [
      { id: 'classic', label: 'Classic tea', price: 68 },
      { id: 'bubbly',  label: 'With champagne', price: 98 }
    ]
  },
  {
    id: 'festive-yule-log', img:'assets/img/p-yule-log.jpg', name: 'Festive Yule Log',
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 1, badge: 'Seasonal', promo: 'Early Bird',
    price: 88, compareAt: 98, seasons: ['festive','nye'], rank: 12,
    desc: 'A chestnut and dark chocolate bûche finished with meringue mushrooms and a dusting of snow sugar.',
    short: 'A chestnut and dark chocolate bûche, finished with meringue and snow sugar.',
    optionLabel: 'Size',
    options: [
      { id: 'reg', label: 'Serves 6', price: 88, compareAt: 98 },
      { id: 'lg',  label: 'Serves 12', price: 138, compareAt: 153 }
    ]
  },
  {
    id: 'prosperity-yusheng', img:'assets/img/p-yusheng.jpg', name: 'Prosperity Yu Sheng Set',
    cat: 'celebration', catLabel: 'Celebration', tone: 5, badge: 'Seasonal',
    price: 128, seasons: ['cny'], rank: 13,
    desc: 'A Lunar New Year classic—salmon, shredded vegetables, and house-made plum dressing, with a golden serving platter.',
    short: 'Salmon, shredded vegetables, and house-made plum dressing on a golden platter.',
    optionLabel: 'Portion',
    options: [
      { id: '6',  label: 'Serves 6', price: 128 },
      { id: '10', label: 'Serves 10', price: 188 }
    ]
  },

  /* ---------- The Shop — sản phẩm theo bộ ảnh WhiteBox (assets/img/shop/) ----------
     Tên đặt theo ảnh, GIÁ LÀ GIÁ TẠM — thay bằng tên + giá chính thức của The Shop.
     Bánh/tart có 2 cỡ: Petite (cỡ nhỏ 1 người) và Whole (nguyên ổ). */

  /* Whole cakes */
  {
    id: 'dark-chocolate-cherry-cake', img:'assets/img/shop/cake-chocolate-cherry.jpg', name: 'Dark Chocolate Cherry Cake',
    cat: 'cakes', catLabel: 'Cakes', tone: 1, price: 11, seasons: [], rank: 14,
    gallery: ['assets/img/shop/petit-chocolate-cherry.jpg', 'assets/img/shop/group-cakes.jpg'],
    desc: 'A dark chocolate collar filled with light chocolate mousse and Chantilly, crowned with cherries and chocolate curls. Requires 48 hours’ advance notice.',
    short: 'Dark chocolate mousse and Chantilly, crowned with cherries and chocolate curls.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 11 }, { id: 'whole', label: 'Whole (serves 8)', price: 68 }]
  },
  {
    id: 'peach-chantilly-cake', img:'assets/img/shop/cake-peach-chantilly.jpg', name: 'Peach Chantilly Cake',
    cat: 'cakes', catLabel: 'Cakes', tone: 3, price: 11, seasons: [], rank: 15,
    gallery: ['assets/img/shop/petit-peach-chantilly.jpg'],
    desc: 'Vanilla sponge layered with whipped Chantilly cream and fresh stone fruit, finished with piped rosettes. Requires 48 hours’ advance notice.',
    short: 'Vanilla sponge, whipped Chantilly cream and fresh stone fruit.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 11 }, { id: 'whole', label: 'Whole (serves 8)', price: 68 }]
  },
  {
    id: 'caramel-coconut-cake', img:'assets/img/shop/cake-caramel-coconut.jpg', name: 'Caramel Coconut Cake',
    cat: 'cakes', catLabel: 'Cakes', tone: 3, price: 11, seasons: [], rank: 16,
    gallery: ['assets/img/shop/petit-caramel-coconut.jpg'],
    desc: 'Coconut mousse on a crisp dacquoise base, glazed with golden caramel and edged with toasted coconut. Requires 48 hours’ advance notice.',
    short: 'Coconut mousse and golden caramel glaze on a crisp dacquoise base.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 11 }, { id: 'whole', label: 'Whole (serves 8)', price: 68 }]
  },
  {
    id: 'lavender-blossom-cake', img:'assets/img/shop/cake-lavender.jpg', name: 'Lavender Blossom Cake',
    cat: 'cakes', catLabel: 'Cakes', tone: 8, price: 11, seasons: [], rank: 17,
    gallery: ['assets/img/shop/petit-lavender.jpg'],
    desc: 'A delicate blush mousse cake on a sablé base, scattered with lavender blossoms. Requires 48 hours’ advance notice.',
    short: 'A delicate blush mousse cake scattered with lavender blossoms.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 11 }, { id: 'whole', label: 'Whole (serves 8)', price: 68 }]
  },
  {
    id: 'matcha-strawberry-cake', img:'assets/img/shop/cake-matcha-strawberry.jpg', name: 'Matcha Strawberry Cake',
    cat: 'cakes', catLabel: 'Cakes', tone: 6, price: 11, seasons: [], rank: 18,
    gallery: ['assets/img/shop/petit-matcha-strawberry.jpg'],
    desc: 'Layers of matcha mousse and vanilla cream under a glossy green tea glaze, topped with fresh strawberries. Requires 48 hours’ advance notice.',
    short: 'Matcha mousse, vanilla cream and fresh strawberries.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 11 }, { id: 'whole', label: 'Whole (serves 8)', price: 68 }]
  },

  /* Tarts */
  {
    id: 'citrus-meringue-tart', img:'assets/img/shop/tart-citrus-meringue.jpg', name: 'Citrus Meringue Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 3, price: 10, seasons: [], rank: 19,
    gallery: ['assets/img/shop/petit-citrus-meringue.jpg', 'assets/img/shop/group-tarts.jpg'],
    desc: 'Buttery sablé filled with tangy citrus curd, finished with torched Italian meringue petals. Requires 48 hours’ advance notice.',
    short: 'Tangy citrus curd under torched Italian meringue petals.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 10 }, { id: 'whole', label: 'Whole (serves 8)', price: 62 }]
  },
  {
    id: 'strawberry-mango-tart', img:'assets/img/shop/tart-strawberry-mango.jpg', name: 'Strawberry Mango Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 1, price: 10, seasons: [], rank: 20,
    gallery: ['assets/img/shop/petit-strawberry-mango.jpg', 'assets/img/shop/group-tarts.jpg'],
    desc: 'Vanilla crème pâtissière in a crisp tart shell, piled high with fresh strawberries and ripe mango. Requires 48 hours’ advance notice.',
    short: 'Vanilla custard piled high with fresh strawberries and mango.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 10 }, { id: 'whole', label: 'Whole (serves 8)', price: 62 }]
  },
  {
    id: 'caramel-coffee-tart', img:'assets/img/shop/tart-caramel-coffee.jpg', name: 'Caramel Coffee Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 3, price: 10, seasons: [], rank: 21,
    gallery: ['assets/img/shop/petit-caramel-coffee.jpg', 'assets/img/shop/group-tarts.jpg'],
    desc: 'Coffee caramel ganache piped into a sunflower of petals, centred with crunchy chocolate pearls. Requires 48 hours’ advance notice.',
    short: 'Coffee caramel ganache petals with crunchy chocolate pearls.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 10 }, { id: 'whole', label: 'Whole (serves 8)', price: 62 }]
  },
  {
    id: 'cherry-vanilla-tart', img:'assets/img/shop/tart-cherry-vanilla.jpg', name: 'Cherry Vanilla Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 1, price: 10, seasons: [], rank: 22,
    gallery: ['assets/img/shop/petit-cherry-vanilla.jpg', 'assets/img/shop/group-tarts.jpg'],
    desc: 'Vanilla cream quenelles and glossy fresh cherries on an almond tart base. Requires 48 hours’ advance notice.',
    short: 'Vanilla cream and glossy fresh cherries on an almond tart base.',
    optionLabel: 'Size',
    options: [{ id: 'petite', label: 'Petite (serves 1)', price: 10 }, { id: 'whole', label: 'Whole (serves 8)', price: 62 }]
  },
  {
    id: 'pink-grapefruit-tart', img:'assets/img/shop/tart-pink-grapefruit.jpg', name: 'Pink Grapefruit Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 8, price: 62, seasons: [], rank: 23,
    desc: 'Segments of pink grapefruit and berries over citrus cream, finished with fresh mint. Requires 48 hours’ advance notice.',
    short: 'Pink grapefruit and berries over citrus cream, with fresh mint.',
    optionLabel: 'Size',
    options: [{ id: 'whole', label: 'Whole (serves 8)', price: 62 }]
  },
  {
    id: 'lemon-meringue-tart', img:'assets/img/shop/tart-lemon-meringue.jpg', name: 'Lemon Meringue Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 3, price: 62, seasons: [], rank: 24,
    desc: 'A classic—sharp lemon curd beneath a crown of torched meringue kisses. Requires 48 hours’ advance notice.',
    short: 'Sharp lemon curd beneath a crown of torched meringue kisses.',
    optionLabel: 'Size',
    options: [{ id: 'whole', label: 'Whole (serves 8)', price: 62 }]
  },
  {
    id: 'mango-rose-tart', img:'assets/img/shop/tart-mango-rose.jpg', name: 'Mango Rose Tart',
    cat: 'cakes', catLabel: 'Tarts', tone: 3, price: 68, seasons: [], rank: 25,
    desc: 'Ribbons of ripe mango folded into roses over passion fruit cream, scattered with edible flowers. Requires 48 hours’ advance notice.',
    short: 'Ripe mango roses over passion fruit cream, with edible flowers.',
    optionLabel: 'Size',
    options: [{ id: 'whole', label: 'Whole (serves 8)', price: 68 }]
  },

  /* Chocolates */
  {
    id: 'signature-truffles', img:'assets/img/shop/truffles-25.jpg', name: 'Signature Truffle Collection',
    cat: 'cakes', catLabel: 'Chocolates', tone: 8, price: 38, seasons: ['festive','cny'], rank: 26,
    gallery: ['assets/img/shop/truffles-9.jpg'],
    desc: 'Hand-rolled truffles in seasonal flavours, presented in The Shop’s signature gold-trimmed gift box.',
    short: 'Hand-rolled truffles in seasonal flavours, in a signature gift box.',
    optionLabel: 'Box size',
    options: [{ id: '9', label: '9 pieces', price: 38 }, { id: '25', label: '25 pieces', price: 88 }]
  },
  {
    id: 'dark-raspberry-bar', img:'assets/img/shop/choc-bar-raspberry.jpg', name: 'Dark Chocolate Raspberry Bar',
    cat: 'cakes', catLabel: 'Chocolates', tone: 1, price: 18, seasons: [], rank: 27,
    desc: 'Single-origin dark chocolate scattered with freeze-dried raspberries, in a keepsake slide box.',
    short: 'Dark chocolate with freeze-dried raspberries.',
    optionLabel: 'Format', options: [{ id: 'bar', label: 'Bar', price: 18 }]
  },
  {
    id: 'white-cranberry-bar', img:'assets/img/shop/choc-bar-cranberry.jpg', name: 'White Chocolate Cranberry Bar',
    cat: 'cakes', catLabel: 'Chocolates', tone: 3, price: 18, seasons: [], rank: 28,
    desc: 'Creamy white chocolate studded with tart dried cranberries, in a keepsake slide box.',
    short: 'Creamy white chocolate with dried cranberries.',
    optionLabel: 'Format', options: [{ id: 'bar', label: 'Bar', price: 18 }]
  },
  {
    id: 'milk-hazelnut-bar', img:'assets/img/shop/choc-bar-hazelnut.jpg', name: 'Milk Chocolate Hazelnut Bar',
    cat: 'cakes', catLabel: 'Chocolates', tone: 8, price: 18, seasons: [], rank: 29,
    desc: 'Smooth milk chocolate loaded with whole roasted hazelnuts, in a keepsake slide box.',
    short: 'Milk chocolate with whole roasted hazelnuts.',
    optionLabel: 'Format', options: [{ id: 'bar', label: 'Bar', price: 18 }]
  },

  /* Cookies & coated nuts — tên theo file ảnh gốc */
  {
    id: 'assorted-rocher', img:'assets/img/shop/jar-assorted-rocher.jpg', name: 'Assorted Rocher',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 8, price: 32, seasons: [], rank: 30,
    desc: 'Clusters of roasted nuts and crisp almonds bound in fine chocolate, in a signature Shop jar.',
    short: 'Roasted nut clusters bound in fine chocolate.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 32 }]
  },
  {
    id: 'chocolate-bark', img:'assets/img/shop/jar-chocolate-bark.jpg', name: 'Chocolate Bark',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 8, price: 32, seasons: [], rank: 31,
    desc: 'Shards of dark and milk chocolate bark with nuts and dried fruit, in a signature Shop jar.',
    short: 'Dark and milk chocolate bark with nuts and dried fruit.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 32 }]
  },
  {
    id: 'cocoa-almonds', img:'assets/img/shop/jar-cocoa-almonds.jpg', name: 'Cocoa Almonds',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 8, price: 30, seasons: [], rank: 32,
    desc: 'Roasted almonds enrobed in dark chocolate and dusted with cocoa, in a signature Shop jar.',
    short: 'Roasted almonds in dark chocolate, dusted with cocoa.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 30 }]
  },
  {
    id: 'milk-coated-hazelnuts', img:'assets/img/shop/jar-milk-hazelnuts.jpg', name: 'Milk Chocolate Coated Hazelnuts',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 8, price: 30, seasons: [], rank: 33,
    desc: 'Whole roasted hazelnuts panned in smooth milk chocolate, in a signature Shop jar.',
    short: 'Whole roasted hazelnuts in smooth milk chocolate.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 30 }]
  },
  {
    id: 'chocolate-gourmand-almonds', img:'assets/img/shop/jar-gourmand-almonds.jpg', name: 'Chocolate Gourmand Mix Almonds',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 8, price: 32, seasons: [], rank: 34,
    desc: 'A gourmand mix of almonds coated in dark, milk and caramelised chocolate, in a signature Shop jar.',
    short: 'Almonds coated in dark, milk and caramelised chocolate.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 32 }]
  },
  {
    id: 'cashew-nut-cookies', img:'assets/img/shop/jar-cashew-cookies.jpg', name: 'Cashew Nut Cookies',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 3, price: 28, seasons: [], rank: 35,
    desc: 'Crisp, buttery fingers baked with roasted cashews, in a signature Shop jar.',
    short: 'Crisp, buttery cookies baked with roasted cashews.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 28 }]
  },
  {
    id: 'choco-dipped-butter-cookies', img:'assets/img/shop/jar-butter-cookies.jpg', name: 'Chocolate Dipped Butter Cookies',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 3, price: 28, seasons: [], rank: 36,
    desc: 'Piped Viennese butter cookies half-dipped in dark chocolate, in a signature Shop jar.',
    short: 'Viennese butter cookies half-dipped in dark chocolate.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 28 }]
  },
  {
    id: 'chocolate-fudge-cookies', img:'assets/img/shop/jar-fudge-cookies.jpg', name: 'Chocolate Fudge Cookies',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 1, price: 28, seasons: [], rank: 37,
    desc: 'Rich, chewy double-chocolate fudge cookies, in a signature Shop jar.',
    short: 'Rich, chewy double-chocolate fudge cookies.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 28 }]
  },
  {
    id: 'chocolate-chip-cookies', img:'assets/img/shop/jar-choc-chip-cookies.jpg', name: 'Chocolate Chip Cookies',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 3, price: 28, seasons: [], rank: 38,
    desc: 'Golden brown-butter cookies loaded with dark chocolate chips, in a signature Shop jar.',
    short: 'Brown-butter cookies loaded with dark chocolate chips.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 28 }]
  },
  {
    id: 'oatmeal-cranberry-cookies', img:'assets/img/shop/jar-oatmeal-cranberry.jpg', name: 'Oatmeal Cranberry Cookies',
    cat: 'cakes', catLabel: 'Cookies & Nuts', tone: 3, price: 28, seasons: [], rank: 39,
    desc: 'Wholesome rolled-oat cookies with tart dried cranberries, in a signature Shop jar.',
    short: 'Rolled-oat cookies with tart dried cranberries.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 28 }]
  },

  /* Pantry & tea */
  {
    id: 'golden-moscato-oolong', img:'assets/img/shop/tea-moscato-oolong.jpg', name: 'Golden Moscato Oolong',
    cat: 'pantry', catLabel: 'Tea', tone: 5, price: 38, seasons: [], rank: 40,
    desc: 'Loose-leaf oolong with notes of muscat grape, specially blended for Grand Hyatt Singapore by Monogram Tea.',
    short: 'Loose-leaf oolong blended for Grand Hyatt Singapore by Monogram Tea.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Loose leaf jar', price: 38 }]
  },
  {
    id: 'yuzu-raw-honey', img:'assets/img/shop/honey-yuzu.jpg', name: 'Yuzu Infused Raw Honey',
    cat: 'pantry', catLabel: 'Pantry', tone: 3, price: 26, seasons: [], rank: 41,
    desc: 'Hives Keeper raw honey infused with bright, fragrant yuzu.',
    short: 'Hives Keeper raw honey infused with fragrant yuzu.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 26 }]
  },
  {
    id: 'ginger-raw-honey', img:'assets/img/shop/honey-ginger.jpg', name: 'Ginger Infused Raw Honey',
    cat: 'pantry', catLabel: 'Pantry', tone: 3, price: 26, seasons: [], rank: 42,
    desc: 'Hives Keeper raw honey infused with warming ginger.',
    short: 'Hives Keeper raw honey infused with warming ginger.',
    optionLabel: 'Format', options: [{ id: 'jar', label: 'Jar', price: 26 }]
  },
  {
    id: 'signature-fruit-cake', img:'assets/img/shop/fruit-cake.jpg', name: 'Signature Fruit Cake',
    cat: 'pantry', catLabel: 'Pantry', tone: 1, price: 42, seasons: ['festive'], rank: 43,
    desc: 'A rich loaf of macerated dried fruit and nuts, wrapped and tied with The Shop ribbon—made for gifting.',
    short: 'Macerated dried fruit and nuts, wrapped for gifting.',
    optionLabel: 'Format', options: [{ id: 'loaf', label: 'Loaf', price: 42 }]
  },
  {
    id: 'grissini-cristal', img:'assets/img/shop/grissini.jpg', name: 'Grissini Cristal',
    cat: 'pantry', catLabel: 'Pantry', tone: 3, price: 12, seasons: [], rank: 44,
    desc: 'Thin, crisp Italian breadsticks—perfect with cheese, charcuterie or an aperitif.',
    short: 'Thin, crisp Italian breadsticks for the aperitif hour.',
    optionLabel: 'Format', options: [{ id: 'pack', label: 'Pack', price: 12 }]
  },

  /* Breads & pastries — Viennoiserie */
  {
    id: 'butter-croissant', img:'assets/img/shop/bake-croissant.jpg', name: 'Butter Croissant',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 5, seasons: [], rank: 45,
    desc: 'Laminated with French butter and baked daily for a shatteringly crisp, honeycombed croissant.',
    short: 'Laminated with French butter and baked daily.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 5 }, { id: '6', label: 'Box of 6', price: 28 }]
  },
  {
    id: 'pain-au-chocolat', img:'assets/img/shop/bake-pain-au-chocolat.jpg', name: 'Pain au Chocolat',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 6, seasons: [], rank: 46,
    desc: 'Buttery croissant dough wrapped around two batons of dark chocolate.',
    short: 'Buttery croissant dough wrapped around dark chocolate.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 6 }, { id: '6', label: 'Box of 6', price: 30 }]
  },
  {
    id: 'ham-cheese-croissant', img:'assets/img/shop/bake-ham-cheese-croissant.jpg', name: 'Ham & Cheese Croissant',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 8, seasons: [], rank: 47,
    desc: 'Our butter croissant baked with smoked ham and a golden crust of melted cheese.',
    short: 'Butter croissant baked with smoked ham and melted cheese.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 8 }]
  },
  {
    id: 'sausage-roll', img:'assets/img/shop/bake-sausage-roll.jpg', name: 'Sausage Roll',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 6, seasons: [], rank: 48,
    desc: 'A soft, glazed brioche spiral wrapped around a juicy sausage and finished with sesame.',
    short: 'Glazed brioche spiral wrapped around a juicy sausage.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 6 }]
  },
  {
    id: 'streusel-muffin', img:'assets/img/shop/bake-streusel-muffin.jpg', name: 'Streusel Muffin',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 6, seasons: [], rank: 49,
    desc: 'A tall, tender muffin baked in a tulip case under a crunchy cinnamon streusel.',
    short: 'Tender muffin under a crunchy cinnamon streusel.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 6 }]
  },
  {
    id: 'chicken-pie', img:'assets/img/shop/bake-chicken-pie.jpg', name: 'Chicken Pie',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 9, seasons: [], rank: 50,
    desc: 'A golden puff-pastry pie filled with creamy braised chicken and vegetables.',
    short: 'Golden puff pastry filled with creamy braised chicken.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 9 }]
  },
  {
    id: 'spinach-quiche', img:'assets/img/shop/bake-spinach-quiche.jpg', name: 'Spinach & Cheese Quiche',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 6, price: 8, seasons: [], rank: 51,
    desc: 'A crisp shortcrust filled with silky egg custard, spinach and cheese.',
    short: 'Silky egg custard with spinach and cheese.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 8 }]
  },
  {
    id: 'apple-turnover', img:'assets/img/shop/bake-apple-turnover.jpg', name: 'Apple Turnover',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 6, seasons: [], rank: 52,
    desc: 'Flaky puff pastry folded over cinnamon-spiced apple compote.',
    short: 'Flaky puff pastry with cinnamon-spiced apple.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 6 }]
  },
  {
    id: 'scones-jam-cream', img:'assets/img/shop/bake-scones.jpg', name: 'Scones with Jam & Clotted Cream',
    cat: 'bakery', catLabel: 'Viennoiserie', tone: 3, price: 12, seasons: [], rank: 53,
    desc: 'Three warm raisin scones served with berry jam and clotted cream.',
    short: 'Raisin scones with berry jam and clotted cream.',
    optionLabel: 'Set', options: [{ id: 'set', label: 'Set of 3', price: 12 }]
  },

  /* Danish */
  {
    id: 'chocolate-danish', img:'assets/img/shop/danish-chocolate.jpg', name: 'Chocolate Danish',
    cat: 'bakery', catLabel: 'Danish', tone: 3, price: 6, seasons: [], rank: 54,
    desc: 'A finely laminated Danish folded around dark chocolate.',
    short: 'Finely laminated Danish folded around dark chocolate.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 6 }]
  },
  {
    id: 'apricot-custard-danish', img:'assets/img/shop/danish-apricot.jpg', name: 'Apricot Custard Danish',
    cat: 'bakery', catLabel: 'Danish', tone: 3, price: 6, seasons: [], rank: 55,
    desc: 'Crisp Danish pastry with vanilla custard and a glazed apricot.',
    short: 'Vanilla custard and glazed apricot on crisp Danish pastry.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 6 }]
  },
  {
    id: 'cube-croissant', img:'assets/img/shop/danish-cube.jpg', name: 'Cube Croissant',
    cat: 'bakery', catLabel: 'Danish', tone: 3, price: 7, seasons: [], rank: 56,
    desc: 'Croissant dough baked in a cube mould and dusted with icing sugar.',
    short: 'Croissant dough baked as a cube, dusted with icing sugar.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 7 }]
  },
  {
    id: 'mixed-berry-danish', img:'assets/img/shop/danish-berry.jpg', name: 'Mixed Berry Danish',
    cat: 'bakery', catLabel: 'Danish', tone: 1, price: 7, seasons: [], rank: 57,
    desc: 'A spiralled Danish filled with cream and topped with fresh raspberries and blackberries.',
    short: 'Spiralled Danish with cream and fresh berries.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 7 }]
  },

  /* Breads */
  {
    id: 'country-sourdough', img:'assets/img/shop/bread-country-sourdough.jpg', name: 'Country Sourdough',
    cat: 'bakery', catLabel: 'Breads', tone: 3, price: 12, seasons: [], rank: 58,
    gallery: ['assets/img/shop/bread-petite-sourdough.jpg', 'assets/img/lifestyle/bakery-counter.jpg'],
    desc: 'Slow-fermented sourdough with a blistered crust and open, tangy crumb.',
    short: 'Slow-fermented, with a blistered crust and tangy crumb.',
    optionLabel: 'Size', options: [{ id: 'petite', label: 'Petite boule', price: 6 }, { id: 'loaf', label: 'Loaf', price: 12 }]
  },
  {
    id: 'multigrain-oat-loaf', img:'assets/img/shop/bread-multigrain-oat.jpg', name: 'Multigrain Oat Loaf',
    cat: 'bakery', catLabel: 'Breads', tone: 3, price: 13, seasons: [], rank: 59,
    desc: 'A hearty multigrain loaf rolled in oats.',
    short: 'Hearty multigrain loaf rolled in oats.',
    optionLabel: 'Size', options: [{ id: 'loaf', label: 'Loaf', price: 13 }]
  },
  {
    id: 'rye-seed-loaf', img:'assets/img/shop/bread-rye-seed.jpg', name: 'Rye & Seed Loaf',
    cat: 'bakery', catLabel: 'Breads', tone: 3, price: 13, seasons: [], rank: 60,
    desc: 'Dark rye bread crusted with seeds, dense and full of flavour.',
    short: 'Dark rye crusted with seeds.',
    optionLabel: 'Size', options: [{ id: 'loaf', label: 'Loaf', price: 13 }]
  },
  {
    id: 'pumpkin-seed-loaf', img:'assets/img/shop/bread-pumpkin-seed.jpg', name: 'Pumpkin Seed Loaf',
    cat: 'bakery', catLabel: 'Breads', tone: 3, price: 13, seasons: [], rank: 61,
    desc: 'A wholegrain tin loaf topped with toasted pumpkin seeds.',
    short: 'Wholegrain tin loaf topped with pumpkin seeds.',
    optionLabel: 'Size', options: [{ id: 'loaf', label: 'Loaf', price: 13 }]
  },
  {
    id: 'twisted-country-loaf', img:'assets/img/shop/bread-twisted-loaf.jpg', name: 'Twisted Country Loaf',
    cat: 'bakery', catLabel: 'Breads', tone: 3, price: 11, seasons: [], rank: 62,
    desc: 'A rustic twisted loaf with a golden, crackling crust.',
    short: 'Rustic twisted loaf with a crackling crust.',
    optionLabel: 'Size', options: [{ id: 'loaf', label: 'Loaf', price: 11 }]
  },
  {
    id: 'traditional-baguette', img:'assets/img/shop/bread-baguette.jpg', name: 'Traditional Baguette',
    cat: 'bakery', catLabel: 'Breads', tone: 3, price: 6, seasons: [], rank: 63,
    desc: 'A classic French baguette, baked fresh every morning.',
    short: 'Classic French baguette, baked every morning.',
    optionLabel: 'Size', options: [{ id: 'baguette', label: 'Baguette', price: 6 }]
  },
  {
    id: 'olive-focaccia', img:'assets/img/shop/bread-olive-focaccia.jpg', name: 'Olive Focaccia',
    cat: 'bakery', catLabel: 'Breads', tone: 6, price: 10, seasons: [], rank: 64,
    desc: 'Olive oil focaccia dimpled with olives and rosemary.',
    short: 'Olive oil focaccia with olives and rosemary.',
    optionLabel: 'Size', options: [{ id: 'slab', label: 'Slab', price: 10 }]
  },

  /* Sandwiches */
  {
    id: 'smoked-ham-croissant', img:'assets/img/shop/sand-ham-croissant.jpg', name: 'Smoked Ham Croissant',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 3, price: 12, seasons: [], rank: 65,
    gallery: ['assets/img/shop/group-croissant-sandwiches.jpg'],
    desc: 'Butter croissant generously filled with shaved smoked ham.',
    short: 'Butter croissant filled with shaved smoked ham.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 12 }]
  },
  {
    id: 'scrambled-egg-croissant', img:'assets/img/shop/sand-egg-croissant.jpg', name: 'Scrambled Egg Croissant',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 3, price: 12, seasons: [], rank: 66,
    gallery: ['assets/img/shop/group-croissant-sandwiches.jpg'],
    desc: 'Soft scrambled eggs in a butter croissant, finished with grated Parmesan and chives.',
    short: 'Soft scrambled eggs, Parmesan and chives.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 12 }]
  },
  {
    id: 'roast-beef-rye', img:'assets/img/shop/sand-roast-beef-rye.jpg', name: 'Roast Beef & Rocket on Rye',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 1, price: 16, seasons: [], rank: 67,
    gallery: ['assets/img/shop/group-sandwiches.jpg'],
    desc: 'Thinly sliced roast beef with peppery rocket on a seeded rye baguette.',
    short: 'Roast beef and rocket on a seeded rye baguette.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 16 }]
  },
  {
    id: 'tuna-melt-baguette', img:'assets/img/shop/sand-tuna-melt.jpg', name: 'Tuna Melt Baguette',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 3, price: 14, seasons: [], rank: 68,
    desc: 'Tuna and melted cheese with ripe tomato and rocket in a crusty baguette.',
    short: 'Tuna, melted cheese, tomato and rocket.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 14 }]
  },
  {
    id: 'prawn-brioche', img:'assets/img/shop/sand-prawn-brioche.jpg', name: 'Prawn Brioche Bun',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 3, price: 16, seasons: [], rank: 69,
    gallery: ['assets/img/shop/group-sandwiches.jpg'],
    desc: 'Tiger prawns in a light spiced mayonnaise with greens, in a toasted sesame brioche.',
    short: 'Spiced prawns and greens in a sesame brioche.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 16 }]
  },
  {
    id: 'bacon-egg-brioche', img:'assets/img/shop/sand-bacon-egg-brioche.jpg', name: 'Bacon & Egg Brioche',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 3, price: 14, seasons: [], rank: 70,
    desc: 'Crisp bacon and a sunny-side egg in a toasted brioche bun.',
    short: 'Crisp bacon and a sunny-side egg in toasted brioche.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 14 }]
  },
  {
    id: 'sourdough-melt', img:'assets/img/shop/sand-sourdough-melt.jpg', name: 'Toasted Sourdough Melt',
    cat: 'bakery', catLabel: 'Sandwiches', tone: 3, price: 14, seasons: [], rank: 71,
    desc: 'Toasted sourdough with smoked chicken, mozzarella and sun-dried tomato.',
    short: 'Smoked chicken, mozzarella and sun-dried tomato on sourdough.',
    optionLabel: 'Quantity', options: [{ id: '1', label: 'Single', price: 14 }]
  }
];

/* ---------- Experiences ---------- */
YQ.experiences = [
  { id:'grand-dining', img:'assets/img/e-dining.jpg', name:'Grand Dining Experience', tone:2, price:200, rating:4.8, reviews:128,
    duration:'Flexible', place:'All Restaurants',
    desc:'A $200 dining voucher valid at all Grand Hyatt Singapore restaurants. Perfect for food lovers.' },
  { id:'spa-retreat', img:'assets/img/e-spa.jpg', name:'Spa Wellness Retreat', tone:6, price:280, rating:4.9, reviews:96,
    duration:'90 minutes', place:'Damai Spa',
    desc:'A 90-minute signature massage plus access to our spa facilities. Pure relaxation and renewal.' },
  { id:'afternoon-tea', img:'assets/img/e-afternoon-tea.jpg', name:'Grand Afternoon Tea', tone:3, price:68, rating:4.7, reviews:84,
    duration:'2 hours', place:'The Lounge',
    desc:'An elegant afternoon tea experience with premium teas, scones, and delicate pastries.' },
  { id:'wine-tasting', img:'assets/img/e-wine-tasting.jpg', name:'Private Wine Tasting', tone:5, price:158, rating:4.9, reviews:52,
    duration:'1.5 hours', place:'Brix Wine Bar', badge:'Limited',
    desc:'Guided wine tasting session with our sommelier featuring premium selections from our cellar.' },
  { id:'chefs-table', img:'assets/img/e-chefs-table.jpg', name:"Chef's Table Experience", tone:1, price:328, rating:5.0, reviews:34,
    duration:'3 hours', place:'Grand Kitchen', badge:'Bestseller',
    desc:'Exclusive cooking class with our executive chef. Learn signature dishes and techniques.' },
  { id:'weekend-staycation', img:'assets/img/e-staycation.jpg', name:'Weekend Staycation', tone:8, price:458, rating:4.8, reviews:215,
    duration:'1 night', place:'Grand Hyatt Singapore',
    desc:'Luxurious overnight stay with breakfast, spa credit, and late checkout.' }
];

/* ---------- Giới thiệu bạn bè (trang member/invite.html) ----------
   `channels` quyết định có những nút chia sẻ nào, theo đúng thứ tự khai báo:
     kind 'share' -> mở cửa sổ chia sẻ ({u} = link mời, {t} = lời nhắn)
     kind 'mail'  -> mở ứng dụng email
   Thêm WhatsApp/X chỉ cần thêm một dòng, không phải sửa controller.
   id phải có trong YQ.brandIcon thì mới có logo (email/copy dùng YQ.icon).
*/
YQ.referral = {
  reward: 20,                 // ưu đãi cho cả người mời lẫn người được mời
  landing: 'index.html',      // trang link mời trỏ tới
  codePrefix: 'GH-',
  message: 'I shop for gifts at Grand Hyatt Singapore — here is $20 off your first order.',
  channels: [
    { id: 'facebook', label: 'Facebook', kind: 'share',
      url: 'https://www.facebook.com/sharer/sharer.php?u={u}' },
    { id: 'line', label: 'LINE', kind: 'share',
      url: 'https://social-plugins.line.me/lineit/share?url={u}&text={t}' },
    { id: 'email', label: 'Email', kind: 'mail', icon: 'mail' }
  ]
};

/* ---------- Hồ sơ thành viên (mẫu) ----------
   member/profile.html là HTML TĨNH (backend đổ dữ liệu thẳng vào markup), không
   render từ đây. Bản mẫu này chỉ còn nạp vào YQ.profile (app.js) cho lần truy cập
   đầu, phục vụ password.html (email, ngày đổi mật khẩu) và invite.html (memberNo
   -> mã giới thiệu). Giá trị nên khớp với những gì đang ghi trong profile.html.
*/
YQ.demoProfile = {
  memberNo: '000001991', memberType: 'Member', idCard: '', cardName: 'son nguyen',
  referral: '', joinDate: '2020-12-24', expiryDate: '2026-12-31',
  firstName: 'son', lastName: 'nguyen', title: '', gender: '', marital: '',
  birthday: '1994-02-02', nationality: '', passport: '', language: 'English',
  email: 'sonnguyen@myghs.com', mobile: '6512332432', homePhone: '', officePhone: '',
  fax: '', company: '',
  address1: '#123 50 Coronation Rd W, Singapore 269264',
  city: '', state: '', postal: '', country: 'Singapore'
};

/* ---------- Lịch sử đơn hàng (trang member/orders.html) ----------
   Chỉ tham chiếu theo id sản phẩm + optionId; tên/giá/ảnh lấy từ YQ.products
   nên sửa giá một chỗ là cả lịch sử đơn cập nhật theo.
     status : 'completed' (đã thanh toán) | 'pending' (chờ thanh toán)
     date   : ISO 'YYYY-MM-DD', hiển thị thành '06-February-2026'
   Thay mảng này bằng dữ liệu từ API khi có backend.
*/
YQ.orders = [
  { id: '354646799', date: '2026-08-21', status: 'completed', items: [
    { id: 'signature-chocolate-cake', optionId: 'medium',  qty: 1 },
    { id: 'the-grand-hamper',         optionId: 'classic', qty: 1 },
    { id: 'grand-pralines',           optionId: '12',      qty: 2 },
    { id: 'gh-champagne-brut',        optionId: 'bottle',  qty: 1 }
  ]},
  { id: '868514922', date: '2026-06-14', status: 'completed', items: [
    { id: 'cellar-selection-trio', optionId: 'trio', qty: 1 }
  ]},
  { id: '423838196', date: '2026-02-06', status: 'completed', items: [
    { id: 'festive-yule-log',   optionId: 'reg', qty: 1 },
    { id: 'artisan-cookie-box', optionId: '16',  qty: 2 }
  ]},
  { id: '771204558', date: '2026-09-05', status: 'pending', items: [
    { id: 'prosperity-yusheng', optionId: '10',   qty: 1 },
    { id: 'brix-tote',          optionId: 'sand', qty: 2 }
  ]},
  { id: '690318742', date: '2026-09-01', status: 'pending', items: [
    { id: 'damai-wellness-set', optionId: 'complete', qty: 1 },
    { id: 'afternoon-tea-two',  optionId: 'bubbly',   qty: 1 }
  ]}
];

/* ---------- eCard designs ---------- */
YQ.cardDesigns = [
  { id:'gold',   name:'Classic Gold',  art:'art-gold',   glyph:'✦', theme:'' },
  { id:'floral', name:'Floral Bloom',  art:'art-floral', glyph:'❀', theme:'yq-ecard--floral' },
  { id:'red',    name:'Festive Red',   art:'art-red',    glyph:'✦', theme:'yq-ecard--red' },
  { id:'min',    name:'Minimalist',    art:'art-min',    glyph:'◇', theme:'yq-ecard--min' }
];

/* ---------- Store config ---------- */
YQ.config = {
  currency: 'S$',
  currencySymbol: '$',
  currencyCode: 'SGD',
  shipping: 15,
  freeShippingThreshold: 300,  // T&C The Shop: free 1 lần giao cho đơn từ SGD 300
  taxRate: 0.09,
  physicalCardFee: 5
};

/* ---------- Demo cart ----------
   Giỏ hàng lưu ở localStorage nên lần đầu mở cart.html/checkout.html sẽ trống trơn.
   Danh sách dưới đây được nạp sẵn cho lần truy cập đầu tiên để có dữ liệu xem thử.
     - Chỉ tham chiếu theo id (không chép tên/giá) -> đổi giá trong YQ.products là đủ.
     - Người dùng tự xoá hết giỏ thì KHÔNG nạp lại (localStorage đã có key).
     - Nạp lại thủ công: mở `cart.html?demo=1` hoặc gọi YQ.cart.seed(true) trong console.
     - Tắt hẳn khi lên production: đặt YQ.demoCart = [].
   Mỗi dòng: { id | exp, optionId, qty, addonLabel, addonFee }
     id  = id trong YQ.products    | exp = id trong YQ.experiences
*/
YQ.demoCart = [
  { id: 'signature-chocolate-cake', optionId: 'medium',  qty: 1 },
  { id: 'grand-pralines',           optionId: '24',      qty: 2 },
  { id: 'the-grand-hamper',         optionId: 'classic', qty: 1 },
  { exp: 'spa-retreat', optionId: 'gold-ecard', qty: 1, addonLabel: 'Classic Gold eCard', addonFee: 0 }
];
