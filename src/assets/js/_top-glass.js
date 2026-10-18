//~~~ トップページ MV: 曲面パネルに沿うガラスのひび割れと破砕（three.js・空間の描画結果を背景に使う） ~~~
import {
  AddEquation,
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  DoubleSide,
  Float32BufferAttribute,
  FramebufferTexture,
  LinearFilter,
  MaxEquation,
  Mesh,
  NoBlending,
  NormalBlending,
  OneFactor,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderTarget,
  ZeroFactor,
} from "three";

import { buildGlassGeometry, GLASS_PRESET_REAL, randBetween } from "./_top-glass-geometry.js";
import {
  neutralVertexShader,
  neutralFragmentShader,
  crackVertexShader,
  crackFragmentShader,
  shardVertexShader,
  shardFragmentShader,
  glassVertexShader,
  glassFragmentShader,
  sparkVertexShader,
  sparkFragmentShader,
  blurVertexShader,
  blurFragmentShader,
  flyVertexShader,
  flyFragmentShader,
} from "./_top-glass-shaders.js";

const CONFIG = {
  crackSpread: 0.28,
  tail: 1.02,
  haloRatio: 0.02,
  coreRatio: 0.0009,
  coreScale: { spoke: 1, connector: 0.7, branch: 0.5, crush: 0.6 },
  strength: { spoke: 1, connector: 0.7, branch: 0.45, crush: 0.5 },
  drawOrder: ["crush", "branch", "connector", "spoke"],
  timing: {
    spoke: { start: [0, 0.04], run: [0.32, 0.42] },
    connector: { start: 0.18, spread: 0.55, run: 0.12 },
    branch: { start: 0.22, spread: 0.5, run: 0.1 },
    crush: { start: [0, 0.02], run: [0.06, 0.1] },
  },
  shardStart: [0.02, 0.3],
  refractRatio: 0.007,
  shardOffsetRatio: 0.008,
  craterRatio: 0.06,
  spokeFade: [0.62, 1.1],
  spokeFadeRate: 0.4,
  shakeRatio: 0.014,
  shakeDecay: 8,
  shakeFreq: 14,
  shockSpeed: 3.6,
  shockLife: 0.35,
  shockWidthRatio: 0.08,
  shockAmpRatio: 0.025,
  flashDecay: 9,
  flashGain: 1.2,
  punchScale: 0.045,
  punchDecay: 9,
  glowGain: 1.4,
  glowDecay: 3.5,
  glowBlurScale: 0.5,
  glowBlurStep: 1.6,
  sparkCount: { pc: 90, sp: 50 },
  sparkSpeedRatio: [0.35, 1.3],
  sparkLife: [0.35, 0.9],
  sparkSizeRatio: [0.0025, 0.007],
  sparkGravityRatio: 1.6,
  lightDir: [-0.6, -0.8],
  impact: { x: 0.485, y: 0.477 },
  shapeSamples: 240,
  shapeViewBox: { width: 1000, height: 800 },
};

export const GLASS_TIMELINE = { crackSpread: CONFIG.crackSpread, tail: CONFIG.tail };

const NEUTRAL_CRACK = new Vector4(0.5, 0.5, 0, 0);
const NEUTRAL_SHARD = new Vector4(0.5, 0.5, 0.5, 0.5);
const QUAD = new PlaneGeometry(2, 2);

