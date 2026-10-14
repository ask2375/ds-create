/**
 * FTP 差分デプロイスクリプト (ftp-deploy スキル同梱テンプレート)
 *
 * ローカルの出力フォルダをリモートの FTP_REMOTE_DIR へ差分アップロードし、
 * アップロード完了後にローカルに存在しないリモートファイルを削除する。
 *
 * 設定:
 *   - .env は「指示書・仕様書/.env」に置く（このフォルダは .gitignore 済み）。
 *     プロジェクトルート直下の .env があればそちらも読む（後勝ちしない・先に見つかった方を採用）。
 *   - アップロード対象の既定は wordpress/themes/<テーマ名>（テーマフォルダの中身）。
 *     テーマ名は config/project.json の themeSlug を正本とし、bin/utils/paths.js の THEME_NAME から解決する。
 *     リモートの FTP_REMOTE_DIR（例: /public_html/wp-content/themes/<テーマ名>）へ展開される。
 *   - テーマ配下の「WordPress関連ファイル」（AI 作業ファイル・DB バックアップ等）は納品対象外のため
 *     ローカル走査から除外する。
 *
 * 差分判定:
 *   次のいずれかに当てはまるファイルを転送し、それ以外はスキップする。
 *     1. リモートに存在しない                          → 新規
 *     2. リモートとローカルでサイズが違う              → サイズ差
 *     3. サイズは同じだが前回デプロイ時と内容が違う    → 内容差（ハッシュ台帳と照合）
 *     4. サイズは同じだが台帳に記録が無い              → 台帳なし（安全側で転送する）
 *
 *   ハッシュ台帳（DEPLOY_STATE_FILE）を使う理由:
 *   サイズ一致スキップだけでは「内容が変わったのにバイト数が偶然一致する」ケースを検出できない。
 *   CSS / JS / PHP は同じ長さの値へ書き換わること（#fff → #eee、20px → 24px 等）が日常的に起きるため、
 *   この取りこぼしは稀ではない。リモート側の内容ハッシュは FTP では取得できないため、代わりに
 *   「前回自分が送った内容のハッシュ」をローカルの台帳に記録し、それとの差分で判定する。
 *   台帳が無い初回は全ファイルが転送対象になる（安全側の挙動）。台帳はアップロード成功分のみ記録するため、
 *   途中で転送が失敗したファイルは次回も転送対象として残る。
 *
 *   台帳の限界: リモートを FTP クライアント等で直接書き換えた場合、サイズが変わらなければ検出できない。
 *   その場合はサーバー側の該当ファイルを削除してから再デプロイするか、台帳ファイルを削除して全件送信する。
 *
 * 使い方:
 *   yarn deploy:dry   # 転送・削除の予定一覧のみ表示（接続はする）
 *   yarn deploy       # ビルド（yarn build:wp）→ アップロード
 *   ※ シェルから直接実行する場合は `yarn node bin/deploy.mjs`（yarn 4 の依存解決を通すため）
 *
 * .env に以下を定義:
 *   FTP_HOST=ftp.example.com
 *   FTP_USER=username
 *   FTP_PASSWORD=password
 *   FTP_REMOTE_DIR=/public_html/wp-content/themes/<テーマ名>
 *   FTP_SECURE=true             # FTPS なら true（省略時 false）
 *   FTP_LOCAL_DIR=...           # アップ対象フォルダを変える場合のみ（省略時は上記の既定）
 *   FTP_ALLOW_DIR_MISMATCH=true # 転送先の末尾フォルダ名がテーマ名と違う案件のみ。省略時は不一致で停止（別案件の .env 流用事故の防止）
 *
 * .deploy-state.json（ハッシュ台帳）も .gitignore 対象。ローカル環境ごとの状態であり共有しない。
 */
import { Client } from "basic-ftp";
import dotenv from "dotenv";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { THEME_NAME } from "./utils/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// .env の探索順。先に見つかった 1 ファイルだけを読む
const ENV_CANDIDATES = [path.join(projectRoot, "指示書・仕様書", ".env"), path.join(projectRoot, ".env")];
const envPath = ENV_CANDIDATES.find(p => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath, quiet: true });
  console.log(`.env 読込: ${path.relative(projectRoot, envPath)}`);
} else {
  console.log("[WARN] .env が見つかりません（指示書・仕様書/.env またはプロジェクトルート直下）");
}

// テーマ名は config/project.json の themeSlug（bin/utils/paths.js の THEME_NAME）から解決する。
// 案件ごとにこの行を書き換える運用にすると init:project でテーマ名を変えた際に追従漏れが起きるため、
// ハードコードせず正本から引く。
const DEFAULT_LOCAL_DIR = `wordpress/themes/${THEME_NAME}`;

