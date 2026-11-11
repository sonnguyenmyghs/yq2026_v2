# Deploy checkout voucher (production)

Bản deploy: `voucher/checkout-production.html` — **partial** thay cho template voucher cũ `select_payment.html`
(bản đang chạy lưu ở `old/select_payment.html`). Bản demo có dữ liệu mẫu: `voucher/checkout.html` (không deploy).

Giả định: thư mục `assets/` của repo nằm ngay dưới skin (`$_SKIN_NO_CDN` = `…/templates/defaultv3.1.yq/yqhyattsgstore_demo`).
Kiểm tra lại đường dẫn skin trước khi upload.

## 1. File cần upload

| File trong repo | Đích trên server (dưới skin `$_SKIN_NO_CDN/`) | Ghi chú |
|---|---|---|
| `voucher/checkout-production.html` | file template voucher `select_payment.html` (thư mục template của site) | Đổi tên thành `select_payment.html` khi upload. Giữ bản cũ để rollback (mục 6) |
| `assets/css/parts/checkout-v2.css` | `assets/css/parts/checkout-v2.css` | Dùng chung với checkout food |
| `assets/css/parts/personalise.css` | `assets/css/parts/personalise.css` | Ô banner / màu / thiệp |
| `assets/css/parts/voucher/checkout-voucher.css` | `assets/css/parts/voucher/checkout-voucher.css` | Thư mục con MỚI `voucher/` |
| `assets/js/modules/voucher/email-render.js` | `assets/js/modules/voucher/email-render.js` | Thư mục con MỚI. Nạp trước gift.js |
| `assets/js/modules/voucher/checkout-voucher-gift.js` | `assets/js/modules/voucher/checkout-voucher-gift.js` | Panel "Send as a gift" |
| `assets/js/modules/voucher/checkout-voucher-production.js` | `assets/js/modules/voucher/checkout-voucher-production.js` | Promo, validate, POST |
| `assets/img/e-afternoon-tea.jpg` `o-festive.jpg` `o-birthdays.jpg` `o-anniversaries.jpg` `e-dining.jpg` `e-spa.jpg` `banner-cny.jpg` `e-staycation.jpg` `editorial-cake.jpg` | `assets/img/…` | 9 banner mẫu của e-card (thumbnail + ảnh thiệp) |
| `assets/img/qr-sample.png` | `assets/img/qr-sample.png` | QR mẫu trong popup "Preview full email" |
| `email/voucher-gift.html` + `email/parts/card-*.html` | `email/…` (cạnh `assets/`, tức `$_SKIN_NO_CDN/email/`) | **Chỉ cần khi KHÔNG có** `data-email-endpoint`: popup tự ráp email từ các file này. Không cần `email/preview.html`, `email/samples/`, `email/README.md` |

Không upload: `voucher/checkout.html`, `assets/js/modules/voucher/checkout-voucher.js` (demo), `data.js` / `app.js` / `pages.js`.

Layout của site phải có sẵn (như template cũ): jQuery 3.x, Bootstrap **5.3** bundle (offcanvas), `<span id="root" data-base="…">`,
và `assets/css/style.css` của skin (biến `--yq-*`, `.yq-container`, `.yq-back`). Partial tự nạp intl-tel-input 25.2.0 từ jsDelivr.

Khi sửa CSS/JS sau này: tăng `?v1` → `?v2` trong `checkout-production.html` để xoá cache.

## 2. Biến template dùng trong partial

Giống template cũ: `{$status}`, `{$_htmlListCartCheckOut}`, `{$totalCost}`, `{$_OLD_CURRENCY_BY_CART}`, `{$option_list_country}`,
`{$register[email|email_confirm|firstname|lastname|phone]}`, `{$memberInfor[member_email|member_firstname|member_lastname]}`,
`{$lang[first_name|last_name]}`, `{$_REQUEST[name_receive|email_receive|note_receive]}`, `{$__flagIsLogined}`, `{$__htmlIslogined}`,
`{$__htmllogined}`, `$_BASE`, `$_SKIN_NO_CDN`. Mới: `{$_SESSION['uid']}` (input `#input__isMember`, không có name, JS dùng để biết khách
đã đăng nhập — trống = khách vãng lai).

Engine xử lý cả `$` / ngoặc nhọn trong comment HTML → comment trong partial không được chứa các ký tự đó.

