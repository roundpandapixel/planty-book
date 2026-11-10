// Planty Book: the book of plants and each plant's page.
const $ = id => document.getElementById(id);

const TOPICS = {
  notes: { title: "Notes",    empty: "Nothing yet. Tap the pencil to add notes." },
  water: { title: "Watering", empty: "How does it like to be watered? Tap the pencil." },
  sun:   { title: "Sunlight", empty: "How much sun does it like? Tap the pencil." },
  pest:  { title: "Pests",    empty: "No pest notes yet." },
  dirt:  { title: "Soil",     empty: "What soil does it like? Tap the pencil." },
};

let plant = null;          // the plant whose page is open
let topic = "notes";
let photoIndex = 0;
let plantRoom = null;      // the open plant's room
let photoURLs = [];        // object URLs for the open page's photos
let thumbURLs = [];        // object URLs for the book's thumbnails

// ---------- dialogs ----------
// setup(done) runs once the dialog is up, for dialogs whose content changes as you use it.
function modal({ title, body = "", actions, inline = false, top = false, setup = null }) {
  return new Promise(resolve => {
    $("modal-title").textContent = title;
    const b = $("modal-body");
    b.innerHTML = "";
    if (typeof body === "string") b.innerHTML = body; else b.append(body);
    const acts = $("modal-actions");
    acts.className = "modal-actions" + (inline ? " inline" : "");
    acts.innerHTML = "";
    const done = v => { $("modal").hidden = true; $("modal").onclick = null; resolve(v); };
    for (const a of actions) {
      const btn = document.createElement("button");
      btn.className = "pill " + (a.cls || "");
      btn.textContent = a.label;
      btn.onclick = () => done(typeof a.value === "function" ? a.value() : a.value);
      acts.append(btn);
    }
    $("modal").onclick = e => { if (e.target === $("modal")) done(null); };
    $("modal").className = top ? "top" : "";
    $("modal").hidden = false;
    const first = b.querySelector("input");
    if (first) {
      setTimeout(() => first.focus(), 50);
      first.onkeydown = e => { if (e.key === "Enter") acts.lastChild.click(); };
    }
    if (setup) setup(done);
  });
}

function askText(title, value = "", placeholder = "") {
  const input = document.createElement("input");
  input.type = "text"; input.value = value; input.placeholder = placeholder;
  input.maxLength = 60;
  return modal({
    title, body: input, inline: true,
    actions: [{ label: "Cancel", value: null }, { label: "OK", cls: "strong", value: () => input.value.trim() }],
  });
}

const confirmBox = (title, text, yes, cls = "danger") =>
  modal({ title, body: `<p>${text}</p>`, inline: true,
          actions: [{ label: "Cancel", value: false }, { label: yes, cls, value: true }] });

// ---------- dates (US style) ----------
const today = () => new Date().toLocaleDateString("en-CA");          // YYYY-MM-DD, local
function niceDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysAgo(iso) {
  const n = Math.round((new Date(today() + "T12:00:00") - new Date(iso + "T12:00:00")) / 86400000);
  return n === 0 ? "today" : n === 1 ? "yesterday" : n > 0 ? `${n} days ago` : `in ${-n} days`;
}

// ---------- watering schedule (by room) ----------
function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA");
}
// Days until the room's next watering: 0 = today, negative = late, null = no schedule.
function dueIn(room) {
  if (!room || !room.every) return null;
  if (!room.last) return 0;
  return Math.round((new Date(addDays(room.last, room.every) + "T12:00:00") - new Date(today() + "T12:00:00")) / 86400000);
}
function dueText(room) {
  const n = dueIn(room);
  if (n === null) return "No watering schedule";
  const every = room.every === 1 ? "every day" : `every ${room.every} days`;
  const when = n === 0 ? "due today" : n < 0 ? `${-n} day${n === -1 ? "" : "s"} late` : n === 1 ? "due tomorrow" : `due in ${n} days`;
  return `Water ${every} · ${when}`;
}

async function waterRoom(room) {
  room.last = today();
  await Store.putRoom(room);
  for (const p of await Store.allPlants())
    if (p.room === room.id) { p.lastWatered = room.last; await Store.putPlant(p); }
  showBook();
}

