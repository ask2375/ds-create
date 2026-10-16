<?php
$recommended = works_search_recommended();
$search_args = works_search_args(true);
$search_active = works_search_active_args(true);
$search_changed = $search_active !== [$recommended["param"] => "1"];
$top_works_query = [
  "post_type" => "works",
  "post_status" => "publish",
  "posts_per_page" => 3,
  "no_found_rows" => true,
  "orderby" => ["date" => "DESC", "ID" => "DESC"],
  "tax_query" => works_search_tax_query($search_args),
];
if ($search_args["keyword"] !== "") {
  $top_works_query["works_search_custom"] = true;
  $top_works_query["works_search_keyword"] = $search_args["keyword"];
}
$top_works = new WP_Query($top_works_query);
$works_list_url = $search_changed ? add_query_arg($search_active, get_post_type_archive_link("works")) : get_post_type_archive_link("works");
?>
<section class="top-world__panel top-world__panel--works js-world-panel" id="works" aria-labelledby="works-title" data-col="1" data-row="0">
  <div class="top-panel__inner top-works">
    <h2 class="top-panel__title js-world-title" id="works-title" tabindex="-1">制作実績</h2>
    <p class="top-panel__lead">「動き」で魅せるサイトから、「カチッ」とした企業サイトまで。</p>
    <div class="top-works__results js-works-ajax">
      <div class="top-works__search">
        <?php get_template_part("template-parts/works/search-form", null, ["action" => home_url("/") . "#works", "recommended_default" => true]); ?>
      </div>
      <?php if ($top_works->have_posts()): ?>
      <ul class="works__cards">
        <?php while ($top_works->have_posts()):
          $top_works->the_post(); ?>
          <?php get_template_part("template-parts/works/card"); ?>
        <?php endwhile;
        wp_reset_postdata(); ?>
      </ul>
      <?php else: ?>
      <p class="top-works__empty">条件に一致する制作実績は見つかりませんでした。</p>
      <?php endif; ?>
      <div class="top-panel__btn-wrapper">
        <a class="top-panel__btn" href="<?php echo esc_url($works_list_url); ?>">実績一覧を見る</a>
      </div>
    </div>
  </div>
  <?php get_template_part("template-parts/front-page/panel-footer"); ?>
</section>
