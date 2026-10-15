// Bloom — starts the shared app with Madi's config, plan, cycle tracker and faith.
import { startApp } from "./core.js";
import { CFG } from "./config.js";
import { PLAN } from "./workouts.js";
import { cycleExtra } from "./cycle-ui.js";
import { FAITH_DEFAULTS, renderFaith, renderReader, readerHtml, faithHome, bindFaithHome } from "./faith.js";

startApp({ cfg: CFG, plan: PLAN, extra: {
  ...cycleExtra,
  get defaults() { return { ...structuredClone(cycleExtra.defaults), faith: structuredClone(FAITH_DEFAULTS) }; },
  tabs: [...cycleExtra.tabs, { id: "faith", render: renderFaith }, { id: "reader", html: readerHtml, render: renderReader }],
  homeTop: (ctx) => cycleExtra.homeTop(ctx) + faithHome(ctx),
  bindHome: (ctx) => { cycleExtra.bindHome(ctx); bindFaithHome(ctx); },
}});
