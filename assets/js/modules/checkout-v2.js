/* ==========================================================================
   Module JS: checkout-v2 — DEMO stand-in cho appv6_dev_demo.js (production)

   Bám theo cấu trúc appv6_dev_demo.js: cùng tên hàm, cùng DOM hook (id/class),
   cùng biến cấu hình window.__* và cùng class trạng thái (.active / .null /
   .error / .show) để markup checkout-v2.html deploy lên production chỉ cần
   thay file này bằng appv6_dev_demo.js thật.

   Khác production (đều đánh dấu [DEMO]):
     - Bản đồ: Leaflet + OpenStreetMap thay Google Maps; tìm địa chỉ qua Nominatim
       thay Places SearchBox. Tên hàm initMap / setCurrentMarker / getGeoLocation… giữ nguyên.
     - Báo giá Lalamove: tính tại chỗ theo khoảng cách (window.__demoLalamoveRates)
       thay cho $.ajax(baseUrl + '/cart/?check_transportfee=on…'); trả về cùng
       cấu trúc data.lalamove.CAR / MINIVAN nên appendCustomDeliTypeLalamove giữ nguyên.
     - Promo: tra window.__demoPromoCodes thay cho /cart?action=check_promo,
       dựng data_j cùng field như server trả về.
     - Submit: chặn form.submit() và hiện khối cảm ơn #cv2Done (production: post lên server).

   Markup trang (order summary, tổng tiền, icon, khung giờ, giỏ trống, khối cảm ơn,
   nút huỷ promo) là HTML tĩnh trong checkout-v2.html — PHP in sẵn. File này chỉ
   đổi class / .text() / .val() / thuộc tính và ẩn-hiện khối có sẵn.
   Phần còn dựng markup bằng JS là dữ liệu có từ API lúc chạy (không in sẵn được):
     - gợi ý địa chỉ #search_suggest (Nominatim / Google Places)
     - báo giá Lalamove .delivery__types (CAR / MINIVAN từ API)
     - nội dung popup bản đồ (Leaflet / Google InfoWindow)
     - icon spinner lúc chờ AJAX
   ========================================================================== */

/* ======================================================================
   RENDER MAP API  — [DEMO] Leaflet
   ====================================================================== */
var map, current_marker, geocoder, infowindow, input_search, directionsService, directionsRenderer;
var outputAddress = document.getElementById("output_address");
var hotelLat = document.getElementById("hotel__lat");
var hotelLng = document.getElementById("hotel__long");
var outputLat = document.getElementById("myLat");
var outputLng = document.getElementById("myLng");
var outputAddress__show = document.getElementsByClassName("in--location--name");
var hotel_location = { lat: parseFloat(hotelLat.value), lng: parseFloat(hotelLng.value) };
var __mapReady = false;
var __NOMINATIM = 'https://nominatim.openstreetmap.org';

/* Rút gọn display_name của Nominatim thành "số nhà + đường, Singapore + postcode" */
function formatNominatim(item) {
    var a = item.address || {};
    var line = [a.house_number, a.road || a.pedestrian || a.suburb || a.neighbourhood].filter(Boolean).join(' ').trim();
    if (!line) line = (item.display_name || '').split(',')[0];
    var post = a.postcode ? 'Singapore ' + a.postcode : (a.city || a.country || '');
    return { text: line + (post ? ', ' + post : ''), postal: a.postcode || '' };
}

function initMap() {
    if (__mapReady) { map.invalidateSize(); return; }
    if (!window.L) { document.getElementById('my_map').classList.add('is-off'); return; }
    input_search = document.getElementById("search_input");

    /* infowindow: shim tối thiểu theo API Google (close / open) trên Leaflet popup */
    infowindow = {
        close: function() { if (map) map.closePopup(); },
        open: function(latlng, html) { L.popup({ closeButton: true }).setLatLng(latlng).setContent(html).openOn(map); }
    };

    map = L.map("my_map", { zoomControl: false }).setView([hotel_location.lat, hotel_location.lng], 13);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    /* marker khách sạn (production: google.maps.Marker) */
    L.circleMarker([hotel_location.lat, hotel_location.lng], { radius: 7, color: '#94835D', fillColor: '#94835D', fillOpacity: 1 })
        .addTo(map).bindTooltip('Grand Hyatt Singapore');

    directionsRenderer = L.polyline([], { color: '#171613', weight: 2, dashArray: '6 6' }).addTo(map);

    createCurrentMarker();
    createSearchBox();
    createEventMap();
    __mapReady = true;
    setTimeout(function() { map.invalidateSize(); }, 60);
}

