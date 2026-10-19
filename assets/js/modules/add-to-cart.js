/* ==========================================================================
   Module JS: add-to-cart — nút "Add To Cart" / "Buy Now"
   Viết theo đúng file JS của template cũ (cùng tên biến, cùng thứ tự kiểm tra,
   cùng URL AJAX và cùng field response) để backend không phải đổi gì.

   HTML nút (giống template cũ):
     <button class="addToCart" data-page="1" data-productid="29176" data-quantity="1"
             data-attribute="1" data-go="1" data-var="0">Add To Cart</button>
     <button class="addToCart" data-buynow="1" ...>Buy Now</button>

   Khác template cũ:
     1. Cập nhật thêm badge giỏ của header mới (#yqCartCount, #yqCartCountM).
     2. imageAnimation() dùng hiệu ứng bay vào giỏ của cart-anim.js, rồi mở drawer
        giỏ hiển thị data.html + data.totalCost (response giữ nguyên như cũ;
        htmlModal / htmlWarning vẫn đổ vào #modalShowCartCheckOut / #modalShowWarning
        nếu trang có các phần tử đó).
     3. Không có <span id="root" data-base="..."> (bản demo HTML) thì thêm vào giỏ
        demo YQ.cart (localStorage) thay cho AJAX — xem addCartDemo().
   ========================================================================== */
