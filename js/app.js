import { DAYS, SCHEDULE, GENTLE, COOLDOWN, MOBILITY, PHASE_TRAIN, GROW_NOTE } from "./workouts.js";
import { figureSvg } from "./figures.js";
import { analyze, ymd, parse, addDays, between, BLEED } from "./cycle.js";

/* ---------- storage (only on this phone) ---------- */
const KEY = "bloom:madison";
const defaults = () => ({
  name: "Madison", start: null, goal: null, weights: [], checks: {}, gentle: {}, days: {},
  cycle: { lastStart: null, periodLen: 5, cycleLen: 28, regular: "unsure", bc: "none", goal: "track", trackTemp: false, tempUnit: "F" },
  onboarded: false,
});
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    const d = defaults();
    return { ...d, ...s, cycle: { ...d.cycle, ...(s.cycle || {}) } };
  } catch { return defaults(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
let state = load();
let A = analyze(state);
const refresh = () => (A = analyze(state));

/* ---------- helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (n) => (n == null || isNaN(n) ? "—" : (Math.round(n * 10) / 10).toFixed(1));
const sorted = () => [...state.weights].sort((a, b) => a.d.localeCompare(b.d));
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const md = (s) => parse(s).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const wmd = (s) => parse(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const DAY_MS = 86400000;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function toast(msg, ms = 1900) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), ms);
}
function signed(n) {
  if (n == null) return "—";
  const v = Math.round(n * 10) / 10;
  return `${v > 0 ? "+" : ""}${v.toFixed(1)}`;
}

/* ---------- labels ---------- */
const FLOW = [["none", "No period"], ["spotting", "Spotting"], ["light", "Light"], ["medium", "Medium"], ["heavy", "Heavy"]];
const SYMPTOMS = [["cramps", "Cramps"], ["bloating", "Bloating"], ["headache", "Headache"], ["backache", "Backache"], ["breasts", "Tender breasts"], ["acne", "Acne"], ["fatigue", "Fatigue"], ["cravings", "Cravings"], ["nausea", "Nausea"], ["insomnia", "Insomnia"], ["constipation", "Constipation"], ["diarrhea", "Diarrhea"]];
const MOODS = [["happy", "Happy"], ["calm", "Calm"], ["energetic", "Energetic"], ["sensitive", "Sensitive"], ["irritable", "Irritable"], ["anxious", "Anxious"], ["sad", "Sad"], ["swings", "Mood swings"]];
const CM = [["dry", "Dry"], ["sticky", "Sticky"], ["creamy", "Creamy"], ["watery", "Watery"], ["eggwhite", "Egg white"], ["unusual", "Unusual"]];
const LH = [["neg", "Negative"], ["pos", "Positive"]];
const SEX = [["protected", "Protected"], ["unprotected", "Unprotected"]];
const LABEL = Object.fromEntries([...SYMPTOMS, ...MOODS]);

const PHASE = {
  menstrual: { name: "Period", title: "Menstrual phase",
    body: "Estrogen and progesterone are at their lowest, so the uterine lining sheds. Cramps come from prostaglandins — heat, light movement and an anti-inflammatory (if it's safe for you) help." },
  follicular: { name: "Follicular", title: "Follicular phase",
    body: "Estrogen climbs while an egg matures. Energy, mood and recovery usually improve — a great window to push training." },
  ovulation: { name: "Fertile window", title: "Fertile window",
    body: "An LH surge releases the egg. The egg lives 12–24 hours, but sperm can survive up to 5 days, which is why the fertile window is about 6 days long." },
  luteal: { name: "Luteal", title: "Luteal phase",
    body: "Progesterone rises after ovulation. Your resting temperature goes up about 0.5–1°F and appetite can rise a little." },
  pms: { name: "PMS days", title: "Before your period",
    body: "Estrogen and progesterone drop before your period. Bloating, breast tenderness, mood shifts and cravings are common and normal." },
  late: { name: "Late", title: "Period is late",
    body: "Stress, poor sleep, travel, illness and big changes in diet or exercise can all push ovulation — and your period — later. If pregnancy is possible, a home test is accurate from the day your period was due." },
  hormonal: { name: "Your cycle", title: "On hormonal birth control",
    body: "Hormonal birth control usually stops ovulation, so Bloom tracks your bleeding and symptoms but doesn't predict a fertile window." },
};

/* ---------- navigation ---------- */
let current = "home";
function show(view) {
  current = view;
  $$(".view").forEach((v) => (v.hidden = v.id !== `view-${view}`));
  $$(".tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  window.scrollTo({ top: 0 });
  render();
}
function render() {
  refresh();
  $("#greeting").textContent = `Hey, ${state.name || "you"}`;
  $("#today-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  if (current === "home") renderHome();
  if (current === "cycle") renderCycle();
  if (current === "workout") renderWorkout();
  if (current === "log") renderLog();
}
$$(".tabbar button").forEach((b) => (b.onclick = () => show(b.dataset.view)));
$("#today-link").onclick = () => { selectedDay = todayId(); show("workout"); };
$("#cycle-pill").onclick = () => (state.onboarded ? show("cycle") : startOnboarding());

/* ---------- short cycle status ---------- */
function headline(a = A) {
  if (!a.ready) return "Set up your cycle";
  if (a.inPeriod) return `Period · day ${a.cd}`;
  if (a.late) return `Period ${plural(a.late, "day")} late`;
  if (a.dueIn === 0) return "Period expected today";
  if (a.ov && !a.hormonal) {
    const k = between(a.today, a.ov);
    if (k === 0) return "Ovulation day";
    if (k > 0 && k <= 5) return `Ovulation in ${plural(k, "day")}`;
  }
  return `Period in ${plural(a.dueIn, "day")}`;
}

/* ---------- PROGRESS ---------- */
function stats() {
  const w = sorted();
  const start = state.start ?? w[0]?.w ?? null;
  const cur = w.at(-1)?.w ?? null;
  const lost = start != null && cur != null ? start - cur : null;
  let pctDone = 0;
  if (state.goal != null && start != null && cur != null && start !== state.goal)
    pctDone = Math.max(0, Math.min(100, ((start - cur) / (start - state.goal)) * 100));
  let week = null, rate = null;
  if (w.length >= 2) {
    const cutoff = parse(w.at(-1).d).getTime() - 7 * DAY_MS;
    const base = [...w].reverse().find((e) => parse(e.d).getTime() <= cutoff) ?? w[0];
    week = cur - base.w;
    const days = (parse(w.at(-1).d) - parse(w[0].d)) / DAY_MS;
    if (days >= 1) rate = ((cur - w[0].w) / days) * 7;
  }
  let streak = 0;
  const set = new Set(w.map((e) => e.d));
  const d = new Date();
  if (!set.has(ymd(d))) d.setDate(d.getDate() - 1);
  while (set.has(ymd(d))) { streak++; d.setDate(d.getDate() - 1); }
  return { start, cur, lost, pctDone, week, rate, streak };
}

function renderHome() {
  const s = stats();
  const pill = $("#cycle-pill");
  if (!A.ready) pill.innerHTML = `<span class="dot"></span><span><b>Cycle</b> · ${state.onboarded ? "Log your period to start predictions" : "Tap to set up your cycle"}</span>`;
  else pill.innerHTML = `<span class="dot ${A.phase}"></span><span><b>Cycle day ${A.cd}</b> · ${esc(headline())}</span>`;
  $("#water-note").hidden = !(A.ready && ["pms", "menstrual", "late"].includes(A.phase));

  $("#stat-lost").innerHTML = s.lost == null ? "—" : `${fmt(Math.max(0, s.lost))}<small>lb</small>`;
  $("#stat-start").textContent = fmt(s.start);
  $("#stat-current").textContent = fmt(s.cur);
  $("#stat-goal").textContent = fmt(state.goal);
  $("#stat-togo").textContent = state.goal != null && s.cur != null ? fmt(Math.max(0, s.cur - state.goal)) : "—";
  $("#stat-pct").textContent = `${Math.round(s.pctDone)}%`;
  $("#ring-fg").style.strokeDashoffset = 326.7 * (1 - s.pctDone / 100);
  const wk = $("#stat-week"); wk.textContent = signed(s.week); wk.className = "mid " + (s.week < 0 ? "down" : s.week > 0 ? "up" : "");
  const rt = $("#stat-rate"); rt.textContent = signed(s.rate); rt.className = "mid " + (s.rate < 0 ? "down" : s.rate > 0 ? "up" : "");
  $("#stat-streak").textContent = s.streak ? plural(s.streak, "day") : "—";

  const today = state.weights.find((e) => e.d === ymd());
  if (document.activeElement !== $("#weigh-input")) $("#weigh-input").value = today ? today.w : "";

  const day = DAYS.find((d) => d.id === todayId());
  const g = gentleToday() && !day.rest;
  $("#today-title").textContent = g ? "Gentle day" : day.title;
  $("#today-sub").textContent = g ? `Instead of ${day.title}` : day.sub;
  $("#today-progress").textContent = `${progress(day, g).pct}%`;
  drawChart();
}

$("#weigh-form").onsubmit = (e) => {
  e.preventDefault();
  const w = parseFloat($("#weigh-input").value);
  if (!w) return;
  const d = ymd();
  state.weights = state.weights.filter((x) => x.d !== d).concat({ d, w });
  if (state.start == null) state.start = w;
  save(); $("#weigh-input").blur(); render(); toast("Weight saved");
};

/* weight chart — plain canvas, period days shaded */
let range = 90, tapIdx = null;
$$("#range-seg button").forEach((b) => (b.onclick = () => {
  $$("#range-seg button").forEach((x) => x.classList.toggle("on", x === b));
  range = +b.dataset.r; tapIdx = null; drawChart();
}));

function setupCanvas(cv) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext("2d"); c.scale(dpr, dpr); c.clearRect(0, 0, W, H);
  return { c, W, H };
}

function drawChart() {
  const cv = $("#chart");
  let data = sorted();
  if (range) { const cut = Date.now() - range * DAY_MS; data = data.filter((e) => parse(e.d).getTime() >= cut); }
  $("#chart-empty").hidden = data.length >= 2;
  const { c, W, H } = setupCanvas(cv);
  if (data.length < 2) return;
  const accent = css("--accent"), line = css("--line"), mid = css("--mid"), period = css("--period");
  const pad = { l: 40, r: 14, t: 16, b: 26 };
  const vals = data.map((e) => e.w);
  if (state.goal != null) vals.push(state.goal);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const span = Math.max(hi - lo, 4); lo -= span * 0.12; hi += span * 0.12;
  const t0 = parse(data[0].d).getTime(), t1 = parse(data.at(-1).d).getTime();
  const x = (d) => pad.l + ((parse(d).getTime() - t0) / Math.max(t1 - t0, 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);

  // shade logged period days so she can see water-weight bumps line up
  c.fillStyle = period + "1F";
  const pw = Math.max(3, (W - pad.l - pad.r) / Math.max(1, (t1 - t0) / DAY_MS));
  for (const [d, v] of Object.entries(state.days)) {
    if (!BLEED.has(v.flow) || d < data[0].d || d > data.at(-1).d) continue;
    c.fillRect(x(d) - pw / 2, pad.t, pw, H - pad.t - pad.b);
  }

  c.font = "11px 'DM Sans', sans-serif"; c.fillStyle = mid; c.strokeStyle = line; c.lineWidth = 1;
  c.textAlign = "right"; c.textBaseline = "middle";
  for (let i = 0; i <= 3; i++) {
    const v = lo + ((hi - lo) * i) / 3, yy = y(v);
    c.beginPath(); c.moveTo(pad.l, yy); c.lineTo(W - pad.r, yy); c.stroke();
    c.fillText(Math.round(v), pad.l - 8, yy);
  }
  c.textAlign = "center"; c.textBaseline = "top";
  c.fillText(md(data[0].d), x(data[0].d) + 14, H - pad.b + 8);
  c.fillText(md(data.at(-1).d), x(data.at(-1).d) - 14, H - pad.b + 8);
  if (state.goal != null) {
    c.setLineDash([5, 5]); c.strokeStyle = mid; c.beginPath();
    c.moveTo(pad.l, y(state.goal)); c.lineTo(W - pad.r, y(state.goal)); c.stroke(); c.setLineDash([]);
    c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText("goal", W - pad.r, y(state.goal) - 3);
  }
  const grad = c.createLinearGradient(0, pad.t, 0, H - pad.b);
  grad.addColorStop(0, accent + "40"); grad.addColorStop(1, accent + "00");
  c.beginPath(); c.moveTo(x(data[0].d), H - pad.b);
  data.forEach((e) => c.lineTo(x(e.d), y(e.w)));
  c.lineTo(x(data.at(-1).d), H - pad.b); c.closePath(); c.fillStyle = grad; c.fill();
  c.beginPath(); data.forEach((e, i) => (i ? c.lineTo : c.moveTo).call(c, x(e.d), y(e.w)));
  c.strokeStyle = accent; c.lineWidth = 2.5; c.lineJoin = "round"; c.stroke();

  const idx = tapIdx ?? data.length - 1, p = data[Math.min(idx, data.length - 1)];
  const px = x(p.d), py = y(p.w);
  c.fillStyle = accent; c.beginPath(); c.arc(px, py, 5, 0, Math.PI * 2); c.fill();
  c.strokeStyle = css("--card"); c.lineWidth = 2; c.stroke();
  const txt = `${fmt(p.w)} · ${md(p.d)}`;
  c.font = "600 12px 'DM Sans', sans-serif"; const tw = c.measureText(txt).width + 16;
  const bx = Math.min(Math.max(px - tw / 2, pad.l), W - pad.r - tw), by = Math.max(py - 34, 0);
  c.fillStyle = css("--ink"); c.beginPath(); c.roundRect(bx, by, tw, 24, 8); c.fill();
  c.fillStyle = css("--card"); c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(txt, bx + 8, by + 12);
  cv._x = x; cv._data = data;
}
$("#chart").addEventListener("pointerdown", (e) => {
  const cv = e.currentTarget; if (!cv._data) return;
  const mx = e.clientX - cv.getBoundingClientRect().left;
  let best = 0, bd = Infinity;
  cv._data.forEach((d, i) => { const dd = Math.abs(cv._x(d.d) - mx); if (dd < bd) { bd = dd; best = i; } });
  tapIdx = best; drawChart();
});
window.addEventListener("resize", () => render());

/* ---------- CYCLE ---------- */
const RC = 2 * Math.PI * 52;
function arc(el, a, b) {
  a = Math.max(0, a); b = Math.min(1, b);
  if (b <= a) { el.style.strokeDasharray = `0 ${RC}`; return; }
  el.style.strokeDasharray = `${(b - a) * RC} ${RC}`;
  el.style.strokeDashoffset = `${-a * RC}`;
}
function dot(el, f) {
  const t = 2 * Math.PI * f - Math.PI / 2;
  el.setAttribute("cx", 60 + 52 * Math.cos(t)); el.setAttribute("cy", 60 + 52 * Math.sin(t));
}

function ringText() {
  const a = A;
  if (a.inPeriod) {
    const left = Math.max(a.P, a.last.len) - a.cd;
    return ["Period", `Day ${a.cd}`, left > 0 ? `About ${plural(left, "more day")}` : "Wrapping up — tap Period ended"];
  }
  if (a.late) return ["Period late by", plural(a.late, "day"), "Log it when it starts"];
  if (a.dueIn === 0) return ["Period", "Today", "Expected to start today"];
  if (a.hormonal) return ["Next bleed in", plural(a.dueIn, "day"), `Cycle day ${a.cd}`];
  const k = between(a.today, a.ov);
  if (a.phase === "ovulation") {
    if (k > 0) return ["Ovulation in", plural(k, "day"), "You're in your fertile window"];
    if (k === 0) return ["Today is", "Ovulation", "Peak fertility"];
    return ["Period in", plural(a.dueIn, "day"), "Fertile window ends today"];
  }
  return ["Period in", plural(a.dueIn, "day"), `Cycle day ${a.cd}`];
}

function renderCycle() {
  const ready = A.ready;
  $("#setup-card").hidden = state.onboarded;
  ["#upcoming-card", "#phase-card"].forEach((s) => ($(s).hidden = !ready));
  if (!ready) {
    $("#cr-k").textContent = state.onboarded ? "No period logged" : "";
    $("#cr-big").textContent = state.onboarded ? "Log it" : "Hi!";
    $("#cr-s").textContent = state.onboarded ? "Tap Period started" : "Set up your cycle";
    arc($("#cr-period"), 0, 0); arc($("#cr-fertile"), 0, 0);
    $("#cr-ov").style.display = "none"; $("#cr-today").style.display = "none";
    $("#cr-chips").innerHTML = "";
    $("#period-btn").textContent = "Period started";
  } else {
    // ring
    const len = Math.max(A.late ? A.cd : between(A.last.start, A.next), A.cd, 1);
    arc($("#cr-period"), 0, Math.max(A.inPeriod ? Math.max(A.P, A.last.len) : A.last.len, 1) / len);
    if (A.fertile) {
      arc($("#cr-fertile"), between(A.last.start, A.fertile[0]) / len, (between(A.last.start, A.fertile[1]) + 1) / len);
      $("#cr-ov").style.display = ""; dot($("#cr-ov"), (between(A.last.start, A.ov) + 0.5) / len);
    } else { arc($("#cr-fertile"), 0, 0); $("#cr-ov").style.display = "none"; }
    $("#cr-today").style.display = ""; dot($("#cr-today"), Math.min(0.999, (A.cd - 0.5) / len));
    const [k, big, sub] = ringText();
    $("#cr-k").textContent = k; $("#cr-big").textContent = big; $("#cr-s").textContent = sub;

    const chips = [`<span class="tag rose">${esc(PHASE[A.phase].name)}</span>`];
    if (A.chance) chips.push(`<span class="tag ${A.chance === "high" ? "high" : A.chance === "medium" ? "lav" : ""}">${A.chance[0].toUpperCase() + A.chance.slice(1)} chance of pregnancy</span>`);
    if (A.ovSeen && !A.ovSeen.weak) chips.push(`<span class="tag lav">Ovulation detected ✓</span>`);
    $("#cr-chips").innerHTML = chips.join("");
    $("#period-btn").textContent = A.inPeriod ? "Period ended" : "Period started";

    // coming up
    const rows = [];
    const sp = Math.round(A.spread);
    rows.push(row("Next period", A.late ? `Was due ${md(A.next)}` : md(A.next), A.late ? "Late — log it when it starts" : sp >= 2 ? `could be ${sp} days either side` : `in ${plural(A.dueIn, "day")}`, "period"));
    if (!A.hormonal) {
      const curFertileAhead = A.fertile && A.fertile[1] >= A.today;
      const f = curFertileAhead ? A.fertile : [addDays(A.upcoming[1].ov, -5), addDays(A.upcoming[1].ov, 1)];
      const o = curFertileAhead ? A.ov : A.upcoming[1].ov;
      rows.push(row(curFertileAhead ? "Fertile window" : "Next fertile window", `${md(f[0])} – ${md(f[1])}`, "highest chance the 3 days before ovulation", "fertile"));
      const how = curFertileAhead && A.ovSeen && !A.ovSeen.weak ? `detected by ${A.ovSeen.method}` : curFertileAhead && A.ovSeen ? `from ${A.ovSeen.method}` : "estimated";
      rows.push(row("Ovulation", wmd(o), how, "ov"));
    }
    if (!A.late && A.pmsStart > A.today) rows.push(row("PMS may start", md(A.pmsStart), "about 5 days before your period", ""));
    rows.push(row("Period after that", md(A.upcoming[1].start), `${A.C}-day cycle`, ""));
    $("#upcoming").innerHTML = rows.join("");
    $("#basis").textContent = `Based on ${A.basis}. Average cycle used: ${A.C} days · period ${A.P} days · luteal phase ${A.L} days.`;

    const ph = PHASE[A.phase];
    $("#phase-label").textContent = A.inPeriod ? `Cycle day ${A.cd}` : `Cycle day ${A.cd} of ~${A.late ? A.cd : between(A.last.start, A.next)}`;
    $("#phase-title").textContent = ph.title;
    $("#phase-body").textContent = ph.body;
  }
  renderCalendar();
  renderTemp();
  renderInsights();
  renderCycleList();
}
function row(k, v, sub, lg) {
  return `<li><span class="k">${lg ? `<i class="lg ${lg}"></i>` : ""}${esc(k)}</span><span class="v">${esc(v)}${sub ? `<small>${esc(sub)}</small>` : ""}</span></li>`;
}

$("#log-today").onclick = () => openLog(ymd());
$("#setup-btn").onclick = () => startOnboarding();
$("#period-btn").onclick = () => {
  const t = ymd();
  state.days[t] ||= {};
  if (A.ready && A.inPeriod) {
    state.days[t].flow = "none";
    save(); render(); toast("Period ended — logged");
    return;
  }
  if (A.ready && between(A.last.start, t) < 14) {
    state.days[t].flow = state.days[t].flow && BLEED.has(state.days[t].flow) ? state.days[t].flow : "medium";
    save(); render(); toast("Logged. Bleeding this soon after a period counts as spotting, not a new cycle.", 3200);
    return;
  }
  state.days[t].flow = "medium";
  save(); render(); toast("Period started — predictions updated");
};

/* calendar */
let calMonth = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
$("#cal-prev").onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); };
$("#cal-next").onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); };

