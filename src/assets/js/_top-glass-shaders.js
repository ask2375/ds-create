//~~~ トップページ MV: ガラスのひび割れ GLSL（anime-collection「リアル風」を空間の背景と破片飛散へ合わせた版） ~~~

const toClipSnippet = /* glsl */ `
  vec2 toClip(vec2 px, vec2 size) {
    return vec2(px.x / size.x * 2.0 - 1.0, 1.0 - px.y / size.y * 2.0);
  }
`;

export const neutralVertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const neutralFragmentShader = /* glsl */ `
  uniform vec4 uNeutral;
  void main() {
    gl_FragColor = uNeutral;
  }
`;

export const crackVertexShader = /* glsl */ `
  attribute float aAcross;
  attribute float aAlong;
  attribute vec2 aTiming;
  attribute float aCore;
  attribute float aStrength;
  attribute float aFade;
  attribute vec2 aNormal;
  uniform vec2 uSize;
  varying float vAcross;
  varying float vAlong;
  varying vec2 vTiming;
  varying float vCore;
  varying float vStrength;
  varying float vFade;
  varying vec2 vNormal;
  ${toClipSnippet}
  void main() {
    vAcross = aAcross;
    vAlong = aAlong;
    vTiming = aTiming;
    vCore = aCore;
    vStrength = aStrength;
    vFade = aFade;
    vNormal = aNormal;
    gl_Position = vec4(toClip(position.xy, uSize), 0.0, 1.0);
  }
`;

export const crackFragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform float uHalo;
  varying float vAcross;
  varying float vAlong;
  varying vec2 vTiming;
  varying float vCore;
  varying float vStrength;
  varying float vFade;
  varying vec2 vNormal;

  #define GROW_EDGE 0.015
  #define TAPER_START 1.6
  #define TAPER_END 0.5
  #define DARK_GAP 1.2
  #define DARK_WIDTH 1.0
  #define DARK_GAIN 0.7
  #define STEP_HOLD 0.7
  #define TIP_SHARPNESS 30.0
  #define TIP_GAIN 0.8

  void main() {
    float grow = clamp((uProgress - vTiming.x) / max(vTiming.y - vTiming.x, 0.0001), 0.0, 1.0);
    grow = 1.0 - pow(1.0 - grow, 2.0);
    float visible = 1.0 - smoothstep(grow - GROW_EDGE, grow, vAlong);
    float w = vCore * mix(TAPER_START, TAPER_END, vAlong);
    float tip = exp(-pow((vAlong - grow) * TIP_SHARPNESS, 2.0)) * step(grow, 0.999) * exp(-pow(abs(vAcross) * uHalo / (w * 3.0), 2.0)) * TIP_GAIN;
    if (visible < 0.002 && tip < 0.002) discard;

    float distPx = abs(vAcross) * uHalo;
    float intensity = 1.0 - smoothstep(vFade - 0.15, vFade, vAlong);
    float core = smoothstep(w, w * 0.35, distPx) * intensity;
    float side = step(0.0, -vAcross);
    float dark = smoothstep(w * (DARK_GAP + DARK_WIDTH), w * DARK_GAP, distPx) * step(w * 0.9, distPx) * side * DARK_GAIN * intensity;
    float hold = 1.0 - smoothstep(STEP_HOLD, 1.0, abs(vAcross));
    vec2 disp = vNormal * sign(vAcross) * hold * vStrength * intensity;
    gl_FragColor = vec4(disp * 0.5 + 0.5, dark * visible, clamp(core * visible + tip, 0.0, 1.0));
  }
`;

export const shardVertexShader = /* glsl */ `
  attribute vec2 aOffset;
  attribute float aBright;
  attribute vec2 aTilt;
  attribute vec2 aCenter;
  attribute float aRadius;
  attribute float aStart;
  uniform vec2 uSize;
  varying vec2 vOffset;
  varying float vBright;
  varying vec2 vTilt;
  varying vec2 vLocal;
  varying float vStart;
  ${toClipSnippet}
  void main() {
    vOffset = aOffset;
    vBright = aBright;
    vTilt = aTilt;
    vLocal = (position.xy - aCenter) / max(aRadius, 1.0);
    vStart = aStart;
    gl_Position = vec4(toClip(position.xy, uSize), 0.0, 1.0);
  }
`;

export const shardFragmentShader = /* glsl */ `
  uniform float uProgress;
  varying vec2 vOffset;
  varying float vBright;
  varying vec2 vTilt;
  varying vec2 vLocal;
  varying float vStart;

  #define SETTLE 0.14

  void main() {
    float f = smoothstep(vStart, vStart + SETTLE, uProgress);
    float tilt = clamp(dot(vLocal, vTilt), -1.0, 1.0);
    gl_FragColor = vec4(0.5 + 0.5 * vOffset * f, 0.5 + 0.5 * vBright * f, 0.5 + 0.5 * tilt * f);
  }
