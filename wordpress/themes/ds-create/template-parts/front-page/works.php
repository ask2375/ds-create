<?php
$pickup_args = [
  "post_type" => "works",
  "post_status" => "publish",
  "posts_per_page" => 3,
  "no_found_rows" => true,
  "tax_query" => [
    [
      "taxonomy" => "works_category",
      "field" => "slug",
      "terms" => works_search_recommended()["slug"],
    ],
  ],
  "meta_query" => [
    "relation" => "OR",
    "works_date_clause" => ["key" => "works_date", "compare" => "EXISTS"],
    ["key" => "works_date", "compare" => "NOT EXISTS"],
  ],
  "orderby" => ["works_date_clause" => "DESC", "date" => "DESC", "ID" => "DESC"],
];
$pickup_works = new WP_Query($pickup_args);
$pickup_posts = $pickup_works->posts;
if (count($pickup_posts) < 3) {
  $fill_args = $pickup_args;
  unset($fill_args["tax_query"]);
  $fill_args["posts_per_page"] = 3 - count($pickup_posts);
  $fill_args["post__not_in"] = wp_list_pluck($pickup_posts, "ID");
  $pickup_posts = array_merge($pickup_posts, (new WP_Query($fill_args))->posts);
}
?>
<section class="top-depth__chapter top-works js-depth-chapter" id="works" aria-labelledby="works-title">
  <div class="top-chapter">
    <?php get_template_part("template-parts/front-page/chapter-heading", null, ["id" => "works", "label" => "works", "title" => "制作実績", "lead" => "動きで魅せるサイトから企業サイトまで。制作の一部をご紹介します。"]); ?>
    <?php if ($pickup_posts): ?>
      <ul class="top-works__cards">
        <?php
        global $post;
        foreach ($pickup_posts as $post):
          setup_postdata($post); ?>
          <?php get_template_part("template-parts/front-page/works-card"); ?>
        <?php
        endforeach;
        wp_reset_postdata();
        ?>
      </ul>
    <?php else: ?>
      <p class="top-works__empty">制作実績は準備中です。</p>
    <?php endif; ?>
    <div class="top-chapter__btn-wrapper top-works__btn-wrapper">
      <a class="btn-chamfer" href="<?php echo esc_url(get_post_type_archive_link("works")); ?>"><span class="btn-chamfer__text">実績一覧を見る</span></a>
    </div>
  </div>
</section>