function dayClasses(d) {
  const today = ymd(), cls = [];
  const v = state.days[d];
  const seed = A.ready && A.periods.some((p) => p.seed && d >= p.start && d <= p.end && d <= today);
  if (v && BLEED.has(v.flow)) cls.push("period");
  else if (seed) cls.push("period");
  else {
    if (v?.flow === "spotting") cls.push("spot");
    const m = A.ready ? A.marks.get(d) : null;
    if (m === "pred" && d > today) cls.push("pred");
    else if (m && m !== "pred") cls.push(m);
  }
  if (v && (v.sym?.length || v.mood?.length || v.cm || v.lh || v.temp || v.sex || v.note)) cls.push("logged");
  if (d === today) cls.push("today");
  return cls.join(" ");
}

function renderCalendar() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  $("#cal-title").textContent = calMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const first = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
  let html = "";
  for (let i = 0; i < first; i++) html += `<span class="cal-day blank"></span>`;
  for (let i = 1; i <= count; i++) {
    const d = ymd(new Date(y, m, i));
    html += `<button class="cal-day ${dayClasses(d)}" data-d="${d}">${i}</button>`;
  }
  $("#cal-grid").innerHTML = html;
  $$("#cal-grid button").forEach((b) => (b.onclick = () => {
    const d = b.dataset.d;
    if (d > ymd()) {
      const m = A.ready ? A.marks.get(d) : null;
      const what = m === "pred" ? "Predicted period" : m === "ov" ? "Predicted ovulation" : m === "fertile" ? "Fertile window" : "Nothing predicted";
      toast(`${md(d)}: ${what}`);
      return;
    }
    openLog(d);
  }));
}

