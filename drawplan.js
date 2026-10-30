// Drawing board: the rep draws walls freely with a finger, a whole house or one room.
// Each stroke is read like the room sketch in fitcheck.html: corners where it turns sharply, every piece between corners a
// straight wall (snapped to 45 degrees) or a curved one (when it follows a clean arc). Unlike the room sketch, the board is a
// grid (one square = 50 cm), so the drawing has rough sizes; tapping a wall and typing its real length stretches the plan to
// it, and a wall shared by two rooms is measured once. Strokes join where they start or end near a wall or a corner, and
// walls that cross are split, so a house outline with inside walls becomes a set of rooms (the enclosed areas).
// Plan coordinates are centimetres, x to the right and y down (as on screen).

const D8 = [[1, 0], [Math.SQRT1_2, Math.SQRT1_2], [0, 1], [-Math.SQRT1_2, Math.SQRT1_2], [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2], [0, -1], [Math.SQRT1_2, -Math.SQRT1_2]];
const TURNNAME = { 0: 'S', 1: 'R45', 2: 'R', 3: 'R135', '-1': 'L45', '-2': 'L', '-3': 'L135' };
export const GRID = 50;          // cm per grid square
const STEP = 10;                 // drawn lengths snap to 10 cm
const snap8 = an => ((Math.round(an / (Math.PI / 4)) % 8) + 8) % 8;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rnd = v => Math.round(v * 10) / 10;

export const newPlan = () => ({ v: [], e: [] });   // v: {x, y}; e: {a, b, c (curve depth, + bulges to the right of a->b), m (measured)}