export function createGlassCrack(renderer, { shapePath }) {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const rtOptions = { depthBuffer: false, stencilBuffer: false, minFilter: LinearFilter, magFilter: LinearFilter };
  let backdrop = new FramebufferTexture(2, 2);
  const crackTarget = new WebGLRenderTarget(2, 2, rtOptions);
  const shardTarget = new WebGLRenderTarget(2, 2, rtOptions);
  const glowTargetA = new WebGLRenderTarget(2, 2, rtOptions);
  const glowTargetB = new WebGLRenderTarget(2, 2, rtOptions);
  const glassTarget = new WebGLRenderTarget(2, 2, rtOptions);
  const drawSize = new Vector2();
  const disposables = [crackTarget, shardTarget, glowTargetA, glowTargetB, glassTarget];

  const makeScene = (material, geometry = QUAD, renderOrder = 0) => {
    const scene = new Scene();
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = renderOrder;
    scene.add(mesh);
    disposables.push(material);
    return { scene, mesh };
  };

  //=== 発光のぼかし ===
  const blurMaterial = new ShaderMaterial({ vertexShader: blurVertexShader, fragmentShader: blurFragmentShader, uniforms: { uSource: { value: null }, uStep: { value: new Vector2() }, uChannel: { value: 1 } }, depthTest: false, depthWrite: false });
  const blur = makeScene(blurMaterial);

  //=== ひびマップ ===
  const crackScene = new Scene();
  const crackNeutral = new ShaderMaterial({ vertexShader: neutralVertexShader, fragmentShader: neutralFragmentShader, uniforms: { uNeutral: { value: NEUTRAL_CRACK } }, depthTest: false, depthWrite: false });
  const crackBg = new Mesh(QUAD, crackNeutral);
  crackBg.frustumCulled = false;
  crackBg.renderOrder = -1;
  crackScene.add(crackBg);
  const crackMaterial = new ShaderMaterial({
    vertexShader: crackVertexShader,
    fragmentShader: crackFragmentShader,
    uniforms: { uSize: { value: new Vector2(1, 1) }, uProgress: { value: 0 }, uHalo: { value: 1 } },
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: ZeroFactor,
    blendEquationAlpha: MaxEquation,
    blendSrcAlpha: OneFactor,
    blendDstAlpha: OneFactor,
    side: DoubleSide,
  });
  const crackMesh = new Mesh(new BufferGeometry(), crackMaterial);
  crackMesh.frustumCulled = false;
  crackScene.add(crackMesh);
  disposables.push(crackNeutral, crackMaterial);

  //=== 破片マップ ===
  const shardScene = new Scene();
  const shardNeutral = new ShaderMaterial({ vertexShader: neutralVertexShader, fragmentShader: neutralFragmentShader, uniforms: { uNeutral: { value: NEUTRAL_SHARD } }, depthTest: false, depthWrite: false });
  const shardBg = new Mesh(QUAD, shardNeutral);
  shardBg.frustumCulled = false;
  shardBg.renderOrder = -1;
  shardScene.add(shardBg);
  const shardMaterial = new ShaderMaterial({
    vertexShader: shardVertexShader,
    fragmentShader: shardFragmentShader,
    uniforms: { uSize: { value: new Vector2(1, 1) }, uProgress: { value: 0 } },
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
    side: DoubleSide,
  });
  const shardMesh = new Mesh(new BufferGeometry(), shardMaterial);
  shardMesh.frustumCulled = false;
  shardScene.add(shardMesh);
  disposables.push(shardNeutral, shardMaterial);

  //=== 合成 ===
  const glassMaterial = new ShaderMaterial({
    vertexShader: glassVertexShader,
    fragmentShader: glassFragmentShader,
    uniforms: {
      uPhoto: { value: backdrop },
      uCrack: { value: crackTarget.texture },
      uShard: { value: shardTarget.texture },
      uGlowMap: { value: glowTargetB.texture },
      uSize: { value: new Vector2(1, 1) },
      uRectUv: { value: new Vector4(0, 0, 1, 1) },
      uImpact: { value: new Vector2(CONFIG.impact.x, CONFIG.impact.y) },
      uShake: { value: new Vector2() },
      uLight: { value: new Vector2(...CONFIG.lightDir).normalize() },
      uProgress: { value: 0 },
      uShock: { value: -1000 },
      uShockWidth: { value: 1 },
      uShockAmp: { value: 0 },
      uFlash: { value: 0 },
      uPunch: { value: 0 },
      uGlow: { value: 0 },
      uRefract: { value: 0 },
      uShardOffset: { value: 0 },
      uCrater: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const glass = makeScene(glassMaterial);
  const sparkMaterial = new ShaderMaterial({
    vertexShader: sparkVertexShader,
    fragmentShader: sparkFragmentShader,
    uniforms: { uSize: { value: new Vector2(1, 1) }, uImpact: { value: new Vector2(CONFIG.impact.x, CONFIG.impact.y) }, uTime: { value: -1 }, uGravity: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: NormalBlending,
  });
  const sparkPoints = new Points(new BufferGeometry(), sparkMaterial);
  sparkPoints.frustumCulled = false;
  sparkPoints.renderOrder = 1;
  glass.scene.add(sparkPoints);
  disposables.push(sparkMaterial);

  //=== 破片の飛散 ===
  const flyMaterial = new ShaderMaterial({
    vertexShader: flyVertexShader,
    fragmentShader: flyFragmentShader,
    uniforms: {
      uGlass: { value: glassTarget.texture },
      uOpacity: { value: 0 },
      uBreak: { value: 0 },
      uImpact: { value: new Vector2(CONFIG.impact.x, CONFIG.impact.y) },
      uRect: { value: new Vector4(0, 0, 1, 1) },
      uViewport: { value: new Vector2(1, 1) },
    },
    depthTest: false,
    depthWrite: false,
    transparent: true,
    side: DoubleSide,
  });
  const fly = makeScene(flyMaterial, new BufferGeometry(), 100);

  const state = { width: 0, height: 0, maxDist: 1, mobile: false, viewport: { width: 1, height: 1 }, ready: false };

  //=== 板の形 ===
  const sampleShape = (width, height) => {
    const total = shapePath.getTotalLength();
    const points = [];
    for (let i = 0; i < CONFIG.shapeSamples; i++) {
      const p = shapePath.getPointAtLength((total * i) / CONFIG.shapeSamples);
      points.push({ x: (p.x / CONFIG.shapeViewBox.width) * width, y: (p.y / CONFIG.shapeViewBox.height) * height });
    }
    return points;
  };

  //=== ひび線のリボン ===
  const buildRibbons = (geo, width) => {
    const halo = width * CONFIG.haloRatio;
    const positions = [];
    const across = [];
    const along = [];
    const timing = [];
    const core = [];
    const strength = [];
    const fades = [];
    const normals = [];
    const indices = [];
    const ordered = [...geo.lines].sort((a, b) => CONFIG.drawOrder.indexOf(a.kind) - CONFIG.drawOrder.indexOf(b.kind));
    ordered.forEach(line => {
      const { points, kind } = line;
      const cumulative = [0];
      for (let i = 1; i < points.length; i++) cumulative.push(cumulative[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
      const length = cumulative[cumulative.length - 1] || 1;
      const t = CONFIG.timing[kind];
      const distRatio = line.dist / geo.maxDist;
      const start = Array.isArray(t.start) ? randBetween(t.start[0], t.start[1]) : t.start + distRatio * t.spread;
      const run = Array.isArray(t.run) ? randBetween(t.run[0], t.run[1]) : t.run;
      const coreWidth = width * CONFIG.coreRatio * CONFIG.coreScale[kind];
      const fade = kind === "spoke" && Math.random() < CONFIG.spokeFadeRate ? randBetween(CONFIG.spokeFade[0], CONFIG.spokeFade[1]) : 2;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const base = positions.length / 3;
        [
          [a, -1, cumulative[i - 1]],
          [a, 1, cumulative[i - 1]],
          [b, 1, cumulative[i]],
          [b, -1, cumulative[i]],
        ].forEach(([p, side, cum]) => {
          positions.push(p.x + nx * halo * side, p.y + ny * halo * side, 0);
          across.push(side);
          along.push(cum / length);
          timing.push(start, start + run);
          core.push(coreWidth);
          strength.push(CONFIG.strength[kind]);
          fades.push(fade);
          normals.push(nx, ny);
        });
        indices.push(base, base + 2, base + 1, base, base + 3, base + 2);
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aAcross", new Float32BufferAttribute(across, 1));
    geometry.setAttribute("aAlong", new Float32BufferAttribute(along, 1));
    geometry.setAttribute("aTiming", new Float32BufferAttribute(timing, 2));
    geometry.setAttribute("aCore", new Float32BufferAttribute(core, 1));
    geometry.setAttribute("aStrength", new Float32BufferAttribute(strength, 1));
    geometry.setAttribute("aFade", new Float32BufferAttribute(fades, 1));
    geometry.setAttribute("aNormal", new Float32BufferAttribute(normals, 2));
    geometry.setIndex(indices);
    return geometry;
  };

  //=== 破片 ===
  const buildShards = geo => {
    const positions = [];
    const offsets = [];
    const brights = [];
    const tilts = [];
    const centers = [];
    const radii = [];
    const starts = [];
    const indices = [];
    const flyPositions = [];
    const flyCenters = [];
    const flySeeds = [];
    geo.shards.forEach(({ points, centroid, radius, dist }, index) => {
      const angle = Math.random() * Math.PI * 2;
      const offset = [Math.cos(angle) * randBetween(0.3, 1), Math.sin(angle) * randBetween(0.3, 1)];
      const bright = randBetween(-1, 1);
      const tiltAngle = Math.random() * Math.PI * 2;
      const tiltStrength = randBetween(0.3, 1);
      const tilt = [Math.cos(tiltAngle) * tiltStrength, Math.sin(tiltAngle) * tiltStrength];
      const start = CONFIG.shardStart[0] + (dist / geo.maxDist) * CONFIG.shardStart[1];
      const base = positions.length / 3;
      [centroid, ...points].forEach(p => {
        positions.push(p.x, p.y, 0);
        offsets.push(...offset);
        brights.push(bright);
        tilts.push(...tilt);
        centers.push(centroid.x, centroid.y);
        radii.push(radius);
        starts.push(start);
      });
      for (let i = 0; i < points.length; i++) {
        indices.push(base, base + 1 + i, base + 1 + ((i + 1) % points.length));
        [centroid, points[i], points[(i + 1) % points.length]].forEach(p => {
          flyPositions.push(p.x, p.y, 0);
          flyCenters.push(centroid.x, centroid.y);
          flySeeds.push(index);
        });
      }
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("aOffset", new Float32BufferAttribute(offsets, 2));
    geometry.setAttribute("aBright", new Float32BufferAttribute(brights, 1));
    geometry.setAttribute("aTilt", new Float32BufferAttribute(tilts, 2));
    geometry.setAttribute("aCenter", new Float32BufferAttribute(centers, 2));
    geometry.setAttribute("aRadius", new Float32BufferAttribute(radii, 1));
    geometry.setAttribute("aStart", new Float32BufferAttribute(starts, 1));
    geometry.setIndex(indices);
    const flyGeometry = new BufferGeometry();
    flyGeometry.setAttribute("position", new Float32BufferAttribute(flyPositions, 3));
    flyGeometry.setAttribute("aCenter", new Float32BufferAttribute(flyCenters, 2));
    flyGeometry.setAttribute("aSeed", new Float32BufferAttribute(flySeeds, 1));
    return { geometry, flyGeometry };
  };

  //=== 火花 ===
  const buildSparks = width => {
    const count = state.mobile ? CONFIG.sparkCount.sp : CONFIG.sparkCount.pc;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 2);
    const lives = new Float32Array(count);
    const sizes = new Float32Array(count);
    const delays = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = width * randBetween(CONFIG.sparkSpeedRatio[0], CONFIG.sparkSpeedRatio[1]) * randBetween(0.4, 1);
      velocities[i * 2] = Math.cos(angle) * speed;
      velocities[i * 2 + 1] = Math.sin(angle) * speed;
      lives[i] = randBetween(CONFIG.sparkLife[0], CONFIG.sparkLife[1]);
      sizes[i] = width * randBetween(CONFIG.sparkSizeRatio[0], CONFIG.sparkSizeRatio[1]);
      delays[i] = randBetween(0, 0.05);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aVelocity", new BufferAttribute(velocities, 2));
    geometry.setAttribute("aLife", new BufferAttribute(lives, 1));
    geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geometry.setAttribute("aDelay", new BufferAttribute(delays, 1));
    return geometry;
  };

  //=== サイズ ===
  const resize = ({ rect, viewport, mobile }) => {
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    state.viewport = viewport;
    state.mobile = mobile;
    const ratio = renderer.getPixelRatio();
    renderer.getDrawingBufferSize(drawSize);
    if (backdrop.image.width !== drawSize.x || backdrop.image.height !== drawSize.y) {
      backdrop.dispose();
      backdrop = new FramebufferTexture(drawSize.x, drawSize.y);
      backdrop.minFilter = LinearFilter;
      backdrop.magFilter = LinearFilter;
      glassMaterial.uniforms.uPhoto.value = backdrop;
    }
    flyMaterial.uniforms.uViewport.value.set(viewport.width, viewport.height);
    flyMaterial.uniforms.uRect.value.set(rect.left, rect.top, width, height);
    glassMaterial.uniforms.uRectUv.value.set(rect.left / viewport.width, 1 - (rect.top + height) / viewport.height, width / viewport.width, height / viewport.height);
    sparkMaterial.uniforms.uPixelRatio.value = ratio;
    if (!width || !height) {
      state.ready = false;
      return;
    }
    const pw = Math.max(1, Math.round(width * ratio));
    const ph = Math.max(1, Math.round(height * ratio));
    crackTarget.setSize(pw, ph);
    shardTarget.setSize(pw, ph);
    glassTarget.setSize(pw, ph);
    const gw = Math.max(1, Math.round(pw * CONFIG.glowBlurScale));
    const gh = Math.max(1, Math.round(ph * CONFIG.glowBlurScale));
    glowTargetA.setSize(gw, gh);
    glowTargetB.setSize(gw, gh);
    [crackMaterial, shardMaterial, glassMaterial, sparkMaterial].forEach(material => material.uniforms.uSize.value.set(width, height));
    if (width === state.width && height === state.height && state.ready) return;
    state.width = width;
    state.height = height;

    const shape = sampleShape(width, height);
    const geo = buildGlassGeometry(shape, { x: CONFIG.impact.x * width, y: CONFIG.impact.y * height }, GLASS_PRESET_REAL, mobile);
    crackMesh.geometry.dispose();
    crackMesh.geometry = buildRibbons(geo, width);
    const shards = buildShards(geo);
    shardMesh.geometry.dispose();
    shardMesh.geometry = shards.geometry;
    fly.mesh.geometry.dispose();
    fly.mesh.geometry = shards.flyGeometry;
    sparkPoints.geometry.dispose();
    sparkPoints.geometry = buildSparks(width);
    sparkMaterial.uniforms.uGravity.value = width * CONFIG.sparkGravityRatio;
    const g = glassMaterial.uniforms;
    g.uRefract.value = width * CONFIG.refractRatio;
    g.uShardOffset.value = width * CONFIG.shardOffsetRatio;
    g.uCrater.value = geo.maxDist * CONFIG.craterRatio;
    g.uShockWidth.value = width * CONFIG.shockWidthRatio;
    crackMaterial.uniforms.uHalo.value = width * CONFIG.haloRatio;
    state.maxDist = geo.maxDist;
    state.ready = true;
  };

  //=== 描画 ===
  const renderPasses = ({ time, breakAmount, opacity }) => {
    const t = Math.max(0, time);
    const progress = Math.min(t / CONFIG.crackSpread, 1);
    const width = state.width;
    const g = glassMaterial.uniforms;
    crackMaterial.uniforms.uProgress.value = progress;
    shardMaterial.uniforms.uProgress.value = progress;
    g.uProgress.value = progress;
    const shake = t > 0 ? width * CONFIG.shakeRatio * Math.exp(-t * CONFIG.shakeDecay) : 0;
    g.uShake.value.set(shake * Math.sin(t * CONFIG.shakeFreq * Math.PI * 2), shake * 0.5 * Math.cos(t * CONFIG.shakeFreq * Math.PI * 2 * 1.3));
    const shockAlive = t > 0 && t < CONFIG.shockLife;
    g.uShock.value = shockAlive ? t * CONFIG.shockSpeed * state.maxDist : -1000;
    g.uShockAmp.value = shockAlive ? width * CONFIG.shockAmpRatio * (1 - t / CONFIG.shockLife) : 0;
    g.uFlash.value = t > 0 ? CONFIG.flashGain * Math.exp(-t * CONFIG.flashDecay) : 0;
    g.uPunch.value = t > 0 ? CONFIG.punchScale * Math.exp(-t * CONFIG.punchDecay) : 0;
    g.uGlow.value = t > 0 ? CONFIG.glowGain * Math.exp(-t * CONFIG.glowDecay) : 0;
    sparkMaterial.uniforms.uTime.value = t > 0 ? t : -1;

    renderer.setRenderTarget(crackTarget);
    renderer.render(crackScene, camera);
    renderer.setRenderTarget(shardTarget);
    renderer.render(shardScene, camera);
    if (g.uGlow.value > 0.001) {
      const b = blurMaterial.uniforms;
      b.uSource.value = crackTarget.texture;
      b.uChannel.value = 1;
      b.uStep.value.set(CONFIG.glowBlurStep / glowTargetA.width, 0);
      renderer.setRenderTarget(glowTargetA);
      renderer.render(blur.scene, camera);
      b.uSource.value = glowTargetA.texture;
      b.uChannel.value = 0;
      b.uStep.value.set(0, CONFIG.glowBlurStep / glowTargetA.height);
      renderer.setRenderTarget(glowTargetB);
      renderer.render(blur.scene, camera);
    }
    renderer.setRenderTarget(glassTarget);
    renderer.render(glass.scene, camera);
    renderer.setRenderTarget(null);

    flyMaterial.uniforms.uBreak.value = breakAmount;
    flyMaterial.uniforms.uOpacity.value = opacity;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(fly.scene, camera);
    renderer.autoClear = autoClear;
  };

  const renderScene = (scene, sceneCamera, params) => {
    renderer.setRenderTarget(null);
    renderer.render(scene, sceneCamera);
    if (!state.ready || params.opacity <= 0.001) return;
    renderer.copyFramebufferToTexture(backdrop);
    renderPasses(params);
  };

  const warmUp = () => {
    if (!state.ready) return;
    renderPasses({ time: 0.1, breakAmount: 0.1, opacity: 0 });
    renderer.setRenderTarget(null);
  };

  const dispose = () => {
    [crackMesh, shardMesh, fly.mesh, sparkPoints].forEach(mesh => mesh.geometry.dispose());
    disposables.forEach(item => item.dispose());
    backdrop.dispose();
  };

  return { resize, renderScene, warmUp, dispose };
}
