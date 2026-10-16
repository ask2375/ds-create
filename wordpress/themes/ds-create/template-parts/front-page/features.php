<?php
$features = [
  ["no" => "01", "icon" => "play", "label" => "motion", "title" => "デザインの魅力を引き出すアニメーション", "text" => "テレビアニメ・ゲーム・VTuberなどの公式サイトで培った演出力で、デザインの魅力を120%まで引き出します。"],
  ["no" => "02", "icon" => "bolt", "label" => "quality", "title" => "AI活用で、納品スピードと品質を両立", "text" => "コーディングにAIを導入し、定型作業を効率化。空いた時間を検証と調整に注ぎ、短納期でも品質を落としません。"],
  ["no" => "03", "icon" => "grid", "label" => "teamwork", "title" => "チーム体制でワンストップ対応", "text" => "デザイナーの制作パートナー様と組み、ディレクション・デザイン・コーディングまでまとめてお任せいただけます。"],
  ["no" => "04", "icon" => "star", "label" => "management", "title" => "電気エンジニア9年で培った進行管理力", "text" => "段取り・関係者との連携・期日厳守。前職で身につけた仕事の進め方で、安心してお任せいただける進行をお約束します。"],
];
?>
<section class="top-world__panel top-world__panel--features js-world-panel" id="features" aria-labelledby="features-title" data-col="1" data-row="3">
  <div class="top-panel__inner top-features">
    <h2 class="top-panel__title js-world-title" id="features-title" tabindex="-1">特徴・強み</h2>
    <p class="top-panel__lead">「動き」と「確かさ」を両立できる理由があります。</p>
    <ol class="top-features__items">
      <?php foreach ($features as $feature): ?>
        <li class="top-features__item">
          <div class="top-features__emblem" data-icon="<?php echo esc_attr($feature["icon"]); ?>"><span class="top-features__emblem-number"><?php echo esc_html($feature["no"]); ?></span></div>
          <p class="top-features__label"><?php echo esc_html($feature["label"]); ?></p>
          <div class="top-features__body">
            <h3 class="top-features__title"><?php echo esc_html($feature["title"]); ?></h3>
            <p class="top-features__text"><?php echo esc_html($feature["text"]); ?></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ol>
  </div>
</section>
