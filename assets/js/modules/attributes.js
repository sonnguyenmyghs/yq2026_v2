/* ==========================================================================
   Module JS: attributes — hành vi của thuộc tính sản phẩm (trang chi tiết)
   KHÔNG render HTML. HTML do PHP đổ vào #form-list-attribute từ các file trong
   backend-templates/attribute_type_*.html. File này chỉ bắt sự kiện (click/change)
   và đổi chữ / class. Vì HTML được thêm vào sau, sự kiện gắn vào document.

   Các loại:  v1 (chọn thẳng) · v2 (modal) · v3 (sku +/-) · dropdown

   Cảnh báo (chữ nằm trong .product--attr--msg của mỗi nhóm, có sẵn trong template):
     - Đang chọn:       "1 of 2 selected · choose 1 more"   -> chọn đủ: "2 of 2 selected" (dấu ✓)
     - Chọn quá số:     KHÔNG cho chọn thêm, báo "You can choose up to 2…" vài giây
                        (nhóm chọn 1 dùng checkbox: tự đổi sang giá trị mới)
     - Bấm Add To Cart khi chưa chọn đủ: add-to-cart.js phát 'yq:attr-invalid'
                        -> tô đỏ nhóm thiếu, ghi "Please choose 1 more", cuộn tới nhóm đầu tiên.
   ========================================================================== */
