/**
 * 有効化中プラグインの翻訳ファイル（言語パック）を導入する（冪等）
 *
 * `.wp-env.json` の plugins は downloads.wordpress.org の zip から取得されるが、
 * この zip に翻訳ファイルは同梱されていない（translate.wordpress.org から別途取得する仕組み）。
 * そのため管理画面のサイドバーは日本語なのに、プラグインの設定画面だけ英語のまま、という状態になる。
 * さらに `wp-content/languages/` は `.wp-env.json` の mappings 対象外でコンテナ内にしか存在しないため、
 * `wp-env destroy` すると導入済みの翻訳も消える。
 *
 * このスクリプトは `.wp-env.json` の lifecycleScripts.afterStart から自動実行され、
 * 不足している言語パックだけを補う。手動で実行する場合は `yarn wp-lang:fix`。
 *
 * 注意: `wp language plugin list` の status は、サイトのロケールと一致する行を
 * インストール状況に関係なく "active" と表示する。導入済み判定には使えないため、
 * ここでは翻訳ファイル（.mo）の実在を直接確認している。
 */
import { delimiter, resolve } from "path";
import { log, success, error } from "./utils/logger.js";
import { projectRoot } from "./utils/paths.js";
import { runWpCli } from "./utils/wp-env.js";

const MODULE_NAME = "ensure-plugin-languages";

// runWpCli は `wp-env` コマンドを PATH から解決する。
// yarn 経由なら node_modules/.bin が PATH に入るが、lifecycleScripts.afterStart や
// `node bin/ensure-plugin-languages.js` の直接実行では入らないため、ここで明示的に追加する。
process.env.PATH = `${resolve(projectRoot, "node_modules/.bin")}${delimiter}${process.env.PATH}`;

// 翻訳が不要なロケール（WordPress 本体が英語で書かれているため言語パックが存在しない）
const UNTRANSLATED_LOCALES = ["en_US"];

// 有効化中プラグインのうち、現在のロケールの .mo が無いものを列挙する PHP。
// wp-cli へはシェルのシングルクォートで包んで渡すため、PHP 側の文字列は必ずダブルクォートで書く。
// また `${...}` 形式は JS のテンプレートリテラル補間と衝突するため、文字列連結で組み立てる。
const DETECT_PHP = [
  'require_once ABSPATH . "wp-admin/includes/plugin.php";',
  "$locale = get_locale();",
  "$missing = [];",
  'foreach ((array) get_option("active_plugins", []) as $file) {',
  "  $slug = dirname($file);",
  '  if ($slug === ".") { $slug = basename($file, ".php"); }',
  '  if (!file_exists(WP_LANG_DIR . "/plugins/" . $slug . "-" . $locale . ".mo")) { $missing[] = $slug; }',
  "}",
  'echo json_encode(["locale" => $locale, "missing" => array_values(array_unique($missing))]);',
].join(" ");

/**
 * 現在のロケールと、言語パックが不足しているプラグインのスラッグを取得する
 * @returns {{locale: string, missing: string[]}}
 */
function detectMissingLanguages() {
  const stdout = runWpCli(["eval", `'${DETECT_PHP}'`]);
  return JSON.parse(stdout.trim());
}

/**
 * 指定プラグインの言語パックを導入する
 * @param {string} slug
 * @param {string} locale
 * @returns {boolean} 導入できたかどうか
 */
function installLanguage(slug, locale) {
  try {
    runWpCli(["language", "plugin", "install", slug, locale]);
    return true;
  } catch {
    // translate.wordpress.org に当該ロケールの翻訳が存在しないプラグインは失敗する。
    // 翻訳の欠落は表示上の問題にとどまるため、ここでは全体を止めずに未導入として扱う。
    return false;
  }
}

function main() {
  const { locale, missing } = detectMissingLanguages();

  if (UNTRANSLATED_LOCALES.includes(locale)) {
    log(MODULE_NAME, `ロケールが ${locale} のため言語パックの導入をスキップ`);
    return;
  }

  if (missing.length === 0) {
    log(MODULE_NAME, `有効化中プラグインの ${locale} 翻訳はすべて導入済み（変更なし）`);
    return;
  }

  log(MODULE_NAME, `${locale} 翻訳が未導入のプラグイン: ${missing.join(", ")}`);

  const installed = [];
  const unavailable = [];
  for (const slug of missing) {
    if (installLanguage(slug, locale)) {
      installed.push(slug);
    } else {
      unavailable.push(slug);
    }
  }

  if (installed.length > 0) {
    success(MODULE_NAME, `${locale} 翻訳を導入: ${installed.join(", ")}`);
  }
  if (unavailable.length > 0) {
    // 翻訳が公開されていないプラグインは毎回この一覧に載る（導入しようがないため）
    log(MODULE_NAME, `${locale} 翻訳が公開されていないため未導入: ${unavailable.join(", ")}`, "warn");
  }
}

try {
  main();
} catch (err) {
  // afterStart から実行された場合、exit code 0 で終わると wp-env がこの出力を握り潰す
  // （成功時の出力は --debug 時にしか表示されない）。失敗を握り潰さないため必ず 1 で終了する。
  error(MODULE_NAME, `言語パックの導入に失敗しました。復旧するには 'yarn wp-lang:fix' を実行してください。`, err);
  process.exit(1);
}
