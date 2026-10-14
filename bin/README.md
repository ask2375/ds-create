# bin/ ディレクトリ

WordPress 開発環境のビルドと運用を支援するスクリプト・プラグインを格納しています。  
テーマ名（`{THEME_NAME}`）は `config/project.json` の `themeSlug` が正本です。未作成時のみプロジェクトフォルダ名へフォールバックします。テンプレートは `config/project.json` を同梱しないため、複製先での初回 `yarn wp-start`（`update-wp-config.js`）がフォルダ名から `config/project.json` を生成し、テーマディレクトリ・style.css・テーマ PHP 内の text domain をそのスラッグへ揃えます。

---

## 各スクリプトの役割

| ファイル | 種類 | 役割 |
|----------|------|------|
| `clean-dev-files.js` | CLI | ビルド後のクリーンアップ（`manifest.dev.json` と、manifest に載っていない過去ビルドのハッシュ付き JS/CSS を削除。`yarn build:wp` の最後に自動実行） |
| `create-post.js` | CLI | WordPress に投稿を一括作成（`yarn wp-post:create`） |
| `ensure-admin-user.js` | CLI | 管理ユーザーを `user-0401` / `user-0401` に統一（`yarn wp-user:fix`）。`.wp-env.json` の `lifecycleScripts.afterStart` から `wp-env start` のたびに自動実行され、DB 再作成時に既定値へ戻るのを防ぐ。冪等 |
| `ensure-dev-plugin-state.js` | CLI | 開発中に有効化してはいけないプラグインを無効化（`yarn wp-plugins:dev-state`）。`lifecycleScripts.afterStart` の先頭で自動実行。現在の対象は SiteGuard（有効化すると `/wp-login.php` が 404 になる）。冪等 |
| `ensure-plugin-languages.js` | CLI | 有効化中プラグインの翻訳ファイルを導入（`yarn wp-lang:fix`）。`lifecycleScripts.afterStart` から自動実行され、コンテナ再作成で `wp-content/languages/` が失われた際に復旧する。不足分のみ取得する冪等実装 |
| `export-contents.js` | CLI | DB を `wordpress/uploads/backup.sql` に書き出す（`yarn wp-contents:export`）。`--sanitized`（`yarn wp-contents:export:sanitized`）でユーザー情報を user-0401/user-0401 に正規化しコメント・セッション・transient・secret_key を除去した配布用 SQL を生成 |
| `import-contents.js` | CLI | `wordpress/uploads/backup.sql` から DB を退避後にリセット・インポート（`yarn wp-contents:import`、確認プロンプトあり） |
| `check-env.js` | CLI | Node.js / Yarn の実行環境チェック |
| `init-project.js` | CLI | `config/project.json` を対話作成し、テーマスラッグ・表示名・テキストドメインを設定（`yarn init:project`） |
| `init-wp-options.js` | CLI | **WordPress の中身**の初期設定（オプション・固定ページ・シード投稿）。`--settings-only`（`yarn wp-settings:fix`）ではテーマ有効化とオプション適用（パーマリンクは初回のみ）だけを行い、`lifecycleScripts.afterStart` から `wp-env start` のたびに自動実行される。冪等 |
| `sync-wp-plugins.js` | CLI | 管理画面で追加したプラグインを `.wp-env.json` に同期（`yarn wp-plugins:sync`） |
| `update-wp-config.js` | CLI / Vite Plugin | **テーマまわり・設定ファイル**の同期（.wp-env、style.css、DB のテーマ名） |
| `validate-acf-json.js` | CLI | ACF フィールドグループ JSON の検証（`yarn validate:acf`） |
| `vite-plugin-clean-dev-manifest.js` | Plugin | `manifest.dev.json` の mtime を 5 秒ごとに更新し、dev サーバー終了時に削除する。PHP 側の dev アセット配信の判定材料になる |
| `vite-plugin-convert-images.js` | Plugin | 画像を WebP/AVIF に変換（開発時・ビルド時の両方。src と WordPress 双方へ出力） |
| `vite-plugin-print-wp-url.js` | Plugin | `yarn dev` の起動バナーを WordPress（wp-env）の URL に差し替える。Vite 標準の Local 行（Vite dev サーバー自身のポート）は出力しない |
| `watch-scss-globs.js` | CLI | SCSS の追加・削除を監視し、Vite の glob 展開を促す |

### utils/

| ファイル | 役割 |
|----------|------|
| `paths.js` | プロジェクトルート・テーマ名・よく使うパスの定義 |
| `check-env.js` | Node.js / Yarn の実行環境チェック |
| `logger.js` | ログ出力の統一 |
| `fs-utils.js` | ファイル操作の共通化 |
| `wp-env.js` | wp-env 関連ユーティリティ（起動判定・CLIコンテナ管理） |

