//~~~ トップページ: スタート位置へ戻るワープ（ハイパースペースの幕） ~~~

const WARP = {
  duration: 2,
  fadeIn: [0, 0.4],
  cover: 0.4,
  warpUp: [0.15, 0.65],
  warpDown: [1.35, 1.75],
  fadeOut: [1.7, 2],
  maxStars: 2000,
  starsPerPixel: 1 / 220,
  cruiseSpeed: 0.045,
  warpSpeed: 2.8,
  depth: 4,
  exposure: 0.34,
  maxPixelRatio: 1.5,
  maxPixelRatioMobile: 1.25,
  space: [0.3, 1.7],
  colors: {
    spaceFrom: [183, 234, 255],
    spaceTo: [115, 181, 250],
    star: "#ffffff",
    pink: "#ec599f",
    sky: "#5194f1",
  },
};

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const smooth = t => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const span = (t, [from, to]) => clamp((t - from) / (to - from));
const easeOut = x => 1 - (1 - x) * (1 - x);
const easeIn = x => x * x;
const mixColor = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(" ")})`;

export function createWarp(overlay) {
  const canvas = overlay.querySelector(".js-warp-canvas");
  const ctx = canvas?.getContext("2d", { alpha: false });
  if (!ctx) return null;
  const mobileQuery = window.matchMedia("(max-width: 767px)");

  let width = 1;
  let height = 1;
  let focal = 1;
  let stars = [];
  let seed = 46327;
  let frameId = null;
  let active = false;

  //=== 星の配置 ===
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const spawn = (star, initial = false) => {
    const angle = random() * Math.PI * 2;
    const radius = 0.025 + Math.sqrt(random()) * 2.1;
    const tint = random();
    star.x = (Math.cos(angle) * radius * width) / height;
    star.y = Math.sin(angle) * radius;
    star.z = initial ? 0.07 + random() * (WARP.depth - 0.07) : WARP.depth;
    star.brightness = 0.22 + Math.pow(random(), 1.8) * 0.78;
    star.weight = 0.45 + random() * 0.8;
    star.color = tint < 0.25 ? WARP.colors.pink : tint < 0.5 ? WARP.colors.sky : WARP.colors.star;
    return star;
  };

  const resize = () => {
    width = Math.max(1, overlay.clientWidth);
    height = Math.max(1, overlay.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? WARP.maxPixelRatioMobile : WARP.maxPixelRatio);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    focal = height * 0.94;
    const count = Math.round(clamp(width * height * WARP.starsPerPixel, 950, WARP.maxStars));
    stars = Array.from({ length: count }, () => spawn({}, true));
  };

  //=== 描画 ===
  const draw = (dt, warp, travel = 0) => {
    ctx.globalAlpha = 1;
    ctx.fillStyle = mixColor(WARP.colors.spaceFrom, WARP.colors.spaceTo, travel);
    ctx.fillRect(0, 0, width, height);
    const cx = width * 0.5;
    const cy = height * 0.5;
    const speed = WARP.cruiseSpeed + WARP.warpSpeed * warp;
    const exposure = 0.012 + WARP.exposure * warp;
    ctx.lineCap = "round";

    for (const star of stars) {
      star.z -= speed * dt;
      if (star.z < 0.055) spawn(star);
      const scale = focal / star.z;
      const x = cx + star.x * scale;
      const y = cy + star.y * scale;
      const tailScale = focal / (star.z + speed * exposure);
      const tx = cx + star.x * tailScale;
      const ty = cy + star.y * tailScale;
      if ((x < -width && tx < 0) || (x > width * 2 && tx > width) || (y < -height && ty < 0) || (y > height * 2 && ty > height)) {
        if (dt > 0) spawn(star);
        continue;
      }
      const depthFade = smooth((WARP.depth - star.z) / 0.6);
      const brightness = Math.min(1, star.brightness * depthFade * 1.35);
      const near = clamp(1 - star.z / WARP.depth);
      const lineWidth = star.weight * (0.7 + near * 1.2);
      ctx.strokeStyle = star.color;
      ctx.fillStyle = star.color;
      if (Math.hypot(x - tx, y - ty) < 1.3) {
        ctx.globalAlpha = brightness * (0.5 + near * 0.5);
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.45, lineWidth * 0.72), 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.lineWidth = lineWidth;
      for (let i = 0; i < 3; i++) {
        const a = i / 3;
        const b = (i + 1) / 3;
        ctx.globalAlpha = brightness * (0.2 + 0.32 * i);
        ctx.beginPath();
        ctx.moveTo(tx + (x - tx) * a, ty + (y - ty) * a);
        ctx.lineTo(tx + (x - tx) * b, ty + (y - ty) * b);
        ctx.stroke();
      }
      if (star.brightness > 0.84 && warp > 0.25) {
        ctx.globalAlpha = brightness * warp * 0.08;
        ctx.lineWidth = lineWidth * 3.8;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  //=== 再生 ===
  const finish = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    active = false;
    overlay.classList.remove("is-active");
    overlay.style.removeProperty("opacity");
  };

  const play = ({ onCovered, onReveal } = {}) =>
    new Promise(resolve => {
      if (active) {
        resolve(false);
        return;
      }
      active = true;
      let covered = false;
      let revealed = false;
      let last = null;
      let start = null;
      resize();
      draw(0, 0);
      overlay.style.opacity = "0";
      overlay.classList.add("is-active");

      const tick = now => {
        frameId = null;
        if (start === null) start = now;
        const t = Math.min((now - start) / 1000, WARP.duration);
        const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.05);
        last = now;
        const warp = smooth(span(t, WARP.warpUp)) * (1 - smooth(span(t, WARP.warpDown)));
        draw(dt, warp, smooth(span(t, WARP.space)));
        overlay.style.opacity = String(easeOut(span(t, WARP.fadeIn)) * (1 - easeIn(span(t, WARP.fadeOut))));
        if (!covered && t >= WARP.cover) {
          covered = true;
          onCovered?.();
        }
        if (!revealed && t >= WARP.fadeOut[0]) {
          revealed = true;
          onReveal?.();
        }
        if (t >= WARP.duration) {
          finish();
          resolve(true);
          return;
        }
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    });

  return {
    play,
    get active() {
      return active;
    },
  };
}
