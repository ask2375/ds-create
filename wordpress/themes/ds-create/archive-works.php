<?php get_header(); ?>

<main class="l-main" id="main">
	<section class="works">
		<div class="works__inner inner">
			<div class="works__head">
				<div class="works__heading">
					<p class="works__label">works</p>
					<h1 class="works__title">制作実績</h1>
				</div>
			</div>

			<div class="js-works-ajax">
				<?php get_template_part("template-parts/works/search-form"); ?>

				<?php if (have_posts()): ?>
					<ul class="works__cards">
						<?php while (have_posts()):
							the_post(); ?>
							<?php get_template_part("template-parts/works/card"); ?>
						<?php
						endwhile; ?>
					</ul>
					<?php $pagination = paginate_links([
						"mid_size" => 1,
						"prev_text" => '<span class="sr-only">前のページ</span>',
						"next_text" => '<span class="sr-only">次のページ</span>',
						"add_args" => works_search_active_args(),
					]); ?>
					<?php if ($pagination): ?>
						<div class="works__pagination">
							<nav class="pagination" data-theme="works" aria-label="ページナビゲーション">
								<div class="nav-links">
									<?php echo $pagination; ?>
								</div>
							</nav>
						</div>
					<?php endif; ?>
				<?php else: ?>
					<p class="works__empty"><?php echo works_search_active_args() ? "条件に一致する制作実績は見つかりませんでした。" : "制作実績はまだありません。"; ?></p>
				<?php endif; ?>
			</div>

			<div class="works__note-wrapper">
				<p class="works__note-text">※掲載している制作実績は、<wbr>すべてWeb制作会社さまからご依頼いただき、<wbr>制作を担当したものです。</p>
			</div>
		</div>
	</section>
</main>

<?php get_footer(); ?>