/* day log sheet */
function chips(group, opts, sel, multi, extra = "") {
  return `<div class="chips" data-g="${group}" data-multi="${multi ? 1 : 0}">${opts.map(([k, l]) =>
    `<button type="button" class="chip ${extra} ${(multi ? (sel || []).includes(k) : sel === k) ? "on" : ""}" data-k="${k}">${esc(l)}</button>`).join("")}</div>`;
}
function openLog(d) {
  const v = state.days[d] || {};
  const c = state.cycle;
  const tracking = c.trackTemp || c.goal === "conceive";
  const title = d === ymd() ? "Today" : wmd(d);
  $("#log-form").innerHTML = `
    <div class="sheet-head"><h2>${esc(title)}</h2>${A.ready && d >= A.last.start ? `<span class="tag rose">Cycle day ${between(A.last.start, d) + 1}</span>` : ""}</div>
    <div class="grp"><p class="label">Period</p>${chips("flow", FLOW, v.flow, false, "flow")}</div>
    <div class="grp"><p class="label">Symptoms</p>${chips("sym", SYMPTOMS, v.sym, true)}</div>
    <div class="grp"><p class="label">Mood</p>${chips("mood", MOODS, v.mood, true)}</div>
    <div class="grp"><p class="label">Discharge</p>${chips("cm", CM, v.cm, false, "lav")}</div>
    ${tracking ? `
    <div class="grp"><p class="label">Ovulation (LH) test</p>${chips("lh", LH, v.lh, false, "lav")}</div>
    <label>Morning temperature (°${c.tempUnit}) — take it before you get out of bed
      <input type="number" id="log-temp" inputmode="decimal" step="0.01" placeholder="${c.tempUnit === "C" ? "36.50" : "97.70"}" value="${v.temp ?? ""}">
    </label>` : ""}
    <div class="grp"><p class="label">Sex</p>${chips("sex", SEX, v.sex, false)}</div>
    <label>Note<textarea id="log-note" placeholder="Anything else?">${esc(v.note || "")}</textarea></label>
    <div class="sheet-row">
      <button value="cancel" class="btn">Cancel</button>
      <button value="save" class="btn primary">Save</button>
    </div>`;
  $$("#log-form .chips").forEach((g) => g.querySelectorAll(".chip").forEach((b) => (b.onclick = () => {
    if (g.dataset.multi === "1") b.classList.toggle("on");
    else { const was = b.classList.contains("on"); g.querySelectorAll(".chip").forEach((x) => x.classList.remove("on")); if (!was) b.classList.add("on"); }
  })));
  const dlg = $("#logsheet");
  dlg.onclose = () => {
    if (dlg.returnValue !== "save") return;
    const out = {};
    $$("#log-form .chips").forEach((g) => {
      const on = [...g.querySelectorAll(".chip.on")].map((b) => b.dataset.k);
      if (g.dataset.multi === "1") { if (on.length) out[g.dataset.g] = on; }
      else if (on[0]) out[g.dataset.g] = on[0];
    });
    const tEl = $("#log-temp");
    if (tEl && tEl.value !== "") {
      const t = parseFloat(tEl.value);
      const ok = c.tempUnit === "C" ? t >= 34 && t <= 39 : t >= 94 && t <= 102;
      if (ok) out.temp = t; else toast("That temperature looks off — not saved");
    }
    const note = $("#log-note").value.trim();
    if (note) out.note = note;
    if (Object.keys(out).length) state.days[d] = out; else delete state.days[d];
    save(); render(); toast("Saved ♡");
  };
  dlg.returnValue = "";
  dlg.showModal();
}

