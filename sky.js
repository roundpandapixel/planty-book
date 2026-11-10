// The background: the owner's cherry tree (art/tree_cutout.png, 70x51 real pixels)
// on a sky that fills the screen, with drifting clouds and falling petals.
// Everything is drawn at the art's own pixel size and scaled up crisp.
const Sky = (() => {
  const SKY = "#accdee", GRASS = "#7e9b68", CLOUD = "#ffffff";
  const PETALS = ["#ffb2d6", "#ffd0e6"];
  const ART_W = 70, ART_H = 51, GRASS_ROWS = 3;
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  const tree = new Image();
  tree.src = "art/tree_cutout.png";

  let W = ART_W, H = ART_H, artY = 0, clouds = [], petals = [];
  let last = 0, timer = null;

  function seeded(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  }

  function motionOn() {
    let pref = null;
    try { pref = localStorage.getItem("pb.motion"); } catch (e) {}
    if (pref) return pref === "on";
    return !matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

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

    const rnd = seeded(7);
    clouds = [];
    const skyBottom = artY + 26;                 // just under the top of the tree
    const n = Math.max(4, Math.round(skyBottom / 9));
    for (let i = 0; i < n; i++) {
      const y = 4 + Math.floor((i + rnd() * 0.6) * (skyBottom - 4) / n);
      clouds.push(makeCloud(rnd, Math.floor(rnd() * (W + 20)) - 10, y));
    }
    petals = Array.from({ length: Math.round(W / 6) }, () => newPetal(true));
  }

  function newPetal(anywhere) {
    const p = {
      x: 4 + Math.random() * 40,
      y: artY + 24 + Math.random() * 16,
      vx: 1.2 + Math.random() * 2.2,
      vy: 0.8 + Math.random() * 1.4,
      phase: Math.random() * 6.28,
      color: PETALS[Math.random() < 0.5 ? 0 : 1],
      big: Math.random() < 0.3,
    };
    if (anywhere) { p.x += Math.random() * W * 0.8; p.y += Math.random() * 12; }
    return p;
  }

  function draw(t) {
    ctx.fillStyle = SKY;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = CLOUD;
    for (const c of clouds)
      for (const b of c.bars) ctx.fillRect(Math.floor(c.x) + b.dx, c.y + b.dy, b.w, b.h);
    ctx.fillStyle = GRASS;
    ctx.fillRect(0, H - GRASS_ROWS, W, GRASS_ROWS);
    if (tree.complete && tree.naturalWidth) ctx.drawImage(tree, 0, artY);
    for (const p of petals) {
      const x = Math.floor(p.x + Math.sin(t / 900 + p.phase) * 1.5), y = Math.floor(p.y);
      ctx.fillStyle = p.color;
      ctx.fillRect(x, y, 1, 1);
      if (p.big) { ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1); }
    }
  }

  function step(dt) {
    for (const c of clouds) {
      c.x += c.speed * dt;
      if (c.x > W + 2) c.x = -c.w - 4;
    }
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= H - GRASS_ROWS || p.x > W + 2) petals[i] = newPetal(false);
    }
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
    if (!motionOn() || document.hidden) { petals = []; draw(0); return; }
    last = performance.now();
    timer = setInterval(tick, 1000 / 12);       // pixel art needs no more; saves battery
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  function refresh() { layout(); start(); }

  tree.onload = () => draw(performance.now());
  addEventListener("resize", refresh);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  refresh();

  return {
    motionOn,
    setMotion(on) { try { localStorage.setItem("pb.motion", on ? "on" : "off"); } catch (e) {} refresh(); },
  };
})();
