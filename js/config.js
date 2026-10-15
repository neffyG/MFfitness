// Bloom — everything that makes this app Madi's: garden, ranks, adventures, cottage treasures, wording.
import { DEFAULT_MOVES } from "./workouts.js";
import { computeFaith } from "./faith.js";

// Every level plants something new in her garden (level 2 plants the first one).
export const PLANTS = [
  ["sprout", "🌱"], ["tulip", "🌷"], ["daisy", "🌼"], ["clover", "🍀"], ["cherry blossom", "🌸"], ["mushroom", "🍄"],
  ["sunflower", "🌻"], ["lavender", "🪻"], ["fern", "🌿"], ["hibiscus", "🌺"], ["strawberry patch", "🍓"], ["little cottage", "🏡"],
  ["rose", "🌹"], ["bunny", "🐇"], ["butterfly", "🦋"], ["bee", "🐝"], ["herb pot", "🪴"], ["snail", "🐌"], ["tree", "🌳"],
  ["lotus", "🪷"], ["ladybug", "🐞"], ["apple tree", "🍎"], ["hedgehog", "🦔"], ["bluebird", "🐦"], ["pumpkin", "🎃"],
  ["blossom tree", "🌸"], ["frog", "🐸"], ["fairy", "🧚"], ["rainbow", "🌈"], ["swan", "🦢"],
];
export const plantFor = (level) => PLANTS[(level - 2) % PLANTS.length];

const garden = (level) => {
  const n = Math.max(0, level - 1);
  const shown = Math.min(n, 40);
  const items = Array.from({ length: shown }, (_, k) => {
    const i = n - shown + k;                                  // newest 40
    const [, e] = PLANTS[i % PLANTS.length];
    const row = i % 3, x = 4 + ((i * 37 + row * 11) % 90);
    const size = [26, 22, 18][row], bottom = [8, 26, 42][row];
    return `<span class="pl ${i === n - 1 ? "new" : ""}" style="left:${x}%;bottom:${bottom}px;font-size:${size}px;z-index:${3 - row};animation-delay:${(i % 6) * 0.4}s">${e}</span>`;
  }).join("");
  const next = plantFor(level + 1);
  return `<div class="garden">${items || `<span class="pl empty">Your garden is waiting — reach level 2 to plant your first sprout 🌱</span>`}<i class="g-ground"></i></div>
    <p class="fine center">Next level plants: <b>${next[1]} a ${next[0]}</b> · ${n} ${n === 1 ? "thing" : "things"} growing</p>`;
};

