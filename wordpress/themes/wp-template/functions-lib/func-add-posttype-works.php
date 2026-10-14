<?php
if (!defined("ABSPATH")) {
  exit();
}

// 制作実績（works）の投稿タイプ
function works_register_post_type()
{
  register_post_type("works", [
    "label" => "制作実績",
    "labels" => [
      "name" => "制作実績",
      "singular_name" => "制作実績",
      "menu_name" => "制作実績",
      "all_items" => "制作実績一覧",
      "add_new_item" => "制作実績を追加",
      "edit_item" => "制作実績を編集",
      "new_item" => "新規制作実績",
      "view_item" => "制作実績を表示",
      "search_items" => "制作実績を検索",
      "not_found" => "制作実績が見つかりませんでした",
      "not_found_in_trash" => "ゴミ箱に制作実績は見つかりませんでした",
    ],
    "public" => true,
    "has_archive" => true,
    "rewrite" => [
      "slug" => "works",
      "with_front" => false,
    ],
    "supports" => ["title", "thumbnail", "revisions"],
    "show_in_rest" => true,
    "menu_position" => 5,
    "menu_icon" => "dashicons-portfolio",
  ]);
}
add_action("init", "works_register_post_type", 0);

// GET パラメータ名 => タクソノミー・絞り込みグループ・セレクトの初期表示ラベル
function works_search_filters()
{
  return [
    "site" => ["taxonomy" => "works_category", "group" => "site", "label" => "ジャンルで選ぶ"],
    "animation" => ["taxonomy" => "works_category", "group" => "animation", "label" => "アニメーションで選ぶ"],
  ];
}

// イチオシ絞り込みの GET パラメータ名とターム slug
function works_search_recommended()
{
  return ["param" => "recommended", "taxonomy" => "works_category", "slug" => "recommended", "label" => "★イチオシ"];
}

// 絞り込み用タクソノミー
function works_search_register_taxonomies()
{
  $taxonomies = [
    "works_category" => ["カテゴリー", "絞り込み用（Notion 制作実績一覧のカテゴリー）"],
  ];
  foreach ($taxonomies as $tax => [$label, $description]) {
    register_taxonomy($tax, "works", [
      "label" => $label,
      "labels" => [
        "name" => $label,
        "singular_name" => $label,
        "menu_name" => $label,
        "all_items" => $label . "一覧",
        "edit_item" => $label . "を編集",
        "view_item" => $label . "を表示",
        "update_item" => $label . "名を更新",
        "add_new_item" => "新規" . $label . "を追加",
        "new_item_name" => "新しい" . $label . "名",
        "parent_item" => "親" . $label,
        "parent_item_colon" => "親" . $label . ":",
        "search_items" => $label . "を検索",
        "not_found" => $label . "が見つかりません",
        "no_terms" => $label . "なし",
        "filter_by_item" => $label . "で絞り込み",
        "items_list_navigation" => $label . "リストナビゲーション",
        "items_list" => $label . "リスト",
        "back_to_items" => $label . "一覧へ戻る",
      ],
      "description" => $description,
      "public" => false,
      "publicly_queryable" => false,
      "hierarchical" => true,
      "show_ui" => true,
      "show_in_menu" => true,
      "show_in_nav_menus" => false,
      "show_admin_column" => false,
      "show_in_rest" => true,
      "show_tagcloud" => false,
      "sort" => false,
      "query_var" => false,
      "rewrite" => false,
    ]);
  }
}
add_action("init", "works_search_register_taxonomies", 0);

// 現在の検索条件をサニタイズして返す
function works_search_args()
{
  $args = [
    "keyword" => isset($_GET["keyword"]) ? sanitize_text_field(wp_unslash($_GET["keyword"])) : "",
  ];
  foreach (works_search_filters() as $param => $conf) {
    $slug = isset($_GET[$param]) ? sanitize_title(wp_unslash($_GET[$param])) : "";
    $term = $slug !== "" ? get_term_by("slug", $slug, $conf["taxonomy"]) : false;
    $args[$param] = $term && works_search_term_group($term) === $conf["group"] ? $slug : "";
  }
  $recommended = works_search_recommended();
  $args[$recommended["param"]] = isset($_GET[$recommended["param"]]) && "1" === (string) $_GET[$recommended["param"]] ? "1" : "";
  return $args;
}

