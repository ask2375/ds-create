<?php
$top_nav_items = [
  ["id" => "features", "label" => "特徴・強み"],
  ["id" => "service", "label" => "お役に立てること"],
  ["id" => "works", "label" => "制作実績"],
  ["id" => "about", "label" => "自己紹介"],
];
$top_minimap_items = [
  ["id" => "features", "label" => "特徴・強み"],
  ["id" => "service", "label" => "お役に立てること"],
  ["id" => "contact", "label" => "お問い合わせ"],
  ["id" => "mv", "label" => "メインビジュアル"],
  ["id" => "about", "label" => "自己紹介"],
  ["id" => "works", "label" => "制作実績"],
];
?>
<header class="top-header js-top-header">
  <p class="top-header__logo"><a class="top-header__logo-link js-world-link" href="#mv" data-go="mv">ディエス・クリエイト</a></p>
  <nav class="top-header__nav" aria-label="グローバルナビゲーション">
    <ul class="top-header__nav-items">
      <?php foreach ($top_nav_items as $nav_item): ?>
        <li class="top-header__nav-item">
          <a class="top-header__nav-link js-world-link" href="#<?php echo esc_attr($nav_item["id"]); ?>" data-go="<?php echo esc_attr($nav_item["id"]); ?>"><?php echo esc_html($nav_item["label"]); ?></a>
        </li>
      <?php endforeach; ?>
      <li class="top-header__nav-item top-header__nav-item--contact">
        <a class="top-header__nav-btn js-world-link" href="#contact" data-go="contact">お問い合わせ</a>
      </li>
    </ul>
  </nav>
</header>

<nav class="top-minimap" aria-label="現在位置">
  <ul class="top-minimap__items">
    <?php foreach ($top_minimap_items as $minimap_item): ?>
      <li class="top-minimap__item top-minimap__item--<?php echo esc_attr($minimap_item["id"]); ?>">
        <a class="top-minimap__link js-world-link" href="#<?php echo esc_attr($minimap_item["id"]); ?>" data-go="<?php echo esc_attr($minimap_item["id"]); ?>" aria-label="<?php echo esc_attr($minimap_item["label"]); ?>"></a>
      </li>
    <?php endforeach; ?>
  </ul>
</nav>
