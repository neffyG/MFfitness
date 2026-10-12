// Bloom cycle engine — period, ovulation and fertile-window predictions.
// Works the way the premium trackers do:
//   1. Group logged bleeding days into periods.
//   2. Predict cycle length from a recency-weighted average of your real cycles,
//      pulled toward what you said in setup until there's enough data.
//   3. Ovulation = next period − luteal phase (14 days by default, personalized
//      once ovulation is detected in past cycles).
//   4. If you log LH tests / morning temperature / cervical mucus, ovulation is
//      detected from your body instead of estimated, and the next period is
//      re-predicted from it (luteal phase is the most stable part of a cycle).
// All dates are local "YYYY-MM-DD" strings. No DOM in here.

const DAY_MS = 86400000;
export const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
export const between = (a, b) => Math.round((parse(b) - parse(a)) / DAY_MS); // b − a, in days

export const BLEED = new Set(["light", "medium", "heavy"]);
const FERTILE_CM = new Set(["eggwhite", "watery"]);
const DRY_CM = new Set(["dry", "sticky", "creamy"]);

const avg = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sum = (a) => a.reduce((s, x) => s + x, 0);
const stdev = (a) => { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const pct = (s, p) => s[Math.min(s.length - 1, Math.max(0, Math.round((s.length - 1) * p)))];

/* ---------- 1. periods ---------- */
export function findPeriods(days, cfg = {}) {
  const dates = Object.keys(days).filter((d) => BLEED.has(days[d]?.flow)).sort();
  const out = [];
  for (const d of dates) {
    const last = out.at(-1);
    if (last && between(last.end, d) <= 2) last.end = d;        // same period (a missed day is fine)
    else if (last && between(last.start, d) < 14) continue;      // bleeding right after a period isn't a new cycle
    else out.push({ start: d, end: d });
  }
  // The start date she gave in setup counts as a period until she logs it herself.
  const seed = cfg.lastStart;
  if (seed && !out.some((p) => Math.abs(between(p.start, seed)) <= 5)) {
    out.push({ start: seed, end: addDays(seed, Math.max(1, cfg.periodLen || 5) - 1), seed: true });
    out.sort((a, b) => a.start.localeCompare(b.start));
  }
  return out.map((p) => ({ ...p, len: between(p.start, p.end) + 1 }));
}

export function cyclesOf(periods) {
  const out = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const len = between(periods[i].start, periods[i + 1].start);
    out.push({ start: periods[i].start, next: periods[i + 1].start, len, periodLen: periods[i].len, valid: len >= 18 && len <= 50 });
  }
  return out;
}

/* ---------- 2. ovulation signals ---------- */
export function detectOvulation(days, from, to, unit = "F") {
  if (to < from) return null;
  const range = Object.keys(days).filter((d) => d >= from && d <= to).sort();

  // Basal body temperature: "3 over 6" thermal shift.
  const temps = range.filter((d) => Number.isFinite(days[d].temp)).map((d) => ({ d, t: days[d].temp }));
  const rise = unit === "C" ? 0.2 : 0.4;
  let bbt = null;
  for (let i = 6; i + 2 < temps.length; i++) {
    const cover = Math.max(...temps.slice(i - 6, i).map((x) => x.t));
    const [a, b, c] = temps.slice(i, i + 3);
    const close = between(a.d, c.d) <= 4;
    const high = a.t > cover && b.t > cover && c.t > cover;
    const strong = c.t >= cover + rise || (temps[i + 3] && temps[i + 3].t > cover);
    if (close && high && strong) { bbt = { date: addDays(a.d, -1), cover }; break; }
  }

  // LH test: ovulation usually follows the first positive by about a day.
  const lhDay = range.find((d) => days[d].lh === "pos");
  const lh = lhDay ? addDays(lhDay, 1) : null;

  // Cervical mucus: last fertile-quality day ("peak day"), once it has dried up again.
  const peak = range.filter((d) => FERTILE_CM.has(days[d].cm)).at(-1);
  const cm = peak && range.some((d) => d > peak && DRY_CM.has(days[d].cm)) ? peak : null;

  if (bbt && lh && Math.abs(between(lh, bbt.date)) <= 3) return { date: lh, method: "LH test + temperature", confirmed: true, cover: bbt.cover };
  if (bbt) return { date: bbt.date, method: "temperature shift", confirmed: true, cover: bbt.cover };
  if (lh) return { date: lh, method: "positive ovulation test", confirmed: false };
  if (cm) return { date: cm, method: "cervical mucus", confirmed: false, weak: true };
  return null;
}