---

## wp-init と update-wp-config の違い

| 観点 | **init-wp-options**（`yarn wp-init`） | **update-wp-config**（`yarn update:wp-config`） |
|------|--------------------------------------|-----------------------------------------------|
| **何を扱うか** | **WordPress の「中身」**（DB のオプション・固定ページ・投稿） | **テーマ名まわりと設定ファイル**（.wp-env、style.css、DB のテーマ名） |
| **いつ使うか** | 環境を立ち上げたあと、**初回 or 設定を揃え直したいとき** | プロジェクト名を変えた・テーマディレクトリを揃えたい・**wp-start の前** |
| **前提** | wp-env が **起動済み** | ファイルがあれば **起動前でも** .wp-env / style.css は更新可能。DB 更新だけ起動必須 |
| **設定元** | `config/wp-options.json` | `config/project.json` の `themeSlug`・`wordpress/themes/` の実体 |

**運用のイメージ**

1. **初回 or 環境をきれいにしたいとき**  
   `yarn wp-start` → `yarn wp-init` でタイムゾーン・パーマリンク・フロントページ・シード投稿を適用。
2. **プロジェクト名を変えた・テーマパスを揃えたいとき**  
   `yarn update:wp-config` で .wp-env.json と style.css を更新。必要なら `yarn wp-start` のあと DB のテーマ名も更新される（`--db` はデフォルトで有効）。
3. **毎回の起動**  
   `yarn wp-start` のなかで `update-wp-config.js --wp-env` が実行され、.wp-env のテーマパスが同期される。

---

## 各スクリプトの詳細

### init-project.js

- **実行**: `yarn init:project` または `node bin/init-project.js`
- `config/project.json` に `themeSlug` / `themeName` / `textDomain` を作成する。既に存在する場合、対話実行では上書き確認し、非対話または `--yes` では何もせず終了する。
- 作成後に `yarn update:wp-config` を実行すると、テーマディレクトリ名・style.css・起動中のDBへ反映される。

### create-post.js

- **実行**: `yarn wp-post:create [JSONパス]` または `yarn wp-post:create`（対話）
- WordPress が起動している必要あり。  
- **参照**: [post-data/README.md](../post-data/README.md)

### init-wp-options.js

- **実行**: `yarn wp-init`（フル） / `yarn wp-settings:fix`（`--settings-only`）
- **設定**: `config/wp-options.json`（未指定時はスクリプト内のデフォルト）
- タイムゾーン・日付形式・パーマリンク・フロント/投稿ページ・追加固定ページ・シード投稿を作成。
- **`--settings-only`（テーマ有効化 + オプション適用のみ）**: `.wp-env.json` の `lifecycleScripts.afterStart` の先頭から `wp-env start` のたびに自動実行される。目的は、外観＞テーマの有効テーマを `config/project.json` の `themeSlug` に、管理画面の各種初期値を `config/wp-options.json` の `options` に、毎起動で必ず揃えること。コンテナや DB が作り直されて WordPress 標準テーマ・標準オプションへ戻っても、次の起動で案件の設定に復帰する。パーマリンクは初回の 1 回だけ `config/wp-options.json` の `permalink_structure` / `category_base` / `tag_base` を適用し、オプション `wp_template_permalink_initialized` に適用済みの印を残す。以後の起動では印があるため適用せず、管理画面で変更したパーマリンクを上書きしない（フル実行の `yarn wp-init` は毎回適用する）。新規インストール時の WordPress 既定値「日付と投稿名」が残り続けるのを防ぐため。フロントページ・追加固定ページ・シード投稿はこのモードでは実行しない。起動のたびに走るため、利用者が管理画面で削除した固定ページや投稿が復活したり、フロントページ設定が上書きされたりする副作用を避ける必要があるため。フル実行が必要なときだけ `yarn wp-init` を使う。
- **検索エンジンのインデックス（`blog_public`）**: デフォルトは `0`（管理画面「表示設定」の「検索エンジンがサイトをインデックスしないようにする」にチェックが入った状態）。制作中の開発環境を想定した初期値のため、本番公開時は `1` に戻すこと。
- **1ページに表示する最大投稿数（`posts_per_page`）**: デフォルトは `1`。少ない投稿数でページネーションの動作を確認できるようにするための初期値で、案件に合わせて `config/wp-options.json` で変更する。
- **追加固定ページ（`pages`）**: `config/wp-options.json` の `pages` 配列に指定した固定ページを「無ければ作成」する（デフォルト: お問い合わせページ `contact`）。テンプレートは `page-{slug}.php` がスラッグ一致で自動適用される
- **シード投稿の判定**: `seed_posts_if_empty: true` のとき、公開投稿が無い場合のみシードを実行する。WordPress 標準の「Hello world!」（slug: `hello-world`）は既存投稿として数えず、シード実行時にゴミ箱へ移動する
- **eval-file 方式**:
  - サイト設定・投稿タイトル等のユーザーデータをシェル文字列に埋め込まず、一時JSON（`tmp-init-options.json`）と実行用PHP（`tmp-init-options.php`）を `wordpress/uploads/` に書き出し、`wp eval-file` で実行する（`create-post.js` と同じパターン）
  - Windows（`cmd.exe`）ではシングルクォートを含むシェル文字列の埋め込みが正しく動作しないため、その根本解消を目的とした対応
  - 一時ファイルは実行後に自動削除される（`wordpress/uploads/tmp-init-options.*` は `.gitignore` 済み）
  - パーマリンクの反映はソフトフラッシュ（`flush_rewrite_rules(false)`）。CLIコンテキストでのハードフラッシュは `.htaccess` の `RewriteBase` を壊すため