## 3. Thuộc tính của panel `#cvvGiftPanel` (backend tuỳ chọn điền)

| Thuộc tính | Mặc định trong partial | Backend nên điền | Trống thì |
|---|---|---|---|
| `data-card-theme` | trống | id banner gợi ý nếu sản phẩm có (`celebrate christmas birthday anniversary dining spa lunar stay sweet`) | JS dò từ khoá trong tên voucher |
| `data-voucher-name` | trống | tên voucher (1 sản phẩm) | đọc text `.summary__list--items` (dòng đầu) |
| `data-voucher-expiry` | trống | hạn dùng hiển thị | "Confirmed after payment" |
| `data-voucher-desc` | trống | mô tả ngắn | câu mặc định |
| `data-gift-url` | trống | để trống (link thật chỉ có sau thanh toán) | `#` trong preview |
| `data-email-base` | trống | để trống | `$_SKIN_NO_CDN/email/` (suy từ src của email-render.js) |
| `data-email-endpoint` | trống | URL endpoint preview (xem `email/README.md`, "Endpoint xem trước") | ráp từ `email/` tĩnh. Endpoint lỗi → JS tự thử `email/` tĩnh; cả hai lỗi → hộp hiện thông báo lỗi, checkout vẫn chạy |

## 4. Checklist backend

- [ ] Form đổi sang `enctype="multipart/form-data"` (đã có trong partial). Đọc `$_POST` như cũ; file ở `$_FILES['card_banner_file']`.
- [ ] Field cũ không đổi tên / nghĩa (bảng mục 5). `register[phone]` dạng E.164 (`+6591234567`) do intl-tel-input điền.
- [ ] **Tặng quà** khi `card_add == 1` và `name_receive` + `email_receive` có giá trị. "For myself" → 3 ô `*_receive` gửi rỗng và **không có** field `card_*`.
- [ ] Validate lại phía server (JS chỉ là lớp đầu):
  - `name_receive` bắt buộc khi tặng, ≤ 60 ký tự; `email_receive` email hợp lệ; `note_receive` ≤ 300 ký tự, escape + `nl2br` khi in.
  - `card_banner` ∈ `celebrate christmas birthday anniversary dining spa lunar stay sweet upload`.
  - `card_layout` ∈ `classic overlay split minimal` (sai → `classic`).
  - `card_colour` ∈ `auto gold terracotta crimson black`; `card_colour_hex` khớp `^#[0-9A-Fa-f]{6}$` (sai → `#8C7145`).
    Preset: gold `#8C7145`, terracotta `#6F2613`, crimson `#B9353F`, black `#000000`; `auto` = màu JS tính từ ảnh (đã đủ tương phản chữ trắng).
  - `card_banner=upload`: bắt buộc có file; chỉ JPG/PNG/WebP (kiểm tra MIME thật bằng `finfo`/`getimagesize`, không tin đuôi file), ≤ 10MB.
    Banner mẫu → field file **không được gửi** (JS tắt input); nếu vẫn nhận phần rỗng (`UPLOAD_ERR_NO_FILE`) thì bỏ qua.
  - Không còn video: không có `card_banner_type`; từ chối mọi file video.
- [ ] Kiểm tra `upload_max_filesize` / `post_max_size` PHP ≥ 12M (ảnh 10MB + field), và giới hạn body của web server (nginx `client_max_body_size`).
- [ ] Lưu ảnh tải lên (đổi tên ngẫu nhiên, ngoài thư mục chạy PHP hoặc chặn thực thi), xuất **URL https tuyệt đối**. Banner mẫu → URL tuyệt đối của `assets/img/<file>` tương ứng.
- [ ] Cắt sẵn ảnh cho email: overlay **546×420, đúng 1x** (`%card_banner_overlay%` — KHÔNG dùng @2x: Gmail web hiện ảnh nền đúng kích thước gốc, xem email/README.md), split **208×300** (@2x 416×600, `%card_banner_split%`); classic dùng ảnh gốc (khuyên ≤ 1200px rộng).
- [ ] Email: chọn khối `email/parts/card-<card_layout>.html`, thay biến rồi đặt vào `%gift_card%` của `email/voucher-gift.html` (bảng biến: `email/README.md`).
- [ ] Gửi email: **tặng** → email voucher + thiệp tới `email_receive`; người mua vẫn nhận biên lai / email xác nhận (ghi rõ đã gửi cho ai). **For myself** → email voucher như cũ tới người mua (không có thiệp, layout `none`).
- [ ] Trang mở quà `/gift/<token>` (giao diện `voucher/gift.html`): token ngẫu nhiên, khó đoán, gắn với đơn/voucher; `%gift_url%` = URL tuyệt đối trang này.
- [ ] (Tuỳ chọn) endpoint preview cho `data-email-endpoint`: POST form, trả HTML email với mã/QR mẫu, server tự escape mọi giá trị.
- [ ] Lỗi validate phía server: in lại form với `{$_REQUEST['name_receive']}`… → JS tự giữ chế độ "Send as a gift" (thiệp về gợi ý, ảnh tải lên phải chọn lại — trình duyệt không giữ file).

