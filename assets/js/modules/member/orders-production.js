/* My Orders — production (member/orders-production.html). ReOrder giữ y luồng template cũ. */
jQuery(function () {
    var baseUrl = jQuery('#root').data('base');

    // ReOrder: giỏ có hàng -> hỏi thay giỏ / thêm vào giỏ, giỏ trống -> đi luôn
    jQuery('.run_reorder').click(function () {
        var url = baseUrl + '/member/ordering?action=reordering&id=' + jQuery(this).data('id') + '&type=' + jQuery(this).data('type');
        var totalCart = parseInt(jQuery('#tmp_total_cart').text() || jQuery('#yqCartCount').text(), 10) || 0;

        if (totalCart > 0) {
            jQuery('#link_a1').attr('href', url + '&replace=true');
            jQuery('#link_a2').attr('href', url + '&replace=false');
            jQuery('#modalCenter').modal('show');
        } else {
            window.location.href = url + '&replace=true';
        }
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

    // Lúc tải trang: mở đơn đầu mỗi tab, tab rỗng hiện khối empty, có tab=pending thì mở tab Pending
    jQuery('#ordList [data-ord-pane]').each(function () {
        var cards = jQuery(this).find('.yq-ord__card');
        jQuery(this).find('.yq-ord__empty').prop('hidden', cards.length > 0);
        cards.first().find('[data-ord-toggle]').click();
    });
    if (/[?&]tab=pending/.test(window.location.search)) {
        jQuery('#ordTabs [data-ord-tab="pending"]').click();
    }
});