async function editRoom(room) {
  const isNew = !room;
  room = room || { id: Store.newId(), name: "", every: null, last: null };
  const body = document.createElement("div");
  body.innerHTML = `<label class="field">Name<input type="text" maxlength="40" placeholder="Living room, kitchen..."></label>
    <label class="field">Water every <input type="number" min="1" max="60" inputmode="numeric" placeholder="-"> days</label>
    <p class="meter-help" style="text-align:left">Leave the days empty for no schedule.</p>`;
  const [nameIn, everyIn] = body.querySelectorAll("input");
  nameIn.value = room.name;
  everyIn.value = room.every || "";
  const actions = [{ label: "Save", cls: "strong", value: "save" }];
  if (!isNew) actions.push({ label: "Delete room", cls: "danger", value: "delete" });
  actions.push({ label: "Cancel", value: null });
  const v = await modal({ title: isNew ? "New room" : "Room", body, actions });
  if (v === "delete") {
    if (!await confirmBox("Delete room?", "Its plants stay in the book, just not in a room.", "Delete")) return null;
    await Store.deleteRoom(room.id);
    for (const p of await Store.allPlants()) if (p.room === room.id) { p.room = null; await Store.putPlant(p); }
    return null;
  }
  if (v !== "save" || !nameIn.value.trim()) return null;
  room.name = nameIn.value.trim();
  const every = parseInt(everyIn.value, 10);
  room.every = every > 0 ? Math.min(every, 365) : null;
  await Store.putRoom(room);
  return room;
}

// ---------- the book ----------
async function showBook() {
  plant = null;
  $("page").hidden = true;
  $("book").hidden = false;
  clearURLs(photoURLs);
  clearURLs(thumbURLs);
  const [plants, rooms] = await Promise.all([Store.allPlants(), Store.allRooms()]);
  plants.sort((a, b) => a.name.localeCompare(b.name));
  rooms.sort((a, b) => a.name.localeCompare(b.name));
  const body = $("book-body");
  body.innerHTML = "";

  const due = rooms.filter(r => dueIn(r) !== null && dueIn(r) <= 0);
  if (due.length) {
    const box = document.createElement("section");
    box.className = "panel due-panel";
    box.innerHTML = `<h2>Water today</h2>`;
    for (const r of due) {
      const p = document.createElement("p");
      const n = dueIn(r);
      p.textContent = `• ${r.name}` + (n < 0 ? ` (${-n} day${n === -1 ? "" : "s"} late)` : "");
      box.append(p);
    }
    body.append(box);
  }

  const known = new Set(rooms.map(r => r.id));
  for (const r of rooms) body.append(roomSection(r, plants.filter(p => p.room === r.id)));
  const loose = plants.filter(p => !known.has(p.room));
  if (loose.length || !rooms.length) body.append(roomSection(null, loose, rooms.length > 0));

  const acts = document.createElement("div");
  acts.className = "book-actions";
  acts.innerHTML = `<button class="pill">+ New room</button>`;
  acts.firstChild.onclick = async () => { if (await editRoom(null)) showBook(); };
  body.append(acts);
}

function roomSection(room, plants, titled = true) {
  const sec = document.createElement("section");
  sec.className = "room";
  if (room || titled) {
    const head = document.createElement("div");
    head.className = "panel room-head";
    head.innerHTML = `<div class="room-info"><h2></h2><p></p></div>`;
    head.querySelector("h2").textContent = room ? room.name : "Not in a room";
    const line = head.querySelector("p");
    if (room) {
      line.textContent = dueText(room);
      if (dueIn(room) !== null && dueIn(room) <= 0) line.className = "due";
      if (room.every) {
        const w = document.createElement("button");
        w.className = "pill";
        w.textContent = "Watered";
        w.onclick = () => waterRoom(room);
        head.append(w);
      }
      const e = document.createElement("button");
      e.className = "icon-btn small ghost";
      e.setAttribute("aria-label", "Edit room");
      e.innerHTML = iconSVG("pencil");
      e.onclick = async () => { await editRoom(room); showBook(); };
      head.append(e);
    } else line.remove();
    sec.append(head);
  }
  const grid = document.createElement("div");
  grid.className = "grid";
  for (const p of plants) {
    const card = document.createElement("button");
    card.className = "panel card";
    card.innerHTML = `<div class="thumb">${iconSVG("sprout")}</div><div class="label"></div>`;
    card.querySelector(".label").textContent = p.name;
    card.onclick = () => openPlant(p.id);
    grid.append(card);
    const coverId = p.cover || p.photos[0];
    if (coverId) Store.getPhoto(coverId).then(ph => {
      const pic = ph && (ph.thumb || ph.blob);
      if (!pic) return;
      const url = URL.createObjectURL(pic);
      thumbURLs.push(url);
      card.querySelector(".thumb").innerHTML = `<img alt="" src="${url}">`;
    });
  }
  const add = document.createElement("button");
  add.className = "panel card add";
  add.innerHTML = `<div class="thumb">${iconSVG("plus")}</div><div class="label">New plant</div>`;
  add.onclick = () => addPlant(room ? room.id : null);
  grid.append(add);
  sec.append(grid);
  return sec;
}