// 空でない検索条件だけを返す
function works_search_active_args()
{
  return array_filter(works_search_args(), function ($value) {
    return $value !== "";
  });
}

// ページ送りのリンクから、無効な検索パラメータを取り除く
function works_search_clean_paginate_link($link)
{
  if (!is_post_type_archive("works")) {
    return $link;
  }
  $unused = array_diff(array_keys(works_search_args()), array_keys(works_search_active_args()));
  $unused[] = "works_category";
  return remove_query_arg($unused, $link);
}
add_filter("paginate_links", "works_search_clean_paginate_link");

// 一覧のメインクエリへの反映
function works_search_archive_query($query)
{
  if (is_admin() || !$query->is_main_query()) {
    return;
  }
  if (!$query->is_post_type_archive("works")) {
    return;
  }

  $query->set("posts_per_page", 9);
  $query->set("meta_query", [
    "relation" => "OR",
    "works_date_clause" => [
      "key" => "works_date",
      "compare" => "EXISTS",
    ],
    [
      "key" => "works_date",
      "compare" => "NOT EXISTS",
    ],
  ]);
  $query->set("orderby", [
    "works_date_clause" => "DESC",
    "date" => "DESC",
    "ID" => "DESC",
  ]);

  $args = works_search_args();

  $tax_query = [];
  foreach (works_search_filters() as $param => $conf) {
    if ($args[$param] === "") {
      continue;
    }
    $tax_query[] = [
      "taxonomy" => $conf["taxonomy"],
      "field" => "slug",
      "terms" => $args[$param],
    ];
  }
  $recommended = works_search_recommended();
  if ($args[$recommended["param"]] === "1") {
    $tax_query[] = [
      "taxonomy" => $recommended["taxonomy"],
      "field" => "slug",
      "terms" => $recommended["slug"],
    ];
  }
  if (count($tax_query) > 1) {
    $tax_query["relation"] = "AND";
  }
  if ($tax_query) {
    $query->set("tax_query", $tax_query);
  }

  if ($args["keyword"] !== "") {
    $query->set("works_search_keyword", $args["keyword"]);
  }
}
add_action("pre_get_posts", "works_search_archive_query");

// キーワード検索のフィルタは works 一覧のキーワード検索時のみ発動する
function works_search_is_keyword_query($query)
{
  if (is_admin() || !$query->is_main_query()) {
    return false;
  }
  if ($query->get("post_type") !== "works") {
    return false;
  }
  return (string) $query->get("works_search_keyword") !== "";
}

// 本文が空でも ACF の入力値とターム名で拾えるように検索対象を広げる
function works_search_posts_search($search, $query)
{
  if (!works_search_is_keyword_query($query)) {
    return $search;
  }
  global $wpdb;

  $words = preg_split("/[\s\x{3000}]+/u", (string) $query->get("works_search_keyword"), -1, PREG_SPLIT_NO_EMPTY);
  if (!$words) {
    return $search;
  }
  $words = array_slice($words, 0, 10);

  $clauses = [];
  foreach ($words as $word) {
    $like = "%" . $wpdb->esc_like($word) . "%";
    $clauses[] = $wpdb->prepare(
      "({$wpdb->posts}.post_title LIKE %s" .
        " OR {$wpdb->posts}.post_content LIKE %s" .
        " OR EXISTS (" .
        "   SELECT 1 FROM {$wpdb->postmeta} AS works_search_meta" .
        "   WHERE works_search_meta.post_id = {$wpdb->posts}.ID" .
        "     AND LEFT(works_search_meta.meta_key, 1) <> '_'" .
        "     AND works_search_meta.meta_value LIKE %s" .
        " )" .
        " OR EXISTS (" .
        "   SELECT 1 FROM {$wpdb->term_relationships} AS works_search_tr" .
        "   INNER JOIN {$wpdb->term_taxonomy} AS works_search_tt" .
        "     ON works_search_tr.term_taxonomy_id = works_search_tt.term_taxonomy_id" .
        "   INNER JOIN {$wpdb->terms} AS works_search_terms" .
        "     ON works_search_tt.term_id = works_search_terms.term_id" .
        "   WHERE works_search_tr.object_id = {$wpdb->posts}.ID" .
        "     AND works_search_terms.name LIKE %s" .
        " ))",
      $like,
      $like,
      $like,
      $like,
    );
  }

  return " AND " . implode(" AND ", $clauses);
}
add_filter("posts_search", "works_search_posts_search", 10, 2);