$(function () {

    var baseUrl = $('#root').data('base');
    var isDemo = $('#root').length == 0;       // demo HTML: không có backend

    // add to cart

    $(document).on('click', '.addToCart', function (e) {
        e.preventDefault();

        var _this = $(this);
        var cartProductId = $(this).attr('data-productid'),
            cartQuantiry = $(this).attr('data-quantity'),
            cartAttribute = $('.redeem_attreibute').val(),
            __status_attribute = $('.status-product-attribute').val(),
            _data_list_attribute = $('#form-list-attribute').serialize(),
            section__product__detail = $('.sec--product--detail');

        // Nút trên card ở trang list (data-page="1") không kiểm tra thuộc tính
        // của trang chi tiết (VD: card "You may also like" nằm trong trang chi tiết)
        var isProductDetail = _this.data('page') != 1;

        // variable v1
        var flagVariable = 0;
        if (isProductDetail && $('.sku--variable--max').length > 0) {
            var var__max = parseInt($('.sku--variable--max').val());
            var var__cur = $('.sku--variable--cur').val();
            var__cur = var__cur === '' ? 0 : var__cur;

            if (parseInt(var__cur) != var__max) {
                $('.sku--variables--zone').addClass('shake');
                setTimeout(function () { $('.sku--variables--zone').removeClass('shake'); }, 1200);
                flagVariable = 1;
            }
        }

        // attribute v2
        var flagAttribute = 0;
        if (!isProductDetail) {
            flagAttribute = 0;
        } else if (section__product__detail.hasClass('noo__need__choose') && $('.product--attr .single--attribute input:checked').length == 0 && section__product__detail.data('addon') != 'use__addon__version') {
            flagAttribute = 0;
        } else {
            if (section__product__detail.data('addon') == 'use__addon__version') {

                if ($('.product--attr').find('.single--attribute input:checked').length != 1) {
                    $('.product--attr').addClass('shake');
                    setTimeout(function () { $('.product--attr').removeClass('shake'); }, 1200);
                    flagAttribute = 1;
                }

            } else {
                $('.product--attr').each(function () {
                    var _attr = $(this);
                    var inputOfItemChecked = _attr.find('.single--attribute input:checked').length;
                    var dataMaxOfItem = _attr.data('max');

                    if (section__product__detail.hasClass('noo__need__choose')) {
                        // không bắt buộc chọn, nhưng đã chọn thì phải chọn đủ
                        if (inputOfItemChecked != dataMaxOfItem && inputOfItemChecked > 0) {
                            _attr.addClass('shake');
                            setTimeout(function () { _attr.removeClass('shake'); }, 1200);
                            flagAttribute = 1;
                        }
                    } else {
                        if (inputOfItemChecked != dataMaxOfItem) {
                            _attr.addClass('shake');
                            setTimeout(function () { _attr.removeClass('shake'); }, 1200);
                            flagAttribute = 1;
                        }
                    }
                });
            }
        }

        //condition to add cart

        if (flagVariable == 1) {
            return;
        }

        if (flagAttribute == 1) {
            return;
        }

        // sản phẩm có biến thể -> sang trang chi tiết để chọn
        if (_this.data('var') == 1) {
            window.location.href = isDemo ? 'product.html?id=' + cartProductId : baseUrl + '/member/redemption/' + cartProductId;
            return;
        }

        if (__status_attribute == '1' && cartAttribute <= 0) {
            alert('Please select one price!');
            return;
        }

        if (__status_attribute != '1') {
            cartAttribute = '';
            var __amount = '';
        } else {
            var __amount = $('.redeem_attreibute option:selected').attr('data-amount');
        }

        if (_this.data('buynow') == '1') {
            _this.addClass('is-buying');           // spinner trên nút Buy Now
        }

        if (isDemo) {
            addCartDemo(_this, cartProductId, cartQuantiry);
            return;
        }

        var cartCountBefore = parseInt($('#yqCartCount').text()) || 0;

        $.ajax({
            url: baseUrl + '/cart/?action=addCart&product_id=' + cartProductId + '&quantity=' + cartQuantiry + '&product_att=' + cartAttribute + '&amoun_att=' + __amount,
            type: 'post',
            data: _data_list_attribute,

            success: function (data) {
                // server trả chuỗi JSON (như template cũ); nếu header là application/json
                // thì jQuery đã parse sẵn thành object
                var data = typeof data === 'string' ? $.parseJSON(data) : data;

                // giống template cũ
                $('.cart--items').html(data.html);
                $('.cart--header .badge').html(data.totalItems);
                $('#cart').find('.badge').html(data.totalItems);
                $('.cart--header .main-color-text').html(data.totalCost);

                $('#modalShowCartCheckOut').html(data.htmlModal);
                $('#modalShowWarning').html(data.htmlWarning);

                // badge giỏ của header mới (+ badge trong menu mobile)
                $('#yqCartCount, #yqCartCountM, [data-oc-count]').html(data.totalItems).toggleClass('is-on', data.totalItems > 0);

                // buynow
                if (_this.hasClass('submit-frm-redeem')) {
                    cartAttribute = $('.redeem_attreibute').val();
                    __status_attribute = $('.status-product-attribute').val();
                    if ((__status_attribute == 1 && cartAttribute > 0) || __status_attribute != 1) {
                        window.location.href = baseUrl + '/cart/?action=view';
                    }
                }

                if (_this.data('buynow') == '1') {
                    window.location.href = baseUrl + '/cart/?action=view';
                    return;
                }

                // ảnh bay vào giỏ, tới nơi thì mở drawer hiển thị data.html + data.totalCost
                imageAnimation(_this, cartCountBefore, parseInt(data.totalItems) || 0, data);
            },

            error: function () {
                _this.removeClass('is-buying');
                YQ.toast('Could not add to cart. Please try again.');
            }
        });
    });

    /* Ảnh sản phẩm bay vào icon giỏ + badge đếm tăng, tới nơi thì mở drawer giỏ
       với dữ liệu server (cart-anim.js). Template cũ tự clone ảnh và animate. */
    var imageAnimation = function (button, cartCountBefore, cartCountAfter, data) {
        if (!YQ.cartFx || !YQ.cartDrawer) {
            YQ.toast('Added to cart', 'View cart', baseUrl + '/cart/?action=view');
            return;
        }
        YQ.cartFx.added(button[0], cartCountBefore, cartCountAfter, function () {
            YQ.cartDrawer.openServer(data);
        });
    };

    /* Bản demo HTML (không có backend): thêm vào giỏ localStorage YQ.cart.
       cart-anim.js tự chạy hiệu ứng bay + mở drawer khi giỏ đổi. */
    var addCartDemo = function (button, cartProductId, cartQuantiry) {
        var product = YQ.product(String(cartProductId));
        if (!product) {
            button.removeClass('is-buying');
            return;
        }

        // Ở trang chi tiết: lấy option đang chọn; card ở trang list: option đầu tiên
        var option = product.options[0];
        if (button.data('page') != 1) {
            var optionId = $('#pdpOptions .yq-option.is-active').attr('data-opt');
            $.each(product.options, function (i, item) {
                if (String(item.id) == optionId) option = item;
            });
        }

        YQ.cart.add(product, option, parseInt(cartQuantiry) || 1);

        if (button.data('buynow') == '1') {
            setTimeout(function () { window.location.href = 'checkout.html'; }, 400);
            return;
        }

        YQ.toast(product.name + ' added to cart', 'View cart', 'cart.html');
    };

    // Bấm Back từ trang giỏ/checkout về: bỏ spinner Buy Now còn sót
    $(window).on('pageshow', function () {
        $('.addToCart').removeClass('is-buying');
    });

    // Trang chi tiết: đổi số lượng thì cập nhật data-quantity của các nút
    // (bộ +/- của template mới phát event yq:qty; input #rdChangeQuantity của template cũ)
    $(document).on('yq:qty', '#pdpQty', function (e, quantity) {
        $('.yq-pdp .addToCart, #pdpBuyBar .addToCart').attr('data-quantity', quantity);
    });
    $(document).on('change', '#rdChangeQuantity', function () {
        $('.yq-pdp .addToCart, #pdpBuyBar .addToCart').attr('data-quantity', $(this).val());
    });

});