// ---- one stroke -> pieces ----
// raw: [[x, y], ...] in cm. Returns {closed, start, pieces: [{d, len, c}]} or {err}.
export function readStroke(raw) {
  const R = raw.map(([x, y]) => ({ x, y }));
  let total = 0;
  for (let i = 1; i < R.length; i++) total += dist(R[i], R[i - 1]);
  if (R.length < 4 || total < GRID * 0.6) return { err: 'short' };
  const step = Math.max(1, total / 160);
  let P = [R[0]], prev = R[0], need = step;
  for (let i = 1; i < R.length; i++) {
    const cur = R[i]; let seg = dist(cur, prev);
    while (seg >= need && seg > 0) { const t = need / seg, p = { x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t }; P.push(p); prev = p; seg = dist(cur, prev); need = step }
    need -= seg; prev = cur;
  }
  if (dist(P[P.length - 1], R[R.length - 1]) > step / 2) P.push(R[R.length - 1]);
  const closed = total >= GRID * 3 && dist(P[0], P[P.length - 1]) <= Math.max(GRID * 0.8, total * 0.06);
  if (closed) while (P.length > 3 && dist(P[0], P[P.length - 1]) < step * 1.5) P.pop();
  let n = P.length;
  if (n < 8) return { err: 'short' };
  const P0 = P.slice();   // before smoothing: where the walls really run (smoothing rounds the corners off)
  for (let pass = 0; pass < 3; pass++) P = P.map((p, i) => {
    if (!closed && (i === 0 || i === n - 1)) return p;
    const a = P[(i - 1 + n) % n], b = P[(i + 1) % n];
    return { x: (a.x + 2 * p.x + b.x) / 4, y: (a.y + 2 * p.y + b.y) / 4 };
  });
  // corners: sharp turns measured over a stretch on each side
  const k = Math.max(3, Math.round(n * 0.025));
  const at = i => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
  const ang = P.map((p, i) => {
    if (!closed && (i < k || i > n - 1 - k)) return 0;
    const a = at(i - k), b = at(i + k), v1 = [p.x - a.x, p.y - a.y], v2 = [b.x - p.x, b.y - p.y];
    return Math.abs(Math.atan2(v1[0] * v2[1] - v1[1] * v2[0], v1[0] * v2[0] + v1[1] * v2[1]) * 180 / Math.PI);
  });
  const corners = [];
  for (let i = 0; i < n; i++) {
    const a = ang[i]; if (a < 28) continue; let peak = true;
    for (let j = 1; j <= k; j++) if (ang[(i + j) % n] > a || ang[(i - j + n) % n] > a) { peak = false; break }
    if (peak && (!corners.length || i - corners[corners.length - 1] > k)) corners.push(i);
  }
  if (closed && corners.length > 1 && n - corners[corners.length - 1] + corners[0] <= k) corners.pop();
  let breaks;
  if (closed) { if (corners.length < 3) return { err: corners.length ? 'unclear' : 'round' }; breaks = corners }
  else breaks = [0, ...corners, n - 1];
  const m0 = closed ? breaks.length : breaks.length - 1;
  let pieces = [];
  for (let bi = 0; bi < m0; bi++) {
    const s = breaks[bi], e = breaks[(bi + 1) % breaks.length], pts = [];
    for (let i = s; ; i = (i + 1) % n) { pts.push(P[i]); if (i === e) break }
    const a = pts[0], b = pts[pts.length - 1], dx = b.x - a.x, dy = b.y - a.y, ch = Math.hypot(dx, dy) || 1e-9;
    let num = 0, den = 0, ss = 0;
    const dv = pts.map(p => { const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (ch * ch), dev = (dx * (p.y - a.y) - dy * (p.x - a.x)) / ch, f = 4 * t * (1 - t); num += dev * f; den += f * f; ss += dev * dev; return [t, dev] });
    const sf = den ? num / den : 0; let res = 0;
    dv.forEach(([t, dev]) => { const r = dev - 4 * sf * t * (1 - t); res += r * r });
    const r2 = ss ? 1 - res / ss : 0, curved = Math.abs(sf) >= 0.08 * ch && Math.abs(sf) >= GRID * 0.25 && r2 >= 0.6;
    const an = Math.atan2(dy, dx);
    pieces.push({ a, b, an, d: snap8(an), len: ch, c: curved ? sf : 0, s, e });
  }
  // join straight pieces that are nearly in line (a wobble, not a corner); drop tiny ones
  const cyc = closed;
  let changed = true, guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    const lim = cyc ? pieces.length : pieces.length - 1;
    for (let i = 0; i < lim && pieces.length > (cyc ? 3 : 1); i++) {
      const j = (i + 1) % pieces.length, A = pieces[i], B = pieces[j];
      if (A.c || B.c) continue;
      let da = Math.abs(B.an - A.an) % (2 * Math.PI); if (da > Math.PI) da = 2 * Math.PI - da;
      if (da < 22 * Math.PI / 180 || A.d === B.d) {
        const an = Math.atan2(B.b.y - A.a.y, B.b.x - A.a.x);
        pieces[i] = { a: A.a, b: B.b, an, d: snap8(an), len: dist(A.a, B.b), c: 0, s: A.s, e: B.e }; pieces.splice(j, 1);
        if (j < i) pieces.unshift(pieces.pop());
        changed = true; break;
      }
    }
    if (changed) continue;
    if (pieces.length > (cyc ? 3 : 1)) { const t = pieces.findIndex(p => p.len < GRID * 0.3 && !p.c); if (t >= 0) { pieces.splice(t, 1); changed = true } }
  }
  if (closed && pieces.length < 3) return { err: 'unclear' };
  // each straight wall is a line in its snapped direction through the middle of its drawn points; corners are where
  // neighbouring lines meet (the drawn corner itself is rounded off and sits inside the room)
  const m = pieces.length;
  pieces.forEach(p => {
    const idx = []; for (let i = p.s; ; i = (i + 1) % n) { idx.push(i); if (i === p.e) break }
    const mid = idx.length > 2 * k + 2 ? idx.slice(k, idx.length - k) : idx, q = mid.map(i => P0[i]);
    p.o = { x: q.reduce((a, v) => a + v.x, 0) / q.length, y: q.reduce((a, v) => a + v.y, 0) / q.length }; p.u = D8[p.d];
  });
  const proj = (p, q) => { const t = (q.x - p.o.x) * p.u[0] + (q.y - p.o.y) * p.u[1]; return { x: p.o.x + p.u[0] * t, y: p.o.y + p.u[1] * t } };
  const meet = (A, B, q) => {   // corner between piece A and the next piece B (q: the drawn corner)
    if (A.c && B.c) return q; if (A.c) return proj(B, q); if (B.c) return proj(A, q);
    const den = A.u[0] * B.u[1] - A.u[1] * B.u[0]; if (Math.abs(den) < 1e-6) return q;
    const t = ((B.o.x - A.o.x) * B.u[1] - (B.o.y - A.o.y) * B.u[0]) / den; return { x: A.o.x + A.u[0] * t, y: A.o.y + A.u[1] * t };
  };
  const V = [];
  for (let i = 0; i < m; i++) V.push(i === 0 && !closed ? (pieces[0].c ? pieces[0].a : proj(pieces[0], P0[0])) : meet(pieces[(i - 1 + m) % m], pieces[i], pieces[i].a));
  V.push(closed ? V[0] : (pieces[m - 1].c ? pieces[m - 1].b : proj(pieces[m - 1], P0[n - 1])));
  const out = pieces.map((p, i) => {
    const a = V[i], b = V[i + 1];
    if (p.c) { const an = Math.atan2(b.y - a.y, b.x - a.x); return { d: snap8(an), len: Math.max(STEP, Math.round(dist(a, b) / STEP) * STEP), c: Math.sign(p.c) * Math.max(5, Math.round(Math.abs(p.c) / 5) * 5) } }
    const L = (b.x - a.x) * p.u[0] + (b.y - a.y) * p.u[1];
    return { d: p.d, len: Math.max(STEP, Math.round(L / STEP) * STEP), c: 0 };
  });
  return { closed, start: V[0], end: P0[n - 1], pieces: out };
}

// ---- the plan graph ----
const onSeg = (p, a, b) => {   // distance from p to segment ab, and where along it (0..1)
  const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9, t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2;
  const tc = Math.max(0, Math.min(1, t)), q = { x: a.x + dx * tc, y: a.y + dy * tc };
  return { d: dist(p, q), t, q };
};

// Nearest corner or wall within tol cm. Returns {p, hit} (p on the grid when nothing is near and grid is true).
// Corners win only when the point is close to them (half of tol); otherwise a wall within tol, then a corner within tol.
export function snapPoint(plan, p, tol, grid = true) {
  let best = null, bd = tol / 2;
  const corner = r => { plan.v.forEach(v => { if (!v) return; const d = dist(p, v); if (d < bd) { bd = d; best = { p: { x: v.x, y: v.y }, hit: true } } }) };
  corner();
  if (best) return best;
  bd = tol;
  plan.e.forEach((e, ei) => {
    if (!e || e.c) return; const s = onSeg(p, plan.v[e.a], plan.v[e.b]);
    if (s.d < bd && s.t > 0 && s.t < 1) { bd = s.d; best = { p: { x: rnd(s.q.x), y: rnd(s.q.y) }, hit: true, e: ei } }
  });
  if (best) return best;
  bd = tol; corner();
  if (best) return best;
  return grid ? { p: { x: Math.round(p.x / STEP) * STEP, y: Math.round(p.y / STEP) * STEP }, hit: false } : { p, hit: false };
}

