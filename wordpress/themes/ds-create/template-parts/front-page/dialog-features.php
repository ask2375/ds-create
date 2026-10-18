<?php
$feature_details = [
  ["no" => "01", "title" => "デザインの魅力を引き出すアニメーション", "text" => "テレビアニメ・ゲーム・VTuberなどの公式サイトで培った演出力で、デザインの魅力を120%まで引き出します。"],
  ["no" => "02", "title" => "AI活用で、納品スピードと品質を両立", "text" => "コーディングにAIを導入し、定型作業を効率化。空いた時間を検証と調整に注ぎ、短納期でも品質を落としません。"],
  ["no" => "03", "title" => "チーム体制でワンストップ対応", "text" => "デザイナーの制作パートナー様と組み、ディレクション・デザイン・コーディングまでまとめてお任せいただけます。"],
  ["no" => "04", "title" => "電気エンジニア9年で培った進行管理力", "text" => "段取り・関係者との連携・期日厳守。前職で身につけた仕事の進め方で、安心してお任せいただける進行をお約束します。"],
]; ?>
<dialog class="top-dialog" id="features-detail" aria-labelledby="features-detail-title">
  <div class="top-dialog__header">
    <div class="top-dialog__heading">
      <p class="top-dialog__eyebrow">features</p>
      <h2 class="top-dialog__title" id="features-detail-title">特徴・強み</h2>
    </div>
    <form class="top-dialog__close-form" method="dialog"><button class="top-dialog__close" aria-label="特徴・強みの詳細を閉じる" autofocus></button></form>
  </div>
  <div class="top-dialog__body js-dialog-body">
    <p class="top-dialog__intro">「動き」と「確かさ」を両立できる理由があります。</p>
    <ol class="top-dialog__cards">
      <?php foreach ($feature_details as $feature): ?>
        <li class="top-dialog__card">
          <span class="top-dialog__service-number" aria-hidden="true"><?php echo esc_html($feature["no"]); ?></span>
          <div class="top-dialog__service-body">
            <h3 class="top-dialog__service-title"><?php echo esc_html($feature["title"]); ?></h3>
            <p class="top-dialog__service-text"><?php echo esc_html($feature["text"]); ?></p>
          </div>
        </li>
      <?php endforeach; ?>
    </ol>
  </div>
  <form class="top-dialog__footer" method="dialog"><button class="top-dialog__btn top-dialog__btn--light">閉じる</button></form>
</dialog>
