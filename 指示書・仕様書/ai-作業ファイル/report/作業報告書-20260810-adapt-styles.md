# 作業報告書 — SCSS 基盤の CodeUps テンプレート構成への移植

## 案件情報

| 項目 | 内容 |
|---|---|
| 対象 | wp-template_v2.0（Vite + WordPress テンプレート） |
| ルート | /Users/s.d./Desktop/Web制作案件/01_環境構築ファイル・その他ファイル/vite/vite_WordPress/改良版/wp-template_v2.0 |
| 実施日 | 2026-08-10 |
| 使用スキル | adapt-styles |
| 参照プロジェクト | alias-carnival（層構成・命名規則）／ CodeUps template-html-main（ブレークポイントとリキッドレイアウト） |
| 作業ブランチ | feat/codeups-scss-migration（復元点: main の d969cfc） |

## 完了した作業

### Phase 1: global 層の差し替え

- `global/_function.scss` を新規作成し、`rem()` `vw()` `strip-unit()` を移植した。
- `global/_setting.scss` を新規作成し、インナー幅・余白・フォント・ウェイト・色・z-index・ヘッダー高さ・三角形の clip-path・`maxrem()` を SCSS 変数として定義した。色は参照元の命名規則（`$色名_#hex`）に従い、値はテンプレート既存のものを引き継いだ。
- `global/_breakpoints.scss` を CodeUps 版に置き換えた（`$startFrom` / `$mediaquerys` / `mq()`）。ブレークポイントの sm を 600 から 375 に変更した。
- `global/_index.scss` を `@forward "function", "setting", "breakpoints"` に更新し、旧 `_variables.scss` を削除した。

### Phase 2: base 層への移行

- `foundation/` を `base/` にリネームした。
- `base/_reset.scss` を参照元の自前リセット 379 行に差し替えた。これに伴い `kiso.css` の import（`src/assets/js/script.js`）と `package.json` の依存を削除した。
- `base/_base.scss` を CodeUps 版のリキッドレイアウト対応（`$startFrom` 分岐による html の font-size 切り替え）に置換し、テンプレート固有の指定（`textarea { field-sizing: content }`、`img, svg { vertical-align: middle }`、`a:hover`、`@font-face` の Local Noto Sans JP）をマージした。

### Phase 3: 層の再配置

- `components/_c-*` `projects/_p-*` の 20 ファイルを `module/` へプレフィックスを外して移動した。
- `layouts/_l-inner.scss` を CodeUps の `module/_inner.scss`（`$startFrom` 分岐）に置換した。
- `layouts/_l-header.scss` `_l-main.scss` を `page/_layout.scss` へ統合し、CodeUps の `.l-lower` を追加した。
- `utilities/` の 4 ファイルを `page/_utility.scss` と `page/_text.scss` へ統合した。CodeUps 版のユーティリティ（`.mt-1〜200`、`.mt-pc-*`、`.mt-sp-*`、`.pc-none`、`.sp-none`、`.br-*`、`.sr-only`）を全面採用した。未使用だった `[data-only-device]` と `.u-text__*` は CodeUps 版に置き換えた。

### Phase 4: 変数と単位の移行

- `calc(N * var(--to-rem))` 461 箇所を `rem(N)` へ置換した。
- グローバル CSS カスタムプロパティ（色・フォント・ウェイト・duration・z-index・ヘッダー高さ・inner・clip-path）を全廃し SCSS 変数へ移行した。
- `--header-height` の mq 内再定義は `height: rem(strip-unit($header-height-pc))` に書き換えた。
- コンポーネントローカル変数（`--_form-color-*` `--_pagination-*` `--_card-widht`）は、`_news-list.scss` が `--_pagination-*` を 8 個上書きしてページネーションの配色を変える設計になっているため、CSS カスタムプロパティのまま維持した。値の側だけ `#{$scss変数}` の補間に書き換えた。
- 未定義のまま 13 箇所で使われていた `--color-border-gray` に `$gray_808080` を新設して割り当てた。

### Phase 5: マークアップ側のクラス名

- HTML 2 ファイル・PHP 41 ファイル・JS 2 ファイルから FLOCSS プレフィックス `c-` `p-` `u-` を除去した。
- レイアウト用の `l-header` `l-main` は参照元プロジェクトの慣例に従い維持し、`l-inner` のみ `inner` に統一した。
- SCSS に定義のなかった `p-page__*`（page.php の 4 箇所）は `page__*` に揃えた。

### Phase 6: ビルド設定

