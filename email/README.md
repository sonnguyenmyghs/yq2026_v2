# Email voucher + e-card — hướng dẫn backend / admin

Email gửi người nhận quà — thiết kế **"Luxe Ticket" (v2)**, đặc tả đầy đủ: [`DESIGN-TICKET.md`](DESIGN-TICKET.md).
Lời chúc nằm trên **giấy kem** (thay đổi theo layout), phía dưới là **vé voucher ngang** màu `%card_bg%` có khung vàng mảnh,
tên voucher chữ serif lớn và **cuống kem** chứa QR (luôn trên ô trắng) + mã. Tiếp theo: nút "View your gift online",
1 câu cách dùng (số đặt bàn), dòng nhỏ "Purchased on … · Ref … · Terms apply", footer (bản gọn v3).
Mô tả dài `%product_description%` **không còn trong email** — hiện ở trang người nhận `voucher/gift.html`.
Template viết cho email client: chỉ `<table>` + style inline. Banner **chỉ là ảnh** (email không có video).

## File

| File | Vai trò |
|---|---|
| `voucher-gift.html` | Khung email: logo → `%gift_card%` (lời chúc + vé) → nút "View your gift online" → 1 câu "Reserve at `%outlet_phone%` and show the QR code on arrival." → dòng nhỏ "Purchased on `%redeem_date%` · Ref `%order_ref%` · Terms apply (`%terms_url%`)" → footer (bản gọn v3) |
| `parts/card-classic.html` | Banner 592 trên giấy kem, lời chúc dưới; rồi vé |
| `parts/card-overlay.html` | Ảnh làm nền (VML cho Outlook Windows), hộp giấy kem đè dưới; vé là hàng riêng phía dưới (không url()) |
| `parts/card-split.html` | Ảnh trái 236 / giấy kem phải 356 (điện thoại: ảnh trên, chữ dưới — hybrid, không media query); rồi vé |
| `parts/card-minimal.html` | Chỉ giấy kem canh giữa + hoạ tiết vàng `—— ◆ ——`; rồi vé |
| `parts/card-none.html` | Không có thiệp (mua cho mình): hero banner chung + vé (eyebrow "YOUR GIFT VOUCHER", "for" = tên người mua) |
| `DESIGN-TICKET.md` | Đặc tả thiết kế Luxe Ticket v2 (màu, chữ, kích thước, biến, dữ liệu mẫu) — dùng chung cho email, checkout, gift.html |
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
| `%gift_message%` | **cũ** | chữ | lời chúc trên giấy kem (classic, overlay, split, minimal); **card-none không dùng** | checkout `note_receive` | `nl2br(htmlspecialchars(...))`, ≤ 300 ký tự | `Merry Christmas! Enjoy a festive evening on us — you deserve it.` |
| `%redeem_date%` | **cũ** | chữ | khung (dòng nhỏ "Purchased on … · Ref …") | hệ thống (ngày mua / tạo voucher) | như email cũ, vd `j M Y` | `10 Nov 2026` |
| `%product_name%` | **cũ** | chữ | vé, **mọi** khối thiệp (kể cả card-none) — Georgia 26px | hệ thống (tên sản phẩm voucher) | chữ thường | `Christmas Eve Dinner Buffet at StraitsKitchen` |
| `%redeem_expiry%` | **cũ** | chữ | vé, mọi khối ("VALID UNTIL …") | hệ thống (hạn dùng) | như `%redeem_date%` | `24 Dec 2026` |
| `%voucher%` | **cũ** | chữ | cuống vé, mọi khối (Courier đậm, chữ thật — copy được) | hệ thống (mã voucher) | chữ | `GH-8F3K-2Q7M` |
| `%qr_code%` | **cũ** | HTML | cuống vé, mọi khối (luôn trên ô trắng đệm 8px) | hệ thống (như email cũ) | thẻ `<img>` PNG/JPG URL https, **120×120**, không `width:100%` | `<img src="https://…/qr/GH-8F3K-2Q7M.png" width="120" height="120" alt="QR code" style="display:block;width:120px;height:120px;border:0;">` |
| `%product_description%` | **cũ** | HTML | **KHÔNG còn trong email** — hiện ở trang `voucher/gift.html` | hệ thống | — | — |
| `%outlet_name%` | **mới** | chữ | vé: eyebrow "`%outlet_name%` · GIFT VOUCHER" (viết hoa bằng CSS) + dòng "Present this e-voucher at `%outlet_name%`…" | hệ thống: tên nhà hàng / outlet của voucher | chữ ngắn, ≤ 24 ký tự | `StraitsKitchen` |
| `%voucher_summary%` | **mới** | chữ | vé, dưới tên voucher (1–2 dòng) | hệ thống / admin nhập cho từng voucher | **1 dòng ≤ 80 ký tự** | `Dinner buffet for 1 adult · 24 Dec 2026, 6–10 PM` |
| `%outlet_phone%` | **mới** | chữ | khung: câu "Reserve at …" — chữ **và** `href="tel:%outlet_phone%"` | hệ thống: số đặt bàn của outlet | dạng quốc tế `+65 6732 1234` (dấu cách được; nếu muốn href chuẩn tuyệt đối có thể bỏ dấu cách) | `+65 6732 1234` |
| `%terms_url%` | **mới** | chữ (URL) | khung: link "Full terms & conditions →" | hệ thống: trang điều khoản đầy đủ; có thể = `%gift_url%#terms` | URL https tuyệt đối | `https://ireward.superghs.com/yqhyattsgstore/gift/8f3k…#terms` |
| `%order_ref%` | **mới** | chữ | khung: "Purchased on … · Ref `%order_ref%`" | hệ thống: mã đơn hàng | chữ | `GH12345678` |
| `%gift_card%` | mới | HTML | khung | backend: HTML khối thiệp đã thay biến (bước 3) | HTML | (nội dung `parts/card-*.html`) |
| `%gift_url%` | mới | chữ (URL) | khung (nút "View your gift online"), classic + split (ảnh bấm được) | hệ thống: link trang mở quà `/gift/<token>` (`voucher/gift.html`) | URL https tuyệt đối | `https://ireward.superghs.com/yqhyattsgstore/gift/8f3k2q7m…` |
| `%preheader%` | mới | chữ | khung (ẩn, dòng xem trước hộp thư) | hệ thống | ≤ 90 ký tự | tặng: `James sent you a gift from The Shop` · mua cho mình: `Your eVoucher from The Shop` |
| `%recipient_name%` | mới | chữ | "Dear …," trên giấy kem (card-none không dùng) | checkout `name_receive`; **card-none: tên người mua** | ≤ 60 ký tự | `Sarah Tan` |
| `%sender_name%` | mới | chữ | chữ ký "— With love, …" (classic, overlay, split, minimal) | người mua: `register[firstname]` / `member[firstname]` | chữ | `James` |
| `%card_bg%` | mới | chữ | nền vé, mọi khối (overlay: thêm màu fallback của ô ảnh nền) | checkout `card_colour_hex`; **card-none (mua cho mình): luôn `#8C7145`** (Burnished Gold) | `#RRGGBB` (kiểm tra regex `^#[0-9A-Fa-f]{6}$`, sai → `#8C7145`) | `#B9353F` |
| `%card_line%` | mới | chữ | hiện **không dùng** trong template (bản gọn v3 bỏ gạch + nét đứt); vẫn nhận để dùng lại sau | checkout `card_line_hex` (= màu nhạt của `card_colour_hex`: trộn 35% trắng). Thiếu/sai → backend tự tính `tint(card_bg, 0.35)` (công thức ở mục Màu) | `#RRGGBB` | `#D27C82` (với `#B9353F`) |
| `%card_banner%` | mới | chữ (URL) | classic | `card_banner` (id mẫu → URL ảnh) hoặc ảnh tải lên `card_banner_file` | URL https, ảnh rộng 592px (xuất @2x 1184px, tỉ lệ tự do, nên 4:3) | `https://…/assets/img/o-festive.jpg` |
| `%card_banner_overlay%` | mới | chữ (URL) | overlay | như `%card_banner%`, **đã cắt sẵn** | URL https, ảnh đúng **592×460** | `https://…/ecard/abc_592x460.jpg` |
| `%card_banner_split%` | mới | chữ (URL) | split | như `%card_banner%`, **đã cắt sẵn** dọc | URL https, ảnh 208×300 hiển thị, xuất @2x **416×600** | `https://…/ecard/abc_416x600.jpg` |