const DRY_RUN = process.argv.includes("--dry-run");

// 削除保護リスト（リモートに存在してもローカルに無いだけで消してはいけないファイル・ディレクトリ）
// マッチ判定: パス完全一致 or パスがプレフィックスで始まる（ディレクトリ保護）
const PROTECTED = [
  ".htaccess",
  ".htpasswd",
  "robots.txt", // 手動運用の可能性があるため保守側で保護
  "sitemap.xml",
  "favicon.ico",
  ".well-known", // Let's Encrypt 等
  "screenshot.png", // WordPress テーマのサムネイル（管理画面で手動設置されている場合に保護）
  // アップロード対象から外している（LOCAL_EXCLUDE 参照）フォルダ。
  // 「ローカルに無い = 削除」の判定に巻き込まれてサーバー側の既存分が消えるのを防ぐため保護する
  "WordPress関連ファイル",
];
const isProtected = rel => PROTECTED.some(p => rel === p || rel.startsWith(`${p}/`));

// ローカル走査から除外する名前（開発専用の生成物・納品対象外の資料。サーバーへ送らない）
// 例: Vite の manifest.dev.json は dev サーバー稼働マーカーであり、本番へ送ると環境判定を誤らせる
const LOCAL_EXCLUDE = new Set([
  ".DS_Store",
  ".playwright-cli",
  "node_modules",
  ".git",
  "manifest.dev.json",
  // ビルド成果物の manifest。開発専用の生成物として本番へ送らない。
  // 送らない場合、func-helpers.php の get_asset_environment() は "fallback" を返し、
  // enqueue_production_assets_fallback() がアセットを読む。テンプレート既定の構成
  // （src/assets/js/ の "_" 始まり以外のエントリが script.js のみ、CSS が style.css と script.css）では、
  // manifest 経路と fallback 経路の enqueue 結果（対象ファイル・読込順・依存・?ver= の filemtime）が一致するため、
  // 送らなくても本番の表示は変わらない。
  //
  // 見直しが必要になる条件: src/assets/js/ に "_" 始まり以外のエントリを追加した場合。
  // fallback 経路は assets/js/script.js しか enqueue しないため、追加したエントリが本番で読まれなくなる。
  // その場合はこの行を削除して .vite を送る（manifest 経路に戻す）か、fallback 側を複数エントリ対応に直す。
  ".vite",
  "WordPress関連ファイル", // AI 作業ファイル・DB バックアップ置き場（納品対象外）
]);

// 前回デプロイした内容のハッシュ台帳（理由はファイル冒頭コメントの「差分判定」参照）
// 転送先ごとにキーを分けるため、FTP_REMOTE_DIR 単位で保持する
const DEPLOY_STATE_FILE = path.join(projectRoot, ".deploy-state.json");

const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR } = process.env;
const FTP_SECURE = process.env.FTP_SECURE === "true";
const localRoot = path.join(projectRoot, process.env.FTP_LOCAL_DIR || DEFAULT_LOCAL_DIR);

function fail(msg) {
  console.error(`[ERROR] ${msg}`);
  process.exit(1);
}

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !FTP_REMOTE_DIR) {
  fail(".env に FTP_HOST / FTP_USER / FTP_PASSWORD / FTP_REMOTE_DIR を定義してください");
}
if (!fs.existsSync(localRoot)) {
  fail(`${localRoot} がありません。先にビルドを実行してください`);
}

// 転送先の末尾フォルダ名とローカルのテーマフォルダ名が一致しなければ接続前に停止する。
// .env を別案件からコピーして FTP_REMOTE_DIR を書き換え忘れると、別案件の本番テーマを
// 丸ごと上書き + 削除する（2026-10-05 iseleve-2nd の .env が omae-kensetsu の転送先のまま
// デプロイされ、大前建設の本番テーマが消えた実害）。警告だけでは大量の UP ログに流されて
// 気付けないため fail にする。意図的に別名フォルダへ送る案件だけ FTP_ALLOW_DIR_MISMATCH=true で解除する。
const remoteLeaf = path.posix.basename(FTP_REMOTE_DIR.replace(/\/+$/, ""));
const localLeaf = path.basename(localRoot);
if (remoteLeaf !== localLeaf && process.env.FTP_ALLOW_DIR_MISMATCH !== "true") {
  fail(
    `転送先のフォルダ名がローカルのテーマ名と一致しません\n` +
      `  FTP_REMOTE_DIR: ${FTP_REMOTE_DIR}（末尾: ${remoteLeaf}）\n` +
      `  ローカル:       ${path.relative(projectRoot, localRoot)}（末尾: ${localLeaf}）\n` +
      `  .env の FTP_REMOTE_DIR が別案件のままになっていないか確認してください。` +
      `意図どおりなら .env に FTP_ALLOW_DIR_MISMATCH=true を追加して再実行`
  );
}