- **wp-env 11対応**: 
  - `spawnSync`を使用してコマンド実行（`execSync`から変更）
  - CLIコンテナの起動確認・自動起動処理を実装
  - `wp-env start`だけではCLIコンテナが起動しない場合があるため、明示的に起動処理を実行
- **参照**: [doc/WORDPRESS_SETUP.md](../doc/WORDPRESS_SETUP.md)

### import-contents.js

- **実行**: `yarn wp-contents:import [--yes]`
- `wordpress/uploads/backup.sql`（`yarn wp-contents:export` で作成）から DB を復元する。
- DB を共有する場合は `wordpress/uploads/backup.sql` をコミットする。顧客の個人情報・本番ユーザーを含む SQL はコミットせず、配布・共有用は `yarn wp-contents:export:sanitized` で無害化して内容を確認する。
- **確認プロンプト**: DBを完全にリセットしてからインポートするため、実行前に `"yes"` の入力を求める。`--yes` フラグを付けるとスキップ可能（CI等での自動実行向け）。AIエージェントは自分の判断で `--yes` を付けないこと。
- 確認後、reset/import 前に現在の DB を `wordpress/uploads/tmp-pre-import-YYYYMMDD-HHmmss.sql` へ自動退避する。退避に失敗した場合は中断する。
- **前提**:
  - `wordpress/uploads/backup.sql` が存在すること
  - WordPress環境（wp-env）が起動済みであること

### sync-wp-plugins.js

- **実行**: `yarn wp-plugins:sync [--dry-run] [--prune]`
- `wordpress/plugins/` にあるプラグインディレクトリと `.wp-env.json` の `plugins` 配列を比較し、未記載のものを WordPress.org の zip URL として追記する。
- `wordpress/plugins/*` は gitignore されているため、管理画面からインストールしたプラグインは `.wp-env.json` に載せないとクローン先で再現されない。**プラグインを追加・削除したら実行すること**。
- **オプション**:
  - `--dry-run`: 変更内容の表示のみ（書き込みなし）
  - `--prune`: `wordpress/plugins/` に実体がないエントリを配列から削除
- WordPress.org に存在しないプラグイン（有料・カスタム）は警告を出してスキップする。手動で `.wp-env.json` に URL/パスを追記するか、配布物に含めること。
- **優先順位の注意**: `wordpress/themes/{THEME_NAME}/config/plugins.json` が存在する場合、`yarn wp-start` 時に `update-wp-config.js` が `.wp-env.json` の plugins 配列を**その内容で上書き**する。plugins.json を使う運用では `wp-plugins:sync` の結果も plugins.json 側へ反映すること（現状このテンプレートに plugins.json は含まれていないため通常は影響なし）。

### update-wp-config.js

- **実行**: `yarn update:wp-config` または `node bin/update-wp-config.js [--wp-env] [--db] [--style-css]`
- **役割**:
  - `.wp-env.json` のテーマパス（とプラグイン）更新
  - `wordpress/themes/{THEME_NAME}/style.css` の Theme Name 更新
  - 既存テーマディレクトリをプロジェクト名にリネーム
  - （起動中なら）DB の `template` / `stylesheet` オプション更新
- Vite プラグインとしても使用され、ビルド/開発サーバー起動時に style.css を更新。  
- `yarn wp-start` では事前に `--wp-env` が実行される。

### validate-acf-json.js

- **実行**: `yarn validate:acf`
- `wordpress/themes/{THEME_NAME}/acf-json/` 内の JSON を構文・必須キー・キー形式で検証。

### vite-plugin-clean-dev-manifest.js

- **使用**: `vite.config.js` からインポート（`apply: "serve"` のため開発サーバー起動時のみ有効）
- **機能**:
  - dev サーバー稼働中は `wordpress/themes/{THEME_NAME}/manifest.dev.json` の mtime を 5 秒ごとに更新する（heartbeat）
  - dev サーバー終了時に `manifest.dev.json` を削除する。Vite が自前で処理しない SIGINT は当プラグインで受け、削除後に exit 130 で終了する
