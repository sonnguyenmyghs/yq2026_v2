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
│   ├── profile.html      Member Profile — HTML tĩnh: thẻ tóm tắt + 4 nhóm thông tin, sửa tại chỗ
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
nên sửa nav/footer chỉ cần sửa một chỗ (`YQ.nav`, `YQ.megaMenu` trong `data.js`).

Mỗi file trong `assets/js/modules/` là một tính năng độc lập, chỉ móc vào DOM và event
có sẵn — xoá file nào thì mất đúng tính năng đó, phần còn lại vẫn chạy. Module chạy đúng
thời điểm nhờ các event do `app.js` bắn ra:

```js
$(document).on('yq:header-ready', fn);   // header render xong
$(document).on('yq:layout-ready', fn);   // cả header + footer xong
$(document).on('yq:cart-changed', fn);   // giỏ hàng đổi
$(document).on('yq:auth-changed', fn);    // đăng nhập / đăng xuất
$(document).on('yq:profile-changed', fn); // hồ sơ thành viên đổi
```

### Quy ước đặt tên

Mọi thứ do project này viết ra đều mang tiền tố **`yq`**, để không đụng tên với
Bootstrap, jQuery hay thư viện khác. Mỗi loại định danh có một cách viết riêng:

| Loại | Cách viết | Ví dụ |
|---|---|---|
| CSS class | `yq-` + kebab-case, `__` cho phần con | `.yq-btn`, `.yq-prof__card` |
| CSS custom property | `--yq-` | `--yq-gold`, `--yq-ease` |
| Biến toàn cục JS | `YQ.` | `YQ.cart`, `YQ.initHome()` |
| `id` trong DOM | `yq` + camelCase | `yqHeader`, `yqCartCount` |
| `data-` attribute | `data-yq-` | `data-yq-account`, `data-yq-add` |
| localStorage key | `yq_` + snake_case + version | `yq_cart_v4`, `yq_profile_v1` |
| Custom event | `yq:` + kebab-case | `yq:cart-changed` |
| CSS `@keyframes` | `yq` + camelCase | `yqAddedIn`, `yqRowNew` |

Đuôi `_v4`, `_v1` trong localStorage key là **số phiên bản dữ liệu** — đổi cấu trúc
lưu trữ thì tăng số lên, người dùng cũ tự nhận dữ liệu mới thay vì lỗi parse.

> **Hai chuỗi vẫn giữ tiền tố `GH`** vì đó là nhãn Grand Hyatt hiển thị cho khách,
> không phải namespace code: mã đơn hàng (`'GH' + Date.now()…` trong `pages.js`) và
> mã giới thiệu (`YQ.referral.codePrefix = 'GH-'`). Watermark `content: "GH"` trên
> ảnh placeholder cũng vậy.

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

`app.js` đọc thuộc tính đó thành `YQ.root` rồi dịch đường dẫn đúng lúc chèn vào DOM:

```js
YQ.url('shop.html')       // -> '../shop.html'   (trang ở gốc: giữ nguyên)
YQ.localise(htmlString)   // đổi mọi href/src tương đối trong một khối HTML
```

`http(s):`, `mailto:`, `tel:`, `/…` và `#` được bỏ qua. Trang ở gốc có `YQ.root = ''`
nên cả hai hàm là no-op.

> **Thêm chỗ chèn HTML mới có link hoặc ảnh thì nhớ bọc `YQ.localise()`** — không bọc
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
| Member | Desktop: bấm avatar ở header mở **popup dropdown** (lời chào, email, Edit, My profile / My orders / My wallet / Change password / Invite friends, Logout; tô đậm mục đang xem). Mobile: panel "My Functions" trượt từ phải |
| Đơn hàng | Trang My Orders 2 tab, thẻ đơn mở/đóng, ReOrder đẩy nguyên đơn vào giỏ |
| Hồ sơ | Member Profile (HTML tĩnh): thẻ tóm tắt dính, thanh % hoàn thiện, 4 nhóm thông tin, sửa tại chỗ cùng markup |
| Mật khẩu | Đổi mật khẩu có thanh sức mạnh 4 mức, checklist điều kiện, nút hiện/ẩn |
| Mời bạn | Link mời riêng theo số thẻ, chia sẻ Facebook / LINE / email, danh sách đã mời |