// The corner at p: an existing one (within 1 cm), else a new one, splitting a straight wall it lies on.
function vertexAt(plan, p) {
  const i = plan.v.findIndex(v => v && dist(v, p) < 1);
  if (i >= 0) return i;
  plan.v.push({ x: rnd(p.x), y: rnd(p.y) });
  const id = plan.v.length - 1;
  for (let ei = 0; ei < plan.e.length; ei++) {
    const e = plan.e[ei]; if (!e || e.c) continue;
    const s = onSeg(p, plan.v[e.a], plan.v[e.b]);
    if (s.d < 1 && s.t > 0.001 && s.t < 0.999) { plan.e[ei] = null; plan.e.push({ a: e.a, b: id, c: 0, m: false }, { a: id, b: e.b, c: 0, m: false }); break }
  }
  return id;
}

const segCross = (a, b, c, d) => {   // proper crossing point of ab and cd, or null
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y }, den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den, u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  return t > 1e-3 && t < 1 - 1e-3 && u > 1e-3 && u < 1 - 1e-3 ? { x: a.x + r.x * t, y: a.y + r.y * t, t } : null;
};

// A wall from corner ia to corner ib, split where it crosses other walls or passes over corners.
function addEdge(plan, ia, ib, c = 0) {
  if (ia === ib) return;
  const A = plan.v[ia], B = plan.v[ib];
  if (c) { if (!plan.e.some(e => e && ((e.a === ia && e.b === ib) || (e.a === ib && e.b === ia)))) plan.e.push({ a: ia, b: ib, c, m: false }); return }
  const cuts = [];
  plan.e.forEach(e => { if (!e || e.c || [e.a, e.b].includes(ia) || [e.a, e.b].includes(ib)) return; const x = segCross(A, B, plan.v[e.a], plan.v[e.b]); if (x) cuts.push(x) });
  plan.v.forEach((v, i) => { if (!v || i === ia || i === ib) return; const s = onSeg(v, A, B); if (s.d < 1 && s.t > 0.001 && s.t < 0.999) cuts.push({ x: v.x, y: v.y, t: s.t }) });
  cuts.sort((p, q) => p.t - q.t);
  const ids = [ia, ...cuts.map(p => vertexAt(plan, p)), ib];
  for (let i = 0; i + 1 < ids.length; i++) {
    const a = ids[i], b = ids[i + 1];
    if (a !== b && !plan.e.some(e => e && ((e.a === a && e.b === b) || (e.a === b && e.b === a)))) plan.e.push({ a, b, c: 0, m: false });
  }
}

// Add one drawn stroke to the plan. tol: how near (cm) a stroke's start or end must be to join a corner or wall.
export function addStroke(plan, raw, tol) {
  const r = readStroke(raw);
  if (r.err) return r;
  const s = snapPoint(plan, r.start, tol);
  const vec = r.pieces.map(p => [D8[p.d][0] * p.len, D8[p.d][1] * p.len]);
  // the start moved onto a wall or corner: the first wall still ends where it was drawn
  if (!r.pieces[0].c) { const u = D8[r.pieces[0].d], sh = (s.p.x - r.start.x) * u[0] + (s.p.y - r.start.y) * u[1], L = Math.round((r.pieces[0].len - sh) / STEP) * STEP; if (L >= STEP) { vec[0] = [u[0] * L, u[1] * L] } }
  const walk = () => { const pts = [s.p]; vec.forEach(v => { const l = pts[pts.length - 1]; pts.push({ x: l.x + v[0], y: l.y + v[1] }) }); return pts };
  let pts = walk(), end = pts[pts.length - 1], target = null;
  if (r.closed) target = s.p;
  else {
    // the drawn end decides where the stroke was meant to stop: a corner or wall near it, else its own start
    let t = snapPoint(plan, r.end, tol, false);
    if (!t.hit) t = snapPoint(plan, end, tol, false);
    if (t.hit) {
      target = t.p;
      // ending on a wall: slide along it to where the last piece's own direction meets it, so the new wall stays straight
      const lv = vec[vec.length - 1], from = pts[pts.length - 2], E = t.e != null ? plan.e[t.e] : null;
      if (E) {
        const A = plan.v[E.a], B = plan.v[E.b], rx = lv[0], ry = lv[1], sx = B.x - A.x, sy = B.y - A.y, den = rx * sy - ry * sx;
        if (Math.abs(den) > 1e-9) {
          const u = ((A.x - from.x) * ry - (A.y - from.y) * rx) / den, k = ((A.x - from.x) * sy - (A.y - from.y) * sx) / den;
          if (u > 0.001 && u < 0.999 && k > 0) target = { x: rnd(A.x + sx * u), y: rnd(A.y + sy * u) };
        }
      }
    }
    else if (dist(end, s.p) < tol && vec.length > 2) target = s.p;
  }
  if (target) {   // close the small gap: x error on the walls running across, y error on the walls running down
    let ex = target.x - end.x, ey = target.y - end.y;
    const H = vec.map((v, i) => Math.abs(v[1]) < 1e-9 ? i : -1).filter(i => i >= 0), V = vec.map((v, i) => Math.abs(v[0]) < 1e-9 ? i : -1).filter(i => i >= 0);
    const spread = (list, k, err) => { const tot = list.reduce((a, i) => a + Math.abs(vec[i][k]), 0); if (!tot) return err; list.forEach(i => { vec[i][k] += err * Math.abs(vec[i][k]) / tot }); return 0 };
    ex = spread(H, 0, ex); ey = spread(V, 1, ey);
    if (ex || ey) { const l = vec[vec.length - 1]; l[0] += ex; l[1] += ey }
    pts = walk(); pts[pts.length - 1] = target;
  }
  const ids = pts.map(p => vertexAt(plan, p));
  r.pieces.forEach((p, i) => addEdge(plan, ids[i], ids[i + 1], p.c));
  // a line drawn a little past a wall (now or by an earlier stroke): cut off the loose bit beyond it
  const deg = new Map(); plan.e.forEach(e => { if (e) { deg.set(e.a, (deg.get(e.a) || 0) + 1); deg.set(e.b, (deg.get(e.b) || 0) + 1) } });
  plan.e.forEach((e, i) => {
    if (!e || e.c) return; const [lo, hi] = deg.get(e.a) === 1 ? [e.a, e.b] : deg.get(e.b) === 1 ? [e.b, e.a] : [-1];
    if (lo >= 0 && deg.get(hi) >= 3 && edgeLen(plan, e) < Math.min(tol * 1.2, GRID * 1.2)) removeEdge(plan, i);
  });
  return { ok: true, closed: !!target };
}

