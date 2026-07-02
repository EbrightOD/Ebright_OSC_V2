import { useEffect, useRef, useState } from 'react';

const W = 680, H = 460;
const ROAD_X = 55, ROAD_W = 570;
const BOX_W = 132, BOX_H = 58;
const CAR_W = 36, CAR_H = 60;
const STAR_SZ = 28;
const LABELS = ['A', 'B', 'C', 'D'];
const BOX_COLS = [
  ['#b91c1c', '#7f1d1d'],
  ['#1d4ed8', '#1e3a8a'],
  ['#c2410c', '#7c2d12'],
  ['#5C1A14', '#3a0f0c'], /* deep brick red — replaces purple */
];
const PX = 4;

// 6 ebright-specific software questions. Pass = 4+ correct, < 4 = repeat.
const QUESTIONS = [
  { q: "Where do you find your company email login details?",
    answers: ["ClickUp", "AOne", "Library", "Zoom"],
    correct: 2 },
  { q: "Which tool do you use to update your daily tasks?",
    answers: ["Library", "ClickUp", "Zoom", "Process Street"],
    correct: 1 },
  { q: "Where do you submit a leave application?",
    answers: ["ClickUp", "Library", "AOne", "WhatsApp"],
    correct: 2 },
  { q: "Which tool holds every workflow and SOP at ebright?",
    answers: ["Zoom", "Library", "ClickUp", "Process Street"],
    correct: 3 },
  { q: "What must you do for Zoom on your first day?",
    answers: ["Nothing — already set up", "Install + log in with company email", "Buy a subscription", "Email IT for access"],
    correct: 1 },
  { q: "Where do you log in to submit a claim?",
    answers: ["ClickUp", "WhatsApp", "Library", "Autocount Payroll"],
    correct: 3 },
];
const PASS_THRESHOLD = 4;

