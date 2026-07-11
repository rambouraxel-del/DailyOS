// Couche de stockage local (localStorage). Toute l'app lit/écrit l'état via ce module.

const STORAGE_KEY = "dailyos:data";
const STORAGE_VERSION = 1;

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function seedData() {
  const today = todayISO();
  return {
    version: STORAGE_VERSION,
    tasks: [
      { id: uid(), title: "Séance de sport", done: true, createdAt: Date.now() - 5000, category: "", comment: "", deadline: "" },
      { id: uid(), title: "Appeler le client", done: false, createdAt: Date.now() - 4000, category: "", comment: "", deadline: "" },
      { id: uid(), title: "Préparer présentation", done: false, createdAt: Date.now() - 3000, category: "", comment: "", deadline: todayISO() },
      { id: uid(), title: "Répondre aux emails", done: false, createdAt: Date.now() - 2000, category: "", comment: "", deadline: "" },
      { id: uid(), title: "Lire 20 pages", done: false, createdAt: Date.now() - 1000, category: "", comment: "Chapitre 4 en cours", deadline: "" },
    ],
    events: [
      { id: uid(), title: "Sport", startTime: "07:00", endTime: "08:00", color: "green", date: today, description: "" },
      { id: uid(), title: "Déjeuner", startTime: "12:30", endTime: "13:30", color: "blue", date: today, description: "" },
      { id: uid(), title: "Présentation", startTime: "14:00", endTime: "15:00", color: "violet", date: today, description: "" },
      { id: uid(), title: "Courses", startTime: "18:00", endTime: "18:45", color: "orange", date: today, description: "" },
      { id: uid(), title: "Dîner", startTime: "20:00", endTime: "21:00", color: "pink", date: today, description: "" },
    ],
    projects: [
      { id: uid(), name: "Personnel", color: "violet", notes: "", tasks: [], createdAt: Date.now() - 4000, status: "actif" },
      { id: uid(), name: "Travail", color: "blue", notes: "", tasks: [
        { id: uid(), title: "Etape 1", done: false },
        { id: uid(), title: "Etape 2", done: false },
      ], createdAt: Date.now() - 3000, status: "actif" },
      { id: uid(), name: "Voyage", color: "green", notes: "Idées de destinations pour cet été.", tasks: [], createdAt: Date.now() - 2000, status: "actif" },
      { id: uid(), name: "Maison", color: "orange", notes: "", tasks: [], createdAt: Date.now() - 1000, status: "actif" },
    ],
    groceries: [
      { id: uid(), name: "Pommes", done: false, category: "Fruits & légumes", createdAt: Date.now() - 6000 },
      { id: uid(), name: "Avocats", done: false, category: "Fruits & légumes", createdAt: Date.now() - 5000 },
      { id: uid(), name: "Tomates", done: false, category: "Fruits & légumes", createdAt: Date.now() - 4000 },
      { id: uid(), name: "Lait", done: false, category: "Frais", createdAt: Date.now() - 3000 },
      { id: uid(), name: "Pâtes", done: false, category: "Épicerie", createdAt: Date.now() - 2000 },
      { id: uid(), name: "Eau", done: false, category: "Autres", createdAt: Date.now() - 1000 },
    ],
    notes: [
      {
        id: uid(),
        title: "Découvrir les notes structurées",
        parentId: null,
        favorite: true,
        tags: ["exemple"],
        status: "active",
        createdAt: Date.now() - 500,
        updatedAt: Date.now() - 500,
        blocks: [
          { id: uid(), type: "paragraph", content: "Bienvenue dans le nouveau module Notes : chaque note se compose de blocs (texte, listes, checklists, encadrés…) et peut contenir des sous-notes." },
          { id: uid(), type: "heading", content: "Ce que tu peux faire" },
          {
            id: uid(),
            type: "bulletList",
            content: [
              "Ajouter des listes et des checklists",
              "Créer des sous-notes pour organiser une réflexion",
              "Visualiser l'ensemble en vue Arbre ou Carte mentale",
            ],
          },
          { id: uid(), type: "callout", variant: "idea", content: "Astuce : utilise \"+ Ajouter un bloc\" en bas de la note pour essayer les autres types de blocs." },
        ],
      },
      { id: uid(), title: "Idées rapides", parentId: null, favorite: false, tags: [], status: "active", createdAt: Date.now() - 3000, updatedAt: Date.now() - 3000, blocks: [] },
      { id: uid(), title: "Rappels", parentId: null, favorite: false, tags: [], status: "active", createdAt: Date.now() - 2000, updatedAt: Date.now() - 2000, blocks: [] },
      { id: uid(), title: "À creuser", parentId: null, favorite: false, tags: [], status: "active", createdAt: Date.now() - 1000, updatedAt: Date.now() - 1000, blocks: [] },
    ],
    settings: {
      city: "",
      weatherEnabled: true,
      lastWeather: null,
      groceryCategories: ["Fruits & légumes", "Frais", "Épicerie", "Autres"],
    },
  };
}