// Remove a wall, and corners no wall uses any more.
export function removeEdge(plan, ei) {
  plan.e[ei] = null;
  const used = new Set(); plan.e.forEach(e => { if (e) { used.add(e.a); used.add(e.b) } });
  plan.v = plan.v.map((v, i) => used.has(i) ? v : null);
}

// Compact the plan (drop removed walls and corners), e.g. before saving.
export function tidy(plan) {
  const map = new Map(), v = [];
  plan.v.forEach((p, i) => { if (p) { map.set(i, v.length); v.push(p) } });
  return { v, e: plan.e.filter(e => e && map.has(e.a) && map.has(e.b)).map(e => ({ ...e, a: map.get(e.a), b: map.get(e.b) })) };
}

export const edgeLen = (plan, e) => dist(plan.v[e.a], plan.v[e.b]);

// Type a wall's real length: everything beyond the wall's far end moves along the wall by the difference, so walls in line
// with it (other rooms, shared walls) stay joined. Returns the other measured walls whose length changed.
export function setLength(plan, ei, L) {
  const e = plan.e[ei];
  if (!e || !(L > 0)) return [];                       // a wall removed meanwhile (undo, delete): nothing to do
  const a = plan.v[e.a], b = { ...plan.v[e.b] }, cur = dist(a, b);   // b copied: it moves too
  if (!cur) return [];
  const ux = (b.x - a.x) / cur, uy = (b.y - a.y) / cur, delta = L - cur, before = plan.e.map(x => x && x.m ? edgeLen(plan, x) : 0);
  const axis = Math.abs(uy) < 1e-6 ? 'x' : Math.abs(ux) < 1e-6 ? 'y' : null;
  plan.v.forEach((p, i) => {
    if (!p || i === e.a) return;
    if (axis === 'x') { if ((p.x - b.x) * ux >= -0.5) p.x = rnd(p.x + delta * ux) }
    else if (axis === 'y') { if ((p.y - b.y) * uy >= -0.5) p.y = rnd(p.y + delta * uy) }
    else if ((p.x - b.x) * ux + (p.y - b.y) * uy >= -0.5) { p.x = rnd(p.x + delta * ux); p.y = rnd(p.y + delta * uy) }
  });
  e.m = true;
  return plan.e.map((x, i) => x && x.m && i !== ei && Math.abs(edgeLen(plan, x) - before[i]) > 0.5 ? i : -1).filter(i => i >= 0);
}

export function setDepth(plan, ei, depth) { const e = plan.e[ei]; if (e && e.c && depth > 0) { e.c = Math.sign(e.c) * depth; e.m = true } }

// ---- rooms: the enclosed areas ----
// Walls with a loose end are left out; every closed area traced clockwise is a room.
export function faces(plan) {
  const alive = plan.e.map(e => !!e), deg = new Map();
  const bump = (i, k) => deg.set(i, (deg.get(i) || 0) + k);
  plan.e.forEach(e => { if (e) { bump(e.a, 1); bump(e.b, 1) } });
  let pruned = true;
  while (pruned) { pruned = false; plan.e.forEach((e, i) => { if (alive[i] && (deg.get(e.a) < 2 || deg.get(e.b) < 2)) { alive[i] = false; bump(e.a, -1); bump(e.b, -1); pruned = true } }) }
  const out = new Map();
  plan.e.forEach((e, i) => {
    if (!alive[i]) return; const A = plan.v[e.a], B = plan.v[e.b];
    (out.get(e.a) || out.set(e.a, []).get(e.a)).push({ e: i, to: e.b, fwd: true, an: Math.atan2(B.y - A.y, B.x - A.x) });
    (out.get(e.b) || out.set(e.b, []).get(e.b)).push({ e: i, to: e.a, fwd: false, an: Math.atan2(A.y - B.y, A.x - B.x) });
  });
  out.forEach(l => l.sort((p, q) => p.an - q.an));
  const seen = new Set(), res = [];
  out.forEach((list, u) => list.forEach(h0 => {
    if (seen.has(h0.e + ':' + h0.fwd)) return;
    const hs = [], vs = []; let h = h0, from = u, guard = 0;
    while (!seen.has(h.e + ':' + h.fwd) && guard++ < 10000) {
      seen.add(h.e + ':' + h.fwd); hs.push(h); vs.push(from);
      const l = out.get(h.to), back = l.findIndex(x => x.e === h.e && x.fwd !== h.fwd);
      from = h.to; h = l[(back - 1 + l.length) % l.length];
    }
    let area = 0; vs.forEach((vi, i) => { const p = plan.v[vi], q = plan.v[vs[(i + 1) % vs.length]]; area += p.x * q.y - q.x * p.y });
    if (area > 1) res.push({ hs, vs, area: area / 2 });
  }));
  return res;
}

