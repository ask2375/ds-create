<?php
/**
 * 制作実績アーカイブページのテンプレート
 * カスタム投稿タイプ「works」の一覧
 */
get_header(); ?>

<main class="l-main" id="main">
  <section class="works-list">
    <div class="works-list__inner inner">
      <div class="works-list__title">
        <?php get_template_part("template-parts/section-title", null, [
          "main" => "WORKS",
          "sub" => "制作実績",
          "align" => "left",
          "tag" => "h1",
        ]); ?>
      </div>
      <?php get_template_part("template-parts/archive/works-list"); ?>
    </div>
  </section>
</main>

<?php get_footer(); ?>
