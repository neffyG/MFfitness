// Madison's plan — built for Planet Fitness (South Mountain, 26 E Baseline Rd).
//   Equipment used: pin-loaded machines, cable towers, Smith machine, strength bands, bodyweight. No free weights.
//   Goals: bigger glutes + legs, stronger and more mobile hips & ankles, toned arms.
//   Glutes are trained 3x a week (Mon, Thu, Fri) — frequency + getting stronger over time is what grows them.
//   Every exercise: n = name, s = sets × reps, fig = picture (see figures.js), note = how to do it.
// Edit freely.

// Done before every gym day. Bands: PF has strength bands at the functional area,
// but a cheap set of mini loop bands in her gym bag is easier.
export const MOBILITY = {
  t: "Hips & ankles", w: "Warm-up · 8–10 min",
  note: "This is part of the program. It opens your hips so your glutes do the work, not your lower back. Use a mini loop band.",
  items: [
    { n: "90/90 hip switch", s: "2 × 8 / side", fig: "ninety", note: "On a mat in the stretch area. Sit tall, rotate both knees side to side without using your hands." },
    { n: "Knee-to-wall ankle rock", s: "2 × 10 / side", fig: "ankleRock", note: "Drive your knee forward over your toes, heel stays down." },
    { n: "World's greatest stretch", s: "1 × 5 / side", fig: "wgs", note: "Big lunge, hand down, then rotate and reach the other arm to the ceiling." },
    { n: "Banded glute bridge", s: "2 × 15", fig: "bridge", note: "Band above knees, push knees out, squeeze 2 sec at the top." },
    { n: "Lateral band walk", s: "2 × 10 steps / way", fig: "bandWalk", note: "Stay low in a quarter squat, toes forward, don't let knees cave." },
  ],
};

export const COOLDOWN = {
  t: "Cool down", w: "5–8 min",
  items: [
    { n: "Pigeon stretch", s: "45 sec / side", fig: "pigeon", note: "Front shin across, fold forward slowly. Opens the deep glute." },
    { n: "Couch stretch", s: "45 sec / side", fig: "couch", note: "Back knee on a mat, foot up on a bench, squeeze your glute. Opens the hip flexor." },
    { n: "Wall calf stretch", s: "30 sec / side", fig: "calfStretch", note: "Back heel down, lean into the wall." },
    { n: "Child's pose", s: "1 min", fig: "child", note: "Knees wide, sit back, breathe into your back." },
  ],
};

// Swapped in on rough period days (auto-on for days 1–2, heavy flow or cramps; she can turn it off).
export const GENTLE = {
  t: "Gentle version", w: "Gym or home · 30–40 min",
  note: "Light movement can ease cramps. If you feel strong today, switch this off and do the normal workout — your period doesn't make you weaker.",
  items: [
    { n: "Easy treadmill walk", s: "20–30 min", fig: "walk", note: "Flat to light incline." },
    { n: "Cat-cow", s: "10 slow reps", fig: "catcow", note: "Round your back up, then let your belly drop. Move with your breath." },
    { n: "90/90 hip switch", s: "2 × 8 / side", fig: "ninety" },
    { n: "Glute bridge", s: "2 × 15", fig: "bridge" },
    { n: "Banded clamshell", s: "2 × 15 / side", fig: "clam", note: "Feet together, open the top knee, hips don't roll back." },
    { n: "Child's pose", s: "1 min", fig: "child" },
    { n: "Legs up the wall", s: "3 min", fig: "legsWall", note: "Great for cramps and tired legs." },
  ],
};

