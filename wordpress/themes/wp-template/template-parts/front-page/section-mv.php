<?php
/**
 * フロントページ: MV セクション
 */
?>
<section class="mv">
  <div class="mv__inner">
    <div class="mv__title-wrap">
      <h2 class="mv__main-title">メインタイトル</h2>
      <p class="mv__sub-title">
        ここにサブタイトルが入ります。<br />ここにサブタイトルが入ります。ここにサブタイトルが入ります。<br />ここにサブタイトルが入ります。
      </p>
    </div>
    <div class="mv__splide splide js-mv-splide" aria-label="main-visual">
      <div class="splide__track">
        <ul class="splide__list">
          <li class="splide__slide">
            <div class="splide__slide-image">
              <img src="<?php img_path("/image_mv_01.webp"); ?>" width="977" height="1800" alt="" fetchpriority="high" />
            </div>
          </li>
          <li class="splide__slide">
            <div class="splide__slide-image">
              <img src="<?php img_path("/image_mv_02.webp"); ?>" width="977" height="1800" alt="" />
            </div>
          </li>
          <li class="splide__slide">
            <div class="splide__slide-image">
              <img src="<?php img_path("/image_mv_03.webp"); ?>" width="977" height="1800" alt="" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>
