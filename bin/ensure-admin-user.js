/**
 * 管理ユーザーの認証情報を user-0401 に統一し、プロフィールの初期値を整える（冪等）
 *
 * @wordpress/env は DB を新規作成するたびに `wp core install` を admin/password で実行する。
 * そのため `wp-env destroy` や `wp-env clean` のあとに `wp-env start` すると、
 * 管理ユーザーが既定値（admin/password）に戻ってしまう。
 * このスクリプトは `.wp-env.json` の lifecycleScripts.afterStart から自動実行され、
 * その差分だけを埋めて常に user-0401 でログインできる状態を保つ。
 *
 * 手動で実行する場合は `yarn wp-user:fix`。
 *
 * 注意: 管理画面からは user_login（ユーザー名）と user_nicename（投稿者スラッグ）を
 * 変更できないため、この矯正は wp-cli 経由でしか行えない。
 *
 * 管理バーの表示可否・管理画面の配色は「初期値」の扱いとし、DB ごとに一度だけ適用する。
 * 起動のたびに上書きすると、ユーザーが管理画面で変更した設定を毎回巻き戻してしまうため
 * （認証情報と違い、これらは変更されて困る値ではない）。
 *
 * 適用済みかどうかは専用の option をセンチネルとして判定する。usermeta の有無では判定できない。
 * WordPress はユーザー作成時に show_admin_bar_front / admin_color を既定値つきで必ず作るため、
 * 「未設定なら書き込む」方式にすると初期値が永久に適用されないため。
 * option は DB と寿命を共にするので、`wp-env destroy` 後の再構築時には改めて適用される。
 */
import { delimiter, resolve } from "path";
import { log, success, error } from "./utils/logger.js";
import { projectRoot } from "./utils/paths.js";
import { runWpCli } from "./utils/wp-env.js";

const MODULE_NAME = "ensure-admin-user";

// runWpCli は `wp-env` コマンドを PATH から解決する。
// yarn 経由なら node_modules/.bin が PATH に入るが、lifecycleScripts.afterStart や
// `node bin/ensure-admin-user.js` の直接実行では入らないため、ここで明示的に追加する。
process.env.PATH = `${resolve(projectRoot, "node_modules/.bin")}${delimiter}${process.env.PATH}`;

// 統一後の管理ユーザー情報。
// シェルと SQL を経由するため、値は英数字とハイフンのみに限定する（エスケープ不要な文字集合）。
const ADMIN_USER_ID = 1;
const TARGET_LOGIN = "user-0401";
const TARGET_PASSWORD = "user-0401";

// プロフィールの初期値（usermeta が未設定のときだけ書き込む）。
// - show_admin_bar_front: フロント側の管理バーを既定で非表示にする
// - admin_color: 管理画面の配色をブルー（WordPress 同梱の "blue" スキーム）にする
const DEFAULT_USER_META = [
  { key: "show_admin_bar_front", value: "false" },
  { key: "admin_color", value: "blue" },
];

// 初期値を適用済みかどうかを記録するセンチネル option。
// DB を作り直すと消えるため、再構築時には初期値が改めて適用される。
const DEFAULTS_APPLIED_OPTION = "wp_template_admin_defaults_applied";

/**
 * 対象ユーザーの現在のプロフィール値を取得する
 * @returns {{user_login: string, user_nicename: string, display_name: string}}
 */
function fetchCurrentProfile() {
  const stdout = runWpCli(["user", "get", String(ADMIN_USER_ID), "--fields=user_login,user_nicename,display_name", "--format=json"]);
  return JSON.parse(stdout.trim());
}

/**
 * 対象ユーザーの現在のニックネーム（usermeta）を取得する
 * @returns {string}
 */
function fetchCurrentNickname() {
  return runWpCli(["user", "meta", "get", String(ADMIN_USER_ID), "nickname"]).trim();
}

/**
 * 現在のパスワードハッシュが TARGET_PASSWORD と一致するかを判定する
 * ハッシュはソルト付きのため、毎回設定し直すとログインセッションが切れる。
 * 一致している場合はパスワード更新をスキップするためにこの判定を行う。
 * @returns {boolean}
 */
