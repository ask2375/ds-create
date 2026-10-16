<?php
if (!defined("ABSPATH")) {
  exit();
}

/**
 * func-base
 * WordPressの基本的な機能を設定・追加するための関数群
 *
 * @codex https://wpdocs.osdn.jp/%E9%96%A2%E6%95%B0%E3%83%AA%E3%83%95%E3%82%A1%E3%83%AC%E3%83%B3%E3%82%B9/add_theme_support
 *
 * https://haniwaman.com/functions/
 */
// WordPressのテーマに必要な基本機能をサポートするための設定
function my_setup()
{
  add_theme_support("post-thumbnails"); /* アイキャッチ */
  add_theme_support("automatic-feed-links"); /* RSSフィード */
  add_theme_support("title-tag"); /* タイトルタグ自動生成 */
  add_theme_support("html5", [/* HTML5のタグで出力 */ "comment-form", "comment-list", "gallery", "caption"]);

  // ブロックエディタのスタイルサポートは既定で無効にする。
  //
  // 有効にすると enqueue_editor_styles() がサイト全体の style.css をエディタ内へ流し込む。
  // 本テンプレートの style.css には base/_reset.scss（`* { margin: 0; padding: 0 }` /
  // `ul, ol { list-style: none }`）と base/_base.scss（`body { line-height: 1 }`）が含まれ、
  // これらが WordPress 標準の block-library CSS より後に読み込まれて、ブロック既定の
  // 余白・行間・リストマーカーをすべて打ち消す。
  // 一方で本文装飾を BEM のページ側ラッパー限定（例: `.single-news__body h2`）で書くと、
  // ラッパーが存在しないエディタ（.editor-styles-wrapper）には 1 つも効かない。
  // 結果として「リセットだけが効いて装飾はゼロ」の詰まった編集画面になる。
  //
  // エディタは WordPress 標準の見た目で運用する。フロントと同じ見た目で編集させたい場合は、
  // サイト全体の style.css を流用せず、リセットを含まないエディタ専用スタイルを別途用意して
  // `.editor-styles-wrapper` 配下へマップすること。
  //
  // add_theme_support("editor-styles");
  // enqueue_editor_styles();
}
add_action("after_setup_theme", "my_setup");

/**
 * エディタスタイルを環境に応じて読み込み
 * 環境変数（WP_DEBUG）とmanifestファイルを活用
 */
function enqueue_editor_styles()
{
  $environment = get_asset_environment();

  switch ($environment) {
    case "dev":
      // ============================================
      // 開発環境（Vite開発サーバーから読み込み）
      // WP_DEBUG=true かつ manifest.dev.json存在 かつ localhost
      // ============================================
      enqueue_editor_style_dev();
      break;

    case "manifest":
      // ============================================
      // 本番環境（manifest.jsonを使用）
      // ハッシュ付きファイル名で確実なキャッシュバスティング
      // ============================================
      enqueue_editor_style_from_manifest();
      break;

    case "fallback":
      // ============================================
      // フォールバック（固定ファイル名 + filemtime）
      // manifest.jsonが存在しない場合の安全策
      // ============================================
      enqueue_editor_style_fallback();
      break;
  }
}

/**
 * 開発環境のエディタスタイルを読み込み
 */
function enqueue_editor_style_dev()
{
  $dev_manifest = get_vite_manifest();
  if ($dev_manifest === false || !isset($dev_manifest["url"])) {
    return;
  }

  $baseUrl = $dev_manifest["url"];
  if (isset($dev_manifest["inputs"]["style"])) {
    add_editor_style($baseUrl . $dev_manifest["inputs"]["style"]);
  }
}

/**
 * manifest.jsonを使用した本番環境のエディタスタイルを読み込み
 */
function enqueue_editor_style_from_manifest()
{
  $build_manifest = get_build_manifest();
  if ($build_manifest === false) {
    return;
  }

  $style_entry = $build_manifest["assets/styles/style.scss"] ?? null;
  if ($style_entry && isset($style_entry["file"])) {
    $style_path = get_template_directory_uri() . "/" . $style_entry["file"];
    add_editor_style($style_path);
  }
}