function createEventMap() {
    map.on('click', function(event) {
        infowindow.close();
        getAddressByPos({ location: event.latlng });
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
        document.getElementById('search_suggest').classList.add('d-none');
    }
}

/* [DEMO] gợi ý địa chỉ từ Nominatim (production: google.maps.places.SearchBox) */
function createSearchBox() {
    var $list = $('#search_suggest'), timer = null;
    $(input_search).on('input', function() {
        var q = $.trim(this.value);
        clearTimeout(timer);
        if (q.length < 3) { $list.addClass('d-none').empty(); return; }
        timer = setTimeout(function() {
            $.getJSON(__NOMINATIM + '/search', { format: 'json', q: q, countrycodes: 'sg', limit: 5, addressdetails: 1 })
                .done(function(rows) {
                    if (!rows.length) { $list.removeClass('d-none').html('<div class="search--suggest__item is-empty">No results — try a street name or postal code.</div>'); return; }
                    $list.removeClass('d-none').html(rows.map(function(r, i) {
                        var f = formatNominatim(r);
                        return '<button class="search--suggest__item" type="button" data-i="' + i + '">' + $('<b>').text(f.text).html() +
                               '<small>' + $('<b>').text(r.display_name).html() + '</small></button>';
                    }).join('')).data('rows', rows);
                })
                .fail(function() { $list.removeClass('d-none').html('<div class="search--suggest__item is-empty">Address search is unavailable right now.</div>'); });
        }, 450);
    });
    $list.on('click', '.search--suggest__item[data-i]', function() {
        var r = ($list.data('rows') || [])[$(this).data('i')];
        if (!r) return;
        var f = formatNominatim(r);
        input_search.value = f.text;
        $list.addClass('d-none').empty();
        setCurrentMarker(f.text, { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }, f.postal);
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
    current_marker = L.marker([hotel_location.lat, hotel_location.lng], { draggable: true }).addTo(map);
    current_marker.on("dragend", function() {
        infowindow.close();
        getAddressByPos({ location: current_marker.getLatLng() });
    });
}

/* [DEMO] Nominatim reverse thay geocoder.geocode() */
function getAddressByPos(request) {
    var ll = request.location;
    $.getJSON(__NOMINATIM + '/reverse', { format: 'json', lat: ll.lat, lon: ll.lng, addressdetails: 1, zoom: 18 })
        .done(function(r) {
            if (!r || !r.lat) { setCurrentMarker(ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5), ll, ''); return; }
            var f = formatNominatim(r);
            setCurrentMarker(f.text, ll, f.postal);
        })
        .fail(function() { setCurrentMarker(ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5), ll, ''); });
}

function setCurrentMarker(formatted_address, location, postal) {
    map.setView(location, Math.max(map.getZoom(), 15));
    current_marker.setLatLng(location);
    infowindow.open(location, $('<b>').text(formatted_address).html());
    outputAddress.value = formatted_address;
    outputLat.value = location.lat;
    outputLng.value = location.lng;
    $(outputAddress__show).find('span').text(formatted_address);
    document.getElementById('my_lat').value = location.lat;
    document.getElementById('my_lgn').value = location.lng;
    /* [DEMO] Nominatim có postcode -> điền sẵn ô Postal code */
    if (postal) $('.postalcode__input').val(postal).removeClass('null');
    calculateAndDisplayRoute(location);
}

function handleLocationError(browserHasGeolocation, infowindow, pos) {
    infowindow.open(pos, browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.");
}

/* [DEMO] vẽ đường thẳng khách sạn -> điểm giao (production: google DirectionsService) */
function calculateAndDisplayRoute(position) {
    directionsRenderer.setLatLngs([[hotel_location.lat, hotel_location.lng], [position.lat, position.lng]]);
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

    /* Order summary, tổng tiền, giỏ trống: HTML tĩnh do PHP in sẵn ({$cartItems}, {$tmp_total_cost},
       {$totalCost}, {$totalItemsCart}) — JS không render lại, chỉ đọc data-subtotal / data-price. */

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

    /* [DEMO] không tải được flatpickr -> dùng <input type="date"> native */
    if (!window.flatpickr) {
        $('.pickup__picker__date__second, .delilalamove__picker__date').prop('readonly', false).attr('type', 'date')
            .on('change', function() { $(this).removeClass('error'); deli__lalamove__zone.removeClass('null__date'); });
        $.fn.flatpickr = function() { return this; };
    }
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
            if (data__spage === 'mylocation') {            // [DEMO] Leaflet cần container hiển thị mới init được
                setTimeout(function() { initMap(); $('#search_input').val(output_address.val()).trigger('focus'); }, 260);
            }
        }
    });
    $('.close--spage').on('click', function() {
        var slide__page = $(this).closest('.slide--page');
        slide__page.removeClass('active');
        $('body').removeClass('spage-open');
        $('#search_suggest').addClass('d-none').empty();
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

    /* [DEMO] báo giá theo khoảng cách đường chim bay từ khách sạn — trả về cùng
       cấu trúc server: { lalamove: { CAR: {...}, MINIVAN: {...} } } */
    var demoQuoteLalamove = function(lat, lng) {
        var km = 6;                                      // không có toạ độ (địa chỉ gõ tay) -> ước lượng
        if (lat && lng) {
            var R = 6371, toRad = function(x) { return x * Math.PI / 180; };
            var dLat = toRad(lat - hotel_location.lat), dLng = toRad(lng - hotel_location.lng);
            var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(toRad(hotel_location.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
            km = Math.round(2 * R * Math.asin(Math.sqrt(h)) * 100) / 100;
        }
        $('#transportdistanceKm').val(km);
        $('#transportdistanceMeter').val(Math.round(km * 1000));
        var out = { lalamove: {} };
        $.each(__demoLalamoveRates, function(type, r) {
            out.lalamove[type] = {
                type: type,
                totalFee: (Math.round((r.base + r.perKm * km) * 100) / 100).toFixed(2),
                totalFeeCurrency: 'SGD',
                quotation_log_id: 'demo-' + type.toLowerCase() + '-' + Date.now()
            };
        });
        return out;
    };

    // Function check distance in map
    var checkDistanceMap = function() {
        $('.close--spage').click();
        var myaddress = $('#output_address').val();
        if (!myaddress) return;
        $('.delivery__types').html('<i class="fas fa-spinner fa-spin"></i>');
        output_address_show.addClass('findding');
        if (__replaceLalaToHotelVan != true) {
            /* [DEMO] thay cho $.ajax(baseUrl + '/cart/?check_transportfee=on&propertyaddress=…&myLat=…&myLng=…') */
            setTimeout(function() {
                var data = demoQuoteLalamove(parseFloat(myLat.val()), parseFloat(myLng.val()));
                $('.in--location--name span').text(myaddress);
                output_address_show.val(myaddress).removeClass('findding');
                $('.delivery__types').html('');
                if (typeof __lalamoveCustomDeliveryType != "undefined") {
                    appendCustomDeliTypeLalamove(data.lalamove.CAR);
                    appendCustomDeliTypeLalamove(data.lalamove.MINIVAN);
                } else {
                    appendDeliTypeLalamove(data.lalamove.CAR);
                }
                $('.lalamove__datetime__zone').addClass('show');
            }, 350);
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
        $('.delivery__types').append('<div class="delivery__type" data-quotation="' + singlelalamove.quotation_log_id + '" data-name="CAR" data-price="' + singlelalamove.totalFee + '">' +
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

    /* Đổi ngày / giờ giao -> báo giá lại (production gọi lại API) */
    var onChangeDateToChangeHour_Lalamove = function() {
        if (__replaceLalaToHotelVan == true || !output_address.val()) return;
        $('.delivery__types').html('<i class="fas fa-spinner fa-spin"></i>');
        $('#feeTrans').text('');
        setTimeout(function() {
            var data = demoQuoteLalamove(parseFloat(myLat.val()), parseFloat(myLng.val()));
            $('.delivery__types').html('');
            appendCustomDeliTypeLalamove(data.lalamove.CAR);
            appendCustomDeliTypeLalamove(data.lalamove.MINIVAN);
            applyTotalPriceDefault(0);
        }, 300);
    };

    /* ---------------------------------------------------------------
       Promo code
       --------------------------------------------------------------- */
    $('#btn-check-promocode').on('click', function(e) {
        e.preventDefault();
        var _input_code = $('#input-promo-code').val();
        if (_input_code) {
            $('#btn-check-promocode').html('<i class="fas fa-spinner fa-spin"></i>');
            checkDiscountPromo(_input_code);
        }
    });

    /* [DEMO] thay cho $.ajax(baseUrl + '/cart?action=check_promo&code=…'); data_j cùng field như server trả về */
    var checkDiscountPromo = function(_input_code) {
        var code = $.trim(_input_code).toUpperCase();
        var rule = (window.__demoPromoCodes || {})[code];
        var subtotal = parseFloat($('.inform--money .provisional').data('subtotal'));
        var data_j;
        if (!rule) {
            data_j = { status: 0, message: 'This code is not valid.' };
        } else if (rule.min && subtotal < rule.min) {
            data_j = { status: 0, message: 'This code needs a minimum order of ' + formatPrice(rule.min) + ' SGD.' };
        } else {
            var discount = rule.type === 'pct' ? Math.round(subtotal * rule.value) / 100 : Math.min(rule.value, subtotal);
            var total = Math.round((subtotal - discount) * 100) / 100;
            data_j = {
                status: 1, total_cost: total, total_cost_show: formatPrice(total),
                name_discount: rule.name, cost_discount: discount, cost_discount_show: '−' + formatPrice(discount),
                currency: 'SGD', message: rule.message
            };
        }
        setTimeout(function() {
            if (data_j.status == 1) {
                $('#div-total-cost').text(data_j.total_cost_show);
                $('#input-promo-code').attr('readonly', true);
                $('#btn-check-promocode').hide();
                $('#btn-cancel-promocode').show();          // nút có sẵn trong HTML
                $('#div-show-discount-promo').removeClass('d-none').show();
                $('#name-show-discount-promo').text(data_j.name_discount);
                $('#costdiscount-show-discount-promo').text(data_j.cost_discount_show + ' ' + data_j.currency).attr('data-discount', data_j.cost_discount);
                $('#warning-promo').show().text(data_j.message).css('color', 'green');
                $('#checkDiscount').val(data_j.cost_discount);
                input__totalPriceWithDiscount.val(data_j.total_cost);
                if (type__pickup__input.is(":checked")) {
                    applyTotalPriceDefault(0);
                } else if (type__delivery__lalamove__input.is(":checked") && output_address.val()) {
                    onChangeDateToChangeHour_Lalamove();     // giảm giá đổi -> có thể đổi mức miễn phí giao
                } else {
                    applyTotalPriceDefault(0);
                }
            } else {
                $('#warning-promo').show().text(data_j.message).css('color', 'red');
            }
            $('#btn-check-promocode').text('Apply');
        }, 300);
    };

    $(document).on('click', '#btn-cancel-promocode', function() {
        $('#costdiscount-show-discount-promo').attr('data-discount', 0).text('');
        $('#btn-check-promocode').show();
        $('#input-promo-code').attr('readonly', false).val('');
        $('#btn-cancel-promocode').hide();
        $('#div-show-discount-promo').hide();
        $('#warning-promo').hide();
        $('#checkDiscount').val('');
        input__totalPriceWithDiscount.val("");
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

    /* ---------------------------------------------------------------
       [DEMO] không có backend: chặn submit, hiện khối cảm ơn #cv2Done (HTML tĩnh), xoá giỏ.
       JS chỉ đổ .text() vào #cv2DoneNum / #cv2DoneTotal / #cv2DoneWhen / #cv2DoneEmail.
       Production: bỏ block này, form POST lên server như bình thường.
       --------------------------------------------------------------- */
    var summaryLine = function() {
        if (isLalamove()) {
            return 'Delivery on ' + $('.delilalamove__picker__date').val() + ', ' +
                   $('.delilalamove__picker__hour option:selected').text() + ' to ' + output_address.val();
        }
        var place = ($('.pickup--location--radio:checked').val() || '').replace('Self-Collection', '');
        return 'Self-collection on ' + $('.pickup__picker__date__second').val() + ' at ' +
               $('.pickup__picker__hour__second').val() + ' — ' + place;
    };
    $('.inform--frm').on('submit', function(e) {
        e.preventDefault();
        var email = isMember() ? $('.input__member__email').val() : $('.input__guest__email').val();
        $('#cv2DoneNum').text('GH' + Date.now().toString().slice(-8));
        $('#cv2DoneTotal').text($('#div-total-cost').text());
        $('#cv2DoneWhen').text(summaryLine());
        $('#cv2DoneEmail').text(email);
        if (window.YQ && YQ.cart) YQ.cart.clear();
        $('#cv2Main > .pay--part').not('#cv2Done').hide();
        $('#cv2Done').fadeIn(220);
        $('#cv2Aside').fadeOut(200);
        $('html,body').animate({ scrollTop: $('#cv2Top').offset().top - 120 }, 350);
    });
});