Không còn trong email: `%product_description%` (chuyển sang `voucher/gift.html`), `%card_video_cta%` (đã bỏ video). Field checkout `card_banner_type` đã bị xoá.

Biến theo layout (ngoài các biến của khung, luôn có):

| `card_layout` | File khối thiệp | Biến trong khối |
|---|---|---|
| `classic` | `parts/card-classic.html` | `%card_banner%` `%gift_url%` `%recipient_name%` `%gift_message%` `%sender_name%` + vé |
| `overlay` | `parts/card-overlay.html` | `%card_bg%` (fallback ô ảnh) `%card_banner_overlay%` `%recipient_name%` `%gift_message%` `%sender_name%` + vé |
| `split` | `parts/card-split.html` | `%card_banner_split%` `%gift_url%` `%recipient_name%` `%gift_message%` `%sender_name%` + vé |
| `minimal` | `parts/card-minimal.html` | `%recipient_name%` `%gift_message%` `%sender_name%` + vé |
| (không thiệp) | `parts/card-none.html` | vé (`%card_bg%` = `#8C7145`, `%card_line%` = `#B4A386`, `%recipient_name%` = tên người mua) |

"+ vé" = vé voucher ngang có trong **mọi** khối: `%card_bg%` `%card_line%` `%outlet_name%` `%product_name%` `%recipient_name%`
`%voucher_summary%` `%redeem_expiry%` `%qr_code%` `%voucher%`.

