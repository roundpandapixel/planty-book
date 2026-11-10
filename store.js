// Plants, rooms and photos, kept on the phone in IndexedDB.
// plant: { id, name, created, cover, photos: [photoId], species (id in SPECIES) or speciesName (own text),
//          notes, water, sun, pest, dirt: [string], lastPest: "YYYY-MM-DD" | null,
//          room (room id) | null, lastWatered: "YYYY-MM-DD" | null,
//          u (edit time, ms), dirty (1 = not sent to the cloud yet) }
// room:  { id, name, every (days between waterings) | null, last: "YYYY-MM-DD" | null, u, dirty }
// photo: { id, plantId, type, created, blob (the original file, untouched) | null,
//          thumb (a ~900 px preview) | null, dirty }
//        a photo that arrived from the cloud has only its thumb until the original is downloaded.
// tombs: { id, kind, u } for things deleted here that the cloud doesn't know yet.
// meta:  { key, value } sync bookkeeping.
// The app's own writes (putPlant etc.) stamp the edit time and mark the record for upload;
// the *Raw ones are for sync, which must not.
const Store = (() => {
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open("plantybook", 3);
      req.onupgradeneeded = e => {
        const d = req.result;
        if (e.oldVersion < 1) {
          d.createObjectStore("plants", { keyPath: "id" });
          d.createObjectStore("photos", { keyPath: "id" }).createIndex("plantId", "plantId");
        }
        if (e.oldVersion < 2) d.createObjectStore("rooms", { keyPath: "id" });
        if (e.oldVersion < 3) {
          d.createObjectStore("tombs", { keyPath: "id" });
          d.createObjectStore("meta", { keyPath: "key" });
          req.transaction.objectStore("photos").createIndex("dirty", "dirty");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }
  async function run(stores, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(stores, mode);
      let out;
      Promise.resolve(fn(tx)).then(v => { out = v; });
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  const req2p = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const changed = () => { if (typeof Sync !== "undefined") Sync.kick(); };

  // A preview of a photo, small enough to show in lists and the photo frame quickly.
  async function makeThumb(blob, max = 900) {
    try {
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      bmp.close && bmp.close();
      return await new Promise(res => c.toBlob(b => res(b), "image/jpeg", 0.82));
    } catch (e) { return null; }
  }

  const stamp = o => { o.u = Date.now(); o.dirty = 1; return o; };
  const tomb = (tx, id, kind) => tx.objectStore("tombs").put({ id, kind, u: Date.now() });

  return {
    newId, makeThumb,
    blank(name) {
      return { id: newId(), name, created: Date.now(), cover: null, photos: [], species: null, speciesName: null,
               notes: [], water: [], sun: [], pest: [], dirt: [], lastPest: null,
               room: null, lastWatered: null };
    },

    // ---- the app's own reads and writes ----
    allPlants: () => run("plants", "readonly", tx => req2p(tx.objectStore("plants").getAll())),
    getPlant: id => run("plants", "readonly", tx => req2p(tx.objectStore("plants").get(id))),
    async putPlant(p) { await run("plants", "readwrite", tx => { tx.objectStore("plants").put(stamp(p)); }); changed(); },
    allRooms: () => run("rooms", "readonly", tx => req2p(tx.objectStore("rooms").getAll())),
    getRoom: id => run("rooms", "readonly", tx => req2p(tx.objectStore("rooms").get(id))),
    async putRoom(r) { await run("rooms", "readwrite", tx => { tx.objectStore("rooms").put(stamp(r)); }); changed(); },
    async deleteRoom(id) {
      await run(["rooms", "tombs"], "readwrite", tx => { tx.objectStore("rooms").delete(id); tomb(tx, id, "room"); });
      changed();
    },
    getPhoto: id => run("photos", "readonly", tx => req2p(tx.objectStore("photos").get(id))),
    allPhotos: () => run("photos", "readonly", tx => req2p(tx.objectStore("photos").getAll())),
    async putPhoto(ph) {
      if (ph.blob && !ph.thumb) ph.thumb = await makeThumb(ph.blob);
      ph.dirty = 1;
      await run("photos", "readwrite", tx => { tx.objectStore("photos").put(ph); });
      changed();
    },
    async deletePhoto(id) {
      await run(["photos", "tombs"], "readwrite", tx => { tx.objectStore("photos").delete(id); tomb(tx, id, "photo"); });
      changed();
    },
    async deletePlant(p) {
      await run(["plants", "photos", "tombs"], "readwrite", tx => {
        tx.objectStore("plants").delete(p.id); tomb(tx, p.id, "plant");
        p.photos.forEach(id => { tx.objectStore("photos").delete(id); tomb(tx, id, "photo"); });
      });
      changed();
    },
    async clearAll() {
      await run(["plants", "photos", "rooms", "tombs", "meta"], "readwrite", tx => {
        for (const s of ["plants", "photos", "rooms", "tombs", "meta"]) tx.objectStore(s).clear();
      });
    },

    // ---- for sync ----
    putPlantRaw: p => run("plants", "readwrite", tx => { tx.objectStore("plants").put(p); }),
    putRoomRaw: r => run("rooms", "readwrite", tx => { tx.objectStore("rooms").put(r); }),
    putPhotoRaw: ph => run("photos", "readwrite", tx => { tx.objectStore("photos").put(ph); }),
    removeRaw: (store, id) => run(store, "readwrite", tx => { tx.objectStore(store).delete(id); }),
    dirtyPhotos: () => run("photos", "readonly", tx => req2p(tx.objectStore("photos").index("dirty").getAll(IDBKeyRange.only(1)))),
    // Change one stored record, only if it is still there (the edit runs on the stored copy).
    updateRaw(store, id, fn) {
      return run(store, "readwrite", async tx => {
        const os = tx.objectStore(store);
        const cur = await req2p(os.get(id));
        if (cur) { fn(cur); os.put(cur); }
      });
    },
    tombs: () => run("tombs", "readonly", tx => req2p(tx.objectStore("tombs").getAll())),
    clearTomb: (id, u) => run("tombs", "readwrite", async tx => {
      const t = await req2p(tx.objectStore("tombs").get(id));
      if (t && t.u === u) tx.objectStore("tombs").delete(id);
    }),
    getMeta: async key => { const r = await run("meta", "readonly", tx => req2p(tx.objectStore("meta").get(key))); return r ? r.value : null; },
    setMeta: (key, value) => run("meta", "readwrite", tx => { tx.objectStore("meta").put({ key, value }); }),
    // Joining sync: everything already here has to go up.
    async markAllDirty() {
      await run(["plants", "rooms", "photos"], "readwrite", async tx => {
        for (const s of ["plants", "rooms"]) {
          const os = tx.objectStore(s);
          for (const o of await req2p(os.getAll())) { o.dirty = 1; o.u = o.u || o.created || Date.now(); os.put(o); }
        }
        const ps = tx.objectStore("photos");
        for (const ph of await req2p(ps.getAll())) { ph.dirty = 1; ph.created = ph.created || Date.now(); ps.put(ph); }
      });
    },
  };
})();

// Ask the phone not to clear our storage when space runs low.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
