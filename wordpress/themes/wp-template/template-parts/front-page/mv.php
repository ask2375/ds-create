<?php
$mv_flow_rows = [
  ["dir" => "left", "words" => [["solid", "web creative"], ["round", "あそびゴコロ。"], ["italic", "Make it playful."]]],
  ["dir" => "right", "words" => [["round", "心おどる仕掛けを。"], ["mono", "direction + design + coding"], ["italic", "Ideas into websites."]]],
  ["dir" => "left", "words" => [["outline", "creative"], ["round", "ワクワクを、かたちに。"], ["outline", "d:s create"]]],
  ["dir" => "right", "words" => [["mono", "design × motion"], ["italic", "Made with care."], ["round", "「らしさ」が、動きだす。"]]],
  ["dir" => "left", "words" => [["round", "想いを、かたちに。"], ["solid", "let’s create"], ["round", "伝わる、ひろがる。"]]],
  ["dir" => "right", "words" => [["outline", "d:s create"], ["italic", "Your idea, our craft."], ["solid", "web creative"]]],
];
$mv_flow_cols = [
  ["dir" => "up", "words" => [["round", "くりえいてぃぶな"], ["serif", "ていねいな"], ["round", "ユニークな"]]],
  ["dir" => "down", "words" => [["round", "ディエス・クリエイト"], ["round", "サイトをつくる"], ["serif", "想いをかたちに"]]],
  ["dir" => "down", "words" => [["serif", "ワクワクするサイトを"], ["round", "あそびゴコロを"], ["serif", "ちょっと心おどる"]]],
];
$mv_menu_items = [
  ["id" => "features", "en" => "features", "label" => "特徴・強み", "icon" => "star", "color" => "mint", "dir" => "down"],
  ["id" => "service", "en" => "service", "label" => "お役に立てること", "icon" => "code", "color" => "blue", "dir" => "down"],
  ["id" => "works", "en" => "works", "label" => "制作実績", "icon" => "grid", "color" => "pink", "dir" => "up"],
  ["id" => "about", "en" => "about", "label" => "自己紹介", "icon" => "user", "color" => "lilac", "dir" => "right"],
  ["id" => "contact", "en" => "contact", "label" => "お問い合わせ", "icon" => "mail", "color" => "rose", "dir" => "left"],
];
?>
<section class="top-world__panel top-world__panel--mv top-mv js-world-panel" id="mv" data-col="1" data-row="1" aria-labelledby="hero-title">
  <div class="top-mv__layout">
    <div class="top-mv__hero">
      <div class="top-mv__flow" aria-hidden="true">
        <?php foreach ($mv_flow_rows as $row_index => $row): ?>
          <div class="top-mv__flow-row top-mv__flow-row--<?php echo esc_attr($row_index + 1); ?> loop-img">
            <div class="loop-img__wrapper">
              <?php for ($set = 0; $set < 2; $set++): ?>
                <ul class="loop-img__items loop-img__items--<?php echo esc_attr($row["dir"]); ?>">
                  <?php foreach ($row["words"] as [$type, $text]): ?>
                    <li class="loop-img__item top-mv__flow-word top-mv__flow-word--<?php echo esc_attr($type); ?>"><?php echo esc_html($text); ?></li>
                  <?php endforeach; ?>
                </ul>
              <?php endfor; ?>
            </div>
          </div>
        <?php endforeach; ?>
        <?php foreach ($mv_flow_cols as $col_index => $col): ?>
          <div class="top-mv__flow-col top-mv__flow-col--<?php echo esc_attr($col_index + 1); ?> loop-img">
            <div class="loop-img__wrapper loop-img__wrapper--vertical">
              <?php for ($set = 0; $set < 2; $set++): ?>
                <ul class="loop-img__items loop-img__items--<?php echo esc_attr($col["dir"]); ?>">
                  <?php foreach ($col["words"] as [$type, $text]): ?>
                    <li class="loop-img__item top-mv__flow-word top-mv__flow-word--<?php echo esc_attr($type); ?>"><?php echo esc_html($text); ?></li>
                  <?php endforeach; ?>
                </ul>
              <?php endfor; ?>
            </div>
          </div>
        <?php endforeach; ?>
      </div>

      <div class="top-mv__center">
        <div class="top-mv__title-wrapper">
          <h1 class="top-mv__title js-world-title" id="hero-title" tabindex="-1"><span class="top-mv__title-line">ディエス<span class="top-mv__title-dot">・</span></span><span class="top-mv__title-line">クリエイト</span></h1>
        </div>
        <div class="top-mv__message">
          <p class="top-mv__idea">そのアイデアに、<br>ちょっと心おどる仕掛けを</p>
          <p class="top-mv__copy">動きのある<span class="top-mv__copy-accent">『クリエイティブ』</span>な<br>サイトを作ります</p>
          <p class="top-mv__sub">もちろん<span class="top-mv__sub-accent">『カチッ』</span>としたサイトも作ります</p>
        </div>
      </div>

      <div class="top-mv__sticker" role="img" aria-label="あそびゴコロ 実装中！">
        <span class="top-mv__sticker-face" aria-hidden="true"></span>
        <span class="top-mv__sticker-copy" aria-hidden="true"><span class="top-mv__sticker-text">あそびゴコロ</span><span class="top-mv__sticker-strong">実装中！</span></span>
      </div>
    </div>

    <aside class="top-mv__sidebar">
      <div class="top-mv__notebook" aria-hidden="true"></div>
      <nav class="top-mv__menu top-menu" aria-label="メインメニュー">
        <p class="top-menu__heading">main menu</p>
        <ul class="top-menu__items">
          <?php foreach ($mv_menu_items as $menu_item): ?>
            <li class="top-menu__item">
              <button class="top-menu__btn<?php echo "contact" === $menu_item["id"] ? " top-menu__btn--contact" : ""; ?> js-world-link" type="button" data-go="<?php echo esc_attr($menu_item["id"]); ?>">
                <span class="top-menu__icon top-menu__icon--<?php echo esc_attr($menu_item["color"]); ?>" data-icon="<?php echo esc_attr($menu_item["icon"]); ?>" aria-hidden="true"></span>
                <span class="top-menu__label"><span class="top-menu__label-en"><?php echo esc_html($menu_item["en"]); ?></span><span class="top-menu__label-ja"><?php echo esc_html($menu_item["label"]); ?></span></span>
                <span class="top-menu__direction top-menu__direction--<?php echo esc_attr($menu_item["dir"]); ?>" aria-hidden="true"></span>
              </button>
            </li>
          <?php endforeach; ?>
        </ul>
      </nav>
    </aside>
  </div>
</section>
