// The background: the owner's cherry tree (art/tree_cutout.png, 70x51 real pixels) on a sky that
// fills the screen, with drifting clouds, falling petals, and a day that follows the device's clock:
// sunrise and sunset glow, a sun and a moon (with today's phase) crossing the sky, stars at night.
// Four themes (sky blue, pink, lavender, galaxy) change the colours; galaxy adds a Milky Way and shooting stars.
// Everything is drawn at the art's own pixel size and scaled up crisp.
const Sky = (() => {
  const ART_W = 70, ART_H = 51, GRASS_ROWS = 3;
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const tree = new Image();
  tree.src = "art/tree_cutout.png";

  // ---------- themes ----------
  // night / day: sky colours at the top and at the horizon. glow: the warm colours of sunrise and sunset.
  // tree: what the owner's drawing's colours become (blossom, light blossom, branch, shadow, grass).
  // nightTint / nightK: how far trees, grass and clouds sink toward the night colour when it's dark.
  const THEMES = {
    sky: {
      name: "Sky blue",
      night: { top: [22, 34, 82], hor: [62, 84, 140] },
      day: { top: [160, 198, 236], hor: [180, 212, 240] },
      glow: { top: [250, 168, 160], hor: [255, 196, 140] },
      cloud: { day: [255, 255, 255], night: [118, 134, 182], glow: [255, 206, 190] },
      tree: { mid: [255, 178, 214], light: [255, 208, 230], branch: [188, 150, 120], gray: [224, 199, 211], grass: [126, 155, 104] },
      nightTint: [22, 30, 66], nightK: 0.62,
      petals: ["#ffb2d6", "#ffd0e6"],
      stars: 0.016, starFloor: 0, starColors: ["#ffffff", "#fff3c4", "#cfe0ff"],
      ui: { panel: [151, 167, 141], solid: [154, 169, 143], btn: [140, 158, 140], alpha: 0.77, accent: "#6f8268", dim: 0.3 },
    },
    pink: {
      name: "Pink",
      night: { top: [48, 24, 70], hor: [128, 64, 116] },
      day: { top: [248, 205, 224], hor: [255, 232, 242] },
      glow: { top: [255, 150, 170], hor: [255, 190, 140] },
      cloud: { day: [255, 250, 253], night: [150, 108, 160], glow: [255, 206, 196] },
      tree: { mid: [238, 128, 176], light: [255, 184, 214], branch: [150, 100, 92], gray: [216, 140, 172], grass: [138, 166, 112] },
      nightTint: [48, 26, 70], nightK: 0.6,
      petals: ["#ff9cc6", "#ffc4dd"],
      stars: 0.014, starFloor: 0, starColors: ["#ffffff", "#ffe3f0", "#fff3c4"],
      ui: { panel: [184, 118, 146], solid: [188, 124, 150], btn: [172, 108, 136], alpha: 0.8, accent: "#9a4c70", dim: 0.3 },
    },
    lavender: {
      name: "Lavender",
      night: { top: [30, 26, 76], hor: [84, 70, 144] },
      day: { top: [204, 190, 240], hor: [232, 222, 250] },
      glow: { top: [255, 160, 190], hor: [255, 198, 160] },
      cloud: { day: [255, 252, 255], night: [136, 122, 184], glow: [255, 208, 200] },
      tree: { mid: [152, 112, 222], light: [204, 176, 248], branch: [132, 100, 116], gray: [182, 156, 220], grass: [116, 150, 116] },
      nightTint: [34, 28, 80], nightK: 0.6,
      petals: ["#c9aef2", "#e6d8fb"],
      stars: 0.016, starFloor: 0, starColors: ["#ffffff", "#efe3ff", "#fff3c4"],
      ui: { panel: [122, 108, 166], solid: [128, 114, 172], btn: [112, 98, 156], alpha: 0.8, accent: "#5f4f96", dim: 0.28 },
    },
    galaxy: {
      name: "Galaxy",
      night: { top: [6, 4, 24], hor: [44, 24, 92] },
      day: { top: [84, 62, 150], hor: [186, 118, 190] },
      glow: { top: [255, 130, 170], hor: [255, 172, 120] },
      cloud: { day: [228, 204, 250], night: [66, 54, 118], glow: [255, 180, 200] },
      tree: { mid: [150, 108, 226], light: [212, 176, 255], branch: [96, 70, 104], gray: [182, 152, 232], grass: [64, 88, 104] },
      nightTint: [14, 10, 44], nightK: 0.14,
      petals: ["#d9b8ff", "#ffc4ee"],
      stars: 0.03, starFloor: 0.18, starColors: ["#ffffff", "#ffe9c8", "#c8d8ff", "#ffc8ec"],
      milky: true, shoot: true, clouds: 0.6,
      ui: { panel: [30, 22, 62], solid: [36, 28, 72], btn: [58, 46, 104], alpha: 0.74, accent: "#2a2050", dim: 0 },
    },
  };
  const ORDER = ["sky", "pink", "lavender", "galaxy"];
  const SRC = { mid: [255, 178, 214], light: [255, 208, 230], branch: [188, 150, 120], gray: [224, 199, 211], grass: [126, 155, 104] };

  // ---------- small helpers ----------
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = c => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  function seeded(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} },
  };

  function motionOn() {
    const pref = store.get("pb.motion");
    if (pref) return pref === "on";
    return !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ---------- the clock: sunrise, sunset, the moon ----------
  // Sunrise and sunset come from the date and where the device is. Without a location they are
  // estimated for the middle of the device's time zone at 40 degrees north; with one they are exact.
  let phaseOverride = null;
  let clockOverride = null;                      // minutes since midnight, for testing and previews
  const q = new URLSearchParams(location.search);
  if (/^\d{1,2}:\d{2}$/.test(q.get("clock") || "")) { const [h, m] = q.get("clock").split(":"); clockOverride = +h * 60 + +m; }

  function readLoc() {
    try { const o = JSON.parse(store.get("pb.loc")); if (o && isFinite(o.lat) && isFinite(o.lon)) return o; } catch (e) {}
    return null;
  }
  function sunTimes(d) {
    const loc = readLoc();
    const std = Math.max(new Date(d.getFullYear(), 0, 1).getTimezoneOffset(), new Date(d.getFullYear(), 6, 1).getTimezoneOffset());
    const lat = loc ? loc.lat : 40, lon = loc ? loc.lon : -std / 4;
    const N = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5), rad = Math.PI / 180;
    const decl = 23.44 * rad * Math.sin(2 * Math.PI * (284 + N) / 365);
    const B = 2 * Math.PI * (N - 81) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const cosw = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
    const w = Math.acos(Math.min(1, Math.max(-1, cosw))) / rad;
    const noon = 720 - 4 * lon - eot - d.getTimezoneOffset();     // local clock minutes
    let rise = noon - 4 * w, set = noon + 4 * w;
    if (!isFinite(rise) || !isFinite(set) || set - rise < 120) { rise = 360; set = 1080; }
    return { rise, set, exact: !!loc };
  }
  // 0 = new moon ... 0.5 = full, from the average lunar month
  function moonPhase(d) {
    const days = (d.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5;
    return ((days / 29.530588853) % 1 + 1) % 1;
  }

  function state() {
    const d = new Date();
    const m = clockOverride !== null ? clockOverride : d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
    const t = sunTimes(d);
    const light = Math.min(smooth(t.rise - 45, t.rise + 30, m), 1 - smooth(t.set - 30, t.set + 45, m));
    const g = x => Math.exp(-(((m - x) / 28) ** 2));
    const nightLen = 1440 - t.set + t.rise;
    return {
      m, rise: t.rise, set: t.set, exact: t.exact, light, glow: Math.max(g(t.rise), g(t.set)),
      sunP: (m - t.rise) / (t.set - t.rise),
      moonP: (m >= t.set ? m - t.set : m + 1440 - t.set) / nightLen,
      phase: phaseOverride !== null ? phaseOverride : moonPhase(d),
    };
  }

  // ---------- layout and the things in the sky ----------
  let theme = (q.get("theme") in THEMES) ? q.get("theme") : (store.get("pb.theme") in THEMES ? store.get("pb.theme") : "sky");
  let W = ART_W, H = ART_H, artY = 0, clouds = [], petals = [], stars = [], shooters = [];
  let last = 0, timer = null, slowTimer = null, nextShoot = 1.2;
  const bg = document.createElement("canvas"), milky = document.createElement("canvas");
  const treeCanvas = document.createElement("canvas");
  treeCanvas.width = ART_W; treeCanvas.height = ART_H;
  let bgKey = "", treeKey = "", milkyKey = "", uiKey = "", classes = null, grassColor = [126, 155, 104];

  // A chunky cloud: a long flat base with a step or two on top, like the mockup's.
  function makeCloud(rnd, x, y) {
    const w = 14 + Math.floor(rnd() * 18);
    const bars = [{ dx: 0, dy: 0, w, h: 2 }];
    const top = Math.floor(w * (0.35 + rnd() * 0.3));
    const tx = Math.floor(rnd() * (w - top));
    bars.push({ dx: tx, dy: -2, w: top, h: 2 });
    if (rnd() < 0.5) bars.push({ dx: tx + 2, dy: -3, w: Math.max(3, top - 5), h: 1 });
    if (rnd() < 0.6) bars.push({ dx: Math.floor(rnd() * 4) - 2, dy: 2, w: w - 3, h: 1 });
    return { x, y, w, bars, speed: 0.35 + rnd() * 0.5 };
  }

  function layout() {
    const aspect = innerWidth / innerHeight;
    if (aspect < ART_W / ART_H) { W = ART_W; H = Math.ceil(ART_W / aspect); }
    else { H = ART_H + 6; W = Math.ceil(H * aspect); }
    artY = H - ART_H;
    canvas.width = W; canvas.height = H;
    bg.width = W; bg.height = H; milky.width = W; milky.height = H;
    bgKey = milkyKey = "";

    const th = THEMES[theme], rnd = seeded(7);
    clouds = [];
    const skyBottom = artY + 26;                 // just under the top of the tree
    const n = Math.max(3, Math.round(skyBottom / 9 * (th.clouds || 1)));
    for (let i = 0; i < n; i++) {
      const y = 4 + Math.floor((i + rnd() * 0.6) * (skyBottom - 4) / n);
      clouds.push(makeCloud(rnd, Math.floor(rnd() * (W + 20)) - 10, y));
    }
    petals = Array.from({ length: Math.round(W / 6) }, () => newPetal(true));
    makeStars();
  }

  function makeStars() {
    const th = THEMES[theme], rnd = seeded(31);
    const n = Math.round(W * H * th.stars);
    stars = [];
    for (let i = 0; i < n; i++)
      stars.push({
        x: Math.floor(rnd() * W), y: Math.floor(rnd() * (H - GRASS_ROWS - 3)),
        c: th.starColors[Math.floor(rnd() * th.starColors.length)],
        tw: rnd() < 0.4, sp: 0.6 + rnd() * 1.6, ph: rnd() * 6.28, big: rnd() < 0.06,
      });
  }

  function newPetal(anywhere) {
    const p = {
      x: 4 + Math.random() * 40,
      y: artY + 24 + Math.random() * 16,
      vx: 1.2 + Math.random() * 2.2,
      vy: 0.8 + Math.random() * 1.4,
      phase: Math.random() * 6.28,
      color: Math.random() < 0.5 ? 0 : 1,
      big: Math.random() < 0.3,
    };
    if (anywhere) { p.x += Math.random() * W * 0.8; p.y += Math.random() * 12; }
    return p;
  }

  // ---------- painting the sky ----------
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);

  // The sky: a gradient from the top to the horizon, in dithered bands like pixel art.
  function paintBackground(th, st) {
    const top = mix(mix(th.night.top, th.day.top, st.light), th.glow.top, st.glow * 0.35);
    const hor = mix(mix(th.night.hor, th.day.hor, st.light), th.glow.hor, st.glow * 0.9);
    const BANDS = 14, skyH = H - GRASS_ROWS;
    const cols = Array.from({ length: BANDS + 1 }, (_, k) => mix(top, hor, Math.pow(k / BANDS, 1.4)));
    const g = bg.getContext("2d"), img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const v = Math.min(y / skyH, 1) * BANDS, i = Math.floor(v), f = v - i;
      for (let x = 0; x < W; x++) {
        const c = cols[Math.min(BANDS, f > BAYER[(y & 3) * 4 + (x & 3)] ? i + 1 : i)], o = (y * W + x) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return { top, hor };
  }

  // The Milky Way: a slanted band of violet haze with a dark dust lane through it and sparse stars. Made once.
  function paintMilky() {
    const g = milky.getContext("2d");
    g.clearRect(0, 0, W, H);
    const rnd = seeded(99), skyH = H - GRASS_ROWS;
    const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vnoise = (x, y, sc) => {
      const gx = x / sc, gy = y / sc, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
      const top = a + (b - a) * sx, bot = c + (d - c) * sx;
      return top + (bot - top) * sy;
    };
    const x0 = -0.1 * W, y0 = skyH * 0.92, x1 = 1.1 * W, y1 = skyH * 0.1;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), band = Math.max(9, skyH * 0.2);
    const dust = [[96, 92, 210], [150, 100, 216], [214, 150, 228], [255, 230, 246]];
    for (let y = 0; y < skyH; y++) for (let x = 0; x < W; x++) {
      const d = Math.abs((x - x0) * dy - (y - y0) * dx) / len;           // distance from the band's centre line
      const dens = Math.exp(-((d / band) ** 2));
      if (dens < 0.06) continue;
      const n = 0.6 * vnoise(x + 40, y, 9) + 0.4 * vnoise(x, y + 90, 4);
      if (d < band * 0.24 && vnoise(x + 7, y + 31, 13) > 0.6) continue;  // the dark dust lane
      g.fillStyle = `rgba(112,74,196,${(dens * 0.3 * (0.45 + n)).toFixed(3)})`;     // the haze
      g.fillRect(x, y, 1, 1);
      if (dens > 0.55) {                                                  // a warmer glow at the core
        g.fillStyle = `rgba(210,112,196,${((dens - 0.55) * 0.55 * n).toFixed(3)})`;
        g.fillRect(x, y, 1, 1);
      }
      if (rnd() < dens * dens * 0.22 * (0.35 + n)) {                      // stars in the band
        g.fillStyle = css(dust[Math.min(3, Math.floor(dens * n * 4.2 + rnd() * 0.9))]);
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  function circle(cx, cy, r) {
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy + 0.5));
      ctx.fillRect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  }

  // The moon as it really is tonight: lit side and how much of it.
  function moonSprite(phase) {
    const R = 4, S = 2 * R + 1, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d"), cos = Math.cos(2 * Math.PI * phase);
    for (let y = -R; y <= R; y++) {
      const w = Math.sqrt(R * R - y * y + 0.5);
      for (let x = -R; x <= R; x++) {
        if (Math.abs(x) > w) continue;
        const lit = phase < 0.5 ? x >= w * cos : x <= -w * cos;
        g.fillStyle = lit ? "rgb(244,240,218)" : "rgba(244,240,218,0.1)";
        g.fillRect(x + R, y + R, 1, 1);
      }
    }
    return c;
  }
  let moonImg = null, moonKey = -1;

  function shade(c, th, st) {
    let o = mix(c, th.nightTint, (1 - st.light) * th.nightK);
    return mix(o, th.glow.hor, st.glow * 0.16);
  }

  // The owner's tree, recoloured for the theme and the light of the moment.
  function paintTree(th, st) {
    if (!classes) return;
    const key = `${theme}|${Math.round(st.light * 20)}|${Math.round(st.glow * 5)}`;
    if (key === treeKey) return;
    treeKey = key;
    const cols = [null, th.tree.mid, th.tree.light, th.tree.branch, th.tree.gray, th.tree.grass].map(c => c && shade(c, th, st));
    grassColor = cols[5];
    const g = treeCanvas.getContext("2d"), img = g.createImageData(ART_W, ART_H);
    for (let i = 0; i < classes.length; i++) {
      const c = cols[classes[i]];
      if (!c) continue;
      img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }

  // The page's panels and buttons follow the theme (and dim a little at night).
  function applyUI(th, st, top, hor) {
    const key = `${theme}|${Math.round(st.light * 20)}`;
    if (key === uiKey) return;
    uiKey = key;
    const night = 1 - st.light, dark = [16, 22, 38], u = th.ui, dim = night * u.dim;
    const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
    const s = document.documentElement.style;
    s.setProperty("--panel", rgba(mix(u.panel, dark, dim), u.alpha));
    s.setProperty("--panel-solid", css(mix(u.solid, dark, dim)));
    s.setProperty("--btn", rgba(mix(u.btn, dark, dim), 0.85));
    s.setProperty("--btn-on", rgba(mix(u.btn, dark, 0.25 + dim), 0.92));
    s.setProperty("--accent", u.accent);
    s.setProperty("--sky", css(hor));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", css(top));
  }

  function draw(t) {
    const th = THEMES[theme], st = state();
    const key = `${theme}|${W}x${H}|${Math.floor(st.m * 2)}`;       // the sky is repainted every half minute
    let colors = null;
    if (key !== bgKey) { bgKey = key; colors = paintBackground(th, st); uiKey = ""; }
    paintTree(th, st);
    if (colors) applyUI(th, st, colors.top, colors.hor);
    else if (uiKey === "") applyUI(th, st, mix(th.night.top, th.day.top, st.light), mix(th.night.hor, th.day.hor, st.light));
    ctx.drawImage(bg, 0, 0);

    const dark = 1 - st.light, starA = th.starFloor + (1 - th.starFloor) * dark;
    if (th.milky) {
      if (milkyKey !== theme + W + "x" + H) { paintMilky(); milkyKey = theme + W + "x" + H; }
      ctx.globalAlpha = 0.03 + 0.97 * dark ** 1.6;
      ctx.drawImage(milky, 0, 0);
    }
    for (const s of stars) {
      const a = starA * (s.tw && motionOn() ? 0.55 + 0.45 * Math.sin(t / 700 * s.sp + s.ph) : 1);
      if (a < 0.04) continue;
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = s.c;
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.big && a > 0.5) { ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1); ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1); }
    }
    ctx.globalAlpha = 1;

    // sun and moon, rising and setting behind the horizon
    const horizon = H - GRASS_ROWS - 1, arc = Math.min(H * 0.72, horizon - 8);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, horizon + 1); ctx.clip();
    if (st.sunP > -0.06 && st.sunP < 1.06) {
      const x = Math.round(W * (0.1 + 0.8 * st.sunP)), y = Math.round(horizon - Math.sin(Math.PI * st.sunP) * arc);
      const c = mix([255, 242, 186], [255, 150, 90], Math.min(1, st.glow * 0.9));
      ctx.fillStyle = css(c); ctx.globalAlpha = 0.2; circle(x, y, 7);
      ctx.globalAlpha = 1; circle(x, y, 4);
      ctx.fillStyle = css(mix(c, [255, 255, 255], 0.5)); circle(x, y, 2);
    }
    if (dark > 0.3) {
      const key2 = Math.round(st.phase * 30);
      if (key2 !== moonKey) { moonKey = key2; moonImg = moonSprite(st.phase); }
      const p = st.moonP, x = Math.round(W * (0.1 + 0.8 * p)), y = Math.round(horizon - Math.sin(Math.PI * Math.min(1, Math.max(0, p))) * arc * 0.85);
      ctx.globalAlpha = Math.min(1, (dark - 0.3) / 0.5);
      ctx.drawImage(moonImg, x - 4, y - 4);
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // clouds, warmed by sunrise and sunset and darkened by night
    const cloudCol = mix(mix(th.cloud.night, th.cloud.day, st.light), th.cloud.glow, Math.min(1, st.glow * 0.7));
    ctx.fillStyle = css(cloudCol);
    for (const c of clouds)
      for (const b of c.bars) ctx.fillRect(Math.floor(c.x) + b.dx, c.y + b.dy, b.w, b.h);

    // shooting stars: a bright head and a long fading tail
    for (const s of shooters) {
      const age = s.age / s.life, fade = Math.min(1, s.age / 0.1) * (1 - Math.max(0, age - 0.55) / 0.45);
      for (let k = 0; k < 17; k++) {
        const a = fade * Math.pow(1 - k / 17, 1.3);
        if (a < 0.05) break;
        ctx.globalAlpha = a;
        ctx.fillStyle = k < 2 ? "#ffffff" : k < 6 ? "#ffeefa" : k < 11 ? "#e0b8ff" : "#a88aff";
        const x = Math.floor(s.x - s.vx * k * 0.011), y = Math.floor(s.y - s.vy * k * 0.011);
        ctx.fillRect(x, y, k < 2 ? 2 : 1, k < 2 ? 2 : 1);
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = css(grassColor);
    ctx.fillRect(0, H - GRASS_ROWS, W, GRASS_ROWS);
    if (classes) ctx.drawImage(treeCanvas, 0, artY);
    for (const p of petals) {
      const x = Math.floor(p.x + Math.sin(t / 900 + p.phase) * 1.5), y = Math.floor(p.y);
      ctx.fillStyle = th.petals[p.color];
      ctx.fillRect(x, y, 1, 1);
      if (p.big) { ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1); }
    }
  }

  function spawnShooter() {
    const dir = Math.random() < 0.5 ? 1 : -1, ang = (22 + Math.random() * 14) * Math.PI / 180, sp = 95 + Math.random() * 30;
    shooters.push({ x: W * (0.15 + Math.random() * 0.7), y: Math.random() * H * 0.3, vx: dir * sp * Math.cos(ang), vy: sp * Math.sin(ang), age: 0, life: 0.55 + Math.random() * 0.25 });
  }

  function step(dt) {
    const th = THEMES[theme];
    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x > W + 2) c.x = -c.w - 4;
    }
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= H - GRASS_ROWS || p.x > W + 2) petals[i] = newPetal(false);
    }
    if (th.shoot && state().light < 0.5) {
      nextShoot -= dt;
      if (nextShoot <= 0) { nextShoot = 3 + Math.random() * 6; spawnShooter(); }
    }
    for (const s of shooters) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    shooters = shooters.filter(s => s.age < s.life);
  }

  function tick() {
    const now = performance.now();
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    step(dt);
    draw(now);
  }

  function start() {
    stop();
    if (document.hidden) return;
    if (!motionOn()) {                           // a still sky that still follows the clock
      petals = []; shooters = [];
      draw(0);
      slowTimer = setInterval(() => draw(0), 30000);
      return;
    }
    last = performance.now();
    timer = setInterval(tick, 1000 / 15);        // pixel art needs no more; saves battery
  }
  function stop() {
    if (timer) clearInterval(timer);
    if (slowTimer) clearInterval(slowTimer);
    timer = slowTimer = null;
  }

  function refresh() { layout(); start(); }

  // Read the tree's pixels once, sorting each into blossom / light / branch / shadow / grass,
  // so any theme can recolour them exactly.
  tree.onload = () => {
    const c = document.createElement("canvas");
    c.width = tree.naturalWidth; c.height = tree.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(tree, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const names = ["mid", "light", "branch", "gray", "grass"];
    classes = new Uint8Array(c.width * c.height);
    for (let i = 0; i < classes.length; i++) {
      if (d[i * 4 + 3] < 128) continue;
      let best = 0, bd = Infinity;
      names.forEach((n, k) => {
        const s = SRC[n], e = (d[i * 4] - s[0]) ** 2 + (d[i * 4 + 1] - s[1]) ** 2 + (d[i * 4 + 2] - s[2]) ** 2;
        if (e < bd) { bd = e; best = k + 1; }
      });
      classes[i] = best;
    }
    treeKey = "";
    draw(performance.now());
  };
  addEventListener("resize", refresh);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  refresh();

  return {
    motionOn,
    setMotion(on) { store.set("pb.motion", on ? "on" : "off"); refresh(); },
    themes: () => ORDER.map(key => ({ key, name: THEMES[key].name })),
    get theme() { return theme; },
    setTheme(key) {
      if (!(key in THEMES)) return;
      theme = key; store.set("pb.theme", key);
      bgKey = treeKey = milkyKey = uiKey = ""; shooters = []; nextShoot = 1.2;
      layout(); start();
    },
    times() { const s = state(); return { rise: s.rise, set: s.set, exact: s.exact }; },
    // Ask the device where it is, for exact sunrise and sunset. The place stays on this device.
    useLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error("This device can't share its location.")); return; }
        navigator.geolocation.getCurrentPosition(p => {
          store.set("pb.loc", JSON.stringify({ lat: p.coords.latitude, lon: p.coords.longitude }));
          bgKey = ""; resolve();
        }, () => reject(new Error("Couldn't get the location. Allow it for this site in the phone's settings.")), { maximumAge: 864e5, timeout: 15000 });
      });
    },
    clearLocation() { store.set("pb.loc", null); bgKey = ""; },
    // For previews and testing: show the sky at this clock time (minutes since midnight), or null for the real time.
    setMoonPhase(p) { phaseOverride = p; },
    shootNow() { spawnShooter(); },
    setClock(minutes) { clockOverride = minutes; bgKey = ""; if (!timer) draw(0); },
  };
})();