/* temperature chart */
function renderTemp() {
  const on = state.cycle.trackTemp || state.cycle.goal === "conceive";
  const from = A.ready ? A.last.start : addDays(ymd(), -35);
  const pts = Object.entries(state.days).filter(([d, v]) => d >= from && Number.isFinite(v.temp)).sort(([a], [b]) => a.localeCompare(b));
  $("#temp-card").hidden = !on || pts.length < 2;
  if ($("#temp-card").hidden) return;
  $("#temp-sub").textContent = A.ovSeen?.confirmed ? `Shift found · ovulated ~${md(A.ovSeen.date)}` : "This cycle";
  const { c, W, H } = setupCanvas($("#temp-chart"));
  const pad = { l: 38, r: 10, t: 12, b: 22 };
  const vals = pts.map(([, v]) => v.temp);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const sp = Math.max(hi - lo, state.cycle.tempUnit === "C" ? 0.4 : 0.8); lo -= sp * 0.15; hi += sp * 0.15;
  const n = Math.max(between(from, pts.at(-1)[0]), 1);
  const x = (d) => pad.l + (between(from, d) / n) * (W - pad.l - pad.r);
  const y = (t) => pad.t + (1 - (t - lo) / (hi - lo)) * (H - pad.t - pad.b);
  c.font = "11px 'DM Sans', sans-serif"; c.fillStyle = css("--mid"); c.textAlign = "right"; c.textBaseline = "middle";
  c.strokeStyle = css("--line");
  for (let i = 0; i <= 2; i++) { const t = lo + ((hi - lo) * i) / 2; c.beginPath(); c.moveTo(pad.l, y(t)); c.lineTo(W - pad.r, y(t)); c.stroke(); c.fillText(t.toFixed(1), pad.l - 6, y(t)); }
  if (A.ovSeen?.cover) {
    c.setLineDash([4, 4]); c.strokeStyle = css("--fertile"); c.beginPath(); c.moveTo(pad.l, y(A.ovSeen.cover)); c.lineTo(W - pad.r, y(A.ovSeen.cover)); c.stroke(); c.setLineDash([]);
  }
  c.strokeStyle = css("--ov"); c.lineWidth = 2; c.beginPath();
  pts.forEach(([d, v], i) => (i ? c.lineTo : c.moveTo).call(c, x(d), y(v.temp))); c.stroke();
  c.fillStyle = css("--ov"); pts.forEach(([d, v]) => { c.beginPath(); c.arc(x(d), y(v.temp), 3, 0, Math.PI * 2); c.fill(); });
}

