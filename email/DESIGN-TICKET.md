# Thiết kế e-voucher "Luxe Ticket" (v2, bản gọn v3)

> **v3 (gọn):** vé bỏ dòng `for %recipient_name%`, gạch 40×1 và hàng "Present this e-voucher…"; email bỏ khối How to redeem + Good to know,
> thay bằng 1 câu `Reserve at %outlet_phone% and show the QR code on arrival.` + dòng nhỏ `Purchased on … · Ref … · Terms apply`.
> `%voucher_terms_short%` không còn dùng; `%card_line%` không còn dùng trong template. Các mục dưới đây mô tả v2, phần đã bỏ coi như lịch sử.

Nguồn cảm hứng: các mẫu gift voucher cao cấp trên Pinterest / Behance (vé ngang có cuống + QR, khung viền vàng mảnh,
chữ serif lớn nghiêng, nền đậm + chữ vàng/kem, giấy kem cho lời nhắn, nhiều khoảng trống) và cấu trúc email eGift thật
(Gift Up!, Amazon, Uber; voucher khách sạn Grand Hyatt HK / Berlin, Shangri-La, Fairmont SG).

Áp dụng chung cho: email (`email/*`), xem trước thiệp trong checkout (`voucher/checkout*.html`), trang người nhận (`voucher/gift.html`).
Email: chỉ `<table>` + style inline (không `<style>`, media query, flex/grid, biến CSS, SVG, gradient, rgba, opacity).
Web (checkout, gift.html): CSS thường, nhưng phải **trông giống email**.

## Bảng màu & chữ