async function addPlant(roomId = null) {
  const name = await askText("New plant", "", "Its name");
  if (!name) return;
  const p = Store.blank(name);
  p.room = roomId;
  await Store.putPlant(p);
  await openPlant(p.id);
  chooseSpecies(name);            // the name is often the species already ("Monstera")
}

function clearURLs(list) { list.forEach(u => URL.revokeObjectURL(u)); list.length = 0; }

// ---------- a plant's page ----------
async function openPlant(id, push = true) {
  const p = await Store.getPlant(id);
  if (!p) { showBook(); return; }
  if (push) history.pushState({ plant: id }, "", "#" + id);
  plant = p;
  topic = "notes";
  photoIndex = Math.max(0, p.photos.indexOf(p.cover));
  $("book").hidden = true;
  $("page").hidden = false;
  scrollTo(0, 0);
  $("plant-name").textContent = p.name;
  plantRoom = p.room ? await Store.getRoom(p.room) : null;
  renderSpecies();
  renderRoom();
  renderNotes();
  await renderPhotos();
}

const save = () => Store.putPlant(plant);

function renderNotes() {
  document.querySelectorAll("[data-topic]").forEach(b =>
    b.setAttribute("aria-pressed", b.dataset.topic === topic ? "true" : "false"));
  $("notes-title").textContent = TOPICS[topic].title;
  $("notes-edit").hidden = true;
  $("notes-list").hidden = false;
  $("edit-btn").hidden = false;
  const list = $("notes-list");
  list.innerHTML = "";
  const items = plant[topic] || [];
  for (const line of items) {
    const li = document.createElement("li");
    li.textContent = line;
    list.append(li);
  }
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = TOPICS[topic].empty;
    list.append(li);
  }
  $("pest-box").hidden = topic !== "pest";
  $("sun-box").hidden = topic !== "sun";
  $("water-box").hidden = topic !== "water";
  if (topic === "water") {
    $("water-last").textContent = plant.lastWatered
      ? `Last watered: ${niceDate(plant.lastWatered)} (${daysAgo(plant.lastWatered)})`
      : "Last watered: not yet";
    const n = dueIn(plantRoom);
    $("water-next").textContent = !plantRoom ? "Put it in a room to give it a schedule"
      : n === null ? `${plantRoom.name} has no schedule yet`
      : `${plantRoom.name}: ${dueText(plantRoom).replace(/^Water /, "")}`;
  }
  if (topic === "pest")
    $("pest-last").textContent = plant.lastPest
      ? `Last treated: ${niceDate(plant.lastPest)} (${daysAgo(plant.lastPest)})`
      : "Last treated: never";
}

function editNotes() {
  $("notes-text").value = (plant[topic] || []).join("\n");
  $("notes-list").hidden = true;
  $("edit-btn").hidden = true;
  $("notes-edit").hidden = false;
  $("notes-text").focus();
}

async function saveNotes() {
  plant[topic] = $("notes-text").value.split("\n")
    .map(s => s.replace(/^\s*[•\-*]\s*/, "").trim()).filter(Boolean);
  await save();
  renderNotes();
}

async function treatedToday() {
  plant.lastPest = today();
  plant.pest = [`Treated ${niceDate(plant.lastPest)}`, ...plant.pest];
  await save();
  renderNotes();
}

async function changePestDate() {
  const input = document.createElement("input");
  input.type = "date"; input.value = plant.lastPest || today();
  input.style.cssText = "width:100%;margin-top:8px;padding:8px;font-size:22px";
  const v = await modal({
    title: "Last treated", body: input, inline: true,
    actions: [{ label: "Clear", value: "" }, { label: "Cancel", value: null },
              { label: "OK", cls: "strong", value: () => input.value }],
  });
  if (v === null) return;
  plant.lastPest = v || null;
  await save();
  renderNotes();
}

async function renamePlant() {
  const v = await modal({
    title: "This plant",
    body: (() => {
      const i = document.createElement("input");
      i.type = "text"; i.value = plant.name; i.maxLength = 60; i.id = "rename-input";
      return i;
    })(),
    actions: [
      { label: "Save name", cls: "strong", value: () => ({ name: $("rename-input").value.trim() }) },
      { label: "Delete this plant", cls: "danger", value: "delete" },
      { label: "Cancel", value: null },
    ],
  });
  if (!v) return;
  if (v === "delete") {
    if (await confirmBox("Delete plant?", `${escapeHTML(plant.name)} and all its photos will be gone for good.`, "Delete")) {
      await Store.deletePlant(plant);
      history.back();
    }
    return;
  }
  if (v.name) { plant.name = v.name; await save(); $("plant-name").textContent = plant.name; }
}

