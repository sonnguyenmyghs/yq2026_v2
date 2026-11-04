/* ==========================================================================
   Module JS: delivery-rules — trang admin setup rule giao nhận (admin/delivery-rules.html)

   Markup + giá trị là HTML tĩnh (PHP in từ @delivery_rules). JS chỉ đọc/ghi giá trị form,
   ẩn-hiện khối có sẵn và clone <template> khi thêm dòng, không dựng HTML bằng chuỗi.

   Dữ liệu: mọi input mang data-yq-f="tên field"; panel và mỗi dòng lặp mang data-yq-scope;
   danh sách lặp mang data-yq-list + data-yq-tpl (id của khuôn). readScope / writeScope đi
   theo 3 attribute này nên thêm field mới chỉ cần thêm markup.

   Đầu ra:
     - #yqDrJson : JSON toàn bộ rule, POST lên server (catRules nằm trong từng phương thức)
     - buildConfig() : block window.__* đúng tên biến checkout-v2.html / appv6 đang đọc

     - buildPhp()    : biến backend theo backend-templates/select_payment_food.html:
                       $pickup_rule, $lalamove_rule, $dataDatelockJson + flag category theo từng phương thức

   Khác production (đánh dấu [DEMO]): không có #root -> lưu localStorage thay vì POST form.
   ========================================================================== */
