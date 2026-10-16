<?php
$top_menu_items = [
  ["id" => "features", "en" => "features", "label" => "特徴・強み", "icon" => "star", "theme" => "red"],
  ["id" => "service", "en" => "service", "label" => "お役に立てること", "icon" => "code", "theme" => "orange"],
  ["id" => "works", "en" => "works", "label" => "制作実績", "icon" => "grid", "theme" => "yellow"],
  ["id" => "about", "en" => "about", "label" => "自己紹介", "icon" => "user", "theme" => "blue"],
  ["id" => "contact", "en" => "contact", "label" => "お問い合わせ", "icon" => "mail", "theme" => "green"],
];
?>
<aside class="top-sidebar js-top-sidebar">
  <div class="top-sidebar__notebook" aria-hidden="true">
    <div class="top-sidebar__notebook-sheet top-sidebar__notebook-sheet--blue"></div>
    <div class="top-sidebar__notebook-sheet top-sidebar__notebook-sheet--pink"></div>
    <div class="top-sidebar__notebook-sheet top-sidebar__notebook-sheet--paper"></div>
  </div>
  <ul class="top-sidebar__ring-items" aria-hidden="true">
    <?php for ($ring = 0; $ring < 13; $ring++): ?>
      <li class="top-sidebar__ring-item"></li>
    <?php endfor; ?>
  </ul>
  <nav class="top-menu js-top-menu" aria-label="メインメニュー">
    <div class="top-menu__brand"><a class="top-menu__brand-link" href="#mv" data-go="mv"><img class="top-menu__brand-img" src="<?php img_path("/common/logo.svg"); ?>" width="546" height="100" alt="ディエス・クリエイト" fetchpriority="high"></a></div>
    <ul class="top-menu__items">
      <?php foreach ($top_menu_items as $menu_item): ?>
        <li class="top-menu__item">
          <a class="top-menu__btn" href="#<?php echo esc_attr($menu_item["id"]); ?>" data-go="<?php echo esc_attr($menu_item["id"]); ?>">
            <span class="top-menu__icon top-menu__icon--<?php echo esc_attr($menu_item["theme"]); ?>" data-icon="<?php echo esc_attr($menu_item["icon"]); ?>" aria-hidden="true"></span>
            <span class="top-menu__label"><span class="top-menu__label-en"><?php echo esc_html($menu_item["en"]); ?></span><span class="top-menu__label-ja"><?php echo esc_html($menu_item["label"]); ?></span></span>
            <span class="top-menu__direction" aria-hidden="true"></span>
          </a>
        </li>
      <?php endforeach; ?>
    </ul>
    <div class="top-menu__copyright"><small class="top-menu__copyright-text">&copy; 2026 ディエス・クリエイト All Rights Reserved.</small></div>
  </nav>
</aside>
