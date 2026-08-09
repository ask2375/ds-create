<?php
/**
 * フロントページ: サンプルセクション
 */
?>
<section class="sample">
  <div class="sample__inner inner">
    <div class="sample__title">
      <?php get_template_part("template-parts/section-title", null, [
        "main" => "sample",
        "sub" => "サンプル",
        "align" => "center",
        "tag" => "h2",
      ]); ?>
    </div>
    <div class="sample__button-wrap">
      <a class="button" data-color="black" href="<?php page_path("contact"); ?>">問い合わせへ</a>
    </div>
    <div class="sample__button-wrap">
      <a class="button" href="<?php page_path("news"); ?>">ニュース一覧へ</a>
    </div>

    <div class="sample__button-wrap">
      <a class="button" href="<?php page_path("works"); ?>">制作実績一覧へ</a>
    </div>

    <hr class="sample__divider" />

    <p>背景画像の読み込み</p>
    <div class="sample__bg"></div>

    <hr class="sample__divider" />

    <p>通常画像の読み込み(imgの下部をマスクでフェードかけてます)</p>
    <div class="sample__image">
      <img src="<?php img_path("/image_sample.webp"); ?>" width="512" height="512" alt="猫の画像" />
    </div>
  </div>
</section>