$(function () {

    var $form = $('#yqDrForm');
    if (!$form.length) return;

    var STORE_KEY = 'yq_delivery_rules_v3';
    var METHODS = ['pickup', 'hotelvan', 'lalamove', 'roomservice'];
    var TABS = METHODS.concat('products');
    var NAMES = { pickup: 'Self-Collection', hotelvan: 'Hotel Van', lalamove: 'Lalamove', roomservice: 'Room Service', products: 'Advanced' };
    var DAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var FIELD_LABELS = {
        enabled: 'Offered at checkout', label: 'Checkout label', note: 'Checkout note', pausedUntil: 'Paused until',
        open: 'Standard opens', close: 'Standard closes', prepHours: 'Lead time (hours)', maxDays: 'Bookable days ahead',
        slotMode: 'Time choice', slots: 'Time windows', closed: 'Special dates', catRules: 'Categories', legacyRules: 'Backend flags', hotelId: 'Property ID', minOrder: 'Minimum order',
        rules: 'Conditional rules', locations: 'Pickup points', arrivalTip: 'Drive-through tip',
        replaceLala: 'Replace Lalamove', flatFee: 'Flat fee', freeOver: 'Free delivery over', postal: 'Postal areas',
        vehicles: 'Vehicles', outOfAreaMsg: 'Out-of-area message', fee: 'Delivery fee', serviceCharge: 'Service charge',
        lastOrderMins: 'Last order', verify: 'Guest check', payment: 'Payment'
    };

    function panel(key) { return $form.find('[data-yq-panel="' + key + '"]'); }

    /* ---------------------------------------------------------------
       Đọc / ghi form <-> object
       --------------------------------------------------------------- */
    function ownedBy(el, scope) { return $(el).closest('[data-yq-scope]')[0] === scope; }

    function readScope($scope) {
        var scope = $scope[0], out = {};
        $scope.find('[data-yq-f]').each(function () {
            if (!ownedBy(this, scope)) return;
            var f = this.getAttribute('data-yq-f');
            if (this.hasAttribute('data-yq-multi')) {
                out[f] = out[f] || [];
                if (this.checked) out[f].push(this.value);
            } else if (this.type === 'checkbox') {
                out[f] = this.checked;
            } else if (this.type === 'radio') {
                if (this.checked) out[f] = this.value;
            } else {
                out[f] = $.trim(this.value);
            }
        });
        $scope.find('[data-yq-list]').each(function () {
            if (!ownedBy(this, scope)) return;
            out[this.getAttribute('data-yq-list')] = $(this).children('[data-yq-scope]').map(function () {
                return readScope($(this));
            }).get();
        });
        return out;
    }

    function cloneRow($list) {
        var tpl = document.getElementById($list.attr('data-yq-tpl'));
        return $(tpl.content.firstElementChild.cloneNode(true)).appendTo($list);
    }

    function writeScope($scope, data) {
        var scope = $scope[0];
        $scope.find('[data-yq-f]').each(function () {
            if (!ownedBy(this, scope)) return;
            var v = data[this.getAttribute('data-yq-f')];
            if (v === undefined) return;
            if (this.hasAttribute('data-yq-multi')) this.checked = $.inArray(this.value, v) > -1;
            else if (this.type === 'checkbox') this.checked = !!v;
            else if (this.type === 'radio') this.checked = this.value === v;
            else this.value = v;
        });
        $scope.find('[data-yq-list]').each(function () {
            if (!ownedBy(this, scope)) return;
            var rows = data[this.getAttribute('data-yq-list')];
            if (!rows) return;
            var $list = $(this).empty();
            rows.forEach(function (row) { writeScope(cloneRow($list), row); });
        });
    }

    function readAll() {
        var s = {};
        TABS.forEach(function (k) { s[k] = readScope(panel(k)); });
        return s;
    }
    function writeAll(s) {
        TABS.forEach(function (k) { if (s[k]) writeScope(panel(k), s[k]); });
    }

    /* ---------------------------------------------------------------
       Helper giờ / ngày / tiền
       --------------------------------------------------------------- */
    function toMins(t) {
        var p = /^(\d{1,2}):(\d{2})/.exec(t || '');
        return p ? parseInt(p[1], 10) * 60 + parseInt(p[2], 10) : null;
    }
    function time12(mins) {
        var h = Math.floor(mins / 60), m = mins % 60;
        return (h % 12 || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
    }
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function parseDate(iso) {
        var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        return p ? new Date(+p[1], +p[2] - 1, +p[3]) : null;
    }
    function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
    /* So sánh số an toàn: ô trống = null, mà trong JS null >= 0 là true */
    function atLeast(a, b) { return num(a) !== null && num(b) !== null && num(a) >= num(b); }
    function sgd(n) { return 'SGD ' + Number(n).toFixed(2); }
    function list(v) {
        return String(v || '').split(',').map(function (x) { return $.trim(x).toLowerCase(); }).filter(Boolean);
    }
    /* Khoảng ngày nghỉ -> danh sách từng ngày (đúng dạng __useDisableDates*) */
    function closedDates(r) {
        var out = [];
        (r.closed || []).forEach(function (c) {
            var d = parseDate(c.from), end = parseDate(c.to) || d;
            if (!d || c.mode === 'hours') return;
            for (var i = 0; d <= end && i < 366; i++) {
                if ($.inArray(isoDate(d), out) < 0) out.push(isoDate(d));
                d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
            }
        });
        return out;
    }
    /* Giờ thật của 1 ngày: ngày đặc biệt > rule theo thứ > giờ chuẩn */
    function dayInfo(r, iso) {
        var code = DAY_CODES[parseDate(iso).getDay()];
        var info = { on: !!r[code + '_on'], open: r[code + '_open'] || r.open, close: r[code + '_close'] || r.close, prep: num(r.prepHours) || 0 };
        if (r[code + '_prep'] !== '' && num(r[code + '_prep']) !== null) info.prep = num(r[code + '_prep']);
        (r.closed || []).forEach(function (c) {
            var from = c.from, to = c.to || c.from;
            if (c.mode !== 'hours' || !from || iso < from || iso > to) return;
            info.on = true;
            info.open = c.open || info.open;
            info.close = c.close || info.close;
            if (num(c.prep) !== null) info.prep = num(c.prep);
        });
        return info;
    }
    function leadHours(rule) { return (rule.lead === 'custom' ? num(rule.leadCustom) : num(rule.lead)) || 0; }
    function digits(v) { return list(v).filter(function (x) { return /^\d+$/.test(x); }); }
    function usesWindows(key, r) { return key === 'hotelvan' || r.slotMode === 'fixed'; }
    function pausedUntil(r) {
        var d = r.pausedUntil ? new Date(r.pausedUntil) : null;
        return d && d > new Date() ? d : null;
    }

    /* ---------------------------------------------------------------
       Validate: 'err' chặn lưu, 'warn' chỉ nhắc
       --------------------------------------------------------------- */
    function validate(s) {
        var issues = [];
        function add(key, lvl, msg, $el) { issues.push({ key: key, lvl: lvl, msg: msg, $el: $el }); }
        function fld(key, f) { return panel(key).find('[data-yq-f="' + f + '"]').first(); }
        function row(key, name, i) { return panel(key).find('[data-yq-list="' + name + '"]').children().eq(i); }

        METHODS.forEach(function (key) {
            var r = s[key], open = toMins(r.open), close = toMins(r.close), name = NAMES[key];

            if (open === null || close === null || close <= open) {
                add(key, 'err', 'Closing time must be after opening time.', fld(key, 'close'));
            } else if ((open % 60 || close % 60) && (key === 'pickup' || key === 'lalamove' || (key === 'hotelvan' && r.enabled && r.replaceLala))) {
                add(key, 'warn', 'Checkout uses whole hours, so the minutes are ignored.', fld(key, 'open'));
            }
            var dayCodes = DAY_CODES.filter(function (d) { return r[d + '_on']; });
            if (!dayCodes.length) add(key, 'err', 'Keep at least one day open.', null);
            dayCodes.forEach(function (d) {
                if (!r[d + '_open'] && !r[d + '_close']) return;     // dùng giờ chuẩn: đã kiểm ở trên
                var a = toMins(r[d + '_open'] || r.open), b = toMins(r[d + '_close'] || r.close);
                if (a !== null && b !== null && b <= a) {
                    add(key, 'err', d.charAt(0).toUpperCase() + d.slice(1) + ': closing time must be after opening time.', fld(key, d + '_close'));
                }
            });

            var prep = num(r.prepHours);
            if (prep === null || prep < 0) {
                add(key, 'err', 'Lead time must be 0 or more hours.', fld(key, 'prepHours'));
            } else if (open !== null && close !== null && prep < 24 && prep * 60 >= close - open) {
                add(key, 'warn', 'Lead time is longer than opening hours, so same-day orders are never possible.', fld(key, 'prepHours'));
            }

            if (r.maxDays !== undefined && r.maxDays !== '' && !(parseInt(r.maxDays, 10) >= 1)) {
                add(key, 'err', 'Bookable days ahead must be at least 1, or blank for no limit.', fld(key, 'maxDays'));
            }

            /* Khung giờ: checkout dùng key = giờ bắt đầu, data-mins = key*60 nên phải tròn giờ */
            if (usesWindows(key, r)) {
                if (!r.slots.length) add(key, 'err', 'Add at least one time window.', null);
                var sorted = [];
                r.slots.forEach(function (w, i) {
                    var a = toMins(w.start), b = toMins(w.end), $r = row(key, 'slots', i);
                    if (a === null || b === null || b <= a) {
                        add(key, 'err', 'Window ' + (i + 1) + ': end must be after start.', $r.find('[data-yq-f="end"]'));
                        return;
                    }
                    if (a % 60) add(key, 'err', 'Window ' + (i + 1) + ': must start on the hour, because checkout keys windows by hour.', $r.find('[data-yq-f="start"]'));
                    if (open !== null && close !== null && (a < open || b > close)) {
                        add(key, 'warn', 'Window ' + (i + 1) + ' falls outside opening hours.', $r.find('[data-yq-f="start"]'));
                    }
                    if (key === 'hotelvan' && !(parseInt(w.seats, 10) >= 1)) {
                        add(key, 'err', 'Window ' + (i + 1) + ': orders per trip must be at least 1.', $r.find('[data-yq-f="seats"]'));
                    }
                    sorted.push({ a: a, b: b, i: i });
                });
                sorted.sort(function (x, y) { return x.a - y.a; }).forEach(function (w, n) {
                    if (n && w.a < sorted[n - 1].b) add(key, 'warn', 'Windows ' + (sorted[n - 1].i + 1) + ' and ' + (w.i + 1) + ' overlap.', row(key, 'slots', w.i).find('[data-yq-f="start"]'));
                });
            }

            r.closed.forEach(function (c, i) {
                var $r = row(key, 'closed', i), from = parseDate(c.from), to = parseDate(c.to);
                if (!from) add(key, 'err', 'Special date ' + (i + 1) + ' needs a start date.', $r.find('[data-yq-f="from"]'));
                else if (to && to < from) add(key, 'err', 'Special date ' + (i + 1) + ': end date is before start date.', $r.find('[data-yq-f="to"]'));
                if (c.mode === 'hours') {
                    var ca = toMins(c.open || r.open), cb = toMins(c.close || r.close);
                    if (ca !== null && cb !== null && cb <= ca) add(key, 'err', 'Special date ' + (i + 1) + ': closing time must be after opening time.', $r.find('[data-yq-f="close"]'));
                }
            });

            ['minOrder', 'flatFee', 'freeOver', 'fee', 'serviceCharge', 'lastOrderMins'].forEach(function (f) {
                if (r[f] !== undefined && r[f] !== '' && !atLeast(r[f], 0)) {
                    add(key, 'err', FIELD_LABELS[f] + ' must be 0 or more.', fld(key, f));
                }
            });

            /* Rule điều kiện */
            var alwaysAt = -1;
            r.rules.forEach(function (rule, i) {
                var $r = row(key, 'rules', i), n = i + 1;
                if (!rule.name) add(key, 'err', 'Rule ' + n + ' needs a name.', $r.find('[data-yq-f="name"]').first());
                if ((rule.action === 'fee' || rule.action === 'surcharge') && !atLeast(rule.value, 0)) {
                    add(key, 'err', 'Rule ' + n + ' needs a fee amount.', $r.find('[data-yq-f="value"]').last());
                }
                if (rule.action === 'surcharge' && key === 'pickup') {
                    add(key, 'warn', 'Rule ' + n + ' charges a fee on Self-Collection, which is shown as Free at checkout.', null);
                }
                var seen = {};
                rule.conds.forEach(function (c, j) {
                    var $v = $r.find('[data-yq-list="conds"]').children().eq(j).find('[data-yq-f="value"]');
                    if (!c.value) add(key, 'err', 'Rule ' + n + ', condition ' + (j + 1) + ' needs a value.', $v);
                    else if ((c.op === 'gte' || c.op === 'lte') && num(c.value) === null) add(key, 'err', 'Rule ' + n + ', condition ' + (j + 1) + ' needs a number.', $v);
                    if (rule.match === 'all' && c.op === 'is') {
                        if (seen[c.field]) add(key, 'warn', 'Rule ' + n + ' requires two different values for one field at once, so it can never match. Use commas or match ANY.', $v);
                        seen[c.field] = true;
                    }
                });
                if (rule.on && !rule.conds.length && alwaysAt < 0) alwaysAt = i;
                if (alwaysAt > -1 && i > alwaysAt && rule.on) add(key, 'warn', 'Rule ' + n + ' can never run: rule ' + (alwaysAt + 1) + ' has no conditions and always wins.', null);
            });

            /* Category của phương thức này */
            var seenCat = {};
            r.catRules.forEach(function (rule, i) {
                var $r = row(key, 'catRules', i), label = rule.name || ('Category ' + (i + 1));
                function f(name) { return $r.find('[data-yq-f="' + name + '"]').first(); }
                var cats = list(rule.cats), prods = list(rule.products);
                if (!rule.name) add(key, 'err', 'Category ' + (i + 1) + ' needs a name.', f('name'));
                if (!cats.length && !prods.length) add(key, 'err', label + ': choose a category or product.', f('cats'));
                if (cats.length !== digits(rule.cats).length) add(key, 'err', label + ': category IDs must be numbers separated by commas.', f('cats'));
                if (prods.length !== digits(rule.products).length) add(key, 'err', label + ': product IDs must be numbers separated by commas.', f('products'));
                if (rule.minQty !== '' && !atLeast(rule.minQty, 2)) add(key, 'err', label + ': quantity must be 2 or more, or blank.', f('minQty'));
                if (!rule.offered) return;
                if (rule.lead === 'custom' && !atLeast(rule.leadCustom, 0)) add(key, 'err', label + ': enter the custom lead time.', f('leadCustom'));
                if (rule.from && rule.to && rule.to < rule.from) add(key, 'err', label + ': "Available until" is before "Available from".', f('to'));
                if (rule.to && parseDate(rule.to) < parseDate(isoDate(new Date()))) add(key, 'warn', label + ': the available dates have ended, so guests cannot pick a date.', f('to'));
                cats.forEach(function (c) {
                    if (seenCat[c]) add(key, 'warn', 'Category ' + c + ' is listed twice. The longest lead time applies.', null);
                    seenCat[c] = true;
                });
            });

            /* Theo từng method */
            if (key === 'pickup') {
                var active = r.locations.filter(function (l) { return l.on; });
                if (r.enabled && !active.length) add(key, 'err', 'Keep at least one pickup point active.', null);
                r.locations.forEach(function (l, i) {
                    if (!l.name) add(key, 'err', 'Pickup point ' + (i + 1) + ' needs a name.', row(key, 'locations', i).find('[data-yq-f="name"]'));
                });
            }
            if (r.enabled && (key === 'pickup' || key === 'lalamove')) {
                var custom = DAY_CODES.some(function (d) { return !r[d + '_on'] || r[d + '_open'] || r[d + '_close'] || r[d + '_prep'] !== ''; })
                    || r.closed.some(function (c) { return c.mode === 'hours'; });
                if (custom) add(key, 'warn', 'Different hours by day are saved but not used at checkout yet. Closed dates are.', null);
            }
            if (key === 'pickup' && r.enabled && r.maxDays !== '') add(key, 'warn', 'Checkout does not limit how far ahead Self-Collection can be booked yet.', fld(key, 'maxDays'));
            if (key === 'lalamove' && r.enabled) {
                if (r.maxDays !== '30') add(key, 'warn', 'Checkout always allows 30 days for Lalamove, so this setting has no effect yet.', fld(key, 'maxDays'));
                if (r.slotMode === 'hour') add(key, 'warn', 'With "Every hour", checkout reads Lalamove lead time as minutes instead of hours. Fixed windows avoid this.', null);
            }
            if (key === 'lalamove') {
                if (num(r.maxDays) > 30) add(key, 'err', 'Lalamove accepts bookings up to 30 days ahead.', fld(key, 'maxDays'));
                if (r.enabled && r.freeOver === '') add(key, 'err', 'Set a free delivery amount. Checkout falls back to SGD 300 when it is missing.', fld(key, 'freeOver'));
            }
            if (key === 'hotelvan') {
                if (r.enabled && !list(r.postal).length) add(key, 'warn', 'No postal areas set, so the van is offered everywhere.', fld(key, 'postal'));
                if (r.postal && !list(r.postal).every(function (p) { return /^\d{1,6}$/.test(p); })) {
                    add(key, 'err', 'Postal areas must be digits separated by commas.', fld(key, 'postal'));
                }
                if (r.enabled && !r.replaceLala) add(key, 'warn', 'Checkout has no live Hotel Van tab yet. To use the van today, turn on "Replace Lalamove".', fld(key, 'replaceLala'));
                if (r.enabled && r.replaceLala && s.lalamove.enabled) add(key, 'warn', 'Lalamove is on but will not show: the van takes over the Delivery tab.', fld(key, 'replaceLala'));
            }
            if (key === 'roomservice' && r.enabled) {
                add(key, 'warn', 'The checkout page has no Room Service section yet. Guests will not see this method until it is added.', null);
                if (!r.payment.length) add(key, 'err', 'Allow at least one payment option.', null);
            }
        });

        /* Advanced: property + flag backend */
        var p = s.products;
        if (!/^\d+$/.test(p.hotelId)) add('products', 'err', 'Property ID must be a number.', fld('products', 'hotelId'));
        p.legacyRules.forEach(function (rule, i) {
            var $r = panel('products').find('[data-yq-list="legacyRules"]').children().eq(i);
            if (!list(rule.cats).length && !list(rule.products).length) add('products', 'err', 'Backend flag ' + (i + 1) + ' needs a category or product ID.', $r.find('[data-yq-f="cats"]'));
            if (list(rule.cats).length !== digits(rule.cats).length || list(rule.products).length !== digits(rule.products).length) add('products', 'err', 'Backend flag ' + (i + 1) + ': IDs must be numbers separated by commas.', $r.find('[data-yq-f="cats"]'));
        });

        if (!METHODS.some(function (k) { return s[k].enabled; })) {
            add('pickup', 'warn', 'All four methods are off, so guests cannot complete checkout.', null);
        }
        return issues;
    }

    /* ---------------------------------------------------------------
       Block window.__* — đúng thứ tự + tên biến ở checkout-v2.html.
       Lưu ý theo checkout-v2.js:
         - __lalamoveCustomDeliveryType kiểm bằng typeof -> CAR only thì BỎ dòng, không gán false
         - __replaceLalaToHotelVan = true -> tab Delivery chạy van trên chính bộ __lalamove*,
           nên giờ / khung giờ / ngày nghỉ lấy từ rule van
       --------------------------------------------------------------- */
    function jsVal(v) { return JSON.stringify(v).replace(/</g, '\\u003c'); }

    function timeBlock(prefix, r) {
        var open = toMins(r.open) || 0, close = toMins(r.close) || 0;
        return [
            'window.__' + prefix + 'OpenHour = ' + Math.floor(open / 60) + ';',
            'window.__' + prefix + 'OpenMins = ' + (open % 60) + ';',
            'window.__' + prefix + 'CloseHour = ' + Math.floor(close / 60) + ';',
            'window.__' + prefix + 'CloseMins = ' + (close % 60) + ';',
            'window.__' + prefix + 'PreparingtimeHour = ' + (num(r.prepHours) || 0) + ';',
            'window.__' + prefix + 'PreparingtimeMins = 60 * __' + prefix + 'PreparingtimeHour;'
        ];
    }
    function slotArray(r) {
        var rows = r.slots.map(function (w) {
            return '  { time: ' + jsVal(time12(toMins(w.start)) + ' to ' + time12(toMins(w.end))) + ', key: ' + Math.floor(toMins(w.start) / 60) + ' }';
        });
        return rows.length ? '[\n' + rows.join(',\n') + '\n]' : '[]';
    }
    function extraRule(key, r) {
        var x = $.extend({}, r);
        delete x.slotMode;
        x.pausedUntil = pausedUntil(r) ? r.pausedUntil : '';
        return x;
    }

    function buildConfig(s) {
        var van = s.hotelvan, useVan = van.enabled && van.replaceLala, deli = useVan ? van : s.lalamove;
        var out = timeBlock('pickup', s.pickup).concat(timeBlock('lalamove', deli));
        out.push('');
        out.push('window.__replaceLalaToHotelVan = ' + (useVan ? 'true' : 'false') + ';');
        if (s.lalamove.vehicles === 'both') out.push('window.__lalamoveCustomDeliveryType = true;');
        out.push('window.__useTimeSlotByHour = true;');
        /* appv6: __useTimeSlotForPickup chỉ render lúc tải trang, đổi ngày chỉ xét __useTimeSlot (dòng 1178) */
        out.push(s.pickup.slotMode === 'hour' ? 'window.__useTimeSlotByHourForPickup = true;' : 'window.__useTimeSlot = true;');
        out.push(usesWindows(useVan ? 'hotelvan' : 'lalamove', deli) ? 'window.__useTimeSlotLalamove = true;' : 'window.__useTimeSlotByHourForLalamove = true;');
        out.push('');
        out.push('window.__arrayMapTimeSlotLalamove = ' + slotArray(deli) + ';');
        out.push('window.__arrayMapTimeSlotPickup = ' + slotArray(s.pickup) + ';');
        out.push('');
        out.push('window.__useDisableDatesLalamove = ' + jsVal(closedDates(deli)) + ';');
        out.push('window.__useDisableDatesPickup = ' + jsVal(closedDates(s.pickup)) + ';');
        if (deli.freeOver !== '') out.push('window.__minimumPriceForDeli = ' + num(deli.freeOver) + ';');
        if (useVan && van.flatFee !== '') out.push('window.__fixedFeeBelowLowestPrice = ' + num(van.flatFee) + ';');
        /* appv6 đã có luồng inroom (data-recei=4), template chưa có markup .in--room / #in__room / .inroom__number */
        if (s.roomservice.enabled) {
            out.push('');
            out.push('window.__inroomSwitch = true;');
            out = out.concat(timeBlock('inroom', s.roomservice));
            out.push('window.__useTimeSlotByHourForInroom = true;');
        }
        out.push('');
        out.push('/* NEW: the checkout does not read this yet (on/off, pause, days, rules) */');
        var extra = {};
        METHODS.forEach(function (k) { extra[k] = extraRule(k, s[k]); });
        extra.products = s.products;
        out.push('window.__deliveryRulesExtra = ' + jsVal(extra) + ';');
        return out.join('\n');
    }

    /* ---------------------------------------------------------------
       Biến backend cho select_payment_food.html.
       Mỗi phương thức có lead + ngày riêng: $flagLeadHours*, $flagMinDate*, $flagMaxDate*, $flagHide*.
       Chỉ in ID số, ngày hợp lệ, tên flag trong danh sách; tên rule bỏ ký tự có thể đóng comment PHP.
       --------------------------------------------------------------- */
    function ruleLines(name, r) {
        return [
            '$' + name + "['open_time'] = " + Math.floor((toMins(r.open) || 0) / 60) + ';',
            '$' + name + "['close_time'] = " + Math.floor((toMins(r.close) || 0) / 60) + ';',
            '$' + name + "['preparing_time'] = " + (num(r.prepHours) || 0) + ';'
        ];
    }
    /* Template đọc data.pick_up.status trước .date nên phải giữ object rỗng khi không có ngày nghỉ */
    function lockPart(dates) { return dates.length ? { status: 1, date: dates } : {}; }
    function phpName(v) { return String(v).replace(/[\r\n?>*\/\\]/g, ' '); }
    function phpTarget(rule, hotel) {
        var prods = digits(rule.products), cats = digits(rule.cats), tests = [];
        if (prods.length) tests.push('in_array($productIDCart, array(' + prods.join(', ') + '))');
        if (cats.length) tests.push("in_array($productEachInfoCart['cat_id'], array(" + cats.join(', ') + '))');
        if (!tests.length) return '';
        var qty = atLeast(rule.minQty, 2) ? '$quantityCart > ' + (parseInt(rule.minQty, 10) - 1) + ' && ' : '';
        return qty + (tests.length > 1 ? '(' + tests.join(' || ') + ')' : tests[0]) + ' && $hotel_id == ' + hotel;
    }

    function buildPhp(s) {
        var p = s.products, deli = (s.hotelvan.enabled && s.hotelvan.replaceLala) ? s.hotelvan : s.lalamove;
        var hotel = /^\d+$/.test(p.hotelId) ? p.hotelId : '0', out = ['// Property rules'];
        out = out.concat(ruleLines('pickup_rule', s.pickup), ruleLines('lalamove_rule', deli));
        out.push('// POST /cart/?date_lock=true adds its dates to this list once the guest picks a date or changes month');
        out.push("$dataDatelockJson = '" + JSON.stringify({ data: { pick_up: lockPart(closedDates(s.pickup)), delivery: lockPart(closedDates(deli)) } }) + "';");
        out.push('', '// Before the cart loop, at every hotel');
        [['Pickup', s.pickup], ['Lalamove', deli]].forEach(function (m) {
            out.push("$flagHide" + m[0] + " = ''; // #input__disable" + m[0]);
            out.push('$flagLeadHours' + m[0] + ' = 0; // #category__leadHours' + m[0]);
            out.push("$flagMinDate" + m[0] + " = ''; // #category__minDate" + m[0]);
            out.push("$flagMaxDate" + m[0] + " = ''; // #category__maxDate" + m[0]);
        });
        out.push('', '// Inside the cart loop');
        [['Pickup', s.pickup], ['Lalamove', deli]].forEach(function (m) {
            var n = m[0];
            m[1].catRules.forEach(function (rule) {
                var target = phpTarget(rule, hotel);
                if (!target) return;
                out.push('// ' + n + ': ' + phpName(rule.name));
                out.push('if (' + target + ') {');
                if (!rule.offered) {
                    out.push('\t$flagHide' + n + ' = ' + (n === 'Lalamove' ? 'true' : '1') + ';');
                } else {
                    var lead = leadHours(rule);
                    if (lead) out.push('\t$flagLeadHours' + n + ' = max($flagLeadHours' + n + ', ' + lead + ');');
                    if (parseDate(rule.from)) out.push('\t$flagMinDate' + n + " = max($flagMinDate" + n + ", '" + rule.from + "');");
                    if (parseDate(rule.to)) out.push('\t$flagMaxDate' + n + ' = $flagMaxDate' + n + ' ? min($flagMaxDate' + n + ", '" + rule.to + "') : '" + rule.to + "';");
                }
                out.push('}');
            });
        });
        p.legacyRules.forEach(function (rule) {
            var target = phpTarget(rule, hotel);
            if (!rule.on || !target) return;
            out.push('// Backend flag: ' + phpName(rule.name));
            out.push('if (' + target + ') {');
            rule.legacy.forEach(function (f) { if (/^[A-Za-z0-9]+$/.test(f)) out.push('\t$' + f + ' = 1;'); });
            out.push('}');
        });
        return out.join('\n');
    }

    /* Gộp category của 1 phương thức trên cả giỏ: lead dài nhất, ngày bắt đầu muộn nhất,
       ngày kết thúc sớm nhất, category không bán thì ẩn cả phương thức (giống delivery_rules.php) */
    function cartEffects(r, o) {
        var e = { lead: 0, leadBy: '', from: '', to: '', hiddenBy: '' };
        o.lines.forEach(function (l) {
            r.catRules.forEach(function (rule) {
                var match = (l.cat && $.inArray(l.cat, digits(rule.cats)) > -1) || (l.product && $.inArray(l.product, digits(rule.products)) > -1);
                if (!match || (atLeast(rule.minQty, 2) && !atLeast(l.qty, rule.minQty))) return;
                if (!rule.offered) { e.hiddenBy = rule.name; return; }
                var lead = leadHours(rule);
                if (lead > e.lead) { e.lead = lead; e.leadBy = rule.name; }
                if (rule.from && rule.from > e.from) e.from = rule.from;
                if (rule.to && (!e.to || rule.to < e.to)) e.to = rule.to;
            });
        });
        return e;
    }

    /* ---------------------------------------------------------------
       Test an order — không ghi gì, chạy trên bản đang sửa
       --------------------------------------------------------------- */
    function condMatch(c, o) {
        if (c.field === 'category') {
            var inCart = o.lines.some(function (l) { return $.inArray(l.cat, list(c.value)) > -1; });
            return c.op === 'not' ? !inCart : inCart;
        }
        var actual = { subtotal: o.subtotal, items: o.items, postal: o.postal, guest: o.guest }[c.field];
        if (c.op === 'gte') return atLeast(actual, c.value);
        if (c.op === 'lte') return atLeast(c.value, actual);
        var vals = list(c.value), a = String(actual || '').toLowerCase();
        if (c.op === 'is') return $.inArray(a, vals) > -1;
        if (c.op === 'not') return $.inArray(a, vals) < 0;
        return vals.some(function (v) { return a.indexOf(v) === 0; });   // starts
    }

    function baseFee(key, r, o) {
        if (key === 'pickup') return { amount: 0, text: 'Free' };
        if (key === 'hotelvan') {
            return atLeast(o.subtotal, r.freeOver) ? { amount: 0, text: 'Complimentary' } : { amount: num(r.flatFee) || 0 };
        }
        if (key === 'lalamove') {
            return atLeast(o.subtotal, r.freeOver) ? { amount: 0, text: 'Complimentary' } : { quote: true, amount: 0 };
        }
        return { amount: num(r.fee) || 0 };
    }
    function feeText(key, r, fee, o) {
        /* Rule "free" chỉ miễn phí giao, service charge vẫn tính */
        if (key === 'roomservice' && num(r.serviceCharge)) {
            var svc = (num(o.subtotal) || 0) * num(r.serviceCharge) / 100;
            return sgd(fee.amount) + ' + ' + num(r.serviceCharge) + '% = ' + sgd(fee.amount + svc);
        }
        if (fee.text) return fee.text;
        if (fee.quote) return 'Live quote' + (fee.amount ? ' + ' + sgd(fee.amount) : '');
        return fee.amount ? sgd(fee.amount) : 'Free';
    }

    function evaluate(key, s, o) {
        var r = s[key], fx = cartEffects(r, o);
        var checks = [];
        function pass(msg) { checks.push({ ok: true, msg: msg }); return true; }
        function fail(msg) { checks.push({ ok: false, msg: msg }); return { offered: false, checks: checks }; }

        if (!r.enabled) return fail('Turned off');
        var paused = pausedUntil(r);
        if (paused) return fail('Paused until ' + time12(paused.getHours() * 60 + paused.getMinutes()));

        if (fx.hiddenBy) return fail('Not offered for ' + fx.hiddenBy);

        var date = parseDate(o.date), t = toMins(o.time), now = new Date();
        if (!date || t === null) return fail('Choose a date and time to test');
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var daysAhead = Math.round((date - today) / 86400000);
        if (daysAhead < 0) return fail('Date is in the past');
        if (r.maxDays && daysAhead >= parseInt(r.maxDays, 10)) return fail('Only bookable ' + r.maxDays + ' days ahead');
        if (fx.from && fx.to && fx.from > fx.to) return fail('These items share no available date (' + fx.from + ' to ' + fx.to + ')');
        if (fx.from && o.date < fx.from) return fail('Items are available from ' + fx.from);
        if (fx.to && o.date > fx.to) return fail('Items are available until ' + fx.to);
        if ($.inArray(o.date, closedDates(r)) > -1) return fail('Closed on this date');
        var day = dayInfo(r, o.date);
        if (!day.on) return fail('Closed on this weekday');
        pass('Open on this date, ' + day.open + ' to ' + day.close);

        /* Giống filterTimeSlots ở checkout: tính từ giờ BẮT ĐẦU của khung */
        var open = toMins(day.open), close = toMins(day.close), startMins = t;
        if (usesWindows(key, r)) {
            var win = r.slots.filter(function (w) { return toMins(w.start) <= t && t < toMins(w.end); })[0];
            if (!win) return fail('No time window covers ' + time12(t));
            startMins = toMins(win.start);
            if (startMins < open || toMins(win.end) > close) return fail('Window is outside hours on this date');
            pass('Window ' + time12(startMins) + ' to ' + time12(toMins(win.end)));
        } else {
            if (t < open || t >= close) return fail('Outside hours (' + day.open + ' to ' + day.close + ')');
            if (key === 'roomservice' && t > close - (num(r.lastOrderMins) || 0)) return fail('After last order time');
            pass('Within hours');
        }
        var slotAt = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(startMins / 60), startMins % 60);
        /* Theo appv6: lead dưới 24h chỉ xét khi chọn hôm nay; từ 24h đẩy ngày sớm nhất theo số ngày,
           thêm 1 ngày nếu đã qua giờ đóng, và mọi khung giờ phải sau now + N*24h. */
        var nowMins = now.getHours() * 60 + now.getMinutes();
        var catDays = fx.lead >= 24 ? Math.ceil(fx.lead / 24) : 0;
        if (catDays) {
            var lastSlot = toMins(r.close) - (key === 'pickup' ? 60 : 0);
            var fromDiff = fx.from ? Math.trunc((parseDate(fx.from) - now) / 86400000) : 0;
            var minDays = catDays + (nowMins > lastSlot ? 1 : 0);
            if (fromDiff <= 0 && daysAhead < minDays) return fail('Earliest date is ' + minDays + ' days ahead (' + fx.leadBy + ')');
            if (daysAhead <= catDays && slotAt - now < catDays * 86400000) return fail('Needs ' + (catDays * 24) + 'h lead time (' + fx.leadBy + ')');
            pass('Enough lead time (' + (catDays * 24) + 'h)');
        } else {
            var prep = Math.max(day.prep, fx.lead);
            if (daysAhead === 0 && (slotAt - now) / 60000 < prep * 60) return fail('Needs ' + prep + 'h lead time');
            pass('Enough lead time (' + prep + 'h)');
        }

        if (r.minOrder !== '' && num(o.subtotal) < num(r.minOrder)) return fail('Below minimum order of ' + sgd(num(r.minOrder)));
        if (key === 'roomservice') {
            if (o.guest !== 'in-house') return fail('In-house guests only');
            pass('In-house guest');
        }
        if (key === 'hotelvan' && list(r.postal).length) {
            var inArea = list(r.postal).some(function (p) { return String(o.postal || '').indexOf(p) === 0; });
            if (!inArea) return fail('Postal code is outside van areas');
            pass('Postal code in van area');
        }

        /* Rule điều kiện: từ trên xuống, rule đầu tiên khớp thắng */
        var fee = baseFee(key, r, o), rules = r.rules;
        if (fx.free) { fee = { amount: 0, text: 'Complimentary' }; pass('Free delivery from item rule'); }
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (!rule.on) continue;
            var hit = !rule.conds.length || (rule.match === 'any'
                ? rule.conds.some(function (c) { return condMatch(c, o); })
                : rule.conds.every(function (c) { return condMatch(c, o); }));
            if (!hit) continue;
            if (rule.action === 'hide') return fail('Hidden by rule ' + (i + 1) + ': ' + rule.name);
            pass('Rule ' + (i + 1) + ' applied: ' + rule.name);
            if (rule.action === 'free') fee = { amount: 0, text: 'Complimentary' };
            if (rule.action === 'fee') fee = { amount: num(rule.value) || 0 };
            if (rule.action === 'surcharge') { fee = $.extend({}, fee); delete fee.text; fee.amount += num(rule.value) || 0; }
            break;
        }
        return { offered: true, fee: feeText(key, r, fee, o), checks: checks };
    }

    function readOrder() {
        var lines = $('#yqDrTLines').children().map(function () {
            return {
                cat: $.trim($(this).find('[data-yq-t="cat"]').val()),
                product: $.trim($(this).find('[data-yq-t="product"]').val()),
                qty: $(this).find('[data-yq-t="qty"]').val()
            };
        }).get();
        return {
            subtotal: $('#yqDrTSubtotal').val(), lines: lines,
            items: lines.reduce(function (n, l) { return n + (num(l.qty) || 0); }, 0),
            postal: $.trim($('#yqDrTPostal').val()), guest: $('#yqDrTGuest').val(),
            date: $('#yqDrTDate').val(), time: $('#yqDrTTime').val()
        };
    }

    function paintResults(s) {
        var o = readOrder(), checkTpl = document.getElementById('yqDrTplCheck');
        METHODS.forEach(function (key) {
            var res = evaluate(key, s, o), $res = $('[data-yq-res="' + key + '"]');
            $res.toggleClass('is-yes', res.offered).toggleClass('is-no', !res.offered);
            $res.find('.yq-drule__resname').text(s[key].label || NAMES[key]);
            $res.find('.yq-drule__resfee').text(res.offered ? res.fee : 'Not offered');
            var $ul = $res.find('.yq-drule__checks').empty();
            res.checks.forEach(function (c) {
                $(checkTpl.content.firstElementChild.cloneNode(true)).text(c.msg).toggleClass('is-fail', !c.ok).appendTo($ul);
            });
        });
    }

    /* ---------------------------------------------------------------
       Vẽ lại trạng thái sau mỗi thay đổi
       --------------------------------------------------------------- */
    function summary(key, r) {
        if (key === 'products') return 'Backend flags';
        var cats = r.catRules.length;
        var base = key === 'hotelvan' ? r.slots.length + ' trips a day' : r.open + ' to ' + r.close;
        return base + (cats ? ' · ' + cats + (cats === 1 ? ' category' : ' categories') : '');
    }

    function catSummary(c) {
        if (!c.offered) return 'Not offered';
        var lead = leadHours(c), text = lead ? lead + 'h ahead' : 'Standard lead time';
        if (c.from || c.to) text += ' · ' + (c.from && c.to ? c.from + ' to ' + c.to : (c.from ? 'from ' + c.from : 'until ' + c.to));
        return text;
    }

    function paintConditionals($scope) {
        /* data-yq-when="field:value" -> chỉ hiện khi field trong cùng scope có giá trị đó */
        $scope.find('[data-yq-when]').each(function () {
            var p = this.getAttribute('data-yq-when').split(':');
            var $sc = $(this).closest('[data-yq-scope]');
            var $f = $sc.find('[data-yq-f="' + p[0] + '"]').filter(function () { return ownedBy(this, $sc[0]); });
            var v = $f.is(':radio') ? $f.filter(':checked').val() : $f.val();
            var match = $.inArray(v, p[1].split('|')) > -1;
            this.hidden = !match;
        });
        /* Toán tử + placeholder theo loại field của điều kiện */
        $scope.find('.yq-drule__row--cond').each(function () {
            var $r = $(this), field = $r.find('[data-yq-f="field"]').val();
            var numeric = field === 'subtotal' || field === 'items';
            var $op = $r.find('[data-yq-f="op"]');
            $op.find('option').each(function () {
                var isNum = this.value === 'gte' || this.value === 'lte';
                var bad = numeric ? !isNum : (isNum || (this.value === 'starts' && field !== 'postal'));
                this.disabled = bad; this.hidden = bad;
            });
            if ($op.find('option:selected').prop('disabled')) $op.val(numeric ? 'gte' : 'is');
            $r.find('[data-yq-f="value"]').attr('placeholder', {
                subtotal: '200', items: '10', postal: '22, 23', category: '2847, 2826', guest: 'in-house'
            }[field]);
        });
        $scope.find('.yq-drule__rule').each(function () {
            $(this).toggleClass('is-off', !$(this).find('.yq-drule__rulehead input[type=checkbox]').prop('checked'));
            $(this).find('[data-yq-move="-1"]').prop('disabled', !$(this).prev().length);
            $(this).find('[data-yq-move="1"]').prop('disabled', !$(this).next().length);
        });
        $scope.find('[data-yq-list]').each(function () {
            $(this).toggleClass('is-empty', !$(this).children().length);
        });
        /* Dòng category: tóm tắt thành một câu */
        $scope.find('.yq-drule__catrow').each(function () {
            var c = readScope($(this));
            $(this).toggleClass('is-off', !c.offered);
            $(this).find('> summary .yq-drule__catname').text(c.name || 'New category');
            $(this).find('> summary .yq-drule__catsum').text(catSummary(c));
        });
    }

    /* Lỗi hiện to ở đầu panel và mở sẵn dòng bị lỗi; ghi chú thu gọn thành 1 dòng */
    function paintIssues(issues) {
        var tpl = document.getElementById('yqDrTplIssue');
        $form.find('.is-invalid').removeClass('is-invalid');
        $form.find('.yq-error').removeClass('is-on').text('');
        $form.find('[data-yq-issues], [data-yq-noteslist]').empty();
        issues.forEach(function (x) {
            var isErr = x.lvl === 'err', $p = panel(x.key);
            var $li = $(tpl.content.firstElementChild.cloneNode(true)).text(x.msg);
            if (isErr) $li.addClass('is-err').appendTo($p.find('[data-yq-issues]'));
            else $li.removeClass('yq-drule__issue').appendTo($p.find('[data-yq-noteslist]'));
            if (isErr && x.$el && x.$el.length) {
                x.$el.addClass('is-invalid').parents('details').prop('open', true);
            }
        });
        TABS.forEach(function (k) {
            var $p = panel(k), n = $p.find('[data-yq-noteslist]').children().length;
            $p.find('[data-yq-notes]').prop('hidden', !n);
            $p.find('[data-yq-notecount]').text(n + (n === 1 ? ' thing to check' : ' things to check'));
        });
    }

    function paintNav(s, issues) {
        TABS.forEach(function (key) {
            var r = s[key], errs = issues.filter(function (x) { return x.key === key && x.lvl === 'err'; }).length;
            if (key === 'products') {
                $('[data-yq-method="products"] .yq-drule__pill').text(errs ? errs + (errs > 1 ? ' errors' : ' error') : 'Dev').toggleClass('has-error', !!errs);
                $('[data-yq-method="products"] .yq-drule__msum').text(summary(key, r));
                return;
            }
            var $m = $('[data-yq-method="' + key + '"]'), paused = pausedUntil(r);
            var text = errs ? errs + (errs > 1 ? ' errors' : ' error') : (!r.enabled ? 'Off' : (paused ? 'Paused' : 'Live'));
            $m.find('.yq-drule__pill').text(text)
                .toggleClass('has-error', !!errs)
                .toggleClass('is-live', !errs && r.enabled && !paused)
                .toggleClass('is-paused', !errs && r.enabled && !!paused);
            $m.find('.yq-drule__msum').text(summary(key, r));
            var $p = panel(key);
            $p.find('[data-yq-pausetxt]').text(paused ? 'Paused until ' + time12(paused.getHours() * 60 + paused.getMinutes()) + ', resumes automatically' : '');
            $p.find('[data-yq-resume]').prop('hidden', !paused);
        });
    }

    var saved = null, log = [];

    function paintSave(dirty, issues) {
        var errs = issues.filter(function (x) { return x.lvl === 'err'; }).length;
        var $state = $('#yqDrState');
        $state.toggleClass('is-dirty', dirty).toggleClass('has-error', dirty && errs > 0);
        $state.text(!dirty ? 'All changes saved' : (errs ? errs + (errs > 1 ? ' errors to fix' : ' error to fix') : 'Unsaved changes'));
        $('#yqDrSave, #yqDrDiscard').prop('disabled', !dirty);
    }

    function refresh() {
        paintConditionals($form);
        var s = readAll(), issues = validate(s);
        paintIssues(issues);
        paintNav(s, issues);
        paintSave(JSON.stringify(s) !== saved, issues);
        $('#yqDrCode').text(buildConfig(s));
        $('#yqDrPhp').text(buildPhp(s));
        paintResults(s);
        return { state: s, issues: issues };
    }

    /* ---------------------------------------------------------------
       Lưu / huỷ / nhật ký thay đổi
       --------------------------------------------------------------- */
    function diff(before, after) {
        var out = [];
        TABS.forEach(function (k) {
            $.each(after[k], function (f, v) {
                var a = before[k][f];
                if (JSON.stringify(a) === JSON.stringify(v)) return;
                var label = FIELD_LABELS[f] || f;
                if ($.isArray(v) || f === 'pausedUntil') out.push(NAMES[k] + ': ' + label + ' changed');
                else if (typeof v === 'boolean') out.push(NAMES[k] + ': ' + label + ' ' + (v ? 'on' : 'off'));
                else out.push(NAMES[k] + ': ' + label + ' ' + (a === '' ? 'blank' : a) + ' → ' + (v === '' ? 'blank' : v));
            });
        });
        return out;
    }

    function addLogRow(entry) {
        var $li = $(document.getElementById('yqDrTplLog').content.firstElementChild.cloneNode(true));
        $li.find('b').text(entry.text);
        $li.find('time').text(entry.when + ' · ' + entry.who);
        $('#yqDrLog').prepend($li);
    }

    function storeDemo() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify({ rules: JSON.parse(saved), log: log })); } catch (e) {}
    }

    function goTo(key) {
        $('[data-yq-method]').each(function () {
            var on = this.getAttribute('data-yq-method') === key;
            $(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false').attr('tabindex', on ? '0' : '-1');
        });
        TABS.forEach(function (k) { panel(k).prop('hidden', k !== key); });
        /* Mobile: danh sách method cuộn ngang -> kéo tab đang chọn vào khung nhìn, không cuộn trang */
        var nav = document.getElementById('yqDrNav'), tab = $('[data-yq-method="' + key + '"]')[0];
        if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = tab.offsetLeft - nav.offsetLeft - 16;
    }

    $form.on('submit', function (e) {
        var res = refresh(), errs = res.issues.filter(function (x) { return x.lvl === 'err'; });
        if (errs.length) {
            e.preventDefault();
            goTo(errs[0].key);
            if (errs[0].$el && errs[0].$el.length) errs[0].$el.trigger('focus');
            else panel(errs[0].key).find('[data-yq-issues]')[0].scrollIntoView({ block: 'center' });
            YQ.toast('Fix the highlighted rules before saving.');
            return;
        }
        $('#yqDrJson').val(JSON.stringify(res.state));
        allowLeave = true;
        if ($('#root').length) return;                     // production: POST form, server trả lại trang

        /* [DEMO] không có backend: lưu localStorage + ghi nhật ký tại chỗ */
        e.preventDefault();
        allowLeave = false;
        var changes = diff(JSON.parse(saved), res.state);
        var entry = { text: changes.join(' · ') || 'No field changes', when: new Date().toLocaleString('en-SG'), who: 'You' };
        saved = JSON.stringify(res.state);
        log.push(entry);
        addLogRow(entry);
        storeDemo();
        refresh();
        YQ.toast('Delivery rules saved.');
    });

    $('#yqDrDiscard').on('click', function () {
        writeAll(JSON.parse(saved));
        refresh();
        YQ.toast('Changes discarded.');
    });

    var allowLeave = false;
    $(window).on('beforeunload', function (e) {
        if (allowLeave || JSON.stringify(readAll()) === saved) return;
        e.preventDefault();
        e.originalEvent.returnValue = '';
    });

    /* ---------------------------------------------------------------
       Tương tác trong form
       --------------------------------------------------------------- */
    $form.on('input change', refresh);
    $('#yqDrTest').on('input change', function () { paintResults(readAll()); });
    $('#yqDrTAddLine').on('click', function () {
        var tpl = document.getElementById('yqDrTplLine');
        $(tpl.content.firstElementChild.cloneNode(true)).appendTo('#yqDrTLines').find('input').first().trigger('focus');
        paintResults(readAll());
    });
    $('#yqDrTLines').on('click', '[data-yq-line-remove]', function () {
        $(this).closest('.yq-drule__row').remove();
        paintResults(readAll());
    });

    $form.on('click', '[data-yq-add]', function () {
        var name = this.getAttribute('data-yq-add');
        var $scope = $(this).closest('[data-yq-scope]');
        var $list = $scope.find('[data-yq-list="' + name + '"]').filter(function () { return ownedBy(this, $scope[0]); });
        var $row = cloneRow($list);
        if ($row.is('details')) $row.prop('open', true);
        refresh();
        $row.find('input, select').first().trigger('focus');
    });
    $form.on('click', '[data-yq-remove]', function () {
        $(this).closest('[data-yq-scope]').remove();
        refresh();
    });
    $form.on('click', '[data-yq-move]', function () {
        var $r = $(this).closest('.yq-drule__rule');
        var up = this.getAttribute('data-yq-move') === '-1', btn = this;
        if (up) $r.prev().before($r); else $r.next().after($r);
        refresh();
        if (btn.disabled) $r.find('[data-yq-move="' + (up ? '1' : '-1') + '"]').trigger('focus'); else $(btn).trigger('focus');
    });

    /* Chép danh sách category từ phương thức khác, bấm Discard để huỷ */
    $form.on('change', '[data-yq-copyfrom]', function () {
        var from = this.value, $p = $(this).closest('[data-yq-panel]');
        this.value = '';
        if (!from) return;
        var rows = readScope(panel(from)).catRules;
        writeScope($p, { catRules: rows });
        refresh();
        YQ.toast(rows.length + (rows.length === 1 ? ' category' : ' categories') + ' copied from ' + NAMES[from] + '.');
    });

    /* Tạm dừng: tự mở lại sau mốc giờ, vẫn đi qua Save như mọi thay đổi khác */
    $form.on('click', '[data-yq-pause]', function () {
        var v = this.getAttribute('data-yq-pause'), d = new Date();
        if (v === 'today') d.setHours(23, 59, 0, 0); else d.setMinutes(d.getMinutes() + parseInt(v, 10));
        $(this).closest('[data-yq-panel]').find('[data-yq-f="pausedUntil"]').val(d.toISOString());
        refresh();
    });
    $form.on('click', '[data-yq-resume]', function () {
        $(this).closest('[data-yq-panel]').find('[data-yq-f="pausedUntil"]').val('');
        refresh();
    });

    /* Tab method + tab cột phải: phím mũi tên chuyển tab */
    $('[data-yq-method]').on('click', function () { goTo(this.getAttribute('data-yq-method')); });
    $('#yqDrNav').on('keydown', function (e) {
        var i = TABS.indexOf($(e.target).attr('data-yq-method'));
        if (i < 0 || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
        e.preventDefault();
        var next = TABS[(i + (e.key === 'ArrowDown' ? 1 : TABS.length - 1)) % TABS.length];
        goTo(next);
        $('[data-yq-method="' + next + '"]').trigger('focus');
    });
    $('[data-yq-side]').on('click', function () {
        var id = this.getAttribute('data-yq-side');
        $('[data-yq-side]').each(function () {
            var on = this.getAttribute('data-yq-side') === id;
            $(this).toggleClass('is-active', on).attr('aria-selected', on ? 'true' : 'false');
        });
        $('[data-yq-sidepane]').each(function () { this.hidden = this.getAttribute('data-yq-sidepane') !== id; });
    });

    $('[data-yq-copy]').on('click', function () {
        var text = $($(this).attr('data-yq-copy')).text();
        if (!navigator.clipboard) { YQ.toast('Copy is not available in this browser.'); return; }
        navigator.clipboard.writeText(text).then(function () { YQ.toast('Copied.'); }, function () { YQ.toast('Could not copy.'); });
    });

    /* File config: delivery_rules.json, cùng cấu trúc field delivery_rules, backend-templates/delivery_rules.php đọc file này */
    $('#yqDrExport').on('click', function () {
        var res = refresh(), errs = res.issues.filter(function (x) { return x.lvl === 'err'; });
        if (errs.length) { goTo(errs[0].key); YQ.toast('Fix the highlighted rules before downloading.'); return; }
        var url = URL.createObjectURL(new Blob([JSON.stringify(res.state, null, 2)], { type: 'application/json' }));
        var link = document.createElement('a');
        link.href = url;
        link.download = 'delivery_rules.json';
        link.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    $('#yqDrImport').on('change', function () {
        var input = this, file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
            var data = null;
            try { data = JSON.parse(reader.result); } catch (e) {}
            var valid = data && TABS.every(function (k) { return data[k] && typeof data[k] === 'object'; });
            input.value = '';
            if (!valid) { YQ.toast('This is not a delivery rules config file.'); return; }
            writeAll(data);
            refresh();
            YQ.toast('Config imported. Review it, then save.');
        };
        reader.readAsText(file);
    });

    /* [DEMO] xoá bản lưu trong trình duyệt, quay về dữ liệu mẫu trong HTML */
    $('#yqDrReset').on('click', function () {
        try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        allowLeave = true;
        window.location.reload();
    });

    /* ---------------------------------------------------------------
       Khởi động
       --------------------------------------------------------------- */
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    $('#yqDrTDate').val(isoDate(tomorrow));          // ngày mẫu trong HTML có thể đã qua

    saved = JSON.stringify(readAll());
    if (!$('#root').length) {                        // [DEMO] nạp bản đã lưu trong trình duyệt
        try {
            var stored = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
            if (stored && stored.rules) {
                writeAll(stored.rules);
                saved = JSON.stringify(readAll());
                log = stored.log || [];
                log.forEach(addLogRow);
            }
        } catch (e) {}
    }

    var first = YQ.param('method');
    goTo($.inArray(first, TABS) > -1 ? first : 'pickup');
    refresh();

    /* Phục vụ nối checkout sau này + kiểm thử */
    YQ.deliveryRules = { read: readAll, buildConfig: buildConfig, buildPhp: buildPhp, evaluate: evaluate };
});