// Area outline of a room including its curved walls (points in cm).
function faceOutline(plan, f) {
  const pts = [];
  f.hs.forEach((h, i) => {
    const e = plan.e[h.e], a = plan.v[f.vs[i]], b = plan.v[h.to]; pts.push({ x: a.x, y: a.y });
    if (e.c) pts.push(...arc(a, b, h.fwd ? e.c : -e.c));
  });
  return pts;
}
// Points strictly between a and b on an arc bulging s cm to the right of a->b (left when s < 0).
export function arc(a, b, s) {
  const dx = b.x - a.x, dy = b.y - a.y, c = Math.hypot(dx, dy); if (c < 1 || !s) return [];
  const sg = Math.sign(s), d = Math.min(Math.abs(s), c / 2), R = (c * c / 4 + d * d) / (2 * d), ux = dx / c, uy = dy / c, nx = -uy * sg, ny = ux * sg, N = Math.max(8, Math.round(c / 20)), out = [];
  for (let k = 1; k < N; k++) { const t = k / N, x = (t - 0.5) * c, h = Math.sqrt(Math.max(0, R * R - x * x)) - (R - d); out.push({ x: a.x + ux * t * c + nx * h, y: a.y + uy * t * c + ny * h }) }
  return out;
}

export function centroid(P) { let a = 0, cx = 0, cy = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length], k = p.x * q.y - q.x * p.y; a += k; cx += (p.x + q.x) * k; cy += (p.y + q.y) * k }); return a ? { x: cx / (3 * a), y: cy / (3 * a) } : P[0] }
export function inside(P, p) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c } return c }

// One enclosed area -> what fitcheck.html needs for a room drawn as a sketch: walls (length, turn, curve) running clockwise
// from the top-left wall, the sketch (start direction, turns, curves, small picture), and where the room is on the plan.
export function faceToRoom(plan, f) {
  let W = f.hs.map((h, i) => { const e = plan.e[h.e], a = plan.v[f.vs[i]], b = plan.v[h.to]; return { a, b, c: e.c ? (h.fwd ? e.c : -e.c) : 0 } });
  // walls in line (split where another room's wall meets them) are one wall of this room
  for (let i = 0; i < W.length && W.length > 3;) {
    const j = (i + 1) % W.length, A = W[i], B = W[j];
    const d1 = snap8(Math.atan2(A.b.y - A.a.y, A.b.x - A.a.x)), d2 = snap8(Math.atan2(B.b.y - B.a.y, B.b.x - B.a.x));
    if (!A.c && !B.c && d1 === d2) { W[i] = { a: A.a, b: B.b, c: 0 }; W.splice(j, 1); if (j < i) i--; } else i++;
  }
  const n = W.length, dirs = W.map(w => snap8(Math.atan2(w.b.y - w.a.y, w.b.x - w.a.x)));
  let start = 0;
  W.forEach((w, i) => { const s = W[start]; const better = (dirs[i] === 0 && !w.c) && (dirs[start] !== 0 || W[start].c || w.a.y < s.a.y - 1 || (Math.abs(w.a.y - s.a.y) <= 1 && w.a.x < s.a.x)); if (better) start = i });
  const order = [...W.slice(start), ...W.slice(0, start)], od = [...dirs.slice(start), ...dirs.slice(0, start)];
  const walls = order.map((w, i) => {
    let t = (od[(i + 1) % n] - od[i] + 8) % 8; if (t > 4) t -= 8;
    return { len: Math.round(dist(w.a, w.b)), turn: TURNNAME[t] || 'R', curve: w.c ? { side: w.c > 0 ? 'in' : 'out', depth: Math.round(Math.abs(w.c)) } : null };
  });
  const poly = faceOutline(plan, f), x0 = Math.min(...poly.map(p => p.x)), y0 = Math.min(...poly.map(p => p.y));
  const w = Math.max(...poly.map(p => p.x)) - x0 || 1, h = Math.max(...poly.map(p => p.y)) - y0 || 1, sc = Math.min(100 / w, 70 / h);
  const N = p => [Math.round((p.x - x0) * sc * 10) / 10, Math.round((p.y - y0) * sc * 10) / 10];
  const pp = []; order.forEach(o => { pp.push(o.a); if (o.c) pp.push(...arc(o.a, o.b, o.c)) });
  const labels = order.map(o => { const L = dist(o.a, o.b) || 1, ox = (o.b.y - o.a.y) / L, oy = -(o.b.x - o.a.x) / L, bow = o.c ? -Math.min(Math.abs(o.c), L / 2) * Math.sign(o.c) : 0;
    const q = N({ x: (o.a.x + o.b.x) / 2 + ox * bow, y: (o.a.y + o.b.y) / 2 + oy * bow }); return [q[0] + ox * 7, q[1] + oy * 7] });
  return {
    walls, sketch: { d0: od[0], turns: walls.map(x => x.turn), curves: walls.map(x => x.curve ? { side: x.curve.side } : null), preview: { pts: pp.map(N), labels } },
    poly, hk: centroid(poly), area: f.area,
  };
}

