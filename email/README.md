# Email voucher + e-card — hướng dẫn backend / admin

Email gửi người nhận quà gộp **e-card** (thiệp cá nhân hoá ở checkout) và **Voucher Details** (giữ nguyên biến của email cũ).
Template viết cho email client: chỉ `<table>` + style inline. Banner **chỉ là ảnh** (email không có video).

## File

| File | Vai trò |
|---|---|
| `voucher-gift.html` | Khung email: logo → `%gift_card%` → Voucher Details → nút "View your gift online" → About the voucher → footer |
| `parts/card-classic.html` | Banner trên, chữ dưới |
| `parts/card-overlay.html` | Ảnh làm nền (có VML cho Outlook Windows), khung chữ màu đè dưới |
| `parts/card-split.html` | Ảnh trái / chữ phải (điện thoại: ảnh trên, chữ dưới — kỹ thuật hybrid, không media query) |
| `parts/card-minimal.html` | Không ảnh, chữ giữa |
| `parts/card-none.html` | Không có thiệp (mua cho mình): hero banner chung + `%gift_message%` như email cũ |
| `samples/*.html` | Email mẫu **đã thay hết biến** (classic, overlay, split, minimal, none) để review — mở `samples/index.html`. Tạo lại: `node email/samples/build.js` |
| `preview.html` | **Chỉ dùng nội bộ** (xem thử / show khách, giả lập Gmail/Outlook). Không deploy, không dùng để gửi mail |
| `../assets/js/modules/voucher/email-render.js` | `YQEmail` — bản ráp trên trình duyệt (preview.html + "Preview full email" ở checkout). Là tài liệu tham chiếu cho cách ráp phía server |

## Cách ráp (khi gửi mail)

1. Chọn khối thiệp: `parts/card-<card_layout>.html` (`classic | overlay | split | minimal`).
   Không có thiệp (mua cho mình — khi tặng thì e-card luôn có, `card_add=1`) → `parts/card-none.html`.
2. Xoá comment tài liệu ở cả hai file **trước khi thay biến**, nhưng GIỮ khối điều kiện Outlook
   `<!--[if mso]>…<![endif]-->` / `<!--[if gte mso 9]>…<![endif]-->`:
   ```php
   $tpl = preg_replace('/<!--(?!\[if)[\s\S]*?-->/', '', $tpl);
   ```
   Lý do: comment đầu file có ghi tên biến (`%gift_card%`…). Nếu thay biến bên trong comment, HTML thiệp (cũng có `-->`) sẽ đóng
   comment sớm và lộ chữ ra email. Khối VML của Outlook có `%card_banner_overlay%` `%card_bg%` nên phải thay biến cả trong khối đó.
3. Thay biến của khối thiệp → được `$giftCard`.
4. Thay biến của khung, trong đó `%gift_card%` = `$giftCard`.
5. Thay **một lượt** (giá trị đã chèn không quét lại, vd `strtr($tpl, $map)`), để lời nhắn có chữ `%voucher%` không bị thay tiếp.

`YQEmail.fill()` làm bước 2–5 trên trình duyệt nhưng xoá luôn khối MSO (trình duyệt không cần VML) — server thì giữ lại.
`samples/build.js` làm đúng như server (giữ khối MSO).

---

## Bảng biến cho admin production

Quy tắc chung:
- **Biến chữ**: backend escape HTML (`& < > "`, vd `htmlspecialchars`). **Biến HTML**: chèn nguyên (do hệ thống tạo, không phải khách gõ).
- **URL** (ảnh, link): luôn `https://` tuyệt đối, đã percent-encode (không dấu cách, `'`, `"`, `(`, `)`) — vì
  `%card_banner_overlay%` nằm trong `url(...)` không có nháy.
- Tên biến CŨ giữ **đúng y nguyên** như email đang chạy.

### Tất cả biến

