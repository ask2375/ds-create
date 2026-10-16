<?php
$works_id = get_the_ID();
$modal_id = "works-modal-" . $works_id;
$card_index = (int) ($args["index"] ?? 0);
$works_date = get_field("works_date");
$works_date_obj = $works_date ? DateTime::createFromFormat("Ymd", $works_date) : false;
$works_terms = works_detail_terms($works_id);
$thumbnail_id = get_post_thumbnail_id();
$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url($thumbnail_id, "full") : "";
$recommended = works_search_recommended();
$is_recommended = has_term($recommended["slug"], $recommended["taxonomy"], $works_id);
?>

<li class="swiper-slide top-works__slide-item">
  <button type="button" class="top-works-card" data-modal-open="<?php echo esc_attr($modal_id); ?>">
    <?php if ($thumbnail_url): ?>
      <img class="top-works-card__img" src="<?php echo esc_url($thumbnail_url); ?>" alt="" width="160" height="400" loading="lazy" />
    <?php endif; ?>
    <span class="top-works-card__num" aria-hidden="true"><?php echo esc_html(sprintf("%02d", $card_index)); ?></span>
    <?php if ($is_recommended): ?>
      <span class="top-works-card__badge"><?php echo esc_html($recommended["label"]); ?></span>
    <?php endif; ?>
    <span class="top-works-card__info">
      <?php if ($works_date_obj): ?>
        <span class="top-works-card__level">Lv.<span class="top-works-card__level-value"><?php echo esc_html($works_date_obj->format("Y")); ?></span></span>
      <?php endif; ?>
      <span class="top-works-card__name"><?php echo esc_html(get_the_title()); ?></span>
      <span class="top-works-card__stats">
        <?php if ($works_terms["site"]): ?>
          <span class="top-works-card__stat">
            <span class="top-works-card__stat-label">genre</span>
            <span class="top-works-card__stat-value"><?php echo esc_html(implode(" / ", $works_terms["site"])); ?></span>
          </span>
        <?php endif; ?>
        <?php if ($works_date_obj): ?>
          <span class="top-works-card__stat">
            <span class="top-works-card__stat-label">date</span>
            <span class="top-works-card__stat-value"><time datetime="<?php echo esc_attr($works_date_obj->format("Y-m")); ?>"><?php echo esc_html($works_date_obj->format("Y.m")); ?></time></span>
          </span>
        <?php endif; ?>
      </span>
    </span>
  </button>

  <?php get_template_part("template-parts/works/modal"); ?>
</li>