/* insights */
function renderInsights() {
  const I = A.ready ? A.insights : { flags: [], patterns: [] };
  const stat = (l, v) => `<div><p class="label">${l}</p><p class="mid">${v}</p></div>`;
  $("#ins-stats").innerHTML = [
    stat("Avg cycle", I.avgCycle ? `${Math.round(I.avgCycle)}d` : "—"),
    stat("Avg period", I.avgPeriod ? `${Math.round(I.avgPeriod)}d` : "—"),
    stat("Varies by", I.variation != null ? `${I.variation}d` : "—"),
    stat("Pattern", I.regularity || "—"),
  ].join("");
  $("#ins-flags").innerHTML = I.flags.map((f) => `<li>${esc(f)}${f.includes("late") ? "" : " Worth mentioning to your doctor."}</li>`).join("");
  $("#ins-patterns").innerHTML = I.patterns.length
    ? I.patterns.map((p) => `<li><span class="k">${esc(LABEL[p.tag] || p.tag)}</span><span class="v">Usually ${esc(p.text)}<small>seen in ${p.cycles} cycles</small></span></li>`).join("")
    : `<li><span class="k">Log symptoms and moods for 2 cycles and your patterns show up here.</span></li>`;

  const cs = A.ready ? A.cycles.filter((c) => c.valid).slice(-8) : [];
  $("#len-empty").hidden = cs.length >= 1;
  $("#len-chart").parentElement.style.height = cs.length ? "" : "56px";
  const { c, W, H } = setupCanvas($("#len-chart"));
  if (!cs.length) return;
  const pad = { l: 28, r: 8, t: 14, b: 22 };
  const max = Math.max(...cs.map((x) => x.len), 35), min = Math.min(...cs.map((x) => x.len), 21) - 4;
  const bw = (W - pad.l - pad.r) / cs.length;
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  c.font = "11px 'DM Sans', sans-serif";
  cs.forEach((cy, i) => {
    const bx = pad.l + i * bw + bw * 0.2, w = bw * 0.6;
    c.fillStyle = css("--accent-soft"); c.beginPath(); c.roundRect(bx, y(cy.len), w, H - pad.b - y(cy.len), 6); c.fill();
    c.fillStyle = css("--accent"); c.textAlign = "center"; c.textBaseline = "bottom"; c.fillText(cy.len, bx + w / 2, y(cy.len) - 2);
    c.fillStyle = css("--mid"); c.textBaseline = "top"; c.fillText(md(cy.start).split(" ")[0], bx + w / 2, H - pad.b + 6);
  });
  if (I.avgCycle) {
    c.setLineDash([4, 4]); c.strokeStyle = css("--mid"); c.beginPath(); c.moveTo(pad.l, y(I.avgCycle)); c.lineTo(W - pad.r, y(I.avgCycle)); c.stroke(); c.setLineDash([]);
    c.fillStyle = css("--mid"); c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("avg", 0, y(I.avgCycle));
  }
}

