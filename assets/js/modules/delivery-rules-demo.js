/* ==========================================================================
   Module JS: delivery-rules-demo — CHỈ DÙNG CHO DEMO, production xoá file này khỏi trang.
   Không có backend nên lưu rule + nhật ký vào localStorage. delivery-rules.js thấy
   YQ.deliveryRulesStore thì dùng object này thay cho POST form.
   ========================================================================== */
(function () {
    var STORE_KEY = 'yq_delivery_rules_v3';

    YQ.deliveryRulesStore = {
        load: function () {
            try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { return null; }
        },
        save: function (rules, log) {
            try { localStorage.setItem(STORE_KEY, JSON.stringify({ rules: rules, log: log })); } catch (e) {}
        },
        clear: function () {
            try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        }
    };
})();
