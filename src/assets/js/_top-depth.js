//~~~ トップページ: スクロールで進む空間（カメラ移動・チャプター配置・操作 UI） ~~~
const depthRoot = document.querySelector(".js-depth");

if (depthRoot) initDepth(depthRoot);

//=== 初期化 ===
async function initDepth(root) {
  const $ = selector => document.querySelector(selector);
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  const world = root.querySelector(".js-depth-world");
  const stage = root.querySelector(".js-depth-stage");
  const mv = root.querySelector(".js-depth-mv");
  const chapters = [...root.querySelectorAll(".js-depth-chapter")];
  const enter = root.querySelector(".js-depth-jump");
  const mvCenter = mv.querySelector(".top-mv__center");
  const mvCharacter = mv.querySelector(".top-mv__character");
  const holoBase = mv.querySelector(".top-mv__holo--base");
  const holoLettering = mv.querySelector(".top-mv__holo--lettering");
  const holoRim = mv.querySelector(".top-mv__holo--rim");
  const shapePath = mv.querySelector("#top-mv-holo-surface");
  const mvParts = [mvCenter, mvCharacter, holoBase, holoLettering, holoRim].filter(Boolean);
  const range = $(".js-depth-range");
  const playButton = $(".js-depth-play");
  const playLabel = $(".js-depth-play-label");
  const motionButton = $(".js-depth-motion");
  const links = [...document.querySelectorAll("[data-go]")];
  const ids = chapters.map(chapter => chapter.id);
  const stops = [0.238, 0.408, 0.578, 0.748, 0.945];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const query = new URLSearchParams(location.search);

  let readable = reducedMotion.matches || query.get("mode") === "read";
  let target = 0;
  let progress = 0;
  let previousTime = 0;
  let playing = false;
  let playStart = 0;
  let playFrom = 0;
  let stageWidth = 0;
  let stageHeight = 0;
  let needsRender = true;
  let cameraDistance = 0;
  let fxTime = 0;
  let active = -2;
  let pendingFocus = null;
  const sizes = [];
  const mvFx = { active: false, time: 0, breakAmount: 0, opacity: 0 };

  //=== three.js ===
  let three = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let tunnel = null;
  let glass = null;
  try {
    const [THREE, { createTunnel }, { createGlassCrack, GLASS_TIMELINE }] = await Promise.all([import("three"), import("./_top-tunnel.js"), import("./_top-glass.js")]);
    three = THREE;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.classList.add("top-depth__canvas");
    world.append(renderer.domElement);
    renderer.domElement.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      renderer = null;
      setReadable(true);
    });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(57, 1, 0.1, 1300);
    tunnel = createTunnel(scene);
    if (shapePath && holoBase) {
      glass = createGlassCrack(renderer, { shapePath });
      mvFx.crackSpread = GLASS_TIMELINE.crackSpread;
      mvFx.tail = GLASS_TIMELINE.tail;
    }
  } catch (error) {
    renderer = null;
    readable = true;
  }

  const stations = tunnel ? tunnel.stations : [];
  const stationVectors = tunnel ? stations.map(distance => tunnel.at(distance)) : [];
  const camSpace = three ? new three.Vector3() : null;
  const projected = three ? new three.Vector3() : null;

  //=== サイズ ===
  const resize = () => {
    needsRender = true;
    const mobile = mobileQuery.matches;
    stageWidth = stage.clientWidth;
    const chapterCenter = parseFloat(getComputedStyle(chapters[0]).top);
    stageHeight = Number.isFinite(chapterCenter) ? chapterCenter * 2 : stage.clientHeight;
    if (renderer) {
      const width = world.clientWidth;
      const height = world.clientHeight;
      camera.aspect = width / height;
      camera.fov = mobile ? 64 : 57;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
    }
    sizes.length = 0;
    chapters.forEach(chapter => sizes.push(chapter.offsetHeight));
    if (glass && renderer) {
      const panel = holoBase.getBoundingClientRect();
      const base = world.getBoundingClientRect();
      glass.resize({ rect: { left: panel.left - base.left, top: panel.top - base.top, width: panel.width, height: panel.height }, viewport: { width: world.clientWidth, height: world.clientHeight }, mobile });
    }
  };

  //=== スクロール位置 → カメラの道のり ===
  const flightDistance = p => {
    if (p < 0.15) return mix(0, 42, smooth(0.095, 0.15, p));
    const a = clamp((p - 0.15) / 0.17, 0, 4.9999);
    const i = Math.min(4, Math.floor(a));
    const t = a - i;
    const station = stations[i];
    const start = i === 0 ? 42 : stations[i - 1] + 30;
    if (i === 4) {
      if (t < 0.3) return mix(start, station - 110, smooth(0, 0.3, t));
      return mix(station - 110, station - 103, smooth(0.3, 0.9, t));
    }
    if (t < 0.27) return mix(start, station - 112, smooth(0, 0.27, t));
    if (t < 0.66) return mix(station - 112, station - 101, smooth(0.27, 0.66, t));
    return mix(station - 101, station + 30, smooth(0.66, 1, t));
  };

  //=== MV ===
  const renderMv = p => {
    const split = smooth(0.008, 0.067, p);
    const fade = 1 - smooth(0.043, 0.07, p);
    const breakAmount = smooth(0.084, 0.153, p);
    const drift = smooth(0.06, 0.15, p);
    const mobile = mobileQuery.matches;
    if (mvCenter) {
      mvCenter.style.translate = mobile ? `${-split * 110}vw ${-split * 15}px` : `${-split * 95}vw 0`;
      mvCenter.style.rotate = `${mobile ? -split * 8 : -split * 6}deg`;
      mvCenter.style.opacity = String(fade);
    }
    if (mvCharacter) {
      mvCharacter.style.translate = mobile ? `${split * 110}vw ${split * 5}px` : `${split * 90}vw 0`;
      mvCharacter.style.rotate = `${split * 13}deg`;
      mvCharacter.style.opacity = String(fade);
    }
    if (holoBase) holoBase.style.opacity = p < 0.086 ? "1" : "0";
    if (holoLettering) {
      holoLettering.style.opacity = String(1 - smooth(0.065, 0.1, p));
      holoLettering.style.scale = String(1 + drift * 0.55);
    }
    if (holoRim) {
      holoRim.style.opacity = String(1 - smooth(0.08, 0.12, p));
      holoRim.style.transform = `perspective(1100px) scale(${1 + breakAmount * 1.4}) rotateX(${breakAmount * 13}deg)`;
    }
    mv.style.display = p < 0.17 ? "" : "none";
    mv.inert = p > 0.07;
    if (enter) {
      enter.style.opacity = String(1 - smooth(0, 0.026, p));
      enter.inert = p >= 0.026;
    }
    document.body.toggleAttribute("data-mv-cracked", p >= 0.066);
    mvFx.active = Boolean(glass) && p > 0.06 && p < 0.165;
    mvFx.time = p < 0.084 ? smooth(0.066, 0.084, p) * mvFx.crackSpread : mvFx.crackSpread + smooth(0.084, 0.15, p) * mvFx.tail;
    mvFx.breakAmount = breakAmount;
    mvFx.opacity = smooth(0.066, 0.082, p) * (1 - smooth(0.12, 0.16, p));
  };

  const resetMv = () => {
    mvParts.forEach(element => {
      element.style.removeProperty("translate");
      element.style.removeProperty("rotate");
      element.style.removeProperty("opacity");
      element.style.removeProperty("transform");
      element.style.removeProperty("scale");
    });
    mv.style.removeProperty("display");
    document.body.removeAttribute("data-mv-cracked");
    mvFx.active = false;
  };

  //=== 現在地 ===
  const markCurrent = index => {
    if (index === active) return;
    active = index;
    const current = index >= 0 ? ids[index] : "";
    links.forEach(link => link.setAttribute("aria-current", String(link.dataset.go === current)));
  };

  //=== 空間の更新 ===
  const updateWorld = p => {
    const distance = flightDistance(p);
    cameraDistance = distance;
    const position = tunnel.at(distance);
    const direction = tunnel.tangentAt(distance);
    const look = tunnel.at(distance + 100);
    const upcoming = tunnel.tangentAt(distance + 75);
    const turn = direction.x * upcoming.z - direction.z * upcoming.x;
    const bank = clamp(turn * -0.25, -0.075, 0.075) * (mobileQuery.matches ? 0.55 : 1);
    camera.position.copy(position);
    camera.up.copy(tunnel.upAt(distance)).applyAxisAngle(direction, bank);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    if (readable) return;

    renderMv(p);
    let visible = -1;
    const availableHeight = stageHeight - (mobileQuery.matches ? 22 : 48);
    chapters.forEach((chapter, i) => {
      const delta = stations[i] - distance;
      const opacity = smooth(295, 185, delta) * (1 - smooth(74, 30, delta));
      camSpace.copy(stationVectors[i]).applyMatrix4(camera.matrixWorldInverse);
      projected.copy(stationVectors[i]).project(camera);
      const perspectiveScale = clamp(106 / Math.max(30, -camSpace.z), 0.22, 3.3);
      const fit = Math.min(1, availableHeight / (sizes[i] || 1));
      const x = clamp((projected.x * stageWidth) / 2, -stageWidth * 0.85, stageWidth * 0.85);
      const y = clamp((-projected.y * stageHeight) / 2, -stageHeight * 0.24, stageHeight * 0.24);
      const readWeight = smooth(185, 115, delta) * (1 - smooth(90, 55, delta));
      const exiting = smooth(98, 30, delta);
      const exitSide = i % 2 === 0 ? -1 : 1;
      const settledX = x * (1 - readWeight * 0.92) + exitSide * exiting * stageWidth * 0.3;
      const settledY = y * (1 - readWeight * 0.92);
      const shown = opacity > 0.005 && delta >= 25 && p >= 0.135;
      chapter.style.transform = `translate(-50%, -50%) translate3d(${settledX}px, ${settledY}px, 0) scale(${perspectiveScale * fit}) rotate(${bank * -18 * (1 - readWeight)}deg)`;
      chapter.style.opacity = String(shown ? opacity : 0);
      chapter.style.visibility = shown ? "visible" : "hidden";
      const current = opacity > 0.7 && delta < 180 && delta > 75;
      chapter.classList.toggle("is-active", current);
      chapter.inert = !current;
      if (current) visible = i;
    });

    markCurrent(visible);
    range.value = String(Math.round(p * 1000));
    range.style.setProperty("--progress", `${p * 100}%`);
    range.setAttribute("aria-valuetext", `${Math.round(p * 100)}%${visible >= 0 ? `・${chapters[visible].querySelector("h2").textContent}` : ""}`);
    document.body.dataset.panel = visible >= 0 ? ids[visible] : p < 0.15 ? "mv" : "flight";
  };

  //=== スクロール操作 ===
  const scrollMax = () => document.documentElement.scrollHeight - window.innerHeight;

  const scrollToProgress = (p, immediate = false) => {
    target = clamp(p);
    if (immediate) {
      progress = target;
      needsRender = true;
    }
    window.scrollTo({ top: target * scrollMax(), behavior: "instant" });
  };

  const setPlayState = state => {
    playing = state;
    playButton.classList.toggle("is-playing", state);
    playButton.setAttribute("aria-label", state ? "自動再生を停止" : "演出を自動再生");
    playLabel.textContent = state ? "停止する" : "演出を見る";
  };

  const stopPlaying = () => {
    if (playing) setPlayState(false);
  };

  const goTo = id => {
    stopPlaying();
    const section = document.getElementById(id);
    if (!section) return;
    const heading = section.querySelector("h1, h2");
    if (readable) {
      section.scrollIntoView({ behavior: "instant", block: "start" });
      heading?.focus({ preventScroll: true });
      return;
    }
    const index = ids.indexOf(id);
    scrollToProgress(index >= 0 ? stops[index] : 0);
    pendingFocus = heading;
  };

  //=== 動きを抑える表示 ===
  function setReadable(value) {
    stopPlaying();
    readable = value || !renderer;
    document.body.classList.toggle("is-readable", readable);
    motionButton.setAttribute("aria-pressed", String(readable));
    motionButton.textContent = readable ? "空間演出に戻す" : "動きを抑える";
    [mv, ...chapters].forEach(element => {
      element.inert = false;
      element.style.removeProperty("opacity");
      element.style.removeProperty("visibility");
      element.style.removeProperty("transform");
    });
    resetMv();
    if (enter) {
      enter.inert = false;
      enter.style.removeProperty("opacity");
    }
    document.body.dataset.panel = "mv";
    markCurrent(-1);
    resize();
    if (readable) window.scrollTo({ top: 0, behavior: "instant" });
    else scrollToProgress(0, true);
  }

  //=== 描画ループ ===
  const animate = time => {
    const rawDt = (time - (previousTime || time)) / 1000;
    const dt = Math.min(rawDt, 0.06);
    previousTime = time;
    if (document.hidden || readable || !renderer) {
      requestAnimationFrame(animate);
      return;
    }
    fxTime += dt;
    if (playing) {
      scrollToProgress(Math.min(1, playFrom + (time - playStart) / 95000));
      if (target >= 1) stopPlaying();
    }
    const before = progress;
    progress = rawDt > 0.25 ? target : mix(progress, target, 1 - Math.exp(-dt * 7));
    if (Math.abs(progress - target) < 0.000015) progress = target;
    if (Math.abs(before - progress) > 0.000001 || needsRender) updateWorld(progress);
    if (pendingFocus && Math.abs(progress - target) < 0.001) {
      pendingFocus.focus({ preventScroll: true });
      pendingFocus = null;
    }
    tunnel.update(fxTime, cameraDistance, { motion: !reducedMotion.matches });
    if (mvFx.active) glass.renderScene(scene, camera, mvFx);
    else renderer.render(scene, camera);
    needsRender = false;
    requestAnimationFrame(animate);
  };

  //=== イベント ===
  window.addEventListener(
    "scroll",
    () => {
      if (!readable) target = clamp(window.scrollY / scrollMax());
    },
    { passive: true },
  );
  window.addEventListener("wheel", stopPlaying, { passive: true });
  window.addEventListener("touchstart", stopPlaying, { passive: true });
  window.addEventListener("keydown", event => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) stopPlaying();
  });
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(stage);
  if (holoBase) new ResizeObserver(resize).observe(holoBase);

  range.addEventListener("input", () => {
    stopPlaying();
    scrollToProgress(Number(range.value) / 1000, true);
  });

  playButton.addEventListener("click", () => {
    if (playing) {
      stopPlaying();
      return;
    }
    if (progress > 0.98) scrollToProgress(0, true);
    playFrom = progress;
    playStart = performance.now();
    setPlayState(true);
  });

  motionButton.addEventListener("click", () => setReadable(!readable));
  reducedMotion.addEventListener("change", event => setReadable(event.matches));

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(".js-dialog-open, [data-modal-open]")) stopPlaying();
    const jump = event.target.closest(".js-depth-jump");
    if (jump) {
      stopPlaying();
      if (readable) goTo(ids[0]);
      else {
        scrollToProgress(Number(jump.dataset.jump));
        pendingFocus = chapters[0].querySelector("h2");
      }
      return;
    }
    const link = event.target.closest("[data-go]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState(null, "", `#${link.dataset.go}`);
    goTo(link.dataset.go);
  });

  window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);
    if (id === "mv" || ids.includes(id)) goTo(id);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopPlaying();
    previousTime = 0;
  });

  //=== 開始 ===
  await document.fonts.ready;
  setReadable(readable);
  const hash = location.hash.slice(1);
  if (ids.includes(hash)) {
    if (readable) goTo(hash);
    else scrollToProgress(stops[ids.indexOf(hash)], true);
  }
  if (renderer) {
    updateWorld(progress);
    tunnel.update(0, cameraDistance);
    renderer.render(scene, camera);
    glass?.warmUp();
    renderer.render(scene, camera);
  }
  document.body.classList.add("is-depth-ready");
  requestAnimationFrame(animate);
}