| Biến | Cũ / mới | Loại | Dùng ở | Nguồn dữ liệu | Định dạng | Ví dụ |
|---|---|---|---|---|---|---|
| `%gift_message%` | **cũ** | chữ | mọi khối thiệp (classic, overlay, split, minimal, none) | checkout `note_receive` | `nl2br(htmlspecialchars(...))`, ≤ 300 ký tự; rỗng nếu không có | `Merry Christmas! Enjoy a festive evening on us — you deserve it.` |
| `%redeem_date%` | **cũ** | chữ | khung | hệ thống (ngày mua / tạo voucher) | như email cũ, vd `j M Y` | `10 Nov 2026` |
| `%product_name%` | **cũ** | chữ | khung | hệ thống (tên sản phẩm voucher) | chữ thường | `Christmas Eve Dinner Buffet at StraitsKitchen` |
| `%redeem_expiry%` | **cũ** | chữ | khung | hệ thống (hạn dùng) | như `%redeem_date%` | `24 Dec 2026` |
| `%voucher%` | **cũ** | chữ | khung | hệ thống (mã voucher) | chữ | `GH-8F3K-2Q7M` |
| `%qr_code%` | **cũ** | HTML | khung | hệ thống (như email cũ) | thẻ `<img>` PNG/JPG URL https, ~120×120 | `<img src="https://…/qr/GH-8F3K-2Q7M.png" width="120" height="120" alt="QR code" style="display:block;border:0;">` |
| `%product_description%` | **cũ** | HTML | khung | hệ thống (mô tả sản phẩm, như email cũ) | HTML đơn giản (`<br>`, `<p>`, `<strong>`, link) | `Celebrate Christmas Eve with a festive dinner buffet…` |
| `%gift_card%` | mới | HTML | khung | backend: HTML khối thiệp đã thay biến (bước 3) | HTML | (nội dung `parts/card-*.html`) |
| `%gift_url%` | mới | chữ (URL) | khung (nút "View your gift online"), classic + split (ảnh bấm được) | hệ thống: link trang mở quà `/gift/<token>` (`voucher/gift.html`) | URL https tuyệt đối | `https://ireward.superghs.com/yqhyattsgstore/gift/8f3k2q7m…` |
| `%preheader%` | mới | chữ | khung (ẩn, dòng xem trước hộp thư) | hệ thống | ≤ 90 ký tự | tặng: `James sent you a gift from The Shop` · mua cho mình: `Your eVoucher from The Shop` |
| `%recipient_name%` | mới | chữ | classic, overlay, split, minimal | checkout `name_receive` | ≤ 60 ký tự | `Sarah Tan` |
| `%sender_name%` | mới | chữ | classic, overlay, split, minimal | người mua: `register[firstname]` / `member[firstname]` | chữ | `James` |
| `%card_bg%` | mới | chữ | classic, overlay, split, minimal | checkout `card_colour_hex` | `#RRGGBB` (kiểm tra regex `^#[0-9A-Fa-f]{6}$`, sai → `#8C7145`) | `#B9353F` |
| `%card_banner%` | mới | chữ (URL) | classic | `card_banner` (id mẫu → URL ảnh) hoặc ảnh tải lên `card_banner_file` | URL https, ảnh rộng 592px (xuất @2x 1184px, tỉ lệ tự do, nên 4:3) | `https://…/assets/img/o-festive.jpg` |
| `%card_banner_overlay%` | mới | chữ (URL) | overlay | như `%card_banner%`, **đã cắt sẵn** | URL https, ảnh đúng **592×460** | `https://…/ecard/abc_592x460.jpg` |
| `%card_banner_split%` | mới | chữ (URL) | split | như `%card_banner%`, **đã cắt sẵn** dọc | URL https, ảnh 208×300 hiển thị, xuất @2x **416×600** | `https://…/ecard/abc_416x600.jpg` |

Không còn: `%card_video_cta%` (đã bỏ video). Field checkout `card_banner_type` đã bị xoá.

Biến theo layout (ngoài các biến của khung, luôn có):

| `card_layout` | File khối thiệp | Biến trong khối |
|---|---|---|
| `classic` | `parts/card-classic.html` | `%card_bg%` `%card_banner%` `%gift_url%` `%recipient_name%` `%gift_message%` `%sender_name%` |
| `overlay` | `parts/card-overlay.html` | `%card_bg%` `%card_banner_overlay%` `%recipient_name%` `%gift_message%` `%sender_name%` |
| `split` | `parts/card-split.html` | `%card_bg%` `%card_banner_split%` `%gift_url%` `%recipient_name%` `%gift_message%` `%sender_name%` |
| `minimal` | `parts/card-minimal.html` | `%card_bg%` `%recipient_name%` `%gift_message%` `%sender_name%` |
| (không thiệp) | `parts/card-none.html` | `%gift_message%` |

