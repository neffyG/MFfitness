// Bloom's cycle tracker — calendar, predictions, insights, day log and setup questions.
// Plugs into the shared app as an extra tab plus a few hooks (home pill, gentle days, phase tips).
import { analyze, BLEED } from "./cycle.js";
import { ymd, parse, addDays, between } from "./engine.js";
import { $, $$, esc, md, wmd, plural, setupCanvas, css } from "./core.js";
import { PHASE_TRAIN } from "./workouts.js";

let C = null, state = null, A = null;
const save = () => C.save(), render = () => C.render(), toast = (m, ms) => C.toast(m, ms);
const show = (v) => C.show(v);
const refresh = () => { state = C.state; A = analyze(state); return A; };
export const cycleA = () => A;
const BIND = {};

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

BIND["#log-today"] = () => openLog(ymd());
BIND["#setup-btn"] = () => startOnboarding();
BIND["#period-btn"] = () => {
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
BIND["#cal-prev"] = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); };
BIND["#cal-next"] = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); };

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
BIND["#ob-next"] = next;
BIND["#ob-back"] = () => { if (ob) { ob--; renderStep(); } };

/* =========================================================
   hooks into the shared app
   ========================================================= */
const CYCLE_HTML = `    
    
      <div class="panel cycle-hero">
        <div class="cring-wrap">
          <svg class="cring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" class="cr-bg"/>
            <circle cx="60" cy="60" r="52" class="cr-arc cr-fertile" id="cr-fertile" transform="rotate(-90 60 60)"/>
            <circle cx="60" cy="60" r="52" class="cr-arc cr-period" id="cr-period" transform="rotate(-90 60 60)"/>
            <circle r="3.6" class="cr-ov" id="cr-ov"/>
            <circle r="6.5" class="cr-today" id="cr-today"/>
          </svg>
          <div class="cring-text">
            <small id="cr-k"></small>
            <span id="cr-big"></span>
            <small id="cr-s"></small>
          </div>
        </div>
        <div class="chips-row" id="cr-chips"></div>
        <div class="hero-actions">
          <button class="btn primary" id="log-today">Log today</button>
          <button class="btn" id="period-btn">Period started</button>
        </div>
      </div>

      <div class="panel" id="setup-card" hidden>
        <h2>Let's set up your cycle</h2>
        <p class="muted">Answer a few questions so predictions start right away.</p>
        <button class="btn primary" id="setup-btn">Start</button>
      </div>

      <div class="panel" id="upcoming-card">
        <div class="card-head"><h2>Coming up</h2></div>
        <ul class="rows" id="upcoming"></ul>
        <p class="fine" id="basis"></p>
      </div>

      <div class="panel phase-card" id="phase-card">
        <p class="label" id="phase-label"></p>
        <h2 id="phase-title"></h2>
        <p id="phase-body"></p>
      </div>

      <div class="panel">
        <div class="card-head">
          <button class="icon-sm" id="cal-prev" aria-label="Previous month">‹</button>
          <h2 id="cal-title"></h2>
          <button class="icon-sm" id="cal-next" aria-label="Next month">›</button>
        </div>
        <div class="cal-week"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
        <div class="cal-grid" id="cal-grid"></div>
        <div class="legend">
          <span><i class="lg period"></i>Period</span>
          <span><i class="lg pred"></i>Predicted</span>
          <span><i class="lg fertile"></i>Fertile</span>
          <span><i class="lg ov"></i>Ovulation</span>
        </div>
        <p class="fine">Tap any past day to log it.</p>
      </div>

      <div class="panel" id="temp-card" hidden>
        <div class="card-head"><h2>Temperature</h2><span class="muted small" id="temp-sub"></span></div>
        <div class="chart-wrap small"><canvas id="temp-chart"></canvas></div>
      </div>

      <div class="panel">
        <div class="card-head"><h2>Insights</h2></div>
        <div class="stat-grid four" id="ins-stats"></div>
        <ul class="flags" id="ins-flags"></ul>
        <h3>Your patterns</h3>
        <ul class="rows" id="ins-patterns"></ul>
        <h3>Cycle length</h3>
        <div class="chart-wrap small"><canvas id="len-chart"></canvas><p class="empty" id="len-empty">Shows up after two logged periods.</p></div>
      </div>

      <div class="panel">
        <div class="card-head"><h2>Cycle history</h2></div>
        <ul class="log-list" id="cycle-list"></ul>
      </div>

      <p class="disclaimer">Predictions are estimates, not medical advice, and they are not a form of birth control.</p>

  <!-- EXERCISE PICTURE -->
  <dialog id="figsheet">
    <form method="dialog" class="sheet fig-sheet" id="fig-form"></form>
  </dialog>

  
`;
const OB_HTML = `<dialog id="logsheet">
    <form method="dialog" class="sheet" id="log-form"></form>
  </dialog>
  
  <section id="onboard" hidden>
    <div class="ob-dots" id="ob-dots"></div>
    <div class="ob-body" id="ob-body"></div>
    <div class="ob-foot">
      <button class="btn" id="ob-back">Back</button>
      <button class="btn primary" id="ob-next">Next</button>
    </div>
  </section>

  
`;

function gentleAuto() {
  if (!A?.ready || !A.inPeriod) return false;
  const v = state.days[ymd()] || {};
  return A.cd <= 2 || v.flow === "heavy" || (v.sym || []).includes("cramps");
}
const gentleToday = () => state.gentle[ymd()] ?? gentleAuto();