/**
 * Migre une note vers le nouveau format en blocs, sans jamais perdre de
 * données. Idempotente : une note déjà au nouveau format (tableau `blocks`
 * présent) n'est pas re-transformée, seuls les champs manquants sont complétés.
 */
function migrateNote(n) {
  if (Array.isArray(n.blocks)) {
    return {
      id: n.id ?? uid(),
      title: n.title ?? "Sans titre",
      parentId: n.parentId ?? null,
      favorite: n.favorite ?? false,
      tags: n.tags ?? [],
      status: n.status ?? "active",
      createdAt: n.createdAt ?? Date.now(),
      updatedAt: n.updatedAt ?? Date.now(),
      blocks: n.blocks,
    };
  }
  // Ancien format : { title, content (texte) }. Le texte devient un bloc paragraph.
  const blocks = n.content && String(n.content).trim() ? [{ id: uid(), type: "paragraph", content: n.content }] : [];
  return {
    id: n.id ?? uid(),
    title: n.title ?? "Sans titre",
    parentId: null,
    favorite: false,
    tags: [],
    status: "active",
    createdAt: n.createdAt ?? Date.now(),
    updatedAt: n.updatedAt ?? Date.now(),
    blocks,
  };
}

function saveRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedData();
      saveRaw(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      const seeded = seedData();
      saveRaw(seeded);
      return seeded;
    }
    // fusion défensive avec les clés attendues, au cas où une version future ajoute des champs
    const seed = seedData();
    const merged = {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...(parsed.settings || {}) },
    };
    // compatibilité ascendante : les tâches enregistrées avant l'ajout du
    // commentaire/de la deadline n'ont pas ces clés -> on leur donne une valeur vide.
    // (mutation en place pour ne pas réordonner les clés des tâches déjà migrées)
    merged.tasks = (merged.tasks || []).map((t) => {
      if (t.comment === undefined) t.comment = "";
      if (t.deadline === undefined) t.deadline = "";
      return t;
    });

    // compatibilité ascendante : catégories de courses. Si la liste n'existe
    // pas encore (ou est vide), on repart des catégories par défaut. Les
    // articles sans catégorie reçoivent "Autres" ; si un article référence
    // une catégorie absente de la liste, on l'ajoute plutôt que de perdre
    // l'information (aucune donnée n'est jamais supprimée silencieusement).
    merged.settings.groceryCategories =
      merged.settings.groceryCategories && merged.settings.groceryCategories.length
        ? merged.settings.groceryCategories
        : [...seed.settings.groceryCategories];
    merged.groceries = merged.groceries || [];
    merged.groceries.forEach((g) => {
      if (!g.category) g.category = "Autres";
      if (!merged.settings.groceryCategories.includes(g.category)) {
        merged.settings.groceryCategories.push(g.category);
      }
    });

    // compatibilité ascendante : notes -> format en blocs (voir migrateNote).
    // Exécutée à chaque chargement mais idempotente et non bloquante (simple map).
    merged.notes = (merged.notes || []).map(migrateNote);

    // On réécrit immédiatement le résultat migré/fusionné en localStorage :
    // sans ça, les anciennes données resteraient "en attente de migration"
    // dans le stockage jusqu'à la prochaine modification quelconque.
    saveRaw(merged);
    return merged;
  } catch (e) {
    console.warn("Impossible de lire les données locales, réinitialisation.", e);
    const seeded = seedData();
    saveRaw(seeded);
    return seeded;
  }
}

function persist() {
  saveRaw(state);
}

export function getState() {
  return state;
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  state = seedData();
  persist();
  return state;
}

