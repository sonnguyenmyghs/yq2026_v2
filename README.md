# Grand Hyatt Singapore — eStore V4

Layout template dựng theo file `Grand_Hyatt_Singapore_eStore V4 Discussion.pdf`.
Stack: **HTML + CSS + Bootstrap 5 + jQuery 3** (static, không cần build tool).

---

## Chạy thử

Mở trực tiếp `index.html` bằng trình duyệt, hoặc chạy server tĩnh:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

---

## Cấu trúc

```
├── index.html            Trang chủ — hero "Gifts of Distinction", USP, featured, occasions, experiences
├── shop.html             All Products — filter theo category + seasonal, sort, badge Bestseller/New
├── product.html          Chi tiết sản phẩm — gallery, chọn size, quantity, add to cart, cross-sell
├── experiences.html      Unforgettable Experiences — grid có rating, duration, địa điểm, "From $X"
├── celebrations.html     Seasonal Highlights — occasion tiles, guest favorites, corporate gifting
├── personalise.html      Personalise Your Gift — chọn eCard, viết lời nhắn, LIVE PREVIEW (3 bước)
├── cart.html             Giỏ hàng — line items, order summary, thanh free-shipping
├── checkout.html         Checkout 4 bước: Information → Shipping → Payment → Review
├── member/               Khu vực thành viên (xem mục "Trang trong thư mục con")
│   ├── profile.html      Member Profile — thẻ tóm tắt + nhóm thông tin, sửa tại chỗ
│   ├── orders.html       My Orders — 2 tab Completed orders / Pending payment, ReOrder
│   ├── password.html     Change Password — thanh sức mạnh + 4 điều kiện tự tick
│   └── invite.html       Invite Friends — link mời, chia sẻ Facebook / LINE / email
└── assets/
    ├── css/style.css     Design tokens + toàn bộ component
    ├── css/parts/        CSS theo module: nav, banner, buynow, cart-anim, account
    ├── img/favicon.svg
    └── js/
        ├── data.js       Nav, icon, logo, 13 sản phẩm, 6 experiences, đơn hàng, hồ sơ, config
        ├── app.js        Helper, cart + profile (localStorage), header/footer, toast, reveal
        ├── pages.js      Component (card, tile, summary) + controller từng trang
        └── modules/      Tính năng rời, mỗi file một việc:
            ├── nav.js        Sticky/thu gọn khi cuộn, mega menu, panel Seasonal,
            │                 ô tìm kiếm (phím tắt "/"), offcanvas mobile
            ├── banner.js     Hero slider 3 slide (autoplay, swipe, dot, progress)
            ├── buynow.js     Buy Now ở PDP + card, sticky buy bar mobile
            ├── cart-anim.js  Fly-to-cart, badge đếm, nút "Added", cart drawer
            └── account.js    Popup Log in / Register + panel member "My Functions"
```

Header và footer **không lặp lại trong HTML** — được render bằng jQuery từ `app.js`,
nên sửa nav/footer chỉ cần sửa một chỗ (`GH.nav`, `GH.megaMenu` trong `data.js`).

Mỗi file trong `assets/js/modules/` là một tính năng độc lập, chỉ móc vào DOM và event
có sẵn — xoá file nào thì mất đúng tính năng đó, phần còn lại vẫn chạy. Module chạy đúng
thời điểm nhờ các event do `app.js` bắn ra:

```js
$(document).on('gh:header-ready', fn);   // header render xong
$(document).on('gh:layout-ready', fn);   // cả header + footer xong
$(document).on('gh:cart-changed', fn);   // giỏ hàng đổi
$(document).on('gh:auth-changed', fn);    // đăng nhập / đăng xuất
$(document).on('gh:profile-changed', fn); // hồ sơ thành viên đổi
```

### Trang trong thư mục con

`member/` là thư mục đầu tiên nằm ngoài gốc site. Quy ước để link không gãy:

