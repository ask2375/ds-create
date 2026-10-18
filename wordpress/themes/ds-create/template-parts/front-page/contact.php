<?php
$footer_nav_items = [
  ["id" => "features", "label" => "特徴・強み"],
  ["id" => "service", "label" => "お役に立てること"],
  ["id" => "works", "label" => "制作実績"],
  ["id" => "about", "label" => "自己紹介"],
  ["id" => "contact", "label" => "お問い合わせ"],
]; ?>
<section class="top-depth__chapter top-contact js-depth-chapter" id="contact" aria-labelledby="contact-title">
  <div class="top-chapter">
    <div class="top-contact__heading">
      <?php get_template_part("template-parts/front-page/chapter-heading", null, ["id" => "contact", "label" => "contact", "title" => "お問い合わせ"]); ?>
    </div>
    <div class="top-contact__panel glass-card">
      <p class="top-contact__text">制作のご相談・お見積もりなど、お気軽にご連絡ください。<br>「こんな動きはできる？」というご相談も歓迎です。</p>
    </div>
    <footer class="top-contact__footer">
      <a class="top-contact__footer-logo" href="<?php echo esc_url(home_url("/")); ?>" data-go="mv">
        <img class="top-contact__footer-logo-img" src="<?php img_path("/common/logo.svg"); ?>" alt="ディエス・クリエイト" width="546" height="100" loading="lazy" />
      </a>
      <nav class="top-contact__footer-nav" aria-label="フッターナビゲーション">
        <ul class="top-contact__footer-items">
          <?php foreach ($footer_nav_items as $nav_item): ?>
            <li class="top-contact__footer-item">
              <a class="top-contact__footer-link" href="<?php echo esc_url(home_url("/#" . $nav_item["id"])); ?>" data-go="<?php echo esc_attr($nav_item["id"]); ?>"><?php echo esc_html($nav_item["label"]); ?></a>
            </li>
          <?php endforeach; ?>
        </ul>
      </nav>
      <div class="top-contact__copyright"><small class="top-contact__copyright-text">&copy; 2026 ディエス・クリエイト All Rights Reserved.</small></div>
    </footer>
  </div>
</section>