const CAR_GRID = [
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 0],
  [3, 2, 2, 3, 2, 3, 2, 2, 3],
  [3, 2, 2, 3, 2, 3, 2, 2, 3],
  [0, 2, 4, 4, 4, 4, 4, 2, 0],
  [0, 2, 4, 4, 4, 4, 4, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 5, 5, 5, 5, 5, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 0],
  [3, 2, 2, 2, 2, 2, 2, 2, 3],
  [3, 2, 2, 2, 2, 2, 2, 2, 3],
  [0, 2, 4, 4, 4, 4, 4, 2, 0],
  [0, 2, 2, 2, 2, 2, 2, 2, 0],
  [0, 7, 2, 7, 0, 7, 2, 7, 0],
];
const CAR_PAL = { 0: null, 1: '#333', 2: '#e63946', 3: '#fffde7', 4: 'rgba(140,210,255,0.85)', 5: 'rgba(255,255,255,0.9)', 7: '#111' };
const ROCK_GRID = [[0, 1, 1, 1, 0], [1, 2, 1, 2, 1], [1, 1, 2, 1, 1], [1, 2, 1, 1, 1], [0, 1, 1, 1, 0]];
const OIL_DARK = ['#1e1b4b', '#312e81', '#2e1065', '#0f0f3d', '#1a1a5e'];
const OIL_SHIMMER = ['#7c3aed', '#6d28d9', '#4c1d95'];
// Mario-Kart-style 5-point star (filled by 1, transparent by 0)
const STAR_GRID = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
];
const STAR_RAINBOW = ['#ff5252', '#ff9800', '#ffd700', '#4ade80', '#60a5fa', '#a78bfa'];

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export default function RacerMinigame({ onComplete, onClose }) {
  const canvasRef = useRef(null);
  const [, setTick] = useState(0);
  const re = () => setTick((t) => (t + 1) % 1e9);

  const stateRef = useRef({
    phase: 'start', // start, popup, racing, correct, wrong, gameover, win
    score: 0,
    lives: 3,
    qIdx: 0,
    popupSecs: 10,
    pendingBoxes: [],
    bannerText: '',
    bannerNum: 1,
    car: { x: W / 2, y: H - 100, spin: 0, spinV: 0, spinning: false },
    boxes: [],
    parts: [],
    oilSlicks: [],
    rocks: [],
    stars: [],
    flashT: 0,
    flashCol: null,
    resultMsg: '',
    shakeAmt: 0,
    keys: {},
    lastTs: 0,
    screenFlash: { a: 0, col: '#fff' },
    obstacleTimer: 0,
    starTimer: 0,
    starPower: 0, // ms remaining of invincibility
    roadY: 0,
    animT: 0,
  });

  /* ── helpers ─────────────────────────────────────── */
  const initGame = () => {
    const s = stateRef.current;
    s.car = { x: W / 2, y: H - 100, spin: 0, spinV: 0, spinning: false };
    s.boxes = []; s.parts = []; s.oilSlicks = []; s.rocks = []; s.stars = [];
    s.score = 0; s.lives = 3; s.qIdx = 0; s.correctCount = 0; s.answers = [];
    s.flashT = 0; s.shakeAmt = 0;
    s.screenFlash = { a: 0, col: '#fff' };
    s.obstacleTimer = 0; s.starTimer = 100; s.starPower = 0;
    s.bannerText = '';
    re();
  };

  const showPopup = (qi) => {
    const s = stateRef.current;
    s.phase = 'popup';
    const q = QUESTIONS[qi];
    const indexed = q.answers.map((text, i) => ({ text, isCorrect: i === q.correct }));
    s.pendingBoxes = shuffle(indexed);
    s.popupSecs = 10;
    s.bannerText = q.q;
    s.bannerNum = qi + 1;
    re();
  };

  const dismissPopup = () => {
    const s = stateRef.current;
    spawnBoxes(s.pendingBoxes);
    s.oilSlicks = []; s.rocks = []; s.stars = []; s.obstacleTimer = 0;
    s.car.spinning = false; s.car.spin = 0; s.car.spinV = 0;
    s.phase = 'racing';
    re();
  };

  const randBoxX = () => ROAD_X + BOX_W / 2 + 8 + Math.random() * (ROAD_W - BOX_W - 16);
  // Spawn the 4 answer boxes spread far apart on the Y axis so players
  // have enough reaction time to read & steer toward the right one.
  const VERTICAL_GAP = 260;
  const VERTICAL_JITTER = 120;
  const spawnBoxes = (shuffled) => {
    const s = stateRef.current;
    // Lay answers out alternating left/right of road centre so two boxes
    // never sit on top of each other horizontally either.
    const half = ROAD_W / 2;
    const cx = ROAD_X + half;
    s.boxes = shuffled.map((ans, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const xWobble = (Math.random() * 0.35 + 0.25) * half; // 25–60% of half-width
      const x = cx + side * xWobble - BOX_W / 2;
      const clampedX = Math.max(ROAD_X + 8, Math.min(ROAD_X + ROAD_W - BOX_W - 8, x));
      return {
        x: clampedX,
        y: -BOX_H - i * (VERTICAL_GAP + Math.random() * VERTICAL_JITTER),
        text: ans.text,
        isCorrect: ans.isCorrect,
        ci: i,
        hit: false,
      };
    });
  };
  const respawn = (b) => {
    b.x = randBoxX() - BOX_W / 2;
    // Respawn well above the viewport with a generous gap so wrong-then-re-pass
    // doesn't feel rushed.
    b.y = -BOX_H - 320 - Math.random() * 240;
  };

  const spawnOilSlick = () => {
    stateRef.current.oilSlicks.push({ x: ROAD_X + 30 + Math.random() * (ROAD_W - 80), y: -50, w: 72, h: 28, hit: false });
  };
  const spawnRock = () => {
    stateRef.current.rocks.push({ x: ROAD_X + 30 + Math.random() * (ROAD_W - 60), y: -30, sz: 20, hit: false });
  };
  const spawnStar = () => {
    stateRef.current.stars.push({
      x: ROAD_X + 30 + Math.random() * (ROAD_W - 60),
      y: -STAR_SZ,
      sz: STAR_SZ,
      hit: false,
    });
  };
  const tickObstacles = (dt) => {
    const s = stateRef.current;
    s.obstacleTimer += dt;
    const interval = Math.max(55, 120 - s.qIdx * 8);
    if (s.obstacleTimer > interval) {
      s.obstacleTimer = 0;
      Math.random() < 0.55 ? spawnOilSlick() : spawnRock();
    }
    s.starTimer -= dt;
    if (s.starTimer <= 0) {
      spawnStar();
      s.starTimer = 280 + Math.random() * 200;
    }
  };

  const spawnParts = (x, y, cols, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 4;
      const col = cols[Math.floor(Math.random() * cols.length)];
      stateRef.current.parts.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.5,
        col, life: 30 + Math.random() * 30,
        sz: PX * (1 + Math.floor(Math.random() * 3)),
      });
    }
  };

  /* ── drawing primitives ──────────────────────────── */
  const drawPixelCar = (ctx, cx, cy, spin, animT, starPower) => {
    ctx.save();
    ctx.translate(cx, cy);
    if (spin) ctx.rotate(spin);
    const P = 4, offX = -4.5 * P, offY = -7.5 * P;

    // Star-power rainbow tint
    if (starPower > 0) {
      const tintColor = STAR_RAINBOW[Math.floor(animT * 0.5) % STAR_RAINBOW.length];
      // Halo
      ctx.fillStyle = tintColor;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(offX - 6, offY - 6, 9 * P + 12, 15 * P + 12);
      ctx.globalAlpha = 1;
    }

    CAR_GRID.forEach((row, ry) => row.forEach((cell, rx) => {
      if (!cell || !CAR_PAL[cell]) return;
      // Tint car body during star-power
      if (starPower > 0 && cell === 2) {
        ctx.fillStyle = STAR_RAINBOW[(Math.floor(animT * 0.6) + ry + rx) % STAR_RAINBOW.length];
      } else {
        ctx.fillStyle = CAR_PAL[cell];
      }
      ctx.fillRect(offX + rx * P, offY + ry * P, P, P);
    }));
    ctx.restore();
  };

  const drawPixelRock = (ctx, rx, ry, animT) => {
    const P = 5, offX = rx - 2.5 * P, offY = ry - 2.5 * P;
    ROCK_GRID.forEach((row, y) => row.forEach((c, x) => {
      if (!c) return;
      ctx.fillStyle = c === 2 ? '#9ca3af' : '#6b7280';
      ctx.fillRect(offX + x * P, offY + y * P, P, P);
    }));
    if (Math.floor(animT * 0.15) % 2 === 0) {
      ctx.fillStyle = '#f97316';
      [[-P, -P], [4 * P, -P], [-P, 4 * P], [4 * P, 4 * P]].forEach(([dx, dy]) =>
        ctx.fillRect(offX + dx, offY + dy, P, P));
    }
  };

  const drawPixelOil = (ctx, o, animT) => {
    const PO = 8, gw = Math.ceil(o.w / PO), gh = Math.ceil(o.h / PO);
    const bx = o.x - o.w / 2, by = o.y - o.h / 2;
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        ctx.fillStyle = OIL_DARK[(gx + gy) % OIL_DARK.length];
        ctx.fillRect(bx + gx * PO, by + gy * PO, PO, PO);
      }
    }
    const t = Math.floor(animT * 0.07);
    for (let s = 0; s < 5; s++) {
      const gx = (s * 7 + t) % gw, gy = (s * 3 + t) % gh;
      ctx.fillStyle = OIL_SHIMMER[s % 3];
      ctx.fillRect(bx + gx * PO, by + gy * PO, PO, PO);
    }
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('OIL', o.x, o.y);
  };

  const drawStar = (ctx, st, animT) => {
    const P = 4;
    const cx = st.x, cy = st.y;
    const offX = cx - 3.5 * P;
    const offY = cy - 3.5 * P;
    // Rainbow halo
    const haloCol = STAR_RAINBOW[Math.floor(animT * 0.4) % STAR_RAINBOW.length];
    ctx.fillStyle = haloCol;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(offX - 4, offY - 4, 7 * P + 8, 7 * P + 8);
    ctx.globalAlpha = 1;
    // Star shape
    STAR_GRID.forEach((row, ry) => row.forEach((c, rx) => {
      if (!c) return;
      // Animated rainbow fill
      ctx.fillStyle = STAR_RAINBOW[(Math.floor(animT * 0.5) + rx + ry) % STAR_RAINBOW.length];
      ctx.fillRect(offX + rx * P, offY + ry * P, P, P);
    }));
    // Bright center
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(offX + 3 * P, offY + 2 * P, P, P);
  };

  const wrapPixelText = (ctx, text, cx, cy, maxW, lh) => {
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = text.split(' ');
    const lines = [];
    let line = '';
    words.forEach((w) => {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW) { lines.push(line); line = w; }
      else line = t;
    });
    lines.push(line);
    const th = lines.length * lh;
    lines.forEach((l, i) => ctx.fillText(l, cx, cy - th / 2 + lh / 2 + i * lh));
  };

  const pxText = (ctx, text, x, y, col, shadow, size) => {
    ctx.font = (size || '8px') + ' "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (shadow) { ctx.fillStyle = shadow; ctx.fillText(text, x + 2, y + 2); }
    ctx.fillStyle = col;
    ctx.fillText(text, x, y);
  };

  /* ── update ──────────────────────────────────────── */
  const update = (ts) => {
    const s = stateRef.current;
    const dt = Math.min((ts - s.lastTs) / 16.67, 3);
    s.lastTs = ts;
    s.animT += dt;
    s.roadY = (s.roadY + (s.phase === 'racing' ? 5 : 1) * dt) % 64;

    s.parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.15 * dt; p.life -= dt; });
    s.parts = s.parts.filter((p) => p.life > 0);

    if (s.starPower > 0) s.starPower -= dt * 16;

    if (s.phase === 'racing') {
      const sp = s.car.spinning ? 0 : (s.starPower > 0 ? 6.5 : 5) * dt;
      if (!s.car.spinning) {
        if (s.keys['ArrowLeft'] || s.keys['a'] || s.keys['A']) s.car.x -= sp;
        if (s.keys['ArrowRight'] || s.keys['d'] || s.keys['D']) s.car.x += sp;
        if (s.keys['ArrowUp'] || s.keys['w'] || s.keys['W']) s.car.y -= sp;
        if (s.keys['ArrowDown'] || s.keys['s'] || s.keys['S']) s.car.y += sp;
      } else {
        s.car.x += Math.sin(s.car.spin) * 1.8 * dt;
        s.car.spin += s.car.spinV * dt;
        s.car.spinV *= 0.96;
        if (Math.abs(s.car.spinV) < 0.02) { s.car.spinning = false; s.car.spin = 0; }
      }
      s.car.x = Math.max(ROAD_X + CAR_W / 2 + 4, Math.min(ROAD_X + ROAD_W - CAR_W / 2 - 4, s.car.x));
      s.car.y = Math.max(CAR_H / 2 + 10, Math.min(H - CAR_H / 2 - 10, s.car.y));

      // Star trail particles when invincible
      if (s.starPower > 0 && Math.floor(s.animT * 0.5) % 2 === 0) {
        spawnParts(s.car.x, s.car.y + CAR_H / 2, STAR_RAINBOW, 2);
      }

      const spd = (2 + s.qIdx * 0.25) * dt;
      s.oilSlicks.forEach((o) => { o.y += spd; });
      s.rocks.forEach((r) => { r.y += spd; });
      s.stars.forEach((st) => { st.y += spd * 1.1; });
      s.oilSlicks = s.oilSlicks.filter((o) => o.y < H + 60);
      s.rocks = s.rocks.filter((r) => r.y < H + 40);
      s.stars = s.stars.filter((st) => st.y < H + STAR_SZ);
      s.boxes.forEach((b) => { b.y += spd * 0.88; if (b.y > H + BOX_H) respawn(b); });
      tickObstacles(dt);

      // Star pickup
      s.stars.forEach((st) => {
        if (st.hit) return;
        const dx = s.car.x - st.x, dy = s.car.y - st.y;
        if (Math.sqrt(dx * dx + dy * dy) < st.sz / 2 + 14) {
          st.hit = true;
          s.starPower = 3000; // 3 seconds invincibility
          s.score += 50;
          s.resultMsg = '* STAR POWER! +50 *';
          s.flashCol = '#ffd700';
          s.flashT = 40;
          spawnParts(st.x, st.y, STAR_RAINBOW, 30);
          s.screenFlash = { a: 0.3, col: '#ffd700' };
        }
      });
      s.stars = s.stars.filter((st) => !st.hit);

      s.oilSlicks.forEach((o) => {
        if (o.hit) return;
        if (s.car.x > o.x - o.w / 2 && s.car.x < o.x + o.w / 2 && s.car.y > o.y - o.h / 2 && s.car.y < o.y + o.h / 2) {
          if (s.starPower > 0) return; // ignore oil during star power
          if (!s.car.spinning) {
            o.hit = true;
            s.car.spinning = true;
            s.car.spinV = (0.15 + Math.random() * 0.1) * (Math.random() < 0.5 ? 1 : -1);
            spawnParts(s.car.x, s.car.y, ['#7c3aed', '#a78bfa', '#ddd6fe'], 14);
            s.shakeAmt = 5;
            s.resultMsg = '* OIL SLICK *';
            s.flashCol = '#7c3aed';
            s.flashT = 30;
          }
        }
      });

      s.rocks.forEach((r) => {
        if (r.hit) return;
        const dx = s.car.x - r.x, dy = s.car.y - r.y;
        if (Math.sqrt(dx * dx + dy * dy) < r.sz + 16) {
          if (s.starPower > 0) {
            // Smash through the rock
            r.hit = true;
            s.score += 20;
            s.resultMsg = '* SMASH! +20 *';
            s.flashCol = '#ffd700';
            s.flashT = 24;
            spawnParts(r.x, r.y, ['#9ca3af', '#fff', '#ffd700'], 16);
            return;
          }
          r.hit = true;
          s.lives--;
          s.resultMsg = '* CRASH! -1 HP *';
          s.flashCol = '#ff1744';
          s.flashT = 80;
          s.phase = 'wrong';
          s.shakeAmt = 18;
          spawnParts(s.car.x, s.car.y, ['#ff4500', '#ff8c00', '#ffcc00'], 30);
          spawnParts(r.x, r.y, ['#6b7280', '#9ca3af'], 16);
          s.screenFlash = { a: 0.7, col: '#ff1100' };
          re();
        }
      });

      s.boxes.forEach((b) => {
        if (b.hit) return;
        if (s.car.x - CAR_W / 2 < b.x + BOX_W && s.car.x + CAR_W / 2 > b.x &&
            s.car.y - CAR_H / 2 < b.y + BOX_H && s.car.y + CAR_H / 2 > b.y) {
          b.hit = true;
          if (b.isCorrect) {
            const pts = Math.max(50, 100 - s.qIdx * 4);
            s.score += pts;
            s.correctCount++;
            s.resultMsg = '* CORRECT! +' + pts + ' *';
            s.flashCol = '#4ade80';
            s.flashT = 90;
            s.phase = 'correct';
            spawnParts(s.car.x, s.car.y, ['#4ade80', '#facc15', '#60a5fa'], 50);
            s.screenFlash = { a: 0.2, col: '#00ff66' };
          } else {
            s.lives--;
            s.resultMsg = '* WRONG! *';
            s.flashCol = '#ff1744';
            s.flashT = 80;
            s.phase = 'wrong';
            s.shakeAmt = 14;
            spawnParts(s.car.x, s.car.y, ['#ff1744', '#ff8800'], 24);
            s.screenFlash = { a: 0.5, col: '#ff0033' };
          }
          re();
        }
      });
    }

    if (s.screenFlash.a > 0) s.screenFlash.a = Math.max(0, s.screenFlash.a - 0.05 * dt);

    if ((s.phase === 'correct' || s.phase === 'wrong') && s.flashT > 0) {
      s.flashT -= dt;
      s.shakeAmt *= 0.80;
      if (s.flashT <= 0) {
        s.flashT = 0;
        // Advance regardless of right/wrong — final pass/fail is checked
        // against correctCount at the end (>= PASS_THRESHOLD = pass).
        s.qIdx++;
        if (s.qIdx >= QUESTIONS.length) {
          s.phase = s.correctCount >= PASS_THRESHOLD ? 'win' : 'gameover';
          re(); return;
        }
        // Out of lives also forces a fail.
        if (s.lives <= 0) { s.phase = 'gameover'; re(); return; }
        showPopup(s.qIdx);
      }
    }
  };

  /* ── draw ────────────────────────────────────────── */
  const drawRoad = (ctx) => {
    const s = stateRef.current;
    const PG = 32;
    const sx = s.shakeAmt > 0.5 ? Math.round((Math.random() - 0.5) * s.shakeAmt / PX) * PX : 0;
    const sy = s.shakeAmt > 0.5 ? Math.round((Math.random() - 0.5) * s.shakeAmt * 0.3 / PX) * PX : 0;
    ctx.save();
    ctx.translate(sx, sy);

    for (let gy = -PG; gy < H + PG; gy += PG) {
      for (let gx = 0; gx < W; gx += PG) {
        const even = ((Math.floor(gx / PG) + Math.floor((gy + s.roadY) / PG)) % 2 === 0);
        ctx.fillStyle = even ? '#14532d' : '#166534';
        ctx.fillRect(gx, gy + (-s.roadY % PG), PG, PG);
      }
    }
    const PR = 32;
    for (let ry = -PR; ry < H + PR; ry += PR) {
      ctx.fillStyle = Math.floor((ry + s.roadY) / PR) % 2 === 0 ? '#111827' : '#0f172a';
      ctx.fillRect(ROAD_X, ry + (-s.roadY % PR), ROAD_W, PR);
    }
    ctx.fillStyle = '#374151';
    const dH = 24, gH = 20;
    for (let l = 1; l < 5; l++) {
      const lx = ROAD_X + l * (ROAD_W / 5);
      for (let dy = -dH - gH; dy < H + dH + gH; dy += dH + gH) {
        ctx.fillRect(lx - 2, (dy + s.roadY) % (dH + gH) - dH, 4, dH);
      }
    }
    const cW = 8, sH = 16;
    for (let sy2 = -sH * 2; sy2 < H + sH * 2; sy2 += sH) {
      const drawY = (sy2 + s.roadY) % (sH * 2) - sH * 2;
      const even2 = Math.floor((sy2 + s.roadY) / sH) % 2 === 0;
      ctx.fillStyle = even2 ? '#dc2626' : '#ffffff';
      ctx.fillRect(ROAD_X - cW, drawY, cW, sH);
      ctx.fillRect(ROAD_X + ROAD_W, drawY, cW, sH);
    }
    ctx.restore();
  };

  const drawBoxes = (ctx) => {
    const s = stateRef.current;
    const sx = s.shakeAmt > 0.5 ? Math.round((Math.random() - 0.5) * s.shakeAmt * 0.4 / PX) * PX : 0;
    s.boxes.forEach((b) => {
      if (b.hit || b.y > H) return;
      ctx.save();
      ctx.translate(sx, 0);
      const [bg, dark] = BOX_COLS[b.ci];
      ctx.fillStyle = '#000';
      ctx.fillRect(b.x + 4, b.y + 4, BOX_W, BOX_H);
      ctx.fillStyle = bg;
      ctx.fillRect(b.x, b.y, BOX_W, BOX_H);
      ctx.fillStyle = dark;
      ctx.fillRect(b.x, b.y + BOX_H - PX, BOX_W, PX);
      ctx.fillRect(b.x + BOX_W - PX, b.y, PX, BOX_H);
      ctx.fillStyle = 'rgba(255,255,255,.2)';
      ctx.fillRect(b.x, b.y, BOX_W, PX);
      ctx.fillRect(b.x, b.y, PX, BOX_H);
      ctx.fillStyle = dark;
      ctx.fillRect(b.x, b.y, 32, BOX_H);
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.fillRect(b.x, b.y, 32, PX);
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(LABELS[b.ci], b.x + 16, b.y + BOX_H / 2);
      ctx.fillStyle = '#fff';
      wrapPixelText(ctx, b.text, b.x + 32 + (BOX_W - 32) / 2, b.y + BOX_H / 2, BOX_W - 38, 11);
      ctx.restore();
    });
  };

  const drawCar = (ctx) => {
    const s = stateRef.current;
    const sx = s.shakeAmt > 0.5 ? Math.round((Math.random() - 0.5) * s.shakeAmt * 0.4 / PX) * PX : 0;
    if (Math.floor(s.animT * 0.5) % 3 === 0) {
      ctx.fillStyle = 'rgba(150,150,150,.35)';
      ctx.fillRect(s.car.x - 6 + sx, s.car.y + CAR_H / 2, PX, PX * 2);
      ctx.fillRect(s.car.x + 2 + sx, s.car.y + CAR_H / 2, PX, PX * 2);
    }
    drawPixelCar(ctx, s.car.x + sx, s.car.y, s.car.spinning ? s.car.spin : 0, s.animT, s.starPower);
  };

  const drawParts = (ctx) => {
    stateRef.current.parts.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 60);
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x / PX) * PX, Math.round(p.y / PX) * PX, p.sz, p.sz);
      ctx.globalAlpha = 1;
    });
  };

  const drawFlash = (ctx) => {
    const s = stateRef.current;
    if (s.flashT > 0 && s.flashCol) {
      ctx.fillStyle = s.flashCol;
      ctx.globalAlpha = Math.min(0.25, s.flashT / 80 * 0.25);
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (s.screenFlash.a > 0.01) {
      ctx.fillStyle = s.screenFlash.col;
      ctx.globalAlpha = s.screenFlash.a;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  };

  const drawResultMsg = (ctx) => {
    const s = stateRef.current;
    if ((s.phase === 'correct' || s.phase === 'wrong') && s.flashT > 35) {
      const col = s.phase === 'correct' ? '#4ade80' : '#ff5252';
      pxText(ctx, s.resultMsg, W / 2, H / 2 - 22, '#000', null, '8px');
      pxText(ctx, s.resultMsg, W / 2, H / 2 - 24, col, null, '8px');
    }
    if (s.resultMsg.includes('OIL') && s.flashT > 5 && s.flashT < 30) {
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#a78bfa';
      ctx.fillText(s.resultMsg, W / 2, H / 2 - 20);
    }
    if ((s.resultMsg.includes('STAR') || s.resultMsg.includes('SMASH')) && s.flashT > 5 && s.flashT < 36) {
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const col = STAR_RAINBOW[Math.floor(s.animT * 0.6) % STAR_RAINBOW.length];
      ctx.fillStyle = '#000';
      ctx.fillText(s.resultMsg, W / 2 + 2, H / 2 - 20 + 2);
      ctx.fillStyle = col;
      ctx.fillText(s.resultMsg, W / 2, H / 2 - 20);
    }
  };

  const drawScanlines = (ctx) => {
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#000';
    for (let sy = 0; sy < H; sy += 4) ctx.fillRect(0, sy, W, 2);
    ctx.restore();
  };

  const drawStartScreen = (ctx) => {
    ctx.fillStyle = 'rgba(26,20,16,.92)'; /* walnut overlay */
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#D4A82B'; /* mustard ticks */
    for (let i = 0; i < W; i += 8) { ctx.fillRect(i, 0, 4, 4); ctx.fillRect(i, H - 4, 4, 4); }
    for (let j = 0; j < H; j += 8) { ctx.fillRect(0, j, 4, 4); ctx.fillRect(W - 4, j, 4, 4); }

    pxText(ctx, 'DEV RACER', W / 2, H / 2 - 124, '#b81f17', null, '16px'); /* red shadow */
    pxText(ctx, 'DEV RACER', W / 2 - 2, H / 2 - 126, '#E63329', null, '16px');
    pxText(ctx, 'DEV RACER', W / 2, H / 2 - 128, '#FFFFFF', null, '16px');
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D4A82B';
    ctx.fillText('PIXEL  EDITION', W / 2, H / 2 - 100);

    ctx.fillStyle = '#231C16'; /* oak panel */
    ctx.fillRect(W / 2 - 215, H / 2 - 78, 430, 144);
    ctx.fillStyle = '#3D5C47'; /* faded green border */
    ctx.fillRect(W / 2 - 215, H / 2 - 78, 430, 4);
    ctx.fillRect(W / 2 - 215, H / 2 + 62, 430, 4);
    ctx.fillRect(W / 2 - 215, H / 2 - 78, 4, 144);
    ctx.fillRect(W / 2 + 211, H / 2 - 78, 4, 144);

    const rows = [
      { col: '#D4A82B', txt: 'STEER to hit the correct A/B/C/D box' },
      { col: '#FFD700', txt: 'STAR = invincibility + smash rocks!' },
      { col: '#a78bfa', txt: 'OIL = spin out (no HP lost)' },     /* oil keeps its purple cue */
      { col: '#E63329', txt: 'ROCK = crash and lose 1 HP!' },
    ];
    rows.forEach((r, i) => {
      const y = H / 2 - 58 + i * 30;
      ctx.fillStyle = r.col;
      ctx.fillRect(W / 2 - 198, y - 6, 10, 10);
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(r.txt, W / 2 - 180, y + 1);
    });

    if (Math.floor(Date.now() / 500) % 2) {
      ctx.textAlign = 'center';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = '#D4A82B';
      ctx.fillText('> PRESS ENTER TO START <', W / 2, H / 2 + 90);
    }
  };

  const drawEndScreen = (ctx, title, col, sub) => {
    const s = stateRef.current;
    ctx.fillStyle = 'rgba(0,0,10,.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = col;
    for (let i = 0; i < W; i += 8) { ctx.fillRect(i, 0, 4, 4); ctx.fillRect(i, H - 4, 4, 4); }
    for (let j = 0; j < H; j += 8) { ctx.fillRect(0, j, 4, 4); ctx.fillRect(W - 4, j, 4, 4); }
    pxText(ctx, title, W / 2, H / 2 - 80, col, '#000', '13px');
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(sub, W / 2, H / 2 - 42);
    ctx.fillStyle = '#231C16'; /* oak */
    ctx.fillRect(W / 2 - 110, H / 2 - 18, 220, 44);
    ctx.fillStyle = col;
    ctx.fillRect(W / 2 - 110, H / 2 - 18, 220, 4);
    ctx.fillRect(W / 2 - 110, H / 2 + 22, 220, 4);
    ctx.fillRect(W / 2 - 110, H / 2 - 18, 4, 44);
    ctx.fillRect(W / 2 + 106, H / 2 - 18, 4, 44);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#D4A82B';
    ctx.fillText('SCORE: ' + s.score, W / 2, H / 2 + 6);
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const s = stateRef.current;

    ctx.clearRect(0, 0, W, H);
    drawRoad(ctx);
    if (s.phase !== 'start') {
      s.oilSlicks.forEach((o) => { if (!o.hit) drawPixelOil(ctx, o, s.animT); });
      s.rocks.forEach((r) => { if (!r.hit) drawPixelRock(ctx, r.x, r.y, s.animT); });
      s.stars.forEach((st) => { if (!st.hit) drawStar(ctx, st, s.animT); });
      drawBoxes(ctx);
      drawCar(ctx);
    }
    drawParts(ctx);
    drawFlash(ctx);
    drawResultMsg(ctx);
    drawScanlines(ctx);
    if (s.phase === 'start') drawStartScreen(ctx);
    if (s.phase === 'gameover') drawEndScreen(ctx, 'TRY AGAIN', '#ff5252', s.correctCount + ' / ' + QUESTIONS.length + ' — NEED ' + PASS_THRESHOLD + ' TO PASS');
    if (s.phase === 'win') drawEndScreen(ctx, 'YOU PASS!!', '#facc15', s.correctCount + ' / ' + QUESTIONS.length + ' CORRECT');
  };

  /* ── effects ─────────────────────────────────────── */
  // Game loop
  useEffect(() => {
    let raf;
    const loop = (ts) => {
      update(ts);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Popup countdown
  useEffect(() => {
    const s = stateRef.current;
    if (s.phase !== 'popup') return;
    const id = setInterval(() => {
      s.popupSecs -= 1;
      re();
      if (s.popupSecs <= 0) { clearInterval(id); dismissPopup(); }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRef.current.phase, stateRef.current.qIdx]);

  // Keyboard
  useEffect(() => {
    const onDown = (e) => {
      const s = stateRef.current;
      s.keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (s.phase === 'start') { initGame(); showPopup(0); }
        else if (s.phase === 'popup') dismissPopup();
        else if (s.phase === 'gameover') { initGame(); showPopup(0); }
        else if (s.phase === 'win') { onComplete && onComplete(20); }
      }
    };
    const onUp = (e) => { stateRef.current.keys[e.key] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── render ──────────────────────────────────────── */
  const s = stateRef.current;
  const livesIcons = ['♥', '♥', '♥'].map((c, i) => (i < s.lives ? c : '♡')).join(' ');
  const timerSecs = s.popupSecs;
  const timerCls = timerSecs <= 3 ? 'low' : timerSecs <= 6 ? 'mid' : '';

  return (
    <div
      className="fixed inset-0 z-[800] flex flex-col items-center justify-center p-4 gap-4 overflow-auto"
      style={{
        background: '#1A1410',  /* walnut */
        fontFamily: '"Press Start 2P", monospace',
        backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,168,43,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 100%, rgba(230,51,41,0.08) 0%, transparent 60%)',
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-[20] px-3 py-1 bg-black/70 border-2 border-eb-faded-green text-eb-gold hover:bg-eb-oak text-[10px] font-bold rounded"
        style={{ fontFamily: '"Press Start 2P", monospace' }}
      >
        ✕ QUIT
      </button>

      <div className="relative" style={{ imageRendering: 'pixelated' }}>
        <div
          style={{
            border: '4px solid #D4A82B',  /* mustard frame */
            boxShadow: '0 0 0 4px #000, 0 0 0 8px #3D5C47, 8px 8px 0 8px #000',
          }}
        >
          {/* HUD */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: W,
              background: '#231C16', /* oak */
              borderBottom: '4px solid #000',
              padding: '8px 16px',
              position: 'relative',
            }}
          >
            <div style={hudItem('#E63329')}>HP {livesIcons}</div>
            <div style={{ ...hudItem('#FFFFFF'), fontSize: 7 }}>Q {s.qIdx}/{QUESTIONS.length}</div>
            <div style={hudItem('#D4A82B')}>PTS {s.score}</div>
          </div>
          {/* Star power indicator */}
          {s.starPower > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                border: '2px solid #D4A82B',
                padding: '3px 10px',
                fontSize: 7,
                color: '#D4A82B',
                zIndex: 5,
                letterSpacing: '.1em',
              }}
            >
              ★ STAR POWER {Math.ceil(s.starPower / 1000)}s
            </div>
          )}
          {/* Banner */}
          <div
            style={{
              width: W,
              background: '#231C16', /* oak */
              borderBottom: '4px solid #000',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 40,
              opacity: s.bannerText ? 1 : 0,
              transition: 'opacity .2s',
            }}
          >
            <span style={{ flexShrink: 0, fontSize: 6, color: '#D4A82B', border: '2px solid #D4A82B', padding: '3px 6px', background: 'rgba(212,168,43,0.10)', whiteSpace: 'nowrap' }}>
              Q{s.bannerNum}/{QUESTIONS.length}
            </span>
            <span style={{ fontSize: 7, color: '#FFFFFF', lineHeight: 1.6, flex: 1 }}>{s.bannerText || '—'}</span>
            <span style={{ flexShrink: 0, width: 8, height: 8, background: '#4ade80', animation: 'eb-blink .8s steps(1) infinite' }} />
          </div>
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ display: 'block', imageRendering: 'pixelated', maxWidth: '100%', height: 'auto' }}
          />
          {/* Popup overlay */}
          {s.phase === 'popup' && (
            <div
              onClick={dismissPopup}
              style={{
                position: 'absolute',
                top: 88,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,.88)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                cursor: 'pointer',
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#231C16', /* oak */
                  border: '4px solid #D4A82B',
                  boxShadow: '6px 6px 0 #000, 0 0 0 4px #000, inset 0 0 0 2px #3D5C47',
                  width: 580,
                  maxWidth: '96%',
                  padding: '20px 22px 16px',
                }}
              >
                <div style={{ fontSize: 7, color: '#D4A82B', letterSpacing: '.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#3D5C47', border: '2px solid #D4A82B', padding: '3px 8px', color: '#FFFFFF' }}>MISSION</span>
                  QUESTION {s.qIdx + 1}/{QUESTIONS.length}
                  <span style={{ flex: 1, height: 2, background: 'repeating-linear-gradient(90deg,#3D5C47 0,#3D5C47 4px,transparent 4px,transparent 8px)' }} />
                </div>
                <div style={{ fontSize: 10, lineHeight: 1.9, color: '#FFFFFF', marginBottom: 16 }}>
                  {QUESTIONS[s.qIdx].q}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  {s.pendingBoxes.map((ans, i) => (
                    <div key={i} style={paStyle()}>
                      <span style={paLbl(i)}>{LABELS[i]}</span>
                      <span style={{ flex: 1 }}>{ans.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, color: timerCls === 'low' ? '#E63329' : '#D4A82B', minWidth: 28, textAlign: 'center', animation: timerCls === 'low' ? 'eb-blink .3s steps(1) infinite' : 'none' }}>
                    {timerSecs}
                  </span>
                  <div style={{ flex: 1, height: 12, background: '#000', border: '2px solid #3D5C47', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        background:
                          timerCls === 'low'
                            ? 'repeating-linear-gradient(90deg,#E63329 0,#E63329 8px,#b81f17 8px,#b81f17 16px)'
                            : timerCls === 'mid'
                            ? 'repeating-linear-gradient(90deg,#D4A82B 0,#D4A82B 8px,#A8841D 8px,#A8841D 16px)'
                            : 'repeating-linear-gradient(90deg,#3D5C47 0,#3D5C47 8px,#1F3A2A 8px,#1F3A2A 16px)',
                        transformOrigin: 'left center',
                        transition: 'transform .08s steps(10)',
                        transform: `scaleX(${timerSecs / 10})`,
                      }}
                    />
                  </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: 6, color: '#D4A82B', marginTop: 8 }}>
                  [ ENTER / SPACE / TAP ] TO START RACING
                </p>
              </div>
            </div>
          )}
          {/* Win / Game-over review overlay (replaces tiny canvas end screen) */}
          {(s.phase === 'win' || s.phase === 'gameover') && (
            <ReviewOverlay
              phase={s.phase}
              correctCount={s.correctCount}
              answers={s.answers || []}
              onPlayAgain={() => { initGame(); showPopup(0); }}
              onContinue={() => onComplete && onComplete(20)}
            />
          )}
        </div>
      </div>

      <div style={{ marginTop: 4, fontSize: 7, color: 'rgba(212,168,43,.7)', textAlign: 'center', letterSpacing: '.1em' }}>
        <span style={{ color: '#D4A82B' }}>ARROW KEYS</span> or <span style={{ color: '#D4A82B' }}>WASD</span> TO STEER
      </div>

      <style>{`
        @keyframes eb-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

function hudItem(color) {
  return {
    fontSize: 9,
    letterSpacing: '.05em',
    padding: '4px 8px',
    border: `2px solid ${color}`,
    color,
    background: `${color}1a`,
    fontFamily: '"Press Start 2P", monospace',
  };
}

function paStyle() {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    background: '#5C1A14',          /* deep brick red */
    border: '2px solid #8B2A20',    /* slightly brighter red outline */
    padding: '8px 10px',
    fontSize: 7,
    lineHeight: 1.7,
    color: '#FFFFFF',
  };
}

/**
 * Result overlay shown after the player finishes all 6 questions.
 * Shows pass/fail header, the score, a per-question review (your answer vs
 * the correct one), then either CONTINUE (pass) or TRY AGAIN (fail).
 */
function ReviewOverlay({ phase, correctCount, answers, onPlayAgain, onContinue }) {
  const passed = phase === 'win';
  const total = answers.length || 6;
  const headerColor = passed ? '#3D5C47' : '#E63329';
  const headerText  = passed
    ? (correctCount === total ? 'YOU GOT ALL RIGHT!' : 'YOU PASSED!')
    : 'TRY AGAIN';
  const subText = passed
    ? 'Great driving — here’s how you scored.'
    : 'You need 4 / 6 to pass. Review the answers below and give it another go.';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 25,
        padding: 12,
      }}
    >
      <div
        style={{
          width: 620,
          maxWidth: '96%',
          maxHeight: '92%',
          overflow: 'auto',
          background: '#231C16',                /* oak */
          border: `4px solid ${headerColor}`,
          boxShadow: '6px 6px 0 #000, 0 0 0 4px #000, inset 0 0 0 2px #3D5C47',
          padding: '20px 22px',
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, color: headerColor, letterSpacing: '.08em', marginBottom: 6 }}>
            {headerText}
          </div>
          <div style={{ fontSize: 22, color: '#D4A82B' }}>
            {correctCount} / {total} CORRECT
          </div>
          <div style={{ fontSize: 7, color: '#FFFFFF', marginTop: 8, lineHeight: 1.6 }}>
            {subText}
          </div>
        </div>

        {/* Per-question review */}
        <div style={{ fontSize: 7, color: '#D4A82B', letterSpacing: '.1em', margin: '4px 0 8px' }}>
          ▸ ANSWER REVIEW
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {answers.length === 0 && (
            <div style={{ fontSize: 7, color: '#FFFFFF', opacity: 0.7 }}>
              No answers recorded.
            </div>
          )}
          {answers.map((a, i) => {
            const ok = a.isCorrect;
            const accent = ok ? '#3D5C47' : '#E63329';
            return (
              <div
                key={i}
                style={{
                  background: '#1A1410',
                  border: `2px solid ${accent}`,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 7, color: accent, minWidth: 28 }}>
                    Q{i + 1} {ok ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: 7, color: '#FFFFFF', lineHeight: 1.7, flex: 1 }}>
                    {a.q}
                  </span>
                </div>
                <div style={{ fontSize: 7, color: '#D4A82B', paddingLeft: 36, lineHeight: 1.7 }}>
                  YOUR ANSWER: <span style={{ color: ok ? '#FFFFFF' : '#E63329' }}>{a.picked ?? '— none —'}</span>
                </div>
                {!ok && (
                  <div style={{ fontSize: 7, color: '#3D5C47', paddingLeft: 36, lineHeight: 1.7 }}>
                    CORRECT: <span style={{ color: '#FFFFFF' }}>{a.correct}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {!passed && (
            <button
              onClick={onPlayAgain}
              style={{
                background: '#E63329',
                color: '#FFFFFF',
                border: '4px solid #b81f17',
                padding: '10px 22px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9,
                cursor: 'pointer',
                boxShadow: '4px 4px 0 #000',
              }}
            >
              🔄 PLAY AGAIN
            </button>
          )}
          {passed && (
            <button
              onClick={onContinue}
              style={{
                background: '#D4A82B',
                color: '#1A1410',
                border: '4px solid #A8841D',
                padding: '10px 22px',
                fontFamily: '"Press Start 2P", monospace',
                fontSize: 9,
                cursor: 'pointer',
                boxShadow: '4px 4px 0 #000',
              }}
            >
              ▶ CONTINUE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function paLbl(i) {
  // A/B/C/D label squares — no purple, D matches the deep-red box theme.
  const colors = ['#b91c1c', '#1d4ed8', '#c2410c', '#5C1A14'];
  return {
    flexShrink: 0,
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 8,
    fontWeight: 700,
    marginTop: 1,
    background: colors[i],
    color: '#fff',
  };
}