// ---------- Tâches (globales) ----------
export function addTask(title, extra = {}) {
  const task = {
    id: uid(),
    title: title.trim(),
    done: false,
    createdAt: Date.now(),
    category: extra.category || "",
    comment: extra.comment?.trim() || "",
    deadline: extra.deadline || "",
  };
  state.tasks.push(task);
  persist();
  return task;
}
export function toggleTask(id) {
  const t = state.tasks.find((t) => t.id === id);
  if (t) t.done = !t.done;
  persist();
}
export function updateTask(id, patch) {
  const t = state.tasks.find((t) => t.id === id);
  if (t) {
    if (typeof patch === "string") {
      // compatibilité avec l'ancien appel updateTask(id, "nouveau titre")
      t.title = patch.trim();
    } else {
      if (patch.title !== undefined) patch.title = patch.title.trim();
      if (patch.comment !== undefined) patch.comment = patch.comment.trim();
      Object.assign(t, patch);
    }
  }
  persist();
}
export function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  persist();
}

// ---------- Planning ----------
export function addEvent(evt) {
  const event = {
    id: uid(),
    title: evt.title.trim(),
    startTime: evt.startTime,
    endTime: evt.endTime || "",
    color: evt.color || "violet",
    date: evt.date,
    description: evt.description || "",
  };
  state.events.push(event);
  persist();
  return event;
}
export function updateEvent(id, patch) {
  const e = state.events.find((e) => e.id === id);
  if (e) Object.assign(e, patch);
  persist();
}
export function deleteEvent(id) {
  state.events = state.events.filter((e) => e.id !== id);
  persist();
}

// ---------- Projets ----------
export function addProject(name, color = "violet") {
  const project = {
    id: uid(),
    name: name.trim(),
    color,
    notes: "",
    tasks: [],
    createdAt: Date.now(),
    status: "actif",
  };
  state.projects.push(project);
  persist();
  return project;
}
export function updateProject(id, patch) {
  const p = state.projects.find((p) => p.id === id);
  if (p) Object.assign(p, patch);
  persist();
}
export function deleteProject(id) {
  state.projects = state.projects.filter((p) => p.id !== id);
  persist();
}
export function addProjectTask(projectId, title) {
  const p = state.projects.find((p) => p.id === projectId);
  if (!p) return;
  const task = { id: uid(), title: title.trim(), done: false };
  p.tasks.push(task);
  persist();
  return task;
}
export function toggleProjectTask(projectId, taskId) {
  const p = state.projects.find((p) => p.id === projectId);
  const t = p?.tasks.find((t) => t.id === taskId);
  if (t) t.done = !t.done;
  persist();
}
export function deleteProjectTask(projectId, taskId) {
  const p = state.projects.find((p) => p.id === projectId);
  if (!p) return;
  p.tasks = p.tasks.filter((t) => t.id !== taskId);
  persist();
}

// ---------- Courses ----------
export function addGrocery(name, category = "Autres") {
  const item = { id: uid(), name: name.trim(), done: false, category, createdAt: Date.now() };
  state.groceries.push(item);
  persist();
  return item;
}
export function toggleGrocery(id) {
  const g = state.groceries.find((g) => g.id === id);
  if (g) g.done = !g.done;
  persist();
}
export function updateGrocery(id, patch) {
  const g = state.groceries.find((g) => g.id === id);
  if (g) {
    if (typeof patch === "string") {
      // compatibilité avec l'ancien appel updateGrocery(id, "nouveau nom")
      g.name = patch.trim();
    } else {
      if (patch.name !== undefined) patch.name = patch.name.trim();
      Object.assign(g, patch);
    }
  }
  persist();
}
export function deleteGrocery(id) {
  state.groceries = state.groceries.filter((g) => g.id !== id);
  persist();
}

// ---------- Catégories de courses ----------
export function addGroceryCategory(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return { ok: false, error: "empty" };
  const exists = state.settings.groceryCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) return { ok: false, error: "duplicate" };
  state.settings.groceryCategories.push(trimmed);
  persist();
  return { ok: true };
}

export function renameGroceryCategory(oldName, newName) {
  const trimmed = (newName || "").trim();
  if (!trimmed) return { ok: false, error: "empty" };
  const duplicate = state.settings.groceryCategories.some(
    (c) => c !== oldName && c.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) return { ok: false, error: "duplicate" };
  const idx = state.settings.groceryCategories.indexOf(oldName);
  if (idx === -1) return { ok: false, error: "not-found" };
  state.settings.groceryCategories[idx] = trimmed;
  state.groceries.forEach((g) => {
    if (g.category === oldName) g.category = trimmed;
  });
  persist();
  return { ok: true };
}

