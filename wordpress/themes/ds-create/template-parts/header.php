<?php
if (is_front_page()) {
  return;
}
$header_nav_items = [
  ["id" => "features", "label" => "特徴・強み"],
  ["id" => "service", "label" => "お役に立てること"],
  ["id" => "works", "label" => "制作実績"],
  ["id" => "about", "label" => "自己紹介"],
];
?>
<header class="header">
  <p class="header__logo"><a class="header__logo-link" href="<?php echo esc_url(home_url("/")); ?>">ディエス・クリエイト</a></p>
  <nav class="header__nav" aria-label="グローバルナビゲーション">
    <ul class="header__nav-items">
      <?php foreach ($header_nav_items as $nav_item): ?>
        <li class="header__nav-item">
          <a class="header__nav-link" href="<?php echo esc_url(home_url("/#" . $nav_item["id"])); ?>"><?php echo esc_html($nav_item["label"]); ?></a>
        </li>
      <?php endforeach; ?>
      <li class="header__nav-item header__nav-item--contact">
        <a class="header__nav-btn" href="<?php echo esc_url(home_url("/#contact")); ?>">お問い合わせ</a>
      </li>
    </ul>
  </nav>
</header>
