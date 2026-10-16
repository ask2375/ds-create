<?php
$top_minimap_items = [
  ["id" => "features", "label" => "特徴・強み"],
  ["id" => "service", "label" => "お役に立てること"],
  ["id" => "contact", "label" => "お問い合わせ"],
  ["id" => "mv", "label" => "メインビジュアル"],
  ["id" => "about", "label" => "自己紹介"],
  ["id" => "works", "label" => "制作実績"],
];
?>
<nav class="top-minimap" aria-label="現在位置">
  <ul class="top-minimap__items">
    <?php foreach ($top_minimap_items as $minimap_item): ?>
      <li class="top-minimap__item top-minimap__item--<?php echo esc_attr($minimap_item["id"]); ?>">
        <a class="top-minimap__link" href="#<?php echo esc_attr($minimap_item["id"]); ?>" data-go="<?php echo esc_attr($minimap_item["id"]); ?>" aria-label="<?php echo esc_attr($minimap_item["label"]); ?>"></a>
      </li>
    <?php endforeach; ?>
  </ul>
</nav>
