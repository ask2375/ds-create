<footer class="footer">
  <div class="footer__inner inner">
    <div class="footer__content">
      <div class="footer__logo">
        <a href="<?php echo esc_url(home_url("/")); ?>">
          <img src="<?php img_path("/logo_vite.svg"); ?>" alt="vite" width="410" height="404" loading="lazy" />
        </a>
      </div>
      <nav class="footer__nav">
        <ul class="footer__nav-list">
          <li class="footer__nav-item"><a href="<?php page_path("works"); ?>">制作実績</a></li>
          <li class="footer__nav-item"><a href="<?php page_path("news"); ?>">ニュース</a></li>
          <li class="footer__nav-item"><a href="<?php page_path("contact"); ?>">お問い合わせ</a></li>
        </ul>
      </nav>
    </div>
    <div class="footer__bottom">
      <p class="footer__copyright">&copy; <?php echo esc_html(date("Y")); ?> <?php echo esc_html(get_bloginfo("name")); ?>. All rights reserved.</p>
    </div>
  </div>
</footer>
