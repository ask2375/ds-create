<?php
$search_args = works_search_args();
$filters = works_search_filters();
$recommended = works_search_recommended();
$search_url = $args["action"] ?? get_post_type_archive_link("works") . "#works-search";
?>

<form class="works__search js-works-ajax-form" id="works-search" action="<?php echo esc_url($search_url); ?>" method="get" role="search" aria-label="制作実績検索">
  <div class="works__search-keyword">
    <div class="works__search-keyword-field">
      <input type="search" id="works-keyword" name="keyword" class="works__search-keyword-input" placeholder="キーワードで検索" aria-label="キーワードで検索" value="<?php echo esc_attr($search_args["keyword"]); ?>" />

      <div class="works__search-filters">
        <?php foreach ($filters as $param => $conf):

          $terms = works_search_filter_terms($conf["taxonomy"], $conf["group"]);
          if (!$terms) {
            continue;
          }

          $selected = $search_args[$param];
          $current_label = $conf["label"];
          foreach ($terms as $term) {
            if ($term->slug === $selected) {
              $current_label = $term->name;
            }
          }
          $list_id = "works-filter-" . $param;
          ?>
          <div class="works__search-filter js-works-filter">
            <button type="button" class="works__search-filter-toggle js-works-filter-toggle" aria-expanded="false" aria-controls="<?php echo esc_attr($list_id); ?>">
              <span class="works__search-filter-current"><?php echo esc_html($current_label); ?></span>
            </button>

            <ul class="works__search-filter-list js-works-filter-list" id="<?php echo esc_attr($list_id); ?>" role="listbox" aria-label="<?php echo esc_attr($conf["label"]); ?>">
              <li class="works__search-filter-item js-works-filter-item" role="option" tabindex="-1" data-value="" aria-selected="<?php echo "" === $selected ? "true" : "false"; ?>"><?php echo esc_html($conf["label"]); ?></li>
              <?php foreach ($terms as $term): ?>
                <li class="works__search-filter-item js-works-filter-item" role="option" tabindex="-1" data-value="<?php echo esc_attr($term->slug); ?>" aria-selected="<?php echo $selected === $term->slug ? "true" : "false"; ?>"><?php echo esc_html(
  $term->name,
); ?></li>
              <?php endforeach; ?>
            </ul>

            <input type="hidden" name="<?php echo esc_attr($param); ?>" value="<?php echo esc_attr($selected); ?>" class="js-works-filter-value" />
          </div>
        <?php
        endforeach; ?>

        <label class="works__search-check">
          <input type="checkbox" name="<?php echo esc_attr($recommended["param"]); ?>" value="1" class="works__search-check-input js-works-check" <?php checked($search_args[$recommended["param"]], "1"); ?> />
          <span class="works__search-check-text"><?php echo esc_html($recommended["label"]); ?></span>
        </label>
      </div>
    </div>
  </div>

  <div class="works__search-submit-wrapper">
    <button type="submit" class="works__search-btn">
      <span class="works__search-btn-icon" aria-hidden="true"></span>
      <span class="works__search-btn-text">検索</span>
    </button>
  </div>

  <?php if (works_search_active_args()): ?>
    <div class="works__search-reset-wrapper">
      <a href="<?php echo esc_url($search_url); ?>" class="works__search-reset js-works-ajax-link">
        <span class="works__search-reset-icon" aria-hidden="true"></span>
        <span class="works__search-reset-text">条件をリセット</span>
      </a>
    </div>
  <?php endif; ?>
</form>
