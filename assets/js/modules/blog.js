/* ==========================================================================
   The Journal (blog) — dùng chung demo + production (an toàn với template engine:
   chỉ dùng jQuery, không biến đô-la, không mở + đóng ngoặc nhọn trên cùng một dòng).

   1. Danh sách (blog.html / blog-production.html): lọc danh mục tại chỗ khi lưới có data-yq-blog-demo,
      URL đổi theo href của chip (?cat=). Mở trang với ?cat= thì lọc sẵn.
   2. Bài viết (blog-post.html): nút copy link (data-yq-copy).
   ========================================================================== */
(function (jq) {
  'use strict';

  /* ---------- 1. Lọc danh mục (demo) ---------- */
  function setupDemoFilter() {
    var grid = jq('[data-yq-blog-demo]');
    if (!grid.length) {
      return;
    }
    var chips = jq('#yqBlogCats [data-cat]');
    var countEl = jq('#yqBlogCount');
    var emptyEl = jq('#yqBlogEmpty');
    var pager = jq('#yqBlogPager');

    function apply(cat) {
      var shown = 0;
      grid.children('[data-blog-cat]').each(function () {
        var item = jq(this);
        var cats = String(item.attr('data-blog-cat')).split(' ');
        var ok = cat === 'all' || cats.indexOf(cat) > -1;
        item.toggleClass('d-none', !ok);
        if (ok && !item.is('[data-blog-promo]')) {
          shown += 1;
        }
      });
      chips.each(function () {
        var on = jq(this).attr('data-cat') === cat;
        jq(this).toggleClass('is-active', on).attr('aria-current', on ? 'page' : null);
      });
      countEl.text(shown + (shown === 1 ? ' story' : ' stories'));
      emptyEl.toggleClass('d-none', shown > 0);
      pager.toggleClass('d-none', cat !== 'all');
      grid.find('.yq-reveal').addClass('is-in');
    }

    chips.on('click', function (e) {
      e.preventDefault();
      apply(jq(this).attr('data-cat'));
      if (window.history && history.replaceState) {
        history.replaceState(null, '', jq(this).attr('href'));
      }
    });

    var m = /[?&]cat=([^&#]+)/.exec(location.search);
    var start = m ? decodeURIComponent(m[1]) : 'all';
    if (!chips.filter('[data-cat="' + start + '"]').length) {
      start = 'all';
    }
    apply(start);
  }

  /* ---------- 2. Copy link ---------- */
  function setupCopy() {
    jq(document).on('click', '[data-yq-copy]', function () {
      var btn = jq(this);
      var url = btn.attr('data-yq-copy') || location.href;
      function done() {
        btn.addClass('is-done').attr('aria-label', 'Link copied');
        setTimeout(function () {
          btn.removeClass('is-done').attr('aria-label', 'Copy link');
        }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () {
          window.prompt('Copy this link', url);
        });
      } else {
        window.prompt('Copy this link', url);
      }
    });
  }

  jq(function () {
    setupDemoFilter();
    setupCopy();
  });
})(jQuery);
