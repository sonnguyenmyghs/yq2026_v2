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
    card:     '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="M3 10h18"/>'
  }[name] || '';
  return '<svg class="gh-i" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
         p + '</svg>';
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

/* ---------- Navigation ---------- */
GH.nav = [
  { label: 'The Online Shop', href: 'index.html', key: 'home' },
  { label: 'Experiences',     href: 'experiences.html', key: 'experiences' },
  { label: 'Celebrations',    href: 'celebrations.html', key: 'celebrations' },
  { sep: true },
  { label: 'Shop by Category', href: 'shop.html', key: 'shop', mega: true },
  { sep: true },
  { label: 'Retreats',            href: 'shop.html?season=retreats',  key: 'retreats' },
  { label: 'The Festive Season',  href: 'shop.html?season=festive',   key: 'festive' },
  { label: "New Year's Eve Events", href: 'shop.html?season=nye',     key: 'nye' },
  { label: "Father's Day Brunch", href: 'shop.html?season=fathers',   key: 'fathers' },
  { label: 'Chinese New Year',    href: 'shop.html?season=cny',       key: 'cny' }
];

GH.megaMenu = [
  { title: 'Shop', links: [
    ['Cakes & Pastries',   'shop.html?cat=cakes'],
    ['Hampers & Gift Sets','shop.html?cat=celebration'],
    ['Wines & Champagne',  'shop.html?cat=beverages'],
    ['Wellness & Spa',     'shop.html?cat=wellness'],
    ['Brix Merchandise',   'shop.html?cat=brix'],
    ['Dining Vouchers',    'shop.html?cat=dining'],
    ['View All Products',  'shop.html']
  ]},
  { title: 'Experiences', links: [
    ['Dining Experiences','experiences.html'],
    ['Spa & Wellness',    'experiences.html'],
    ['Afternoon Tea',     'experiences.html'],
    ["Chef's Table",      'experiences.html'],
    ['Weekend Staycation','experiences.html'],
    ['Corporate Gifting', 'celebrations.html']
  ]},
  { title: 'Occasions', links: [
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
  shipping: 15,
  freeShippingThreshold: 150,
  taxRate: 0.09,
  physicalCardFee: 5
};
