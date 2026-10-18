<?php
$header_nav_items = [["id" => "features", "label" => "特徴・強み"], ["id" => "service", "label" => "お役に立てること"], ["id" => "works", "label" => "制作実績"], ["id" => "about", "label" => "自己紹介"]];
$header_is_front = is_front_page();
$header_go = function ($id) use ($header_is_front) {
  if ($header_is_front) {
    echo ' data-go="' . esc_attr($id) . '"';
  }
};
?>
<header class="header<?php echo $header_is_front ? " header--glass" : ""; ?>">
  <div class="header__inner">
    <div class="header__logo">
      <a class="header__logo-link" href="<?php echo esc_url(home_url("/")); ?>"<?php $header_go("mv"); ?>>
        <span class="sr-only">ディエス・クリエイト</span>
        <img class="header__logo-img" src="<?php img_path("/common/logo.svg"); ?>" alt="" width="546" height="100" />
      </a>
    </div>

    <nav class="header__pc-nav pc-nav" aria-label="グローバルナビゲーション">
      <ul class="pc-nav__items">
        <?php foreach ($header_nav_items as $nav_item): ?>
          <li class="pc-nav__item">
            <a class="pc-nav__item-link" href="<?php echo esc_url(home_url("/#" . $nav_item["id"])); ?>"<?php $header_go($nav_item["id"]); ?>><?php echo esc_html($nav_item["label"]); ?></a>
          </li>
        <?php endforeach; ?>
      </ul>
    </nav>

    <div class="header__btn-wrapper">
      <div class="header__btn">
        <a class="btn-chamfer btn-chamfer--header" href="<?php echo esc_url(home_url("/#contact")); ?>"<?php $header_go("contact"); ?>><span class="btn-chamfer__text">お問い合わせ</span></a>
      </div>

      <button type="button" class="header__drawer hamburger js-hamburger" aria-controls="sp-nav" aria-expanded="false" aria-label="メニューを開く">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>

  <nav class="header__sp-nav sp-nav js-sp-nav" id="sp-nav" aria-label="スマートフォン用ナビゲーション">
    <div class="sp-nav__inner">
      <ul class="sp-nav__items">
        <?php foreach ($header_nav_items as $nav_item): ?>
          <li class="sp-nav__item">
            <a class="sp-nav__item-link" href="<?php echo esc_url(home_url("/#" . $nav_item["id"])); ?>"<?php $header_go($nav_item["id"]); ?>><?php echo esc_html($nav_item["label"]); ?></a>
          </li>
        <?php endforeach; ?>
      </ul>

      <div class="sp-nav__btn">
        <a class="btn-chamfer btn-chamfer--header" href="<?php echo esc_url(home_url("/#contact")); ?>"<?php $header_go("contact"); ?>><span class="btn-chamfer__text">お問い合わせ</span></a>
      </div>
    </div>
  </nav>

  <div class="header__overlay js-overlay"></div>
</header>
