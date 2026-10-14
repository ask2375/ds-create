<?php
if (!defined("ABSPATH")) {
  exit();
}

/**
 * テーマ設定
 */
// Adobe Fonts の Web プロジェクト ID（例: "ifh1pjk"）。空文字なら読み込みタグを出力しない
define("ADOBE_FONTS_KIT_ID", "");

/**
 * Functions
 */
// 共通ヘルパー関数
get_template_part("functions-lib/func-helpers");

// スクリプトとスタイルの読み込み
get_template_part("functions-lib/func-enqueue");

// プラグイン管理（TGMPA）
get_template_part("functions-lib/func-plugins");

// ACF設定
get_template_part("functions-lib/func-acf");

// 基本設定
get_template_part("functions-lib/func-base");

// セキュリティー対応
get_template_part("functions-lib/func-security");

// コメント機能の無効化
get_template_part("functions-lib/func-comments");

// URLのショートカット設定
get_template_part("functions-lib/func-url");

// デフォルト投稿タイプのラベル変更
get_template_part("functions-lib/func-add-posttype-post");

// 制作実績（works）の投稿タイプ・絞り込み検索
get_template_part("functions-lib/func-add-posttype-works");

// 構造化データの設定（汎用化済み）
get_template_part("functions-lib/func-structured-data");
