<?php
$filters = works_search_filters();
$site_terms = works_search_filter_terms($filters["site"]["taxonomy"], $filters["site"]["group"]);
$top_works = new WP_Query([
  "post_type" => "works",
  "post_status" => "publish",
  "posts_per_page" => -1,
  "orderby" => ["date" => "DESC", "ID" => "DESC"],
  "no_found_rows" => true,
]);
?>
<section class="top-world__panel top-world__panel--works js-world-panel" id="works" aria-labelledby="works-title">
  <div class="top-panel__inner top-works" data-top-works>
    <h2 class="top-panel__title" id="works-title" tabindex="-1">制作実績</h2>
    <p class="top-panel__lead">「動き」で魅せるサイトから、「カチッ」とした企業サイトまで。</p>
    <?php if ($top_works->have_posts()): ?>
      <div class="top-works__party">
        <?php if ($site_terms): ?>
          <ul class="top-works__filter-items" aria-label="<?php echo esc_attr($filters["site"]["label"]); ?>">
            <li class="top-works__filter-item">
              <button class="top-works__filter-btn" type="button" data-top-works-filter="" aria-pressed="true" aria-controls="top-works-cards">
                <span class="top-works__filter-num">01 / all</span>
                <span class="top-works__filter-label">すべて</span>
              </button>
            </li>
            <?php foreach ($site_terms as $term_index => $term): ?>
              <li class="top-works__filter-item">
                <button class="top-works__filter-btn" type="button" data-top-works-filter="<?php echo esc_attr($term->slug); ?>" aria-pressed="false" aria-controls="top-works-cards">
                  <span class="top-works__filter-num"><?php echo esc_html(sprintf("%02d / %s", $term_index + 2, str_replace("-", " ", $term->slug))); ?></span>
                  <span class="top-works__filter-label"><?php echo esc_html($term->name); ?></span>
                </button>
              </li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
        <div class="top-works__deck">
          <ul class="top-works__cards" id="top-works-cards" data-top-works-cards>
            <?php
            while ($top_works->have_posts()):
              $top_works->the_post(); ?>
              <?php get_template_part("template-parts/front-page/works-card"); ?>
            <?php
            endwhile;
            wp_reset_postdata();
            ?>
          </ul>
          <nav class="top-works__pagination" aria-label="制作実績のページ切替">
            <ul class="top-works__page-items" data-top-works-pages></ul>
          </nav>
          <p class="sr-only" aria-live="polite" data-top-works-status></p>
        </div>
      </div>
    <?php else: ?>
      <p class="top-works__empty">制作実績は準備中です。</p>
    <?php endif; ?>
    <div class="top-panel__btn-wrapper">
      <a class="top-panel__btn" href="<?php echo esc_url(get_post_type_archive_link("works")); ?>">実績一覧を見る</a>
    </div>
  </div>
</section>