| Token | Giá trị | Dùng cho |
|---|---|---|
| `card_bg` | màu thiệp (Gold #8C7145 · Terracotta #6F2613 · Crimson #B9353F · Black #000000 · Auto) | nền vé |
| `card_line` | card_bg pha 35% trắng | đường nét đứt / hairline trên nền vé |
| gold | `#C8A96A` | khung viền vàng 1px trong vé, hoạ tiết ◆ |
| gold-light | `#E7D3A3` | eyebrow, chữ phụ trên nền vé |
| cream | `#F7F1E6` | giấy lời nhắn, cuống vé |
| ink | `#171613` · ink-soft `#3A342C` | chữ trên nền kem |
| muted | `#8A837A` | nhãn nhỏ trên nền kem |

Chữ (email-safe, không phụ thuộc web font):
- **Serif (tiêu đề, lời nhắn):** `Georgia, 'Times New Roman', Times, serif` — dùng *nghiêng* cho "Dear …", chữ ký, "for …".
- **Sans (nhãn, chữ nhỏ):** `Arial, Helvetica, sans-serif` — eyebrow viết hoa, letter-spacing 2–3px (đặt trên `<p>`/`<span>`, không trên `<td>`).
- Mã voucher: `'Courier New', Courier, monospace`, đậm, letter-spacing 2px — chữ thật (copy được).

## Cấu trúc email (từ trên xuống, rộng 640, nội dung 592)

1. **Logo khách sạn** (1 lần, ngoài thiệp) — như hiện tại.
2. **Khối lời chúc** (thay đổi theo `card_layout`) — nền giấy kem `#F7F1E6`, không dùng `card_bg`:
   - classic: ảnh banner 592 rộng ở trên → giấy kem padding 32px 36px.
   - overlay: ảnh làm nền (kỹ thuật cũ: `background` + VML + bgcolor fallback) → hộp **giấy kem** đè dưới (thay hộp màu cũ), cách mép 22px.
   - split: hybrid 2 cột (ảnh trái 236 | giấy kem phải 356), tự xếp chồng trên điện thoại.
   - minimal: chỉ giấy kem, canh giữa, có hoạ tiết vàng `—— ◆ ——` ở trên.
   - Nội dung giấy kem: eyebrow `A GIFT FOR YOU` (Arial 10px, ls 3px, `#8C7145`) · `Dear %recipient_name%,` (Georgia *italic* 26px/32px `#171613`) · lời nhắn (Georgia 17px/28px `#3A342C`) · chữ ký phải `— With love, %sender_name%` (Georgia *italic* 16px `#3A342C`).
3. **Khoảng 18px**, rồi **Vé voucher ngang** (giống nhau mọi layout):
   - Bảng ngoài `bgcolor=%card_bg%`, padding 10px, bo 10px (Outlook vuông — vẫn đẹp).
   - Bảng trong: `border:1px solid #C8A96A` (khung vàng), padding 22px 24px.
   - Hàng 1: hybrid 2 cột (MSO ghost table), canh giữa dọc:
     - **Chính** (max-width 360px): eyebrow `%outlet_name% · GIFT VOUCHER` (Arial 10px ls 3px `#E7D3A3`) → `%product_name%` (Georgia 26px/32px trắng, không đậm) → `for %recipient_name%` (Georgia *italic* 15px `#E7D3A3`) → hairline vàng 40×1 (`card_line`) → `%voucher_summary%` (Arial 13px/20px `#FFFFFF`, 1–2 dòng) → `VALID UNTIL %redeem_expiry%` (Arial 11px ls 1.5px `#E7D3A3`).
     - **Cuống** (max-width 170px): ô `bgcolor=#F7F1E6` bo 6px padding 14px canh giữa: ô trắng `#FFFFFF` padding 8px chứa `%qr_code%` (120px, không co) → mã `%voucher%` (Courier 14px đậm ls 2px `#171613`) → `SCAN TO REDEEM` (Arial 9px ls 2px `#8A837A`).
     - Trên điện thoại 2 cột xếp chồng: chính ở trên, cuống canh giữa ở dưới.
   - Hàng 2 (full width, cách 16px, `border-top:1px dashed %card_line%`, padding-top 12px): `Present this e-voucher at %outlet_name%. Screenshots are not accepted.` (Arial 11px `#E7D3A3`, canh giữa).
4. **Nút** `View your gift online` (bulletproof, nền `#171613`) canh giữa, cách vé 22px.
5. **How to redeem** — 3 bước đánh số (bảng 3 hàng: số trong vòng tròn vàng bằng ô `bgcolor=#C8A96A` 22×22 chữ trắng / chữ Arial 13px):
   1. `Reserve ahead: %outlet_phone%`
   2. `Quote your voucher code when booking.`
   3. `Show the QR code on arrival.`
6. **Good to know** — `%voucher_terms_short%` (HTML, tối đa 3 gạch đầu dòng, backend nhập ngắn cho từng voucher) + link `Full terms & conditions →` tới `%terms_url%`.
7. Dòng nhỏ xám canh giữa: `Purchased on %redeem_date% · Ref %order_ref%`.
8. Footer tối (như hiện tại).

Không còn trong email: khối "About the voucher" dài, `%product_description%` (chuyển sang trang `gift.html`).
`card-none` (mua cho mình): bỏ khối lời chúc, thay bằng banner chung + vé (eyebrow `YOUR GIFT VOUCHER`, dòng `for %recipient_name%` dùng tên người mua).

## Biến

| Biến | Mới / cũ | Ghi chú |
|---|---|---|
| `%product_name%` `%redeem_expiry%` `%voucher%` `%qr_code%` `%redeem_date%` `%gift_message%` | cũ | giữ tên |
| `%product_description%` | cũ | KHÔNG dùng trong email nữa — hiện ở trang gift.html |
| `%outlet_name%` | mới | vd "StraitsKitchen" |
| `%voucher_summary%` | mới | 1 dòng ≤ 80 ký tự, vd "Dinner buffet for 1 adult · 24 Dec 2026, 6–10 PM" |
| `%outlet_phone%` | mới | vd "+65 6732 1234" (bọc `<a href="tel:">` màu inline để iOS không tô xanh) |
| `%voucher_terms_short%` | mới, HTML | ≤ 3 `<li>` hoặc 3 dòng `<br>` |
| `%terms_url%` | mới | link điều khoản đầy đủ (có thể = `%gift_url%#terms`) |
| `%order_ref%` | mới | mã đơn, vd "GH12345678" |
| `%card_bg%` `%card_line%` `%card_banner%` `%card_banner_overlay%` `%card_banner_split%` `%recipient_name%` `%sender_name%` `%gift_url%` `%preheader%` | đã có | giữ |

Dữ liệu mẫu (samples / demo): outlet "StraitsKitchen", summary "Dinner buffet for 1 adult · 24 Dec 2026, 6–10 PM",
phone "+65 6732 1234", terms 3 dòng: "Valid for one adult on 24 Dec 2026." / "Advance reservation required; subject to availability." /
"Non-refundable, no cash value, one-time use.", order ref "GH12345678".
