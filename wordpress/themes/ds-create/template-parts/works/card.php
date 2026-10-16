<?php
$works_id = get_the_ID();
$modal_id = "works-modal-" . $works_id;
$works_url = get_field("works_url");
$works_date = get_field("works_date");
$works_date_obj = $works_date ? DateTime::createFromFormat("Ymd", $works_date) : false;
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

  <dialog id="<?php echo esc_attr($modal_id); ?>" class="works-card__modal modal" aria-labelledby="<?php echo esc_attr($modal_id . "-title"); ?>" autofocus>
    <div class="modal__container works-card__modal-container">
      <div class="works-detail">
        <div class="works-detail__img-wrapper">
          <?php if ($thumbnail_url): ?>
            <img class="works-detail__img" src="<?php echo esc_url($thumbnail_url); ?>" alt="<?php echo esc_attr(get_the_title()); ?>" width="760" height="475" loading="lazy" />
          <?php endif; ?>
        </div>
        <div class="works-detail__body">
          <h2 class="works-detail__title" id="<?php echo esc_attr($modal_id . "-title"); ?>"><?php echo esc_html(get_the_title()); ?></h2>
          <dl class="works-detail__meta">
            <?php foreach (works_detail_rows() as $row_key => $row_label): ?>
              <?php if ($works_terms[$row_key]): ?>
                <div class="works-detail__meta-row">
                  <dt class="works-detail__meta-term"><?php echo esc_html($row_label); ?></dt>
                  <dd class="works-detail__meta-desc">
                    <ul class="works-detail__list-items">
                      <?php foreach ($works_terms[$row_key] as $works_term): ?>
                        <li class="works-detail__list-item"><?php echo esc_html($works_term); ?></li>
                      <?php endforeach; ?>
                    </ul>
                  </dd>
                </div>
              <?php endif; ?>
            <?php endforeach; ?>
            <?php if ($works_date_obj): ?>
              <div class="works-detail__meta-row">
                <dt class="works-detail__meta-term">制作時期</dt>
                <dd class="works-detail__meta-desc"><time datetime="<?php echo esc_attr($works_date_obj->format("Y-m")); ?>"><?php echo esc_html($works_date_obj->format("Y年n月")); ?></time></dd>
              </div>
            <?php endif; ?>
            <?php if ($works_terms["build"]): ?>
              <div class="works-detail__meta-row">
                <dt class="works-detail__meta-term">構築</dt>
                <dd class="works-detail__meta-desc"><?php echo esc_html(implode("、", $works_terms["build"])); ?></dd>
              </div>
            <?php endif; ?>
            <?php if ($works_url): ?>
              <div class="works-detail__meta-row">
                <dt class="works-detail__meta-term">URL</dt>
                <dd class="works-detail__meta-desc"><a class="works-detail__link" href="<?php echo esc_url($works_url); ?>" target="_blank" rel="noopener"><?php echo esc_html($works_url); ?></a></dd>
              </div>
            <?php endif; ?>
          </dl>
        </div>
      </div>
    </div>
    <button class="modal__close" type="button" aria-labelledby="<?php echo esc_attr($modal_id . "-close"); ?>" data-modal-close>
      <span id="<?php echo esc_attr($modal_id . "-close"); ?>" hidden>モーダルを閉じる</span>
    </button>
  </dialog>
</li>
