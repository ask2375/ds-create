//~~~ トップページ MV: ガラスのひび割れの幾何（板の形は多角形で渡す） ~~~

export const GLASS_PRESET_REAL = {
  spokes: { pc: [13, 18], sp: [10, 13] },
  angleJitter: 0.45,
  segment: 0.14,
  kinkChance: 0.45,
  kinkAngle: [6, 16],
  connectors: { pc: [3, 6], sp: [2, 4] },
  connectorRange: [0.05, 0.82],
  connectorGap: 0.05,
  connectorSkew: 0.2,
  connectorBow: 0.05,
  connectorKinkChance: 0.6,
  branches: [1, 3],
  branchRange: [0.12, 0.7],
  branchLength: [0.04, 0.14],
  branchAngle: [15, 45],
  branchKink: [15, 35],
  connectorBranchRate: 0.35,
  crushCount: [14, 22],
  crushLength: [0.02, 0.09],
  crushKink: 0,
};

const TWO_PI = Math.PI * 2;
const DEG = Math.PI / 180;
const MIN_SHARD_AREA = 4;

export const randBetween = (min, max) => min + Math.random() * (max - min);
export const randInt = ([min, max]) => Math.floor(randBetween(min, max + 1));

//=== 板の縁 ===
function distanceToEdge(cx, cy, angle, shape) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Infinity;
  for (let i = 0; i < shape.length; i++) {
    const a = shape[i];
    const b = shape[(i + 1) % shape.length];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-9) continue;
    const t = ((a.x - cx) * ey - (a.y - cy) * ex) / denom;
    const u = ((a.x - cx) * dy - (a.y - cy) * dx) / denom;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
}

function isAngleBetween(a, from, to) {
  const span = (to - from + TWO_PI) % TWO_PI;
  const offset = (a - from + TWO_PI) % TWO_PI;
  return offset > 0 && offset < span;
}

//=== 放射ひび ===
function buildSpoke(cx, cy, baseAngle, shape, maxDist, preset) {
  const points = [{ x: cx, y: cy }];
  const cumulative = [0];
  let angle = baseAngle;
  let x = cx;
  let y = cy;
  const segment = maxDist * preset.segment;

  for (let i = 0; i < 60; i++) {
    const remain = distanceToEdge(x, y, angle, shape);
    if (!Number.isFinite(remain) || remain <= 0) break;
    const step = Math.min(segment * randBetween(0.7, 1.3), remain);
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    points.push({ x, y });
    cumulative.push(cumulative[cumulative.length - 1] + step);
    if (step >= remain - 0.01) break;
    if (Math.random() < preset.kinkChance) angle += (Math.random() < 0.5 ? -1 : 1) * randBetween(preset.kinkAngle[0], preset.kinkAngle[1]) * DEG;
  }

  const end = points[points.length - 1];
  return { points, cumulative, length: cumulative[cumulative.length - 1], endAngle: Math.atan2(end.y - cy, end.x - cx) };
}

export function pointAt(spoke, d) {
  const { points, cumulative } = spoke;
  const target = Math.min(Math.max(d, 0), spoke.length);
  for (let i = 1; i < points.length; i++) {
    if (cumulative[i] >= target) {
      const t = (target - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1] || 1);
      return { x: points[i - 1].x + (points[i].x - points[i - 1].x) * t, y: points[i - 1].y + (points[i].y - points[i - 1].y) * t };
    }
  }
  return points[points.length - 1];
}

export function verticesBetween(spoke, a, b) {
  const forward = a <= b;
  const [lo, hi] = forward ? [a, b] : [b, a];
  const list = [pointAt(spoke, lo)];
  spoke.points.forEach((p, i) => {
    if (spoke.cumulative[i] > lo + 0.01 && spoke.cumulative[i] < hi - 0.01) list.push(p);
  });
  list.push(pointAt(spoke, hi));
  return forward ? list : list.reverse();
}

//=== 横ひび・枝 ===
function buildConnector(from, to, bow, kinkChance) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const sign = Math.random() < 0.5 ? -1 : 1;
  if (Math.random() >= kinkChance) return [from, to];
  const t = randBetween(0.3, 0.7);
  const off = bow * sign * randBetween(0.5, 1);
  return [from, { x: from.x + dx * t + nx * off, y: from.y + dy * t + ny * off }, to];
}