// タームの並び順比較
function works_search_term_compare($a, $b)
{
  $order_a = get_term_meta($a->term_id, "display_order", true);
  $order_b = get_term_meta($b->term_id, "display_order", true);
  $order_a = "" === $order_a ? PHP_INT_MAX : (int) $order_a;
  $order_b = "" === $order_b ? PHP_INT_MAX : (int) $order_b;
  return $order_a === $order_b ? strcmp($a->name, $b->name) : $order_a <=> $order_b;
}

// タームの絞り込みグループのキーを返す
function works_search_term_group($term)
{
  return (string) get_term_meta($term->term_id, "works_filter_group", true);
}

// セレクトに出すタームを返す（指定グループのタームだけ・表示順）
function works_search_filter_terms($taxonomy, $group)
{
  $terms = get_terms([
    "taxonomy" => $taxonomy,
    "hide_empty" => false,
  ]);
  if (is_wp_error($terms) || !$terms) {
    return [];
  }

  $terms = array_values(
    array_filter($terms, function ($term) use ($group) {
      return works_search_term_group($term) === $group;
    }),
  );
  usort($terms, "works_search_term_compare");
  return $terms;
}

// 詳細モーダルの行（見出し => ターム名の配列）を表示順で返す
function works_detail_rows()
{
  return [
    "site" => "ジャンル",
    "animation" => "アニメーション",
  ];
}

// 詳細モーダルに出すターム名をグループ別（site / animation / build）に分けて返す
function works_detail_terms($post_id)
{
  $items = ["site" => [], "animation" => [], "" => [], "build" => []];
  $terms = get_the_terms($post_id, "works_category");
  if (!is_array($terms)) {
    return $items;
  }

  usort($terms, "works_search_term_compare");
  foreach ($terms as $term) {
    $group = works_search_term_group($term);
    if ("recommended" === $group) {
      continue;
    }
    $key = array_key_exists($group, $items) ? $group : "";
    $items[$key][] = $term->name;
  }
  return $items;
}

// 管理画面の制作実績一覧の列（キー => 見出し）。カテゴリーを系統ごとの列に分けて表示する
function works_admin_term_columns()
{
  return [
    "works_recommended" => ["group" => "recommended", "label" => "イチオシ"],
    "works_genre" => ["group" => "site", "label" => "ジャンル"],
    "works_animation" => ["group" => "animation", "label" => "アニメーション"],
    "works_build" => ["group" => "build", "label" => "構築"],
  ];
}

// 一覧の列をタイトルの後ろに追加する
function works_admin_columns($columns)
{
  $new = [];
  foreach ($columns as $key => $label) {
    $new[$key] = $label;
    if ("title" === $key) {
      $new["works_date"] = "制作時期";
      foreach (works_admin_term_columns() as $column_key => $conf) {
        $new[$column_key] = $conf["label"];
      }
    }
  }
  return $new;
}
add_filter("manage_works_posts_columns", "works_admin_columns");

// 各列にその系統のターム名を出す
function works_admin_column_content($column, $post_id)
{
  if ("works_date" === $column) {
    $date = DateTime::createFromFormat("Ymd", (string) get_post_meta($post_id, "works_date", true));
    echo $date ? esc_html($date->format("Y年n月")) : "—";
    return;
  }
  $columns = works_admin_term_columns();
  if (!isset($columns[$column])) {
    return;
  }
  $terms = get_the_terms($post_id, "works_category");
  if (!is_array($terms)) {
    echo "—";
    return;
  }
  usort($terms, "works_search_term_compare");
  $names = [];
  foreach ($terms as $term) {
    if (works_search_term_group($term) === $columns[$column]["group"]) {
      $names[] = $term->name;
    }
  }
  echo $names ? esc_html(implode("、", $names)) : "—";
}
add_action("manage_works_posts_custom_column", "works_admin_column_content", 10, 2);

