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
     - Order summary: điền từ YQ.cart (production: server render).
     - Submit: chặn form.submit() và hiện màn hình cảm ơn (production: post lên server).
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
    L.circleMarker([hotel_location.lat, hotel_location.lng], { radius: 7, color: '#C4A46A', fillColor: '#C4A46A', fillOpacity: 1 })
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
    if (outputAddress__show[0]) outputAddress__show[0].innerHTML = '<span>' + $('<b>').text(formatted_address).html() + '</span>';
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

    /* Icon SVG cho demo (production dùng <img>) — chỉ phần tử có data-cv2-icon */
    var __icons = {
        store:   '<path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M3.5 9.5a2.6 2.6 0 0 0 5.2 0 2.6 2.6 0 0 0 5.3 0 2.6 2.6 0 0 0 5.3 0 1.2 1.2 0 0 0 1.2 0"/><path d="M5 12v8h14v-8"/><path d="M9.5 20v-5h5v5"/>',
        scooter: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><path d="M6 17h5l2.5-7H16"/><path d="M14 5h2.5l1.5 12"/><rect x="3" y="7" width="5.5" height="4" rx="1"/><path d="M8.5 9H11"/>',
        map:     '<path d="M9 4 3.5 6.5v13L9 17l6 2.5 5.5-2.5v-13L15 6.5 9 4Z"/><path d="M9 4v13M15 6.5v13"/>',
        lock:    '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>'
    };
    $('[data-cv2-icon]').each(function() {
        $(this).html('<svg class="yq-i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (__icons[$(this).data('cv2-icon')] || '') + '</svg>');
    });

    var formatPrice = function(price) {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
    };

    /* ---------------------------------------------------------------
       [DEMO] Order summary từ YQ.cart — production do server render:
       {$_htmlListCartCheckOut}, {$tmp_total_cost}, {$totalCost}
       --------------------------------------------------------------- */
    var renderCartSummary = function() {
        var items = (window.YQ && YQ.cart) ? YQ.cart.items : [];
        var subtotal = 0, html = '';
        $.each(items, function(_, i) {
            var line = (i.price + (i.addonFee || 0)) * i.qty;
            subtotal += line;
            html += '<p><span>' + $('<b>').text(i.name).html() +
                    (i.optionLabel ? '<small>' + $('<b>').text(i.optionLabel).html() + '</small>' : '') +
                    '</span><strong>X ' + i.qty + '</strong></p>';
        });
        subtotal = Math.round(subtotal * 100) / 100;
        $('.summary__list--items').html(html);
        $('.inform--money .provisional').attr('data-subtotal', subtotal).data('subtotal', subtotal).find('span').html(formatPrice(subtotal));
        confirm__price.attr('data-price', subtotal).data('price', subtotal).html(formatPrice(subtotal));
        $('#total-default-no-promo').val(subtotal);
        return items.length;
    };
    if (!renderCartSummary()) {
        $('#cv2Main').html(
            '<div class="yq-panel yq-empty">' +
                '<div class="yq-empty__icon">' + YQ.icon('bag', 26) + '</div>' +
                '<h3 class="yq-h3 mb-2">Your cart is empty</h3>' +
                '<p class="yq-muted mb-4">Add something lovely before checking out.</p>' +
                '<a class="yq-btn" href="shop.html">Browse the shop ' + YQ.icon('arrow', 16) + '</a>' +
            '</div>'
        );
        $('#cv2Aside').hide();
        return;
    }

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
    var pad2 = function(n) { return n < 10 ? '0' + n : '' + n; };

    /* Khung giờ có nghỉ giữa ca (__arrayMapTimeSlot*) — dùng cho Lalamove */
    var renderTimeSlotHaveBreak = function(date, type) {
        var picker__hour, slots, preparingtime;
        if (type == 'pickup') {
            picker__hour = $('.pickup__picker__hour__second'); slots = __arrayMapTimeSlotPickup; preparingtime = __pickupPreparingtimeMins;
        } else {
            picker__hour = $('.delilalamove__picker__hour'); slots = __arrayMapTimeSlotLalamove; preparingtime = __lalamovePreparingtimeMins;
        }
        picker__hour.html('').append("<option value=''>Time</option>");
        var nowMins = d.getHours() * 60 + d.getMinutes();
        $.each(slots, function(_, slot) {
            if (isToday(date) && slot.key * 60 - nowMins < preparingtime) return;   // hôm nay: bỏ khung không kịp chuẩn bị
            picker__hour.append('<option value="' + slot.key + '">' + slot.time + '</option>');
        });
    };
    /* Khung giờ theo từng giờ open..close — dùng cho Pickup */
    var renderTimeSlotByHours = function(date, type) {
        var picker__hour, openH, openM, closeH, closeM, preparingtime;
        if (type == 'pickup') {
            picker__hour = $('.pickup__picker__hour__second'); openH = __pickupOpenHour; openM = __pickupOpenMins;
            closeH = __pickupCloseHour; closeM = __pickupCloseMins; preparingtime = __pickupPreparingtimeMins;
        } else {
            picker__hour = $('.delilalamove__picker__hour'); openH = __lalamoveOpenHour; openM = __lalamoveOpenMins;
            closeH = __lalamoveCloseHour; closeM = __lalamoveCloseMins; preparingtime = __lalamovePreparingtimeMins;
        }
        picker__hour.html('').append("<option value=''>Time</option>");
        var nowMins = d.getHours() * 60 + d.getMinutes();
        for (var m = openH * 60 + openM; m < closeH * 60 + closeM; m += 60) {
            if (isToday(date) && m - nowMins < preparingtime) continue;
            var label = pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
            picker__hour.append($('<option></option>').attr('value', label).text(label));
        }
    };

    /* PICKUP PICKER */
    if (typeof __useTimeSlotByHourForPickup != "undefined") {
        $('.pickup__time__zone').html('').append('<select name="redeem_detail[receive_hour_pickup]" class="form-control mr--notes pickup__picker__hour__second"><option value="">Time</option></select><div class="append__pickup__picker__hour"></div>');
        renderTimeSlotByHours(null, "pickup");
    } else if (typeof __useTimeSlotForPickup != "undefined" || typeof __useTimeSlot != "undefined") {
        $('.pickup__time__zone').html('').append('<select name="redeem_detail[receive_hour_pickup]" class="form-control mr--notes pickup__picker__hour__second"><option value="">Time</option></select><div class="append__pickup__picker__hour"></div>');
        renderTimeSlotHaveBreak(null, "pickup");
    }
    /* [DEMO] không tải được flatpickr -> dùng <input type="date"> native */
    if (!window.flatpickr) {
        $('.pickup__picker__date__second, .delilalamove__picker__date').prop('readonly', false).attr('type', 'date')
            .on('change', function() { $(this).removeClass('error'); deli__lalamove__zone.removeClass('null__date'); });
        $.fn.flatpickr = function() { return this; };
    }
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
            renderTimeSlotByHours(selectedDates[0], "pickup");
        }
    });

    /* LALAMOVE PICKER */
    if (typeof __useTimeSlotLalamove != "undefined") {
        $('.lalamove__time__zone').html('').append('<select name="redeem_detail[receive_hour]" class="form-control mr--notes delilalamove__picker__hour"><option value="">Time</option></select><div class="append__delilalamove__picker__hour"></div>');
        renderTimeSlotHaveBreak(null, "lalamove");
    } else if (typeof __useTimeSlotByHourForLalamove != "undefined") {
        $('.lalamove__time__zone').html('').append('<select name="redeem_detail[receive_hour]" class="form-control mr--notes delilalamove__picker__hour"><option value="">Time</option></select><div class="append__delilalamove__picker__hour"></div>');
        renderTimeSlotByHours(null, "lalamove");
    }
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
            renderTimeSlotHaveBreak(selectedDates[0], "lalamove");
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
        $('.pickup__picker__hour__second').val('');
    };
    var resetDelivery = function() {
        $('.in--location--name span').html('Edit my address');
        $('#transportdistanceMeter').val('');
        $('#transportdistanceKm').val('');
        $('#transport__fee').val(0);
        $('#feeTrans').html('0.00');
    };
    var resetDeliveryLalamove = function() {
        $('.delilalamove__picker__date').val('');
        $('.delilalamove__picker__hour').val('');
        $('.in--location--name span').html('Edit my address');
        $('#output_address_show').val('');
        $('#output_address').val('');
        $('#transportdistanceMeter').val('');
        $('#transportdistanceKm').val('');
        $('.delivery__types').html('');
        $('#myLat').val('');
        $('#myLng').val('');
        $('#transport__fee').val(0);
        $('#feeTrans').html('0.00');
        var total__price__discount = parseFloat(String(input__totalPriceWithDiscount.val()).replace(/\,/g, ''));
        var total__price__base = parseFloat(String(confirm__price.data('price')).replace(/\,/g, ''));
        var total__price = total__price__discount > 0 ? total__price__discount : total__price__base;
        $('.confirm--price .price').html(formatPrice(total__price));
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
                $('.in--location--name span').html(myaddress);
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
        $('#feeTrans').html('');
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
                $('#div-total-cost').html(data_j.total_cost_show);
                $('#input-promo-code').attr('readonly', true);
                if ($("#btn-cancel-promocode").length === 0) {
                    $('<a id="btn-cancel-promocode" class="btn btn-primary">Cancel code</a>').insertAfter('#btn-check-promocode');
                }
                $('#btn-check-promocode').hide();
                $('#div-show-discount-promo').removeClass('d-none').show();
                $('#name-show-discount-promo').html(data_j.name_discount);
                $('#costdiscount-show-discount-promo').html(data_j.cost_discount_show + ' ' + data_j.currency).attr('data-discount', data_j.cost_discount);
                $('#warning-promo').show().html(data_j.message).css('color', 'green');
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
                $('#warning-promo').show().html(data_j.message).css('color', 'red');
            }
            $('#btn-check-promocode').html('Apply');
        }, 300);
    };

    $(document).on('click', '#btn-cancel-promocode', function() {
        $('#costdiscount-show-discount-promo').attr('data-discount', 0).html('');
        $('#btn-check-promocode').show();
        $('#input-promo-code').attr('readonly', false).val('');
        $('#btn-cancel-promocode').remove();
        $('#div-show-discount-promo').hide();
        $('#warning-promo').hide();
        $('#checkDiscount').val('');
        input__totalPriceWithDiscount.val("");
        var subtotal = parseFloat($('.inform--money .provisional').data('subtotal'));
        $('#div-total-cost').attr("data-price", $('#total-default-no-promo').val()).html(formatPrice(subtotal));
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
        feeTrans.html(fee.toFixed(2));
        feeTrans.data('fee', fee);
        input__transport__fee.val(fee);
        confirm__price.html(formatPrice(total__price + fee));
    };
    var sumTotalPrice = function() {
        var total__price__discount = parseFloat(String(input__totalPriceWithDiscount.val()).replace(/\,/g, ''));
        var div_total_cost = parseFloat($('#div-total-cost').attr('data-price'));
        $('#div-total-cost').html(formatPrice(total__price__discount > 0 ? total__price__discount : div_total_cost));
    };
    var checkPriceDeli = function(cofirmprice) {
        var cofirmprice__base = parseFloat(String($('.confirm--price .price').attr('data-price')).replace(/\,/g, ''));
        cofirmprice = cofirmprice ? cofirmprice : cofirmprice__base;
        var fee = 0;
        $('#feeTrans').html(formatPrice(fee));
        $('#transport__fee').val(fee);
        $('.confirm--price .price').html(formatPrice(cofirmprice + fee));
    };
    var checkPriceDeliLalamove = function(cofirmprice, fee) {
        var cofirmprice__base = parseFloat(String($('.confirm--price .price').attr('data-price')).replace(/\,/g, ''));
        cofirmprice = cofirmprice ? cofirmprice : cofirmprice__base;
        feeTrans.html(formatPrice(fee));
        feeTrans.data('fee', fee);
        $('#transport__fee').val(fee);
        confirm__price.html(formatPrice(cofirmprice + parseFloat(fee)));
    };

    /* Gõ lại thì bỏ trạng thái lỗi */
    $(document).on('input change', '.pay--part input.error, .pay--part input.null, .pay--part select.error', function() {
        $(this).removeClass('error null');
    });
    $('#becomeamember').on('change', function() { $(this).closest('.agree--zone').removeClass('null'); });

    /* ---------------------------------------------------------------
       submit form — chuỗi validate theo thứ tự của appv6 (guest, không inroom)
       --------------------------------------------------------------- */
    var scrollTo = function($el) {
        $('html, body').animate({ scrollTop: $el.offset().top - 150 }, 500);
    };
    $('.confirm--order--btn').on('click', function(e) {
        e.preventDefault();
        var input__isMember = $('#input__isMember');
        var input__member__email = $('.input__member__email');
        var input__member__firstname = $('.input__member__firstname');
        var input__member__lastname = $('.input__member__lastname');
        var input__member__phone = $('.input__member__phone');
        var input__guest__email = $('.input__guest__email');
        var input__guest__reemail = $('.input__guest__reemail');
        var input__guest__firstname = $('.input__guest__firstname');
        var input__guest__lastname = $('.input__guest__lastname');
        var input__guest__phone = $('#phone_register');
        var in__receivings = $('.in--receivings');
        var agree__checkbox = $('#becomeamember');
        var pickup__picker__date = $('.pickup__picker__date__second');
        var pickup__picker__hour = $('.pickup__picker__hour__second');
        var in__pickup = $('#in__pickup');
        var lalamove__picker__date = $('.delilalamove__picker__date');
        var lalamove__picker__hour = $('.delilalamove__picker__hour');
        var input__lalamove__unitnumber = $('#lalamove__unitnumber');
        var input__lalamove__postalcode = $('.postalcode__input');
        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($.trim(input__guest__email.val()));

        // ---- clear ----
        in__receivings.removeClass('null');
        deli__lalamove__zone.removeClass('null__types null null__date null__hour');
        $('.pay--part input:not(#phone_register)').removeClass('error');
        input__lalamove__unitnumber.removeClass('null');
        input__lalamove__postalcode.removeClass('null');
        $('.agree--zone').removeClass('null');
        $('.input--car--plate--number').removeClass('null');
        pickup__picker__hour.removeClass('error');
        pickup__picker__date.removeClass('error');

        if (!in__pickup.is(":checked") && !type__delivery__lalamove__input.is(":checked")) {
            scrollTo(in__receivings);
            in__receivings.addClass('null');
        } else if (in__pickup.is(":checked") && !pickup__picker__date.val()) {
            scrollTo(in__receivings);
            pickup__picker__date.addClass('error');
        } else if (in__pickup.is(":checked") && !pickup__picker__hour.val()) {
            scrollTo(in__receivings);
            pickup__picker__hour.addClass('error');
        } else if (in__pickup.is(":checked") && $('.pickup--location--radio:checked').val() == "Drive-Through Collection, Hotel Driveway" && !$('.input--car--plate--number').val()) {
            scrollTo(in__receivings);
            $('.input--car--plate--number').addClass('null');
        } else if (input__isMember.val() && (!input__member__email.val())) {
            scrollTo(input__member__email); input__member__email.addClass('error');
        } else if (input__isMember.val() && (!input__member__firstname.val())) {
            scrollTo(input__member__firstname); input__member__firstname.addClass('error');
        } else if (input__isMember.val() && (!input__member__lastname.val())) {
            scrollTo(input__member__lastname); input__member__lastname.addClass('error');
        } else if (input__isMember.val() == '' && (!input__guest__email.val() || !emailOk)) {
            scrollTo(input__guest__email); input__guest__email.addClass('error');
        } else if (input__isMember.val() == '' && (!input__guest__reemail.val() || $.trim(input__guest__reemail.val()).toLowerCase() !== $.trim(input__guest__email.val()).toLowerCase())) {
            scrollTo(input__guest__reemail); input__guest__reemail.addClass('error').focus();
        } else if (input__isMember.val() == '' && (!input__guest__firstname.val())) {
            scrollTo(input__guest__firstname); input__guest__firstname.addClass('error');
        } else if (input__isMember.val() == '' && (!input__guest__lastname.val())) {
            scrollTo(input__guest__lastname); input__guest__lastname.addClass('error');
        } else if (input__isMember.val() && (!input__member__phone.val() || input__member__phone.hasClass('error') == true || input__member__phone.val().length <= 6)) {
            scrollTo(input__member__phone); input__member__phone.addClass('error');
        } else if (input__isMember.val() == '' && (!input__guest__phone.val() || input__guest__phone.hasClass('error') == true || input__guest__phone.val().length <= 6)) {
            scrollTo(input__guest__phone); input__guest__phone.addClass('error');
        } else if (!agree__checkbox.is(":checked")) {
            scrollTo($('.agree--zone').first());
            $('.agree--zone').first().addClass('null');
        } else if (!output_address_show.val() && type__delivery__lalamove__input.is(":checked")) {
            scrollTo(in__receivings);
            output_address_show.addClass('null');
        } else if (type__delivery__lalamove__input.is(":checked") && !lalamove__picker__date.val()) {
            scrollTo(in__receivings);
            deli__lalamove__zone.addClass('null__date');
        } else if (type__delivery__lalamove__input.is(":checked") && !lalamove__picker__hour.val()) {
            scrollTo(in__receivings);
            deli__lalamove__zone.addClass('null__hour');
        } else if (type__delivery__lalamove__input.is(":checked") && !$('.delivery__type input').is(':checked') && __replaceLalaToHotelVan != true) {
            scrollTo($('.delivery__types'));
            deli__lalamove__zone.addClass('null__types');
        } else if (type__delivery__lalamove__input.is(":checked") && !input__lalamove__unitnumber.val()) {
            scrollTo(input__lalamove__unitnumber);
            input__lalamove__unitnumber.addClass('null');
        } else if (type__delivery__lalamove__input.is(":checked") && !/^\d{6}$/.test(input__lalamove__postalcode.val())) {
            scrollTo(input__lalamove__postalcode);
            input__lalamove__postalcode.addClass('null');
        } else {
            if (in__pickup.is(":checked") && $('.pickup--location--radio:checked').val() == "Drive-Through Collection, Hotel Driveway" && $('.input--car--plate--number').val()) {
                $('.pickup--location--radio:checked[value="Drive-Through Collection, Hotel Driveway"]').val("Drive-Through Collection, Hotel Driveway. Car Plate Number: " + $('.input--car--plate--number').val());
            }
            if (type__delivery__lalamove__input.is(":checked")) {
                $('.pickup--location--radio').prop("checked", false);
            }
            $('.inform--frm').submit();
        }
    });

    /* Drive-Through -> hiện ô biển số (giống inline script production) */
    $('.pickup--location--radio').on('change', function() {
        var carPlateSection = $('.car--plate--section');
        if ($('input[name="redeem_detail[receive_delivery_notes_prefix]"]:checked').val() === 'Drive-Through Collection, Hotel Driveway') carPlateSection.slideDown();
        else carPlateSection.hide();
    });

    /* ---------------------------------------------------------------
       [DEMO] không có backend: chặn submit, hiện màn hình cảm ơn, xoá giỏ.
       Production: bỏ block này, form POST lên server như bình thường.
       --------------------------------------------------------------- */
    $('.inform--frm').on('submit', function(e) {
        e.preventDefault();
        var num = 'GH' + Date.now().toString().slice(-8);
        var total = $('#div-total-cost').text();
        var email = $('.input__guest__email').val();
        var when = type__delivery__lalamove__input.is(':checked')
            ? 'Delivery on ' + $('.delilalamove__picker__date').val() + ', ' + $('.delilalamove__picker__hour option:selected').text() + ' to ' + $('<b>').text(output_address.val()).html()
            : 'Self-collection on ' + $('.pickup__picker__date__second').val() + ' at ' + $('.pickup__picker__hour__second').val() + ' — ' +
              $('<b>').text(($('.pickup--location--radio:checked').val() || '').replace('Self-Collection', '')).html();
        if (window.YQ && YQ.cart) YQ.cart.clear();
        $('#cv2Main').html(
            '<div class="pay--part cv2-done">' +
                '<div class="cv2-done__icon">' + YQ.icon('check', 28) + '</div>' +
                '<h2 class="yq-h2 mb-2">Thank you for your order</h2>' +
                '<p class="yq-muted mb-1">Order <span class="cv2-done__num">' + num + '</span> · ' + total + ' SGD</p>' +
                '<p class="yq-muted mb-1">' + when + '.</p>' +
                '<p class="yq-muted mb-4">A receipt has been sent to <b>' + $('<b>').text(email).html() + '</b>.</p>' +
                '<a class="yq-btn" href="index.html">Back to the shop ' + YQ.icon('arrow', 16) + '</a>' +
            '</div>'
        );
        $('#cv2Aside').fadeOut(200);
        $('html,body').animate({ scrollTop: $('#cv2Top').offset().top - 120 }, 350);
    });
});
