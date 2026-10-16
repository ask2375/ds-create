<?php
$recommended = works_search_recommended();
$search_args = works_search_args(true);
$search_active = works_search_active_args(true);
$search_changed = $search_active !== [$recommended["param"] => "1"];
$filters = works_search_filters();
$site_terms = works_search_filter_terms($filters["site"]["taxonomy"], $filters["site"]["group"]);
$animation_terms = works_search_filter_terms($filters["animation"]["taxonomy"], $filters["animation"]["group"]);
$animation_selected = $search_args["animation"];
$animation_label = $filters["animation"]["label"];
foreach ($animation_terms as $term) {
  if ($term->slug === $animation_selected) {
    $animation_label = $term->name;
  }
}
$top_works_query = [
  "post_type" => "works",
  "post_status" => "publish",
  "posts_per_page" => 10,
  "orderby" => ["date" => "DESC", "ID" => "DESC"],
  "tax_query" => works_search_tax_query($search_args),
];
if ($search_args["keyword"] !== "") {
  $top_works_query["works_search_custom"] = true;
  $top_works_query["works_search_keyword"] = $search_args["keyword"];
}
$top_works = new WP_Query($top_works_query);
$works_found = (int) $top_works->found_posts;
$works_total = (int) wp_count_posts("works")->publish;
$search_url = home_url("/") . "#works";
$form_id = "top-works-form";
$works_list_url = $search_changed ? add_query_arg($search_active, get_post_type_archive_link("works")) : get_post_type_archive_link("works");
?>
<section class="top-world__panel top-world__panel--works js-world-panel" id="works" aria-labelledby="works-title">
  <div class="top-panel__inner top-works">
    <h2 class="top-panel__title" id="works-title" tabindex="-1">制作実績</h2>
    <p class="top-panel__lead">「動き」で魅せるサイトから、「カチッ」とした企業サイトまで。</p>
    <div class="top-works__results js-works-ajax">
      <div class="top-works__screen">
        <form class="top-works__hud js-works-ajax-form" id="<?php echo esc_attr($form_id); ?>" action="<?php echo esc_url($search_url); ?>" method="get" role="search" aria-label="制作実績検索">
          <div class="top-works__hud-keyword">
            <input type="search" name="keyword" class="top-works__hud-input" placeholder="キーワードで検索" aria-label="キーワードで検索" value="<?php echo esc_attr($search_args["keyword"]); ?>" />
            <button type="submit" class="top-works__hud-search" aria-label="検索"></button>
          </div>
          <div class="top-works__hud-filters">
            <?php if ($animation_terms): ?>
              <div class="top-works__hud-filter js-works-filter">
                <button type="button" class="top-works__hud-filter-toggle js-works-filter-toggle" aria-expanded="false" aria-controls="top-works-filter-animation">
                  <span class="top-works__hud-filter-current js-works-filter-current"><?php echo esc_html($animation_label); ?></span>
                </button>
                <ul class="top-works__hud-filter-list-items js-works-filter-list" id="top-works-filter-animation" role="listbox" aria-label="<?php echo esc_attr($filters["animation"]["label"]); ?>">
                  <li class="top-works__hud-filter-list-item js-works-filter-item" role="option" tabindex="-1" data-value="" aria-selected="<?php echo "" === $animation_selected ? "true" : "false"; ?>"><?php echo esc_html(
  $filters["animation"]["label"],
); ?></li>
                  <?php foreach ($animation_terms as $term): ?>
                    <li class="top-works__hud-filter-list-item js-works-filter-item" role="option" tabindex="-1" data-value="<?php echo esc_attr($term->slug); ?>" aria-selected="<?php echo $animation_selected === $term->slug
  ? "true"
  : "false"; ?>"><?php echo esc_html($term->name); ?></li>
                  <?php endforeach; ?>
                </ul>
                <input type="hidden" name="animation" value="<?php echo esc_attr($animation_selected); ?>" class="js-works-filter-value" />
              </div>
            <?php endif; ?>
            <label class="top-works__hud-check">
              <input type="hidden" name="<?php echo esc_attr($recommended["param"]); ?>" value="0" />
              <input type="checkbox" name="<?php echo esc_attr($recommended["param"]); ?>" value="1" class="top-works__hud-check-input js-works-check" <?php checked($search_args[$recommended["param"]], "1"); ?> />
              <span class="top-works__hud-check-text"><?php echo esc_html($recommended["label"]); ?></span>
            </label>
            <?php if ($search_changed): ?>
              <a href="<?php echo esc_url($search_url); ?>" class="top-works__hud-reset js-works-ajax-link">条件をリセット</a>
            <?php endif; ?>
            <dl class="top-works__hud-stats">
              <div class="top-works__hud-stat">
                <dt class="top-works__hud-stat-label">該当</dt>
                <dd class="top-works__hud-stat-value"><?php echo esc_html($works_found); ?></dd>
              </div>
              <div class="top-works__hud-stat">
                <dt class="top-works__hud-stat-label">実績</dt>
                <dd class="top-works__hud-stat-value"><?php echo esc_html($works_total); ?></dd>
              </div>
            </dl>
          </div>
        </form>
        <div class="top-works__screen-body">
          <div class="top-works__side">
            <p class="top-works__screen-title">works</p>
            <?php if ($site_terms): ?>
              <ul class="top-works__tab-items" aria-label="<?php echo esc_attr($filters["site"]["label"]); ?>">
                <li class="top-works__tab-item">
                  <input type="radio" id="top-works-tab-all" name="site" value="" class="top-works__tab-input js-top-works-tab" form="<?php echo esc_attr($form_id); ?>" <?php checked($search_args["site"], ""); ?> />
                  <label class="top-works__tab-label" for="top-works-tab-all">すべて</label>
                </li>
                <?php foreach ($site_terms as $term): ?>
                  <li class="top-works__tab-item">
                    <input type="radio" id="top-works-tab-<?php echo esc_attr($term->slug); ?>" name="site" value="<?php echo esc_attr($term->slug); ?>" class="top-works__tab-input js-top-works-tab" form="<?php echo esc_attr(
  $form_id,
); ?>" <?php checked($search_args["site"], $term->slug); ?> />
                    <label class="top-works__tab-label" for="top-works-tab-<?php echo esc_attr($term->slug); ?>"><?php echo esc_html($term->name); ?></label>
                  </li>
                <?php endforeach; ?>
              </ul>
            <?php endif; ?>
            <div class="top-works__badge">
              <span class="top-works__badge-label">実績数</span>
              <span class="top-works__badge-value"><?php echo esc_html($works_total); ?></span>
            </div>
          </div>
          <?php if ($top_works->have_posts()): ?>
            <div class="top-works__slider-wrapper">
              <div class="top-works__slider swiper js-swiper" role="region" aria-label="制作実績スライダー">
                <ul class="top-works__slide-items swiper-wrapper">
                  <?php
                  while ($top_works->have_posts()):
                    $top_works->the_post(); ?>
                    <?php get_template_part("template-parts/front-page/works-card", null, ["index" => $top_works->current_post + 1]); ?>
                  <?php
                  endwhile;
                  wp_reset_postdata();
                  ?>
                </ul>
              </div>
              <button type="button" class="swiper-button-prev" aria-label="前のスライドへ"></button>
              <button type="button" class="swiper-button-next" aria-label="次のスライドへ"></button>
              <div class="top-works__pagination js-swiper-pagination"></div>
            </div>
          <?php else: ?>
            <p class="top-works__empty">条件に一致する制作実績は見つかりませんでした。</p>
          <?php endif; ?>
        </div>
      </div>
      <div class="top-panel__btn-wrapper">
        <a class="top-panel__btn" href="<?php echo esc_url($works_list_url); ?>">実績一覧を見る</a>
      </div>
    </div>
  </div>
</section>