// numbered in reading order: by top edge (in 1 m bands), then left to right
const top = r => Math.round(Math.min(...r.poly.map(p => p.y)) / 100);
export const rooms = plan => faces(plan).map(f => faceToRoom(plan, f)).sort((a, b) => top(a) - top(b) || a.hk.x - b.hk.x);

// ---- the board ----
const CSS = `
.dp{position:fixed;inset:0;z-index:60;background:var(--bg,#f4f2ee);display:flex;flex-direction:column;touch-action:none;user-select:none;-webkit-user-select:none}
.dp-top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;padding-top:max(8px,env(safe-area-inset-top));background:var(--card,#fff);border-bottom:1px solid var(--line,#ddd)}
.dp-top b{font-size:16px;margin-right:auto}
.dp button{min-height:40px;padding:6px 12px;border-radius:10px;border:1px solid var(--line,#ccc);background:var(--card,#fff);color:var(--ink,#222);font:inherit;font-size:14px}
.dp button.on{background:var(--accent,#2f7d6d);color:var(--accent-ink,#fff);border-color:var(--accent,#2f7d6d)}
.dp button.primary{background:var(--accent,#2f7d6d);color:var(--accent-ink,#fff);border-color:var(--accent,#2f7d6d);font-weight:600}
.dp button:disabled{opacity:.45}
.dp-seg{display:inline-flex;border:1px solid var(--line,#ccc);border-radius:10px;overflow:hidden}.dp-seg button{border:0;border-radius:0}
.dp-svg{flex:1;min-height:0;width:100%;display:block;background:var(--room,#fff)}
.dp-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;padding-bottom:max(8px,env(safe-area-inset-bottom));background:var(--card,#fff);border-top:1px solid var(--line,#ddd)}
.dp-msg{flex:1 1 260px;font-size:13px;color:var(--mute,#666);margin:0}.dp-msg.err{color:var(--err,#b3261e)}
.dp-edit{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.dp-edit input{width:110px;min-height:40px;font:inherit;font-size:16px;padding:4px 8px;border:1px solid var(--line,#ccc);border-radius:8px}
`;