Khung `voucher-gift.html`: `%preheader%` `%gift_card%` `%gift_url%` `%outlet_phone%` `%terms_url%`
`%redeem_date%` `%order_ref%`.
Biến cũ còn dùng: `%gift_message%` (lời chúc) · `%redeem_date%` (khung) · `%product_name%` `%redeem_expiry%` `%voucher%` `%qr_code%` (vé).
`%product_description%` **không còn** trong email (backend vẫn có thể truyền — không có chỗ nào thay, vô hại).

### Màu

`%card_bg%` = `card_colour_hex` (mã màu thực dùng, kể cả khi `card_colour=auto`) = **nền vé**. Chữ trên vé trắng `#FFFFFF` / vàng nhạt `#E7D3A3`.
`%card_line%` = `card_line_hex` = màu nhạt của `card_bg`: mỗi kênh `c + (255 − c) × 0.35`, làm tròn
(`YQEmail.tint(hex, 0.35)`; PHP: `sprintf('#%02X%02X%02X', ...)` với cùng công thức).

| `card_colour` | Tên | `%card_bg%` | `%card_line%` |
|---|---|---|---|
| `gold` | Burnished Gold (cũng dùng cho card-none) | `#8C7145` | `#B4A386` |
| `terracotta` | Deep Terracotta | `#6F2613` | `#A17266` |
| `crimson` | Warm Crimson | `#B9353F` | `#D27C82` |
| `black` | Standard Black | `#000000` | `#595959` |
| `auto` | Lấy từ ảnh banner | Tính ở checkout (JS đọc pixel ảnh), **đã làm tối** tới khi chữ trắng đạt tương phản 4.5:1. Ảnh khác domain không CORS → `#8C7145`. Ví dụ Christmas → `#816653` | tính từ card_bg, vd `#AD9C8F` |

Màu cố định (không đổi theo khách — xem `DESIGN-TICKET.md`):

