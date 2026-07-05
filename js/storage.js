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
      { id: uid(), title: "Séance de sport", done: true, createdAt: Date.now() - 5000, category: "" },
      { id: uid(), title: "Appeler le client", done: false, createdAt: Date.now() - 4000, category: "" },
      { id: uid(), title: "Préparer présentation", done: false, createdAt: Date.now() - 3000, category: "" },
      { id: uid(), title: "Répondre aux emails", done: false, createdAt: Date.now() - 2000, category: "" },
      { id: uid(), title: "Lire 20 pages", done: false, createdAt: Date.now() - 1000, category: "" },
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
      { id: uid(), title: "Idées rapides", content: "", createdAt: Date.now() - 3000, updatedAt: Date.now() - 3000 },
      { id: uid(), title: "Rappels", content: "", createdAt: Date.now() - 2000, updatedAt: Date.now() - 2000 },
      { id: uid(), title: "À creuser", content: "", createdAt: Date.now() - 1000, updatedAt: Date.now() - 1000 },
    ],
    settings: {
      city: "",
      weatherEnabled: true,
      lastWeather: null,
    },
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return seedData();
    // fusion défensive avec les clés attendues, au cas où une version future ajoute des champs
    const seed = seedData();
    return {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...(parsed.settings || {}) },
    };
  } catch (e) {
    console.warn("Impossible de lire les données locales, réinitialisation.", e);
    return seedData();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
export function addTask(title, category = "") {
  const task = { id: uid(), title: title.trim(), done: false, createdAt: Date.now(), category };
  state.tasks.push(task);
  persist();
  return task;
}
export function toggleTask(id) {
  const t = state.tasks.find((t) => t.id === id);
  if (t) t.done = !t.done;
  persist();
}
export function updateTask(id, title) {
  const t = state.tasks.find((t) => t.id === id);
  if (t) t.title = title.trim();
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
export function updateGrocery(id, name) {
  const g = state.groceries.find((g) => g.id === id);
  if (g) g.name = name.trim();
  persist();
}
export function deleteGrocery(id) {
  state.groceries = state.groceries.filter((g) => g.id !== id);
  persist();
}

// ---------- Notes ----------
export function addNote(title = "Nouvelle note") {
  const note = { id: uid(), title, content: "", createdAt: Date.now(), updatedAt: Date.now() };
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
export function deleteNote(id) {
  state.notes = state.notes.filter((n) => n.id !== id);
  persist();
}

// ---------- Paramètres ----------
export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  persist();
}

export { uid, todayISO };
