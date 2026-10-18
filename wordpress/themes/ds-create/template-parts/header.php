<?php
$header_nav_items = [
  ["id" => "features", "label" => "特徴・強み"],
  ["id" => "service", "label" => "お役に立てること"],
  ["id" => "works", "label" => "制作実績"],
  ["id" => "about", "label" => "自己紹介"],
];
$header_is_front = is_front_page();
$header_go = function ($id) use ($header_is_front) {
  if ($header_is_front) {
    echo ' data-go="' . esc_attr($id) . '"';
  }
};
?>
<header class="header">
  <p class="header__logo"><a class="header__logo-link" href="<?php echo esc_url(home_url("/")); ?>"<?php $header_go("mv"); ?>>ディエス・クリエイト</a></p>
  <nav class="header__nav" aria-label="グローバルナビゲーション">
    <ul class="header__nav-items">
      <?php foreach ($header_nav_items as $nav_item): ?>
        <li class="header__nav-item">
          <a class="header__nav-link" href="<?php echo esc_url(home_url("/#" . $nav_item["id"])); ?>"<?php $header_go($nav_item["id"]); ?>><?php echo esc_html($nav_item["label"]); ?></a>
        </li>
      <?php endforeach; ?>
      <li class="header__nav-item header__nav-item--contact">
        <a class="header__nav-btn" href="<?php echo esc_url(home_url("/#contact")); ?>"<?php $header_go("contact"); ?>>お問い合わせ</a>
      </li>
    </ul>
  </nav>
</header>
