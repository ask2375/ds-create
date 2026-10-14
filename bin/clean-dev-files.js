#!/usr/bin/env node

/**
 * 本番環境用ビルド後のクリーンアップスクリプト
 * - 現在の manifest に載っていない JS/CSS を削除（テーマ直下が outDir のため
 *   Vite の emptyOutDir が使えず、放置すると成果物が溜まり続けるため）
 *
 * エントリの JS/CSS はファイル名を固定しているため通常は上書きされる。
 * 動的 import のチャンク（ハッシュ付き）やエントリ名を変えたときに不要ファイルが残るので、
 * その掃除としてこの処理を残している。
 *
 * manifest.dev.json は dev サーバーが稼働中の場合は削除しない（2026-08-21 変更・k-s-enterprise 案件の実害から）。
 * 稼働中に削除すると、その時点で WordPress の環境判定（func-helpers.php の is_vite_dev_mode）が
 * dev → 本番アセット配信に落ち、yarn dev を再起動するまで SCSS / JS の保存が localhost:8888 に
 * 反映されなくなるため。稼働判定は manifest 記載 URL への実接続で行う。
 * dev サーバー停止中に残っているものは、yarn dev 停止時の自動削除（vite-plugin-dev-manifest の
 * clearOnClose）が concurrently 経由の起動では機能しない（2026-09-04 実測）ことによる残骸のため削除する。
 * 本番サーバーへ誤って残っても、dev 判定は WP_DEBUG=true かつ localhost も必要なため誤発火しない。
 * FTP デプロイスクリプトを導入する案件では、manifest.dev.json をアップロード除外リストに
 * 加えること（本テンプレートの bin/deploy.mjs は LOCAL_EXCLUDE で除外済み）。
 *
 * .vite/（ビルド成果物の manifest）は旧チャンク掃除で使い終わった後に削除する（2026-09-04 変更）。
 * FTP 以外の経路（WPvivid・手動アップロード）でも本番へ持ち出さないため。
 * 無くても func-helpers.php の fallback 経路が同一アセットを読む（エントリが script.js 1 本のため）。
 * src/assets/js/ に "_" 始まり以外のエントリを追加したら fallback は script.js しか読まないため、
 * この削除をやめて .vite を配布する（deploy.mjs の LOCAL_EXCLUDE からも外す）こと。
 */

import { existsSync, rmSync, unlinkSync, statSync, readdirSync, readFileSync } from "fs";
import { connect } from "net";
import { join } from "path";
import { paths, VITE_PORT } from "./utils/paths.js";
import { log, success, error } from "./utils/logger.js";

const themeDir = paths.themeDir;

// 削除対象のファイル（現在は無し。manifest.dev.json と .vite の扱いはファイル冒頭コメント参照）
const filesToRemove = [];

log("clean-dev-files", `クリーンアップを開始: ${themeDir}`);

let removedCount = 0;

// ファイル・ディレクトリを削除
filesToRemove.forEach(path => {
  if (existsSync(path)) {
    try {
      const stats = statSync(path);
      if (stats.isDirectory()) {
        // ディレクトリの場合は再帰的に削除
        rmSync(path, { recursive: true, force: true });
        removedCount++;
        success("clean-dev-files", `削除: ${path}/ (ディレクトリ)`);
      } else {
        // ファイルの場合は削除
        unlinkSync(path);
        removedCount++;
        success("clean-dev-files", `削除: ${path}`);
      }
    } catch (err) {
      error("clean-dev-files", `削除失敗: ${path} - ${err.message}`);
    }
  }
});

// 古いハッシュ付きビルド成果物の削除（現在の manifest に載っていない JS/CSS）
const manifestPath = join(themeDir, ".vite", "manifest.json");
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const referenced = new Set();
    Object.values(manifest).forEach(entry => {
      if (entry.file) referenced.add(entry.file);
      (entry.css || []).forEach(file => referenced.add(file));
      (entry.assets || []).forEach(file => referenced.add(file));
    });

    ["assets/js", "assets/styles"].forEach(dir => {
      const absDir = join(themeDir, dir);
      if (!existsSync(absDir)) return;
      readdirSync(absDir).forEach(file => {
        const relPath = `${dir}/${file}`;
        if (referenced.has(relPath)) return;
        try {
          unlinkSync(join(absDir, file));
          removedCount++;
          success("clean-dev-files", `旧ビルド成果物を削除: ${relPath}`);
        } catch (err) {
          error("clean-dev-files", `削除失敗: ${relPath} - ${err.message}`);
        }
      });
    });
  } catch (err) {
    log("clean-dev-files", `manifest の読み込みに失敗（旧成果物の削除をスキップ）: ${err.message}`, "warn");
  }
}

const viteDir = join(themeDir, ".vite");
if (existsSync(viteDir)) {
  try {
    rmSync(viteDir, { recursive: true, force: true });
    removedCount++;
    success("clean-dev-files", "ビルド成果物 manifest を削除: .vite/");
  } catch (err) {
    error("clean-dev-files", `削除失敗: .vite/ - ${err.message}`);
  }
}

const devManifestPath = join(themeDir, "manifest.dev.json");
if (existsSync(devManifestPath)) {
  let devHost = "localhost";
  let devPort = VITE_PORT;
  try {
    const devUrl = new URL(JSON.parse(readFileSync(devManifestPath, "utf8")).url);
    devHost = devUrl.hostname || devHost;
    devPort = Number(devUrl.port) || devPort;
  } catch {
    /* noop */
  }

  const devServerAlive = await new Promise(resolve => {
    const socket = connect({ host: devHost, port: devPort });
    socket.setTimeout(1000);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });

  if (devServerAlive) {
    log("clean-dev-files", `dev サーバー稼働中（${devHost}:${devPort}）のため manifest.dev.json は削除しません`);
  } else {
    try {
      unlinkSync(devManifestPath);
      removedCount++;
      success("clean-dev-files", "dev サーバー停止中の残骸を削除: manifest.dev.json");
    } catch (err) {
      error("clean-dev-files", `削除失敗: manifest.dev.json - ${err.message}`);
    }
  }
}

if (removedCount > 0) {
  success("clean-dev-files", `完了: ${removedCount}個のファイル/ディレクトリを削除しました`);
} else {
  log("clean-dev-files", "削除対象のファイルは見つかりませんでした");
}
