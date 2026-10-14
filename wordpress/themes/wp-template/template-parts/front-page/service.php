<?php
$services = [
  ["no" => "01", "eyebrow" => "direction", "title" => "ディレクション", "text" => "ヒアリング・要件定義、サイト構成設計、ワイヤーフレーム作成、スケジュール管理、制作チーム間の調整まで、プロジェクト全体を進行します。", "tags" => ["ヒアリング", "構成設計", "進行管理"]],
  ["no" => "02", "eyebrow" => "design", "title" => "デザイン", "text" => "デザイナーの制作パートナー様が担当。ブランドや目的に合ったデザインをご提案します。", "tags" => ["パートナー連携", "Webデザイン"]],
  ["no" => "03", "eyebrow" => "coding", "title" => "コーディング", "text" => "複雑なデザインの構築から、魅せるアニメーションの実装まで。AIを取り入れ、スピードと品質を両立します。", "tags" => ["アニメーション", "実装・検証"]],
];
?>
<section class="top-world__panel top-world__panel--service js-world-panel" id="service" aria-labelledby="service-title" data-col="1" data-row="2">
  <div class="top-panel__inner top-service">
    <p class="top-panel__kicker"><span class="top-panel__kicker-label" data-icon="code">service</span><span class="top-panel__kicker-number">02</span></p>
    <h2 class="top-panel__title js-world-title" id="service-title" tabindex="-1">お役に立てること</h2>
    <p class="top-panel__lead">企画からリリースまで、Webサイト制作に必要な3つの領域をカバーします。</p>
    <ul class="top-service__cards">
      <?php foreach ($services as $index => $service): ?>
        <li class="top-service__card">
          <div class="top-service__visual top-service__visual--<?php echo esc_attr($index + 1); ?>"><span class="top-service__step"><?php echo esc_html($service["no"]); ?></span></div>
          <div class="top-service__body">
            <p class="top-service__eyebrow"><?php echo esc_html($service["eyebrow"]); ?></p>
            <h3 class="top-service__title"><?php echo esc_html($service["title"]); ?></h3>
            <p class="top-service__text"><?php echo esc_html($service["text"]); ?></p>
            <ul class="top-service__list-items">
              <?php foreach ($service["tags"] as $tag): ?>
                <li class="top-service__list-item"><?php echo esc_html($tag); ?></li>
              <?php endforeach; ?>
            </ul>
          </div>
        </li>
      <?php endforeach; ?>
    </ul>
    <div class="top-panel__btn-wrapper">
      <button type="button" class="top-panel__btn js-dialog-open" data-dialog="service-detail">詳しく見る</button>
    </div>
  </div>
  <?php get_template_part("template-parts/front-page/panel-footer"); ?>
</section>