export const DAYS = [
  { id: "glutesA", tab: "Glutes (heavy)", title: "Glutes — heavy", sub: "Booty day 1 · build strength",
    items: [
      { n: "Smith machine hip thrust", s: "4 × 8–10", w: true, fig: "hipThrust",
        note: "The #1 booty builder. Put a flat bench sideways behind the Smith machine, grab a bar pad from the front desk, sit with the bar over your hips. The bar runs on rails so you don't balance anything. Chin tucked, drive through heels, 1-sec squeeze at the top." },
      { n: "Leg press — feet high & wide", s: "4 × 10", w: true, fig: "legPress",
        note: "Feet high and wide on the platform = more glute and hamstring. Lower until your knees are near your chest, don't let your lower back lift off the pad." },
      { n: "Smith machine split squat", s: "3 × 8 / leg", w: true, fig: "smithSplit",
        note: "Bar on your upper back, one foot forward, one back. Drop your back knee toward the floor, lean slightly forward for more glute." },
      { n: "Cable glute kickback", s: "3 × 12 / leg", w: true, fig: "kickback",
        note: "Cable tower: ankle strap on the low pulley. Hold the frame, kick back and slightly out, squeeze at the top. Don't arch your lower back." },
      { n: "Hip abductor machine — lean forward", s: "3 × 15–20", w: true, fig: "abduction",
        note: "Push knees out. Leaning your chest forward over your thighs hits the upper glute (the 'shelf')." },
      { n: "Banded frog pump", s: "2 × 25", fig: "bridge", note: "On a mat, soles of feet together, knees out, fast squeezes. Burnout finisher." },
    ],
    finish: { t: "Cardio", w: "15 min", items: [
      { n: "Incline treadmill walk", s: "15 min", fig: "walk", note: "Incline 8–12, speed 2.8–3.3. No holding the rails." },
    ] } },

  { id: "arms", tab: "Arms & back", title: "Arms & back", sub: "Toned arms · posture",
    note: "Toned arms come from building a little muscle, not from tiny weights for 50 reps. Pick a pin where the last 2 reps are hard.",
    items: [
      { n: "Lat pulldown machine", s: "3 × 10", w: true, fig: "pulldown", note: "Pull the bar to your upper chest, elbows down and back. A strong back makes arms look leaner." },
      { n: "Seated row machine", s: "3 × 10", w: true, fig: "seatedRow", note: "Chest on the pad, pull handles to your ribs, squeeze shoulder blades together." },
      { n: "Shoulder press machine", s: "3 × 10", w: true, fig: "press", note: "Back flat on the pad, press straight up, don't shrug." },
      { n: "Cable lateral raise", s: "3 × 12–15 / arm", w: true, fig: "lateral", note: "Low pulley, handle in the far hand. Raise out to the side to shoulder height. Light and slow." },
      { n: "Triceps rope pushdown", s: "3 × 12", w: true, fig: "pushdown", note: "High pulley + rope. Elbows pinned to your sides, spread the rope at the bottom. This tones the back of the arm." },
      { n: "Overhead cable triceps extension", s: "3 × 12", w: true, fig: "overheadCable", note: "Face away from the cable, rope behind your head, straighten your arms forward and up. Big stretch on the back of the arm." },
      { n: "Biceps curl machine", s: "3 × 12", w: true, fig: "machineCurl", note: "Arms flat on the pad, curl up, lower slowly (2–3 sec)." },
      { n: "Cable curl", s: "2 × 12", w: true, fig: "cableCurl", note: "Low pulley with the straight bar or rope. Elbows stay at your sides." },
    ],
    finish: { t: "Core", w: "8 min", items: [
      { n: "Dead bug", s: "3 × 8 / side", fig: "deadbug", note: "On a mat. Lower back stays glued to the floor." },
      { n: "Forearm plank", s: "3 × 30–45 sec", fig: "plank", note: "Squeeze glutes, pull elbows toward toes." },
    ] } },

  { id: "mobility", tab: "Hips & ankles", title: "Hips & ankles", sub: "Mobility + strength · lighter day",
    items: [
      { n: "Hip adductor machine", s: "3 × 15", w: true, fig: "adductor", note: "Squeeze knees in slowly. Strong inner thighs = stable hips and knees." },
      { n: "Cossack squat (hold the Smith bar)", s: "3 × 6 / side", fig: "cossack", note: "Set the Smith bar at chest height and hold it. Wide stance, sit into one hip, other leg straight with toes up." },
      { n: "Deep squat hold (hold the Smith bar)", s: "3 × 30 sec", fig: "squatHold", note: "Hold the bar, sit all the way down, heels flat, knees out. Opens hips and ankles." },
      { n: "Single-leg calf raise on a step", s: "3 × 12 / leg", fig: "calfRaise", note: "Hold a rail, heel drops below the step, pause at the top. Stronger ankles, nicer calves." },
      { n: "Tibialis raise", s: "3 × 15", fig: "tib", note: "Back against a wall, feet out in front, lift your toes up and down. Protects ankles and knees." },
      { n: "Banded clamshell", s: "2 × 15 / side", fig: "clam", note: "Band above knees, feet together, open the top knee." },
      { n: "Side plank (knees)", s: "2 × 20–30 sec / side", fig: "sidePlank", note: "Hips high. Strengthens the side glute." },
    ],
    finish: { t: "Cardio", w: "15–20 min", items: [
      { n: "Stepmill (stairs)", s: "15–20 min", fig: "stairs", note: "Steady pace, stand tall, don't lean on the rails. Glutes love this." },
    ] } },

  { id: "legs", tab: "Legs & glutes", title: "Legs & glutes", sub: "Booty day 2 · volume",
    items: [
      { n: "Smith machine squat — feet forward", s: "4 × 10", w: true, fig: "smithSquat", note: "Bar on your upper back, feet a little in front of the bar, shoulder-width. Sit down and back, knees track over toes." },
      { n: "Single-leg leg press", s: "3 × 10 / leg", w: true, fig: "legPress", note: "One foot in the middle-high of the platform. Lighter weight, full depth." },
      { n: "45° back extension — glute version", s: "3 × 12", fig: "backExt", note: "Pad at your hip bones, feet turned out, round your upper back slightly and squeeze glutes to come up. Stop when your body is straight." },
      { n: "Seated leg curl machine", s: "3 × 12", w: true, fig: "legCurl", note: "Slow on the way back (3 sec)." },
      { n: "Leg extension machine", s: "3 × 12", w: true, fig: "legExt", note: "Squeeze at the top, lower slowly." },
      { n: "Calf raise on the leg press", s: "3 × 15", w: true, fig: "legPressCalf", note: "Legs straight, balls of feet on the edge of the platform, push through your toes." },
    ],
    finish: { t: "Finisher", w: "5 min", items: [
      { n: "Hip abductor machine", s: "2 × 20", w: true, fig: "abduction", note: "Pulse at the end of the last set." },
    ] } },

  { id: "glutesB", tab: "Glutes & arms", title: "Glutes & arms", sub: "Booty day 3 · pump",
    items: [
      { n: "Smith machine hip thrust (pause)", s: "3 × 12", w: true, fig: "hipThrust", note: "Lighter than Monday, 2-sec pause at the top every rep." },
      { n: "Cable pull-through", s: "3 × 12", w: true, fig: "pullThrough", note: "Low pulley + rope, face away, rope between your legs. Push hips back, then snap them forward and squeeze." },
      { n: "Banded donkey kick", s: "3 × 15 / leg", fig: "donkey", note: "On a mat on all fours, band around your knees. Keep the knee bent and push your foot to the ceiling." },
      { n: "Hip abductor machine — sit upright", s: "3 × 15", w: true, fig: "abduction", note: "Sitting tall hits the middle of the glute (Monday's lean hits the top)." },
      { n: "Chest press machine", s: "3 × 10", w: true, fig: "chestPress", note: "Handles at chest height, push out, don't lock your elbows." },
      { n: "Triceps rope pushdown", s: "3 × 12", w: true, fig: "pushdown" },
      { n: "Rear delt fly machine", s: "3 × 15", w: true, fig: "revFly", note: "Face the pad, pull arms out wide. Shapes the back of the shoulders and helps posture." },
    ],
    finish: { t: "Cardio", w: "10 min", items: [
      { n: "Bike intervals", s: "10 min: 30 sec hard / 60 sec easy", fig: "bike" },
    ] } },

  { id: "active", tab: "Active day", title: "Active day", sub: "Move, no lifting", rest: true,
    items: [
      { n: "Hike or long walk", s: "45–60 min", fig: "walk", note: "Or PF's 30 Minute Circuit if you're at the gym." },
      { n: "90/90 hip switch", s: "2 × 8 / side", fig: "ninety" },
      { n: "World's greatest stretch", s: "1 × 5 / side", fig: "wgs" },
      { n: "Knee-to-wall ankle rock", s: "2 × 10 / side", fig: "ankleRock" },
    ] },

  { id: "rest", tab: "Rest", title: "Rest", sub: "Recovery — muscles grow on rest days", rest: true,
    items: [
      { n: "Easy walk (optional)", s: "15–20 min", fig: "walk" },
      { n: "Pigeon stretch", s: "1 min / side", fig: "pigeon" },
      { n: "Child's pose", s: "1 min", fig: "child" },
      { n: "Legs up the wall", s: "3 min", fig: "legsWall" },
    ] },
];

