//~~~ トップページ: 円形トンネル ~~~
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  Quaternion,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
} from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";

const TUNNEL = {
  radius: 120,
  curveEnd: 1240,
  extent: 2900,
  cell: 18,
  sides: 42,
  period: 10,
  streams: 8,
  beamLength: 145,
  wallLookAhead: 210,
  stations: [310, 650, 990, 1330, 1670, 2010],
  readingOffset: 105,
  fog: [190, 680],
  gridWidth: 2,
  glow: [0.3, 0.1],
  pulse: { period: 8, fade: 2, wall: 0.5, background: 0.12 },
};

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function createTunnel(scene) {
  const { radius, curveEnd, extent, cell, sides, period, streams } = TUNNEL;
  const axisUp = new Vector3(0, 1, 0);
  const group = new Group();
  scene.add(group);

  //=== 中心線 ===
  const sampleCenter = (u, amplitude = 1) => {
    if (u >= curveEnd) return new Vector3(0, 0, 70 - u);
    const t = u / curveEnd;
    const envelope = Math.sin(Math.PI * t) ** 4;
    return new Vector3(96 * amplitude * Math.sin(2 * Math.PI * t) * envelope, 52 * amplitude * envelope, 70 - u);
  };

  let raw = [];
  let rawLengths = [];
  let rawTangents = [];
  let maxCurvature = 0;
  let amplitude = 1;

  const buildCenterline = () => {
    raw = [];
    rawLengths = [0];
    rawTangents = [];
    for (let u = 0; u <= extent; u += 2) raw.push(sampleCenter(u, amplitude));
    for (let i = 1; i < raw.length; i++) rawLengths[i] = rawLengths[i - 1] + raw[i].distanceTo(raw[i - 1]);
    for (let i = 0; i < raw.length; i++) {
      rawTangents.push(
        raw[Math.min(raw.length - 1, i + 1)]
          .clone()
          .sub(raw[Math.max(0, i - 1)])
          .normalize(),
      );
    }
    maxCurvature = 0;
    for (let i = 1; i < raw.length - 1; i++) {
      const angle = rawTangents[i - 1].angleTo(rawTangents[i + 1]);
      maxCurvature = Math.max(maxCurvature, angle / (rawLengths[i + 1] - rawLengths[i - 1]));
    }
  };
  buildCenterline();
  if (maxCurvature * radius > 0.52) {
    amplitude *= 0.5 / (maxCurvature * radius);
    buildCenterline();
  }

  const totalLength = rawLengths[rawLengths.length - 1];
  const straightStartDistance = rawLengths[curveEnd / 2];

  const find = distance => {
    const value = clamp(distance, 0, totalLength);
    let lo = 0;
    let hi = rawLengths.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (rawLengths[mid] <= value) lo = mid;
      else hi = mid;
    }
    return [lo, hi, (value - rawLengths[lo]) / Math.max(0.00001, rawLengths[hi] - rawLengths[lo])];
  };

  const at = distance => {
    const [a, b, t] = find(distance);
    return raw[a].clone().lerp(raw[b], t);
  };

  const tangentAt = distance => {
    if (distance >= straightStartDistance) return new Vector3(0, 0, -1);
    const [a, b, t] = find(distance);
    return rawTangents[a].clone().lerp(rawTangents[b], t).normalize();
  };

  //=== 断面の向き ===
  const rawRights = [new Vector3(1, 0, 0)];
  const rotation = new Quaternion();
  for (let i = 1; i < raw.length; i++) {
    rotation.setFromUnitVectors(rawTangents[i - 1], rawTangents[i]);
    const right = rawRights[i - 1].clone().applyQuaternion(rotation);
    right.addScaledVector(rawTangents[i], -right.dot(rawTangents[i])).normalize();
    rawRights.push(right);
  }

  const frameAt = distance => {
    const [a, b, t] = find(distance);
    const tangent = tangentAt(distance);
    const right = rawRights[a].clone().lerp(rawRights[b], t);
    const correction = clamp((distance - (straightStartDistance - 240)) / 240);
    if (correction > 0) {
      const levelRight = new Vector3().crossVectors(tangent, axisUp).normalize();
      right.lerp(levelRight, correction * correction * (3 - 2 * correction));
    }
    right.addScaledVector(tangent, -right.dot(tangent)).normalize();
    const up = new Vector3().crossVectors(right, tangent).normalize();
    return { right, up, tangent };
  };
  const upAt = distance => frameAt(distance).up;

  const ringCount = Math.ceil(totalLength / cell) + 1;
  const ringDistances = Array.from({ length: ringCount }, (_, i) => Math.min(i * cell, totalLength));
  const frames = ringDistances.map(frameAt);
  const centers = ringDistances.map(at);

  const ringPoint = (r, sector, inset = 0) => {
    const theta = (sector / sides) * Math.PI * 2;
    const frame = frames[r];
    return centers[r]
      .clone()
      .addScaledVector(frame.right, Math.cos(theta) * (radius - inset))
      .addScaledVector(frame.up, Math.sin(theta) * (radius - inset));
  };

  const ringNormal = (r, sector) => {
    const theta = (sector / sides) * Math.PI * 2;
    return frames[r].right.clone().multiplyScalar(Math.cos(theta)).addScaledVector(frames[r].up, Math.sin(theta));
  };

  //=== 壁の色 ===
  const pink = new Color("#f266c6");
  const blue = new Color("#3d95ff");
  const sky = new Color("#5cc2fa");
  const readingDistances = [0, ...TUNNEL.stations.map(station => station - TUNNEL.readingOffset)];
  const gradientStops = readingDistances.map((distance, i) => ({ distance: distance + TUNNEL.wallLookAhead, color: i === TUNNEL.stations.length ? sky : i % 2 === 0 ? blue : pink }));

  const colorAtDistance = (distance, target) => {
    if (distance <= gradientStops[0].distance) return target.copy(blue);
    for (let i = 1; i < gradientStops.length; i++) {
      const start = gradientStops[i - 1];
      const end = gradientStops[i];
      if (distance <= end.distance) {
        const t = clamp((distance - start.distance) / (end.distance - start.distance));
        return target.copy(start.color).lerp(end.color, t * t * (3 - 2 * t));
      }
    }
    return target.copy(gradientStops[gradientStops.length - 1].color);
  };

  //=== 壁と方眼 ===
  const surfacePositions = [];
  const surfaceColors = [];
  const surfaceIndices = [];
  const minor = [];
  const major = [];
  const pushSegment = (array, a, b) => array.push(a.x, a.y, a.z, b.x, b.y, b.z);

  for (let r = 0; r < ringCount; r++) {
    const depthColor = colorAtDistance(ringDistances[r], new Color());
    for (let s = 0; s <= sides; s++) {
      const point = ringPoint(r, s, -0.35);
      surfacePositions.push(point.x, point.y, point.z);
      const shade = 0.91 + 0.09 * Math.sin((s / sides) * Math.PI * 2);
      surfaceColors.push(depthColor.r * shade, depthColor.g * shade, depthColor.b * shade);
      if (r < ringCount - 1 && s < sides) {
        const a = r * (sides + 1) + s;
        const b = a + sides + 1;
        surfaceIndices.push(a, b, a + 1, b, b + 1, a + 1);
      }
      if (s < sides) {
        pushSegment(r % 5 === 0 ? major : minor, ringPoint(r, s), ringPoint(r, s + 1));
        if (r < ringCount - 1) pushSegment(s % 7 === 0 ? major : minor, ringPoint(r, s), ringPoint(r + 1, s));
      }
    }
  }

  const disposables = [];
  const wallGeometry = new BufferGeometry();
  wallGeometry.setAttribute("position", new Float32BufferAttribute(surfacePositions, 3));
  wallGeometry.setAttribute("color", new Float32BufferAttribute(surfaceColors, 3));
  wallGeometry.setIndex(surfaceIndices);
  const wallMaterial = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, fog: true });
  group.add(new Mesh(wallGeometry, wallMaterial));
  disposables.push(wallGeometry, wallMaterial);

  const gridMaterials = [];
  const addGrid = (positions, opacity) => {
    const geometry = new LineSegmentsGeometry().setPositions(positions);
    const material = new LineMaterial({ color: "#efffff", linewidth: TUNNEL.gridWidth, transparent: true, opacity, depthWrite: false, fog: true });
    group.add(new LineSegments2(geometry, material));
    gridMaterials.push(material);
    disposables.push(geometry, material);
  };
  addGrid(minor, 0.24);
  addGrid(major, 0.46);

  //=== 光の筋 ===
  const beamPosition = [];
  const beamExtrusion = [];
  const beamSide = [];
  const beamArc = [];
  const beamPhase = [];
  const beamLength = [];
  const beamColor = [];
  const beamIndex = [];
  const beamColors = [new Color("#ff74c7"), new Color("#61d6ff")];

  for (let stream = 0; stream < streams; stream++) {
    const nodes = [{ r: 0, s: Math.round((stream * sides) / streams) }];
    let r = 0;
    let s = nodes[0].s;
    let leg = 0;
    while (r < ringCount - 1) {
      const steps = leg % 2 === 0 ? 3 : 4;
      for (let k = 0; k < steps && r < ringCount - 1; k++) nodes.push({ r: ++r, s });
      if (r < ringCount - 1) {
        s += [1, -1, -1, 1][leg % 4];
        nodes.push({ r, s });
      }
      leg++;
    }
    const points = nodes.map(n => ringPoint(n.r, n.s, 0.65));
    const lengths = [0];
    for (let j = 1; j < points.length; j++) lengths[j] = lengths[j - 1] + points[j].distanceTo(points[j - 1]);
    const pathLength = lengths[lengths.length - 1];
    const color = beamColors[stream % 2];
    for (let j = 0; j < points.length - 1; j++) {
      const direction = points[j + 1].clone().sub(points[j]).normalize();
      const offsetA = new Vector3().crossVectors(ringNormal(nodes[j].r, nodes[j].s), direction).normalize();
      const offsetB = new Vector3().crossVectors(ringNormal(nodes[j + 1].r, nodes[j + 1].s), direction).normalize();
      const base = beamSide.length;
      [
        [points[j], offsetA, -1, lengths[j]],
        [points[j], offsetA, 1, lengths[j]],
        [points[j + 1], offsetB, -1, lengths[j + 1]],
        [points[j + 1], offsetB, 1, lengths[j + 1]],
      ].forEach(([point, offset, side, along]) => {
        beamPosition.push(point.x, point.y, point.z);
        beamExtrusion.push(offset.x, offset.y, offset.z);
        beamSide.push(side);
        beamArc.push(along / pathLength);
        beamPhase.push(stream / streams);
        beamLength.push(TUNNEL.beamLength / pathLength);
        beamColor.push(color.r, color.g, color.b);
      });
      beamIndex.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }

  const beamGeometry = new BufferGeometry();
  [
    ["position", beamPosition, 3],
    ["aExtrusion", beamExtrusion, 3],
    ["aSide", beamSide, 1],
    ["aArc", beamArc, 1],
    ["aPhase", beamPhase, 1],
    ["aLength", beamLength, 1],
    ["aColor", beamColor, 3],
  ].forEach(([name, data, size]) => beamGeometry.setAttribute(name, new Float32BufferAttribute(data, size)));
  beamGeometry.setIndex(beamIndex);
  disposables.push(beamGeometry);

  const vertexShader = `
    attribute vec3 aExtrusion; attribute float aSide; attribute float aArc;
    attribute float aPhase; attribute float aLength; attribute vec3 aColor;
    uniform float uWidth; varying float vSide; varying float vArc;
    varying float vPhase; varying float vLength; varying vec3 vColor;
    #include <fog_pars_vertex>
    void main(){
      vSide=aSide;vArc=aArc;vPhase=aPhase;vLength=aLength;vColor=aColor;
      vec3 transformed=position+aExtrusion*aSide*uWidth;
      vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);
      gl_Position=projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`;
  const fragmentShader = `
    uniform float uTime; uniform float uOpacity; uniform float uCore;
    varying float vSide; varying float vArc; varying float vPhase;
    varying float vLength; varying vec3 vColor;
    #include <fog_pars_fragment>
    void main(){
      float behind=fract(uTime/${period.toFixed(1)}+vPhase-vArc);
      if(behind>vLength)discard;
      float tail=pow(max(0.0,1.0-behind/vLength),0.72);
      float edge=mix(pow(max(0.0,1.0-abs(vSide)),1.5),1.0,uCore);
      vec3 color=mix(vColor,vec3(1.0),uCore*0.15);
      gl_FragColor=vec4(color,tail*edge*uOpacity);
      #include <fog_fragment>
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  const beamMaterials = [
    { width: 1.65, opacity: 0.46, core: 0 },
    { width: 0.34, opacity: 0.98, core: 1 },
  ].map(config => {
    const uniforms = UniformsUtils.merge([UniformsLib.fog, { uTime: { value: 0 }, uWidth: { value: config.width }, uOpacity: { value: config.opacity }, uCore: { value: config.core } }]);
    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: DoubleSide,
      blending: config.core ? NormalBlending : AdditiveBlending,
      fog: true,
    });
    const mesh = new Mesh(beamGeometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    group.add(mesh);
    disposables.push(material);
    return material;
  });

  //=== 背景と霧 ===
  const glowColor = (distance, target) => colorAtDistance(distance, target).offsetHSL(0, TUNNEL.glow[0], TUNNEL.glow[1]);
  scene.background = glowColor(0, new Color());
  scene.fog = new Fog(scene.background.clone(), TUNNEL.fog[0], TUNNEL.fog[1]);

  //=== 明るさの脈動 ===
  const pulseAt = time => {
    const { period, fade } = TUNNEL.pulse;
    const t = time % period;
    const rise = clamp(t / fade);
    const fall = clamp((t - fade) / fade);
    const value = t < fade ? rise : 1 - fall;
    return value * value * (3 - 2 * value);
  };

  let clock = 0;
  let lastTime = null;

  const update = (timeSeconds, distance, { motion = true } = {}) => {
    if (motion || lastTime === null) clock = Math.max(0, timeSeconds);
    lastTime = timeSeconds;
    beamMaterials.forEach(material => {
      material.uniforms.uTime.value = clock;
    });
    const brightness = motion ? pulseAt(clock) : 0;
    wallMaterial.color.setScalar(1 + TUNNEL.pulse.wall * brightness);
    glowColor(distance + TUNNEL.wallLookAhead, scene.background).offsetHSL(0, 0, TUNNEL.pulse.background * brightness);
    scene.fog.color.copy(scene.background);
  };

  const setResolution = (width, height) => {
    gridMaterials.forEach(material => material.resolution.set(width, height));
  };

  const dispose = () => {
    disposables.forEach(item => item.dispose());
    scene.remove(group);
  };

  return { totalLength, stations: TUNNEL.stations, at, tangentAt, upAt, update, setResolution, dispose };
}