- `style.scss` を `@use "base/**"` `@use "page/**"` `@use "module/**"` に書き換えた。
- `bin/watch-scss-globs.js` の `TARGET_DIRS` を `base` `page` `module` に更新した。
- `.stylelintrc` に参照元と同じ 3 ルールの無効化（`scss/dollar-variable-pattern`、`font-family-no-duplicate-names`、`no-duplicate-selectors`）を追加した。
- `vite.config.js` と `bin/utils/paths.js` はディレクトリ名 `styles/` を維持したため変更不要であることを確認した。

## 検証結果

### ビルド

- `yarn build:wp` 成功。出力 `style.COPHK22r.css` 64.16 kB（gzip 10.54 kB）。
- `yarn format:check` で stylelint / eslint / prettier いずれも指摘ゼロ。

### 出力 CSS の実測

- 未解決の `var(--)`（グローバル変数由来）はゼロ。
- コンポーネントローカル変数は正しく展開されていることを確認（`--_form-color-text: #0d2936`、`--_pagination-bg-hover: oklch(from #f0f0f0 l c h/50%)`）。
- rem 単位の出力 1077 箇所。`.mt-*` は 200 クラス生成。
- リセット CSS の出力を確認（`html{box-sizing:border-box;word-break:normal;tab-size:4;...}`）。

### DOM 実測（Playwright、http://localhost:5174/）

| 計測項目 | 375px | 1000px | 1440px |
|---|---|---|---|
| html font-size | 16px | 13.3333px | 16px |
| .inner の実幅 | 375px | 1000px | 1250px |
| .inner の padding-left | 20px | 20.8333px | 25px |
| .l-main の margin-top | 64px | 66.6667px | 80px |
| .header の実高 | 64px | 66.65625px | 80px |
| 横溢れ（scrollWidth - clientWidth） | 0 | 0 | 0 |

CodeUps のリキッドレイアウト仕様（375px 以下と 768〜1199px で vw 連動、それ以外は 16px 固定）どおりに動作している。

### コンソール

- エラーは favicon.ico の 404 のみ。移植とは無関係。

### スクリーンショット比較

- 移植前（main）と移植後（feat ブランチ）の PC 1440px / SP 375px を撮影して比較した。レイアウト破綻はなし。差分はインナー幅が 1120px から 1250px に広がったことによるテキストの折り返し位置のみ。
- 比較用の移植前スクリーンショットは判定後に削除した。移植後の 2 枚は `指示書・仕様書/ai-作業ファイル/screenshots/verify-scss-migration-{pc,sp}.png` に残している。

### 規約照合（rules-validator）

指摘 38 件（Critical 11 / Important 27）。**全件が移植前から存在していた既存違反**であることを `git show main:` で確認済み。今回の移植で新規に作り込んだ違反はゼロ。

- Critical: `border: rem(1)` 6 箇所（`_single.scss`）、`max-width` に `width: 100%` の併記なし 5 箇所（`_archive` `_single` `_dev-notice` `_form` `_error`）
- Important: `padding` ショートハンド 26 箇所（`_button` `_header` `_footer` `_form` `_news-list` `_pagination` `_search-form` `_works` `_skip-link` `_archive` `_single`）、`.single__back` が `_archive.scss` に置かれている 1 件

移植前は `border: calc(1 * var(--to-rem))` `padding: calc(14 * var(--to-rem)) calc(60 * var(--to-rem))` という表記で同じ違反が存在していた。今回の変換で表記が `rem()` に変わっただけで、違反の実体は変わっていない。

## 残タスク

1. 上記の既存規約違反 38 件の修正可否をユーザーに確認する（今回の指示範囲外のため未着手）。
2. `yarn install` を実行して `kiso.css` を node_modules から実際に削除する（package.json からの除去のみ実施済み）。
3. WordPress 側（wp-env）での表示確認は未実施。静的側（Vite dev サーバー）でのみ検証した。
4. 作業ブランチ `feat/codeups-scss-migration` の main へのマージは未実施。ユーザー承認待ち。

## 改修した Skills / memory

なし。

## 次回着手時のセルフチェック

- [ ] `git branch --show-current` で `feat/codeups-scss-migration` にいることを確認する。
- [ ] インナー幅がテンプレート既存の 1080px から CodeUps の 1200px に変わっている。案件で 1080px に戻す場合は `global/_setting.scss` の `$inner` を変更する。
- [ ] ブレークポイント sm が 600px から 375px に変わっている。`@include mq(sm)` を使っている箇所があれば影響を確認する。
- [ ] `.mt-1〜200` などの大量生成ユーティリティが CSS サイズを押し上げている。案件で不要なら `page/_utility.scss` の `@for` ループを削る。
- [ ] コンポーネントローカル変数（`--_` プレフィックス）は CSS カスタムプロパティのまま。SCSS 変数と混在しているので、値を変える際は定義箇所（`_form.scss` 冒頭、`_pagination.scss` 冒頭、`_news-list.scss` の 161 行付近）を確認する。
