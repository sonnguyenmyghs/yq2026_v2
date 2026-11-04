/* ==========================================================================
   Module JS: checkout-v2 — bản PRODUCTION (dùng cho checkout-v2.html trên server thật)

   Cùng luồng với checkout-v2.js nhưng bỏ toàn bộ phần demo, nối API thật theo appv6_dev_demo.js:
     - Bản đồ: Google Maps (Geocoder, Places SearchBox, Directions). Trang phải nạp
       maps.googleapis.com/maps/api/js?...&callback=initMap&libraries=places
     - Báo giá: POST /cart/?check_transportfee=on...  -> data.lalamove.CAR / MINIVAN
     - Promo: POST /cart?action=check_promo, huỷ mã gọi /reward/?act=delete_gift
     - Submit: form POST lên server, không chặn.

   Markup trang (order summary, tổng tiền, khung giờ, giỏ trống, nút huỷ promo) là HTML
   tĩnh do PHP in sẵn. Chỉ báo giá .delivery__types và icon spinner là dựng bằng JS.
   ========================================================================== */

/* ======================================================================
   RENDER MAP API — Google Maps
   ====================================================================== */
var map, current_marker, geocoder, infowindow, input_search, directionsService, directionsRenderer;
var outputAddress = document.getElementById("output_address");
var hotelLat = document.getElementById("hotel__lat");
var hotelLng = document.getElementById("hotel__long");
var outputLat = document.getElementById("myLat");
var outputLng = document.getElementById("myLng");
var outputAddress__show = document.getElementsByClassName("in--location--name");
var hotel_location = { lat: parseFloat(hotelLat.value), lng: parseFloat(hotelLng.value) };

/* Google gọi hàm này qua callback=initMap */
function initMap() {
    input_search = document.getElementById("search_input");
    geocoder = new google.maps.Geocoder();
    infowindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });

    map = new google.maps.Map(document.getElementById("my_map"), {
        center: hotel_location,
        zoom: 13,
        disableDefaultUI: true,
        gestureHandling: "greedy"
    });
    directionsRenderer.setMap(map);

    new google.maps.Marker({ map: map, position: hotel_location });

    createCurrentMarker();
    createSearchBox();
    createEventMap();
}

function createEventMap() {
    map.addListener('click', function(event) {
        infowindow.close();
        getAddressByPos({ location: event.latLng });
    });

    var current_location = document.getElementById('current_location');
    current_location.addEventListener('click', function() {
        infowindow.close();
        getGeoLocation();
    });

    var clearable_search = document.getElementById('clearable_search');
    clearable_search.addEventListener('click', function() {
        input_search.value = "";
        controlInputClean();
        input_search.focus();
    });
    input_search.addEventListener('input', function() { controlInputClean(); });
}
// handle clean input search
function controlInputClean() {
    var clearable_search = document.getElementById('clearable_search');
    if (input_search.value) {
        input_search.classList.add('border-right-0');
        clearable_search.classList.remove('d-none');
    } else {
        input_search.classList.remove('border-right-0');
        clearable_search.classList.add('d-none');
    }
}

/* Ô tìm kiếm phủ trên bản đồ bằng CSS (#section_search) nên không đưa vào map.controls */
function createSearchBox() {
    var searchBox = new google.maps.places.SearchBox(input_search);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", function() {
        searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener("places_changed", function() {
        var places = searchBox.getPlaces();
        if (!places || !places.length || !places[0].geometry) return;
        setCurrentMarker(places[0].formatted_address, places[0].geometry.location, getPostalCode(places[0]));
    });
}

function getGeoLocation() {
    var btn = document.getElementById('current_location');
    if (navigator.geolocation) {
        btn.classList.add('is-busy');
        navigator.geolocation.getCurrentPosition(function(position) {
            btn.classList.remove('is-busy');
            infowindow.close();
            getAddressByPos({ location: { lat: position.coords.latitude, lng: position.coords.longitude } });
        }, function() {
            btn.classList.remove('is-busy');
            handleLocationError(true, infowindow, map.getCenter());
        }, { timeout: 8000 });
    } else {
        handleLocationError(false, infowindow, map.getCenter());
    }
}

