/* ==========================================================================
   Cart — option đã chọn (div.viewcart--item.item--attri, template dùng chung)
   Đoạn p trong .name có dạng: "Nhãn: " + small(" - giá trị, ") + "Nhãn 2: " + small(…) …
   Một nhãn có thể có nhiều small (chọn nhiều). JS tách thành:
     div.yq-attr > ul.yq-attr__list > li.yq-attr__row > span.yq-attr__k + span.yq-attr__v (1 hoặc nhiều)
                 + a.yq-attr__remove (lấy href của link delete_attribute cũ)
   Giữ nguyên markup cũ (ẩn bằng class is-yq) để backend/JS cũ không bị ảnh hưởng.
   An toàn cho template engine production: KHÔNG dùng ký tự đô-la, KHÔNG để cặp ngoặc nhọn
   mở/đóng trên cùng 1 dòng.
   ========================================================================== */
jQuery(function () {
    var ICON_X = '<svg class="yq-i" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    function cleanLabel(s) {
        var t = jQuery.trim(s);
        if (t.charAt(t.length - 1) === ':') {
            t = jQuery.trim(t.slice(0, -1));
        }
        return t;
    }

    function cleanValue(s) {
        var t = jQuery.trim(s);
        if (t.charAt(0) === '-' || t.charAt(0) === '\u2013') {
            t = jQuery.trim(t.slice(1));
        }
        if (t.charAt(t.length - 1) === ',') {
            t = jQuery.trim(t.slice(0, -1));
        }
        return t;
    }

    function enhance(item) {
        var _item = jQuery(item);
        if (_item.hasClass('is-yq')) {
            return;
        }
        var _p = _item.find('.name p').first();
        if (!_p.length) {
            return;
        }

        var _list = jQuery('<ul class="yq-attr__list"></ul>');
        var _row = null;

        _p.contents().each(function () {
            var isText = this.nodeType === 3;
            var isSmall = this.nodeType === 1 && this.tagName.toLowerCase() === 'small';
            if (isText) {
                var label = cleanLabel(this.nodeValue || '');
                if (label) {
                    _row = jQuery('<li class="yq-attr__row"></li>');
                    _row.append(jQuery('<span class="yq-attr__k"></span>').text(label));
                    _list.append(_row);
                }
            } else if (isSmall) {
                var val = cleanValue(jQuery(this).text());
                if (!val) {
                    return;
                }
                if (!_row) {
                    _row = jQuery('<li class="yq-attr__row"></li>');
                    _row.append('<span class="yq-attr__k"></span>');
                    _list.append(_row);
                }
                _row.append(jQuery('<span class="yq-attr__v"></span>').text(val));
            }
        });

        if (!_list.children().length) {
            return;
        }

        var _box = jQuery('<div class="yq-attr"></div>').append(_list);
        var href = _item.find('.action a').first().attr('href');
        if (href) {
            var _rm = jQuery('<a class="yq-attr__remove"></a>').attr('href', href)
                .attr('title', 'Remove selected options').html(ICON_X + '<span>Remove</span>');
            _box.append(_rm);
        }

        _item.addClass('is-yq').append(_box);
    }

    jQuery('.viewcart--item.item--attri').each(function () {
        enhance(this);
    });
});
