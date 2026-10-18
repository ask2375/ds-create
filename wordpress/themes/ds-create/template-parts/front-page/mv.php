<?php
$mv_holo_lines = [
  ["id" => "1", "path" => "M-150 67.15 Q500 286.85 1150 67.15", "type" => "large", "size" => 64, "text" => "web creative　 あそびゴコロ。　 ", "speed" => "24", "phase" => ".12"],
  ["id" => "2", "path" => "M-150 184.19 Q500 349.81 1150 184.19", "type" => "small", "size" => 28, "text" => "Make it playful.　 DIRECTION + DESIGN + CODING　 ", "speed" => "-18", "phase" => ".4"],
  ["id" => "3", "path" => "M-150 387.34 Q500 434.66 1150 387.34", "type" => "outline", "size" => 85, "text" => "d:s create　 web creative　 ", "speed" => "20", "phase" => ".65"],
  ["id" => "4", "path" => "M-150 602.08 Q500 493.92 1150 602.08", "type" => "small", "size" => 28, "text" => "想いを、かたちに。　 Made with care.　 ", "speed" => "-16", "phase" => ".2"],
  ["id" => "5", "path" => "M-150 741.23 Q500 563.77 1150 741.23", "type" => "medium", "size" => 50, "text" => "web creative　 ちょっと心おどる仕掛けを　 ", "speed" => "23", "phase" => ".5"],
];
$mv_holo_verticals = [
  ["modifier" => "right", "x" => "948", "size" => 29, "text" => "ていねいな、あそびゴコロを。　 ", "speed" => "16", "phase" => ".15"],
  ["modifier" => "left", "x" => "53", "size" => 25, "text" => "想いをカタチに。　 くりえいてぃぶな　 ", "speed" => "-13", "phase" => ".6"],
];
?>
<section class="top-depth__mv top-mv js-depth-mv" id="mv" aria-labelledby="hero-title">
  <div class="top-mv__layout">
    <svg class="top-mv__holo top-mv__holo--base" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <path id="top-mv-holo-surface" d="M12 6 Q500 96 988 6 Q997 4 997 17 L997 783 Q997 797 986 794 Q500 712 14 794 Q3 797 3 783 L3 17 Q3 4 12 6Z" />
        <clipPath id="top-mv-holo-clip"><use href="#top-mv-holo-surface" /></clipPath>
        <linearGradient id="top-mv-holo-glass" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b9f1ff" stop-opacity=".16" /><stop offset=".45" stop-color="#bceaff" stop-opacity=".025" /><stop offset="1" stop-color="#b9f1ff" stop-opacity=".15" /></linearGradient>
        <radialGradient id="top-mv-holo-ink" gradientUnits="userSpaceOnUse" cx="500" cy="400" r="650"><stop offset="0" stop-color="#d9f4ff" stop-opacity=".13" /><stop offset=".65" stop-color="#d9f4ff" stop-opacity=".34" /><stop offset="1" stop-color="#d9f4ff" stop-opacity=".48" /></radialGradient>
        <?php foreach ($mv_holo_lines as $line): ?>
          <path id="top-mv-holo-line-<?php echo esc_attr($line["id"]); ?>" d="<?php echo esc_attr($line["path"]); ?>" />
        <?php endforeach; ?>
      </defs>
      <use class="top-mv__holo-glass" href="#top-mv-holo-surface" />
      <g clip-path="url(#top-mv-holo-clip)">
        <g class="top-mv__holo-guide"><path d="M0 176Q500 300 1000 176 M0 336Q500 390 1000 336 M0 491Q500 472 1000 491 M0 647Q500 559 1000 647" /></g>
      </g>
    </svg>
    <div class="top-mv__holo-mask" aria-hidden="true">
      <svg class="top-mv__holo top-mv__holo--lettering js-mv-holo" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g clip-path="url(#top-mv-holo-clip)">
          <g class="top-mv__holo-lettering">
            <?php foreach ($mv_holo_lines as $line): ?>
              <text class="top-mv__holo-type top-mv__holo-type--<?php echo esc_attr($line["type"]); ?>" font-size="<?php echo esc_attr($line["size"]); ?>"><textPath class="js-mv-holo-text" href="#top-mv-holo-line-<?php echo esc_attr($line["id"]); ?>" data-loop-text="<?php echo esc_attr($line["text"]); ?>" data-speed="<?php echo esc_attr($line["speed"]); ?>" data-phase="<?php echo esc_attr($line["phase"]); ?>"><?php echo esc_html($line["text"]); ?></textPath></text>
            <?php endforeach; ?>
            <?php foreach ($mv_holo_verticals as $vertical): ?>
              <g class="top-mv__holo-vertical top-mv__holo-vertical--<?php echo esc_attr($vertical["modifier"]); ?> js-mv-holo-vertical" font-size="<?php echo esc_attr($vertical["size"]); ?>" data-speed="<?php echo esc_attr($vertical["speed"]); ?>" data-phase="<?php echo esc_attr($vertical["phase"]); ?>"><text class="js-mv-holo-text" x="<?php echo esc_attr($vertical["x"]); ?>" y="0" data-loop-text="<?php echo esc_attr($vertical["text"]); ?>"><?php echo esc_html($vertical["text"]); ?></text></g>
            <?php endforeach; ?>
          </g>
        </g>
      </svg>
    </div>
    <svg class="top-mv__holo top-mv__holo--rim" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <use class="top-mv__holo-rim-halo" href="#top-mv-holo-surface" />
      <use class="top-mv__holo-rim" href="#top-mv-holo-surface" />
    </svg>

    <div class="top-mv__hero">
      <div class="top-mv__center">
        <p class="top-mv__status">あそびゴコロ 実装中！</p>
        <div class="top-mv__title-wrapper">
          <h1 class="top-mv__title" id="hero-title" tabindex="-1"><span class="top-mv__title-line">ディエス<span class="top-mv__title-dot">・</span></span><span class="top-mv__title-line">クリエイト</span></h1>
        </div>
        <div class="top-mv__message">
          <p class="top-mv__idea">そのアイデアに、<br>ちょっと心おどる仕掛けを</p>
          <p class="top-mv__copy">動きのある<span class="top-mv__copy-accent">『クリエイティブ』</span>な<br>サイトを作ります</p>
          <p class="top-mv__sub">もちろん<span class="top-mv__sub-accent">『カチッ』</span>としたサイトも作ります</p>
        </div>
      </div>
      <div class="top-mv__character">
        <div class="top-mv__live2d" id="mv-character" data-live2d-character data-model="<?php echo esc_url(get_theme_file_uri("assets/live2d-character/model/character.model3.json")); ?>" role="img" aria-label="ノートパソコンを持ち、こちらを指さして笑うクリエイターのキャラクター">
          <canvas class="top-mv__live2d-canvas" aria-hidden="true"></canvas>
        </div>
      </div>
    </div>

  </div>
  <div class="top-mv__enter-wrapper">
    <button class="top-mv__enter js-depth-jump" type="button" data-jump="0.245"><span class="top-mv__enter-text">スクロールして、次に進もう！</span></button>
  </div>
</section>
