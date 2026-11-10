// Plants and their photos, kept on the phone in IndexedDB.
// plant: { id, name, created, cover, photos: [photoId], species (id in SPECIES) or speciesName (own text), notes, water, sun, pest, dirt: [string], lastPest: "YYYY-MM-DD" | null,
//        room (room id) | null, lastWatered: "YYYY-MM-DD" | null }
// photo: { id, plantId, blob }
// room: { id, name, every (days between waterings) | null, last: "YYYY-MM-DD" | null }
const Store = (() => {
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open("plantybook", 2);
      req.onupgradeneeded = e => {
        const d = req.result;
        if (e.oldVersion < 1) {
          d.createObjectStore("plants", { keyPath: "id" });
          d.createObjectStore("photos", { keyPath: "id" }).createIndex("plantId", "plantId");
        }
        if (e.oldVersion < 2) d.createObjectStore("rooms", { keyPath: "id" });
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

  return {
    newId,
    blank(name) {
      return { id: newId(), name, created: Date.now(), cover: null, photos: [], species: null, speciesName: null,
               notes: [], water: [], sun: [], pest: [], dirt: [], lastPest: null,
               room: null, lastWatered: null };
    },
    allPlants: () => run("plants", "readonly", tx => req2p(tx.objectStore("plants").getAll())),
    getPlant: id => run("plants", "readonly", tx => req2p(tx.objectStore("plants").get(id))),
    putPlant: p => run("plants", "readwrite", tx => { tx.objectStore("plants").put(p); }),
    getPhoto: id => run("photos", "readonly", tx => req2p(tx.objectStore("photos").get(id))),
    putPhoto: ph => run("photos", "readwrite", tx => { tx.objectStore("photos").put(ph); }),
    deletePhoto: id => run("photos", "readwrite", tx => { tx.objectStore("photos").delete(id); }),
    async deletePlant(p) {
      await run(["plants", "photos"], "readwrite", tx => {
        tx.objectStore("plants").delete(p.id);
        p.photos.forEach(id => tx.objectStore("photos").delete(id));
      });
    },
    allRooms: () => run("rooms", "readonly", tx => req2p(tx.objectStore("rooms").getAll())),
    getRoom: id => run("rooms", "readonly", tx => req2p(tx.objectStore("rooms").get(id))),
    putRoom: r => run("rooms", "readwrite", tx => { tx.objectStore("rooms").put(r); }),
    deleteRoom: id => run("rooms", "readwrite", tx => { tx.objectStore("rooms").delete(id); }),
    allPhotos: () => run("photos", "readonly", tx => req2p(tx.objectStore("photos").getAll())),
    async clearAll() {
      await run(["plants", "photos", "rooms"], "readwrite", tx => {
        tx.objectStore("plants").clear(); tx.objectStore("photos").clear(); tx.objectStore("rooms").clear();
      });
    },
  };
})();

// Ask the phone not to clear our storage when space runs low.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
