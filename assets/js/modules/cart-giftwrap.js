/* ==========================================================================
   Cart — nút "Add gift wrap" (sản phẩm dịch vụ Gift Wrapping, id 30607)
   An toàn cho template engine production: KHÔNG dùng ký tự đô-la, KHÔNG để cặp ngoặc nhọn
   mở/đóng trên cùng 1 dòng (engine xử lý cả 2 thứ này, kể cả trong comment / script inline).
   Mỗi .yq-line có nút (không link sang trang chi tiết):
     button.yq-line__wrap  data-wrap-add  data-wrap-pid="30607"  data-wrap-item="Tên sản phẩm"
   - Production (có #root[data-base]): addCart sản phẩm 30607 giống hệt Add to cart của sản phẩm
     thường (add-to-cart.js), xong reload trang cart. Lỗi -> toast, ở lại trang.
   - Demo HTML (không có #root): chèn dòng Gift Wrapping ngay dưới món đó, tính lại tổng.
   Giỏ đã có gói quà: PHP in sẵn data-product-id trên mỗi .yq-line; có dòng data-product-id="30607"
   -> ẩn HẾT nút .yq-line__wrap có data-wrap-pid="30607" ngay khi load trang.
   ========================================================================== */
jQuery(function () {
    var _root = jQuery('#root');
    var isDemo = _root.length == 0;
    var baseUrl = _root.data('base');

    var ICON_X = '<svg class="yq-i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    var WRAP = new Object();
    WRAP.pid = '30607';
    WRAP.name = 'Gift Wrapping';
    WRAP.style = 'Kraft paper · silk ribbon';
    WRAP.price = 8;
    WRAP.img = 'assets/img/banner-corporate.jpg';

    function esc(s) {
        return jQuery('<div>').text(s).html();
    }

    /* Ẩn / hiện các nút gói quà của sản phẩm pid tuỳ theo giỏ đã có dòng pid đó chưa */
    function syncWrapButtons(pid) {
        pid = String(pid || WRAP.pid);
        var inCart = jQuery('#cartLines .yq-line[data-product-id="' + pid + '"]').length > 0;
        jQuery('[data-wrap-add][data-wrap-pid="' + pid + '"]').toggleClass('d-none', inCart);
    }

    jQuery(document).on('click', '[data-wrap-add]', function () {
        var _btn = jQuery(this);
        if (_btn.hasClass('is-busy')) {
            return;
        }
        if (isDemo) {
            addDemo(_btn.closest('.yq-line'), _btn.data('wrap-item') || '');
            return;
        }
        addCartWrap(_btn);
    });

    /* Production: y hệt add-to-cart.js khi bấm Add to cart của 1 sản phẩm thường
       (cùng URL /cart/?action=addCart, POST, server trả JSON) — chỉ khác product_id = 30607,
       số lượng 1, không có thuộc tính. Add xong ẩn nút gói quà + reload trang cart. */
    function addCartWrap(_btn) {
        var cartProductId = _btn.data('wrap-pid') || WRAP.pid;
        var cartQuantiry = 1;
        var cartAttribute = '';
        var __amount = '';

        _btn.addClass('is-busy').prop('disabled', true);
        jQuery.ajax({
            url: baseUrl + '/cart/?action=addCart&product_id=' + cartProductId + '&quantity=' + cartQuantiry + '&product_att=' + cartAttribute + '&amoun_att=' + __amount,
            type: 'post',
            data: '',
            success: function (data) {
                var res = typeof data === 'string' ? jQuery.parseJSON(data) : data;
                jQuery('#yqCartCount, #yqCartCountM, [data-oc-count]').html(res.totalItems).toggleClass('is-on', res.totalItems > 0);
                jQuery('[data-wrap-add][data-wrap-pid="' + cartProductId + '"]').addClass('d-none');
                window.location.reload();
            },
            error: function () {
                _btn.removeClass('is-busy').prop('disabled', false);
                YQ.toast('Could not add to cart. Please try again.');
            }
        });
    }

    /* Demo: chèn dòng Gift Wrapping dưới món được chọn */
    function addDemo(_line, item) {
        var html =
            '<div class="yq-line yq-line--wrap" data-product-id="' + WRAP.pid + '" data-key="gift-wrapping::' + esc(item) + '" data-price="' + WRAP.price + '">' +
              '<div class="yq-line__media yq-media"><img src="' + WRAP.img + '" alt="' + WRAP.name + '" decoding="async"></div>' +
              '<div class="flex-grow-1">' +
                '<div class="yq-line__title">' + WRAP.name + '</div>' +
                '<div class="yq-line__opt">' + esc(WRAP.style) + '</div>' +
                '<div class="yq-line__for">Gift wrap item: <b>' + esc(item) + '</b></div>' +
                '<div class="d-none" data-qty data-min="1"><span data-qty-val>1</span></div>' +
              '</div>' +
              '<div class="text-end"><div class="yq-line__price">' + YQ.money(WRAP.price) + '</div></div>' +
              '<button class="yq-line__remove" type="button" data-remove aria-label="Remove gift wrap">' + ICON_X + '</button>' +
            '</div>';
        var _wrapLine = jQuery(html).insertAfter(_line);
        syncWrapButtons(WRAP.pid);
        _wrapLine.find('[data-qty]').trigger('yq:qty');
        if (YQ.toast) {
            YQ.toast('Gift wrap added for ' + item);
        }
    }

    /* Demo: xoá dòng (gói quà hoặc món chính) -> pages.js gỡ dòng; sau đó tính lại nút gói quà */
    jQuery(document).on('click', '#cartWrap [data-remove], #cartClear', function () {
        setTimeout(function () {
            syncWrapButtons(WRAP.pid);
        }, 0);
    });

    /* Vào trang: PHP đã in dòng data-product-id="30607" -> ẩn nút ngay */
    syncWrapButtons(WRAP.pid);
});