## 5. Bảng field cũ → mới

| Template cũ (`old/select_payment.html`) | Bản mới | Ghi chú |
|---|---|---|
| `register[email]`, `register[email_confirm]`, `register[firstname]`, `register[lastname]`, `register[country]` | giữ nguyên | |
| `#phone_register` + hidden `register[phone]` (intl-tel-input cũ, jQuery plugin) | giữ nguyên tên | intl-tel-input v25; JS ghi `iti.getNumber()` (E.164) vào hidden trước khi POST |
| `register[birthday]` | **bỏ** | Trang đang chạy không hiện; backend coi là tuỳ chọn |
| `register[subscribed]`, `agree` | giữ nguyên | `agree` bắt buộc (JS) |
| `member[email]` (disabled), `member[firstname]`, `member[lastname]` | giữ nguyên | |
| `name_receive`, `email_receive`, `note_receive` | giữ nguyên tên, chuyển vào panel "Send as a gift" | For myself → gửi rỗng |
| — | `card_add` (=1), `card_banner`, `card_banner_file`, `card_layout`, `card_colour`, `card_colour_hex` | MỚI, chỉ khi tặng |
| `action=payment`, `pay_with=checkout`, `promotion_code_yq` (`#input-hidden-promo-code`) | giữ nguyên | |
| `#input-promo-code`, `#btn-check-promocode`, `#warning-promo`, `#div-show-discount-promo`, `#name-show-discount-promo`, `#costdiscount-show-discount-promo`, `#div-total-cost`, `#total-default-no-promo`, `#checkDiscount` | giữ nguyên | Thêm `#btn-cancel-promocode` (huỷ mã: `POST /reward/?act=delete_gift&code=…`) |
| `{$status}` | giữ nguyên (trên cùng form) | |
| `cvv_for` (For myself / Send as a gift) | không POST | radio có `form="cvvNoSubmit"` |
| Khối đăng nhập `{$_htmlShowLoginCart}`, `.paywith__logined` (`{$member[...]}`), `{$_htmlSelectPaymmentBankSetup}` (đã comment) | **bỏ** | Đăng nhập dùng header của site |
| `js/app_voucher.js` + inline script | **bỏ** | Thay bằng 3 file trong `assets/js/modules/voucher/` |

## 6. Giới hạn đã biết

- Mã voucher / QR trong popup preview luôn là mẫu (`GH-XXXX-XXXX`, `qr-sample.png`) — mã thật chỉ có sau thanh toán.
- Màu "Auto" đọc pixel ảnh bằng canvas: ảnh khác domain không có CORS → dùng `#8C7145`. Banner nằm trên cùng domain skin thì không sao.
- Ảnh tự tải không giữ được khi server trả form lỗi (giới hạn trình duyệt).
- Giỏ nhiều voucher: thiệp + người nhận áp cho cả đơn (1 người nhận như template cũ).
- Gợi ý banner dựa trên từ khoá tiếng Anh trong tên voucher; không khớp → Dining.
- Script ngoài của site có bắt `.btn__paynow` / `#inputRegister` (từ template cũ) thì cần kiểm tra không đụng nhau — JS mới gắn vào `.confirm--order--btn`.

## 7. Rollback

Giữ `select_payment.html` bản cũ (= `old/select_payment.html`) trên server, ví dụ đổi tên `select_payment.old.html`.
Rollback = chép lại file cũ đè lên; CSS/JS mới để nguyên không ảnh hưởng. Backend nhận field `card_*` phải chịu được khi chúng không có
(template cũ không gửi, form cũ không multipart).