// open(host, {mode: 'room'|'house', plan, U(cm) -> text, parseLen(text) -> cm, onDone({mode, plan, rooms}), onCancel()})
export function open(host, opt) {
  if (!document.getElementById('dp-css')) { const st = document.createElement('style'); st.id = 'dp-css'; st.textContent = CSS; document.head.appendChild(st) }
  const U = opt.U || (v => Math.round(v) + ' cm'), parse = opt.parseLen || (t => parseFloat(t));
  let plan = opt.plan ? JSON.parse(JSON.stringify(opt.plan)) : newPlan(), mode = opt.mode || 'room', sel = -1, msg = '', msgErr = false;
  const undo = [];
  const el = document.createElement('div'); el.className = 'dp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Drawing board');
  el.innerHTML = `<div class="dp-top"><b>Draw</b><span class="dp-seg" role="group" aria-label="What to draw"><button data-m="room">This room</button><button data-m="house">Whole house</button></span>
<button data-a="undo">Undo</button><button data-a="clear">Clear</button><button data-a="fit">Fit</button><button data-a="cancel">Cancel</button><button data-a="done" class="primary">Done</button></div>
<svg class="dp-svg" aria-label="Drawing area"></svg><div class="dp-bar"><p class="dp-msg"></p><div class="dp-edit" hidden></div></div>`;
  host.appendChild(el);
  const svg = el.querySelector('svg'), msgEl = el.querySelector('.dp-msg'), edit = el.querySelector('.dp-edit');
  let view = { x: -100, y: -100, w: 1700 };
  const size = () => { const r = svg.getBoundingClientRect(); return { W: r.width || 1, H: r.height || 1 } };
  const vh = () => { const { W, H } = size(); return view.w * H / W };
  // screen <-> plan through the SVG's own transform, so it stays right while the board resizes (bars, rotation, keyboard)
  const ctm = () => svg.getScreenCTM();
  const cmPerPx = () => { const m = ctm(); return m && m.a ? 1 / m.a : view.w / size().W };
  const toPlan = e => { const m = ctm(); if (!m) { const r = svg.getBoundingClientRect(); return { x: view.x + (e.clientX - r.left) * view.w / size().W, y: view.y + (e.clientY - r.top) * view.w / size().W } }
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return { x: q.x, y: q.y } };
  function fit() {
    const V = plan.v.filter(Boolean);
    if (!V.length) { view = { x: -100, y: -100, w: mode === 'house' ? 1700 : 900 }; return }
    const x0 = Math.min(...V.map(p => p.x)), x1 = Math.max(...V.map(p => p.x)), y0 = Math.min(...V.map(p => p.y)), y1 = Math.max(...V.map(p => p.y));
    const { W, H } = size(), w = Math.max(400, (x1 - x0) * 1.3, (y1 - y0) * 1.3 * W / H);
    view = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - w * H / W / 2, w };
  }
  const say = (t, err) => { msg = t; msgErr = !!err };
  const hintText = () => mode === 'house'
    ? 'Draw the outside walls, then the walls between rooms. Lift your finger and carry on. Tap a wall to type its real length. Two fingers move and zoom.'
    : 'Draw the room all the way round. Lift your finger and carry on. Tap a wall to type its real length. Two fingers move and zoom.';
  function render() {
    const H = vh(), px = cmPerPx(), fs = 13 * px, R = rooms(plan);
    let h = `<defs><pattern id="dpg" width="${GRID * 2}" height="${GRID * 2}" patternUnits="userSpaceOnUse"><path d="M${GRID * 2} 0H0V${GRID * 2}" fill="none" stroke="var(--line,#ddd)" stroke-width="${1.4 * px}"/><path d="M${GRID} 0V${GRID * 2}M0 ${GRID}H${GRID * 2}" fill="none" stroke="var(--line,#ddd)" stroke-width="${0.7 * px}"/></pattern></defs>`;
    h += `<rect x="${view.x}" y="${view.y}" width="${view.w}" height="${H}" fill="url(#dpg)"/>`;
    R.forEach((r, i) => {
      h += `<polygon points="${r.poly.map(p => p.x + ',' + p.y).join(' ')}" fill="var(--accent,#2f7d6d)" fill-opacity=".1"/>`;
      h += `<text x="${r.hk.x}" y="${r.hk.y}" text-anchor="middle" font-size="${fs * 1.1}" font-weight="700" fill="var(--accent,#2f7d6d)">Room ${i + 1}</text><text x="${r.hk.x}" y="${r.hk.y + fs * 1.3}" text-anchor="middle" font-size="${fs}" fill="var(--mute,#666)">${(r.area / 1e4).toFixed(1)} m²</text>`;
    });
    const used = new Set(); faces(plan).forEach(f => f.hs.forEach(x => used.add(x.e)));
    plan.e.forEach((e, i) => {
      if (!e) return; const a = plan.v[e.a], b = plan.v[e.b], pts = [a, ...arc(a, b, e.c), b];
      const col = i === sel ? 'var(--accent,#2f7d6d)' : used.has(i) ? 'var(--ink,#222)' : 'var(--warn,#b26a00)';
      h += `<polyline data-e="${i}" points="${pts.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="${col}" stroke-width="${(i === sel ? 7 : 5) * px}" stroke-linecap="round" stroke-linejoin="round"/>`;
      const L = dist(a, b) || 1, ox = (b.y - a.y) / L, oy = -(b.x - a.x) / L, bow = e.c ? -Math.min(Math.abs(e.c), L / 2) * Math.sign(e.c) : 0;
      if (L / px < 34) return;
      const mx = (a.x + b.x) / 2 + ox * (bow + fs), my = (a.y + b.y) / 2 + oy * (bow + fs) + fs * 0.35;
      h += `<text x="${mx}" y="${my}" text-anchor="middle" font-size="${fs}" font-weight="${e.m ? 700 : 400}" fill="${e.m ? 'var(--ink,#222)' : 'var(--mute,#777)'}" paint-order="stroke" stroke="var(--room,#fff)" stroke-width="${3 * px}">${e.m ? '' : '≈ '}${U(Math.round(L))}${e.c ? ', curve ' + U(Math.abs(e.c)) : ''}</text>`;
    });
    plan.v.forEach(v => { if (v) h += `<circle cx="${v.x}" cy="${v.y}" r="${4 * px}" fill="var(--ink,#222)"/>` });
    h += `<polyline id="dp-live" fill="none" stroke="var(--accent,#2f7d6d)" stroke-width="${4 * px}" stroke-linecap="round" stroke-linejoin="round" points=""/>`;
    h += `<text x="${view.x + 10 * px}" y="${view.y + H - 10 * px}" font-size="${fs}" fill="var(--mute,#777)">1 square = ${U(GRID)}</text>`;
    svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${H}`); svg.innerHTML = h;
    el.querySelectorAll('[data-m]').forEach(b => { b.classList.toggle('on', b.dataset.m === mode); b.setAttribute('aria-pressed', b.dataset.m === mode) });
    el.querySelector('[data-a="undo"]').disabled = !undo.length;
    const n = R.length, done = el.querySelector('[data-a="done"]');
    done.textContent = mode === 'house' ? (n ? `Make ${n} room${n > 1 ? 's' : ''}` : 'Done') : 'Use this room';
    done.disabled = mode === 'house' ? !n : n !== 1;
    msgEl.textContent = msg || (mode === 'room' && n > 1 ? `This drawing has ${n} rooms. Switch to Whole house, or Undo.` : hintText());
    msgEl.classList.toggle('err', !!msg && msgErr);
    renderEdit();
  }
  function renderEdit() {
    const e = plan.e[sel];
    if (!e) { edit.hidden = true; edit.innerHTML = ''; return }
    edit.hidden = false;
    edit.innerHTML = `<label>${e.c ? 'End to end' : 'Wall length'} <input data-f="len" inputmode="decimal" value="${U(Math.round(edgeLen(plan, e))).replace(/"/g, '&quot;')}"></label>` +
      (e.c ? `<label>Curve depth <input data-f="dep" inputmode="decimal" value="${U(Math.abs(e.c)).replace(/"/g, '&quot;')}"></label>` : '') +
      `<button data-a="set" class="primary">Set</button><button data-a="del">Delete wall</button><button data-a="close">Close</button>`;
  }
  const push = () => { undo.push(JSON.stringify(plan)); if (undo.length > 60) undo.shift() };
  function applyEdit() {
    const e = plan.e[sel]; if (!e) return;
    const L = parse(edit.querySelector('[data-f="len"]').value), dp = edit.querySelector('[data-f="dep"]'), D = dp ? parse(dp.value) : 0;
    if (!(L > 0) || L > 5000 || (dp && !(D > 0))) { say('Type a length, for example 350.', true); render(); return }
    push(); const moved = setLength(plan, sel, L); if (dp) setDepth(plan, sel, D);
    say(moved.length ? `Measured wall${moved.length > 1 ? 's' : ''} that moved with it: ${moved.map(i => U(edgeLen(plan, plan.e[i]))).join(', ')}. Check ${moved.length > 1 ? 'them' : 'it'}.` : 'Set. Tap another wall to measure it.', moved.length > 0);
    sel = -1; render();
  }
  // pointers: one finger draws (a short tap selects a wall), two fingers move and zoom
  const ptrs = new Map(); let stroke = null, gest = null;
  const live = () => { const l = svg.querySelector('#dp-live'); if (l && stroke) l.setAttribute('points', stroke.pts.map(p => p.x + ',' + p.y).join(' ')) };
  svg.addEventListener('pointerdown', ev => {
    ev.preventDefault(); try { svg.setPointerCapture(ev.pointerId) } catch (_) { }
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ptrs.size === 1 && ev.button === 0) stroke = { pts: [toPlan(ev)], sx: ev.clientX, sy: ev.clientY, t0: performance.now(), moved: 0 };
    else if (ptrs.size === 2) { stroke = null; live(); const [p, q] = [...ptrs.values()]; gest = { d: Math.hypot(p.x - q.x, p.y - q.y), m: { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, v: { ...view } } }
  });
  svg.addEventListener('pointermove', ev => {
    if (!ptrs.has(ev.pointerId)) return; ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (gest && ptrs.size >= 2) {
      const [p, q] = [...ptrs.values()], d = Math.hypot(p.x - q.x, p.y - q.y), m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, r = svg.getBoundingClientRect();
      const k = Math.max(0.2, Math.min(5, gest.d / Math.max(1, d))), w = Math.max(200, Math.min(10000, gest.v.w * k)), s0 = gest.v.w / r.width, s1 = w / r.width;
      view = { x: gest.v.x + (gest.m.x - r.left) * s0 - (m.x - r.left) * s1, y: gest.v.y + (gest.m.y - r.top) * s0 - (m.y - r.top) * s1, w }; render(); return;
    }
    if (!stroke) return;
    const p = toPlan(ev), l = stroke.pts[stroke.pts.length - 1];
    stroke.moved = Math.max(stroke.moved, Math.hypot(ev.clientX - stroke.sx, ev.clientY - stroke.sy));
    if (dist(p, l) >= 2 * cmPerPx()) { stroke.pts.push(p); live() }
  });
  const up = ev => {
    if (!ptrs.has(ev.pointerId)) return; ptrs.delete(ev.pointerId);
    if (gest) { if (ptrs.size < 2) gest = null; stroke = null; return }
    if (!stroke) return; const s = stroke; stroke = null;
    if (s.moved < 8) {   // a tap: pick the nearest wall
      const p = s.pts[0]; let best = -1, bd = 22 * cmPerPx();
      plan.e.forEach((e, i) => { if (!e) return; const a = plan.v[e.a], b = plan.v[e.b], pts = [a, ...arc(a, b, e.c), b]; for (let k = 0; k + 1 < pts.length; k++) { const d = onSeg(p, pts[k], pts[k + 1]).d; if (d < bd) { bd = d; best = i } } });
      sel = best; say(''); render(); if (best >= 0) { const inp = edit.querySelector('input'); if (inp) { inp.focus(); inp.select() } } return;
    }
    push(); const r = addStroke(plan, s.pts.map(p => [p.x, p.y]), 26 * cmPerPx());
    if (r.err) { undo.pop(); say(r.err === 'round' ? "Fully round rooms can't be drawn yet. Draw a few straight walls." : r.err === 'short' ? 'That line was too short to read.' : "I couldn't read that line. Draw it again with clear corners.", true) }
    else say('');
    sel = -1; if (!plan.e.some(Boolean)) { } render();
  };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', ev => { stroke = null; up(ev) });
  svg.addEventListener('wheel', ev => {
    ev.preventDefault(); const r = svg.getBoundingClientRect(), p = toPlan(ev), k = Math.exp(ev.deltaY * 0.0015), w = Math.max(200, Math.min(10000, view.w * k));
    view = { x: p.x - (ev.clientX - r.left) * w / r.width, y: p.y - (ev.clientY - r.top) * w / r.width, w }; render();
  }, { passive: false });
  const close = () => { if (ro) ro.disconnect(); window.removeEventListener('resize', render); el.remove() };
  el.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.m) { mode = b.dataset.m; say(''); render(); return }
    const a = b.dataset.a;
    if (a === 'undo' && undo.length) { plan = JSON.parse(undo.pop()); sel = -1; say('') }
    else if (a === 'clear') { if (plan.e.some(Boolean)) push(); plan = newPlan(); sel = -1; say('') }
    else if (a === 'fit') fit();
    else if (a === 'set') { applyEdit(); return }
    else if (a === 'del') { push(); removeEdge(plan, sel); sel = -1 }
    else if (a === 'close') sel = -1;
    else if (a === 'cancel') { close(); opt.onCancel && opt.onCancel(); return }
    else if (a === 'done') { const t = tidy(plan), R = rooms(t); if (mode === 'room' ? R.length !== 1 : !R.length) return; close(); opt.onDone({ mode, plan: t, rooms: R }); return }
    render();
  });
  edit.addEventListener('keydown', ev => { if (ev.key === 'Enter') applyEdit() });
  let lastSize = '';   // redraw when the board really changes size (a redraw can change the bars, which would loop)
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { const { W, H } = size(), k = Math.round(W) + 'x' + Math.round(H); if (k !== lastSize) { lastSize = k; requestAnimationFrame(render) } }) : null;
  if (ro) ro.observe(svg); else window.addEventListener('resize', render);
  requestAnimationFrame(() => { fit(); render() });
  return { close, get plan() { return plan } };
}
