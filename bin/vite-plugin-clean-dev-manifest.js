/**
 * manifest.dev.json の管理（dev サーバー稼働中は mtime を 5 秒ごとに更新し、終了時に削除する）
 * PHP 側（functions-lib/func-helpers.php）は mtime が 20 秒以内なら dev サーバー稼働中と判定する。
 * Vite は SIGTERM / stdin end を server.close() → process.exit() で処理するため exit で拾い、
 * Vite が処理しない SIGINT はここで受ける。httpServer の close は設定変更の再起動でも発火するため使わない。
 */
import { existsSync, unlinkSync, utimesSync } from "node:fs";
import { join } from "node:path";

const HEARTBEAT_MS = 5000;

export default function cleanDevManifest({ themeDir }) {
  const manifestPath = join(themeDir, "manifest.dev.json");
  let registered = false;
  let timer = null;

  const heartbeat = () => {
    try {
      if (existsSync(manifestPath)) {
        const now = new Date();
        utimesSync(manifestPath, now, now);
      }
    } catch {
      /* noop */
    }
  };

  const cleanup = () => {
    if (timer) clearInterval(timer);
    try {
      if (existsSync(manifestPath)) unlinkSync(manifestPath);
    } catch {
      /* noop */
    }
  };

  return {
    name: "clean-dev-manifest",
    apply: "serve",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        if (registered) return;
        registered = true;
        timer = setInterval(heartbeat, HEARTBEAT_MS);
        timer.unref();
        process.once("exit", cleanup);
        process.once("SIGINT", () => {
          cleanup();
          process.exit(130);
        });
      });
    },
  };
}