const escapeHTML = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- a plant's room ----------
function renderRoom() {
  const btn = $("room-btn");
  btn.textContent = plantRoom ? `Room: ${plantRoom.name}` : "+ Put in a room";
  btn.classList.toggle("unset", !plantRoom);
}

async function chooseRoom() {
  const rooms = (await Store.allRooms()).sort((a, b) => a.name.localeCompare(b.name));
  const actions = rooms.map(r => ({ label: r.name, cls: plantRoom && r.id === plantRoom.id ? "strong" : "", value: r }));
  actions.push({ label: "+ New room", value: "new" });
  if (plantRoom) actions.push({ label: "Take it out of the room", value: "none" });
  actions.push({ label: "Cancel", value: null });
  let v = await modal({ title: "Which room?", actions });
  if (!v) return;
  if (v === "new") { v = await editRoom(null); if (!v) return; }
  plantRoom = v === "none" ? null : v;
  plant.room = plantRoom ? plantRoom.id : null;
  await save();
  renderRoom();
  renderNotes();
}

async function wateredToday() {
  plant.lastWatered = today();
  await save();
  renderNotes();
}

// ---------- species ----------
const CARE = ["water", "sun", "dirt"];
const speciesById = id => SPECIES.find(s => s.id === id) || null;
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[×'’'".()]/g, "").replace(/[-_/]/g, " ").replace(/\s+/g, " ").trim();

// Every word typed must start a word in the species' names; names starting with the text come first.
function searchSpecies(text) {
  const q = norm(text);
  if (!q) return [];
  const words = q.split(" ");
  const hits = [];
  for (const s of SPECIES) {
    const names = [s.name, s.sci, ...s.aka].map(norm);
    const all = names.join(" ").split(" ");
    if (!words.every(w => all.some(a => a.startsWith(w)))) continue;
    const rank = norm(s.name).startsWith(q) ? 0 : names.some(n => n.startsWith(q)) ? 1 : 2;
    hits.push({ s, rank });
  }
  return hits.sort((a, b) => a.rank - b.rank || a.s.name.localeCompare(b.s.name)).slice(0, 60).map(h => h.s);
}

function renderSpecies() {
  const s = speciesById(plant.species);
  const btn = $("species-btn");
  btn.textContent = s ? (norm(s.name) === norm(plant.name) ? s.sci : `${s.name} · ${s.sci}`)
                      : plant.speciesName || "+ Add species";
  btn.classList.toggle("unset", !s && !plant.speciesName);
}

async function chooseSpecies(prefill = "") {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<input type="text" placeholder="Start typing: monstera, pothos..." autocomplete="off">
                    <div class="matches"></div>`;
  const input = wrap.querySelector("input"), box = wrap.querySelector(".matches");
  input.value = prefill;
  const hasOne = plant.species || plant.speciesName;
  const actions = [];
  if (hasOne) actions.push({ label: "Remove species", value: "clear" });
  actions.push({ label: "Cancel", value: null });

  const v = await modal({
    title: "Species", body: wrap, actions, inline: true, top: true,
    setup(done) {
      const show = () => {
        box.innerHTML = "";
        const typed = input.value.trim();
        for (const s of searchSpecies(typed)) {
          const b = document.createElement("button");
          b.innerHTML = `<span></span><span class="sci"></span>`;
          b.children[0].textContent = s.name;
          b.children[1].textContent = s.sci;
          b.onclick = () => done({ species: s });
          box.append(b);
        }
        if (typed && !box.children.length) {
          const p = document.createElement("p");
          p.className = "none";
          p.textContent = "Not in the list.";
          box.append(p);
        }
        if (typed) {   // keep what was typed, without care info
          const b = document.createElement("button");
          b.innerHTML = `<span></span><span class="sci">Use my own name (no care info)</span>`;
          b.children[0].textContent = `"${typed}"`;
          b.onclick = () => done({ custom: typed });
          box.append(b);
        }
      };
      input.oninput = show;
      input.onkeydown = e => { if (e.key === "Enter" && box.querySelector("button")) box.querySelector("button").click(); };
      show();
    },
  });
  if (!v) return;
  const old = speciesById(plant.species);
  if (v === "clear") { plant.species = null; plant.speciesName = null; }
  else if (v.custom) { plant.species = null; plant.speciesName = v.custom; }
  else {
    plant.species = v.species.id; plant.speciesName = null;
    await fillCare(v.species, old);
    topic = "water";              // show what was filled in
  }
  await save();
  renderSpecies();
  renderNotes();
}

// Fill Watering, Sunlight and Soil from the species. Notes that are empty or still the old
// species' care are replaced; if you've written your own, ask first.
async function fillCare(s, old) {
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const mine = CARE.filter(t => plant[t].length && !(old && same(plant[t], old[t])) && !same(plant[t], s[t]));
  let how = "replace";
  if (mine.length) {
    const names = mine.map(t => TOPICS[t].title).join(", ");
    how = await modal({
      title: "Care notes",
      body: `<p>You already have your own ${escapeHTML(names)} notes. What should happen to them?</p>`,
      actions: [
        { label: `Add ${s.name} care below mine`, cls: "strong", value: "add" },
        { label: `Replace with ${s.name} care`, value: "replace" },
        { label: "Keep only mine", value: "keep" },
      ],
    }) || "keep";
  }
  for (const t of CARE) {
    if (!mine.includes(t)) plant[t] = [...s[t]];
    else if (how === "replace") plant[t] = [...s[t]];
    else if (how === "add") plant[t] = [...plant[t], ...s[t].filter(x => !plant[t].includes(x))];
  }
}

// ---------- photos ----------
async function renderPhotos() {
  clearURLs(photoURLs);
  const strip = $("photo-strip");
  strip.innerHTML = "";
  for (const id of plant.photos) {
    const ph = await Store.getPhoto(id);
    const img = document.createElement("img");
    img.alt = plant.name;
    img.draggable = false;
    const pic = ph && (ph.thumb || ph.blob);
    if (pic) { const u = URL.createObjectURL(pic); photoURLs.push(u); img.src = u; }
    strip.append(img);
  }
  $("photo-empty").hidden = plant.photos.length > 0;
  photoIndex = Math.min(photoIndex, Math.max(0, plant.photos.length - 1));
  showPhoto(false);
}

function showPhoto(animate = true) {
  const strip = $("photo-strip");
  strip.style.transition = animate ? "" : "none";
  strip.style.transform = `translateX(${-photoIndex * 100}%)`;
  const dots = $("dots");
  dots.innerHTML = "";
  if (plant.photos.length > 1)
    plant.photos.forEach((_, i) => {
      const d = document.createElement("span");
      if (i === photoIndex) d.className = "on";
      dots.append(d);
    });
}

// Swipe to flip through photos; a tap opens the photo full screen.
(function swipe() {
  const frame = $("photo-frame");
  let x0 = null, y0 = 0, dx = 0, moved = false;
  frame.addEventListener("pointerdown", e => {
    if (!plant || !plant.photos.length) return;
    x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false;
    $("photo-strip").style.transition = "none";
  });
  frame.addEventListener("pointermove", e => {
    if (x0 === null) return;
    dx = e.clientX - x0;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)) moved = true;
    if (moved) $("photo-strip").style.transform =
      `translateX(calc(${-photoIndex * 100}% + ${dx}px))`;
  });
  const end = () => {
    if (x0 === null) return;
    x0 = null;
    const w = frame.clientWidth;
    if (moved && dx < -w * 0.18 && photoIndex < plant.photos.length - 1) photoIndex++;
    else if (moved && dx > w * 0.18 && photoIndex > 0) photoIndex--;
    showPhoto(true);
    if (!moved) openViewer();
  };
  frame.addEventListener("pointerup", end);
  frame.addEventListener("pointercancel", () => { moved = true; end(); });
})();

// Full screen shows the original; if this device doesn't have it yet, the preview shows while it downloads.
let viewerURL = null, viewerFor = null;
async function openViewer() {
  const id = plant && plant.photos[photoIndex];
  const ph = id && await Store.getPhoto(id);
  if (!ph) return;
  const show = blob => {
    if (viewerURL) URL.revokeObjectURL(viewerURL);
    viewerURL = URL.createObjectURL(blob);
    $("viewer-img").src = viewerURL;
  };
  viewerFor = id;
  if (ph.blob || ph.thumb) show(ph.blob || ph.thumb);
  $("viewer").hidden = false;
  if (!ph.blob && Sync.configured)
    Sync.original(id).then(b => { if (b && viewerFor === id && !$("viewer").hidden) show(b); });
}
function closeViewer() {
  $("viewer").hidden = true;
  viewerFor = null;
  if (viewerURL) { URL.revokeObjectURL(viewerURL); viewerURL = null; }
  $("viewer-img").removeAttribute("src");
}
$("viewer").onclick = closeViewer;

async function galleryOptions() {
  const has = plant.photos.length > 0;
  const actions = [
    { label: "Take a photo", cls: "strong", value: "camera" },
    { label: "Choose from phone", value: "gallery" },
  ];
  if (plant.photos.length > 1 && plant.cover !== plant.photos[photoIndex])
    actions.push({ label: "Make this the cover photo", value: "cover" });
  if (has) actions.push({ label: "Delete this photo", cls: "danger", value: "delete" });
  actions.push({ label: "Cancel", value: null });
  const v = await modal({
    title: "Gallery",
    body: has ? `<p>Photo ${photoIndex + 1} of ${plant.photos.length}. Swipe the photo to flip through.</p>` : "",
    actions,
  });
  if (v === "camera") $("pick-camera").click();
  else if (v === "gallery") $("pick-gallery").click();
  else if (v === "cover") { plant.cover = plant.photos[photoIndex]; await save(); }
  else if (v === "delete" && await confirmBox("Delete photo?", "This photo will be gone for good.", "Delete")) {
    const id = plant.photos[photoIndex];
    plant.photos.splice(photoIndex, 1);
    if (plant.cover === id) plant.cover = plant.photos[0] || null;
    await Store.deletePhoto(id);
    await save();
    await renderPhotos();
  }
}

async function addPhotos(files) {
  if (!files.length) return;
  for (const f of files) {
    // The original file goes in untouched (full detail); Store makes the preview.
    const ph = { id: Store.newId(), plantId: plant.id, type: f.type || "image/jpeg", created: Date.now(), blob: f };
    await Store.putPhoto(ph);
    plant.photos.push(ph.id);
    if (!plant.cover) plant.cover = ph.id;
  }
  await save();
  photoIndex = plant.photos.length - 1;
  await renderPhotos();
}

for (const id of ["pick-camera", "pick-gallery"])
  $(id).onchange = async e => { const files = [...e.target.files]; e.target.value = ""; await addPhotos(files); };

// ---------- backups ----------
const blobToB64 = b => new Promise(res => {
  const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(b);
});
const b64ToBlob = (s, type = "image/jpeg") =>
  new Blob([Uint8Array.from(atob(s), c => c.charCodeAt(0))], { type });

async function saveBackup() {
  const plants = await Store.allPlants();
  const photos = await Store.allPhotos();
  const rooms = await Store.allRooms();
  const out = { app: "plantybook", version: 2, saved: new Date().toISOString(), plants, rooms, photos: [] };
  for (const ph of photos) {
    const pic = ph.blob || ph.thumb;
    if (pic) out.photos.push({ id: ph.id, plantId: ph.plantId, type: pic.type, data: await blobToB64(pic) });
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = `planty-book-backup-${today()}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function loadBackup(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { data = null; }
  if (!data || data.app !== "plantybook") {
    await modal({ title: "Hmm", body: "<p>That file isn't a Planty Book backup.</p>", actions: [{ label: "OK", value: null }] });
    return;
  }
  const ok = await confirmBox("Load backup?",
    `It has ${data.plants.length} plant(s). Plants already in the book with the same entry are replaced; the rest stay.`,
    "Load", "strong");
  if (!ok) return;
  for (const ph of data.photos) await Store.putPhoto({ id: ph.id, plantId: ph.plantId, type: ph.type, created: Date.now(), blob: b64ToBlob(ph.data, ph.type) });
  for (const r of data.rooms || []) await Store.putRoom(r);
  for (const p of data.plants) await Store.putPlant(p);
  showBook();
}
$("pick-backup").onchange = async e => { const f = e.target.files[0]; e.target.value = ""; if (f) await loadBackup(f); };

// ---------- sync ----------
function agoText(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
}
function syncLine() {
  const s = Sync.status();
  if (!Sync.configured) return "Off";
  if (s.error) return s.error;
  if (s.running) return "Syncing...";
  if (s.fetching) return `Downloading ${s.fetching} photo${s.fetching === 1 ? "" : "s"}...`;
  if (!navigator.onLine) return "Offline: changes will wait";
  return s.last ? `Up to date (${agoText(s.last)})` : "Waiting to sync";
}
const gb = n => (n < 1e6 ? `${Math.round(n / 1e3)} KB` : n < 1e8 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e9).toFixed(1)} GB`);
const notice = (title, text) => modal({ title, body: `<p>${escapeHTML(text)}</p>`, actions: [{ label: "OK", value: null }] });

function qrCanvas(text) {
  const qr = qrcode(0, "L");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount(), cell = 5, margin = 3;
  const c = document.createElement("canvas");
  c.width = c.height = (n + 2 * margin) * cell;
  c.className = "qr";
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#1d2b21";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++)
    if (qr.isDark(y, x)) g.fillRect((x + margin) * cell, (y + margin) * cell, cell, cell);
  return c;
}

async function showPairing(first) {
  const link = Sync.pairLink();
  const body = document.createElement("div");
  body.innerHTML = `<p>${first ? "Syncing is on. " : ""}To add another device, open this link there, or scan the code with its camera.</p>`;
  body.append(qrCanvas(link));
  const box = document.createElement("textarea");
  box.readOnly = true; box.rows = 3; box.value = link;
  box.onfocus = () => box.select();
  body.append(box);
  body.insertAdjacentHTML("beforeend",
    `<p class="meter-help" style="text-align:left">Keep this private: anyone with the link can read your book. Photos and notes are encrypted before they leave your devices.</p>`);
  const v = await modal({ title: "Add a device", body, actions: [{ label: "Copy link", cls: "strong", value: "copy" }, { label: "Done", value: null }] });
  if (v === "copy") try { await navigator.clipboard.writeText(link); } catch (e) {}
}

async function syncMenu() {
  if (!Sync.ready) { await notice("Sync", "The private cloud isn't switched on in this version yet."); return; }
  if (!Sync.configured) {
    const v = await modal({
      title: "Sync",
      body: `<p>Keep your plants, notes and photos the same on all your devices. Everything is encrypted on this device before it's uploaded, so only your devices can read it.</p>`,
      actions: [
        { label: "Start syncing on this device", cls: "strong", value: "start" },
        { label: "I have a pairing link", value: "link" },
        { label: "Close", value: null },
      ],
    });
    try {
      if (v === "start") { await Sync.startHere(); await showPairing(true); }
      else if (v === "link") {
        const text = await askText("Pairing link", "", "Paste it here");
        if (text) { await Sync.joinFromLink(text); await notice("Connected", "This device is joining your book. Your plants and photos will appear in a moment."); }
      }
    } catch (e) { await notice("Sync", e.message); }
    return;
  }
  const body = document.createElement("div");
  body.innerHTML = `<p></p><p class="meter-help" style="text-align:left"></p>`;
  body.children[0].textContent = syncLine();
  Sync.usage().then(u => {
    if (u) body.children[1].textContent = `Cloud storage: ${gb(u.bytes)} of ${gb(u.max)} used`;
  });
  const v = await modal({
    title: "Sync", body,
    actions: [
      { label: "Sync now", cls: "strong", value: "now" },
      { label: "Add another device", value: "pair" },
      { label: "Stop syncing on this device", value: "stop" },
      { label: "Close", value: null },
    ],
  });
  if (v === "now") Sync.run();
  else if (v === "pair") await showPairing(false);
  else if (v === "stop" && await confirmBox("Stop syncing?",
    "This device keeps its plants and photos, but stops sharing changes. The cloud copy stays as it is.", "Stop"))
    Sync.stop();
}