Khung `voucher-gift.html`: `%preheader%` `%gift_card%` `%redeem_date%` `%product_name%` `%redeem_expiry%` `%voucher%` `%qr_code%` `%gift_url%` `%product_description%`.

### Màu

`%card_bg%` = `card_colour_hex` (mã màu thực dùng, kể cả khi `card_colour=auto`). Chữ trên thiệp luôn trắng `#FFFFFF`.

| `card_colour` | Tên | Hex |
|---|---|---|
| `gold` | Burnished Gold | `#8C7145` |
| `terracotta` | Deep Terracotta | `#6F2613` |
| `crimson` | Warm Crimson | `#B9353F` |
| `black` | Standard Black | `#000000` |
| `auto` | Lấy từ ảnh banner | Tính ở checkout (JS đọc pixel ảnh), **đã làm tối** tới khi chữ trắng đạt tương phản 4.5:1. Ảnh khác domain không CORS → `#8C7145`. Ví dụ Christmas → `#816653` |

Màu cố định trong khung (không đổi theo khách):

| Hex | Dùng cho |
|---|---|
| `#F6F4EF` | Nền trang (ngoài khung 640px) |
| `#FFFFFF` | Nền khung email; chữ trên thiệp; chữ dòng đầu footer |
| `#171613` | Chữ chính, nhãn bảng Voucher Details, nút "View your gift online", nền footer |
| `#56514A` | Chữ phụ ("This email serves as your eVoucher", mô tả voucher) |
| `#736649` | Eyebrow "YOUR EVOUCHER" |
| `#8A837A` | Chú thích nhỏ "Show at the outlet" |
| `#E4DFD4` | Đường kẻ trên bảng Voucher Details |
| `#EFEBE3` | Đường kẻ giữa các dòng bảng |
| `#BDB6AA` | Chữ footer, link email footer |

### Nền (background) theo ô và fallback theo email client

| Chỗ | Cách khai báo nền |
|---|---|
| Trang (ngoài khung) | `<div style="background-color">` + bảng ngoài `bgcolor="#F6F4EF"` |
| Khung 640px, footer, nút | `bgcolor` + `background-color` (không ảnh) |
| Thiệp classic / split / minimal | `bgcolor="%card_bg%"` + `background-color:%card_bg%`; ảnh là `<img>` (không ảnh nền) |
| Thiệp overlay — ô ảnh | `bgcolor="%card_bg%"` + thuộc tính `background="%card_banner_overlay%"` + style `background-image:url(...)` cover (url() CHỈ ở ô này) + VML `<v:rect><v:fill type="frame">` trong `<!--[if gte mso 9]>` |
| Thiệp overlay — khung chữ | bảng lồng `bgcolor="%card_bg%"` + `background-color` + bo góc (không url) |

| Client | Classic / split / minimal | Overlay |
|---|---|---|
| Apple Mail (macOS/iOS) | Đầy đủ | Ảnh nền CSS cover + khung chữ |
| Gmail web / app (tài khoản Google) | Đầy đủ | Có thể xoá cả `style` có `url()` → dùng thuộc tính `background` (ảnh không co giãn → **phải đúng 592×460**) + `bgcolor`; khung chữ vẫn đúng vì nằm ở bảng lồng |
| Gmail app với tài khoản không phải Google (IMAP, Outlook.com…) | Đầy đủ (ảnh `<img>`) | Không ảnh nền → nền `%card_bg%` + khung chữ (vẫn đọc được) |
| Outlook Windows (2013–2021, 365 bản Word) | Đầy đủ; bo góc thành vuông; split giữ 2 cột nhờ bảng "ma" MSO | VML hiện ảnh (co giãn vào 592×460, tự cao thêm khi lời nhắn dài). Mất khối MSO → nền `%card_bg%` |
| Outlook mới (Windows "new") / Outlook.com | Đầy đủ | Ảnh nền CSS / thuộc tính `background` |
| Yahoo Mail | Đầy đủ | Ảnh nền CSS / thuộc tính `background` |

