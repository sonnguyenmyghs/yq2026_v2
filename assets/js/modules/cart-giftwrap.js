/* ==========================================================================
   Cart — "Add gift wrap" (sản phẩm dịch vụ Gift Wrapping, id 30607)
   Mỗi .yq-line có nút (không link sang trang chi tiết):
     <button class="yq-line__wrap" type="button" data-wrap-add
        data-wrap-pid="30607" data-wrap-item="Tên sản phẩm">
   - Production (#root[data-base] có): addCart sản phẩm 30607 giống hệt Add to cart của sản phẩm
     thường (add-to-cart.js), xong reload trang cart. Lỗi -> toast, ở lại trang.
   - Demo HTML (không có #root): chèn dòng Gift Wrapping ngay dưới món đó, tính lại tổng.
   Món đã có gói quà: backend thêm class is-added + đổi chữ thành "Gift wrap added".
   ========================================================================== */
$(function () {
    var $root = $('#root');
    var isDemo = $root.length == 0;
    var baseUrl = $root.data('base');

    var ICON_OK = '<svg class="yq-i" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 12.5 9.5 18 20 6.5"/></svg>';
    var ICON_X = '<svg class="yq-i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var WRAP = { name: 'Gift Wrapping', style: 'Kraft paper · silk ribbon', price: 8, img: 'assets/img/banner-corporate.jpg' };

    function esc(s) { return $('<div>').text(s).html(); }

    function markAdded($a) {
        $a.removeClass('is-busy').addClass('is-added').prop('disabled', true)
          .html(ICON_OK + '<span>Gift wrap added</span>');
    }

    $(document).on('click', '[data-wrap-add]', function () {
        var $a = $(this);
        if ($a.hasClass('is-added') || $a.hasClass('is-busy')) return;

        var item = $a.data('wrap-item') || '';
        var $line = $a.closest('.yq-line');

        if (isDemo) {
            addDemo($a, $line, item);
            return;
        }

        addCartWrap($a);
    });

    /* Production: y hệt add-to-cart.js khi bấm Add to cart của 1 sản phẩm thường
       (cùng URL /cart/?action=addCart, POST, server trả JSON) — chỉ khác product_id = 30607,
       số lượng 1, không có thuộc tính. Add xong reload trang cart để server in dòng Gift Wrapping. */
    function addCartWrap($a) {
        var cartProductId = $a.data('wrap-pid') || 30607;
        var cartQuantiry = 1;
        var cartAttribute = '';
        var __amount = '';

        $a.addClass('is-busy');
        $.ajax({
            url: baseUrl + '/cart/?action=addCart&product_id=' + cartProductId + '&quantity=' + cartQuantiry + '&product_att=' + cartAttribute + '&amoun_att=' + __amount,
            type: 'post',
            data: '',

            success: function (data) {
                var data = typeof data === 'string' ? $.parseJSON(data) : data;
                $('#yqCartCount, #yqCartCountM, [data-oc-count]').html(data.totalItems).toggleClass('is-on', data.totalItems > 0);
                markAdded($a);
                window.location.reload();
            },

            error: function () {
                $a.removeClass('is-busy');
                YQ.toast('Could not add to cart. Please try again.');
            }
        });
    }

    /* ---------- Demo: chèn dòng Gift Wrapping dưới món được chọn ---------- */
    function addDemo($a, $line, item) {
        var key = 'gift-wrapping::' + ($line.attr('data-key') || item);
        var html =
            '<div class="yq-line yq-line--wrap" data-key="' + esc(key) + '" data-price="' + WRAP.price + '" data-wrap-for="' + esc($line.attr('data-key')) + '">' +
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
        var $w = $(html).insertAfter($line);
        markAdded($a);
        $w.find('[data-qty]').trigger('yq:qty');     // pages.js recalc() tính lại tổng
        if (YQ.toast) YQ.toast('Gift wrap added for ' + item);
    }

    /* Xoá dòng gói quà (demo) -> trả lại link "Add gift wrap" cho món đó.
       Xoá món chính -> xoá luôn dòng gói quà đi kèm. Chạy TRƯỚC handler của pages.js (capture). */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('#cartWrap [data-remove]');
        if (!btn || !isDemo) return;
        var $line = $(btn).closest('.yq-line');
        if ($line.hasClass('yq-line--wrap')) {
            var forKey = $line.attr('data-wrap-for');
            var $a = $('#cartLines .yq-line').filter(function () { return $(this).attr('data-key') === forKey; }).find('[data-wrap-add]');
            $a.removeClass('is-added').prop('disabled', false).html($a.data('label-html'));
        } else {
            $('#cartLines .yq-line--wrap').filter(function () { return $(this).attr('data-wrap-for') === $line.attr('data-key'); }).remove();
        }
    }, true);

    // nhớ nội dung gốc của link để trả lại khi xoá gói quà
    $('[data-wrap-add]').each(function () { $(this).data('label-html', $(this).html()); });
});
