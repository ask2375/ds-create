<?php
$about_profile_rows = [
  ["term" => "屋号", "desc" => "ディエス・クリエイト"],
  ["term" => "名前", "desc" => "土居 諭（どい さとし）"],
  ["term" => "在住", "desc" => "兵庫県尼崎市"],
];
$about_history = [
  ["date" => "2012.04 — 2021.03", "title" => "電気エンジニアとして9年間勤務", "text" => "電気（パワーエレクトロニクス）分野で、設備の点検・据付・トラブル対応・開発試験・品質管理を経験しました。"],
  ["date" => "2021.04 — 2022.12", "title" => "コーディングとデザインを学習", "text" => "実務で活躍するフリーランスの方から直接指導を受け、Web制作を学びました。"],
  ["date" => "2023.01 — 現在", "title" => "ディレクター兼コーダーとして活動", "text" => "アニメ・ゲーム・VTuber・企業サイトなど、幅広い分野のWeb制作に携わっています。"],
];
?>
<dialog class="top-dialog" id="about-detail" aria-labelledby="about-detail-title">
  <div class="top-dialog__header">
    <div class="top-dialog__heading">
      <p class="top-dialog__eyebrow">about</p>
      <h2 class="top-dialog__title" id="about-detail-title">土居 諭について</h2>
    </div>
    <form class="top-dialog__close-form" method="dialog"><button class="top-dialog__close" aria-label="プロフィールの詳細を閉じる" autofocus></button></form>
  </div>
  <div class="top-dialog__body js-dialog-body">
    <p class="top-dialog__intro">個人事業主として、Web制作のディレクションとコーディングを中心に活動しています。</p>
    <dl class="top-dialog__profile">
      <?php foreach ($about_profile_rows as $row): ?>
        <div class="top-dialog__profile-row">
          <dt class="top-dialog__profile-term"><?php echo esc_html($row["term"]); ?></dt>
          <dd class="top-dialog__profile-desc"><?php echo esc_html($row["desc"]); ?></dd>
        </div>
      <?php endforeach; ?>
      <div class="top-dialog__profile-row">
        <dt class="top-dialog__profile-term">対応領域</dt>
        <dd class="top-dialog__profile-desc">ディレクション・コーディング<br><small class="top-dialog__profile-note">デザインは制作パートナー様と連携して対応します。</small></dd>
      </div>
      <div class="top-dialog__profile-row">
        <dt class="top-dialog__profile-term">趣味</dt>
        <dd class="top-dialog__profile-desc">釣り、ドライブ</dd>
      </div>
    </dl>
    <h3 class="top-dialog__subheading">これまでの歩み</h3>
    <ol class="top-dialog__list-items">
      <?php foreach ($about_history as $history): ?>
        <li class="top-dialog__list-item">
          <p class="top-dialog__history-date"><?php echo esc_html($history["date"]); ?></p>
          <h4 class="top-dialog__history-title"><?php echo esc_html($history["title"]); ?></h4>
          <p class="top-dialog__history-text"><?php echo esc_html($history["text"]); ?></p>
        </li>
      <?php endforeach; ?>
    </ol>
    <p class="top-dialog__note">前職で培った段取りと関係者との連携を、Web制作の進行管理にも活かしています。</p>
  </div>
  <form class="top-dialog__footer" method="dialog"><button class="top-dialog__btn top-dialog__btn--light">閉じる</button></form>
</dialog>