function createCurrentMarker() {
    current_marker = new google.maps.Marker({ map: map, icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', draggable: true });
    current_marker.addListener("click", function() {
        infowindow.open(map, current_marker);
    });
    current_marker.addListener("dragend", function(event) {
        infowindow.close();
        getAddressByPos({ location: event.latLng });
    });
}

function getAddressByPos(request) {
    geocoder.geocode(request, function(results, status) {
        if (status !== "OK") {
            window.alert("Geocoder failed due to: " + status);
            return;
        }
        setCurrentMarker(results[0].formatted_address, results[0].geometry.location, getPostalCode(results[0]));
    });
}

/* Lấy postcode từ kết quả Google (Geocoder / SearchBox) để điền sẵn ô Postal code */
function getPostalCode(place) {
    var parts = place.address_components || [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].types.indexOf('postal_code') !== -1) return parts[i].long_name;
    }
    return '';
}

function setCurrentMarker(formatted_address, location, postal) {
    map.setZoom(Math.max(map.getZoom(), 15));
    map.setCenter(location);
    current_marker.setPosition(location);
    current_marker.setVisible(true);
    infowindow.setContent(formatted_address);
    infowindow.open(map, current_marker);
    outputAddress.value = formatted_address;
    outputLat.value = location.lat();
    outputLng.value = location.lng();
    $(outputAddress__show).find('span').text(formatted_address);
    document.getElementById('my_lat').value = location.lat();
    document.getElementById('my_lgn').value = location.lng();
    if (postal) $('.postalcode__input').val(postal).removeClass('null');
    calculateAndDisplayRoute(location);
}

function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.setPosition(pos);
    infowindow.setContent(browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.");
    infowindow.open(map);
}

function calculateAndDisplayRoute(position) {
    directionsService.route({
        origin: hotel_location,
        destination: position,
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
        if (status === "OK") {
            directionsRenderer.setDirections(response);
        } else {
            window.alert("Directions request failed due to " + status);
        }
    });
}
/* -----------------------END RENDER MAP-------------------------------- */

/* ======================================================================
   APP CONTROL
   ====================================================================== */