const md5 = buf => crypto.createHash("md5").update(buf).digest("hex");
const fileHash = abs => md5(fs.readFileSync(abs));

/** ハッシュ台帳を読み込む。壊れている・存在しない場合は空（= 全件転送）として扱う */
function loadDeployState() {
  if (!fs.existsSync(DEPLOY_STATE_FILE)) return {};
  try {
    const all = JSON.parse(fs.readFileSync(DEPLOY_STATE_FILE, "utf8"));
    return all[FTP_REMOTE_DIR] || {};
  } catch {
    console.log("[WARN] ハッシュ台帳を読めませんでした。今回は全ファイルを転送対象にします");
    return {};
  }
}

/** ハッシュ台帳を保存する。他の転送先のエントリは温存する */
function saveDeployState(state) {
  let all = {};
  if (fs.existsSync(DEPLOY_STATE_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(DEPLOY_STATE_FILE, "utf8"));
    } catch {
      all = {};
    }
  }
  all[FTP_REMOTE_DIR] = state;
  fs.writeFileSync(DEPLOY_STATE_FILE, `${JSON.stringify(all, null, 2)}\n`);
}

/** ローカル出力フォルダを再帰走査し { 相対パス: サイズ } を返す */
function walkLocal(dir, base = "") {
  const result = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (LOCAL_EXCLUDE.has(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const [k, v] of walkLocal(abs, rel)) result.set(k, v);
    } else {
      result.set(rel, fs.statSync(abs).size);
    }
  }
  return result;
}

/** リモートを再帰走査し { 相対パス: サイズ } とディレクトリ一覧を返す */
async function walkRemote(client, dir, base = "") {
  const files = new Map();
  const dirs = [];
  let list;
  try {
    list = await client.list(dir);
  } catch {
    return { files, dirs }; // リモートディレクトリ未作成 = 空扱い
  }
  for (const item of list) {
    const rel = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory) {
      dirs.push(rel);
      const sub = await walkRemote(client, `${dir}/${item.name}`, rel);
      for (const [k, v] of sub.files) files.set(k, v);
      dirs.push(...sub.dirs);
    } else if (item.isFile) {
      files.set(rel, item.size);
    }
  }
  return { files, dirs };
}

// タイムアウト 60 秒（大容量ファイルの連続転送で短いとサーバー側切断が起きやすい）
const client = new Client(60000);

const FTP_ACCESS = {
  host: FTP_HOST,
  user: FTP_USER,
  password: FTP_PASSWORD,
  secure: FTP_SECURE,
};

async function connect() {
  console.log(`接続中: ${FTP_HOST} (secure=${FTP_SECURE})`);
  await client.access(FTP_ACCESS);
}

// EPIPE / タイムアウト等の一時的エラーを判定
function isTransientError(err) {
  const msg = String(err?.message || err);
  return /EPIPE|ECONNRESET|ETIMEDOUT|timeout|closed|Client is closed/i.test(msg);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ファイルアップロードを最大 maxRetries 回リトライ。切断されたら再接続
async function uploadWithRetry(localPath, remotePath, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.uploadFrom(localPath, remotePath);
      return;
    } catch (err) {
      if (attempt === maxRetries || !isTransientError(err)) throw err;
      const wait = 1000 * attempt; // 1s → 2s → 3s
      process.stdout.write(`\n  [RETRY ${attempt}/${maxRetries}] ${remotePath} (${err.message}) → ${wait}ms 待機後 再接続\n`);
      try {
        client.close();
      } catch {
        /* 既に閉じている可能性あり */
      }
      await sleep(wait);
      await connect();
    }
  }
}