function renderCycleList() {
  if (!A.ready) { $("#cycle-list").innerHTML = `<li><span class="log-date">Your cycles will show up here.</span></li>`; return; }
  const items = [`<li><div><div class="log-w">Current cycle</div><div class="log-date">Started ${md(A.last.start)} · day ${A.cd}</div></div><span class="tag rose">${esc(PHASE[A.phase].name)}</span></li>`];
  [...A.cycles].reverse().forEach((cy) => {
    items.push(`<li><div><div class="log-w">${cy.len}-day cycle</div><div class="log-date">${md(cy.start)} – ${md(addDays(cy.next, -1))} · ${plural(cy.periodLen, "day")} period</div></div>${cy.valid ? "" : `<span class="tag">Not counted</span>`}</li>`);
  });
  $("#cycle-list").innerHTML = items.join("");
}

/* ---------- WORKOUT ---------- */
const todayId = () => SCHEDULE[new Date().getDay()] ?? "rest";
let selectedDay = todayId();

function gentleAuto() {
  if (!A.ready || !A.inPeriod) return false;
  const v = state.days[ymd()] || {};
  return A.cd <= 2 || v.flow === "heavy" || (v.sym || []).includes("cramps");
}
const gentleToday = () => state.gentle[ymd()] ?? gentleAuto();

function blocksFor(day, gentle) {
  let b;
  if (day.rest) b = [{ t: "Move", w: "Anywhere", items: day.items }, COOLDOWN];
  else if (gentle) b = [GENTLE, COOLDOWN];
  else b = [MOBILITY, { t: "Workout", w: "45–55 min", note: day.note || GROW_NOTE, items: day.items }, day.finish, COOLDOWN];
  return b.map((blk, i) => ({ ...blk, key: `${i}` }));
}
const dayKey = (day, gentle) => (gentle && !day.rest ? `${day.id}~g` : day.id);
function checksFor(key) { const r = state.checks[ymd()]; return r && r.day === key ? new Set(r.done) : new Set(); }
function progress(day, gentle) {
  const total = blocksFor(day, gentle).reduce((n, b) => n + b.items.length, 0);
  const done = checksFor(dayKey(day, gentle)).size;
  return { done, total, pct: Math.round((done / total) * 100) };
}
const CHECK_SVG = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;