// Opened from a pairing link: join the book.
async function connectFromLink(text) {
  if (!Sync.ready || Sync.configured) return;
  if (!await confirmBox("Connect to sync?",
    "This joins this device to your Planty Book cloud. What's here will be merged with what's there.", "Connect", "strong")) return;
  try { await Sync.joinFromLink(text); await notice("Connected", "Your plants and photos will appear in a moment."); }
  catch (e) { await notice("Sync", e.message); }
}

// Another device changed something: bring this screen up to date without disturbing what's being done.
async function refreshView() {
  if (!$("modal").hidden || !$("meter").hidden || !$("viewer").hidden) return;
  if (!$("book").hidden) { showBook(); return; }
  if (!plant || !$("notes-edit").hidden) return;
  const p = await Store.getPlant(plant.id);
  if (!p) { history.back(); return; }
  plant = p;
  plantRoom = p.room ? await Store.getRoom(p.room) : null;
  $("plant-name").textContent = p.name;
  renderSpecies(); renderRoom(); renderNotes();
  await renderPhotos();
}
Sync.onChange = refreshView;

async function menu() {
  const v = await modal({
    title: "Planty Book",
    body: "<p>Your plants live on your devices. Turn on Sync to share them between your phone and PC, and keep a backup now and then.</p>",
    actions: [
      { label: `Sync: ${Sync.ready ? syncLine() : "not available yet"}`, cls: "strong", value: "sync" },
      { label: "Save a backup file", value: "save" },
      { label: "Load a backup file", value: "load" },
      { label: Sky.motionOn() ? "Clouds and petals: on" : "Clouds and petals: off", value: "motion" },
      { label: "Close", value: null },
    ],
  });
  if (v === "sync") await syncMenu();
  else if (v === "save") saveBackup();
  else if (v === "load") $("pick-backup").click();
  else if (v === "motion") Sky.setMotion(!Sky.motionOn());
}