/* ---------- 3. everything ---------- */
export function analyze(state, today = ymd()) {
  const cfg = state.cycle || {};
  const days = state.days || {};
  const unit = cfg.tempUnit || "F";
  const hormonal = cfg.bc === "hormonal";
  const periods = findPeriods(days, cfg).filter((p) => p.start <= today);
  if (!periods.length) return { ready: false, today };

  const cycles = cyclesOf(periods);
  const valid = cycles.filter((c) => c.valid).slice(-6);
  const lens = valid.map((c) => c.len);
  const n = valid.length;

  // Cycle length — recent cycles count more; setup answer fades out as real data comes in.
  const prior = cfg.cycleLen || 28;
  const priorW = n === 0 ? 1 : Math.max(0.5, 3 - n);
  let wSum = priorW, total = prior * priorW;
  valid.forEach((c, i) => { const w = 1 + i * 0.25; wSum += w; total += c.len * w; });
  const cycleLen = total / wSum;
  const baseSd = { yes: 1.5, unsure: 2.5, no: 4.5 }[cfg.regular] ?? 2.5;
  const spread = n >= 3 ? Math.max(1, stdev(lens)) : n === 2 ? (Math.abs(lens[0] - lens[1]) / Math.SQRT2 + baseSd) / 2 : baseSd;

  // Period length.
  const last = periods.at(-1);
  const endedMarked = Object.keys(days).some((d) => d > last.end && d <= today && days[d].flow === "none");
  const lastFinished = endedMarked || between(last.end, today) >= 3;
  const periodLens = periods.filter((p) => !p.seed && (p !== last || lastFinished)).slice(-6).map((p) => p.len);
  const periodLen = ((cfg.periodLen || 5) + sum(periodLens)) / (1 + periodLens.length);

  // Luteal phase.
  const luteals = [];
  const pastOv = [];
  for (const c of cycles) {
    if (!c.valid) continue;
    const o = detectOvulation(days, addDays(c.start, 5), addDays(c.next, -7), unit);
    if (o) pastOv.push(o.date);
    if (o && !o.weak) { const l = between(o.date, c.next); if (l >= 9 && l <= 17) luteals.push(l); }
  }
  const luteal = clamp((14 * 2 + sum(luteals)) / (2 + luteals.length), 10, 16);
  const C = Math.round(cycleLen), P = Math.round(periodLen), L = Math.round(luteal);

  // Current cycle.
  const cd = between(last.start, today) + 1;
  const ovSeen = hormonal ? null : detectOvulation(days, addDays(last.start, 5), today, unit);
  let next = addDays(last.start, C);
  let basis = n ? `your last ${n} cycle${n > 1 ? "s" : ""}` : "your setup answers — it gets sharper every period you log";
  if (ovSeen && !ovSeen.weak) { next = addDays(ovSeen.date, L); basis = `your ${ovSeen.method} this cycle`; }
  let ov = hormonal ? null : ovSeen?.date ?? addDays(next, -L);
  if (ov && between(last.start, ov) < 6) ov = addDays(last.start, 6);

  const inPeriod = !endedMarked && (today <= last.end || cd <= Math.max(P, last.len));
  const late = today > next ? between(next, today) : 0;
  const dueIn = between(today, next);

  let phase;
  if (inPeriod) phase = "menstrual";
  else if (late) phase = "late";
  else if (hormonal) phase = "hormonal";
  else if (today >= addDays(ov, -5) && today <= addDays(ov, 1)) phase = "ovulation";
  else if (today < addDays(ov, -5)) phase = "follicular";
  else phase = dueIn <= 5 ? "pms" : "luteal";

  const chanceOn = (date) => {
    if (hormonal || !ov || late) return null;
    const k = between(ov, date);
    if (k >= -2 && k <= 0) return "high";
    if ((k >= -5 && k <= -3) || k === 1) return "medium";
    return "low";
  };

  // Upcoming cycles (each entry: a period and the ovulation before it).
  const upcoming = [];
  let s = late ? addDays(today, 1) : next;
  for (let k = 0; k < 8; k++) {
    upcoming.push({ start: s, end: addDays(s, P - 1), ov: k === 0 && !late ? ov : addDays(s, -L), pending: late && k === 0 });
    s = addDays(s, C);
  }

  // Calendar marks for things that aren't logged bleeding.
  const rank = { pred: 1, fertile: 2, ov: 3, "ov-seen": 4 };
  const marks = new Map();
  const put = (d, k) => { if (!marks.has(d) || rank[k] > rank[marks.get(d)]) marks.set(d, k); };
  if (inPeriod) for (let i = 0; i < P; i++) { const d = addDays(last.start, i); if (d > today && d > last.end) put(d, "pred"); }
  if (!hormonal && ov) { for (let i = -5; i <= 1; i++) put(addDays(ov, i), "fertile"); put(ov, "ov"); }
  upcoming.forEach((u, k) => {
    if (!u.pending) for (let i = 0; i < P; i++) put(addDays(u.start, i), "pred");
    if (!hormonal && k > 0) { for (let i = -5; i <= 1; i++) put(addDays(u.ov, i), "fertile"); put(u.ov, "ov"); }
  });
  pastOv.forEach((d) => put(d, "ov-seen"));
  if (ovSeen) put(ovSeen.date, "ov-seen");

  // Insights.
  const avgCycle = n ? avg(lens) : null;
  const variation = n >= 2 ? Math.max(...lens) - Math.min(...lens) : null;
  const avgPeriod = periodLens.length ? avg(periodLens) : null;
  const regularity = variation == null ? null : variation <= 7 ? "Regular" : variation <= 9 ? "Mostly regular" : "Irregular";
  const flags = [];
  if (n >= 2 && avgCycle < 24) flags.push("Your cycles average under 24 days — shorter than the typical 24–38.");
  if (n >= 2 && avgCycle > 38) flags.push("Your cycles average over 38 days — longer than the typical 24–38.");
  if (n >= 3 && variation > 9) flags.push(`Your cycle length swings by ${variation} days. More than 7–9 days of swing counts as irregular.`);
  if (avgPeriod && avgPeriod > 8) flags.push("Your periods average more than 8 days.");
  if (!hormonal && late >= 7) flags.push(`Your period is ${late} days late. Stress, illness, travel and big diet or training changes can delay it. If pregnancy is possible, a home test is accurate now.`);

  // Symptom patterns: same symptom showing up at the same point in 2+ cycles.
  const starts = periods.map((p) => p.start);
  const rec = {};
  for (const [d, v] of Object.entries(days)) {
    if (d > today) continue;
    const tags = [...(v.sym || []), ...(v.mood || [])];
    if (!tags.length) continue;
    const si = starts.findLastIndex((x) => x <= d);
    if (si < 0) continue;
    const cdd = between(starts[si], d) + 1;
    const nxt = starts[si + 1];
    const before = nxt ? between(d, nxt) : null;
    for (const t of tags) (rec[t] ||= []).push({ cd: cdd, before, cyc: starts[si] });
  }
  const patterns = Object.entries(rec).map(([tag, xs]) => {
    const cyc = new Set(xs.map((x) => x.cyc)).size;
    if (cyc < 2) return null;
    const pre = xs.filter((x) => x.before != null && x.before <= 10 && x.cd > 7);
    if (pre.length >= 2 && pre.length >= xs.length * 0.6) {
      const b = pre.map((x) => x.before).sort((p, q) => p - q);
      const lo = pct(b, 0.25), hi = pct(b, 0.75);
      return { tag, cycles: cyc, text: lo === hi ? `${lo} day${lo > 1 ? "s" : ""} before your period` : `${lo}–${hi} days before your period` };
    }
    const c = xs.map((x) => x.cd).sort((p, q) => p - q);
    const lo = pct(c, 0.25), hi = pct(c, 0.75);
    const during = hi <= P ? " (during your period)" : "";
    return { tag, cycles: cyc, text: (lo === hi ? `on cycle day ${lo}` : `on cycle days ${lo}–${hi}`) + during };
  }).filter(Boolean).sort((a, b) => b.cycles - a.cycles).slice(0, 6);

  return {
    ready: true, today, hormonal, unit, periods, cycles, last, cd, next, late, dueIn,
    ov, ovSeen, fertile: ov ? [addDays(ov, -5), addDays(ov, 1)] : null, pmsStart: addDays(next, -5),
    phase, inPeriod, chance: inPeriod ? chanceOn(today) : chanceOn(today), chanceOn,
    cycleLen, periodLen, luteal, C, P, L, spread, n, basis, upcoming, marks,
    insights: { avgCycle, avgPeriod, variation, regularity, flags, patterns, luteals },
  };
}
