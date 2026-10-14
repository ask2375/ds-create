/**
 * 共通のパス解決ユーティリティ
 */
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve, dirname, sep } from "path";
import { resolveThemeConfig, validateThemeSlug } from "./project-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// プロジェクトルート（bin/ の親ディレクトリ）
export const projectRoot = resolve(__dirname, "..", "..");

// テーマ名（config/project.json の themeSlug を正本にし、未作成時のみフォルダ名へフォールバック）
export const THEME_NAME = resolveThemeConfig().themeSlug;

export { validateThemeSlug };

// よく使うパス
export const paths = {
  wpEnvConfig: resolve(projectRoot, ".wp-env.json"),
  wpEnvOverrideConfig: resolve(projectRoot, ".wp-env.override.json"),
  styleCss: resolve(projectRoot, `wordpress/themes/${THEME_NAME}/style.css`),
  wpThemesDir: resolve(projectRoot, `wordpress/themes/${THEME_NAME}`),
  themeDir: resolve(projectRoot, `wordpress/themes/${THEME_NAME}`), // wpThemesDirのエイリアス
  wpImagesDir: resolve(projectRoot, `wordpress/themes/${THEME_NAME}/assets/images`),
  srcImagesDir: resolve(projectRoot, "src/assets/images"),
  styleScss: resolve(projectRoot, "src/assets/styles/style.scss"),
};

// wp-env のポート（.wp-env.json の port。未設定時は 8888）
export const WP_ENV_PORT = readWpEnvPort();

// Vite dev サーバーのポート（wp-env ポート - 3000。案件ごとに固定）
export const VITE_PORT = WP_ENV_PORT - 3000;

function readWpEnvPort() {
  try {
    const port = Number(JSON.parse(readFileSync(paths.wpEnvConfig, "utf8")).port);
    if (Number.isInteger(port) && port > 0) return port;
  } catch {
    /* noop */
  }
  return 8888;
}

/**
 * OS依存のパス区切り文字（Windowsの `\`）を POSIX 形式の `/` に変換する
 * glob / chokidar のパターンとして絶対パスを埋め込む際、Windows のバックスラッシュが
 * パターンとして正しく解釈されない問題を防ぐために使用する
 * @param {string} p - 変換対象のパス
 * @returns {string} POSIX形式に変換されたパス
 */
export function toPosixPath(p) {
  return p.split(sep).join("/");
}