function renderWorkout() {
  const today = todayId();
  const day = DAYS.find((d) => d.id === selectedDay);
  const isToday = day.id === today;
  const gentle = isToday && !day.rest && gentleToday();

  // phase banner
  if (A.ready) {
    $("#phase-banner").innerHTML = `<p class="label">${esc(PHASE[A.phase].name)} · cycle day ${A.cd}</p><p>${esc(PHASE_TRAIN[A.phase])}</p>
      ${isToday && !day.rest ? `<label class="toggle"><span>Gentle version today</span><span class="switch"><input type="checkbox" id="gentle-sw" ${gentle ? "checked" : ""}><i></i></span></label>` : ""}`;
    const sw = $("#gentle-sw");
    if (sw) sw.onchange = () => { state.gentle[ymd()] = sw.checked; save(); renderWorkout(); };
  } else {
    $("#phase-banner").innerHTML = `<p class="label">Cycle-synced workouts</p><p>Set up your cycle and the workout tab adjusts to your phase.</p>`;
  }

  $("#rail").innerHTML = DAYS.map((d) => `<button data-id="${d.id}" class="${d.id === selectedDay ? "on" : ""} ${d.id === today ? "today" : ""}">${esc(d.tab)}</button>`).join("");
  $$("#rail button").forEach((b) => (b.onclick = () => { selectedDay = b.dataset.id; renderWorkout(); }));
  $("#rail .on")?.scrollIntoView({ inline: "center", block: "nearest" });

  $("#day-title").textContent = gentle ? "Gentle day" : day.title;
  $("#day-sub").textContent = isToday ? `Today · ${gentle ? `swapped from ${day.title}` : day.sub}` : day.sub;

  const key = dayKey(day, gentle);
  const done = checksFor(key);
  $("#blocks").innerHTML = blocksFor(day, gentle).map((b) => {
    const n = b.items.filter((_, i) => done.has(`${b.key}.${i}`)).length;
    const all = n === b.items.length;
    return `<details class="card block" ${all ? "" : "open"}>
      <summary><div><div class="block-t">${esc(b.t)}</div><div class="block-w">${esc(b.w)}</div></div>
      <span class="block-count ${all ? "done" : ""}">${n}/${b.items.length}</span></summary>
      ${b.note ? `<p class="block-note">${esc(b.note)}</p>` : ""}
      <ol class="ex">${b.items.map((it, i) => {
        const k = `${b.key}.${i}`;
        return `<li class="ex-row">${it.fig ? `<button type="button" class="fig" data-b="${b.key}" data-i="${i}" aria-label="Show ${esc(it.n)}">${figureSvg(it.fig)}</button>` : ""}
          <label><input type="checkbox" data-k="${k}" ${done.has(k) ? "checked" : ""}><span class="check">${CHECK_SVG}</span>
          <div class="ex-body"><div class="ex-top"><span class="ex-n">${esc(it.n)}</span></div><span class="ex-s">${esc(it.s)}</span>
          ${it.note ? `<p class="ex-note">${esc(it.note)}</p>` : ""}</div></label></li>`;
      }).join("")}</ol></details>`;
  }).join("");

  const blks = blocksFor(day, gentle);
  $$("#blocks .fig").forEach((btn) => (btn.onclick = () => openFig(blks[+btn.dataset.b].items[+btn.dataset.i])));
  $$("#blocks input[type=checkbox]").forEach((cb) => (cb.onchange = () => {
    const d = ymd();
    const rec = state.checks[d]?.day === key ? state.checks[d] : { day: key, done: [] };
    const set = new Set(rec.done);
    cb.checked ? set.add(cb.dataset.k) : set.delete(cb.dataset.k);
    state.checks[d] = { day: key, done: [...set] };
    save();
    const p = progress(day, gentle);
    if (p.done === p.total) toast("Workout complete — proud of you ♡");
    if (navigator.vibrate) navigator.vibrate(8);
    $("#day-bar").style.width = `${p.pct}%`;
    $$(".block").forEach((el) => {
      const items = el.querySelectorAll("input"), n = [...items].filter((i) => i.checked).length;
      const tag = el.querySelector(".block-count"); tag.textContent = `${n}/${items.length}`; tag.classList.toggle("done", n === items.length);
    });
  }));
  $("#day-bar").style.width = `${progress(day, gentle).pct}%`;
}

function openFig(it) {
  const q = encodeURIComponent(`${it.n} exercise proper form`);
  $("#fig-form").innerHTML = `
    <div class="fig-big">${figureSvg(it.fig, true)}</div>
    <h2>${esc(it.n)}</h2>
    <p class="fig-sets">${esc(it.s)}</p>
    ${it.note ? `<p class="muted">${esc(it.note)}</p>` : ""}
    <a class="btn" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">▶ Watch a video demo</a>
    <button value="close" class="btn primary">Got it</button>`;
  $("#figsheet").showModal();
}

/* ---------- HISTORY ---------- */
function renderLog() {
  const w = sorted().reverse();
  $("#log-empty").hidden = w.length > 0;
  $("#log-list").innerHTML = w.map((e, i) => {
    const prev = w[i + 1], diff = prev ? e.w - prev.w : null;
    return `<li><div><div class="log-w">${fmt(e.w)} lb</div><div class="log-date">${parse(e.d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div></div>
      <span class="log-d ${diff < 0 ? "down" : diff > 0 ? "up" : ""}">${diff == null ? "" : signed(diff)}</span>
      <button class="del" data-d="${e.d}" aria-label="Delete">×</button></li>`;
  }).join("");
  $$("#log-list .del").forEach((b) => (b.onclick = () => {
    if (!confirm("Delete this weigh-in?")) return;
    state.weights = state.weights.filter((x) => x.d !== b.dataset.d); save(); renderLog();
  }));
}

