import path from "path";
import sharp from "sharp";
import { watch } from "chokidar";
import { resolve, relative, basename, dirname } from "path";
import { globSync } from "glob";
import fs from "fs";
import { THEME_NAME, paths, projectRoot, toPosixPath } from "./utils/paths.js";

/**
 * 画像の変換・最適化・ビルド統合 Vite プラグイン
 * 開発環境: PNG/JPEG → WebP/AVIF変換 + 最適化 + 変換対象外画像のコピー（ファイル監視あり）
 * 本番環境（ビルド時）: buildStart で既存画像を一括変換（ファイル監視なし）
 *
 * 全件を作り直す場合は `yarn images:rebuild` を使う。
 */

// sharp は内部でスレッドを使うため、同時実行数を抑えて全体のスループットを安定させる
export const CONCURRENCY = 6;

/**
 * タスク配列を指定同時実行数で順に処理する
 * @param {Array<() => Promise<void>>} tasks - 実行するタスク
 * @param {number} limit - 同時実行数
 */
export async function runWithConcurrency(tasks, limit = CONCURRENCY) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const index = cursor++;
      await tasks[index]();
    }
  });
  await Promise.all(workers);
}

/**
 * 画像処理の実体を組み立てる。Vite プラグインと `bin/rebuild-images.js` の両方から使う。
 *
 * @param {Object} options - オプション
 * @param {string} options.format - 変換形式 ('webp' | 'avif' | 'both')
 * @param {boolean} options.copyOriginal - 元画像も WordPress ディレクトリにコピーするか
 * @param {Object} options.optimize - 最適化設定（png / jpeg / jpg / webp / avif の品質 0-100）
 * @param {boolean} options.isDev - 開発環境かどうか（変換エラーで処理を止めるかの判定に使う）
 * @param {string} options.root - Viteのrootディレクトリ
 * @param {string} options.themeDir - WordPressテーマディレクトリ
 * @returns {Object} 画像処理関数群
 */