// Weekday → workout. 0 = Sunday. Glutes Mon / Thu / Fri.
export const SCHEDULE = {
  1: "glutesA",  // Mon
  2: "arms",     // Tue
  3: "mobility", // Wed
  4: "legs",     // Thu
  5: "glutesB",  // Fri
  6: "active",   // Sat
  0: "rest",     // Sun
};

// Shown on the main lifting block every gym day.
export const GROW_NOTE = "To grow: pick a weight (pin) where the last 2 reps are hard. When you hit the top of the rep range on every set, move the pin down one next time. Rest 1–2 min between sets. Eat protein at every meal.";

// How each cycle phase changes training. (Research on "cycle syncing" is mixed — these are defaults, she goes by feel.)
export const PHASE_TRAIN = {
  menstrual: "Lift if you feel good — strength doesn't drop on your period. On heavy or crampy days, use the gentle version or drop a set.",
  follicular: "Energy and recovery usually climb now. Great days to move the pin up on hip thrusts and leg press.",
  ovulation: "Often your strongest days. Push it, but warm up well and keep form tight.",
  luteal: "Body temperature and heart rate run a little higher, so cardio feels harder. Keep the weights, pick steady cardio over sprints.",
  pms: "Energy and sleep can dip. A shorter session still counts. Get enough protein — cravings are normal.",
  late: "Train as normal and go by feel.",
  hormonal: "Train by feel.",
};