| Hex | Dùng cho |
|---|---|
| `#F6F4EF` | Nền trang (ngoài khung 640px) |
| `#FFFFFF` | Nền khung email; tên voucher + summary trên vé; **ô trắng quanh QR**; chữ dòng đầu footer |
| `#F7F1E6` | cream — **giấy lời nhắn** (mọi layout) và **cuống vé** |
| `#C8A96A` | gold — khung viền 1px trong vé, hoạ tiết `—— ◆ ——` (minimal) |
| `#E7D3A3` | gold-light — eyebrow vé, "VALID UNTIL …" |
| `#8C7145` | eyebrow "A GIFT FOR YOU" trên giấy kem; link "Full terms & conditions" |
| `#171613` | ink — "Dear …,", mã voucher, số điện thoại, nút, nền footer |
| `#3A342C` | ink-soft — lời nhắn, chữ ký, chữ các bước và điều khoản |
| `#8A837A` | muted — "SCAN TO REDEEM", dòng "Purchased on … · Ref …" |
| `#BDB6AA` | Chữ footer, link email footer |

Chữ: serif `Georgia, 'Times New Roman', Times, serif` (tên voucher, "Dear …" nghiêng, lời nhắn, chữ ký nghiêng, tiêu đề mục);
sans `Arial, Helvetica, sans-serif` (eyebrow viết hoa, letter-spacing đặt trên `<p>`/`<span>`); mã `'Courier New', Courier, monospace`.
Không còn web font (Josefin Sans) trong email.

### Nền (background) theo ô và fallback theo email client

| Chỗ | Cách khai báo nền |
|---|---|
| Trang (ngoài khung) | `<div style="background-color">` + bảng ngoài `bgcolor="#F6F4EF"` |
| Khung 640px, footer, nút | `bgcolor` + `background-color` (không ảnh) |
| Giấy lời nhắn classic / split / minimal | bảng `bgcolor="#F7F1E6"` + `background-color`; ảnh là `<img>` (không ảnh nền) |
| Overlay — ô ảnh | `bgcolor="%card_bg%"` + thuộc tính `background="%card_banner_overlay%"` + style `background-image:url(...)` cover (url() CHỈ ở ô này) + VML `<v:rect><v:fill type="frame">` trong `<!--[if gte mso 9]>` |
| Overlay — hộp lời nhắn | bảng lồng `bgcolor="#F7F1E6"` + `background-color` + bo góc (không url) |
| Vé voucher (mọi khối) | bảng `bgcolor="%card_bg%"` (bo 10px) → bảng `border:1px solid #C8A96A` → cuống `bgcolor="#F7F1E6"` → ô QR `bgcolor="#FFFFFF"`. Không url() |

| Client | Classic / split / minimal | Overlay |
|---|---|---|
| Apple Mail (macOS/iOS) | Đầy đủ | Ảnh nền CSS cover + khung chữ |
| Gmail web / app (tài khoản Google) | Đầy đủ | Có thể xoá cả `style` có `url()` → dùng thuộc tính `background` (ảnh không co giãn → **phải đúng 592×460**) + `bgcolor`; khung chữ vẫn đúng vì nằm ở bảng lồng |
| Gmail app với tài khoản không phải Google (IMAP, Outlook.com…) | Đầy đủ (ảnh `<img>`) | Không ảnh nền → nền `%card_bg%` + hộp giấy kem (vẫn đọc được) |
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
| `card_line_hex` | `#RRGGBB` (màu nhạt của `card_colour_hex`, checkout tính) | `%card_line%` (thiếu/sai → backend tự tính) |

`card_banner_type` **đã bị xoá** (không còn video). Tắt chế độ tặng → các `card_*` không được POST.

### Áp dụng lên admin

1. **Khung** `voucher-gift.html` → dán vào template email voucher trong CMS (CKEditor), ở chế độ **Source**, thay toàn bộ nội dung cũ.
   Xoá comment tài liệu đầu file trước khi dán (khung không có khối MSO).
   - Biến nằm trong chữ (`%redeem_date%`, `%voucher%`…) có thể chèn bằng nút chèn biến (atwho) — CMS bọc thành
     `<span class="atwho-inserted" …>%voucher%</span>`, vẫn chạy vì backend chỉ thay chuỗi `%voucher%`.
   - Biến nằm trong **thuộc tính** — `href="%gift_url%"`, `href="%terms_url%"`, `href="tel:%outlet_phone%"` — phải **gõ tay** trong Source,
     không dùng atwho (span trong thuộc tính làm hỏng HTML). Sau khi lưu, mở lại Source kiểm tra chúng không bị mã hoá thành `%25…%25`.
   - `%gift_card%` đặt ở ô ngay dưới logo (đã có sẵn trong file); `%gift_message%` KHÔNG còn ở khung (nằm trong khối thiệp).
   - `%product_name%` `%redeem_expiry%` `%voucher%` `%qr_code%` nằm trong **vé** của khối thiệp (backend thay ở bước 3).
     Ở khung: `%redeem_date%` + `%order_ref%` ("Purchased on … · Ref …"), `%outlet_phone%` (câu "Reserve at …"),
     `%terms_url%` (link "Terms apply"). **Bỏ** "About the voucher" / `%product_description%` khỏi template cũ.