export function createImageProcessor(options = {}) {
  const {
    format: imageFormat = "webp",
    copyOriginal = false,
    optimize = {
      png: 80,
      jpeg: 80,
      jpg: 80,
      webp: 80,
      avif: 80,
    },
    isDev = false,
    root = projectRoot,
    themeDir = paths.themeDir,
  } = options;

  const srcImagesDir = resolve(root, "assets/images");
  const wpImagesDir = resolve(themeDir, "assets/images");

  // 同一ファイルへの多重変換を防ぐ（add と change が近接して発火するケースがある）
  const inFlight = new Set();

  const isUpToDate = (sourcePath, outputPath) => {
    if (!fs.existsSync(outputPath)) return false;
    return fs.statSync(outputPath).mtimeMs >= fs.statSync(sourcePath).mtimeMs;
  };

  // 画像を最適化する関数
  const optimizeImage = async (sourcePath, outputPath, targetFormat) => {
    let sharpInstance = sharp(sourcePath);

    if (targetFormat === "png") {
      sharpInstance = sharpInstance.png({ quality: optimize.png });
    } else if (targetFormat === "jpeg" || targetFormat === "jpg") {
      sharpInstance = sharpInstance.jpeg({ quality: optimize.jpeg });
    } else if (targetFormat === "webp") {
      sharpInstance = sharpInstance.webp({ quality: optimize.webp });
    } else if (targetFormat === "avif") {
      sharpInstance = sharpInstance.avif({ quality: optimize.avif });
    } else {
      // 形式が指定されていない場合は元の形式を維持して最適化
      const ext = path.extname(sourcePath).toLowerCase();
      if (ext === ".png") {
        sharpInstance = sharpInstance.png({ quality: optimize.png });
      } else if (ext === ".jpg" || ext === ".jpeg") {
        sharpInstance = sharpInstance.jpeg({ quality: optimize.jpeg });
      } else if (ext === ".webp") {
        sharpInstance = sharpInstance.webp({ quality: optimize.webp });
      } else if (ext === ".avif") {
        sharpInstance = sharpInstance.avif({ quality: optimize.avif });
      }
    }

    await sharpInstance.toFile(outputPath);
  };

  /**
   * 画像を変換して src と WordPress ディレクトリの両方に出力する
   * @param {string} sourcePath - 元画像のパス
   * @param {Object} opts - オプション
   * @param {boolean} opts.force - 出力が最新でも再変換するか
   * @returns {Promise<{converted: number, skipped: number}>}
   */
  const convertAndCopyImages = async (sourcePath, { force = false } = {}) => {
    if (!/\.(png|jpe?g)$/.test(sourcePath)) {
      return { converted: 0, skipped: 0 };
    }
    if (inFlight.has(sourcePath)) {
      return { converted: 0, skipped: 0 };
    }
    inFlight.add(sourcePath);

    try {
      const relativePath = relative(srcImagesDir, sourcePath);
      const relativeDir = path.dirname(relativePath);
      const base = path.basename(sourcePath, path.extname(sourcePath));
      const ext = path.extname(sourcePath);

      // src 用の出力先ディレクトリ
      const srcOutputDir = relativeDir === "." ? srcImagesDir : resolve(srcImagesDir, relativeDir);
      // WordPress用の出力先ディレクトリ
      const wpOutputDir = relativeDir === "." ? wpImagesDir : resolve(wpImagesDir, relativeDir);

      const targets = [];
      if (imageFormat === "webp" || imageFormat === "both") {
        targets.push({ out: resolve(srcOutputDir, `${base}.webp`), dir: srcOutputDir, format: "webp" });
        targets.push({ out: resolve(wpOutputDir, `${base}.webp`), dir: wpOutputDir, format: "webp" });
      }
      if (imageFormat === "avif" || imageFormat === "both") {
        targets.push({ out: resolve(srcOutputDir, `${base}.avif`), dir: srcOutputDir, format: "avif" });
        targets.push({ out: resolve(wpOutputDir, `${base}.avif`), dir: wpOutputDir, format: "avif" });
      }
      // 元画像もコピーする設定の場合（WordPress ディレクトリのみ、最適化付き）
      if (copyOriginal) {
        targets.push({ out: resolve(wpOutputDir, `${base}${ext}`), dir: wpOutputDir, format: ext.slice(1) });
      }

      const pending = targets.filter(target => force || !isUpToDate(sourcePath, target.out));
      if (pending.length === 0) {
        return { converted: 0, skipped: targets.length };
      }

      // 出力先ディレクトリが存在しない場合は作成
      for (const dir of new Set(pending.map(target => target.dir))) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      try {
        for (const target of pending) {
          await optimizeImage(sourcePath, target.out, target.format);
        }
        const formats = [...new Set(pending.map(target => target.format))].join(", ");
        console.log(`[image-plugin] Converted: ${relativePath} -> ${formats}`);
      } catch (err) {
        console.error(`[image-plugin] Conversion error for ${sourcePath}:`, err);
        // ビルド時は握りつぶさず失敗させる（画像が欠けたまま本番ビルドが成功するのを防ぐ）
        if (!isDev) {
          throw err;
        }
      }

      return { converted: pending.length, skipped: targets.length - pending.length };
    } finally {
      inFlight.delete(sourcePath);
    }
  };

  /**
   * 変換対象外の画像（svg, gif, 単体webp）を WordPress ディレクトリにコピーする
   * @param {string} filePath - コピー元のパス
   * @param {Object} opts - オプション
   * @param {boolean} opts.force - コピー先が最新でもコピーするか
   * @returns {{copied: number, skipped: number}}
   */
  const copyToWordPress = (filePath, { force = false } = {}) => {
    if (/\.(png|jpe?g)$/.test(filePath)) return { copied: 0, skipped: 0 };
    // 同名の png/jpg が存在する webp は変換で生成されるためコピー対象外
    // （png/jpg 未変換の単体 webp ソースのみコピーする）
    if (/\.webp$/.test(filePath)) {
      const base = filePath.replace(/\.webp$/, "");
      if (fs.existsSync(`${base}.png`) || fs.existsSync(`${base}.jpg`) || fs.existsSync(`${base}.jpeg`)) {
        return { copied: 0, skipped: 0 };
      }
    }
    const relativePath = relative(srcImagesDir, filePath);
    const outputDir = resolve(wpImagesDir, dirname(relativePath));
    const outputPath = resolve(outputDir, basename(filePath));
    if (!force && isUpToDate(filePath, outputPath)) {
      return { copied: 0, skipped: 1 };
    }
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.copyFileSync(filePath, outputPath);
    console.log(`[image-plugin] Copied: ${relativePath}`);
    return { copied: 1, skipped: 0 };
  };

  /**
   * 既存画像の一括変換・コピーを行う（ファイル監視は行わない）
   * @param {Object} opts - オプション
   * @param {boolean} opts.force - 出力が最新でも再変換するか
   * @returns {Promise<{converted: number, skipped: number, copied: number} | null>} ソースディレクトリが無ければ null
   */
  const processAll = async ({ force = false } = {}) => {
    if (!fs.existsSync(srcImagesDir)) {
      console.warn(`[image-plugin] Source images directory not found: ${srcImagesDir}`);
      return null;
    }

    if (!fs.existsSync(wpImagesDir)) {
      fs.mkdirSync(wpImagesDir, { recursive: true });
      console.log(`[image-plugin] Created directory: ${wpImagesDir}`);
    }

    const startedAt = Date.now();
    const tally = { converted: 0, skipped: 0, copied: 0 };

    // 既存のPNG/JPEG画像を変換
    const existingImages = globSync(`${toPosixPath(srcImagesDir)}/**/*.{png,jpg,jpeg}`);
    const tasks = existingImages.map(filePath => async () => {
      const result = await convertAndCopyImages(filePath, { force });
      tally.converted += result.converted;
      tally.skipped += result.skipped;
    });
    await runWithConcurrency(tasks);

    // 既存のSVG/GIF/単体WebP画像をコピー
    const existingCopyTargets = globSync(`${toPosixPath(srcImagesDir)}/**/*.{svg,gif,webp}`);
    for (const filePath of existingCopyTargets) {
      const result = copyToWordPress(filePath, { force });
      tally.copied += result.copied;
      tally.skipped += result.skipped;
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(
      `[image-plugin] Images ready: ${existingImages.length} sources / converted ${tally.converted}, copied ${tally.copied}, up-to-date ${tally.skipped} (${elapsed}s)`,
    );

    return tally;
  };

  /**
   * ファイル監視を開始する（開発環境のみ）
   * @returns {Array<import('chokidar').FSWatcher>} 生成したウォッチャー
   */
  const startWatchers = () => {
    // PNG/JPEG変換の監視
    const convertWatcher = watch(`${toPosixPath(srcImagesDir)}/**/*.{png,jpg,jpeg}`, {
      persistent: true,
      // 起動時の全件一括変換を行わない。既存の派生画像はそのまま使い、
      // 起動後に差し替えられた画像だけを変換する。
      // 全件を作り直したい場合は `yarn images:rebuild` を使う。
      ignoreInitial: true,
      // 書き込み途中のファイルを掴まないよう、サイズが安定してから発火させる
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    convertWatcher.on("add", filePath => convertAndCopyImages(filePath));
    convertWatcher.on("change", filePath => convertAndCopyImages(filePath));

    // SVG/GIF/単体WebPの監視（同名 png/jpg を持つ webp は copyToWordPress 側でスキップ）
    const copyWatcher = watch(`${toPosixPath(srcImagesDir)}/**/*.{svg,gif,webp}`, { persistent: true, ignoreInitial: true })
      .on("add", filePath => copyToWordPress(filePath))
      .on("change", filePath => copyToWordPress(filePath));

    return [convertWatcher, copyWatcher];
  };

  return { srcImagesDir, wpImagesDir, convertAndCopyImages, copyToWordPress, processAll, startWatchers };
}

/**
 * @param {Object} options - createImageProcessor と同じオプション
 * @returns {Object} Vite プラグインオブジェクト
 */
export default function convertAndOptimizeImages(options = {}) {
  const { isDev = false } = options;
  const processor = createImageProcessor(options);
  const force = process.env.IMAGES_FORCE === "1";

  let watchers = [];
  let devInitialized = false;

  const initDevImageProcessing = () => {
    if (devInitialized) return;
    devInitialized = true;
    // dev では変換エラーで開発サーバーを止めない（ログのみ）
    processor.processAll({ force }).catch(err => {
      console.error(`[image-plugin] Error processing existing images:`, err);
    });
    watchers = processor.startWatchers();
  };

  const closeWatchers = async () => {
    await Promise.all(watchers.map(watcher => watcher.close()));
    watchers = [];
  };

  return {
    name: "convert-and-optimize-images",
    enforce: "pre",
    async buildStart() {
      if (isDev) return;
      // ビルド時も初期一括変換を実行する（監視はしない）。
      // 変換完了を待たずにビルドが進むと画像が欠けるため、完了を待機する。
      await processor.processAll({ force });
    },
    configureServer(server) {
      if (!isDev) return;
      initDevImageProcessing();
      server.httpServer?.once("close", () => {
        closeWatchers();
      });
    },
    async closeBundle() {
      await closeWatchers();
    },
    async transform(src, id) {
      // 開発環境: PNG/JPEGを変換
      if (isDev && /\.(png|jpe?g)$/.test(id)) {
        const absolutePath = path.isAbsolute(id) ? id : resolve(projectRoot, id);
        if (fs.existsSync(absolutePath)) {
          await processor.convertAndCopyImages(absolutePath);
        }
        return null;
      }
    },
  };
}
