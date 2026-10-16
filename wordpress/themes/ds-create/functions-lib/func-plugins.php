<?php
if (!defined("ABSPATH")) {
  exit();
}

/**
 * TGM Plugin Activation設定
 * 推奨・必須プラグインのインストールを促す
 */

// TGMPAライブラリの読み込み
require_once dirname(__FILE__) . "/lib/class-tgm-plugin-activation.php";

add_action("tgmpa_register", "my_theme_register_required_plugins");

/**
 * 必須プラグインの登録
 */
function my_theme_register_required_plugins()
{
  /*
   * プラグイン情報の配列
   *
   * wp-build スキルの標準プラグイン 12 個と一致させている。
   * スラッグを変更する場合は、プロジェクトルートの `.wp-env.json` の plugins も
   * 必ず同時に更新すること（片方だけ直すとローカル環境と推奨通知の構成がずれる）。
   * required は wp-build の「必須度」に対応し、高 = true / 中 = false とする。
   */
  $plugins = [
    [
      "name" => "Advanced Custom Fields",
      "slug" => "advanced-custom-fields",
      "required" => true,
    ],
    [
      "name" => "Breadcrumb NavXT",
      "slug" => "breadcrumb-navxt",
      "required" => true,
    ],
    [
      "name" => "Contact Form 7",
      "slug" => "contact-form-7",
      "required" => true,
    ],
    [
      "name" => "Custom Post Type UI",
      "slug" => "custom-post-type-ui",
      "required" => true,
    ],
    [
      "name" => "Yoast Duplicate Post",
      "slug" => "duplicate-post",
      "required" => false,
    ],
    [
      "name" => "EWWW Image Optimizer",
      "slug" => "ewww-image-optimizer",
      "required" => false,
    ],
    [
      "name" => "SEO SIMPLE PACK",
      "slug" => "seo-simple-pack",
      "required" => true,
    ],
    [
      "name" => "SiteGuard WP Plugin",
      "slug" => "siteguard",
      "required" => true,
    ],
    [
      "name" => "SVG Support",
      "slug" => "svg-support",
      "required" => false,
    ],
    [
      "name" => "WP Multibyte Patch",
      "slug" => "wp-multibyte-patch",
      "required" => true,
    ],
    [
      "name" => "WPvivid Backup & Restore",
      "slug" => "wpvivid-backuprestore",
      "required" => false,
    ],
    [
      "name" => "XML Sitemap & Google News",
      "slug" => "xml-sitemap-feed",
      "required" => true,
    ],
  ];

  /*
   * 設定配列
   */
  $config = [
    "id" => "tgmpa", // ユニークID
    "default_path" => "", // デフォルトのパス
    "menu" => "tgmpa-install-plugins", // メニュースラッグ
    "parent_slug" => "themes.php", // 親メニュースラッグ
    "capability" => "edit_theme_options", // 権限
    "has_notices" => true, // 管理画面の通知を表示するか
    "dismissable" => true, // 通知を非表示にできるか
    "dismiss_msg" => "", // 非表示時のメッセージ
    "is_automatic" => false, // 自動的に有効化するか
    "message" => "", // 追加メッセージ
  ];

  tgmpa($plugins, $config);
}