export function deleteGroceryCategory(name, reassignTo) {
  const categories = state.settings.groceryCategories;
  if (categories.length <= 1) return { ok: false, error: "last-category" };
  const idx = categories.indexOf(name);
  if (idx === -1) return { ok: false, error: "not-found" };
  const itemsInCategory = state.groceries.filter((g) => g.category === name);
  if (itemsInCategory.length > 0) {
    const target =
      reassignTo && reassignTo !== name && categories.includes(reassignTo)
        ? reassignTo
        : categories.find((c) => c !== name && c === "Autres") || categories.find((c) => c !== name);
    itemsInCategory.forEach((g) => (g.category = target));
  }
  categories.splice(idx, 1);
  persist();
  return { ok: true };
}

// ---------- Notes (structurées en blocs, avec sous-notes) ----------
export function getNotes() {
  return state.notes;
}

export function getNote(id) {
  return state.notes.find((n) => n.id === id);
}

export function addNote(title = "Nouvelle note", parentId = null) {
  const note = {
    id: uid(),
    title: title.trim() || "Nouvelle note",
    parentId,
    favorite: false,
    tags: [],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: [],
  };
  state.notes.push(note);
  persist();
  return note;
}

export function updateNote(id, patch) {
  const n = state.notes.find((n) => n.id === id);
  if (n) {
    Object.assign(n, patch);
    n.updatedAt = Date.now();
  }
  persist();
}

export function toggleNoteFavorite(id) {
  const n = state.notes.find((n) => n.id === id);
  if (n) {
    n.favorite = !n.favorite;
    n.updatedAt = Date.now();
  }
  persist();
}

function collectDescendantIds(id) {
  const direct = state.notes.filter((n) => n.parentId === id).map((n) => n.id);
  return direct.reduce((acc, cid) => [...acc, cid, ...collectDescendantIds(cid)], []);
}

/**
 * Supprime une note. Si elle a des sous-notes, refuse par défaut (renvoie
 * has-children) tant que `cascade` n'est pas explicitement demandé par
 * l'appelant (après confirmation utilisateur) — pour éviter toute
 * suppression accidentelle d'une arborescence entière.
 */
export function deleteNote(id, { cascade = false } = {}) {
  const note = state.notes.find((n) => n.id === id);
  if (!note) return { ok: false, error: "not-found" };
  const children = state.notes.filter((n) => n.parentId === id);
  if (children.length > 0 && !cascade) {
    return { ok: false, error: "has-children", childCount: children.length };
  }
  const idsToDelete = new Set([id, ...collectDescendantIds(id)]);
  state.notes = state.notes.filter((n) => !idsToDelete.has(n.id));
  // retire les blocs "sous-note liée" qui pointaient vers une note supprimée
  state.notes.forEach((n) => {
    n.blocks = n.blocks.filter((b) => !(b.type === "childNote" && idsToDelete.has(b.noteId)));
  });
  persist();
  return { ok: true };
}

export function getChildNotes(parentId) {
  return state.notes.filter((n) => n.parentId === parentId);
}

/** Chaîne complète du fil d'Ariane, de la racine jusqu'à la note elle-même (incluse). */
export function getNoteAncestors(id) {
  const chain = [];
  let current = state.notes.find((n) => n.id === id);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? state.notes.find((n) => n.id === current.parentId) : null;
  }
  return chain;
}

/** Duplique une note (et ses blocs) comme note sœur, avec un nouveau titre. Les sous-notes ne sont pas dupliquées. */
export function duplicateNote(id) {
  const note = state.notes.find((n) => n.id === id);
  if (!note) return null;
  const copy = {
    id: uid(),
    title: `${note.title} (copie)`,
    parentId: note.parentId,
    favorite: false,
    tags: [...(note.tags || [])],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: note.blocks
      .filter((b) => b.type !== "childNote") // ne pas dupliquer les liens vers des sous-notes existantes
      .map((b) => ({ ...b, id: uid(), items: b.items ? b.items.map((i) => ({ ...i, id: uid() })) : undefined })),
  };
  state.notes.push(copy);
  persist();
  return copy;
}

