// Sync: keeps every device's book in step through the private cloud copy (see cloud/).
//
// Local-first: the app always works from this device's own storage; sync runs in the background.
// Privacy: one random key per book is made on the first device. From it, the device derives
//   - a login token (the cloud only ever sees this, and files the book under its hash), and
//   - an encryption key that never leaves the device.
// Plants, rooms, notes and photos are encrypted (AES-GCM) before upload, so the cloud holds only
// scrambled data. The pairing link carries the key in its #fragment, which browsers never send anywhere.
// Conflicts: per plant/room, the newest edit wins.
const Sync = (() => {
  const LS = "pb.sync";
  const enc = new TextEncoder(), dec = new TextDecoder();
  let cfg = readCfg();                         // { url, key } once set up
  let keys = null;                             // { token, aes } derived from cfg.key
  let running = false, again = false, kickTimer = null;
  const st = { running: false, last: null, error: null, waiting: 0, fetching: 0 };
  const listeners = new Set();

  function readCfg() { try { return JSON.parse(localStorage.getItem(LS)) || null; } catch (e) { return null; } }
  function writeCfg(c) { try { if (c) localStorage.setItem(LS, JSON.stringify(c)); else localStorage.removeItem(LS); } catch (e) {} cfg = c; keys = null; }
  const emit = () => listeners.forEach(f => { try { f({ ...st }); } catch (e) {} });

  // ---------- bytes and crypto ----------
  const b64 = bytes => { let s = ""; const a = new Uint8Array(bytes); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const b64u = bytes => b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = s => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4));

  async function derive() {
    if (keys) return keys;
    const base = await crypto.subtle.importKey("raw", unb64u(cfg.key), "HKDF", false, ["deriveBits", "deriveKey"]);
    const p = info => ({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: enc.encode(info) });
    const token = b64u(await crypto.subtle.deriveBits(p("planty-login"), base, 256));
    const aes = await crypto.subtle.deriveKey(p("planty-encrypt"), base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    return (keys = { token, aes });
  }
  async function seal(bytes) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, (await derive()).aes, bytes));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv); out.set(ct, 12);
    return out;
  }
  async function open(bytes) {
    const a = new Uint8Array(bytes);
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: a.slice(0, 12) }, (await derive()).aes, a.slice(12)));
  }
  const sealJSON = async o => b64(await seal(enc.encode(JSON.stringify(o))));
  const openJSON = async s => JSON.parse(dec.decode(await open(unb64(s))));

  // ---------- talking to the cloud ----------
  class SyncError extends Error {}
  async function api(path, opts = {}) {
    let res;
    try {
      res = await fetch(cfg.url + path, { ...opts, headers: { Authorization: "Bearer " + (await derive()).token, ...(opts.headers || {}) } });
    } catch (e) { throw new SyncError("offline"); }
    if (res.status === 401) throw new SyncError("The key doesn't match this book.");
    if (res.status === 507) throw new SyncError("Cloud storage is full.");
    if (!res.ok && res.status !== 404) throw new SyncError(`Cloud error (${res.status}).`);
    return res;
  }
  const getJSON = async path => (await api(path)).json();
  const postJSON = async (path, body) => (await api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();

  // ---------- one round: send, receive, download ----------
  const clean = o => { const c = { ...o }; delete c.dirty; return c; };

  async function pushRecords() {
    const records = [];
    const sent = [];                           // what to un-dirty afterwards
    for (const [store, kind] of [["plants", "plant"], ["rooms", "room"]]) {
      const all = store === "plants" ? await Store.allPlants() : await Store.allRooms();
      for (const o of all) if (o.dirty) {
        records.push({ id: o.id, kind, u: o.u, deleted: 0, data: await sealJSON(clean(o)) });
        sent.push({ store, id: o.id, u: o.u });
      }
    }
    const tombs = await Store.tombs();
    for (const t of tombs) records.push({ id: t.id, kind: t.kind, u: t.u, deleted: 1, data: "" });
    for (let i = 0; i < records.length; i += 40) await postJSON("/api/push", { records: records.slice(i, i + 40) });
    for (const s of sent) await Store.updateRaw(s.store, s.id, o => { if (o.u === s.u) delete o.dirty; });
    for (const t of tombs) await Store.clearTomb(t.id, t.u);
  }

  async function pushPhotos() {
    for (const ph of await Store.dirtyPhotos()) {
      if (!ph.thumb && ph.blob) {
        ph.thumb = await Store.makeThumb(ph.blob);
        await Store.updateRaw("photos", ph.id, o => { o.thumb = ph.thumb; });
      }
      // The picture files go first, so no other device sees a photo that isn't there yet.
      for (const [variant, blob] of [["thumb", ph.thumb], ["orig", ph.blob]]) {
        if (!blob) continue;
        await api(`/api/blob/${ph.id}/${variant}`, { method: "PUT", body: await seal(new Uint8Array(await blob.arrayBuffer())) });
      }
      const meta = { id: ph.id, plantId: ph.plantId, type: ph.type || (ph.blob && ph.blob.type) || "image/jpeg", created: ph.created || Date.now() };
      await postJSON("/api/push", { records: [{ id: ph.id, kind: "photo", u: meta.created, deleted: 0, data: await sealJSON(meta) }] });
      await Store.updateRaw("photos", ph.id, o => { delete o.dirty; o.type = meta.type; });
    }
  }

  async function pull() {
    let since = (await Store.getMeta("seq")) || 0, changed = false;
    for (;;) {
      const r = await getJSON(`/api/changes?since=${since}`);
      for (const rec of r.records) {
        if (rec.deleted) {
          const store = { plant: "plants", room: "rooms", photo: "photos" }[rec.kind];
          if (store) { await Store.removeRaw(store, rec.id); changed = true; }
          continue;
        }
        let obj;
        try { obj = await openJSON(rec.data); } catch (e) { throw new SyncError("The key doesn't match this book."); }
        if (rec.kind === "plant" || rec.kind === "room") {
          const local = rec.kind === "plant" ? await Store.getPlant(rec.id) : await Store.getRoom(rec.id);
          if (local && local.dirty && local.u > obj.u) continue;           // our newer edit goes up next round
          if (local && local.u >= obj.u && !local.dirty) continue;         // already have it
          await (rec.kind === "plant" ? Store.putPlantRaw(obj) : Store.putRoomRaw(obj));
          changed = true;
        } else if (rec.kind === "photo") {
          if (!(await Store.getPhoto(rec.id))) {
            await Store.putPhotoRaw({ id: obj.id, plantId: obj.plantId, type: obj.type, created: obj.created, blob: null, thumb: null });
            changed = true;
          }
        }
      }
      since = r.seq;
      await Store.setMeta("seq", since);
      if (!r.more) break;
    }
    return changed;
  }

  async function fetchPhoto(id, variant) {
    const res = await api(`/api/blob/${id}/${variant}`);
    if (res.status === 404) return null;
    const bytes = await open(await res.arrayBuffer());
    const ph = await Store.getPhoto(id);
    return new Blob([bytes], { type: variant === "thumb" ? "image/jpeg" : (ph && ph.type) || "image/jpeg" });
  }

  async function download() {
    const all = (await Store.allPhotos()).filter(p => !p.thumb || !p.blob);
    const order = [...all.filter(p => !p.thumb), ...all.filter(p => p.thumb)];   // previews first
    st.fetching = order.length; emit();
    let next = 0, changed = false;
    async function worker() {
      while (next < order.length) {
        const p = order[next++];
        for (const variant of ["thumb", "orig"]) {
          if (variant === "orig" ? p.blob : p.thumb || p.blob) continue;   // a photo we hold the original of needs no preview
          const blob = await fetchPhoto(p.id, variant);
          if (!blob) continue;
          await Store.updateRaw("photos", p.id, o => { o[variant === "orig" ? "blob" : "thumb"] = blob; });
          changed = true;
        }
        st.fetching--; emit();
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    st.fetching = 0;
    return changed;
  }

  async function run() {
    if (!cfg || !navigator.onLine) return;
    if (running) { again = true; return; }
    running = true; st.running = true; st.error = null; emit();
    let changed = false;
    try {
      await pushRecords();
      await pushPhotos();
      changed = await pull();
      if (await download()) changed = true;
      st.last = Date.now();
      try { localStorage.setItem("pb.lastSync", String(st.last)); } catch (e) {}
    } catch (e) {
      st.error = e instanceof SyncError ? (e.message === "offline" ? null : e.message) : "Sync hit a problem. It will try again.";
      if (!(e instanceof SyncError)) console.error(e);
    }
    running = false; st.running = false; emit();
    if (changed && Sync.onChange) Sync.onChange();
    if (again) { again = false; kick(1000); }
  }

  function kick(delay = 2500) {
    if (!cfg) return;
    clearTimeout(kickTimer);
    kickTimer = setTimeout(run, delay);
  }

  // ---------- setting up, pairing ----------
  const appUrl = () => (typeof APP_URL !== "undefined" && APP_URL) || location.origin + location.pathname;

  async function join(url, key) {
    writeCfg({ url: url.replace(/\/+$/, ""), key });
    try {
      const res = await fetch(cfg.url + "/api/init", { method: "POST", headers: { Authorization: "Bearer " + (await derive()).token } });
      if (res.status === 403) throw new SyncError("This sync service already has all the books it allows.");
      if (!res.ok) throw new SyncError("Couldn't reach the cloud. Check your internet and try again.");
    } catch (e) {
      writeCfg(null);
      throw e instanceof SyncError ? e : new SyncError("Couldn't reach the cloud. Check your internet and try again.");
    }
    await Store.setMeta("seq", 0);
    await Store.markAllDirty();
    kick(200);
  }

  return {
    get ready() { return typeof SYNC_URL !== "undefined" && !!SYNC_URL; },
    get configured() { return !!cfg; },
    status: () => ({ ...st, last: st.last || Number(localStorage.getItem("pb.lastSync")) || null }),
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    kick, run,
    async startHere() { await join(SYNC_URL, b64u(crypto.getRandomValues(new Uint8Array(32)))); },
    async joinFromLink(text) {
      const m = /(?:#|^)pair=([A-Za-z0-9_-]+)/.exec(text.trim());
      let o = null;
      try { o = JSON.parse(dec.decode(unb64u(m[1]))); } catch (e) {}   // no match or bad text: o stays null
      if (!o || !/^https:\/\//.test(o.u || "") && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(o.u || "") || !/^[A-Za-z0-9_-]{43}$/.test(o.k || ""))
        throw new SyncError("That doesn't look like a pairing link.");
      await join(o.u, o.k);
    },
    pairLink() { return `${appUrl()}#pair=${b64u(enc.encode(JSON.stringify({ u: cfg.url, k: cfg.key })))}`; },
    stop() { writeCfg(null); clearTimeout(kickTimer); try { localStorage.removeItem("pb.lastSync"); } catch (e) {} st.last = null; emit(); },
    usage: async () => (cfg ? getJSON("/api/status").catch(() => null) : null),
    // Open one photo's original right now (it may not have downloaded yet).
    async original(id) {
      if (!cfg) return null;
      try {
        const blob = await fetchPhoto(id, "orig");
        if (blob) await Store.updateRaw("photos", id, o => { o.blob = blob; });
        return blob;
      } catch (e) { return null; }
    },
    onChange: null,
  };
})();

addEventListener("online", () => Sync.kick(500));
document.addEventListener("visibilitychange", () => { if (!document.hidden) Sync.kick(500); });
