// Light meter: estimates the light where the phone is, from the camera's own exposure.
// The camera picks a shutter time and ISO for the scene; with the lens's f-number they give
// the scene's brightness (EV), corrected by how bright the picture actually came out.
// lux ~= 2.5 * 2^EV100 (incident-light rule of thumb); 1 foot-candle = 10.764 lux.
const Meter = (() => {
  const F_NUMBER = 1.8;                 // typical phone main camera
  const LIN = Array.from({ length: 256 }, (_, i) => {
    const c = i / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  // Upper limits in foot-candles
  const KINDS = [[50, "Too dark for most plants"], [250, "Low light"], [1000, "Medium light"],
                 [4000, "Bright, indirect light"], [Infinity, "Direct sun"]];
  const SHORT = ["dark", "low", "medium", "bright indirect", "direct sun"];
  const $ = id => document.getElementById(id);
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 48;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let stream = null, timer = null, smooth = null, started = 0, onSave = null;

  function kindOf(fc) { return KINDS.findIndex(k => fc < k[0]); }
  const pos = fc => Math.min(1, Math.max(0, (Math.log10(Math.max(fc, 10)) - 1) / 3));   // 10..10,000 fc

  function fmt(n) {
    if (n < 100) return String(Math.round(n / 5) * 5);
    const p = 10 ** (Math.floor(Math.log10(n)) - 1);
    return (Math.round(n / p) * p).toLocaleString("en-US");
  }

  function show(msg, help) {
    $("meter-read").textContent = "--";
    $("meter-kind").textContent = msg;
    if (help) $("meter-help").textContent = help;
    $("meter-dot").hidden = true;
    $("meter-save").disabled = true;
  }

  function sample() {
    const video = $("meter-video");
    if (!stream || video.readyState < 2) return;
    const s = stream.getVideoTracks()[0].getSettings();
    const t = s.exposureTime, iso = s.iso;      // exposureTime is in 100-microsecond units
    if (!t || !iso) {
      if (performance.now() - started > 2500)
        show("This phone's camera doesn't share its exposure, so it can't measure light.",
             "Most Android phones work in Chrome. Try again after an update, or on another phone.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * LIN[d[i]] + 0.7152 * LIN[d[i + 1]] + 0.0722 * LIN[d[i + 2]];
    const mean = Math.max(sum / (d.length / 4), 1e-4);
    const ev = Math.log2(F_NUMBER * F_NUMBER / (t / 10000)) - Math.log2(iso / 100) + Math.log2(mean / 0.18);
    smooth = smooth === null ? ev : smooth * 0.7 + ev * 0.3;
    const lux = 2.5 * 2 ** smooth, fc = lux / 10.764;
    const k = kindOf(fc);
    $("meter-read").innerHTML = `${fmt(fc)} <small>foot-candles</small><br><small>about ${fmt(lux)} lux</small>`;
    $("meter-kind").textContent = KINDS[k][1];
    $("meter-dot").hidden = false;
    $("meter-dot").style.left = `${pos(fc) * 100}%`;
    $("meter-save").disabled = false;
    $("meter-save").onclick = () => { const cb = onSave; close(); cb && cb(fc, SHORT[k]); };
  }

  async function open(want, saveCb) {
    onSave = saveCb;
    smooth = null;
    $("meter-want").textContent = want || "";
    $("meter-help").textContent = "Hold your phone where the plant sits, camera facing the window. It's an estimate: good for comparing spots.";
    show("Starting the camera");
    $("meter").hidden = false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      show("The camera isn't available here.", "The light meter works once the app is opened from its web link (https) on the phone.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
    } catch (e) {
      show("Couldn't open the camera.", "Allow camera access for Planty Book in the phone's settings, then try again.");
      return;
    }
    if ($("meter").hidden) { stop(); return; }       // closed while asking for permission
    const video = $("meter-video");
    video.srcObject = stream;
    video.play().catch(() => {});
    started = performance.now();
    timer = setInterval(sample, 250);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    $("meter-video").srcObject = null;
  }
  function close() { stop(); $("meter").hidden = true; }

  $("meter-close").onclick = close;
  return { open, close };
})();