// 管理画面のカテゴリー欄で使う系統の並び（キー => 表示順）
function works_admin_group_order()
{
  return ["recommended" => 0, "site" => 1, "animation" => 2, "build" => 3, "" => 4];
}

// 管理画面でカテゴリーを取得したとき、系統順 → 系統内の並び順に並べ替える
function works_admin_sort_terms($terms, $taxonomies, $args)
{
  if (!is_admin() || !in_array("works_category", (array) $taxonomies, true)) {
    return $terms;
  }
  if (!is_array($terms) || !$terms || !is_object(reset($terms))) {
    return $terms;
  }
  $order = works_admin_group_order();
  usort($terms, function ($a, $b) use ($order) {
    $group_a = $order[works_search_term_group($a)] ?? PHP_INT_MAX;
    $group_b = $order[works_search_term_group($b)] ?? PHP_INT_MAX;
    return $group_a === $group_b ? works_search_term_compare($a, $b) : $group_a <=> $group_b;
  });
  return $terms;
}
add_filter("get_terms", "works_admin_sort_terms", 10, 3);

// 編集画面のカテゴリー欄で、チェック済みのタームを先頭へ移動させない（並びを固定する）
function works_admin_terms_checklist_args($args)
{
  if (isset($args["taxonomy"]) && "works_category" === $args["taxonomy"]) {
    $args["checked_ontop"] = false;
  }
  return $args;
}
add_filter("wp_terms_checklist_args", "works_admin_terms_checklist_args");

// 管理画面の制作実績一覧で、同じ日時の投稿の並びを ID で固定する（固定しないとページ送りで重複・欠落が出る）
function works_admin_stable_order($query)
{
  if (!is_admin() || !$query->is_main_query() || "works" !== $query->get("post_type")) {
    return;
  }
  $orderby = $query->get("orderby");
  $order = strtoupper((string) $query->get("order")) === "ASC" ? "ASC" : "DESC";
  if (is_array($orderby)) {
    if (!isset($orderby["ID"])) {
      $orderby["ID"] = $order;
      $query->set("orderby", $orderby);
    }
    return;
  }
  if ("works_date" === $orderby) {
    $query->set("meta_key", "works_date");
    $query->set("orderby", ["meta_value" => $order, "ID" => $order]);
    return;
  }
  $key = "" === (string) $orderby ? "date" : (string) $orderby;
  if ("ID" === $key) {
    return;
  }
  $query->set("orderby", [$key => $order, "ID" => $order]);
}
add_action("pre_get_posts", "works_admin_stable_order");

// 制作実績の公開日を制作時期（ACF works_date）の日付に揃える。ステータスは変えない（未来日付でも予約投稿にしない）
function works_sync_post_date_with_works_date($post_id)
{
  if ("works" !== get_post_type($post_id) || wp_is_post_revision($post_id)) {
    return;
  }
  $works_date = (string) get_post_meta($post_id, "works_date", true);
  $date = DateTime::createFromFormat("Ymd H:i:s", $works_date . " 00:00:00", wp_timezone());
  if (!$date) {
    return;
  }
  $local = $date->format("Y-m-d H:i:s");
  if (get_post_field("post_date", $post_id) === $local) {
    return;
  }
  global $wpdb;
  $wpdb->update($wpdb->posts, ["post_date" => $local, "post_date_gmt" => get_gmt_from_date($local)], ["ID" => $post_id]);
  clean_post_cache($post_id);
}
add_action("acf/save_post", "works_sync_post_date_with_works_date", 20);

// 管理画面の制作実績一覧で「制作時期」列を並べ替え可能にする
function works_admin_sortable_columns($columns)
{
  $columns["works_date"] = "works_date";
  return $columns;
}
add_filter("manage_edit-works_sortable_columns", "works_admin_sortable_columns");
