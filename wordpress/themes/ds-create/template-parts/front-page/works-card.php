<?php
$works_id = get_the_ID();
$modal_id = "works-modal-" . $works_id;
$thumbnail_id = get_post_thumbnail_id();
$card_genres = [];
$card_terms = get_the_terms($works_id, "works_category");
if (is_array($card_terms)) {
  foreach ($card_terms as $card_term) {
    if ("site" === works_search_term_group($card_term)) {
      $card_genres[] = $card_term->slug;
    }
  }
}
?>
<li class="top-works__card" data-top-works-card data-genres="<?php echo esc_attr(implode(" ", $card_genres)); ?>">
  <button class="top-works__card-btn" type="button" data-modal-open="<?php echo esc_attr($modal_id); ?>">
    <span class="top-works__card-img-wrapper">
      <?php if ($thumbnail_id): ?>
        <?php echo wp_get_attachment_image($thumbnail_id, "large", false, ["class" => "top-works__card-img", "alt" => "", "loading" => "lazy"]); ?>
      <?php endif; ?>
    </span>
    <span class="top-works__card-title"><?php echo esc_html(get_the_title()); ?></span>
  </button>
  <?php get_template_part("template-parts/works/modal"); ?>
</li>
