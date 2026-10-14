<?php
$recommended = works_search_recommended();
$search_args = works_search_args();
$search_active = works_search_active_args();
$top_works_query = [
  "post_type" => "works",
  "post_status" => "publish",
  "posts_per_page" => 3,
  "no_found_rows" => true,
  "orderby" => ["date" => "DESC", "ID" => "DESC"],
  "tax_query" => [
    [
      "taxonomy" => $recommended["taxonomy"],
      "field" => "slug",
      "terms" => $recommended["slug"],
    ],
  ],
];
if ($search_active) {
  $top_works_query["posts_per_page"] = 9;
  $top_works_query["tax_query"] = works_search_tax_query($search_args);
  if ($search_args["keyword"] !== "") {
    $top_works_query["works_search_custom"] = true;
    $top_works_query["works_search_keyword"] = $search_args["keyword"];
  }
}
$top_works = new WP_Query($top_works_query);
$works_list_url = add_query_arg($search_active, get_post_type_archive_link("works"));
?>
<section class="top-world__panel top-world__panel--works js-world-panel" id="works" aria-labelledby="works-title" data-col="1" data-row="0">
  <div class="top-panel__inner top-works">
    <p class="top-panel__kicker"><span class="top-panel__kicker-label" data-icon="grid">works</span><span class="top-panel__kicker-number">03</span></p>
    <h2 class="top-panel__title js-world-title" id="works-title" tabindex="-1">制作実績</h2>
    <p class="top-panel__lead">「動き」で魅せるサイトから、「カチッ」とした企業サイトまで。</p>
    <div class="js-works-ajax">
      <div class="top-works__search">
        <?php get_template_part("template-parts/works/search-form", null, ["action" => home_url("/") . "#works"]); ?>
      </div>
      <?php if ($top_works->have_posts()): ?>
      <ul class="top-works__cards">
        <?php while ($top_works->have_posts()):
          $top_works->the_post();
          $work_genres = works_detail_terms(get_the_ID())["site"];
          $thumbnail_id = get_post_thumbnail_id();
          ?>
          <li class="top-works__card">
            <div class="top-works__thumbnail">
              <span class="top-works__index"><?php echo esc_html(sprintf("%02d", $top_works->current_post + 1)); ?></span>
              <div class="top-works__frame">
                <?php if ($thumbnail_id): ?>
                  <?php echo wp_get_attachment_image($thumbnail_id, "large", false, ["class" => "top-works__img", "alt" => "", "loading" => "lazy"]); ?>
                <?php endif; ?>
              </div>
            </div>
            <div class="top-works__body">
              <h3 class="top-works__title"><?php echo esc_html(get_the_title()); ?></h3>
              <?php if ($work_genres): ?>
                <p class="top-works__text"><?php echo esc_html(implode("・", $work_genres)); ?></p>
              <?php endif; ?>
            </div>
          </li>
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