/* ---------- how a day is built ---------- */
import { makePlan } from "./plan.js";
export const PLAN = makePlan({
  DAYS, SCHEDULE,
  blocks: (day, opts = {}) => {
    if (day.rest) return [{ t: "Move", w: "Anywhere", main: true, items: day.items }, COOLDOWN];
    if (opts.gentle) return [{ ...GENTLE, main: true }, COOLDOWN];
    return [
      { ...MOBILITY, main: true },
      { t: "Workout", w: "45–55 min", main: true, lift: true, note: day.note || GROW_NOTE, items: day.items },
      { ...day.finish, main: true },
      COOLDOWN,
    ];
  },
});

// Default daily stretch quest (editable in the app). fig = picture.
export const DEFAULT_MOVES = [
  { id: "m-9090", n: "90/90 hip switch", s: "2 × 8 / side", fig: "ninety" },
  { id: "m-ankle", n: "Knee-to-wall ankle rock", s: "2 × 10 / side", fig: "ankleRock" },
  { id: "m-pigeon", n: "Pigeon stretch", s: "45 sec / side", fig: "pigeon" },
  { id: "m-couch", n: "Couch stretch", s: "45 sec / side", fig: "couch" },
  { id: "m-bridge", n: "Banded glute bridge", s: "2 × 15", fig: "bridge" },
  { id: "m-calf", n: "Wall calf stretch", s: "30 sec / side", fig: "calfStretch" },
];
