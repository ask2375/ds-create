import { resolve, relative, extname, basename, dirname } from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { globSync } from "glob";
import autoprefixer from "autoprefixer";
import updateStyleCss from "./bin/update-wp-config.js";
import { THEME_NAME } from "./bin/utils/paths.js";
import sassGlobImports from "vite-plugin-sass-glob-import";
import liveReload from "vite-plugin-live-reload";
import devManifest from "vite-plugin-dev-manifest";
import convertAndOptimizeImages from "./bin/vite-plugin-convert-images.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "src");
const themeDir = resolve(__dirname, `wordpress/themes/${THEME_NAME}`);
const isDev = process.env.NODE_ENV === "development";

const imageConfig = {
  format: "webp",
  copyOriginal: false,
  optimize: { png: 80, jpeg: 80, jpg: 80, webp: 80, avif: 80 },
};

const inputsForWordPress = {
  style: resolve(root, "assets", "styles", "style.scss"),
  ...Object.fromEntries(
    globSync("src/assets/js/*.js")
      .filter(file => !basename(file).startsWith("_"))
      .map(file => [relative("src/assets/js", file.slice(0, file.length - extname(file).length)), resolve(__dirname, file)]),
  ),
};

export default defineConfig(({ mode }) => ({
  root,
  base: mode === "wp" ? "./" : "/",
  server: {
    port: 5173,
    host: "localhost",
    cors: true,
    strictPort: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
    origin: mode == "wp" ? undefined : "http://localhost:5173",
  },
  build: {
    manifest: true,
    // minify すると esbuild が疑似要素 ::after を CSS2 旧記法 :after へ潰すため無効化する。
    // 納品 CSS / JS は可読なまま出す運用（alias-carnival と同方針）。
    minify: false,
    // 画像を base64 インライン化しない（src のディレクトリ構成をテーマ側でも維持するため）。
    // 既定の 4096 バイト未満だと SVG が data URI 化され、CSS が肥大して画像単体のキャッシュも効かない。
    // 注意: コールバック形式で数値を返すと truthy = インライン化と解釈されるため、数値を直接書く。
    assetsInlineLimit: 0,
    outDir: mode === "wp" || isDev ? themeDir : resolve(__dirname, "dist"),
    rollupOptions: {
      input: inputsForWordPress,
      output: {
        // エントリの JS / CSS はファイル名を固定する。キャッシュ対策は functions.php 側で
        // filemtime を ?ver= として付与する方式に統一しているため（func-enqueue.php）。
        entryFileNames: "assets/js/[name].js",
        // 動的 import で生成されるチャンクは PHP を経由せず JS から直接読まれるため、
        // ?ver= を付けられない。こちらはファイル名ハッシュでキャッシュを更新する。
        chunkFileNames: "assets/js/[name].[hash].js",
        assetFileNames: assetsInfo => {
          // Vite 5.2+ は emit 時に元パス（root=src 相対）を渡すため、src/assets/images の
          // ディレクトリ構成（common/top 等）をそのままテーマ側に維持する。
          // フラット化すると同名別フォルダの画像が衝突し、convert-images プラグインの
          // 構造保持コピーとも二重出力になる。
          const original = assetsInfo.originalFileNames?.[0] ?? assetsInfo.originalFileName;
          if (original && original.startsWith("assets/images/")) return original;

          const name = assetsInfo.names?.[0] ?? assetsInfo.name;
          const isCss = name.endsWith(".css");
          const isImage = /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(name);
          if (isCss) return "assets/styles/[name].[ext]";
          if (isImage) return "assets/images/[name].[ext]";
          return "assets/[name].[hash].[ext]";
        },
      },
    },
  },
  css: {
    postcss: { plugins: [autoprefixer()] },
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
        additionalData: "",
      },
    },
  },
  plugins: [
    devManifest(),
    updateStyleCss(),
    sassGlobImports(),
    convertAndOptimizeImages({
      format: imageConfig.format,
      copyOriginal: imageConfig.copyOriginal,
      optimize: imageConfig.optimize,
      isDev,
      root,
      themeDir,
    }),
    liveReload([`${themeDir.replace(/\\/g, "/")}/**/*.php`, `!${themeDir.replace(/\\/g, "/")}/functions-lib/lib/**/*.php`]),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/assets/styles"),
      "@js": resolve(__dirname, "src/assets/js"),
    },
  },
}));
