/* My Orders — demo (member/orders.html). Cùng luồng với orders-production.js,
   chỉ khác ReOrder: thay /member/ordering?action=reordering bằng giỏ localStorage (YQ.orders + YQ.cart). */
jQuery(function () {
    function reorder(id, replace) {
        var order = YQ.orders.filter(function (o) {
            return o.id == id;
        })[0];
        if (replace) {
            YQ.cart.clear();
        }
        jQuery.each(order.items, function (i, row) {
            var p = YQ.product(row.id);
            var opt = p.options.filter(function (o) {
                return o.id == row.optionId;
            })[0];
            YQ.cart.add(p, opt, row.qty);
        });
        window.location.href = '../cart.html';
    }

    // ReOrder: giỏ có hàng -> hỏi thay giỏ / thêm vào giỏ, giỏ trống -> thay luôn
    jQuery('.run_reorder').click(function () {
        var id = jQuery(this).data('id');
        if (YQ.cart.count() > 0) {
            jQuery('#link_a1, #link_a2').data('id', id);
            jQuery('#modalCenter').modal('show');
        } else {
            reorder(id, true);
        }
    });
    jQuery('#link_a1, #link_a2').click(function (e) {
        e.preventDefault();
        reorder(jQuery(this).data('id'), this.id == 'link_a1');
    });

    // Tab
    jQuery('#ordTabs [data-ord-tab]').click(function () {
        var tab = jQuery(this).data('ord-tab');
        jQuery('#ordTabs [data-ord-tab]').removeClass('is-active').attr('aria-pressed', 'false');
        jQuery(this).addClass('is-active').attr('aria-pressed', 'true');
        jQuery('#ordList [data-ord-pane]').each(function () {
            jQuery(this).prop('hidden', jQuery(this).data('ord-pane') != tab);
        });
    });

    // Mở / đóng thẻ đơn
    jQuery('#ordList [data-ord-toggle]').click(function () {
        var card = jQuery(this).closest('.yq-ord__card');
        var open = !card.hasClass('is-open');
        card.toggleClass('is-open', open);
        jQuery(this).attr('aria-expanded', open ? 'true' : 'false');
        card.find('.yq-ord__briefs').prop('hidden', open);
        card.find('.yq-ord__full').prop('hidden', !open);
    });

    if (/[?&]tab=pending/.test(window.location.search)) {
        jQuery('#ordTabs [data-ord-tab="pending"]').click();
    }
});
