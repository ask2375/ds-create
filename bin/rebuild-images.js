/**
 * src/assets/images 配下の元画像(png / jpg / jpeg)から webp / avif を一括生成し、
 * WordPress テーマの assets/images へも書き出す。
 *
 * dev サーバの convertAndOptimizeImages プラグインは、出力が元画像より新しい場合は
 * 変換をスキップする。品質設定を変えた等の理由で全件を作り直したい場合に本スクリプトを使う。
 *
 * 使い方:
 *   yarn images:rebuild            出力が元画像より古いものだけ生成
 *   yarn images:rebuild --force    出力が新しくても全件作り直す
 */

import { resolve } from "path";
import { createImageProcessor } from "./vite-plugin-convert-images.js";
import { imageConfig } from "../vite.config.js";
import { paths, projectRoot } from "./utils/paths.js";

const force = process.argv.slice(2).includes("--force");

const processor = createImageProcessor({
  format: imageConfig.format,
  copyOriginal: imageConfig.copyOriginal,
  optimize: imageConfig.optimize,
  isDev: false,
  root: resolve(projectRoot, "src"),
  themeDir: paths.themeDir,
});

const result = await processor.processAll({ force });

if (!result) {
  process.exit(1);
}