// ---------- light meter ----------
function measureLight() {
  const s = speciesById(plant.species);
  const like = s && (s.sun.find(x => /light|sun|window/i.test(x)) || s.sun[0]);
  const want = like ? `${s.name} likes: ${like}` : "";
  Meter.open(want, async (fc, kind) => {
    const n = fc < 100 ? Math.round(fc / 5) * 5 : Math.round(fc / 10) * 10;
    plant.sun = [`Light meter: about ${n.toLocaleString("en-US")} fc, ${kind} (${niceDate(today())})`, ...plant.sun];
    await save();
    topic = "sun";
    renderNotes();
  });
}

// ---------- look it up online ----------
// Opens searches set up for this plant (top posts first); on the phone, Reddit and Facebook
// links open in their apps.
function subredditFor(s) {
  const sci = s ? s.sci : "";
  if (/monstera|rhaphidophora/i.test(sci)) return "Monstera";
  if (/epipremnum|scindapsus/i.test(sci)) return "pothos";
  if (/philodendron|thaumatophyllum/i.test(sci)) return "philodendron";
  if (/hoya/i.test(sci)) return "hoya";
  if (/alocasia/i.test(sci)) return "alocasia";
  if (/cactus|opuntia|schlumbergera|rhipsalis|disocactus/i.test(sci + " " + (s ? s.name : ""))) return "cactus";
  if (/crassula|echeveria|haworthi|sedum|kalanchoe|aloe|curio|ceropegia/i.test(sci)) return "succulents";
  return "houseplants";
}