/**
 * フォールバック方式で本番環境のエディタスタイルを読み込み
 * manifest.jsonが存在しない場合の安全策
 */
function enqueue_editor_style_fallback()
{
  $style_path = get_template_directory_uri() . "/assets/styles/style.css";
  $style_file = get_template_directory() . "/assets/styles/style.css";
  $version = get_file_version($style_file);
  // add_editor_style()はバージョンパラメータをサポートしていないため、URLに直接追加
  if ($version !== null) {
    add_editor_style($style_path . "?ver=" . $version);
  } else {
    add_editor_style($style_path);
  }
}

// カスタムページにbodyクラスを追加（汎用化）
function add_custom_page_body_classes($classes)
{
  // フィルターで設定可能なページとクラスのマッピング
  $page_classes = apply_filters("custom_page_body_classes", [
    // 例: 'contact' => 'contact-page'
    // 例: 'about' => 'about-page'
  ]);

  $page_slug = get_post_field("post_name", get_the_ID());

  if (isset($page_classes[$page_slug])) {
    $classes[] = $page_classes[$page_slug];
  }

  return $classes;
}
add_filter("body_class", "add_custom_page_body_classes");

/*
 * 出力を抑制
 */
function disable_output()
{
  // 絵文字を削除することで、レスポンスを上げる
  // https://wp-doctor.jp/blog/2022/08/17/%E3%83%AF%E3%83%BC%E3%83%89%E3%83%97%E3%83%AC%E3%82%B9%E3%81%AE%E9%AB%98%E9%80%9F%E5%8C%96%E3%81%AE%E3%81%9F%E3%82%81%E3%81%AB%E3%80%81%E4%B8%8D%E8%A6%81%E3%81%AA%E7%B5%B5%E6%96%87%E5%AD%97%E3%81%AE/
  remove_action("wp_head", "print_emoji_detection_script", 7);
  remove_action("admin_print_scripts", "print_emoji_detection_script");
  remove_action("wp_print_styles", "print_emoji_styles");
  remove_action("admin_print_styles", "print_emoji_styles");
  remove_filter("the_content_feed", "wp_staticize_emoji");
  remove_filter("comment_text_rss", "wp_staticize_emoji");
  remove_filter("wp_mail", "wp_staticize_emoji_for_email");

  // pタグとbrタグの自動挿入を解除
  // https://www.plusdesign.co.jp/blog/author7c462/86.html
  remove_filter("the_content", "wpautop");
}

add_action("init", "disable_output");

// Contact Form 7で自動挿入されるPタグ、brタグを削除
// https://junpei-sugiyama.com/contact-form7-autop/
add_filter("wpcf7_autop_or_not", "wpcf7_autop_return_false");
function wpcf7_autop_return_false()
{
  return false;
}

/*
 * 管理画面の固定ページ一覧にスラッグ列を追加
 * タイトル列の直後に挿入する
 */
function add_page_slug_column($columns)
{
  $new_columns = [];
  foreach ($columns as $key => $label) {
    $new_columns[$key] = $label;
    if ($key === "title") {
      $new_columns["page_slug"] = "スラッグ";
    }
  }
  return $new_columns;
}
add_filter("manage_pages_columns", "add_page_slug_column");

function render_page_slug_column($column_name, $post_id)
{
  if ($column_name === "page_slug") {
    echo esc_html(urldecode(get_post_field("post_name", $post_id)));
  }
}
add_action("manage_pages_custom_column", "render_page_slug_column", 10, 2);

function add_noindex_robots($robots)
{
  $robots["noindex"] = true;
  $robots["nofollow"] = true;
  $robots["noarchive"] = true;
  return $robots;
}
add_filter("wp_robots", "add_noindex_robots");

function send_noindex_header()
{
  header("X-Robots-Tag: noindex, nofollow, noarchive", true);
}
add_action("send_headers", "send_noindex_header");

function allow_crawl_robots_txt($output)
{
  return "User-agent: *\nDisallow:\n";
}
add_filter("robots_txt", "allow_crawl_robots_txt");