$(function () {

    /* ---------- Trạng thái + chữ cảnh báo của 1 nhóm ---------- */

    // Số đã chọn / số cần chọn của nhóm (v1, v2, dropdown: .product--attr · v3: .sku--variables--zone)
    function countOf(group) {
        if (group.hasClass('sku--variables--zone')) {
            return {
                checked: parseInt(group.find('.sku--variable--cur').val()) || 0,
                max: parseInt(group.find('.sku--variable--max').val()) || 0
            };
        }
        return {
            checked: group.find('.single--attribute input:checked').length,
            max: parseInt(group.data('max')) || 0
        };
    }

    // Ghi chữ vào mọi .product--attr--msg của nhóm (v2/v3 có thêm 1 cái trong modal/popup)
    // state: '' (bình thường) · 'done' (chọn đủ) · 'error' (đỏ)
    function setMsg(group, text, state) {
        group.find('.product--attr--msg').text(text).attr('data-state', state || '');
    }

    // Chữ trạng thái bình thường theo số đã chọn
    function showStatus(group) {
        var c = countOf(group);
        group.removeClass('is-invalid');

        if (c.checked == 0) {
            setMsg(group, '');
        } else if (c.checked < c.max) {
            setMsg(group, c.checked + ' of ' + c.max + ' selected · choose ' + (c.max - c.checked) + ' more');
        } else {
            setMsg(group, c.checked + ' of ' + c.max + ' selected', 'done');
        }
    }

    // Báo lỗi tạm thời (chọn quá số), sau vài giây quay lại chữ trạng thái
    function flashError(group, text) {
        clearTimeout(group.data('msgTimer'));
        setMsg(group, text, 'error');
        shake(group.find('.product--attr--msg'));
        group.data('msgTimer', setTimeout(function () { showStatus(group); }, 2800));
    }

    // Rung nhẹ 1 lần (CSS: .shake; tắt khi người dùng chọn giảm chuyển động)
    function shake(el) {
        el.removeClass('shake');
        el[0] && el[0].offsetWidth;                 // reset animation để rung lại được
        el.addClass('shake');
        setTimeout(function () { el.removeClass('shake'); }, 600);
    }

    // Nhóm này có đang thiếu không (theo đúng luật của add-to-cart.js)
    function isMissing(group) {
        var c = countOf(group);
        var isOptional = $('.sec--product--detail').hasClass('noo__need__choose');   // thuộc tính không bắt buộc
        if (isOptional && !group.hasClass('sku--variables--zone')) return c.checked > 0 && c.checked != c.max;
        return c.checked != c.max;
    }

    /* ---------- Bấm Add To Cart khi chưa chọn đủ (add-to-cart.js phát event) ---------- */
    $(document).on('yq:attr-invalid', function () {
        var first = null;

        $('.product--attr, .sku--variables--zone').each(function () {
            var group = $(this);
            if (!isMissing(group)) return;

            var c = countOf(group);
            var left = c.max - c.checked;
            clearTimeout(group.data('msgTimer'));
            group.addClass('is-invalid');
            setMsg(group, c.checked == 0
                ? 'Please choose ' + c.max + (c.max > 1 ? ' options' : ' option')
                : 'Please choose ' + left + ' more', 'error');
            shake(group);
            if (!first) first = group;
        });

        // Cuộn tới nhóm thiếu đầu tiên nếu đang khuất (chừa chỗ cho header sticky)
        if (first) {
            var top = first.offset().top - 140;
            var viewTop = $(window).scrollTop();
            if (top < viewTop || top > viewTop + $(window).height() - 160) {
                $('html, body').animate({ scrollTop: top }, 400);
            }
        }
    });

    /* ---------- "Your choices": giá trị đã chọn + giá từng nhóm / giá combo ----------
       Biến PHP cũ: <input type="hidden" id="arr_combo_surchage" value='{$arr_combo_surchage}'>
         -> {"sub_id": [id các nhóm trong combo], "sub_price": giá combo}
       Nhóm chọn đủ (số đã chọn = data-max) thì hiện giá nhóm (data-price).
       Các nhóm đã chọn trùng đúng sub_id thì hiện giá combo thay cho giá từng nhóm. */
    var combo = {};
    try { combo = JSON.parse($('#arr_combo_surchage').val() || '{}') || {}; } catch (e) { combo = {}; }
    var currency = $('.currency-hotel').val() || '';

    function sameTeams(a, b) {
        if (!b || a.length != b.length) return false;
        return a.slice().sort().join(',') == $.map(b, String).sort().join(',');
    }

    function refreshChoices() {
        var names = [], prices = [], teams = [];

        // v1 / v2 / dropdown
        $('.product--attr').each(function () {
            var group = $(this);
            var checked = group.find('.single--attribute input:checked');
            if (!checked.length) return;

            names.push(checked.map(function () { return this.value; }).get().join(', '));
            teams.push('' + group.data('team'));
            if (checked.length == group.data('max') && parseFloat(group.data('price')) > 0) {
                prices.push(currency + ' ' + group.data('price'));
            }
        });

        // v3: biến thể có số lượng
        $('.sku--variable').each(function () {
            var n = parseInt($(this).find('.sku--variable--input').val());
            if (n > 0) names.push($.trim($(this).find('.text').text()) + ' × ' + n);
        });

        var isCombo = sameTeams(teams, combo.sub_id);
        $('.your--choices').html(names.join(' · '));
        $('.your--choices--single--price').html(prices.length ? '(' + prices.join(' + ') + ')' : '');
        $('.your--choices--combo--price').html(isCombo ? '(' + currency + ' ' + combo.sub_price + ' combo price)' : '');
        $('.your--choices--single').toggleClass('is-on', names.length > 0 && !isCombo);
        $('.your--choices--combo').toggleClass('is-on', isCombo);
    }

    /* ---------- v1 + v2 + dropdown: chọn / bỏ chọn một giá trị ---------- */
    $(document).on('change', '.product--attr .single--attribute input', function () {
        var input = $(this);
        var group = input.closest('.product--attr');
        var max = parseInt(group.data('max')) || 0;
        var checked = group.find('.single--attribute input:checked');

        // Chọn quá số cho phép
        if (input.is(':checked') && max > 0 && checked.length > max) {
            if (max == 1) {
                // chọn 1: đổi sang giá trị mới, bỏ giá trị cũ
                checked.not(input).prop('checked', false);
                group.find('.product--attr--preview i').remove();
            } else {
                input.prop('checked', false);
                flashError(group, 'You can choose up to ' + max + '. Deselect one to change.');
                return;
            }
        }

        // v2: cập nhật dòng "Items selected" bên ngoài modal
        var preview = group.find('.product--attr--preview span');
        preview.find('i[data-id="' + input.attr('id') + '"]').remove();
        if (input.is(':checked')) {
            preview.append('<i data-id="' + input.attr('id') + '">' + input.val() + '</i>');
        }

        clearTimeout(group.data('msgTimer'));
        showStatus(group);
        refreshChoices();
    });

    /* ---------- v2: mở / đóng modal ---------- */
    $(document).on('click', '.product--attr .more--attr', function () {
        $(this).closest('.product--attr').find('.modal--attribute').addClass('active');
    });
    $(document).on('click', '.modal--attribute--overlay, .modal--attribute--head .ti-close, .modal--attribute--done', function () {
        $('.modal--attribute').removeClass('active');
    });

    /* ---------- v3 (sku): + / - số lượng từng biến thể ---------- */
    // .sku--variable--max = tổng tối đa, .sku--variable--cur = tổng đã chọn
    $(document).on('click', '.sku--variable .ti-plus', function () {
        var item = $(this).closest('.sku--variable');
        var zone = item.closest('.sku--variables--zone');
        var input = item.find('.sku--variable--input');
        var badge = item.find('.sku--variable--badge');
        var max = parseInt($('.sku--variable--max').val());
        var cur = parseInt($('.sku--variable--cur').val()) || 0;

        if (cur >= max) {
            flashError(zone, 'Your box is full (' + max + ' of ' + max + '). Remove one to add another.');
            return;
        }
        var number = (parseInt(input.val()) || 0) + 1;
        input.val(number);
        badge.html(number).addClass('show');
        $('.sku--variable--cur').val(cur + 1);
        showStatus(zone);
        refreshChoices();
    });

    $(document).on('click', '.sku--variable .ti-minus', function () {
        var item = $(this).closest('.sku--variable');
        var zone = item.closest('.sku--variables--zone');
        var input = item.find('.sku--variable--input');
        var badge = item.find('.sku--variable--badge');
        var number = parseInt(input.val()) || 0;
        var cur = parseInt($('.sku--variable--cur').val()) || 0;

        if (number < 1) return;
        number--;
        input.val(number > 0 ? number : '');       // về 0 thì để rỗng
        badge.html(number).toggleClass('show', number > 0);
        $('.sku--variable--cur').val(cur - 1);
        showStatus(zone);
        refreshChoices();
    });

    // v3 trên mobile: mở / đóng popup chọn biến thể
    $(document).on('click', '.sku--variables--zone .more--attr, .add--product--mobile .btn', function (e) {
        e.preventDefault();
        $('.sku--props, .sku--overlay--mobile').addClass('show');
    });
    $(document).on('click', '.sku--overlay--mobile, .sku--head--close', function () {
        $('.sku--props, .sku--overlay--mobile').removeClass('show');
    });

    /* ---------- dropdown: mở menu, chọn 1 giá trị ---------- */
    function closeDropdowns() {
        $('.dropdown-menu').removeClass('show');
        $('.dropdown-button').removeClass('active');
        $('.dropdown-arrow').removeClass('rotate');
    }

    $(document).on('click', '.dropdown-button', function (e) {
        e.preventDefault();
        var box = $(this).closest('.dropdown-container');
        var wasOpen = box.find('.dropdown-menu').hasClass('show');
        closeDropdowns();
        if (!wasOpen) {
            box.find('.dropdown-menu').addClass('show');
            $(this).addClass('active');
            box.find('.dropdown-arrow').addClass('rotate');
        }
    });

    $(document).on('click', '.dropdown-item', function (e) {
        e.preventDefault();                          // tự đặt checked bên dưới, tránh label click 2 lần
        var item = $(this);
        var box = item.closest('.dropdown-container');

        box.find('.dropdown-item input').prop('checked', false);
        box.find('.dropdown-item').removeClass('selected');
        item.addClass('selected').find('input').prop('checked', true).trigger('change');
        box.find('.dropdown-selected').text(item.data('value'));
        closeDropdowns();
    });

    // Bấm ra ngoài hoặc ESC: đóng dropdown / modal / popup
    $(document).on('click', function (e) {
        if (!$(e.target).closest('.dropdown-container').length) closeDropdowns();
    });
    $(document).on('keydown', function (e) {
        if (e.key !== 'Escape') return;
        closeDropdowns();
        $('.modal--attribute').removeClass('active');
        $('.sku--props, .sku--overlay--mobile').removeClass('show');
    });
});
