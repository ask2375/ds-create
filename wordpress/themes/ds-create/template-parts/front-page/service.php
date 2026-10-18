<?php
$services = [
  ["icon" => "chat", "title" => "提案前の技術相談", "text" => "実装可否や演出、スケジュールを一緒に整理します。"],
  ["icon" => "layers", "title" => "デザインからの制作", "text" => "デザイナーと連携し、見た目から実装までまとめて対応します。"],
  ["icon" => "window", "title" => "コーディング・<wbr><span class=\"top-service__title-unit\">WordPress構築</span>", "text" => "運用しやすさまで考え、公開に向けて仕上げます。"],
]; ?>
<section class="top-depth__chapter top-service js-depth-chapter" id="service" aria-labelledby="service-title">
  <div class="top-chapter">
    <?php get_template_part("template-parts/front-page/chapter-heading", null, ["id" => "service", "label" => "service", "title" => "お役に立てること", "lead" => "提案段階から納品まで、必要なところからご相談いただけます。"]); ?>
    <ul class="top-service__items">
      <?php foreach ($services as $service): ?>
        <li class="top-service__item glass-card">
          <div class="glass-card__icon" data-icon="<?php echo esc_attr($service["icon"]); ?>" aria-hidden="true"></div>
          <div class="glass-card__body">
            <h3 class="glass-card__title"><?php echo wp_kses($service["title"], ["wbr" => [], "span" => ["class" => true]]); ?></h3>
            <p class="glass-card__text"><?php echo esc_html($service["text"]); ?></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ul>
    <div class="top-chapter__btn-wrapper top-service__btn-wrapper">
      <button type="button" class="btn-chamfer js-dialog-open" data-dialog="service-detail"><span class="btn-chamfer__text">対応内容・制作の流れを見る</span></button>
    </div>
  </div>
</section>
