/* ==========================================================================
   GH eStore — Data layer (nav, icons, products, experiences)
   Thay bằng API/CMS thật khi tích hợp backend.
   ========================================================================== */
window.GH = window.GH || {};

/* ---------- Inline SVG icons ---------- */
GH.icon = function (name, size) {
  var s = size || 18;
  var p = {
    search:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/>',
    bag:      '<path d="M6 7h12l-1 13H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
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
  return '<svg class="gh-i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
         p + '</svg>';
};

/* ---------- Brand glyph (nút social login) ----------
   Logo hãng có viewBox riêng nên tách khỏi GH.icon (bộ icon nét 24x24).
   Đường path lấy từ bộ Font Awesome Free brands (CC BY 4.0); tên và biểu tượng
   là nhãn hiệu của chủ sở hữu — chỉ dùng để chỉ nhà cung cấp đăng nhập.
*/
GH.brandIcon = function (name, size) {
  var g = {
    facebook:  ['0 0 320 512', 'M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z'],
    twitter:   ['0 0 512 512', 'M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558A296.63 296.63 0 0 1 0 416.827a217.17 217.17 0 0 0 25.34 1.3c49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772a132.6 132.6 0 0 0 19.818 1.624 105 105 0 0 0 27.614-3.573C58.855 288.828 22.792 246.596 22.792 195.59v-1.299a105.5 105.5 0 0 0 47.432 13.319c-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807a121 121 0 0 1-2.599-24.04c0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827a209 209 0 0 0 60.426-16.243 225 225 0 0 1-52.628 54.253z'],
    linkedin:  ['0 0 448 512', 'M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3z'],
    google:    ['0 0 488 512', 'M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z'],
    microsoft: ['0 0 448 512', 'M0 32h214.6v214.6H0zm233.4 0H448v214.6H233.4zM0 265.4h214.6V480H0zm233.4 0H448V480H233.4z'],
    line:      ['0 0 448 512', 'M272.1 204.2v71.1c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.1 0-2.1-.6-2.6-1.3l-32.6-44v42.2c0 1.8-1.4 3.2-3.2 3.2h-11.4c-1.8 0-3.2-1.4-3.2-3.2v-71.1c0-1.8 1.4-3.2 3.2-3.2H219c1 0 2.1.5 2.6 1.4l32.6 44v-42.2c0-1.8 1.4-3.2 3.2-3.2h11.4c1.8-.1 3.3 1.4 3.3 3.1zm-82-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 1.8 1.4 3.2 3.2 3.2h11.4c1.8 0 3.2-1.4 3.2-3.2v-71.1c0-1.7-1.4-3.2-3.2-3.2zm-27.5 59.6h-31.1v-56.4c0-1.8-1.4-3.2-3.2-3.2h-11.4c-1.8 0-3.2 1.4-3.2 3.2v71.1c0 .9.3 1.6.9 2.2.6.5 1.3.9 2.2.9h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.7-1.4-3.2-3.1-3.2zM332.1 201h-45.7c-1.7 0-3.2 1.4-3.2 3.2v71.1c0 1.7 1.4 3.2 3.2 3.2h45.7c1.8 0 3.2-1.4 3.2-3.2v-11.4c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2V234c0-1.8-1.4-3.2-3.2-3.2H301v-12h31.1c1.8 0 3.2-1.4 3.2-3.2v-11.4c-.1-1.7-1.5-3.2-3.2-3.2zM448 113.7V399c-.1 63.6-51.9 115.1-115.6 115H63c-63.6-.1-115.1-52-115-115.6V113c.1-63.6 52-115.1 115.6-115H385c63.6.1 115.1 51.9 115 115.7zm-107.4 99.9c0-70.5-70.7-127.8-157.5-127.8S25.6 143.1 25.6 213.6c0 63.2 56.1 116.1 131.8 126.1 18.5 4 16.4 10.8 12.2 35.8-.7 4-3.2 15.7 13.8 8.6s91.6-54 125-92.4c23-25.3 33.2-51 33.2-78.1z']
  }[name];
  if (!g) return '';
  return '<svg class="gh-brandi" width="' + (size || 18) + '" height="' + (size || 18) + '" ' +
         'viewBox="' + g[0] + '" fill="currentColor" aria-hidden="true"><path d="' + g[1] + '"/></svg>';
};

/* ---------- Logo ----------
   Mặc định: lockup dựng bằng HTML/CSS (nét mảnh, giãn chữ) — luôn sắc nét, đổi màu 1 dòng CSS.
   Có logo chính thức? Gán đường dẫn vào GH.logoImage (và GH.logoImageLight cho nền tối)
   là toàn site tự chuyển sang dùng ảnh, không phải sửa gì thêm.
   VD: GH.logoImage = 'assets/img/logo-grand-hyatt.png';
*/
GH.logoImage = null;        // logo cho nền sáng (header)
GH.logoImageLight = null;   // logo đảo màu cho nền tối (footer)

GH.logo = function (opts) {
  opts = opts || {};
  var light = !!opts.light;
  var cls = 'gh-logo' + (light ? ' gh-logo--light' : '') + (opts.className ? ' ' + opts.className : '');
  var label = 'Grand Hyatt Singapore';
  var img = light ? (GH.logoImageLight || GH.logoImage) : GH.logoImage;

  var inner = img
    ? '<img class="gh-logo__img" src="' + img + '" alt="' + label + '">'
    : '<span class="gh-logo__mark">' +
        '<span class="gh-logo__word">Grand</span>' +
        '<span class="gh-logo__bar" aria-hidden="true"></span>' +
        '<span class="gh-logo__word">Hyatt</span>' +
        '<span class="gh-logo__tm" aria-hidden="true">\u2122</span>' +
      '</span>' +
      '<span class="gh-logo__sub">Singapore</span>';

  if (opts.tag === 'div') return '<div class="' + cls + '" role="img" aria-label="' + label + '">' + inner + '</div>';
  return '<a class="' + cls + '" href="' + (opts.href || 'index.html') + '" aria-label="' + label + '">' + inner + '</a>';
};

/* ---------- Navigation ----------
   Nav 2 tầng cho gọn hàng ngang:
     - 4 mục chính luôn hiện: The Online Shop / Shop by Category / Experiences / Celebrations
     - Nhóm mùa vụ (Retreats, Festive, NYE, Father's Day, CNY) gom vào 1 mục "Seasonal"
       mở panel dropdown -> nav chỉ còn 5 mục, thoáng và có phân cấp rõ.
   Thuộc tính:
     panel     : 'mega' | 'seasonal'  -> mục này mở panel thả xuống
     megaIndex : chỉ số cột trong GH.megaMenu dùng làm submenu (accordion trên mobile)
     children  : danh sách con (dùng cho panel 'seasonal' + accordion mobile)
*/
GH.nav = [
  { label: 'The Online Shop',  href: 'index.html',        key: 'home' },
  { label: 'Shop by Category', href: 'shop.html',         key: 'shop',         panel: 'mega', megaIndex: 0 },
  { label: 'Experiences',      href: 'experiences.html',  key: 'experiences',  megaIndex: 1 },
  { label: 'Celebrations',     href: 'celebrations.html', key: 'celebrations', megaIndex: 2 },
  {
    label: 'Seasonal', key: 'seasonal', panel: 'seasonal',
    intro: 'Limited-time menus, hampers and events — available for a short season only.',
    children: [
      { label: 'The Festive Season',    href: 'shop.html?season=festive',  key: 'festive',  icon: 'sparkle',  tag: 'Now on',
        desc: 'Yule logs, festive hampers & gifting' },
      { label: 'Chinese New Year',      href: 'shop.html?season=cny',      key: 'cny',      icon: 'gift',
        desc: 'Yusheng, pen cai & prosperity hampers' },
      { label: "New Year's Eve Events", href: 'shop.html?season=nye',      key: 'nye',      icon: 'star',
        desc: 'Countdown dinners & celebration packages' },
      { label: "Father's Day Brunch",   href: 'shop.html?season=fathers',  key: 'fathers',  icon: 'users',
        desc: 'Free-flow brunch and gifts for him' },
      { label: 'Retreats',              href: 'shop.html?season=retreats', key: 'retreats', icon: 'leaf',
        desc: 'Wellness escapes, spa journeys & stays' }
    ]
  }
];

GH.megaMenu = [
  { title: 'Shop', href: 'shop.html', links: [
    ['Cakes & Pastries',   'shop.html?cat=cakes'],
    ['Hampers & Gift Sets','shop.html?cat=celebration'],
    ['Wines & Champagne',  'shop.html?cat=beverages'],
    ['Wellness & Spa',     'shop.html?cat=wellness'],
    ['Brix Merchandise',   'shop.html?cat=brix'],
    ['Dining Vouchers',    'shop.html?cat=dining'],
    ['View All Products',  'shop.html']
  ]},
  { title: 'Experiences', href: 'experiences.html', links: [
    ['Dining Experiences','experiences.html'],
    ['Spa & Wellness',    'experiences.html'],
    ['Afternoon Tea',     'experiences.html'],
    ["Chef's Table",      'experiences.html'],
    ['Weekend Staycation','experiences.html'],
    ['Corporate Gifting', 'celebrations.html']
  ]},
  { title: 'Occasions', href: 'celebrations.html', links: [
    ['Birthdays',      'celebrations.html'],
    ['Anniversaries',  'celebrations.html'],
    ['Festive Season', 'shop.html?season=festive'],
    ['Chinese New Year','shop.html?season=cny'],
    ['Corporate',      'celebrations.html'],
    ['Personalise a Gift','personalise.html']
  ]}
];

/* ---------- Category filters ---------- */
GH.categories = [
  { id: 'all',         label: 'All Products' },
  { id: 'cakes',       label: 'Cakes, Cookies & Pralines' },
  { id: 'dining',      label: 'Dining' },
  { id: 'beverages',   label: 'Beverages' },
  { id: 'wellness',    label: 'Wellness' },
  { id: 'brix',        label: 'Brix Merchandise' },
  { id: 'celebration', label: 'Celebration' }
];

GH.seasons = [
  { id: 'festive',  label: 'The Festive Season' },
  { id: 'retreats', label: 'Retreats' },
  { id: 'cny',      label: 'Chinese New Year' },
  { id: 'fathers',  label: "Father's Day Brunch" },
  { id: 'nye',      label: "New Year's Eve Events" }
];

/* ---------- Products ---------- */
GH.products = [
  {
    id: 'signature-chocolate-cake', img:'assets/img/p-chocolate-cake.jpg', name: 'Signature Chocolate Cake',
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 1, badge: 'Bestseller',
    price: 78, seasons: ['festive'], featured: true, rank: 1,
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
    id: 'grand-pralines', img:'assets/img/p-pralines.jpg', name: 'Grand Pralines Collection',
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 8, badge: 'Bestseller',
    price: 58, seasons: ['festive','cny'], featured: true, rank: 2,
    desc: '24 handcrafted pralines in an elegant gold gift box. Dark, milk, and white chocolate shells filled with single-origin ganache.',
    short: '24 handcrafted pralines in an elegant gold gift box. Dark, milk, and white chocolate.',
    optionLabel: 'Box size',
    options: [
      { id: '12', label: '12 pieces', price: 58 },
      { id: '24', label: '24 pieces', price: 98 }
    ]
  },
  {
    id: 'the-grand-hamper', img:'assets/img/p-grand-hamper.jpg', name: 'The Grand Hamper',
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
    id: 'the-pantry-hamper', img:'assets/img/p-pantry-hamper.jpg', name: 'The Pantry Hamper',
    cat: 'celebration', catLabel: 'Hampers', tone: 6, badge: 'New',
    price: 168, seasons: ['festive'], featured: true, rank: 5, meta: '8 items',
    desc: 'A collection of gourmet pantry essentials—artisan honey, olive oil, preserves, and hand-baked crackers from our kitchens.',
    short: 'A collection of gourmet pantry essentials—artisan honey, preserves, and crackers.',
    optionLabel: 'Presentation',
    options: [{ id: 'std', label: 'Signature basket', price: 168 }]
  },
  {
    id: 'cellar-selection-trio', img:'assets/img/p-cellar-trio.jpg', name: 'Cellar Selection Trio',
    cat: 'beverages', catLabel: 'Wine & Champagne', tone: 5, badge: 'New',
    price: 288, seasons: ['festive','nye'], featured: true, rank: 6, meta: '3 bottles',
    desc: 'Three bottles of our finest wines—one red, one white, one sparkling—selected by our head sommelier and presented in a wooden case.',
    short: 'Three bottles of our finest wines—one red, one white, one sparkling.',
    optionLabel: 'Case',
    options: [{ id: 'trio', label: 'Wooden gift case', price: 288 }]
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
    cat: 'cakes', catLabel: 'Cakes & Pastries', tone: 1, badge: 'Seasonal',
    price: 88, seasons: ['festive','nye'], rank: 12,
    desc: 'A chestnut and dark chocolate bûche finished with meringue mushrooms and a dusting of snow sugar.',
    short: 'A chestnut and dark chocolate bûche, finished with meringue and snow sugar.',
    optionLabel: 'Size',
    options: [
      { id: 'reg', label: 'Serves 6', price: 88 },
      { id: 'lg',  label: 'Serves 12', price: 138 }
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
  }
];

/* ---------- Experiences ---------- */
GH.experiences = [
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

/* ---------- Occasions (Celebrations page) ---------- */
GH.occasions = [
  { name:'Birthdays', img:'assets/img/o-birthdays.jpg',     tone:3, sub:'Cakes, candles & keepsakes', href:'shop.html?cat=cakes' },
  { name:'Anniversaries', img:'assets/img/o-anniversaries.jpg', tone:4, sub:'Champagne & fine dining',    href:'shop.html?cat=beverages' },
  { name:'Festive Season', img:'assets/img/o-festive.jpg',tone:8, sub:'Hampers & seasonal treats',  href:'shop.html?season=festive' },
  { name:'Corporate', img:'assets/img/o-corporate.jpg',     tone:6, sub:'Bulk gifting & branding',    href:'celebrations.html#corporate' }
];

/* ---------- Giới thiệu bạn bè (trang member/invite.html) ----------
   `channels` quyết định có những nút chia sẻ nào, theo đúng thứ tự khai báo:
     kind 'share' -> mở cửa sổ chia sẻ ({u} = link mời, {t} = lời nhắn)
     kind 'mail'  -> mở ứng dụng email
   Thêm WhatsApp/X chỉ cần thêm một dòng, không phải sửa controller.
   id phải có trong GH.brandIcon thì mới có logo (email/copy dùng GH.icon).
*/
GH.referral = {
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

/* ---------- Hồ sơ thành viên (trang member/profile.html) ----------
   GH.profileGroups = SƠ ĐỒ trường (nhóm nào, nhãn gì, sửa được không).
   GH.demoProfile   = GIÁ TRỊ mẫu, nạp cho lần truy cập đầu (như GH.demoCart).
   Tách đôi để khi nối backend chỉ cần đổ dữ liệu vào GH.profile, giữ nguyên sơ đồ.

   Mỗi trường: { key, label, type, ro, options }
     type : 'text' | 'email' | 'tel' | 'date' | 'select'   (mặc định 'text')
     ro   : true  -> chỉ đọc, không hiện ô nhập khi bấm "Edit my information"
*/
GH.profileGroups = [
  { title: 'Membership', icon: 'star', fields: [
    { key: 'memberNo',   label: 'Membership No.', ro: true },
    { key: 'memberType', label: 'Member Type',    ro: true },
    { key: 'idCard',     label: 'ID Card' },
    { key: 'cardName',   label: 'Card Name' },
    { key: 'referral',   label: 'Member Referral' },
    { key: 'joinDate',   label: 'Join date',   type: 'date', ro: true },
    { key: 'expiryDate', label: 'Expiry date', type: 'date', ro: true }
  ]},
  { title: 'Personal details', icon: 'user', fields: [
    { key: 'firstName',  label: 'First name' },
    { key: 'lastName',   label: 'Last name' },
    { key: 'title',      label: 'Title',          type: 'select', options: ['Mr', 'Ms', 'Mrs', 'Dr'] },
    { key: 'gender',     label: 'Gender',         type: 'select', options: ['Male', 'Female', 'Prefer not to say'] },
    { key: 'marital',    label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Prefer not to say'] },
    { key: 'birthday',   label: 'Birthday',    type: 'date' },
    { key: 'nationality',label: 'Nationality' },
    { key: 'passport',   label: 'Passport No.' },
    { key: 'language',   label: 'Language', type: 'select', options: ['English', 'Bahasa Indonesia', '中文', '日本語'] }
  ]},
  { title: 'Contact', icon: 'phone', fields: [
    { key: 'email',       label: 'Email',        type: 'email' },
    { key: 'mobile',      label: 'Mobile Phone', type: 'tel' },
    { key: 'homePhone',   label: 'Home Phone',   type: 'tel' },
    { key: 'officePhone', label: 'Office Phone', type: 'tel' },
    { key: 'fax',         label: 'Fax Number',   type: 'tel' },
    { key: 'company',     label: 'Company' }
  ]},
  { title: 'Address', icon: 'pin', fields: [
    { key: 'address1', label: 'Address 1' },
    { key: 'city',     label: 'City' },
    { key: 'state',    label: 'State' },
    { key: 'postal',   label: 'Postal Code' },
    { key: 'country',  label: 'Country of residence' }
  ]}
];

GH.demoProfile = {
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
   Chỉ tham chiếu theo id sản phẩm + optionId; tên/giá/ảnh lấy từ GH.products
   nên sửa giá một chỗ là cả lịch sử đơn cập nhật theo.
     status : 'completed' (đã thanh toán) | 'pending' (chờ thanh toán)
     date   : ISO 'YYYY-MM-DD', hiển thị thành '06-February-2026'
   Thay mảng này bằng dữ liệu từ API khi có backend.
*/
GH.orders = [
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

/* ---------- Tài khoản: social login + menu member ----------
   Dùng bởi assets/js/modules/account.js (popup Log in / Register + panel My Functions).
   Menu member: mỗi mục có `view` (mở pane trong panel), `href` (điều hướng trang thật)
   hoặc `action` ('logout'). Có `href` thì `view` bị bỏ qua -> khi backend có trang
   /my-orders chỉ cần điền href, không phải sửa module.
*/
GH.socialLogins = [
  { id: 'facebook',  label: 'Facebook'  },
  { id: 'twitter',   label: 'Twitter'   },
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'google',    label: 'Google'    },
  { id: 'microsoft', label: 'Microsoft' }
];

GH.memberMenu = [
  { key: 'profile',  label: 'My profile',      icon: 'user',     href: 'member/profile.html' },
  { key: 'orders',   label: 'My Order',        icon: 'bag',      href: 'member/orders.html' },
  { key: 'wallet',   label: 'My Wallet',       icon: 'wallet',   view: 'wallet'   },
  { key: 'password', label: 'Change Password', icon: 'lock',     href: 'member/password.html' },
  { key: 'invite',   label: 'Invite Friends',  icon: 'userplus', href: 'member/invite.html' },
  { key: 'logout',   label: 'Logout',          icon: 'logout',   action: 'logout' }
];

/* ---------- eCard designs ---------- */
GH.cardDesigns = [
  { id:'gold',   name:'Classic Gold',  art:'art-gold',   glyph:'✦', theme:'' },
  { id:'floral', name:'Floral Bloom',  art:'art-floral', glyph:'❀', theme:'gh-ecard--floral' },
  { id:'red',    name:'Festive Red',   art:'art-red',    glyph:'✦', theme:'gh-ecard--red' },
  { id:'min',    name:'Minimalist',    art:'art-min',    glyph:'◇', theme:'gh-ecard--min' }
];

/* ---------- Store config ---------- */
GH.config = {
  currency: 'S$',
  currencySymbol: '$',
  currencyCode: 'SGD',
  shipping: 15,
  freeShippingThreshold: 150,
  taxRate: 0.09,
  physicalCardFee: 5
};

/* ---------- Demo cart ----------
   Giỏ hàng lưu ở localStorage nên lần đầu mở cart.html/checkout.html sẽ trống trơn.
   Danh sách dưới đây được nạp sẵn cho lần truy cập đầu tiên để có dữ liệu xem thử.
     - Chỉ tham chiếu theo id (không chép tên/giá) -> đổi giá trong GH.products là đủ.
     - Người dùng tự xoá hết giỏ thì KHÔNG nạp lại (localStorage đã có key).
     - Nạp lại thủ công: mở `cart.html?demo=1` hoặc gọi GH.cart.seed(true) trong console.
     - Tắt hẳn khi lên production: đặt GH.demoCart = [].
   Mỗi dòng: { id | exp, optionId, qty, addonLabel, addonFee }
     id  = id trong GH.products    | exp = id trong GH.experiences
*/
GH.demoCart = [
  { id: 'signature-chocolate-cake', optionId: 'medium',  qty: 1 },
  { id: 'grand-pralines',           optionId: '24',      qty: 2 },
  { id: 'the-grand-hamper',         optionId: 'classic', qty: 1 },
  { exp: 'spa-retreat', optionId: 'gold-ecard', qty: 1, addonLabel: 'Classic Gold eCard', addonFee: 0 }
];