`;

export const glassVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const glassFragmentShader = /* glsl */ `
  uniform sampler2D uPhoto;
  uniform sampler2D uCrack;
  uniform sampler2D uShard;
  uniform vec2 uSize;
  uniform vec4 uRectUv;
  uniform vec2 uImpact;
  uniform vec2 uShake;
  uniform vec2 uLight;
  uniform float uProgress;
  uniform float uShock;
  uniform float uShockWidth;
  uniform float uShockAmp;
  uniform float uFlash;
  uniform sampler2D uGlowMap;
  uniform float uPunch;
  uniform float uGlow;
  uniform float uRefract;
  uniform float uShardOffset;
  uniform float uCrater;
  varying vec2 vUv;

  #define BRIGHT_GAIN 0.09
  #define TILT_GAIN 0.09
  #define HAIRLINE vec3(0.1)
  #define DARK_MIX 0.6
  #define CHROMA 0.08
  #define CELL_SIZE 5.0
  #define CELL_JITTER 1.2
  #define FROST 0.18
  #define CRACK_MIX 0.95
  #define SHEEN 0.035
  #define GLINT_CELL 14.0
  #define GLOW_SOFT 1.6
  #define GLOW_COLOR vec3(1.0, 0.98, 0.94)

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec2 toBack(vec2 uv) {
    return uRectUv.xy + uv * uRectUv.zw;
  }

  vec3 backdrop(vec2 uv) {
    vec3 c = texture2D(uPhoto, toBack(uv)).rgb;
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
  }

  void main() {
    vec2 impactUv = vec2(uImpact.x, 1.0 - uImpact.y);
    vec2 uv = impactUv + (vUv - impactUv) * (1.0 - uPunch) + uShake / uSize;
    vec2 px = vec2(uv.x, 1.0 - uv.y) * uSize;
    vec2 impactPx = vec2(uImpact.x, uImpact.y) * uSize;
    vec2 toImpact = px - impactPx;
    float dist = length(toImpact);
    vec2 dir = dist > 0.001 ? toImpact / dist : vec2(0.0);

    float ring = exp(-pow((dist - uShock) / max(uShockWidth, 1.0), 2.0));
    uv += vec2(dir.x, -dir.y) * ring * uShockAmp / uSize;

    vec4 shard = texture2D(uShard, uv);
    vec2 shardOffset = (shard.rg - 0.5) * 2.0 * uShardOffset;
    float bright = (shard.b - 0.5) * 2.0;
    float tilt = (shard.a - 0.5) * 2.0;

    vec4 crack = texture2D(uCrack, uv);
    vec2 disp = (crack.rg - 0.5) * 2.0;
    float dark = crack.b;
    float core = crack.a;
    vec2 refr = disp * uRefract;

    vec2 cell = floor(px / CELL_SIZE);
    float crater = smoothstep(uCrater, uCrater * 0.25, dist) * step(0.001, uProgress) * (0.45 + 0.55 * hash21(cell + 3.1));
    vec2 cellJitter = (vec2(hash21(cell), hash21(cell + 7.3)) - 0.5) * 2.0 * CELL_JITTER * crater;

    vec2 offsetPx = shardOffset + refr + cellJitter;
    vec2 sampleUv = uv + vec2(offsetPx.x, -offsetPx.y) / uSize;
    vec2 ca = vec2(refr.x, -refr.y) * CHROMA / uSize;
    vec3 color;
    color.r = backdrop(sampleUv + ca).r;
    color.g = backdrop(sampleUv).g;
    color.b = backdrop(sampleUv - ca).b;

    color *= 1.0 + bright * BRIGHT_GAIN + tilt * TILT_GAIN;
    color = mix(color, color * 0.25, clamp(dark, 0.0, 1.0) * DARK_MIX * (1.0 - core));
    color = mix(color, color * 0.6 + 0.4, crater * FROST * (0.6 + 0.4 * hash21(px)));

    float nlen = length(disp);
    vec2 n = nlen > 0.01 ? disp / nlen : vec2(0.0, 1.0);
    float facing = dot(n, uLight);
    float segment = hash21(floor(px / GLINT_CELL));
    float sparkle = hash21(floor(px * 0.5));
    float glint = pow(clamp(facing * 0.5 + 0.5, 0.0, 1.0), 4.0) * (0.4 + 0.6 * segment) * (0.8 + 0.4 * sparkle);
    vec3 crackColor = mix(HAIRLINE, vec3(1.0), clamp(glint, 0.0, 1.0));
    color = mix(color, crackColor, clamp(core, 0.0, 1.0) * CRACK_MIX);

    float softCore = texture2D(uGlowMap, uv).r;
    color += GLOW_COLOR * (core + softCore * GLOW_SOFT) * uGlow;
    color += uFlash * exp(-dist * dist / (uCrater * uCrater * 4.0));
    color += SHEEN * smoothstep(0.2, 1.0, vUv.x * 0.55 + vUv.y * 0.45);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const sparkVertexShader = /* glsl */ `
  attribute vec2 aVelocity;
  attribute float aLife;
  attribute float aSize;
  attribute float aDelay;
  uniform vec2 uSize;
  uniform vec2 uImpact;
  uniform float uTime;
  uniform float uGravity;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vSeed;
  ${toClipSnippet}

  #define DRAG 0.55

  void main() {
    float t = uTime - aDelay;
    float alive = step(0.0, t) * step(t, aLife) * step(0.0, uTime);
    float k = clamp(t / aLife, 0.0, 1.0);
    vec2 travel = aVelocity * t * (1.0 - DRAG * k) + vec2(0.0, 0.5 * uGravity * t * t);
    vec2 px = uImpact * uSize + travel;
    vAlpha = alive * pow(1.0 - k, 1.5);
    vSeed = aDelay * 97.0 + aLife * 13.0;
    gl_Position = alive > 0.5 ? vec4(toClip(px, uSize), 0.0, 1.0) : vec4(2.0, 2.0, 0.0, 1.0);
    gl_PointSize = aSize * (1.0 - 0.6 * k) * uPixelRatio * alive;
  }
`;

export const sparkFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vSeed;
  uniform float uTime;

  #define SPARK_COLOR vec3(1.0, 0.97, 0.9)
  #define SPARK_EDGE vec3(0.2, 0.2, 0.22)

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float flicker = 0.7 + 0.3 * sin(uTime * 60.0 + vSeed);
    vec3 color = mix(SPARK_EDGE, SPARK_COLOR, smoothstep(0.75, 0.3, d));
    float a = pow(1.0 - d, 1.2) * vAlpha * flicker;
    gl_FragColor = vec4(color, a);
  }