function isPasswordCurrent() {
  const php = `'echo wp_check_password("${TARGET_PASSWORD}", get_userdata(${ADMIN_USER_ID})->user_pass) ? "yes" : "no";'`;
  return runWpCli(["eval", php]).trim() === "yes";
}

/**
 * user_login を更新する
 * wp-cli の `wp user update` は user_login を変更できない（WordPress コアの制約）ため、
 * DB を直接更新する。テーブル接頭辞は `wp db prefix` から取得して決め打ちを避ける。
 */
function updateUserLogin() {
  const prefix = runWpCli(["db", "prefix"]).trim();
  runWpCli(["db", "query", `"UPDATE ${prefix}users SET user_login='${TARGET_LOGIN}' WHERE ID=${ADMIN_USER_ID};"`]);
}

/**
 * user_nicename / display_name / nickname を更新する
 */
function updateProfile() {
  runWpCli(["user", "update", String(ADMIN_USER_ID), `--user_nicename=${TARGET_LOGIN}`, `--display_name=${TARGET_LOGIN}`, `--nickname=${TARGET_LOGIN}`, "--skip-email"]);
}

/**
 * パスワードを更新する
 */
function updatePassword() {
  runWpCli(["user", "update", String(ADMIN_USER_ID), `--user_pass=${TARGET_PASSWORD}`, "--skip-email"]);
}

/**
 * プロフィール初期値を適用済みかどうかを判定する
 * @returns {boolean}
 */
function areDefaultsApplied() {
  return runWpCli(["eval", `'echo get_option("${DEFAULTS_APPLIED_OPTION}") ? "yes" : "no";'`]).trim() === "yes";
}

/**
 * プロフィール初期値を書き込み、適用済みとして記録する
 */
function applyDefaultUserMeta() {
  for (const { key, value } of DEFAULT_USER_META) {
    runWpCli(["user", "meta", "update", String(ADMIN_USER_ID), key, value]);
  }
  runWpCli(["option", "update", DEFAULTS_APPLIED_OPTION, "1", "--autoload=no"]);
}

function main() {
  const profile = fetchCurrentProfile();
  const nickname = fetchCurrentNickname();

  const needsLogin = profile.user_login !== TARGET_LOGIN;
  const needsProfile = profile.user_nicename !== TARGET_LOGIN || profile.display_name !== TARGET_LOGIN || nickname !== TARGET_LOGIN;
  const needsPassword = !isPasswordCurrent();

  if (needsLogin) {
    updateUserLogin();
    log(MODULE_NAME, `user_login: ${profile.user_login} → ${TARGET_LOGIN}`);
  }
  if (needsProfile) {
    updateProfile();
    log(MODULE_NAME, `user_nicename / display_name / nickname を ${TARGET_LOGIN} に更新`);
  }
  if (needsPassword) {
    updatePassword();
    log(MODULE_NAME, "パスワードを更新（既存のログインセッションは切断される）");
  }

  if (needsLogin || needsProfile || needsPassword) {
    success(MODULE_NAME, `管理ユーザーを ${TARGET_LOGIN} / ${TARGET_PASSWORD} に統一しました`);
  } else {
    log(MODULE_NAME, `管理ユーザーは既に ${TARGET_LOGIN} に統一済み（変更なし）`);
  }

  if (areDefaultsApplied()) {
    log(MODULE_NAME, "プロフィール初期値は適用済み（以降の変更はユーザーに委ねる）");
    return;
  }

  applyDefaultUserMeta();
  success(MODULE_NAME, `プロフィール初期値を適用: ${DEFAULT_USER_META.map(meta => `${meta.key}=${meta.value}`).join(", ")}`);
}

try {
  main();
} catch (err) {
  // afterStart から実行された場合、exit code 0 で終わると wp-env がこの出力を握り潰す
  // （成功時の出力は --debug 時にしか表示されない）。失敗を握り潰さないため必ず 1 で終了する。
  error(MODULE_NAME, `管理ユーザーの統一に失敗しました。復旧するには 'yarn wp-user:fix' を実行してください。`, err);
  process.exit(1);
}
