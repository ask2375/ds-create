<?php get_header(); ?>

<main class="l-main" id="main">
  <section class="error error-404 not-found">
    <div class="error__inner inner">
      <header class="error__header">
        <h1 class="error__title"><?php esc_html_e("ページが見つかりませんでした", "wp-template"); ?></h1>
      </header>
      <div class="error__content">
        <p><?php esc_html_e("申し訳ございませんが、お探しのページは見つかりませんでした。URLをご確認いただくか、トップページから再度お探しください。", "wp-template"); ?></p>
        <p>
          <a href="<?php echo esc_url(home_url("/")); ?>" class="button" data-color="black"><?php esc_html_e("トップページへ戻る", "wp-template"); ?></a>
        </p>
      </div>
      <div class="error__search">
        <?php get_search_form(); ?>
      </div>
    </div>
  </section>
</main>

<?php get_footer();