`;

export const blurVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const blurFragmentShader = /* glsl */ `
  uniform sampler2D uSource;
  uniform vec2 uStep;
  uniform float uChannel;
  varying vec2 vUv;

  float pick(vec4 c) {
    return uChannel > 0.5 ? c.a : c.r;
  }

  void main() {
    float sum = pick(texture2D(uSource, vUv)) * 0.2270270270;
    sum += pick(texture2D(uSource, vUv + uStep * 1.3846153846)) * 0.3162162162;
    sum += pick(texture2D(uSource, vUv - uStep * 1.3846153846)) * 0.3162162162;
    sum += pick(texture2D(uSource, vUv + uStep * 3.2307692308)) * 0.0702702703;
    sum += pick(texture2D(uSource, vUv - uStep * 3.2307692308)) * 0.0702702703;
    gl_FragColor = vec4(sum, 0.0, 0.0, 1.0);
  }
`;

export const flyVertexShader = /* glsl */ `
  attribute vec2 aCenter;
  attribute float aSeed;
  uniform float uBreak;
  uniform vec2 uImpact;
  uniform vec4 uRect;
  uniform vec2 uViewport;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vUv = vec2(position.x / uRect.z, 1.0 - position.y / uRect.w);
    vec2 dir = normalize(aCenter - uImpact * uRect.zw);
    float phase = uBreak * (0.84 + mod(aSeed, 4.0) * 0.085);
    vec3 p = vec3(position.xy - aCenter, 0.0);
    float ax = phase * dir.y * 0.85;
    float ay = -phase * dir.x * 0.75;
    p.yz = mat2(cos(ax), -sin(ax), sin(ax), cos(ax)) * p.yz;
    p.xz = mat2(cos(ay), -sin(ay), sin(ay), cos(ay)) * p.xz;
    float az = phase * (mod(aSeed, 3.0) - 1.0) * 0.45;
    p.xy = mat2(cos(az), -sin(az), sin(az), cos(az)) * p.xy;
    p.z += phase * (190.0 + mod(aSeed, 3.0) * 46.0);
    float perspective = 1100.0 / max(600.0, 1100.0 - p.z);
    vec2 center = uRect.xy + aCenter + dir * phase * uViewport * vec2(0.70, 0.62);
    vec2 pixel = center + p.xy * perspective;
    gl_Position = vec4(pixel.x / uViewport.x * 2.0 - 1.0, 1.0 - pixel.y / uViewport.y * 2.0, 0.0, 1.0);
    vShade = 0.88 + 0.12 * cos(ax + ay);
  }
`;

export const flyFragmentShader = /* glsl */ `
  uniform sampler2D uGlass;
  uniform float uOpacity;
  uniform float uBreak;
  varying vec2 vUv;
  varying float vShade;
  void main() {
    vec3 color = texture2D(uGlass, vUv).rgb;
    color = mix(color * vShade, vec3(1.0), uBreak * 0.25);
    gl_FragColor = vec4(color, uOpacity);
    #include <colorspace_fragment>
  }
`;