**Mọi `href`/`src` trong `data.js` và các hàm render đều viết theo GỐC SITE** —
`'shop.html'`, `'member/orders.html'`, `'assets/img/x.jpg'`. Trang trong thư mục con
khai báo `data-root`, còn script/CSS của chính nó trỏ bằng `../`:

```html
<html lang="en" data-root="../">
<link href="../assets/css/style.css" rel="stylesheet">
<script src="../assets/js/app.js"></script>
```

`app.js` đọc thuộc tính đó thành `GH.root` rồi dịch đường dẫn đúng lúc chèn vào DOM:

```js
GH.url('shop.html')       // -> '../shop.html'   (trang ở gốc: giữ nguyên)
GH.localise(htmlString)   // đổi mọi href/src tương đối trong một khối HTML
```

`http(s):`, `mailto:`, `tel:`, `/…` và `#` được bỏ qua. Trang ở gốc có `GH.root = ''`
nên cả hai hàm là no-op.

> **Thêm chỗ chèn HTML mới có link hoặc ảnh thì nhớ bọc `GH.localise()`** — không bọc
> thì chỗ đó gãy khi mở từ `member/`. Các điểm chèn hiện có đã bọc sẵn: header, footer,
> toast, popup/panel account, cart drawer, và cả 4 trang trong `member/`.

---

## Tính năng đã cài

| Trang | Tính năng |
|---|---|
| Toàn site | Sticky header, mega menu (hover), search panel, offcanvas mobile, toast, reveal-on-scroll, tôn trọng `prefers-reduced-motion` |
| Shop | Lọc 7 category + 5 seasonal, 5 kiểu sort, deep-link `?cat=`, `?season=`, `?q=` |
| Product | Đổi option → giá cập nhật, stepper số lượng, accordion thông tin, sản phẩm liên quan |
| Personalise | 4 mẫu eCard, eCard/Physical (+$5), live preview, đếm ký tự 200 |
| Cart | Sửa số lượng, xoá, subtotal/shipping/tax 9%/total, free-ship từ $150 |
| Checkout | 4 bước có validate, auto-format số thẻ & expiry, màn hình xác nhận đơn |
| Header | 5 mục chính + panel Seasonal, thu gọn khi cuộn xuống / hiện lại khi cuộn lên, phím tắt `/` mở tìm kiếm |
| Banner | Hero slider 3 slide (autoplay, prev/next, dot, progress, swipe) + promo strip 2 cột |
| Mua nhanh | Buy Now ở PDP và trên card, sticky buy bar mobile, chặn bấm trùng |
| Thêm giỏ | Ảnh bay theo đường cong vào icon giỏ, badge đếm tăng dần, cart drawer trượt từ phải |
| Tài khoản | Popup "Connect Via": 5 nút social, 2 tab Log in / Register Now, pane quên mật khẩu |
| Member | Panel "My Functions" trượt từ phải: lời chào, Edit hồ sơ, đổi mật khẩu, mời bạn, đăng xuất |
| Đơn hàng | Trang My Orders 2 tab, thẻ đơn mở/đóng, ReOrder đẩy nguyên đơn vào giỏ |
| Hồ sơ | Member Profile: thẻ tóm tắt dính, thanh % hoàn thiện, 4 nhóm thông tin, sửa tại chỗ |
| Mật khẩu | Đổi mật khẩu có thanh sức mạnh 4 mức, checklist điều kiện, nút hiện/ẩn |
| Mời bạn | Link mời riêng theo số thẻ, chia sẻ Facebook / LINE / email, danh sách đã mời |