export const cycleExtra = {
  defaults: {
    days: {}, gentle: {}, onboarded: false,
    cycle: { lastStart: null, periodLen: 5, cycleLen: 28, regular: "unsure", bc: "none", goal: "track", trackTemp: false, tempUnit: "F" },
  },
  tabs: [{ id: "cycle", html: CYCLE_HTML, chrome: OB_HTML, render: () => renderCycle() }],
  init(ctx) { C = ctx; refresh(); for (const [sel, fn] of Object.entries(BIND)) { const el = $(sel); if (el) el.onclick = fn; } },
  beforeRender() { refresh(); },
  boot() { if (!state.onboarded) startOnboarding(); },

  homeTop() {
    const pill = !A.ready
      ? `<span class="dot"></span><span><b>Cycle</b> · ${state.onboarded ? "Log your period to start predictions" : "Tap to set up your cycle"}</span>`
      : `<span class="dot ${A.phase}"></span><span><b>Cycle day ${A.cd}</b> · ${esc(headline())}</span>`;
    return `<button class="pill" id="cycle-pill">${pill}</button>`;
  },
  bindHome() { $("#cycle-pill").onclick = () => (state.onboarded ? show("cycle") : startOnboarding()); },

  trainOpts: (ctx, day) => ({ gentle: !day.rest && gentleToday() }),
  todayTitle: (ctx, day, opts) => (opts.gentle ? "Gentle day" : day.title),
  trainBanner(ctx, day, isToday, opts) {
    if (!A.ready) return `<div class="panel phase-banner"><p class="label">Cycle-synced workouts</p><p>Set up your cycle and your training tips change with your phase.</p></div>`;
    return `<div class="panel phase-banner"><p class="label">${esc(PHASE[A.phase].name)} · cycle day ${A.cd}</p><p>${esc(PHASE_TRAIN[A.phase])}</p>
      ${isToday && !day.rest ? `<label class="toggle"><span>Gentle version today</span><span class="switch"><input type="checkbox" id="gentle-sw" ${opts.gentle ? "checked" : ""}><i></i></span></label>` : ""}</div>`;
  },
  bindTrainBanner(ctx, rerender) {
    const sw = $("#gentle-sw");
    if (sw) sw.onchange = () => { state.gentle[ymd()] = sw.checked; save(); rerender(); };
  },
  bodyNote() {
    return A.ready && ["pms", "menstrual", "late"].includes(A.phase)
      ? `<p class="note">Before and during your period, water retention can add 1–5 lb on the scale. It's not fat — trust the trend line.</p>` : "";
  },
  chartUnderlay(ctx, c, { x, pad, W, H, data }) {
    c.fillStyle = css("--period") + "22";
    const t0 = data[0].d, t1 = data.at(-1).d;
    const pw = Math.max(3, (W - pad.l - pad.r) / Math.max(1, between(t0, t1)));
    for (const [d, v] of Object.entries(state.days)) if (BLEED.has(v.flow) && d >= t0 && d <= t1) c.fillRect(x(d) - pw / 2, pad.t, pw, H - pad.t - pad.b);
  },
  settingsHtml() {
    const c = state.cycle;
    return `<h3>Cycle</h3>
      <div class="sheet-row"><label>Usual cycle (days)<input id="set-cycle" type="number" min="18" max="50" inputmode="numeric" value="${c.cycleLen}"></label>
        <label>Usual period (days)<input id="set-period" type="number" min="2" max="10" inputmode="numeric" value="${c.periodLen}"></label></div>
      <label>Birth control<select id="set-bc">
        <option value="none" ${c.bc === "none" ? "selected" : ""}>None / condoms only</option>
        <option value="hormonal" ${c.bc === "hormonal" ? "selected" : ""}>Hormonal (pill, patch, ring, shot, implant, hormonal IUD)</option>
        <option value="copper" ${c.bc === "copper" ? "selected" : ""}>Copper IUD</option></select></label>
      <label>Using the tracker to<select id="set-goalmode">
        <option value="track" ${c.goal === "track" ? "selected" : ""}>Track my cycle &amp; symptoms</option>
        <option value="conceive" ${c.goal === "conceive" ? "selected" : ""}>Get pregnant</option></select></label>
      <div class="sheet-row"><label class="switch-row"><input type="checkbox" id="set-temp" ${c.trackTemp ? "checked" : ""}> Log temp &amp; ovulation tests</label>
        <label>Temp unit<select id="set-unit"><option value="F" ${c.tempUnit === "F" ? "selected" : ""}>°F</option><option value="C" ${c.tempUnit === "C" ? "selected" : ""}>°C</option></select></label></div>
      <button type="button" class="btn" id="redo-setup">Redo cycle setup questions</button>`;
  },
  bindSettings(ctx, f) { $("#redo-setup", f).onclick = () => { $("#sheet").close(); startOnboarding(); }; },
  saveSettings() {
    const c = state.cycle;
    c.cycleLen = Math.min(50, Math.max(18, parseInt($("#set-cycle").value) || 28));
    c.periodLen = Math.min(10, Math.max(2, parseInt($("#set-period").value) || 5));
    c.bc = $("#set-bc").value; c.goal = $("#set-goalmode").value;
    c.trackTemp = $("#set-temp").checked; c.tempUnit = $("#set-unit").value;
  },
};