- **PHP 側との関係**: `functions-lib/func-helpers.php` の `is_vite_dev_server_alive()` が `manifest.dev.json` の mtime を見て、20 秒以内なら dev サーバー稼働中と判定する。稼働中は Vite dev サーバーからアセットを配信し、それ以外はテーマ内のビルド済みアセットを配信する。
- **注意**: 稼働判定に `httpServer` の close イベントは使わない。設定ファイル変更による dev サーバーの再起動でも発火し、稼働中に `manifest.dev.json` が削除されてしまうため。
- **関連**: `bin/clean-dev-files.js` は `yarn build:wp` の後処理として、`manifest.dev.json` の `url` からポートを読み、dev サーバーが停止している場合に同ファイルを削除する。

### vite-plugin-convert-images.js

- **使用**: `vite.config.js` からインポート（開発時・ビルド時の両方で有効）
- **機能**:
  - `src/assets/images/` の PNG/JPEG を WebP/AVIF に変換
  - 変換後を `src/assets/images/` と `wordpress/themes/{THEME_NAME}/assets/images/` の両方に出力
  - **開発時**（`isDev: true`）: 起動時に既存画像を一括変換したうえで、ファイルの追加・変更を監視して都度変換
  - **ビルド時**（`isDev: false`）: `buildStart` で既存画像を一括変換し、完了を待ってからビルドを継続（ファイル監視はしない）。`yarn dev` を一度も実行していなくても `yarn build:wp` だけで最適化画像が生成される
- **設定**:
  - `vite.config.js` の `convertImages({ format: "webp", copyOriginal: false, optimize: {...} })` で形式・元画像コピー有無・品質を指定
- **使用ライブラリ**: Sharp ベースの独自実装（`vite-plugin-image-optimizer` は不使用）

### vite-plugin-print-wp-url.js

- **使用**: `vite.config.js` からインポート（`apply: "serve"` のため開発サーバー起動時のみ有効）
- **機能**:
  - `configureServer` で `server.printUrls` を差し替え、起動バナーに `➜ WordPress: http://localhost:{.wp-env.json の port}/` の 1 行だけを出力する
  - Vite 標準の `Local` / `Network` 行は出力しない
- **背景**: Vite dev サーバーが listen するポートは `.wp-env.json` の `port` から 3000 を引いた値（`bin/utils/paths.js` の `VITE_PORT`）である。このテンプレートは `.wp-env.json` に `port` を持たないため `WP_ENV_PORT` は 8888 にフォールバックし、Vite 側は 5888 になる。複製先で `.wp-env.json` に案件別の `port` を設定すれば、バナーと `server.open` の URL も自動的にその値へ追従する。Vite 側のポートは HMR とアセット配信（`vite.config.js` の `server.origin` と `manifest.dev.json`）のためだけに使うもので、PHP を処理しないためブラウザで開いても WordPress は表示されない。
- **関連設定**: `vite.config.js` の `server.open` にも wp-env の URL（絶対 URL）を指定しており、`yarn dev` で自動的に開かれるのは wp-env 側になる。Vite は `server.open` が絶対 URL の場合、dev サーバーの URL を base とした解決を行っても絶対 URL 側が優先される。

### watch-scss-globs.js

- `src/assets/styles/` の components / layouts / projects / utilities を監視。ファイル追加・削除時に `style.scss` のタイムスタンプを更新し、Vite に glob の再展開を促す。

---

## wp-env.js ユーティリティ関数

`bin/utils/wp-env.js` には以下の関数が定義されています：

- **`isWordPressEnvRunning()`**: WordPress環境（wp-env）が起動しているかどうかを判定
- **`isCliContainerRunning()`**: CLIコンテナが起動しているかどうかを確認
- **`ensureCliContainerRunning()`**: CLIコンテナを確実に起動する（必要に応じて）
  - `wp-env 11`では、`wp-env start`だけではCLIコンテナが起動しない場合があるため、明示的に起動処理を実行
  - 最大60秒のタイムアウトで起動を待機

**注意**: `wp-env` 11を使用している場合、CLIコンテナの起動に時間がかかる場合があります。`yarn wp-init`を実行する前に、`yarn wp-start`でWordPress環境を起動しておくことを推奨します。

---

## 関連ドキュメント

- [README.md](../README.md) — プロジェクト概要・クイックスタート
- [doc/WORDPRESS_SETUP.md](../doc/WORDPRESS_SETUP.md) — WordPress 初期設定・プラグイン
- [post-data/README.md](../post-data/README.md) — 投稿一括作成
- [config/wp-options.json](../config/wp-options.json) — `yarn wp-init` の設定
