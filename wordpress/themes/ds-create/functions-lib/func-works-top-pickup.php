<?php
if (!defined("ABSPATH")) {
  exit();
}

define("WORKS_TOP_PICKUP_MAX", 3);

function works_top_pickup_add_column($columns)
{
  $new = [];
  foreach ($columns as $key => $label) {
    $new[$key] = $label;
    if ("works_date" === $key) {
      $new["works_top_pickup"] = "トップ掲載";
    }
  }
  return $new;
}
add_filter("manage_works_posts_columns", "works_top_pickup_add_column", 20);

function works_top_pickup_column_content($column, $post_id)
{
  if ("works_top_pickup" !== $column || "publish" !== get_post_status($post_id)) {
    return;
  }
  printf(
    '<input type="checkbox" class="works-top-pickup-checkbox" data-post-id="%1$s" data-nonce="%2$s" aria-label="トップ掲載"%3$s>',
    esc_attr($post_id),
    esc_attr(wp_create_nonce("works_top_pickup_" . $post_id)),
    checked(get_post_meta($post_id, "_is_works_top_pickup", true), "1", false)
  );
}
add_action("manage_works_posts_custom_column", "works_top_pickup_column_content", 10, 2);

function works_top_pickup_checked_ids($exclude_id = 0)
{
  return get_posts([
    "post_type" => "works",
    "post_status" => "any",
    "posts_per_page" => -1,
    "fields" => "ids",
    "post__not_in" => $exclude_id ? [$exclude_id] : [],
    "meta_key" => "_is_works_top_pickup",
    "meta_value" => "1",
  ]);
}

function works_top_pickup_admin_scripts($hook)
{
  $screen = get_current_screen();
  if ("edit.php" !== $hook || !$screen || "edit-works" !== $screen->id) {
    return;
  }
  $config = [
    "ajaxUrl" => admin_url("admin-ajax.php"),
    "max" => WORKS_TOP_PICKUP_MAX,
    "maxMsg" => "トップ掲載は最大" . WORKS_TOP_PICKUP_MAX . "件までです。先に既存のチェックを外してください。",
  ];
  wp_register_script("works-top-pickup-admin", false, [], null, true);
  wp_enqueue_script("works-top-pickup-admin");
  wp_add_inline_script(
    "works-top-pickup-admin",
    "const worksTopPickup = " .
      wp_json_encode($config) .
      ";
document.addEventListener(\"change\", (event) => {
  const checkbox = event.target.closest(\".works-top-pickup-checkbox\");
  if (!checkbox) return;
  const checked = checkbox.checked;
  if (checked && document.querySelectorAll(\".works-top-pickup-checkbox:checked\").length > worksTopPickup.max) {
    alert(worksTopPickup.maxMsg);
    checkbox.checked = false;
    return;
  }
  checkbox.disabled = true;
  const body = new URLSearchParams({
    action: \"toggle_works_top_pickup\",
    post_id: checkbox.dataset.postId,
    checked: checked ? \"1\" : \"0\",
    nonce: checkbox.dataset.nonce,
  });
  fetch(worksTopPickup.ajaxUrl, { method: \"POST\", body, credentials: \"same-origin\" })
    .then((response) => response.json())
    .then((response) => {
      if (response.success) return;
      alert(response.data && response.data.message === \"max\" ? worksTopPickup.maxMsg : \"エラーが発生しました。\");
      checkbox.checked = !checked;
    })
    .catch(() => {
      alert(\"通信エラーが発生しました。\");
      checkbox.checked = !checked;
    })
    .finally(() => {
      checkbox.disabled = false;
    });
});"
  );
}
add_action("admin_enqueue_scripts", "works_top_pickup_admin_scripts");

function works_top_pickup_admin_notice()
{
  $screen = get_current_screen();
  if (!$screen || "edit-works" !== $screen->id) {
    return;
  }
  $checked_ids = works_top_pickup_checked_ids();
  $titles = [];
  foreach ($checked_ids as $post_id) {
    $status = "publish" === get_post_status($post_id) ? "" : "（非公開のためトップに出ません）";
    $titles[] = esc_html(get_the_title($post_id) . $status);
  }
  echo '<div class="notice notice-info"><p><strong>トップページの制作実績（' . esc_html(count($checked_ids) . " / " . WORKS_TOP_PICKUP_MAX) . "件）</strong></p>";
  if ($titles) {
    echo "<ul style=\"margin-block-start:0;list-style:disc;padding-inline-start:20px;\"><li>" . implode("</li><li>", $titles) . "</li></ul>";
  }
  echo "<p>「トップ掲載」にチェックした記事を制作時期の新しい順に表示します。" . esc_html(WORKS_TOP_PICKUP_MAX) . "件に満たない分は「イチオシ」→ 新着の順に自動で補います。</p></div>";
}
add_action("admin_notices", "works_top_pickup_admin_notice");

function works_top_pickup_ajax_toggle()
{
  $post_id = isset($_POST["post_id"]) ? absint($_POST["post_id"]) : 0;
  $nonce = isset($_POST["nonce"]) ? sanitize_text_field(wp_unslash($_POST["nonce"])) : "";
  $checked = isset($_POST["checked"]) && "1" === $_POST["checked"];

  if (!wp_verify_nonce($nonce, "works_top_pickup_" . $post_id)) {
    wp_send_json_error(["message" => "認証エラー"]);
  }
  if (!current_user_can("edit_post", $post_id)) {
    wp_send_json_error(["message" => "権限がありません"]);
  }
  if ("works" !== get_post_type($post_id) || "publish" !== get_post_status($post_id)) {
    wp_send_json_error(["message" => "公開中の制作実績のみ選択できます"]);
  }

  if ($checked) {
    if (count(works_top_pickup_checked_ids($post_id)) >= WORKS_TOP_PICKUP_MAX) {
      wp_send_json_error(["message" => "max"]);
    }
    update_post_meta($post_id, "_is_works_top_pickup", "1");
  } else {
    delete_post_meta($post_id, "_is_works_top_pickup");
  }
  wp_send_json_success();
}
add_action("wp_ajax_toggle_works_top_pickup", "works_top_pickup_ajax_toggle");