Giỏ hàng lưu ở `localStorage` (key `gh_cart_v4`) nên giữ nguyên khi chuyển trang.
Lần đầu vào site giỏ được nạp sẵn dữ liệu mẫu từ `GH.demoCart` (`data.js`) để `cart.html`/`checkout.html` có nội dung xem thử — xem mục [Giỏ hàng mẫu](#giỏ-hàng-mẫu).

---

## Tuỳ biến

**Màu / font** — sửa CSS variables đầu `assets/css/style.css`:

```css
:root{
  --gh-ink:  #171613;   /* chữ & nút chính */
  --gh-gold: #C4A46A;   /* accent vàng */
  --gh-cream:#F6F4EF;   /* nền */
  --gh-serif: "Playfair Display", Georgia, serif;
  --gh-sans:  "Inter", -apple-system, sans-serif;
}
```

**Sản phẩm** — sửa mảng `GH.products` trong `assets/js/data.js`.

### Giỏ hàng mẫu

`cart.html` và `checkout.html` render từ `localStorage`, nên máy chưa từng thêm sản phẩm
sẽ thấy trang trống. `GH.demoCart` trong `data.js` nạp sẵn vài dòng hàng cho **lần truy
cập đầu tiên**:

```js
GH.demoCart = [
  { id: 'signature-chocolate-cake', optionId: 'medium',  qty: 1 },
  { id: 'grand-pralines',           optionId: '24',      qty: 2 },
  { id: 'the-grand-hamper',         optionId: 'classic', qty: 1 },
  { exp: 'spa-retreat', optionId: 'gold-ecard', qty: 1, addonLabel: 'Classic Gold eCard', addonFee: 0 }
];
```

- Chỉ tham chiếu theo `id` (`GH.products`) hoặc `exp` (`GH.experiences`) — không chép
  tên/giá, nên sửa giá một chỗ là đủ.
- Người dùng tự xoá giỏ thì **không** nạp lại (localStorage đã có key).
- Nạp lại thủ công: mở `cart.html?demo=1`, hoặc gọi `GH.cart.seed(true)` trong console.
- Lên production: đặt `GH.demoCart = []` là tắt hẳn.

### Tài khoản & menu member

Popup đăng nhập và panel "My Functions" nằm trong `assets/js/modules/account.js`
(+ `assets/css/parts/account.css`). Bấm icon người ở header: chưa đăng nhập thì mở
popup, đã đăng nhập thì mở panel member.

Danh sách nút social và các mục trong panel lấy từ `data.js`:

```js
GH.socialLogins = [ { id:'facebook', label:'Facebook' }, … ];   // id phải có trong GH.brandIcon

GH.memberMenu = [
  { key:'profile', label:'My profile', icon:'user', view:'profile' },  // mở pane trong panel
  { key:'orders',  label:'My Order',   icon:'bag',  href:'my-orders.html' }, // hoặc sang trang thật
  { key:'logout',  label:'Logout',     icon:'logout', action:'logout' }
];
```

Có `href` thì mục đó điều hướng như link bình thường và `view` bị bỏ qua — khi backend
có trang thật chỉ cần điền `href`, không phải sửa module.

Mở popup từ chỗ khác: `GH.account.login()`, `GH.account.register()`, `GH.account.member()`.

### Lịch sử đơn hàng

`orders.html` (controller `GH.initOrders` trong `pages.js`) đọc `GH.orders` ở `data.js`:

```js
GH.orders = [
  { id:'354646799', date:'2026-08-21', status:'completed', items:[
    { id:'signature-chocolate-cake', optionId:'medium', qty:1 }
  ]}
];
```

- `status`: `'completed'` → tab **Completed orders**, nút **ReOrder**;
  `'pending'` → tab **Pending payment**, chip "Awaiting payment" + nút **Pay now**.
- `date` là ISO `YYYY-MM-DD`, hiển thị thành `21-August-2026`.
- Dòng hàng chỉ giữ `id` + `optionId`, tên/giá/ảnh lấy từ `GH.products` — id không còn
  trong catalogue thì dòng đó tự bỏ qua, không vỡ trang.
- Mỗi tab tự mở sẵn đơn mới nhất; các đơn còn lại thu gọn thành `1x Tên … giá`.
- Vào thẳng một tab: `orders.html?tab=pending`.
- ReOrder gắn `data-gh-add` nên dùng lại nguyên hiệu ứng của `cart-anim.js`
  (ảnh bay vào giỏ, nút "Added", cart drawer).
- Mã tiền tệ ở dòng Total lấy từ `GH.config.currencyCode`.

### Hồ sơ thành viên

`member/profile.html` (controller `GH.initProfile`) tách làm hai phần trong `data.js`:

```js
GH.profileGroups = [                     // SƠ ĐỒ: nhóm nào, nhãn gì, sửa được không
  { title:'Membership', icon:'star', fields:[
    { key:'memberNo', label:'Membership No.', ro:true },        // ro = chỉ đọc
    { key:'joinDate', label:'Join date', type:'date', ro:true }
  ]},
  { title:'Personal details', icon:'user', fields:[
    { key:'title', label:'Title', type:'select', options:['Mr','Ms','Mrs','Dr'] }
  ]}
];

GH.demoProfile = { memberNo:'000001991', firstName:'son', … };   // GIÁ TRỊ mẫu
```

- `type`: `text` (mặc định) | `email` | `tel` | `date` | `select`.
- Thêm/bớt/đổi thứ tự trường chỉ cần sửa `GH.profileGroups` — phần xem, phần sửa và
  thanh **% hoàn thiện** đều tự tính lại theo sơ đồ.
- Giá trị lưu ở `localStorage` (`gh_profile_v1`), lần đầu nạp từ `GH.demoProfile`.
- Trường `ro` không bao giờ thành ô nhập, chỉ hiện nhãn "Locked" khi đang sửa.
- Vào thẳng chế độ sửa: `member/profile.html?edit=1` — nút **Edit** trong panel member
  dùng đúng link này. Panel member giờ chỉ còn pane **My Wallet**; hồ sơ, đơn hàng,
  mật khẩu và mời bạn đều là trang riêng để không phải sửa cùng một thứ ở hai nơi.
- Lưu xong, nếu đang đăng nhập thì `GH.auth` được đồng bộ tên + email theo hồ sơ.

### Đổi mật khẩu

`member/password.html` (controller `GH.initPassword`). Bốn điều kiện nằm ngay đầu
controller trong mảng `RULES` — sửa/thêm một dòng là cả checklist lẫn thanh sức mạnh
(4 mức: Weak → Fair → Good → Strong) tự đổi theo.

Chặn: thiếu mật khẩu hiện tại, chưa đủ 4 điều kiện, trùng mật khẩu cũ, nhập lại không
khớp. Lưu xong ghi `passwordChangedAt` vào `GH.profile` để thẻ trái hiện "Last changed".

### Mời bạn bè

`member/invite.html` (controller `GH.initInvite`) đọc `GH.referral` trong `data.js`:

```js
GH.referral = {
  reward: 20,                       // ưu đãi cho cả hai bên
  landing: 'index.html',            // link mời trỏ tới đâu
  codePrefix: 'GH-',                // mã = codePrefix + 6 số cuối của memberNo
  message: 'I shop for gifts at Grand Hyatt Singapore…',
  channels: [
    { id:'facebook', label:'Facebook', kind:'share',
      url:'https://www.facebook.com/sharer/sharer.php?u={u}' },
    { id:'line', label:'LINE', kind:'share',
      url:'https://social-plugins.line.me/lineit/share?url={u}&text={t}' },
    { id:'email', label:'Email', kind:'mail', icon:'mail' }
  ]
};
```

- `kind`: `share` (mở popup chia sẻ, `{u}` = link mời, `{t}` = lời nhắn) | `mail`
  (mở app email) | `copy` (chép clipboard).
- Thêm WhatsApp/X chỉ cần thêm một dòng vào `channels`; có logo khi `id` nằm trong
  `GH.brandIcon`, không thì rơi về `GH.icon(icon)`.
- Link mời là URL tuyệt đối kèm `?ref=<mã>`, mã bám theo `memberNo` nên mỗi người một mã.
- Danh sách đã mời lưu ở `localStorage` (`gh_invites_v1`), tự bỏ email trùng.

> **Chưa nối backend.** Mọi email/mật khẩu đúng định dạng đều đăng nhập được và
> **mật khẩu không được lưu ở đâu cả** — localStorage (`gh_user_v1`) chỉ giữ email,
> tên và tuỳ chọn nhận khuyến mãi. Phần `6. Chỗ nối API` trong `account.js` là 3 hàm
> `apiLogin` / `apiRegister` / `apiSocial`, thay bằng lệnh gọi server thật khi có API.

**Logo** — mặc định logo được dựng bằng HTML/CSS trong `GH.logo()` (`assets/js/data.js`),
nên luôn sắc nét ở mọi kích thước và đổi màu chỉ bằng 1 dòng CSS:

```css
:root{
  --gh-brand:     #C10B44;   /* crimson GRAND | HYATT */
  --gh-brand-sub: #58575B;   /* xám chữ SINGAPORE */
}
```

Khi có file logo chính thức, chỉ cần gán đường dẫn — header, footer và menu mobile tự đổi theo:

```js
// assets/js/data.js
GH.logoImage      = 'assets/img/logo-grand-hyatt.png';       // nền sáng (header)
GH.logoImageLight = 'assets/img/logo-grand-hyatt-white.png'; // nền tối (footer)
```

**Ảnh** — 29 ảnh trong `assets/img/`, đặt tên theo nhóm: `hero-*`, `banner-*`, `p-*` (product),
`e-*` (experience), `o-*` (occasion). Đổi ảnh = thay file cùng tên, hoặc sửa field `img`:

```js
{ id:'signature-chocolate-cake', img:'assets/img/p-chocolate-cake.jpg', ... }
```

Sản phẩm chưa có `img` sẽ tự rơi về placeholder gradient (`.ph-1` … `.ph-8`) — template
không bao giờ vỡ layout vì thiếu ảnh.

Muốn gallery riêng cho 1 sản phẩm (thay vì lấy ảnh cùng danh mục), thêm mảng `gallery`:

```js
{ id:'signature-chocolate-cake',
  img:'assets/img/p-chocolate-cake.jpg',
  gallery:['assets/img/cake-1.jpg','assets/img/cake-2.jpg','assets/img/cake-3.jpg'], ... }
```

Hero và ảnh editorial nằm trực tiếp trong `index.html`:

```html
<div class="gh-media"><img src="assets/img/hero-lounge.jpg" alt="..."></div>
```

**Phí ship / thuế** — `GH.config` cuối `data.js`:

```js
GH.config = { shipping: 15, freeShippingThreshold: 150, taxRate: 0.09, physicalCardFee: 5 };
```

---

## Ghi chú kỹ thuật

- Bootstrap 5.3.3, jQuery 3.7.1 và Google Fonts load qua CDN → cần internet ở lần chạy đầu.
- Nav desktop giữ 1 hàng, nhãn dài tự ngắt 2 dòng đúng như thiết kế; dưới 992px chuyển sang offcanvas.
- Filter chips cuộn ngang trên mobile.
- Đây là template frontend: chưa nối API, chưa có cổng thanh toán thật.

## Bản quyền ảnh & logo

- Ảnh trong `assets/img/` lấy từ [Unsplash](https://unsplash.com) (Unsplash License —
  miễn phí, dùng được cho mục đích thương mại, không bắt buộc ghi nguồn). Đây là **ảnh
  minh hoạ tạm** — khi lên production nên thay bằng ảnh chụp thật của khách sạn.
- Icon social trong popup đăng nhập (`GH.brandIcon` ở `data.js`) dùng path của
  [Font Awesome Free](https://fontawesome.com/license/free) (brands, CC BY 4.0). Tên và
  biểu tượng Facebook / Twitter / LinkedIn / Google / Microsoft là nhãn hiệu của chủ sở hữu,
  ở đây chỉ dùng để chỉ nhà cung cấp đăng nhập.
- Logo hiện là bản **dựng lại bằng HTML/CSS** cho gần giống bản gốc, không phải file
  chính thức từ brand kit. Màu `--gh-brand` là ước lượng theo mắt. Hãy thay bằng asset
  chính thức (xem mục Logo ở trên) trước khi bàn giao.
