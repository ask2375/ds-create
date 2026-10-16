<?php
$works_id = get_the_ID();
$modal_id = "works-modal-" . $works_id;
$works_terms = works_detail_terms($works_id);
$thumbnail_id = get_post_thumbnail_id();
$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, "full") : "";
$recommended = works_search_recommended();
$is_recommended = has_term($recommended["slug"], $recommended["taxonomy"], $works_id);
?>

<li class="works__card works-card">
  <button type="button" class="works-card__btn" data-modal-open="<?php echo esc_attr($modal_id); ?>">
    <span class="works-card__img-wrapper">
      <?php if ($thumbnail_url): ?>
        <img class="works-card__img" src="<?php echo esc_url($thumbnail_url); ?>" alt="" width="384" height="240" loading="lazy" />
      <?php endif; ?>
      <?php if ($is_recommended): ?>
        <span class="works-card__badge"><?php echo esc_html($recommended["label"]); ?></span>
      <?php endif; ?>
    </span>
    <span class="works-card__body">
      <span class="works-card__title"><?php echo esc_html(get_the_title()); ?></span>
      <?php if ($works_terms["site"]): ?>
        <span class="works-card__list-items">
          <?php foreach ($works_terms["site"] as $works_genre): ?>
            <span class="works-card__list-item"><?php echo esc_html($works_genre); ?></span>
          <?php endforeach; ?>
        </span>
      <?php endif; ?>
    </span>
  </button>

  <?php get_template_part("template-parts/works/modal"); ?>
</li>