/* ---------- SETTINGS ---------- */
const dlg = $("#settings");
$("#settings-btn").onclick = () => {
  const c = state.cycle;
  $("#set-name").value = state.name ?? "";
  $("#set-start").value = state.start ?? "";
  $("#set-goal").value = state.goal ?? "";
  $("#set-cycle").value = c.cycleLen; $("#set-period").value = c.periodLen;
  $("#set-bc").value = c.bc; $("#set-goalmode").value = c.goal;
  $("#set-temp").checked = !!c.trackTemp; $("#set-unit").value = c.tempUnit;
  dlg.returnValue = ""; dlg.showModal();
};
dlg.addEventListener("close", () => {
  if (dlg.returnValue !== "save") return;
  const num = (v) => (v === "" ? null : parseFloat(v));
  state.name = $("#set-name").value.trim() || "Madison";
  state.start = num($("#set-start").value);
  state.goal = num($("#set-goal").value);
  const c = state.cycle;
  c.cycleLen = Math.min(50, Math.max(18, parseInt($("#set-cycle").value) || 28));
  c.periodLen = Math.min(10, Math.max(2, parseInt($("#set-period").value) || 5));
  c.bc = $("#set-bc").value; c.goal = $("#set-goalmode").value;
  c.trackTemp = $("#set-temp").checked; c.tempUnit = $("#set-unit").value;
  save(); render(); toast("Saved");
});
$("#redo-setup").onclick = () => { dlg.close(); startOnboarding(); };
$("#export-btn").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `bloom-backup-${ymd()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$("#import-file").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.weights) || typeof data.days !== "object") throw 0;
    const d = defaults();
    state = { ...d, ...data, cycle: { ...d.cycle, ...(data.cycle || {}) } };
    save(); dlg.close(); show("home"); toast("Backup restored");
  } catch { toast("That file didn't work"); }
};

/* ---------- ONBOARDING (Flo-style setup questions) ---------- */
const STEPS = [
  { key: "name", q: "Hi! What should I call you?", type: "text" },
  { key: "lastStart", q: "When did your last period start?", hint: "The first day of real bleeding — not spotting.", type: "date", skip: "I don't remember" },
  { key: "periodLen", q: "How many days does your period usually last?", type: "stepper", min: 2, max: 10, unit: "days" },
  { key: "cycleLen", q: "How long is your cycle usually?", hint: "First day of one period to the first day of the next. Most are 24–38 days.", type: "stepper", min: 18, max: 50, unit: "days", skip: "Not sure — use 28" },
  { key: "regular", q: "Is your cycle regular?", type: "choice", opts: [["yes", "Yes, it's pretty predictable"], ["no", "No, it varies a lot"], ["unsure", "Not sure"]] },
  { key: "bc", q: "Are you using birth control?", hint: "Hormonal methods usually stop ovulation, so I won't predict fertile days with them.", type: "choice",
    opts: [["none", "No / condoms only"], ["hormonal", "Pill, patch, ring, shot, implant or hormonal IUD"], ["copper", "Copper IUD"]] },
  { key: "goal", q: "What do you want to use Bloom for?", type: "choice", opts: [["track", "Track my cycle & symptoms"], ["conceive", "Trying to get pregnant"]] },
  { key: "trackTemp", q: "Want to log temperature and ovulation tests?", hint: "Optional. A morning temperature (before getting up) and LH test strips let Bloom confirm ovulation instead of estimating it — that's what makes predictions the most accurate.", type: "choice", opts: [["yes", "Yes, I'll try"], ["no", "Not now"]] },
  { key: "weights", q: "Last one — your weight goal", hint: "Optional. You can change this anytime in Settings.", type: "weights" },
];
let ob = 0, draft = {};
function startOnboarding() {
  ob = 0;
  draft = { name: state.name, ...state.cycle, trackTemp: state.cycle.trackTemp ? "yes" : "no", wStart: state.start, wGoal: state.goal };
  $("#onboard").hidden = false;
  renderStep();
}
function renderStep() {
  const s = STEPS[ob];
  $("#ob-dots").innerHTML = STEPS.map((_, i) => `<i class="${i === ob ? "on" : ""}"></i>`).join("");
  let body = `<h2>${esc(s.q)}</h2>${s.hint ? `<p class="hint">${esc(s.hint)}</p>` : ""}`;
  if (s.type === "text") body += `<input type="text" id="ob-in" value="${esc(draft.name || "")}" autocomplete="given-name">`;
  if (s.type === "date") body += `<input type="date" id="ob-in" max="${ymd()}" value="${draft.lastStart || ""}">`;
  if (s.type === "stepper") body += `<div class="stepper"><button type="button" id="ob-minus">−</button><output id="ob-out">${draft[s.key]}</output><button type="button" id="ob-plus">+</button></div><p>${s.unit}</p>`;
  if (s.type === "choice") body += s.opts.map(([k, l]) => `<button type="button" class="ob-opt ${draft[s.key] === k ? "on" : ""}" data-k="${k}">${esc(l)}</button>`).join("");
  if (s.type === "weights") body += `<div class="sheet-row"><label class="muted">Current (lb)<input type="number" id="ob-start" inputmode="decimal" step="0.1" value="${draft.wStart ?? ""}"></label><label class="muted">Goal (lb)<input type="number" id="ob-goal" inputmode="decimal" step="0.1" value="${draft.wGoal ?? ""}"></label></div>`;
  if (s.skip) body += `<button type="button" class="ob-skip" id="ob-skip">${esc(s.skip)}</button>`;
  $("#ob-body").innerHTML = body;
  $("#ob-back").style.visibility = ob ? "visible" : "hidden";
  $("#ob-next").textContent = ob === STEPS.length - 1 ? "Done ♡" : "Next";

  if (s.type === "stepper") {
    const set = (v) => { draft[s.key] = Math.min(s.max, Math.max(s.min, v)); $("#ob-out").textContent = draft[s.key]; };
    $("#ob-minus").onclick = () => set(draft[s.key] - 1);
    $("#ob-plus").onclick = () => set(draft[s.key] + 1);
  }
  if (s.type === "choice") $$(".ob-opt").forEach((b) => (b.onclick = () => {
    draft[s.key] = b.dataset.k; $$(".ob-opt").forEach((x) => x.classList.toggle("on", x === b));
    setTimeout(next, 180);
  }));
  const sk = $("#ob-skip");
  if (sk) sk.onclick = () => {
    if (s.key === "lastStart") draft.lastStart = null;
    if (s.key === "cycleLen") draft.cycleLen = 28;
    ob++; renderStep();
  };
}
function next() {
  const s = STEPS[ob];
  if (s.type === "text") draft.name = $("#ob-in").value.trim() || "Madison";
  if (s.type === "date") {
    const v = $("#ob-in").value;
    if (!v) { toast("Pick a date, or tap \"I don't remember\""); return; }
    if (v > ymd()) { toast("That date is in the future"); return; }
    draft.lastStart = v;
  }
  if (s.type === "choice" && !draft[s.key]) { toast("Pick one"); return; }
  if (s.type === "weights") {
    const n = (id) => { const v = parseFloat($(id).value); return isNaN(v) ? null : v; };
    draft.wStart = n("#ob-start"); draft.wGoal = n("#ob-goal");
  }
  if (ob < STEPS.length - 1) { ob++; renderStep(); return; }
  finishOnboarding();
}
function finishOnboarding() {
  state.name = draft.name;
  state.cycle = { ...state.cycle, lastStart: draft.lastStart, periodLen: draft.periodLen, cycleLen: draft.cycleLen,
    regular: draft.regular || "unsure", bc: draft.bc || "none", goal: draft.goal || "track", trackTemp: draft.trackTemp === "yes" };
  if (draft.wStart != null) {
    state.start = draft.wStart;
    if (!state.weights.some((w) => w.d === ymd())) state.weights.push({ d: ymd(), w: draft.wStart });
  }
  if (draft.wGoal != null) state.goal = draft.wGoal;
  state.onboarded = true;
  save();
  $("#onboard").hidden = true;
  show("cycle");
  toast(`All set, ${state.name} ♡`);
}
$("#ob-next").onclick = next;
$("#ob-back").onclick = () => { if (ob) { ob--; renderStep(); } };

/* ---------- boot ---------- */
show("home");
if (!state.onboarded) startOnboarding();
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
// re-render when she comes back to the app on a new day
document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
