<?php get_header(); ?>

<main class="l-main top-depth js-depth" id="main">
  <div class="top-depth__world js-depth-world" aria-hidden="true"></div>
  <div class="top-depth__stage js-depth-stage">
    <?php get_template_part("template-parts/front-page/mv"); ?>
    <?php get_template_part("template-parts/front-page/features"); ?>
    <?php get_template_part("template-parts/front-page/service"); ?>
    <?php get_template_part("template-parts/front-page/works"); ?>
    <?php get_template_part("template-parts/front-page/about"); ?>
    <?php get_template_part("template-parts/front-page/contact"); ?>
  </div>
  <div class="top-depth__track js-depth-track" aria-hidden="true"></div>
</main>

<div class="top-depth__controls js-depth-controls">
  <label class="top-depth__position">
    <span class="sr-only">スクロール演出の位置</span>
    <input class="top-depth__range js-depth-range" type="range" min="0" max="1000" step="1" value="0" />
  </label>
  <button class="top-depth__play js-depth-play" type="button" aria-label="演出を自動再生"><span class="top-depth__play-label js-depth-play-label">演出を見る</span></button>
  <button class="top-depth__motion js-depth-motion" type="button" aria-pressed="false">動きを抑える</button>
</div>

<?php get_template_part("template-parts/front-page/dialog-features"); ?>
<?php get_template_part("template-parts/front-page/dialog-service"); ?>
<?php get_template_part("template-parts/front-page/dialog-about"); ?>

<?php get_footer(); ?>