/** Construit l'arborescence complète : [{ note, children: [...] }] à partir des racines (parentId null). */
export function getNoteTree() {
  const byParent = new Map();
  state.notes.forEach((n) => {
    const key = n.parentId || "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(n);
  });
  function build(parentKey) {
    return (byParent.get(parentKey) || [])
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((n) => ({ note: n, children: build(n.id) }));
  }
  return build("__root__");
}

/** Crée une sous-note et ajoute automatiquement un bloc "childNote" dans la note parente. */
export function addChildNote(parentId, title = "Nouvelle sous-note") {
  const note = addNote(title, parentId);
  const parent = state.notes.find((n) => n.id === parentId);
  if (parent) {
    parent.blocks.push({ id: uid(), type: "childNote", noteId: note.id });
    parent.updatedAt = Date.now();
    persist();
  }
  return note;
}

export function searchNotes(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return state.notes.filter((n) => {
    if (n.title.toLowerCase().includes(q)) return true;
    if ((n.tags || []).some((t) => t.toLowerCase().includes(q))) return true;
    return n.blocks.some((b) => blockTextContent(b).toLowerCase().includes(q));
  });
}

/** Texte "cherchable"/affichable d'un bloc, tous types confondus. */
export function blockTextContent(b) {
  switch (b.type) {
    case "paragraph":
    case "heading":
    case "subheading":
    case "callout":
      return b.content || "";
    case "bulletList":
      return (b.content || []).join(" · ");
    case "checklist":
      return (b.items || []).map((i) => i.text).join(" · ");
    case "toggle":
      return `${b.title || ""} ${b.content || ""}`.trim();
    default:
      return "";
  }
}

// ---------- Blocs de note ----------
export function addBlock(noteId, block) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;
  const newBlock = { id: uid(), ...block };
  note.blocks.push(newBlock);
  note.updatedAt = Date.now();
  persist();
  return newBlock;
}

export function updateBlock(noteId, blockId, patch) {
  const note = state.notes.find((n) => n.id === noteId);
  const block = note?.blocks.find((b) => b.id === blockId);
  if (block) {
    Object.assign(block, patch);
    note.updatedAt = Date.now();
  }
  persist();
}

export function deleteBlock(noteId, blockId) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;
  note.blocks = note.blocks.filter((b) => b.id !== blockId);
  note.updatedAt = Date.now();
  persist();
}

export function moveBlock(noteId, blockId, direction) {
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) return;
  const idx = note.blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return;
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= note.blocks.length) return;
  [note.blocks[idx], note.blocks[swapWith]] = [note.blocks[swapWith], note.blocks[idx]];
  note.updatedAt = Date.now();
  persist();
}

// ---------- Éléments de checklist (à l'intérieur d'un bloc "checklist") ----------
export function addChecklistItem(noteId, blockId, text) {
  const note = state.notes.find((n) => n.id === noteId);
  const block = note?.blocks.find((b) => b.id === blockId);
  if (!block) return;
  block.items = block.items || [];
  block.items.push({ id: uid(), text: text.trim(), checked: false });
  note.updatedAt = Date.now();
  persist();
}

export function toggleChecklistItem(noteId, blockId, itemId) {
  const note = state.notes.find((n) => n.id === noteId);
  const block = note?.blocks.find((b) => b.id === blockId);
  const item = block?.items?.find((i) => i.id === itemId);
  if (item) {
    item.checked = !item.checked;
    note.updatedAt = Date.now();
  }
  persist();
}

export function updateChecklistItem(noteId, blockId, itemId, text) {
  const note = state.notes.find((n) => n.id === noteId);
  const block = note?.blocks.find((b) => b.id === blockId);
  const item = block?.items?.find((i) => i.id === itemId);
  if (item) {
    item.text = text.trim();
    note.updatedAt = Date.now();
  }
  persist();
}

export function deleteChecklistItem(noteId, blockId, itemId) {
  const note = state.notes.find((n) => n.id === noteId);
  const block = note?.blocks.find((b) => b.id === blockId);
  if (block) {
    block.items = (block.items || []).filter((i) => i.id !== itemId);
    note.updatedAt = Date.now();
  }
  persist();
}

// ---------- Paramètres ----------
export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  persist();
}

export { uid, todayISO };