function buildBranch(base, dir, side, angleRange, len, kink) {
  const angle = dir + side * randBetween(angleRange[0], angleRange[1]) * DEG;
  const mid = { x: base.x + Math.cos(angle) * len * 0.55, y: base.y + Math.sin(angle) * len * 0.55 };
  const bend = angle + side * randBetween(kink[0], kink[1]) * DEG;
  return [base, mid, { x: mid.x + Math.cos(bend) * len * 0.45, y: mid.y + Math.sin(bend) * len * 0.45 }];
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function polygonCentroid(points) {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

//=== 生成 ===
export function buildGlassGeometry(shape, impact, preset, mobile) {
  const { x: cx, y: cy } = impact;
  const corners = shape.map(({ x, y }) => ({ x, y, angle: Math.atan2(y - cy, x - cx) }));
  const maxDist = Math.max(...corners.map(c => Math.hypot(c.x - cx, c.y - cy)));

  const spokeCount = randInt(mobile ? preset.spokes.sp : preset.spokes.pc);
  const step = TWO_PI / spokeCount;
  const startAngle = Math.random() * TWO_PI;
  const spokes = [];
  for (let j = 0; j < spokeCount; j++) {
    const angle = startAngle + j * step + randBetween(-preset.angleJitter, preset.angleJitter) * step;
    spokes.push(buildSpoke(cx, cy, angle, shape, maxDist, preset));
  }
  spokes.sort((a, b) => ((a.endAngle - startAngle + TWO_PI) % TWO_PI) - ((b.endAngle - startAngle + TWO_PI) % TWO_PI));

  const sectors = spokes.map((spoke, j) => {
    const next = spokes[(j + 1) % spokeCount];
    const limit = Math.min(spoke.length, next.length) * 0.9;
    const count = randInt(mobile ? preset.connectors.sp : preset.connectors.pc);
    const distances = [];
    for (let tries = 0; tries < 30 && distances.length < count; tries++) {
      const d = maxDist * randBetween(preset.connectorRange[0], preset.connectorRange[1]);
      if (d * (1 + preset.connectorSkew) >= limit) continue;
      if (distances.some(other => Math.abs(other - d) < maxDist * preset.connectorGap)) continue;
      distances.push(d);
    }
    distances.sort((a, b) => a - b);
    const connectors = distances.map(d => {
      const dA = d * (1 + randBetween(-preset.connectorSkew, preset.connectorSkew));
      const dB = d * (1 + randBetween(-preset.connectorSkew, preset.connectorSkew));
      return { dA, dB, dist: d, points: buildConnector(pointAt(spoke, dA), pointAt(next, dB), maxDist * preset.connectorBow, preset.connectorKinkChance) };
    });
    return { spoke, next, connectors };
  });

  const lines = [];
  spokes.forEach(spoke => lines.push({ kind: "spoke", points: spoke.points, dist: 0 }));
  sectors.forEach(({ connectors }) => connectors.forEach(c => lines.push({ kind: "connector", points: c.points, dist: c.dist })));

  spokes.forEach(spoke => {
    const count = randInt(preset.branches);
    for (let i = 0; i < count; i++) {
      const d = spoke.length * randBetween(preset.branchRange[0], preset.branchRange[1]);
      const base = pointAt(spoke, d);
      const ahead = pointAt(spoke, Math.min(d + 1, spoke.length));
      const dir = Math.atan2(ahead.y - base.y, ahead.x - base.x);
      const side = Math.random() < 0.5 ? -1 : 1;
      const len = maxDist * randBetween(preset.branchLength[0], preset.branchLength[1]);
      lines.push({ kind: "branch", points: buildBranch(base, dir, side, preset.branchAngle, len, preset.branchKink), dist: d });
    }
  });
  sectors.forEach(({ connectors }) => {
    connectors.forEach(c => {
      if (Math.random() >= preset.connectorBranchRate) return;
      const [a, b] = [c.points[0], c.points[c.points.length - 1]];
      const base = c.points.length > 2 ? c.points[1] : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dir = Math.atan2(b.y - a.y, b.x - a.x);
      const side = Math.random() < 0.5 ? -1 : 1;
      const len = maxDist * randBetween(preset.branchLength[0], preset.branchLength[1]) * 0.7;
      lines.push({ kind: "branch", points: buildBranch(base, dir, side, [50, 80], len, preset.branchKink), dist: c.dist });
    });
  });

  const crushCount = randInt(preset.crushCount);
  for (let i = 0; i < crushCount; i++) {
    const angle = Math.random() * TWO_PI;
    const len = maxDist * randBetween(preset.crushLength[0], preset.crushLength[1]);
    const mid = { x: cx + Math.cos(angle) * len * 0.5, y: cy + Math.sin(angle) * len * 0.5 };
    const bend = angle + randBetween(-preset.crushKink, preset.crushKink) * DEG;
    lines.push({ kind: "crush", points: [{ x: cx, y: cy }, mid, { x: mid.x + Math.cos(bend) * len * 0.5, y: mid.y + Math.sin(bend) * len * 0.5 }], dist: 0 });
  }

  const shards = [];
  const addShard = points => {
    if (polygonArea(points) < MIN_SHARD_AREA) return;
    const centroid = polygonCentroid(points);
    const radius = Math.max(...points.map(p => Math.hypot(p.x - centroid.x, p.y - centroid.y)));
    shards.push({ points, centroid, radius, dist: Math.hypot(centroid.x - cx, centroid.y - cy) });
  };

  sectors.forEach(({ spoke, next, connectors }) => {
    let innerA = 0;
    let innerB = 0;
    let innerPoints = null;
    connectors.forEach(connector => {
      const points = [...verticesBetween(spoke, innerA, connector.dA), ...connector.points.slice(1, -1), ...verticesBetween(next, connector.dB, innerB)];
      if (innerPoints) points.push(...[...innerPoints].reverse().slice(1, -1));
      addShard(points);
      innerA = connector.dA;
      innerB = connector.dB;
      innerPoints = connector.points;
    });
    const outer = [...verticesBetween(spoke, innerA, spoke.length)];
    const span = (next.endAngle - spoke.endAngle + TWO_PI) % TWO_PI;
    corners
      .filter(c => span < Math.PI && isAngleBetween(c.angle, spoke.endAngle, next.endAngle))
      .sort((a, b) => ((a.angle - spoke.endAngle + TWO_PI) % TWO_PI) - ((b.angle - spoke.endAngle + TWO_PI) % TWO_PI))
      .forEach(c => outer.push({ x: c.x, y: c.y }));
    outer.push(...verticesBetween(next, next.length, innerB));
    if (innerPoints) outer.push(...[...innerPoints].reverse().slice(1, -1));
    addShard(outer);
  });

  return { impact, maxDist, lines, shards };
}
