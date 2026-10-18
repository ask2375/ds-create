<?php
$features = [
  ["icon" => "motion", "title" => "世界観に合うアニメーション", "text" => "デザインの意図や空気感を汲み取り、印象に残る演出へ。"],
  ["icon" => "cursor", "title" => "使いやすさを支える動き", "text" => "視線の流れや操作の心地よさまで考えて設計します。"],
  ["icon" => "team", "title" => "柔軟な制作体制", "text" => "短納期や複数案件も、チームと連携して対応します。"],
]; ?>
<section class="top-depth__chapter top-features js-depth-chapter" id="features" aria-labelledby="features-title">
  <div class="top-chapter">
    <?php get_template_part("template-parts/front-page/chapter-heading", null, ["id" => "features", "label" => "features", "title" => "特徴・強み", "lead" => "デザインの世界観を大切に、そのサイトらしい「動き」をご提案・実装します。"]); ?>
    <ul class="top-features__items">
      <?php foreach ($features as $feature): ?>
        <li class="top-features__item glass-card">
          <div class="glass-card__icon" data-icon="<?php echo esc_attr($feature["icon"]); ?>" aria-hidden="true"></div>
          <div class="glass-card__body">
            <h3 class="glass-card__title"><?php echo esc_html($feature["title"]); ?></h3>
            <p class="glass-card__text"><?php echo esc_html($feature["text"]); ?></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ul>
    <div class="top-chapter__btn-wrapper top-features__btn-wrapper">
      <button type="button" class="btn-chamfer js-dialog-open" data-dialog="features-detail"><span class="btn-chamfer__text">強み・制作方針を見る</span></button>
    </div>
  </div>
</section>
