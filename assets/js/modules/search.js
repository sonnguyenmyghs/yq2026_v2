/* ==========================================================================
   Module JS: search — live search sản phẩm trong panel #yqSearch
   Viết theo JS của template cũ (.input--search keyup -> $.post search/?product_name=):
     có chữ   -> ẩn "Popular searches" (.data--suggestion cũ = .yq-search__meta),
                 hiện kết quả (.results--search cũ = #yqSearchResults),
                 POST baseUrl + '/search/?product_name=' + keyword, response là các
                 a.search--zone--viewed, đổ vào #yqSearchList (.search--zone--vieweds cũ)
     xoá trắng -> hiện lại "Popular searches", ẩn kết quả

   Khác template cũ:
     1. Chờ 250ms sau lần gõ cuối mới gọi, huỷ request cũ còn đang chạy
        (gõ nhanh không bắn cả chục request, response cũ không đè response mới).
     2. Nghe event 'input' nên bấm chip gợi ý / nút xoá (nav.js trigger 'input') cũng chạy.
     3. Không có <span id="root" data-base="..."> (bản demo HTML) thì không gọi AJAX,
        chỉ lọc các .search--zone--viewed mẫu có sẵn trong markup theo từ khoá.
     4. Response không có sản phẩm nào (trống, hoặc bị redirect về trang chủ khi chưa có
        phiên đăng nhập) thì hiện "No products found", không đổ cả trang vào panel.
   ========================================================================== */
$(function () {

    var baseUrl = $('#root').data('base');
    var isDemo = $('#root').length == 0;       // demo HTML: không có backend
    var DELAY = 250;

    var timer = null, xhr = null;

    function render(value__input) {
        var search__field = $('#yqSearchForm');
        var data__suggestion = $('#yqSearch .yq-search__meta');
        var results__search = $('#yqSearchResults');
        var search__zone__vieweds = $('#yqSearchList');

        search__field.toggleClass('has-value', value__input.length > 0);

        if (xhr) { xhr.abort(); xhr = null; }

        if (!value__input) {
            data__suggestion.show();
            results__search.prop('hidden', true);
            $('#yqSearch').removeClass('has-results');
            return;
        }

        data__suggestion.hide();
        results__search.prop('hidden', false);
        $('#yqSearch').addClass('has-results');

        if (isDemo) {
            filterDemo(results__search, value__input);
            return;
        }

        results__search.addClass('is-loading');
        xhr = $.post(baseUrl + '/search/?product_name=' + encodeURIComponent(value__input), function (resultSearch) {
            var ok = hasItems(resultSearch);
            search__zone__vieweds.html(ok ? resultSearch : '');
            showEmpty(results__search, ok ? 1 : 0, value__input);
        }).fail(function (jq) {
            if (jq.statusText == 'abort') return;
            search__zone__vieweds.html('');
            showEmpty(results__search, 0, value__input);
        }).always(function () {
            results__search.removeClass('is-loading');
        });
    }

    function hasItems(resultSearch) {
        return typeof resultSearch == 'string'
            && resultSearch.indexOf('search--zone--viewed') > -1
            && !/<(html|body)[\s>]/i.test(resultSearch);
    }

    function showEmpty(results__search, found, value__input) {
        results__search.find('.search--zone--vieweds, .yq-sres__head').prop('hidden', found == 0);
        results__search.find('.yq-sres__empty').prop('hidden', found > 0);
        results__search.find('[data-sres-q]').text(value__input);
    }

    // Demo: hiện item có tên chứa một trong các từ khoá (bỏ từ < 3 ký tự)
    function filterDemo(results__search, value__input) {
        var words = $.grep(value__input.toLowerCase().split(/\s+/), function (w) { return w.length >= 3; });
        if (!words.length) words = [value__input.toLowerCase()];
        words = $.map(words, function (w) { return w.replace(/s$/, ''); });   // "Hampers" khớp "Hamper"

        var found = 0;
        results__search.find('.search--zone--viewed').each(function () {
            var text = $(this).find('.v-name').text().toLowerCase();
            var match = $.grep(words, function (w) { return text.indexOf(w) > -1; }).length > 0;
            $(this).prop('hidden', !match);
            if (match) found++;
        });

        showEmpty(results__search, found, value__input);
    }

    $(document).on('input', '#yqSearchInput', function () {
        var value__input = $.trim($(this).val());
        clearTimeout(timer);
        // xoá trắng thì trả về gợi ý ngay, không chờ
        if (!value__input) { render(''); return; }
        timer = setTimeout(function () { render(value__input); }, DELAY);
    });

});
