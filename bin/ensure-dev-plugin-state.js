/**
 * 開発環境で有効化してはいけないプラグインを無効化する（冪等）
 *
 * @wordpress/env は `.wp-env.json` の plugins を起動のたびに自動で有効化する。
 * しかし SiteGuard WP Plugin は有効化した時点でログイン URL 変更・画像認証・
 * ログインロックが既定 ON になり、`/wp-login.php` が 404 になってローカルの
 * 管理画面に入れなくなる（wp-build スキルの `references/default-plugins.md` および
 * `references/plugin-init-settings.md` が「install + activate の直後に deactivate する」と
 * 指示しているのはこのため）。
 *
 * プラグイン自体は本番公開直前に有効化する運用のため `.wp-env.json` には残し、
 * ローカルでは起動のたびに無効化してログインを守る。
 *
 * 手動で実行する場合は `yarn wp-plugins:dev-state`。
 */
import { delimiter, resolve } from "path";
import { log, success, error } from "./utils/logger.js";
import { projectRoot } from "./utils/paths.js";
import { runWpCli } from "./utils/wp-env.js";

const MODULE_NAME = "ensure-dev-plugin-state";

// runWpCli は `wp-env` コマンドを PATH から解決する。
// yarn 経由なら node_modules/.bin が PATH に入るが、lifecycleScripts.afterStart や
// `node bin/ensure-dev-plugin-state.js` の直接実行では入らないため、ここで明示的に追加する。
process.env.PATH = `${resolve(projectRoot, "node_modules/.bin")}${delimiter}${process.env.PATH}`;

// 開発環境では常に無効化しておくプラグイン。
// slug は `.wp-env.json` の plugins に含まれるものと一致させること。
const DEACTIVATE_ON_DEV = [
  {
    slug: "siteguard",
    reason: "有効化するとログイン URL が変更され /wp-login.php が 404 になるため",
  },
];

/**
 * インストール済みプラグインの有効・無効状態を取得する
 * @returns {Map<string, string>} slug -> status（active / inactive など）
 */
function fetchPluginStatuses() {
  const stdout = runWpCli(["plugin", "list", "--fields=name,status", "--format=json"]);
  const list = JSON.parse(stdout.trim());
  return new Map(list.map(plugin => [plugin.name, plugin.status]));
}

function main() {
  const statuses = fetchPluginStatuses();
  const deactivated = [];

  for (const { slug, reason } of DEACTIVATE_ON_DEV) {
    const status = statuses.get(slug);

    if (status === undefined) {
      // `.wp-env.json` から外された場合など。無効化すべき対象が無いだけなので正常扱いとする
      continue;
    }
    if (status !== "active") {
      continue;
    }

    runWpCli(["plugin", "deactivate", slug]);
    deactivated.push(slug);
    log(MODULE_NAME, `${slug} を無効化（${reason}）`);
  }

  if (deactivated.length === 0) {
    log(MODULE_NAME, "開発環境で無効化すべきプラグインはすべて無効（変更なし）");
    return;
  }

  success(MODULE_NAME, `無効化しました: ${deactivated.join(", ")}`);
}

try {
  main();
} catch (err) {
  // afterStart から実行された場合、exit code 0 で終わると wp-env がこの出力を握り潰す
  // （成功時の出力は --debug 時にしか表示されない）。失敗を握り潰さないため必ず 1 で終了する。
  error(MODULE_NAME, `プラグイン状態の調整に失敗しました。復旧するには 'yarn wp-plugins:dev-state' を実行してください。`, err);
  process.exit(1);
}
