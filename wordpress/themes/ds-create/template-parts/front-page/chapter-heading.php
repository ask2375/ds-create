<?php
$heading_id = $args["id"] ?? "";
$heading_lead = $args["lead"] ?? "";
?>
<div class="top-chapter__heading">
  <p class="top-chapter__label"><?php echo esc_html($args["label"] ?? ""); ?></p>
  <h2 class="top-chapter__title" id="<?php echo esc_attr($heading_id); ?>-title" tabindex="-1"><?php echo esc_html($args["title"] ?? ""); ?></h2>
  <?php if ($heading_lead): ?>
    <p class="top-chapter__lead"><?php echo esc_html($heading_lead); ?></p>
  <?php endif; ?>
</div>