Giới hạn overlay: lời nhắn dài (300 ký tự) trên điện thoại làm ô cao hơn 460px; client chỉ dùng thuộc tính `background`
sẽ lặp ảnh ở phần dưới. Chữ vẫn đọc được. Nếu cần chắc chắn: gợi ý khách dùng classic khi lời nhắn > ~150 ký tự.

### Ảnh

| Ảnh | URL / nguồn | Kích thước |
|---|---|---|
| Logo (khung) | `https://ireward.superghs.com/resource/yqhyattsgstore/newsletter/logoGHSIN.jpg` | 200×64 (như email cũ) |
| Hero banner (`card-none`) | `https://ireward.superghs.com/resource/yqhyattsgstore/newsletter/Grand_Hyatt_Hero_Banner_1440x500.jpg` | hiển thị 640px rộng (email cũ 650×226) |
| QR (`%qr_code%`) | hệ thống như email cũ | thẻ `<img>` ~120×120, PNG/JPG (không SVG — nhiều client chặn) |

Banner mẫu (`card_banner` = id) → file trong `assets/img/` của skin. Production base URL = thư mục `assets/img/` của skin
(vd `https://<domain>/templates/defaultv3.1.yq/yqhyattsgstore_demo/assets/img/` — kiểm tra khi deploy).
Backend phải ghép thành **URL https tuyệt đối** (email không hiểu đường dẫn tương đối).

| `card_banner` | File | Layout gợi ý |
|---|---|---|
| `celebrate` | `e-afternoon-tea.jpg` | overlay |
| `christmas` | `o-festive.jpg` | overlay |
| `birthday` | `o-birthdays.jpg` | classic |
| `anniversary` | `o-anniversaries.jpg` | split |
| `dining` | `e-dining.jpg` (mẫu mặc định khi không khớp) | classic |
| `spa` | `e-spa.jpg` | split |
| `lunar` | `banner-cny.jpg` | classic |
| `stay` | `e-staycation.jpg` | overlay |
| `sweet` | `editorial-cake.jpg` | minimal |
| `upload` | file `card_banner_file` (JPG/PNG/WebP ≤ 10MB) — backend lưu, trả URL https | — |

Ảnh gốc mẫu là 1200×900. Ảnh cần cắt sẵn theo layout (cắt kiểu cover, canh giữa; JPEG ~85%):

| Layout | Biến | Hiển thị | Xuất file | Ghi chú |
|---|---|---|---|---|
| classic | `%card_banner%` | rộng 592px, cao tự động | rộng 1184px (@2x) | không cần cắt, chỉ thu nhỏ |
| overlay | `%card_banner_overlay%` | 592×460 | **592×460 (1x)** | thuộc tính `background` không co giãn ảnh: file @2x 1184×920 sẽ chỉ hiện 1/4 ảnh ở Gmail web. Nếu muốn nét hơn trên retina có thể thử 1184×920, nhưng phải test Gmail web |
| split | `%card_banner_split%` | 208×300 | 416×600 (@2x) | `<img>` có `width/height` nên @2x an toàn |
| minimal | — | không ảnh | — | `card_banner` bị bỏ qua |
| none | — | hero banner chung | — | — |

### Field checkout cấp dữ liệu

| Field (POST, form multipart) | Giá trị | Dùng cho |
|---|---|---|
| `name_receive` | chữ ≤ 60 | `%recipient_name%`; email người nhận |
| `email_receive` | email | địa chỉ gửi (không phải biến trong template) |
| `note_receive` | chữ ≤ 300 | `%gift_message%` |
| `card_add` | luôn `1` khi tặng | có thiệp → chọn `card-<card_layout>`; không gửi/không tặng → `card-none` |
| `card_banner` | id mẫu (bảng trên) hoặc `upload` | URL ảnh → `%card_banner%` / `_overlay` / `_split` |
| `card_banner_file` | file JPG/PNG/WebP ≤ 10MB (khi `card_banner=upload`) | backend lưu + cắt |
| `card_layout` | `classic | overlay | split | minimal` | chọn file khối thiệp (giá trị lạ → `classic`) |
| `card_colour` | `auto | gold | terracotta | crimson | black` | lưu để thống kê; màu thật lấy từ `card_colour_hex` |
| `card_colour_hex` | `#RRGGBB` | `%card_bg%` |

`card_banner_type` **đã bị xoá** (không còn video). Tắt chế độ tặng → các `card_*` không được POST.