$(function() {

    var d = new Date();
    var baseUrl = $('#root').data('base');                 // production: gốc URL cho AJAX
    var confirm__price = $('.confirm--price .price');
    var input__totalPriceWithDiscount = $('#totalPriceWithDiscount');
    var feeTrans = $('#feeTrans');
    var output_address_show = $('#output_address_show');
    var propertyAddress = $('#propertyAddress');
    var output_address = $('#output_address');
    var myLat = $('#myLat');
    var myLng = $('#myLng');
    var deli__lalamove__zone = $('.in--delivery--lalamove');
    var type__pickup__input = $('#in__pickup');
    var type__delivery__lalamove__input = $('#in__delivery__lalamove');

    var formatPrice = function(price) {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
    };

    /* Order summary, tổng tiền, giỏ trống: HTML tĩnh do PHP in sẵn (@cartItems, @tmp_total_cost,
       @totalCost, @totalItemsCart) — JS không render lại, chỉ đọc data-subtotal / data-price. */

    /* ---------------------------------------------------------------
       PICKUP / LALAMOVE CONTROL — tham số từ window.__* (giống appv6)
       --------------------------------------------------------------- */
    var hourpreparationPickup = __pickupPreparingtimeHour;
    var hourpreparationLalamove = __lalamovePreparingtimeHour;
    var maxDateLalaIntall = new Date();
    var maxdate_custom_deli_lala = maxDateLalaIntall.setDate(d.getDate() + 29);
    var arrDisablePickup = (typeof __useDisableDatesPickup != "undefined") ? __useDisableDatesPickup : [""];
    var arrDisableLalamove = (typeof __useDisableDatesLalamove != "undefined") ? __useDisableDatesLalamove : [""];

    /* mindate: còn kịp chuẩn bị trước giờ đóng cửa hôm nay -> "today", không thì ngày mai */
    var funcGetMindate = function(closeHour, closeMins, prepHours) {
        var close = new Date(); close.setHours(closeHour, closeMins, 0, 0);
        var nowPlusPrep = new Date(Date.now() + prepHours * 3600 * 1000);
        return nowPlusPrep < close ? "today" : new Date().fp_incr(1);
    };
    var mindate__pickup = funcGetMindate(__pickupCloseHour, __pickupCloseMins, hourpreparationPickup);
    var mindate_custom_deli_lala = funcGetMindate(__lalamoveCloseHour, __lalamoveCloseMins, hourpreparationLalamove);

    var isToday = function(date) {
        if (!date) return false;
        var t = new Date();
        return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate();
    };

    /* Khung giờ: <option> in sẵn trong HTML (PHP foreach theo __arrayMapTimeSlot* / giờ open..close),
       mỗi option có data-mins = phút bắt đầu. Chọn ngày hôm nay -> disabled + hidden các khung
       không kịp chuẩn bị (now + preparingtime); ngày khác / chưa chọn ngày -> mở lại tất cả.
       Thay cho renderTimeSlotHaveBreak / renderTimeSlotByHours (appv6 dựng lại <option>). */
    var filterTimeSlots = function(date, type) {
        var picker__hour = (type == 'pickup') ? $('.pickup__picker__hour__second') : $('.delilalamove__picker__hour');
        var preparingtime = (type == 'pickup') ? __pickupPreparingtimeMins : __lalamovePreparingtimeMins;
        var now = new Date(), nowMins = now.getHours() * 60 + now.getMinutes();
        picker__hour.val('').find('option[data-mins]').each(function() {
            var tooSoon = isToday(date) && parseInt($(this).data('mins'), 10) - nowMins < preparingtime;
            $(this).prop('disabled', tooSoon).prop('hidden', tooSoon);
        });
    };

    /* PICKUP PICKER — <select> khung giờ là HTML tĩnh (.pickup__time__zone) */
    $('.pickup__picker__date__second').on('click', function() {
        $('.append__pickup__picker__date').toggle();
    });
    $(".pickup__picker__date__second").flatpickr({
        inline: true,
        dateFormat: "Y-m-d",
        minDate: mindate__pickup,
        disable: arrDisablePickup,
        appendTo: $('.append__pickup__picker__date')[0],
        onChange: function(selectedDates, dateStr, instance) {
            $('.append__pickup__picker__date').hide();
            instance._input.classList.remove('error');
            filterTimeSlots(selectedDates[0], "pickup");
        }
    });

    /* LALAMOVE PICKER — <select> khung giờ là HTML tĩnh (.lalamove__time__zone) */
    $('.delilalamove__picker__date').on('click', function() {
        $('.append__delilalamove__picker__date').toggle();
    });
    $(".delilalamove__picker__date").flatpickr({
        inline: true,
        dateFormat: "Y-m-d",
        minDate: mindate_custom_deli_lala,
        maxDate: maxdate_custom_deli_lala,
        disable: arrDisableLalamove,
        appendTo: $('.append__delilalamove__picker__date')[0],
        onChange: function(selectedDates, dateStr, instance) {
            $('.append__delilalamove__picker__date').hide();
            deli__lalamove__zone.removeClass('null__date');
            filterTimeSlots(selectedDates[0], "lalamove");
            onChangeDateToChangeHour_Lalamove();   // đổi ngày -> báo giá lại
        }
    });
    $('body').on('change', 'select.delilalamove__picker__hour', function(e) {
        e.preventDefault();
        deli__lalamove__zone.removeClass('null__hour');
        onChangeDateToChangeHour_Lalamove();
    });
    $('body').on('change', 'select.pickup__picker__hour__second', function() { $(this).removeClass('error'); });

    /* Đóng lịch khi click ra ngoài */
    $(document).on('mousedown', function(e) {
        if (!$(e.target).closest('.append__pickup__picker__date, .pickup__picker__date__second').length) $('.append__pickup__picker__date').hide();
        if (!$(e.target).closest('.append__delilalamove__picker__date, .delilalamove__picker__date').length) $('.append__delilalamove__picker__date').hide();
    });

    /* ---------------------------------------------------------------
       select type receiving — giống appv6 (.in--receivings.active = thu gọn)
       --------------------------------------------------------------- */
    $('.in-receiving').on('click', function() {
        var _this = $(this);
        var data_recei = _this.data('recei');
        var transport__fee = $('.transport--fee');
        $('.in-receiving').removeClass('active');
        _this.addClass('active');
        $('.in--receivings').addClass('active').removeClass('null');
        $('.in--receivings--hint').slideUp(160);
        $('.in--type--recei').removeClass('active');
        if (data_recei == '1') {
            $('.in--pickup').addClass('active');
            transport__fee.addClass('hide');
            resetDelivery();
            sumTotalPrice();
            resetDeliveryLalamove();
        } else if (data_recei == '2') {
            $('.in--deliverry').addClass('active');
            transport__fee.removeClass('hide');
            resetPickup();
            resetDeliveryLalamove();
            checkPriceDeli();
        } else {
            $('.in--delivery--lalamove').addClass('active');
            transport__fee.removeClass('hide');
            var total__price__discount = parseFloat(String(input__totalPriceWithDiscount.val()).replace(/\,/g, ''));
            var total__price__base = parseFloat(String(confirm__price.data('price')).replace(/\,/g, ''));
            var total__price = total__price__discount > 0 ? total__price__discount : total__price__base;
            resetPickup();
            resetDelivery();
            checkPriceDeliLalamove(total__price, 0);
        }
    });
    var resetPickup = function() {
        $('.pickup__picker__date__second').val('');
        filterTimeSlots(null, 'pickup');          // val('') + mở lại mọi khung giờ
    };
    var resetDelivery = function() {
        $('.in--location--name span').text('Edit my address');
        $('#transportdistanceMeter').val('');
        $('#transportdistanceKm').val('');
        $('#transport__fee').val(0);
        $('#feeTrans').text('0.00');
    };
    var resetDeliveryLalamove = function() {
        $('.delilalamove__picker__date').val('');
        filterTimeSlots(null, 'lalamove');
        $('.in--location--name span').text('Edit my address');
        $('#output_address_show').val('');
        $('#output_address').val('');
        $('#transportdistanceMeter').val('');
        $('#transportdistanceKm').val('');
        $('.delivery__types').html('');
        $('#myLat').val('');
        $('#myLng').val('');
        $('#transport__fee').val(0);
        $('#feeTrans').text('0.00');
        var total__price__discount = parseFloat(String(input__totalPriceWithDiscount.val()).replace(/\,/g, ''));
        var total__price__base = parseFloat(String(confirm__price.data('price')).replace(/\,/g, ''));
        var total__price = total__price__discount > 0 ? total__price__discount : total__price__base;
        $('.confirm--price .price').text(formatPrice(total__price));
        $('.lalamove__datetime__zone').removeClass('show');
    };

    /* ---------------------------------------------------------------
       Map slide page + báo giá Lalamove
       --------------------------------------------------------------- */
    $('.open__slide__page').on('click', function() {
        var data__spage = $(this).data('spage');
        var slide__page = $('.slide--page[data-spage="' + data__spage + '"]');
        if (!slide__page.hasClass('active')) {
            slide__page.addClass('active');
            $('body').addClass('spage-open');
            if (data__spage === 'mylocation') {
                setTimeout(function() { $('#search_input').val(output_address.val()).trigger('focus'); }, 260);
            }
        }
    });
    $('.close--spage').on('click', function() {
        var slide__page = $(this).closest('.slide--page');
        slide__page.removeClass('active');
        $('body').removeClass('spage-open');
    });
    // check output_address_show null is call map slide
    output_address_show.on('focus', function(e) {
        e.preventDefault();
        $(this).blur();
        $('.btn__call__map').click();
    });
    // okay map
    $('.btn--okmap').on('click', function(e) {
        e.preventDefault();
        $('#output_address_show').removeClass('null');
        checkDistanceMap();
    });

    /* Gọi API báo giá. Luôn trả về đúng 1 trong 2 callback:
         done(data)      : có data.lalamove
         failed(message) : lỗi từ server / mạng. Request cũ bị huỷ khi có request mới
       -> đổi ngày giờ nhanh không ra 2 bảng giá, không dính quotation cũ. */
    var quoteXhr = null;
    var fetchLalamoveQuote = function(laladate, done, failed) {
        if (quoteXhr) quoteXhr.abort();
        var query = $.param({
            check_transportfee: 'on',
            propertyaddress: propertyAddress.val(),
            myaddress: output_address.val(),
            propertycode: $('#propertyAlias').val(),
            myLat: myLat.val(),
            myLng: myLng.val(),
            receive_date: laladate,
            receive_hour: $('.delilalamove__picker__hour').val() || ''
        });
        quoteXhr = $.ajax({
            url: baseUrl + '/cart/?' + query,
            type: 'post',
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done(function(data) {
            if (data && data.status === 'NOT_FOUND') {
                failed('We did not calculate your distance, please choose again!!!');
            } else if (!data || data.status == "error" || !data.lalamove) {
                failed((data && data.messages) || "An error occurred, please try again");
            } else {
                done(data);
            }
        }).fail(function(xhr, status) {
            if (status !== 'abort') failed("An error occurred, please try again");
        });
    };

    var renderLalamoveTypes = function(data) {
        $('.delivery__types').html('');
        if (typeof __lalamoveCustomDeliveryType != "undefined") {
            appendCustomDeliTypeLalamove(data.lalamove.CAR);
            appendCustomDeliTypeLalamove(data.lalamove.MINIVAN);
        } else {
            appendDeliTypeLalamove(data.lalamove);
        }
    };

    // Function check distance in map
    var checkDistanceMap = function() {
        $('.close--spage').click();
        var myaddress = $('#output_address').val();
        if (!myaddress) return;
        $('.delivery__types').html('<i class="fas fa-spinner fa-spin"></i>');
        output_address_show.addClass('findding');
        if (__replaceLalaToHotelVan != true) {
            var laladate = $('.delilalamove__picker__date').val() || moment().format('YYYY-MM-DD');
            fetchLalamoveQuote(laladate, function(data) {
                $('.in--location--name span').text(myaddress);
                output_address_show.val(myaddress).removeClass('findding');
                renderLalamoveTypes(data);
                $('.lalamove__datetime__zone').addClass('show');
            }, function(message) {
                alert(message);
                $('.lalamove__datetime__zone').removeClass('show');
                $('.in--location--name span').text('Edit my address');
                output_address_show.val('').removeClass('findding');
                $('.delivery__types').html('');
                applyTotalPriceDefault(0);
            });
        } else {
            output_address_show.val(myaddress).removeClass('findding');
            $('.delivery__types').html('');
            $('.lalamove__datetime__zone').addClass('show');
            if (typeof __minimumPriceForDeli != "undefined") {
                var subtotal = parseFloat($('.inform--money .provisional').data('subtotal'));
                applyTotalPriceDefault(subtotal >= __minimumPriceForDeli ? 0 : (typeof __fixedFeeBelowLowestPrice != "undefined" ? __fixedFeeBelowLowestPrice : 0));
            }
        }
    };

    // function append type lalamove — markup giữ nguyên như appv6
    var appendDeliTypeLalamove = function(singlelalamove) {
        $('.delivery__types').append('<div class="delivery__type d-none" data-quotation="' + singlelalamove.quotation_log_id + '" data-name="CAR" data-price="' + singlelalamove.totalFee + '">' +
            '<input class="" type="radio" name="select_delivery_service" id="deli_lalamove_CAR" value="CAR" checked>' +
            '<label for="deli_lalamove_CAR"><div class="text-center"><span>CAR</span></div>' +
            '<div class="viewprice__lala"><span>' + singlelalamove.totalFee + '</span> ' + singlelalamove.totalFeeCurrency + '</div></label></div>');
        $('#quotation_log_id').val(singlelalamove.quotation_log_id);
        applyTotalPriceDefault(singlelalamove.totalFee);
    };
    var appendCustomDeliTypeLalamove = function(singlelalamove) {
        var total__price__base = parseFloat(String(confirm__price.data('price')).replace(/\,/g, ''));
        var total__price__withdiscount = parseFloat(String($('#totalPriceWithDiscount').val()).replace(/\,/g, ''));
        if (total__price__withdiscount && total__price__withdiscount > 0) total__price__base = total__price__withdiscount;
        var minimum = (typeof __minimumPriceForDeli != "undefined") ? __minimumPriceForDeli : 300;
        var original = singlelalamove.totalFee;
        if (total__price__base >= minimum) singlelalamove.totalFee = 0;     // đơn đủ mức -> miễn phí giao
        $('.delivery__types').append('<div class="delivery__type" data-quotation="' + singlelalamove.quotation_log_id + '" data-price="' + singlelalamove.totalFee + '" data-name="' + singlelalamove.type + '">' +
            '<input class="" type="radio" name="select_delivery_service" id="deli_lalamove_' + singlelalamove.type + '" value="' + singlelalamove.type + '">' +
            '<label for="deli_lalamove_' + singlelalamove.type + '">' +
                '<div class="text-center"><span>' + singlelalamove.type + '</span></div>' +
                '<div class="viewprice__lala">' +
                    (singlelalamove.totalFee === 0 ? '<s>' + original + ' ' + singlelalamove.totalFeeCurrency + '</s> Complimentary'
                                                    : '<span>' + singlelalamove.totalFee + '</span> ' + singlelalamove.totalFeeCurrency) +
                '</div>' +
            '</label></div>');
    };

    // Lalamove change type function
    $('.delivery__types').on('change', 'input', function() {
        var _this = $(this);
        var priceOfType = _this.closest('.delivery__type').data('price');
        if (_this.is(':checked')) $('#quotation_log_id').val(_this.closest('.delivery__type').data('quotation'));
        deli__lalamove__zone.removeClass('null__types');
        applyTotalPriceDefault(priceOfType);
    });

    /* Đổi ngày / giờ giao -> báo giá lại */
    var onChangeDateToChangeHour_Lalamove = function() {
        if (__replaceLalaToHotelVan == true || !output_address.val()) return;
        $('.delivery__types').html('<i class="fas fa-spinner fa-spin"></i>');
        $('#feeTrans').text('');
        var laladate = $('.delilalamove__picker__date').val() || moment().add(1, 'days').format('YYYY-MM-DD');
        fetchLalamoveQuote(laladate, function(data) {
            renderLalamoveTypes(data);
            /* appendDeliTypeLalamove tự chọn sẵn CAR và tính phí, custom thì khách chọn lại xe */
            if (typeof __lalamoveCustomDeliveryType != "undefined") applyTotalPriceDefault(0);
        }, function(message) {
            alert(message);
            $('.delivery__types').html('');
            applyTotalPriceDefault(0);
        });
    };

    /* ---------------------------------------------------------------
       Promo code
       --------------------------------------------------------------- */
    $('#btn-check-promocode').on('click', function(e) {
        e.preventDefault();
        var _input_code = $('#input-promo-code').val();
        if (_input_code) {
            var _date_time = '';
            if (type__pickup__input.is(":checked")) _date_time = $('.pickup__picker__date__second').val();
            if (type__delivery__lalamove__input.is(":checked")) _date_time = $('.delilalamove__picker__date').val();
            $('#btn-check-promocode').html('<i class="fas fa-spinner fa-spin"></i>');
            checkDiscountPromo(_input_code, _date_time);
        }
    });

    var checkDiscountPromo = function(_input_code, _order_date) {
        var query = 'action=check_promo&code=' + encodeURIComponent(_input_code);
        if (_order_date) query += '&order_date=' + encodeURIComponent(_order_date);
        $.ajax({
            url: baseUrl + '/cart?' + query,
            type: 'post',
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function(data_j) {
            if (data_j.status == 1) {
                $('#div-total-cost').html(data_j.total_cost_show).attr("data-price", data_j.total_cost);
                $('#input-promo-code').attr('readonly', true);
                $('#btn-check-promocode').hide();
                $('#btn-cancel-promocode').show();          // nút có sẵn trong HTML
                $('.div-discount-remove-promo').hide();
                $('#div-show-discount-promo').removeClass('d-none').show();
                $('#name-show-discount-promo').html(data_j.name_discount);
                $('#costdiscount-show-discount-promo').html(data_j.cost_discount_show + ' ' + data_j.currency).attr('data-discount', data_j.cost_discount);
                $('#warning-promo').show().html(data_j.message).css('color', 'green');
                $('#checkDiscount').val(data_j.cost_discount);
                input__totalPriceWithDiscount.val(data_j.total_cost);
                if (type__delivery__lalamove__input.is(":checked") && output_address.val()) {
                    onChangeDateToChangeHour_Lalamove();     // giảm giá đổi -> có thể đổi mức miễn phí giao
                } else {
                    $('#div-total-cost').html(formatPrice(data_j.total_cost));
                    applyTotalPriceDefault(0);
                }
            } else {
                $('#warning-promo').show().html(data_j.message).css('color', 'red');
            }
        }).fail(function() {
            $('#warning-promo').show().text('An error occurred, please try again').css('color', 'red');
        }).always(function() {
            $('#btn-check-promocode').text('Apply');
        });
    };

    $(document).on('click', '#btn-cancel-promocode', function() {
        var _input_code = $('#input-promo-code').val();
        $('#costdiscount-show-discount-promo').attr('data-discount', 0).text('');
        $('#btn-check-promocode').show();
        $('#input-promo-code').attr('readonly', false).val('');
        $('#btn-cancel-promocode').hide();
        $('.div-discount-remove-promo').show();
        $('#div-show-discount-promo').hide();
        $('#warning-promo').hide();
        $('#checkDiscount').val('');
        input__totalPriceWithDiscount.val("");
        $.post(baseUrl + '/reward/?act=delete_gift&code=' + encodeURIComponent(_input_code));
        var subtotal = parseFloat($('.inform--money .provisional').data('subtotal'));
        $('#div-total-cost').attr("data-price", $('#total-default-no-promo').val()).text(formatPrice(subtotal));
        if (type__delivery__lalamove__input.is(":checked") && output_address.val()) {
            onChangeDateToChangeHour_Lalamove();
        } else {
            applyTotalPriceDefault(0);
        }
    });

    /* ---------------------------------------------------------------
       Tính tiền — giống appv6
       --------------------------------------------------------------- */
    var applyTotalPriceDefault = function(fee) {
        var total__price__discount = parseFloat(String(input__totalPriceWithDiscount.val()).replace(/\,/g, ''));
        var total__price__base = parseFloat(String(confirm__price.data('price')).replace(/\,/g, ''));
        var total__price = total__price__discount > 0 ? total__price__discount : total__price__base;
        var input__transport__fee = $('#transport__fee');
        fee = parseFloat(fee) || 0;
        feeTrans.text(fee.toFixed(2));
        feeTrans.data('fee', fee);
        input__transport__fee.val(fee);
        confirm__price.text(formatPrice(total__price + fee));
    };
    var sumTotalPrice = function() {
        var total__price__discount = parseFloat(String(input__totalPriceWithDiscount.val()).replace(/\,/g, ''));
        var div_total_cost = parseFloat($('#div-total-cost').attr('data-price'));
        $('#div-total-cost').text(formatPrice(total__price__discount > 0 ? total__price__discount : div_total_cost));
    };
    var checkPriceDeli = function(cofirmprice) {
        var cofirmprice__base = parseFloat(String($('.confirm--price .price').attr('data-price')).replace(/\,/g, ''));
        cofirmprice = cofirmprice ? cofirmprice : cofirmprice__base;
        var fee = 0;
        $('#feeTrans').text(formatPrice(fee));
        $('#transport__fee').val(fee);
        $('.confirm--price .price').text(formatPrice(cofirmprice + fee));
    };
    var checkPriceDeliLalamove = function(cofirmprice, fee) {
        var cofirmprice__base = parseFloat(String($('.confirm--price .price').attr('data-price')).replace(/\,/g, ''));
        cofirmprice = cofirmprice ? cofirmprice : cofirmprice__base;
        feeTrans.text(formatPrice(fee));
        feeTrans.data('fee', fee);
        $('#transport__fee').val(fee);
        confirm__price.text(formatPrice(cofirmprice + parseFloat(fee)));
    };

    /* Gõ lại thì bỏ trạng thái lỗi */
    $(document).on('input change', '.pay--part input.error, .pay--part input.null, .pay--part select.error', function() {
        $(this).removeClass('error null');
    });
    $('#becomeamember').on('change', function() { $(this).closest('.agree--zone').removeClass('null'); });

    /* ===============================================================
       SUBMIT — validate theo bảng rule, dừng ở lỗi đầu tiên
       Thứ tự rule = thứ tự form từ trên xuống: thông tin khách -> T&C ->
       chọn hình thức nhận -> Self-Collection -> Delivery.
       Mỗi rule: { when, field, ok, cls | mark, scroll, focus }
         when   : hàm -> rule có áp dụng không (bỏ qua = luôn áp dụng)
         field  : selector phần tử kiểm tra
         ok     : hàm($el) -> true nếu hợp lệ
         cls    : class lỗi gắn lên field ('error' | 'null'), mặc định 'error'
         mark   : hàm thay cho cls khi lỗi phải gắn lên phần tử khác (zone)
         scroll : selector cuộn tới (mặc định = field)
         focus  : true -> focus vào field sau khi cuộn
       =============================================================== */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var isMember = function() { return !!$('#input__isMember').val(); };
    var isGuest = function() { return !isMember(); };
    var isPickup = function() { return $('#in__pickup').is(':checked'); };
    var isLalamove = function() { return $('#in__delivery__lalamove').is(':checked'); };
    var isDriveThrough = function() {
        return isPickup() && $('.pickup--location--radio:checked').val() == "Drive-Through Collection, Hotel Driveway";
    };
    var filled = function($el) { return !!$.trim($el.val()); };
    var checked = function($el) { return $el.is(':checked'); };
    /* Số điện thoại: control__telinput gắn .error khi số không hợp lệ */
    var phoneOk = function($el) { return filled($el) && !$el.hasClass('error') && $el.val().length > 6; };
    var zoneMark = function(cls) { return function() { deli__lalamove__zone.addClass(cls); }; };

    var RULES = [
        /* 1. Enter Information — thành viên đã đăng nhập */
        { when: isMember, field: '.input__member__email',     ok: filled },
        { when: isMember, field: '.input__member__firstname', ok: filled },
        { when: isMember, field: '.input__member__lastname',  ok: filled },
        { when: isMember, field: '.input__member__phone',     ok: phoneOk },
        /* 1. Enter Information — khách vãng lai */
        { when: isGuest, field: '.input__guest__email',     ok: function($el) { return EMAIL_RE.test($.trim($el.val())); } },
        { when: isGuest, field: '.input__guest__reemail',   ok: function($el) {
            return filled($el) && $.trim($el.val()).toLowerCase() === $.trim($('.input__guest__email').val()).toLowerCase();
        }, focus: true },
        { when: isGuest, field: '.input__guest__firstname', ok: filled },
        { when: isGuest, field: '.input__guest__lastname',  ok: filled },
        { when: isGuest, field: '#phone_register',          ok: phoneOk },
        /* Điều khoản */
        { field: '#becomeamember', ok: checked, scroll: '.agree--zone',
          mark: function() { $('.agree--zone').first().addClass('null'); } },

        /* 2. Shipping Information — phải chọn Self-Collection hoặc Delivery */
        { field: '.in--receivings', ok: function() { return isPickup() || isLalamove(); }, cls: 'null' },
        /* Self-Collection */
        { when: isPickup,       field: '.pickup__picker__date__second', ok: filled, cls: 'error' },
        { when: isPickup,       field: '.pickup__picker__hour__second', ok: filled, cls: 'error' },
        { when: isDriveThrough, field: '.input--car--plate--number',    ok: filled, cls: 'null' },
        /* Delivery (Lalamove) */
        { when: isLalamove, field: '#output_address_show',        ok: filled, cls: 'null' },
        { when: isLalamove, field: '.delilalamove__picker__date', ok: filled, mark: zoneMark('null__date') },
        { when: isLalamove, field: '.delilalamove__picker__hour', ok: filled, mark: zoneMark('null__hour') },
        { when: function() { return isLalamove() && __replaceLalaToHotelVan != true; },
          field: '.delivery__types', ok: function() { return $('.delivery__type input').is(':checked'); },
          mark: zoneMark('null__types') },
        { when: isLalamove, field: '#lalamove__unitnumber', ok: filled, cls: 'null' },
        { when: isLalamove, field: '.postalcode__input',    ok: function($el) { return /^\d{6}$/.test($el.val()); }, cls: 'null' }
    ];

    /* Xoá mọi class lỗi của lần bấm trước (#phone_register do control__telinput tự quản) */
    var clearErrors = function() {
        $('.pay--part input:not(#phone_register), .pay--part select').removeClass('error null');
        $('.in--receivings, .agree--zone').removeClass('null');
        deli__lalamove__zone.removeClass('null null__date null__hour null__types');
    };

    /* Trả về rule đầu tiên không đạt, hoặc null nếu form hợp lệ */
    var firstInvalid = function() {
        for (var i = 0; i < RULES.length; i++) {
            var r = RULES[i];
            if (r.when && !r.when()) continue;
            if (!r.ok($(r.field))) return r;
        }
        return null;
    };

    var scrollTo = function($el) {
        if ($el.length) $('html, body').animate({ scrollTop: $el.offset().top - 150 }, 500);
    };
    var showError = function(r) {
        var $el = $(r.field);
        if (r.mark) r.mark($el); else $el.addClass(r.cls || 'error');
        scrollTo($(r.scroll || r.field));
        if (r.focus) $el.trigger('focus');
    };

    /* Ghép dữ liệu trước khi gửi (giống appv6) */
    var prepareSubmit = function() {
        var plate = $.trim($('.input--car--plate--number').val());
        if (isDriveThrough() && plate) {
            $('.pickup--location--radio:checked').val("Drive-Through Collection, Hotel Driveway. Car Plate Number: " + plate);
        }
        if (isLalamove()) $('.pickup--location--radio').prop("checked", false);   // không gửi điểm nhận khi giao hàng
    };

    $('.confirm--order--btn').on('click', function(e) {
        e.preventDefault();
        clearErrors();
        var bad = firstInvalid();
        if (bad) { showError(bad); return; }
        prepareSubmit();
        $('.inform--frm').submit();
    });

    /* Drive-Through -> hiện ô biển số (giống inline script production) */
    $('.pickup--location--radio').on('change', function() {
        var carPlateSection = $('.car--plate--section');
        if (isDriveThrough()) carPlateSection.slideDown(); else carPlateSection.hide();
    });
});