export const CFG = {
  id: "bloom", codePrefix: "BLOOM", partnerPrefix: "ARISE",
  storageKey: "bloom:madison", defaultName: "Madison", weeklyMi: 6,
  xpName: "leaves",
  logoHtml: `Bloom<span>✿ little garden</span>`,
  tabs: [
    { id: "home", label: "Home", icon: "home" },
    { id: "train", label: "Train", icon: "train" },
    { id: "cycle", label: "Cycle", icon: "cycle" },
    { id: "faith", label: "Faith", icon: "cross" },
    { id: "bosses", label: "Adventures", icon: "flower" },
    { id: "body", label: "Body", icon: "heart" },
    { id: "reader", label: "Bible", icon: "cross", hidden: true, navAs: "faith" },
  ],
  // her faith: plugs into leaves, levels and adventures
  extend: (state, today) => computeFaith(state, today),
  faith: {
    head: "✿ IN THE WORD ✿", walk: "Your walk with God", homeTag: "Quiet time ♡",
    focus: [
      "Your church and the Lord's day",
      "Your family and the people you love",
      "Neftali and your relationship",
      "Your studies and the future God has for you",
      "Your friends, and anyone who needs Him",
      "The world, and people who are hurting",
      "Your own heart — rest, peace and growing closer to Him",
    ],
  },
  ranks: [
    { name: "Seedling", icon: "🌱", min: 1, c: "#9FD3A3" },
    { name: "Sprout", icon: "🌿", min: 4, c: "#8CCB9B" },
    { name: "Bud", icon: "🌷", min: 8, c: "#F4A6C0" },
    { name: "Blossom", icon: "🌸", min: 13, c: "#F28DB2" },
    { name: "Wildflower", icon: "🌼", min: 19, c: "#F5C66B" },
    { name: "Meadow Keeper", icon: "🌻", min: 26, c: "#E9A84B" },
    { name: "Grove Keeper", icon: "🌳", min: 34, c: "#7DBB8C" },
    { name: "Forest Spirit", icon: "🧚", min: 44, c: "#B79CF2" },
  ],
  emblem: (rk) => `<span class="badge" style="--rk:${rk.c}"><span>${rk.icon}</span></span>`,
  playerExtra: (G) => garden(G.level),
  streakMark: (k) => ({ on: "🌸", rest: "🌱", today: `<span class="bud">🌷</span>`, future: `<span class="dim">·</span>`, off: `<span class="dim">○</span>` }[k]),
  walkIcon: "🚶‍♀️", runIcon: "🏃‍♀️", weekStreakIcon: "🌷", duoIcon: "💗", liftIcon: "🎀",
  defaultMoves: DEFAULT_MOVES,

  bosses: [
    { id: "sleepy-owl", name: "The Sleepy Owl of the 5K Trail", icon: "🦉", desc: "Walk or run 3.1 mi in one go to wake her up.", metric: "bestSession", target: 3.1, unit: "mi", xp: 200 },
    { id: "meadow-fox", name: "The Fox of the 10K Meadow", icon: "🦊", desc: "Go 6.2 mi in one go and the fox follows you home.", metric: "bestSession", target: 6.2, unit: "mi", xp: 400 },
    { id: "two-hearts", name: "Two Hearts Lane", icon: "💞", desc: "Walk 20 miles together with Neftali.", metric: "togetherMi", target: 20, unit: "mi", xp: 300 },
    { id: "mushroom-king", name: "The Mushroom King", icon: "🍄", desc: "Lift 25,000 lb in total to earn his crown.", metric: "lbs", target: 25000, unit: "lb", xp: 500 },
    { id: "cloud-puff", name: "The Cloud Puff", icon: "☁️", desc: "Reach your goal weight.", metric: "weightPct", target: 100, unit: "%", xp: 1000 },
    { id: "wise-willow", name: "The Wise Willow", icon: "🌳", desc: "Finish all your stretches on 30 days.", metric: "mobFullDays", target: 30, unit: "days", xp: 400 },
    { id: "firefly-festival", name: "The Firefly Festival", icon: "✨", desc: "Keep a 21-day streak.", metric: "bestStreak", target: 21, unit: "days", xp: 400 },
    { id: "utah-mountain", name: "The Big Utah Mountain", icon: "🏔️", desc: "Climb 100 miles together — your miles plus Neftali's.", metric: "duoMi", target: 100, unit: "mi", xp: 800, duo: true },
    { id: "pebble-lighthouse", name: "The Lighthouse of 100,000 Pebbles", icon: "🗼", desc: "Lift 100,000 lb between the two of you.", metric: "duoLb", target: 100000, unit: "lb", xp: 800, duo: true },
    { group: "Faith", id: "quiet-garden", name: "The Quiet Garden", icon: "🌿", desc: "Read the Word 40 days in a row.", metric: "bestWord", target: 40, unit: "days", xp: 500 },
    { group: "Faith", id: "four-wells", name: "The Four Wells", icon: "💧", desc: "Read all four Gospels — Matthew, Mark, Luke and John (89 chapters).", metric: "gospelCh", target: 89, unit: "ch", xp: 400 },
    { group: "Faith", id: "songbird", name: "The Songbird's Psalms", icon: "🐦", desc: "Read all 150 Psalms.", metric: "psalmCh", target: 150, unit: "ch", xp: 500 },
    { group: "Faith", id: "rainbow-promise", name: "The Rainbow Promise", icon: "🌈", desc: "Read the whole New Testament (260 chapters).", metric: "ntCh", target: 260, unit: "ch", xp: 800 },
    { group: "Faith", id: "tree-of-life", name: "The Tree of Life", icon: "🌳", desc: "Read the entire Bible — all 1,189 chapters.", metric: "bibleCh", target: 1189, unit: "ch", xp: 3000 },
    { group: "Faith", id: "prayer-garden", name: "The Prayer Garden", icon: "🙏", desc: "Pray on 100 different days.", metric: "prayerDays", target: 100, unit: "days", xp: 500 },
    { group: "Faith", id: "dove", name: "The Dove's Return", icon: "🕊️", desc: "Write down 10 answered prayers.", metric: "answered", target: 10, unit: "prayers", xp: 300 },
    { group: "Faith", id: "hidden-heart", name: "Hidden in My Heart", icon: "💗", desc: "Memorize 12 verses (Psalm 119:11).", metric: "memMastered", target: 12, unit: "verses", xp: 400 },
    { group: "Faith", id: "thankful-jar", name: "The Thankful Jar", icon: "🫙", desc: "Write down what you're thankful for on 30 days.", metric: "gratDays", target: 30, unit: "days", xp: 250 },
  ],
  loot: [
    { id: "c-teapot", name: "Little Teapot", icon: "🫖", title: "Tea Party Host", how: "Finish your first workout", when: (m) => m.gymDays >= 1 },
    { id: "c-basket", name: "Picnic Basket", icon: "🧺", title: "Picnic Planner", how: "Reach level 5", when: (m) => m.level >= 5 },
    { id: "c-letter", name: "Sealed Love Letter", icon: "💌", title: "Little Planner", how: "Finish 7 days of quests", when: (m) => m.questDays >= 7 },
    { id: "c-scarf", name: "Knitted Scarf", icon: "🧣", title: "Cozy Soul", how: "Reach level 10", when: (m) => m.level >= 10 },
    { id: "c-compass", name: "Brass Compass", icon: "🧭", title: "Wanderer", how: "Hit your weekly miles 4 times", when: (m) => m.weeksHit >= 4 },
    { id: "c-ribbon", name: "Silk Ribbon", icon: "🎀", title: "Pretty Strong", how: "Set 10 personal bests", when: (m) => m.prs >= 10 },
    { id: "c-feather", name: "Owl Feather", icon: "🪶", title: "Owl Whisperer", how: "Wake the Sleepy Owl", boss: "sleepy-owl", when: (m) => !!m.earned["sleepy-owl"] },
    { id: "c-leaf", name: "Autumn Leaf Crown", icon: "🍂", title: "Meadow Runner", how: "Befriend the Fox", boss: "meadow-fox", when: (m) => !!m.earned["meadow-fox"] },
    { id: "c-mugs", name: "Matching Mugs", icon: "☕", title: "Better Together", how: "Walk Two Hearts Lane", boss: "two-hearts", when: (m) => !!m.earned["two-hearts"] },
    { id: "c-lamp", name: "Mushroom Lamp", icon: "🍄", title: "Mighty Mushroom", how: "Win the Mushroom King's crown", boss: "mushroom-king", when: (m) => !!m.earned["mushroom-king"] },
    { id: "c-pillow", name: "Cloud Pillow", icon: "☁️", title: "Cloud Walker", how: "Catch the Cloud Puff", boss: "cloud-puff", when: (m) => !!m.earned["cloud-puff"] },
    { id: "c-wreath", name: "Willow Wreath", icon: "🌿", title: "Bendy Willow", how: "Learn from the Wise Willow", boss: "wise-willow", when: (m) => !!m.earned["wise-willow"] },
    { id: "c-jar", name: "Firefly Jar", icon: "🫙", title: "Little Light", how: "Join the Firefly Festival", boss: "firefly-festival", when: (m) => !!m.earned["firefly-festival"] },
    { id: "c-quilt", name: "Mountain Quilt", icon: "🏔️", title: "Summit Sweetheart", how: "Climb the Big Utah Mountain", boss: "utah-mountain", when: (m) => !!m.earned["utah-mountain"] },
    { id: "c-shell", name: "Wishing Shell", icon: "🐚", title: "Lighthouse Keeper", how: "Light the Pebble Lighthouse", boss: "pebble-lighthouse", when: (m) => !!m.earned["pebble-lighthouse"] },
    { id: "c-crown", name: "Flower Crown", icon: "💐", title: "Garden Princess", how: "Reach level 20", when: (m) => m.level >= 20 },
    { id: "c-cottage", name: "Fairy Cottage Key", icon: "🗝️", title: "Fairy of the Glen", how: "Reach level 40", when: (m) => m.level >= 40 },
    { id: "c-seed", name: "Mustard Seed", icon: "🌱", title: "Seed of Faith", how: "Read your first chapter", when: (m) => m.chapters >= 1 },
    { id: "c-pen", name: "Pressed-Flower Journal", icon: "📔", title: "Quiet Writer", how: "Write 10 journal entries", when: (m) => m.soap >= 10 },
    { id: "c-moss", name: "Moss Bench", icon: "🪵", title: "Quiet Heart", how: "Finish the Quiet Garden", boss: "quiet-garden", when: (m) => !!m.earned["quiet-garden"] },
    { id: "c-pitcher", name: "Clay Water Pitcher", icon: "🏺", title: "Living Water", how: "Visit the Four Wells", boss: "four-wells", when: (m) => !!m.earned["four-wells"] },
    { id: "c-nest", name: "Songbird Nest", icon: "🪺", title: "Songbird", how: "Sing with the Songbird", boss: "songbird", when: (m) => !!m.earned["songbird"] },
    { id: "c-prism", name: "Rainbow Prism", icon: "🔮", title: "Promise Keeper", how: "Find the Rainbow Promise", boss: "rainbow-promise", when: (m) => !!m.earned["rainbow-promise"] },
    { id: "c-tiara", name: "Tree of Life Tiara", icon: "👑", title: "Daughter of the King", how: "Rest under the Tree of Life", boss: "tree-of-life", when: (m) => !!m.earned["tree-of-life"] },
    { id: "c-watering", name: "Watering Can", icon: "🪴", title: "Prayer Gardener", how: "Tend the Prayer Garden", boss: "prayer-garden", when: (m) => !!m.earned["prayer-garden"] },
    { id: "c-dove", name: "Dove Pendant", icon: "🕊️", title: "Answered", how: "Welcome the Dove back", boss: "dove", when: (m) => !!m.earned["dove"] },
    { id: "c-locket", name: "Heart Locket", icon: "💗", title: "Hidden Word", how: "Hide 12 verses in your heart", boss: "hidden-heart", when: (m) => !!m.earned["hidden-heart"] },
    { id: "c-thanks", name: "Jar of Little Thanks", icon: "✨", title: "Grateful Heart", how: "Fill the Thankful Jar", boss: "thankful-jar", when: (m) => !!m.earned["thankful-jar"] },
  ],

  bossPopup: (b, loot) => `<p class="ov-k">Adventure complete</p><div class="ov-icon">${b.icon}</div><h2 class="ov-h">${b.name}</h2><p class="ov-p">You did it! 🎉</p>
    <p class="ov-gold">+${b.xp} leaves${loot ? `<br>Treasure: ${loot.icon} ${loot.name}` : ""}</p>${loot?.title ? `<p class="ov-p">New title: “${loot.title}”</p>` : ""}`,
  lootPopup: (l) => `<p class="ov-k">New cottage treasure</p><div class="ov-icon">${l.icon}</div><h2 class="ov-h">${l.name}</h2>${l.title ? `<p class="ov-p">New title: “${l.title}”</p>` : ""}`,
  levelPopup: (from, to, rank) => { const [name, e] = plantFor(to);
    return `<p class="ov-k">Your garden grew</p><div class="ov-icon">${e}</div><h2 class="ov-h">Level ${to}</h2><p class="ov-p">A ${name} was planted in your garden</p>${rank ? `<p class="ov-gold">You're now a ${rank.name} ${rank.icon}</p>` : ""}`; },

  text: {
    toastTag: "", popupOk: "Yay ♡", statusTag: "My garden", lv: "Level",
    noTitle: "No title yet — finish adventures to earn one", titlesHead: "Titles", noTitlesYet: "Finish adventures and find treasures to unlock titles.", titleEquipped: "Wearing title",
    streakLabel: "Daily streak", streakDone: "Today counts ✿", streakTodo: "Work out, walk or finish your stretches to keep it",
    questHead: "✿ TODAY'S LITTLE QUESTS ✿", questSub: "Finish them all before midnight", questClear: "ALL DONE ♡",
    questTrain: "Do today's workout", questRest: "Rest day: gentle walk + stretch", questMobility: "Finish your stretches", questWeigh: "Weigh in", questCalories: "Log today's calories",
    mobHead: "Stretch quest", mobDone: "All stretches done! ✿",
    milesTag: "Walks", weekGoalHit: "Weekly miles reached! 🌷", todayTraining: "Today's workout", nextBoss: "Next adventure", todayKicker: "Today ♡",
    cardioTab: "Walk / Run", cardioTag: "Trail log", cardioWord: "walk", togetherLabel: (n) => `Together with ${n}`, togetherTag: "together ♡", partnerName: "Neftali",
    cardioEmpty: "No walks or runs yet — every mile grows leaves 🍃",
    firstLift: "First time: pick a weight where the last 2 reps feel hard but your form stays clean.", goUp: (w) => `try ${w} lb next ✨`,
    pbShort: "Best", newPR: (n, w) => `New personal best! ${n}: ${w} lb 🎀 +30 leaves`, trainCleared: (x) => `Workout done — proud of you ♡ +${x} leaves`,
    autofill: "Pick an exercise — last time's numbers fill in for you.", liftTag: "Lift log", figBadge: "How to", rest: "REST", restDone: "Rest done — next set ♡",
    bossHead: "✿ ADVENTURES ✿", bossSub: "Finish an adventure once and it's yours forever", bossCleared: "done", bossWon: "DONE ♡",
    duoTag: "Together", syncHead: "Sync with Neftali", syncHelp: "Text him your code and paste his here. It updates your shared adventures.",
    syncSend: "Send my code", syncGet: "Paste his code", syncMessage: (c) => `🌸 Bloom sync — open ARISE › Gates › Paste her code:\n${c}`,
    syncDone: (n) => `Synced with ${n} ♡`,
    lootHead: "Cottage treasures", lootHelp: "Tap a treasure you own to wear its title.",
    bodyTag: "Body", calTag: "Fuel", calHead: "Calories", calHint: "At the end of the day, add your total calories (copy it from your food app if you use one).", calTargetHint: "e.g. 1800",
    weighed: "Weigh-in saved ♡",
    welcomeBack: (G) => `Your garden is ready — your logs already grew ${Math.round(G.xp).toLocaleString()} leaves (level ${G.level}) 🌱`,
    welcomeNew: "Welcome to your garden 🌱 Finish today's little quests to start growing.",
  },
};

// falling petals behind everything
CFG.sceneHtml = `<div class="scene" aria-hidden="true">${Array.from({ length: 14 }, (_, i) =>
  `<i class="petal" style="left:${(i * 41) % 100}%;animation-delay:${(i * 1.7) % 14}s;animation-duration:${12 + (i % 5) * 2}s;transform:scale(${0.6 + (i % 3) * 0.25})"></i>`).join("")}</div>`;
