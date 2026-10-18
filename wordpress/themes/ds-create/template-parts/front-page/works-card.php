<?php
$works_id = get_the_ID();
$modal_id = "works-modal-" . $works_id;
$title_id = "top-works-title-" . $works_id;
$works_genres = works_detail_terms($works_id)["site"];
$thumbnail_id = get_post_thumbnail_id();
?>
<li class="top-works__card">
  <?php if ($works_genres): ?>
    <p class="top-works__card-category"><?php echo esc_html($works_genres[0]); ?></p>
  <?php endif; ?>
  <div class="top-works__card-body">
    <div class="top-works__card-img-wrapper">
      <?php if ($thumbnail_id): ?>
        <?php echo wp_get_attachment_image($thumbnail_id, "large", false, ["class" => "top-works__card-img", "alt" => get_the_title() . "の制作画面", "loading" => "lazy"]); ?>
      <?php endif; ?>
    </div>
    <div class="top-works__card-caption">
      <h3 class="top-works__card-title" id="<?php echo esc_attr($title_id); ?>"><?php echo esc_html(get_the_title()); ?></h3>
      <button class="top-works__card-btn" type="button" data-modal-open="<?php echo esc_attr($modal_id); ?>" aria-labelledby="<?php echo esc_attr($title_id); ?>"></button>
    </div>
  </div>
  <?php get_template_part("template-parts/works/modal"); ?>
</li>