async function lookUp() {
  const s = speciesById(plant.species);
  const name = s ? s.name : plant.speciesName || plant.name;
  const sub = subredditFor(s);
  const q = encodeURIComponent(`"${name}"`);
  const care = encodeURIComponent(`"${name}" care`);
  const forums = encodeURIComponent(`"${name}" care (site:reddit.com OR site:houseplantsforum.com OR site:houzz.com/discussions)`);
  const links = {
    sub: `https://www.reddit.com/r/${sub}/search/?q=${q}&restrict_sr=1&sort=top&t=all`,
    reddit: `https://www.reddit.com/search/?q=${care}&sort=top&t=all`,
    fbposts: `https://www.facebook.com/search/posts/?q=${care}`,
    fbgroups: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(name)}`,
    forums: `https://www.google.com/search?q=${forums}`,
  };
  const v = await modal({
    title: "Look it up",
    body: `<p>Top posts about ${escapeHTML(name)}, best first.</p>`,
    actions: [
      { label: `r/${sub}: top posts`, cls: "strong", value: "sub" },
      { label: "All of Reddit: top posts", value: "reddit" },
      { label: "Facebook posts", value: "fbposts" },
      { label: "Facebook groups", value: "fbgroups" },
      { label: "Houseplant forums", value: "forums" },
      { label: "Close", value: null },
    ],
  });
  if (v) window.open(links[v], "_blank", "noopener");
}