try {
  await connect();

  console.log("リモートファイル一覧取得中...");
  const remote = await walkRemote(client, FTP_REMOTE_DIR);
  const local = walkLocal(localRoot);
  console.log(`ローカル ${local.size} 件 / リモート ${remote.files.size} 件`);

  // 1. アップロード対象の選定（サイズとハッシュ台帳の両方が前回と一致すればスキップ）
  const prevState = loadDeployState();
  const uploads = [];
  const localHashes = new Map();
  for (const [rel, size] of local) {
    const remoteSize = remote.files.get(rel);
    if (remoteSize === undefined) {
      uploads.push({ rel, size, reason: "新規" });
      continue;
    }
    if (remoteSize !== size) {
      uploads.push({ rel, size, reason: "サイズ差" });
      continue;
    }
    // サイズが同じでも内容が変わっている場合があるため、前回送った内容のハッシュと照合する
    const hash = fileHash(path.join(localRoot, rel));
    localHashes.set(rel, hash);
    const prevHash = prevState[rel];
    if (prevHash === undefined) {
      uploads.push({ rel, size, reason: "台帳なし" });
    } else if (prevHash !== hash) {
      uploads.push({ rel, size, reason: "内容差" });
    }
    // サイズ一致 かつ 前回送った内容と同一 → スキップ
  }

  // 2. 削除対象 = リモートにあってローカルに無い、かつ保護リスト外のファイル
  const allMissing = [...remote.files.keys()].filter(rel => !local.has(rel));
  const deletions = allMissing.filter(rel => !isProtected(rel));
  const protectedSkipped = allMissing.filter(rel => isProtected(rel));

  const countByReason = reason => uploads.filter(u => u.reason === reason).length;
  const totalBytes = uploads.reduce((sum, u) => sum + u.size, 0);
  const mb = (totalBytes / 1024 / 1024).toFixed(2);

  console.log(`\nアップロード ${uploads.length} 件 (${mb} MB) / スキップ ${local.size - uploads.length} 件 / 削除 ${deletions.length} 件 / 保護 ${protectedSkipped.length} 件`);
  console.log(`  内訳: 新規 ${countByReason("新規")} 件 / サイズ差 ${countByReason("サイズ差")} 件 / 内容差 ${countByReason("内容差")} 件 / 台帳なし ${countByReason("台帳なし")} 件`);
  if (protectedSkipped.length) {
    console.log("保護され削除されなかったファイル:");
    for (const p of protectedSkipped) console.log(`  [PROTECTED] ${p}`);
  }

  if (DRY_RUN) {
    console.log("\n--- dry-run: アップロード予定 ---");
    for (const u of uploads) console.log(`  [UP:${u.reason}] ${u.rel}`);
    console.log("--- dry-run: 削除予定 ---");
    for (const d of deletions) console.log(`  [DEL] ${d}`);
    console.log("\ndry-run のため何も実行していません");
  } else {
    // アップロード実行（削除より先。転送失敗時に旧ファイルが残り公開が壊れないため）
    // 台帳の初期値はスキップしたファイル（= 前回送った内容のまま）の記録を引き継ぐ。
    // ローカルから消えたファイルの記録は引き継がない
    const newState = {};
    for (const rel of local.keys()) {
      if (prevState[rel] !== undefined) newState[rel] = prevState[rel];
    }

    let done = 0;
    const madeDirs = new Set();
    try {
      for (const { rel, reason } of uploads) {
        const remotePath = `${FTP_REMOTE_DIR}/${rel}`;
        const remoteDir = path.posix.dirname(remotePath);
        if (!madeDirs.has(remoteDir)) {
          await client.ensureDir(remoteDir);
          await client.cd("/");
          madeDirs.add(remoteDir);
        }
        const localPath = path.join(localRoot, rel);
        await uploadWithRetry(localPath, remotePath);
        // 転送に成功したファイルだけ台帳へ記録する（失敗分は次回も転送対象に残す）
        newState[rel] = localHashes.get(rel) ?? fileHash(localPath);
        done++;
        // 何を送ったかを 1 行ずつ残す（件数だけの表示では取りこぼしに気付けないため）
        console.log(`  [UP:${reason}] (${done}/${uploads.length}) ${rel}`);
      }
    } finally {
      saveDeployState(newState);
    }

    // 削除実行（ファイル → 空になったディレクトリの順・削除もリトライ）
    for (const rel of deletions) {
      let ok = false;
      for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
        try {
          await client.remove(`${FTP_REMOTE_DIR}/${rel}`);
          ok = true;
        } catch (err) {
          if (attempt === 3 || !isTransientError(err)) throw err;
          await sleep(1000 * attempt);
          try {
            client.close();
          } catch {
            /* noop */
          }
          await connect();
        }
      }
      console.log(`  [DEL] ${rel}`);
    }
    // 深い階層から空ディレクトリ削除を試行（中身があれば失敗するので無視・保護対象は除外）
    const dirCandidates = [...new Set(remote.dirs)].filter(d => !isProtected(d)).sort((a, b) => b.split("/").length - a.split("/").length);
    for (const d of dirCandidates) {
      try {
        await client.removeEmptyDir(`${FTP_REMOTE_DIR}/${d}`);
        console.log(`  [RMDIR] ${d}`);
      } catch {
        /* 空でないディレクトリはスキップ */
      }
    }

    console.log("\nデプロイ完了");
  }
} catch (err) {
  fail(err.message);
} finally {
  client.close();
}
