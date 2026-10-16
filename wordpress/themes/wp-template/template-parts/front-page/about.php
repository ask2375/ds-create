<?php
$profile_rows = [
  ["term" => "屋号", "desc" => "ディエス・クリエイト"],
  ["term" => "在住", "desc" => "兵庫県尼崎市"],
  ["term" => "対応領域", "desc" => "ディレクション・コーディング"],
  ["term" => "趣味", "desc" => "釣り、ドライブ"],
];
?>
<section class="top-world__panel top-world__panel--about js-world-panel" id="about" aria-labelledby="about-title" data-col="2" data-row="1">
  <div class="top-panel__inner top-about">
    <h2 class="top-panel__title js-world-title" id="about-title" tabindex="-1">自己紹介</h2>
    <div class="top-about__split">
      <div class="top-about__img-wrapper">
        <div class="top-about__img">
          <span class="top-about__img-code">d:s create / profile</span>
          <span class="top-about__monogram" aria-hidden="true">ds</span>
          <span class="top-about__img-label">プロフィール写真</span>
        </div>
        <div class="top-about__caption">
          <span class="top-about__caption-role">director / coder</span>
          <span class="top-about__caption-name">satoshi doi</span>
        </div>
      </div>
      <div class="top-about__text">
        <p class="top-about__eyebrow">director / coder</p>
        <h3 class="top-about__name">土居 諭<span class="top-about__name-kana">どい さとし</span></h3>
        <p class="top-about__lead">電気エンジニアとして9年間勤務した後、Web制作の道へ。2023年からディレクター兼コーダーとして、アニメ・ゲーム・企業サイトなど幅広い案件に携わっています。</p>
        <dl class="top-about__profile">
          <?php foreach ($profile_rows as $row): ?>
            <dt class="top-about__profile-term"><?php echo esc_html($row["term"]); ?></dt>
            <dd class="top-about__profile-desc"><?php echo esc_html($row["desc"]); ?></dd>
          <?php endforeach; ?>
        </dl>
        <div class="top-panel__btn-wrapper top-about__btn-wrapper">
          <button type="button" class="top-panel__btn js-dialog-open" data-dialog="about-detail">詳しく見る</button>
        </div>
      </div>
    </div>
  </div>
  <?php get_template_part("template-parts/front-page/panel-footer"); ?>
</section>