// ---------- wiring ----------
fillIcons();
$("meter-btn").onclick = measureLight;
$("lookup-btn").onclick = lookUp;
$("menu-btn").onclick = menu;
$("back-btn").onclick = () => history.back();
$("plant-name").onclick = renamePlant;
$("plant-name").onkeydown = e => { if (e.key === "Enter") renamePlant(); };
$("species-btn").onclick = () => chooseSpecies();
$("room-btn").onclick = chooseRoom;
$("watered-btn").onclick = wateredToday;
$("edit-btn").onclick = editNotes;
$("notes-cancel").onclick = renderNotes;
$("notes-save").onclick = saveNotes;
$("treated-btn").onclick = treatedToday;
$("pest-last").onclick = changePestDate;
$("gallery-btn").onclick = galleryOptions;
document.querySelectorAll("[data-topic]").forEach(b => {
  b.onclick = () => { topic = topic === b.dataset.topic ? "notes" : b.dataset.topic; renderNotes(); };
});

// The phone's back button: page -> book.
addEventListener("popstate", () => {
  closeViewer();
  $("modal").hidden = true;
  Meter.close();
  const id = location.hash.slice(1);
  if (id.startsWith("pair=")) {            // a pairing link opened while the app is already open
    history.replaceState({}, "", location.pathname + location.search);
    connectFromLink(id);
    return;
  }
  if (id) openPlant(id, false); else showBook();
});

// Start on the book; a reload on a plant's page comes back to it (back still goes to the book).
const startHash = location.hash.slice(1);
const pairing = startHash.startsWith("pair=") ? startHash : null;     // a pairing link, not a plant
const startId = pairing ? "" : startHash;
history.replaceState({}, "", location.pathname + location.search);
showBook().then(() => {
  if (startId) openPlant(startId);
  if (pairing) connectFromLink(pairing);
  Sync.kick(500);
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker.register("sw.js").catch(() => {});