### Áp dụng lên admin

1. **Khung** `voucher-gift.html` → dán vào template email voucher trong CMS (CKEditor), ở chế độ **Source**, thay toàn bộ nội dung cũ.
   Xoá comment tài liệu đầu file trước khi dán (khung không có khối MSO).
   - Biến nằm trong chữ (`%redeem_date%`, `%voucher%`…) có thể chèn bằng nút chèn biến (atwho) — CMS bọc thành
     `<span class="atwho-inserted" …>%voucher%</span>`, vẫn chạy vì backend chỉ thay chuỗi `%voucher%`.
   - Biến nằm trong **thuộc tính** (`href="%gift_url%"`) phải **gõ tay** trong Source, không dùng atwho (span trong thuộc tính làm hỏng HTML).
     Sau khi lưu, mở lại Source kiểm tra `href="%gift_url%"` không bị mã hoá thành `%25gift_url%25`.
   - `%gift_card%` đặt ở ô ngay dưới logo (đã có sẵn trong file); `%gift_message%` KHÔNG còn ở khung (nằm trong khối thiệp).
2. **Khối thiệp** `parts/card-*.html` → **không** dán vào CKEditor. Để backend đọc từ file (khuyến nghị: lưu trong code/skin),
   vì CKEditor có thể xoá khối `<!--[if mso]>`/VML, thuộc tính `background` và các thẻ `v:*`. Nếu bắt buộc lưu trong CMS:
   dùng ô textarea thường (không CKEditor) hoặc tắt lọc nội dung (`config.allowedContent = true`, `config.protectedSource`).
3. Khi gửi: chọn file theo `card_layout` (không thiệp → `card-none`), xoá comment tài liệu (regex ở "Cách ráp", **giữ** khối MSO),
   thay biến khối thiệp, rồi chèn vào `%gift_card%` và thay biến khung — **một lượt**.
4. `%gift_message%`: `nl2br(htmlspecialchars($note_receive, ENT_QUOTES, 'UTF-8'))`. Các biến chữ khác: `htmlspecialchars`.
   `%qr_code%`, `%product_description%`, `%gift_card%` chèn nguyên HTML.
5. Gửi thử tới Gmail (web + app), Outlook Windows, Apple Mail (iPhone) với cả 4 layout + `card-none`; so với `samples/*.html`.

### Rủi ro CKEditor và cách xử lý

| Rủi ro | Ảnh hưởng | Fallback |
|---|---|---|
| Xoá comment HTML / comment điều kiện `<!--[if mso]>` | Outlook Windows: overlay mất ảnh (còn nền màu), split xếp ảnh trên chữ dưới | Khối thiệp nằm ở file backend (bước 2), khung không có MSO → không ảnh hưởng |
| Lọc thuộc tính lạ (`role`, `background`, `bgcolor`, `valign`, `cellpadding`) theo ACF | Mất nền/khoảng cách ở client cũ | `allowedContent = true` cho template email; mọi ô đều có style inline tương đương |
| Lọc / đổi thẻ `<div>` (wrapper nền, preheader ẩn) | Preheader có thể hiện ra đầu email; mất nền trang | Bảng ngoài vẫn có `bgcolor`; nếu preheader hiện, bỏ khối div preheader (không bắt buộc) |
| Tự thêm `<p>`/`&nbsp;` quanh `%gift_card%` | Thêm khoảng trắng nhỏ | Giữ `%gift_card%` trên một dòng trong `<td>`; kiểm tra lại Source sau khi lưu |
| Mã hoá `%` trong `href` | Nút "View your gift online" hỏng | Gõ tay trong Source, kiểm tra lại; hoặc backend thay cả `%25gift_url%25` |
| Đổi `'Josefin Sans'` hoặc dấu nháy trong style | Không đáng kể (font dự phòng Arial) | — |

## Giới hạn email client

- Chỉ `<table>` + style inline. **Không** `<style>`, media query (CMS hay xoá), flex, grid, gradient, biến CSS, SVG, video.
  Rộng tối đa 640px, tự co bằng `width:100%` + `max-width`.
