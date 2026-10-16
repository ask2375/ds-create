<?php get_header(); ?>

<main class="l-main top-world" id="main">
  <?php get_template_part("template-parts/front-page/sidebar"); ?>
  <div class="top-world__inner js-world">
    <?php get_template_part("template-parts/front-page/mv"); ?>
    <?php get_template_part("template-parts/front-page/features"); ?>
    <?php get_template_part("template-parts/front-page/service"); ?>
    <?php get_template_part("template-parts/front-page/works"); ?>
    <?php get_template_part("template-parts/front-page/about"); ?>
    <?php get_template_part("template-parts/front-page/contact"); ?>
  </div>
</main>

<?php get_template_part("template-parts/front-page/minimap"); ?>
<?php get_template_part("template-parts/front-page/dialog-service"); ?>
<?php get_template_part("template-parts/front-page/dialog-about"); ?>

<?php get_footer(); ?>
