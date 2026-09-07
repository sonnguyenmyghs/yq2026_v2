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
└── assets/
    ├── css/style.css     Design tokens + toàn bộ component
    ├── img/favicon.svg
    └── js/
        ├── data.js       Nav, icon SVG, 13 sản phẩm, 6 experiences, config store
        ├── app.js        Helper, cart (localStorage), render header/footer, toast, reveal
        └── pages.js      Component (card, tile, summary) + controller từng trang
```

Header và footer **không lặp lại trong HTML** — được render bằng jQuery từ `app.js`,
nên sửa nav/footer chỉ cần sửa một chỗ (`GH.nav`, `GH.megaMenu` trong `data.js`).

---

## Tính năng đã cài

| Trang | Tính năng |
|---|---|
| Toàn site | Sticky header, mega menu (hover), search panel, offcanvas mobile, toast, reveal-on-scroll |
| Shop | Lọc 7 category + 5 seasonal, 5 kiểu sort, deep-link `?cat=`, `?season=`, `?q=` |
| Product | Đổi option → giá cập nhật, stepper số lượng, accordion thông tin, sản phẩm liên quan |
| Personalise | 4 mẫu eCard, eCard/Physical (+$5), live preview, đếm ký tự 200 |
| Cart | Sửa số lượng, xoá, subtotal/shipping/tax 9%/total, free-ship từ $150 |
| Checkout | 4 bước có validate, auto-format số thẻ & expiry, màn hình xác nhận đơn |

Giỏ hàng lưu ở `localStorage` (key `gh_cart_v4`) nên giữ nguyên khi chuyển trang.

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

**Ảnh** — 25 ảnh trong `assets/img/`, đặt tên theo nhóm: `hero-*`, `p-*` (product),
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
- Logo hiện là bản **dựng lại bằng HTML/CSS** cho gần giống bản gốc, không phải file
  chính thức từ brand kit. Màu `--gh-brand` là ước lượng theo mắt. Hãy thay bằng asset
  chính thức (xem mục Logo ở trên) trước khi bàn giao.