- Ảnh nền (https://www.caniemail.com/features/css-background-image/):
  - **Gmail web xoá CẢ thuộc tính `style`** nếu trong đó có `url()` → `url()` chỉ đặt ở ô chỉ chứa ảnh nền (overlay), bố cục nằm ở bảng lồng.
  - **Outlook Windows** (bản Word) không hiện ảnh nền CSS → VML trong `<!--[if gte mso 9]>`. Nếu khối này mất: còn nền `%card_bg%`.
  - **Gmail với tài khoản không phải Google** không có ảnh nền → còn nền `%card_bg%`.
  - Vì vậy chỉ layout overlay dùng ảnh nền (luôn có `bgcolor` + thuộc tính `background` + VML); các layout khác dùng `<img>`.
- Ô ảnh nền overlay không có thuộc tính `width` (td `width="592"` ép bảng rộng 592px trên điện thoại).
- `preview.html` có nút giả lập: "Gmail web" (xoá style có `url()`), "Outlook Windows / Gmail non-Google" (bỏ mọi ảnh nền).

## Endpoint xem trước (tuỳ chọn) — "Preview full email" ở checkout

Mặc định checkout tự ráp email bằng `YQEmail.build()` từ các file trong `email/`. Nếu muốn preview đúng như mail thật do server render,
backend làm một endpoint và checkout truyền URL vào `opts.endpoint`:

- **Request**: `POST`, `application/x-www-form-urlencoded`, cookie phiên (same-origin). Field:
  `layout` (`classic|overlay|split|minimal|none`) + các biến ở trên dạng chữ thô (chưa escape):
  `recipient_name sender_name gift_message card_bg card_banner card_banner_overlay card_banner_split gift_url redeem_date product_name redeem_expiry voucher preheader`,
  và nếu có: `qr_code_html product_description_html`.
  Server **phải tự escape lại** mọi giá trị (không tin dữ liệu gửi lên), nên lấy tên voucher / mô tả từ giỏ hàng thay vì từ request,
  và có thể bỏ qua các field `*_html`.
- **Response**: `200`, `text/html`, email đầy đủ (giống mail thật) với mã voucher / QR **mẫu** ("Sample") vì mã thật chỉ có sau thanh toán.
  Trả cả trang (`<html>…`) hoặc chỉ phần thân; nếu chỉ phần thân, `YQEmail` tự bọc `<html>` + `<base>` trỏ về `email/`.
- Lỗi (khác 2xx) → `build()` reject, checkout tự xử lý (vd ráp bằng template tĩnh).

## API trình duyệt (`YQEmail`)

```js
YQEmail.build(vars, { layout, base, endpoint, client, emulateCrop }) // -> Promise<string> trang HTML đầy đủ cho iframe.srcdoc
YQEmail.simulate(html, 'normal' | 'gmail' | 'nobg')                   // -> string
YQEmail.fill(template, vars)                                          // -> string (xoá comment, thay %tên% một lượt)
YQEmail.crop(url, w, h)                                               // -> Promise<string> data URL đã cắt
```

`vars` dùng tên biến không có `%`; biến HTML đặt đuôi `_html` (`qr_code_html`, `product_description_html`).
Biến chữ được escape tự động. Biến đã biết mà thiếu → rỗng; `%token%` lạ để nguyên (dễ thấy lỗi template).
`opts.base` mặc định là thư mục `email/` suy từ `src` của script, nên gọi được từ trang ở bất kỳ cấp thư mục nào.

### Giả lập bước cắt ảnh trên trình duyệt
`YQEmail.build(vars, { emulateCrop: true })` (dùng trong `email/preview.html` và popup checkout) cắt `card_banner_overlay` → 592×460
và `card_banner_split` → 416×600 bằng canvas (cover, canh giữa) để bản xem trước giống email thật. Khi có `endpoint`, bước này bỏ qua —
backend tự cắt.

## Email mẫu tĩnh (`samples/`)

`node email/samples/build.js` (không cần thư viện) ráp 5 file `samples/{classic,overlay,split,minimal,none}.html` giống server
(xoá comment tài liệu, giữ khối MSO, escape, thay một lượt) và báo lỗi nếu còn `%token%`. Ảnh dùng đường dẫn tương đối
`../../assets/img/…` để xem trên máy; overlay/split trỏ vào ảnh gốc chưa cắt (production phải cắt sẵn). Gửi thử thật → URL https tuyệt đối.