2. **Khối thiệp** `parts/card-*.html` → **không** dán vào CKEditor. Để backend đọc từ file (khuyến nghị: lưu trong code/skin),
   vì CKEditor có thể xoá khối `<!--[if mso]>`/VML, thuộc tính `background` và các thẻ `v:*`. Nếu bắt buộc lưu trong CMS:
   dùng ô textarea thường (không CKEditor) hoặc tắt lọc nội dung (`config.allowedContent = true`, `config.protectedSource`).
3. Khi gửi: chọn file theo `card_layout` (không thiệp → `card-none`), xoá comment tài liệu (regex ở "Cách ráp", **giữ** khối MSO),
   thay biến khối thiệp — **gồm cả biến vé** `%outlet_name%` `%product_name%` `%voucher_summary%` `%redeem_expiry%` `%voucher%` `%qr_code%`
   `%recipient_name%` và `%card_bg%` `%card_line%` (card-none: `#8C7145` / `#B4A386`, `%recipient_name%` = tên người mua) — rồi chèn vào `%gift_card%` và thay biến khung — **một lượt**.
4. `%gift_message%`: `nl2br(htmlspecialchars($note_receive, ENT_QUOTES, 'UTF-8'))`. Các biến chữ khác: `htmlspecialchars`.
   `%qr_code%`, `%gift_card%` chèn nguyên HTML. `%qr_code%` là `<img>` PNG/JPG 120×120 có `display:block`,
   **không** đặt `width:100%` (QR phải giữ kích thước cố định, nền trắng).
5. Gửi thử tới Gmail (web + app), Outlook Windows, Apple Mail (iPhone) với cả 4 layout + `card-none`; so với `samples/*.html`.

### Rủi ro CKEditor và cách xử lý

| Rủi ro | Ảnh hưởng | Fallback |
|---|---|---|
| Xoá comment HTML / comment điều kiện `<!--[if mso]>` | Outlook Windows: overlay mất ảnh (còn nền màu), split xếp ảnh trên chữ dưới | Khối thiệp nằm ở file backend (bước 2), khung không có MSO → không ảnh hưởng |
| Lọc thuộc tính lạ (`role`, `background`, `bgcolor`, `valign`, `cellpadding`) theo ACF | Mất nền/khoảng cách ở client cũ | `allowedContent = true` cho template email; mọi ô đều có style inline tương đương |
| Lọc / đổi thẻ `<div>` (wrapper nền, preheader ẩn) | Preheader có thể hiện ra đầu email; mất nền trang | Bảng ngoài vẫn có `bgcolor`; nếu preheader hiện, bỏ khối div preheader (không bắt buộc) |
| Tự thêm `<p>`/`&nbsp;` quanh `%gift_card%` | Thêm khoảng trắng nhỏ | Giữ `%gift_card%` trên một dòng trong `<td>`; kiểm tra lại Source sau khi lưu |
| Mã hoá `%` trong `href` | Nút "View your gift online", link điều khoản, link gọi điện hỏng | Gõ tay trong Source, kiểm tra lại; hoặc backend thay cả `%25gift_url%25` / `%25terms_url%25` / `%25outlet_phone%25` |
| Đổi dấu nháy trong `font-family` (`'Times New Roman'`, `'Courier New'`) | Không đáng kể (font dự phòng Georgia / Courier) | — |

## Thiết kế "Luxe Ticket" (v2)

