<header class="header l-header">
  <div class="header__inner">
    <h1 class="header__logo">
      <a href="<?php echo esc_url(home_url("/")); ?>">
        <img src="<?php img_path("/logo_vite.svg"); ?>" alt="vite" width="410" height="404" />
      </a>
    </h1>
    <nav class="header__nav">
      <ul class="header__nav-list">
        <li class="header__nav-item">
          <a href="<?php page_path("works"); ?>">制作実績</a>
        </li>
        <li class="header__nav-item">
          <a href="<?php page_path("news"); ?>">ニュース</a>
        </li>
        <li class="header__nav-item" data-variant="contact">
          <a href="<?php page_path("contact"); ?>">お問い合わせ</a>
        </li>
      </ul>
    </nav>
    <button class="header__hamburger js-hamburger" aria-label="メニューを開く" aria-expanded="false" aria-controls="drawer-menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
    <div id="drawer-menu" class="header__drawer js-drawer" aria-hidden="true">
      <nav class="header__drawer-nav">
        <ul class="header__drawer-list">
          <li class="header__drawer-item">
            <a href="<?php page_path("works"); ?>">制作実績</a>
          </li>
          <li class="header__drawer-item">
            <a href="<?php page_path("news"); ?>">ニュース</a>
          </li>
          <li class="header__drawer-item" data-variant="contact">
            <a href="<?php page_path("contact"); ?>">お問い合わせ</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</header>