Giỏ hàng lưu ở `localStorage` (key `yq_cart_v4`) nên giữ nguyên khi chuyển trang.
Lần đầu vào site giỏ được nạp sẵn dữ liệu mẫu từ `YQ.demoCart` (`data.js`) để `cart.html`/`checkout.html` có nội dung xem thử — xem mục [Giỏ hàng mẫu](#giỏ-hàng-mẫu).

---

## Tuỳ biến

**Màu / font** — sửa CSS variables đầu `assets/css/style.css`:

```css
:root{
  --yq-ink:  #171613;   /* chữ & nút chính */
  --yq-gold: #C4A46A;   /* accent vàng */
  --yq-cream:#F6F4EF;   /* nền */
  --yq-serif: "Playfair Display", Georgia, serif;
  --yq-sans:  "Inter", -apple-system, sans-serif;
}
```

**Sản phẩm** — sửa mảng `YQ.products` trong `assets/js/data.js`.

### Giỏ hàng mẫu

`cart.html` và `checkout.html` render từ `localStorage`, nên máy chưa từng thêm sản phẩm
sẽ thấy trang trống. `YQ.demoCart` trong `data.js` nạp sẵn vài dòng hàng cho **lần truy
cập đầu tiên**:

```js
YQ.demoCart = [
  { id: 'signature-chocolate-cake', optionId: 'medium',  qty: 1 },
  { id: 'grand-pralines',           optionId: '24',      qty: 2 },
  { id: 'the-grand-hamper',         optionId: 'classic', qty: 1 },
  { exp: 'spa-retreat', optionId: 'gold-ecard', qty: 1, addonLabel: 'Classic Gold eCard', addonFee: 0 }
];
```

- Chỉ tham chiếu theo `id` (`YQ.products`) hoặc `exp` (`YQ.experiences`) — không chép
  tên/giá, nên sửa giá một chỗ là đủ.
- Người dùng tự xoá giỏ thì **không** nạp lại (localStorage đã có key).
- Nạp lại thủ công: mở `cart.html?demo=1`, hoặc gọi `YQ.cart.seed(true)` trong console.
- Lên production: đặt `YQ.demoCart = []` là tắt hẳn.

### Tài khoản & menu member

Popup đăng nhập, popup member (dropdown) và panel "My Functions" đều nằm trong
`assets/js/modules/account.js` (+ `assets/css/parts/account.css`). Bấm icon người ở header:

- **Chưa đăng nhập** → popup "Connect Via" (Log in / Register).
- **Đã đăng nhập, desktop (≥ 992px)** → avatar (chữ cái đầu) thả xuống **popup dropdown**
  neo ngay dưới avatar: lời chào + email + link Edit, danh sách chức năng, nút Logout.
  Mục trùng trang đang mở được tô vàng. Đóng khi bấm ra ngoài, Esc, Tab ra khỏi popup,
  header thu gọn lúc cuộn, hoặc khi rê chuột mở mega menu / tìm kiếm.
- **Đã đăng nhập, mobile** → nút Account nằm trong menu offcanvas nên không có chỗ neo
  dropdown; mở panel "My Functions" trượt từ phải, cùng danh sách chức năng.

Danh sách nút social (`SOCIAL`) và menu member (`MENU`) có sẵn mặc định ngay đầu
`account.js`. Muốn đổi mà không sửa module thì khai báo trong `data.js` — có thì module
dùng thay cho mặc định:

```js
YQ.socialLogins = [ { id:'facebook', label:'Facebook' }, … ];   // id phải có trong YQ.brandIcon

YQ.memberMenu = [
  { key:'profile', label:'My profile', icon:'user',   href:'member/profile.html' }, // sang trang thật
  { key:'wallet',  label:'My wallet',  icon:'wallet', view:'wallet' },  // pane con trong panel
  { key:'logout',  label:'Logout',     icon:'logout', action:'logout' }
];
```

Có `href` thì mục đó điều hướng như link bình thường và `view` bị bỏ qua. Mục có `view`
bấm từ dropdown sẽ đóng dropdown và mở panel đúng pane đó (dropdown quá nhỏ để chứa
form). Mục `action:'logout'` trong dropdown được tách xuống chân popup thành nút riêng.

Mở từ chỗ khác: `YQ.account.login()`, `.register()`, `.popup()` (dropdown),
`.member()` / `.member('wallet')` (panel), `.close()` đóng tất cả.

### Lịch sử đơn hàng

`orders.html` (controller `YQ.initOrders` trong `pages.js`) đọc `YQ.orders` ở `data.js`:

```js
YQ.orders = [
  { id:'354646799', date:'2026-08-21', status:'completed', items:[
    { id:'signature-chocolate-cake', optionId:'medium', qty:1 }
  ]}
];
```

- `status`: `'completed'` → tab **Completed orders**, nút **ReOrder**;
  `'pending'` → tab **Pending payment**, chip "Awaiting payment" + nút **Pay now**.
- `date` là ISO `YYYY-MM-DD`, hiển thị thành `21-August-2026`.
- Dòng hàng chỉ giữ `id` + `optionId`, tên/giá/ảnh lấy từ `YQ.products` — id không còn
  trong catalogue thì dòng đó tự bỏ qua, không vỡ trang.
- Mỗi tab tự mở sẵn đơn mới nhất; các đơn còn lại thu gọn thành `1x Tên … giá`.
- Vào thẳng một tab: `orders.html?tab=pending`.
- ReOrder gắn `data-yq-add` nên dùng lại nguyên hiệu ứng của `cart-anim.js`
  (ảnh bay vào giỏ, nút "Added", cart drawer).
- Mã tiền tệ ở dòng Total lấy từ `YQ.config.currencyCode`.

### Hồ sơ thành viên

`member/profile.html` là **HTML tĩnh** — toàn bộ thẻ tóm tắt và 4 nhóm thông tin nằm
sẵn trong file, backend đổ dữ liệu thẳng vào markup. JS (`YQ.initProfile` trong
`pages.js`) **không dựng HTML**, chỉ bật/tắt chế độ sửa, kiểm tra ô nhập và chép giá
trị vừa nhập ngược lại phần hiển thị sau khi Save.

Hai chế độ dùng cùng một markup, đổi bằng class `is-editing` trên `<form class="yq-prof">`:

```html
<!-- trường sửa được: giá trị hiển thị + ô nhập cùng giá trị + chỗ báo lỗi -->
<div class="yq-prof__row yq-prof__row--edit">
  <dt class="yq-prof__label"><label for="pf_email">Email</label></dt>
  <dd class="yq-prof__field">
    <span class="yq-prof__value">sonnguyen@myghs.com</span>
    <input class="yq-input yq-prof__control" id="pf_email" name="email" type="email" value="sonnguyen@myghs.com">
    <div class="yq-error" data-err-for="pf_email"></div>
  </dd>
</div>

<!-- trường chỉ đọc: chỉ có giá trị + nhãn Locked (hiện khi đang sửa) -->
<div class="yq-prof__row yq-prof__row--ro">
  <dt class="yq-prof__label">Membership No.</dt>
  <dd class="yq-prof__field"><span class="yq-prof__value">000001991</span><span class="yq-prof__lock">…Locked</span></dd>
</div>
```

- Trống thì `value=""` và span mang `class="yq-prof__value is-empty"` với chữ "Not provided".
- Ngày: `<input type="date" value="YYYY-MM-DD">`, span hiển thị `DD-Month-YYYY`.
- `<select>` có `<option value="">Not provided</option>` đứng đầu; option đang chọn đánh `selected`.
- `name` của ô nhập là key gửi lên server; form là `method="post" action="#"` — demo chặn
  submit và chỉ cập nhật trên trang (không lưu localStorage), lưu thật là việc của backend.
- Thẻ trái (`#profName`, `#profInitials`, `#profPct`, `#profBar`, `#profHint`) được JS tính
  lại từ DOM sau khi Save; giá trị ban đầu backend tự điền.
- Vào thẳng chế độ sửa: `member/profile.html?edit=1` — link **Edit** trong popup member
  dùng đúng link này. Cancel trả về bản đã lưu gần nhất (`form.reset()`).
- Lưu xong, nếu đang đăng nhập thì `YQ.auth` được đồng bộ tên + email để avatar/lời chào
  ở header khớp.
- `YQ.demoProfile` trong `data.js` **không** còn dùng cho trang này; nó chỉ nạp vào
  `YQ.profile` (localStorage `yq_profile_v1`) cho `password.html` (email, ngày đổi mật
  khẩu) và `invite.html` (memberNo → mã giới thiệu). Giá trị nên khớp với profile.html.

### Đổi mật khẩu

`member/password.html` (controller `YQ.initPassword`). Bốn điều kiện nằm ngay đầu
controller trong mảng `RULES` — sửa/thêm một dòng là cả checklist lẫn thanh sức mạnh
(4 mức: Weak → Fair → Good → Strong) tự đổi theo.

Chặn: thiếu mật khẩu hiện tại, chưa đủ 4 điều kiện, trùng mật khẩu cũ, nhập lại không
khớp. Lưu xong ghi `passwordChangedAt` vào `YQ.profile` để thẻ trái hiện "Last changed".

### Mời bạn bè

`member/invite.html` (controller `YQ.initInvite`) đọc `YQ.referral` trong `data.js`:

```js
YQ.referral = {
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
  `YQ.brandIcon`, không thì rơi về `YQ.icon(icon)`.
- Link mời là URL tuyệt đối kèm `?ref=<mã>`, mã bám theo `memberNo` nên mỗi người một mã.
- Danh sách đã mời lưu ở `localStorage` (`yq_invites_v1`), tự bỏ email trùng.

> **Chưa nối backend.** Mọi email/mật khẩu đúng định dạng đều đăng nhập được và
> **mật khẩu không được lưu ở đâu cả** — localStorage (`yq_user_v1`) chỉ giữ email,
> tên và tuỳ chọn nhận khuyến mãi. Phần `6. Chỗ nối API` trong `account.js` là 3 hàm
> `apiLogin` / `apiRegister` / `apiSocial`, thay bằng lệnh gọi server thật khi có API.

**Logo** — mặc định logo được dựng bằng HTML/CSS trong `YQ.logo()` (`assets/js/data.js`),
nên luôn sắc nét ở mọi kích thước và đổi màu chỉ bằng 1 dòng CSS:

```css
:root{
  --yq-brand:     #C10B44;   /* crimson GRAND | HYATT */
  --yq-brand-sub: #58575B;   /* xám chữ SINGAPORE */
}
```

Khi có file logo chính thức, chỉ cần gán đường dẫn — header, footer và menu mobile tự đổi theo:

```js
// assets/js/data.js
YQ.logoImage      = 'assets/img/logo-grand-hyatt.png';       // nền sáng (header)
YQ.logoImageLight = 'assets/img/logo-grand-hyatt-white.png'; // nền tối (footer)
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
<div class="yq-media"><img src="assets/img/hero-lounge.jpg" alt="..."></div>
```

**Phí ship / thuế** — `YQ.config` cuối `data.js`:

```js
YQ.config = { shipping: 15, freeShippingThreshold: 150, taxRate: 0.09, physicalCardFee: 5 };
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
- Icon social trong popup đăng nhập (`YQ.brandIcon` ở `data.js`) dùng path của
  [Font Awesome Free](https://fontawesome.com/license/free) (brands, CC BY 4.0). Tên và
  biểu tượng Facebook / Twitter / LinkedIn / Google / Microsoft là nhãn hiệu của chủ sở hữu,
  ở đây chỉ dùng để chỉ nhà cung cấp đăng nhập.
- Logo hiện là bản **dựng lại bằng HTML/CSS** cho gần giống bản gốc, không phải file
  chính thức từ brand kit. Màu `--yq-brand` là ước lượng theo mắt. Hãy thay bằng asset
  chính thức (xem mục Logo ở trên) trước khi bàn giao.