Khách so sánh với các gift voucher cao cấp (Pinterest / Behance: vé ngang có cuống + QR, khung viền vàng mảnh, chữ serif lớn,
nền đậm + chữ vàng/kem, giấy kem cho lời nhắn, nhiều khoảng trống) và email eGift thật (Gift Up!, Amazon, Uber; Grand Hyatt HK /
Berlin, Shangri-La, Fairmont SG). Đặc tả chi tiết (nguồn duy nhất): [`DESIGN-TICKET.md`](DESIGN-TICKET.md).

```
logo
┌ giấy kem #F7F1E6 (theo layout: ảnh trên | ảnh nền + hộp kem | ảnh trái + kem phải | chỉ kem + —— ◆ ——) ┐
│ A GIFT FOR YOU · Dear %recipient_name%, (Georgia nghiêng 26) · lời nhắn (Georgia 17/28) · — With love, … │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
        18px
┌ vé %card_bg%, padding 10, bo 10 ──────────────────────────────────────────────────────┐
│ ┌ khung vàng 1px #C8A96A, padding 22 / 20 ─────────────────────────────────────────┐ │
│ │ %OUTLET_NAME% · GIFT VOUCHER              │ ┌ cuống kem, bo 6, padding 14 ┐     │ │
│ │ %product_name%  (Georgia 26/32 trắng)     │ │   ┌ ô trắng 8px ┐          │     │ │
│ │                                          │ │   │  QR 120px   │          │     │ │
│ │ ──── (40×1 %card_line%)                   │ │   └─────────────┘          │     │ │
│ │ %voucher_summary% (Arial 13/20)           │ │  %voucher% (Courier đậm)   │     │ │
│ │ VALID UNTIL %redeem_expiry%               │ │  SCAN TO REDEEM            │     │ │
│ │ ───── chính max 360px ─────────────────── │ └──── cuống max 170px ───────┘     │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
        22px  [ View your gift online ]
── Reserve at %outlet_phone% and show the QR code on arrival.
── Purchased on %redeem_date% · Ref %order_ref% · Terms apply (%terms_url%)
footer
```

- 2 cột của vé là hybrid (div inline-block + max-width 360 + 170, ô bọc `font-size:0`, bảng "ma" MSO 530 = 360 + 170).
  Điện thoại tự xếp chồng: phần chính ở trên, cuống canh giữa ở dưới. Không media query.
- Mỗi cột có đệm trên/dưới 10px (cột chính thêm phải 20px) → khi xếp chồng tự có khoảng 20px, khi nằm ngang vẫn canh giữa dọc.
- Eyebrow dùng `&nbsp;` ("`%outlet_name%`&nbsp;· Gift&nbsp;voucher") để trên điện thoại chỉ xuống dòng sau dấu "·", không để chữ "VOUCHER" lẻ.
- QR luôn trong ô trắng đệm 8px (vùng yên tĩnh) — máy quét đọc được kể cả khi vé màu tối / dark mode. Kích thước cố định 120px.
- Mã voucher là **chữ thật** (Courier đậm, letter-spacing 2px) để copy được và đọc được khi ảnh bị chặn.
- Bo góc chỉ là trang trí: Outlook Windows hiện góc vuông (vé, cuống, vòng tròn số) vẫn gọn.
- Bỏ khỏi email: "About the voucher" dài / `%product_description%` (→ trang gift.html), thay bằng `%voucher_summary%` (1 dòng trên vé)
  + link `%terms_url%` ("Terms apply").

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
  `recipient_name sender_name gift_message card_bg card_line card_banner card_banner_overlay card_banner_split gift_url redeem_date product_name redeem_expiry voucher preheader`
  `outlet_name voucher_summary outlet_phone terms_url order_ref`, và nếu có: `qr_code_html voucher_terms_short_html`.
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

`vars` dùng tên biến không có `%`; biến HTML đặt đuôi `_html` (`qr_code_html`, `voucher_terms_short_html`).
`terms_url` thiếu → `gift_url + '#terms'`. `product_description_html` vẫn được nhận (tương thích) nhưng template v2 không còn chỗ dùng.
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
