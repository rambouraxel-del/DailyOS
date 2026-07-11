// Modale d'ajout rapide ("+") + modale d'édition d'événement + modale Paramètres.

import { icon } from "./icons.js";
import * as store from "./storage.js";
import { toISODate } from "./date-utils.js";
import { escapeHTML, escapeAttrValue as escapeAttr } from "./components.js";
import { clearAppCacheAndPrepareUpdate, reloadFreshApp } from "./update.js";
import { APP_VERSION, BUILD_DATE } from "./version.js";

const overlay = document.getElementById("modal-overlay");
const sheet = document.getElementById("modal-sheet");

let onAfterChange = () => {};
export function setOnChange(cb) {
  onAfterChange = cb;
}

function open(html) {
  sheet.innerHTML = `<div class="modal-handle"></div>${html}`;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
}

export function closeModal() {
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden", "true");
}

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

const COLORS = [
  { key: "violet", label: "Violet" },
  { key: "blue", label: "Bleu" },
  { key: "green", label: "Vert" },
  { key: "orange", label: "Orange" },
  { key: "pink", label: "Rose" },
];

function colorPickerHTML(selected = "violet") {
  return `<div class="color-picker">${COLORS.map(
    (c) =>
      `<button type="button" class="color-swatch accent-${c.key} ${c.key === selected ? "selected" : ""}" data-color="${c.key}" aria-label="${c.label}"></button>`
  ).join("")}</div>`;
}

/* ---------- Étape 1 : choix du type ---------- */
export function openAddModal(defaultDate = null) {
  const types = [
    { type: "task", label: "Tâche", icon: "tasks", accent: "accent-violet" },
    { type: "event", label: "Événement", icon: "planning", accent: "accent-blue" },
    { type: "grocery", label: "Article", icon: "cart", accent: "accent-orange" },
    { type: "note", label: "Note", icon: "notes", accent: "accent-pink" },
    { type: "project", label: "Projet", icon: "folder", accent: "accent-green" },
  ];
  open(`
    <div class="modal-header">
      <h2>Ajouter</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <div class="type-grid">
      ${types
        .map(
          (t) => `
        <button type="button" class="type-choice" data-action="choose-add-type" data-type="${t.type}">
          <span class="quick-icon ${t.accent}">${icon(t.icon, { size: 20 })}</span>
          <span>${t.label}</span>
        </button>`
        )
        .join("")}
    </div>
  `);
  sheet.dataset.defaultDate = defaultDate || toISODate(new Date());
}

sheet?.addEventListener("click", (e) => {
  const chooseBtn = e.target.closest('[data-action="choose-add-type"]');
  if (chooseBtn) {
    renderFormFor(chooseBtn.dataset.type, null, sheet.dataset.defaultDate);
    return;
  }
  const colorBtn = e.target.closest(".color-swatch");
  if (colorBtn) {
    colorBtn.parentElement.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("selected"));
    colorBtn.classList.add("selected");
    return;
  }
  const renameCatBtn = e.target.closest('[data-action="rename-grocery-category"]');
  if (renameCatBtn) {
    handleRenameGroceryCategory(renameCatBtn.dataset.cat);
    return;
  }
  const deleteCatBtn = e.target.closest('[data-action="delete-grocery-category"]');
  if (deleteCatBtn) {
    handleDeleteGroceryCategory(deleteCatBtn.dataset.cat);
    return;
  }
  const blockTypeBtn = e.target.closest('[data-action="choose-block-type"]');
  if (blockTypeBtn) {
    handleChooseBlockType(blockTypeBtn.dataset.type, sheet.dataset.blockNoteId);
  }
});

function renderFormFor(type, existing, defaultDate) {
  if (type === "task") return taskForm(existing);
  if (type === "grocery") return groceryForm(existing);
  if (type === "note") return noteForm();
  if (type === "project") return projectForm();
  if (type === "event") return eventForm(existing, defaultDate);
}

function taskForm(existing) {
  const isEdit = !!existing;
  open(`
    <div class="modal-header">
      <h2>${isEdit ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Titre</label>
        <input class="input" name="title" placeholder="Ex : Appeler le dentiste" required autofocus value="${escapeAttr(existing?.title || "")}" />
      </div>
      <div class="field">
        <label>Deadline (optionnel)</label>
        <input class="input" type="date" name="deadline" value="${existing?.deadline || ""}" />
      </div>
      <div class="field">
        <label>Commentaire (optionnel)</label>
        <textarea class="textarea" name="comment" rows="2" placeholder="Ajouter un détail…">${escapeHTML(existing?.comment || "")}</textarea>
      </div>
      <div class="modal-actions">
        ${isEdit ? `<button type="button" class="btn-secondary" data-action="delete-task-in-modal" data-id="${existing.id}">${icon("trash", { size: 17 })} Supprimer</button>` : ""}
        <button type="submit" class="btn-primary">${icon(isEdit ? "check" : "plus", { size: 18 })} ${isEdit ? "Enregistrer" : "Ajouter la tâche"}</button>
      </div>
    </form>
  `);

  sheet.querySelector('[data-action="delete-task-in-modal"]')?.addEventListener("click", () => {
    store.deleteTask(existing.id);
    closeModal();
    onAfterChange();
  });

  bindSimpleForm((data) => {
    if (!data.title.trim()) return;
    const extra = { comment: data.comment || "", deadline: data.deadline || "" };
    if (isEdit) {
      store.updateTask(existing.id, { title: data.title, ...extra });
    } else {
      store.addTask(data.title, extra);
    }
  });
}

function groceryForm(existing) {
  const isEdit = !!existing;
  const categories = store.getState().settings.groceryCategories;
  const fallback = categories.includes("Autres") ? "Autres" : categories[0];
  const defaultCat = (existing?.category && categories.includes(existing.category)) ? existing.category : fallback;
  const options = categories
    .map((c) => `<option value="${escapeAttr(c)}" ${c === defaultCat ? "selected" : ""}>${escapeHTML(c)}</option>`)
    .join("");
  open(`
    <div class="modal-header">
      <h2>${isEdit ? "Modifier l'article" : "Nouvel article"}</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Article</label>
        <input class="input" name="title" placeholder="Ex : Bananes" required autofocus value="${escapeAttr(existing?.name || "")}" />
      </div>
      <div class="field">
        <label>Catégorie</label>
        <select class="input" name="category">${options}</select>
      </div>
      <div class="modal-actions">
        ${isEdit ? `<button type="button" class="btn-secondary" data-action="delete-grocery-in-modal" data-id="${existing.id}">${icon("trash", { size: 17 })} Supprimer</button>` : ""}
        <button type="submit" class="btn-primary">${icon(isEdit ? "check" : "plus", { size: 18 })} ${isEdit ? "Enregistrer" : "Ajouter l'article"}</button>
      </div>
    </form>
  `);

  sheet.querySelector('[data-action="delete-grocery-in-modal"]')?.addEventListener("click", () => {
    store.deleteGrocery(existing.id);
    closeModal();
    onAfterChange();
  });

  bindSimpleForm((data) => {
    if (!data.title.trim()) return;
    if (isEdit) {
      store.updateGrocery(existing.id, { name: data.title, category: data.category });
    } else {
      store.addGrocery(data.title, data.category);
    }
  });
}

export function openGroceryModal(existingGrocery) {
  groceryForm(existingGrocery);
}

/* ---------- Notes en blocs : ajout de bloc + idée rapide ---------- */
const BLOCK_TYPES = [
  { type: "paragraph", label: "Texte", icon: "paragraph" },
  { type: "heading", label: "Titre", icon: "heading" },
  { type: "subheading", label: "Sous-titre", icon: "subheading" },
  { type: "bulletList", label: "Liste", icon: "bulletList" },
  { type: "checklist", label: "Checklist", icon: "tasks" },
  { type: "callout", label: "Encadré", icon: "calloutInfo" },
  { type: "toggle", label: "Menu déroulant", icon: "toggleBlock" },
  { type: "childNote", label: "Sous-note", icon: "note" },
  { type: "divider", label: "Séparateur", icon: "divider" },
];

const BLOCK_DEFAULTS = {
  paragraph: { content: "" },
  heading: { content: "" },
  subheading: { content: "" },
  bulletList: { content: [""] },
  checklist: { items: [] },
  callout: { variant: "info", content: "" },
  toggle: { title: "", content: "", open: true },
  divider: {},
};

export function openAddBlockModal(noteId) {
  open(`
    <div class="modal-header">
      <h2>Ajouter un bloc</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <div class="type-grid">
      ${BLOCK_TYPES.map(
        (t) => `
        <button type="button" class="type-choice" data-action="choose-block-type" data-type="${t.type}">
          <span class="quick-icon accent-violet">${icon(t.icon, { size: 20 })}</span>
          <span>${t.label}</span>
        </button>`
      ).join("")}
    </div>
  `);
  sheet.dataset.blockNoteId = noteId;
}

function handleChooseBlockType(type, noteId) {
  if (type === "childNote") {
    const title = prompt("Titre de la sous-note :", "Nouvelle sous-note");
    if (title === null) return;
    store.addChildNote(noteId, title.trim() || "Nouvelle sous-note");
  } else {
    store.addBlock(noteId, { type, ...(BLOCK_DEFAULTS[type] || {}) });
  }
  closeModal();
  onAfterChange();
}

export function openQuickIdeaModal() {
  open(`
    <div class="modal-header">
      <h2>Idée rapide</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Ton idée</label>
        <textarea class="textarea" name="idea" rows="4" placeholder="Écris ton idée, on s'occupe du rangement…" required autofocus></textarea>
      </div>
      <button type="submit" class="btn-primary">${icon("plus", { size: 18 })} Capturer l'idée</button>
    </form>
  `);
  bindSimpleForm((data) => {
    const text = data.idea.trim();
    if (!text) return;
    const words = text.split(/\s+/);
    const title = words.slice(0, 6).join(" ") + (words.length > 6 ? "…" : "");
    const note = store.addNote(title || "Idée rapide");
    store.addBlock(note.id, { type: "paragraph", content: text });
    store.updateNote(note.id, { tags: ["idée"] });
  });
}

function noteForm() {
  open(`
    <div class="modal-header">
      <h2>Nouvelle note</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Titre</label>
        <input class="input" name="title" placeholder="Ex : Idées de cadeaux" required autofocus />
      </div>
      <button type="submit" class="btn-primary">${icon("plus", { size: 18 })} Créer la note</button>
    </form>
  `);
  bindSimpleForm((data) => {
    if (!data.title.trim()) return;
    store.addNote(data.title);
  });
}

function projectForm() {
  open(`
    <div class="modal-header">
      <h2>Nouveau projet</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Nom du projet</label>
        <input class="input" name="title" placeholder="Ex : Rénovation" required autofocus />
      </div>
      <div class="field">
        <label>Couleur</label>
        ${colorPickerHTML("violet")}
      </div>
      <button type="submit" class="btn-primary">${icon("plus", { size: 18 })} Créer le projet</button>
    </form>
  `);
  bindSimpleForm((data) => {
    if (!data.title.trim()) return;
    const color = sheet.querySelector(".color-swatch.selected")?.dataset.color || "violet";
    store.addProject(data.title, color);
  });
}

function eventForm(existing, defaultDate) {
  const isEdit = !!existing;
  open(`
    <div class="modal-header">
      <h2>${isEdit ? "Modifier l'événement" : "Nouvel événement"}</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Titre</label>
        <input class="input" name="title" placeholder="Ex : Réunion équipe" required autofocus value="${escapeAttr(existing?.title || "")}" />
      </div>
      <div class="field">
        <label>Date</label>
        <input class="input" type="date" name="date" value="${existing?.date || defaultDate}" required />
      </div>
      <div class="input-row field">
        <div style="flex:1">
          <label>Début</label>
          <input class="input" type="time" name="startTime" value="${existing?.startTime || "09:00"}" required />
        </div>
        <div style="flex:1">
          <label>Fin (optionnel)</label>
          <input class="input" type="time" name="endTime" value="${existing?.endTime || ""}" />
        </div>
      </div>
      <div class="field">
        <label>Couleur</label>
        ${colorPickerHTML(existing?.color || "violet")}
      </div>
      <div class="field">
        <label>Description (optionnel)</label>
        <textarea class="textarea" name="description" rows="2">${existing?.description || ""}</textarea>
      </div>
      <div class="modal-actions">
        ${isEdit ? `<button type="button" class="btn-secondary" data-action="delete-event-in-modal" data-id="${existing.id}">${icon("trash", { size: 17 })} Supprimer</button>` : ""}
        <button type="submit" class="btn-primary">${icon("check", { size: 18 })} ${isEdit ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </form>
  `);

  sheet.querySelector('[data-action="delete-event-in-modal"]')?.addEventListener("click", () => {
    store.deleteEvent(existing.id);
    closeModal();
    onAfterChange();
  });

  bindSimpleForm((data) => {
    if (!data.title.trim() || !data.date || !data.startTime) return;
    const color = sheet.querySelector(".color-swatch.selected")?.dataset.color || "violet";
    const payload = {
      title: data.title,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      color,
      description: data.description,
    };
    if (isEdit) {
      store.updateEvent(existing.id, payload);
    } else {
      store.addEvent(payload);
    }
  });
}

export function openEventModal(existingEvent, defaultDate) {
  eventForm(existingEvent, defaultDate);
}

export function openTaskModal(existingTask) {
  taskForm(existingTask);
}

export function openAddModalForType(type, defaultDate = null) {
  renderFormFor(type, null, defaultDate || toISODate(new Date()));
}

function bindSimpleForm(onSubmit) {
  const form = sheet.querySelector("#quick-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    onSubmit(data);
    closeModal();
    onAfterChange();
  });
}

/* ---------- Personnaliser les catégories de courses ---------- */
export function openGroceryCategoriesModal() {
  const categories = store.getState().settings.groceryCategories;
  open(`
    <div class="modal-header">
      <h2>Catégories de courses</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <div class="glass-card" style="padding: 6px 16px; margin-bottom: 16px;">
      <ul class="check-list">
        ${categories
          .map(
            (cat) => `
          <li class="check-row">
            <span class="check-row-label">${escapeHTML(cat)}</span>
            <span class="check-row-actions">
              <button class="icon-btn-sm" data-action="rename-grocery-category" data-cat="${escapeAttr(cat)}" aria-label="Renommer">${icon("edit", { size: 16 })}</button>
              <button class="icon-btn-sm" data-action="delete-grocery-category" data-cat="${escapeAttr(cat)}" aria-label="Supprimer">${icon("trash", { size: 16 })}</button>
            </span>
          </li>`
          )
          .join("")}
      </ul>
    </div>
    <form id="add-category-form" class="quick-add-row">
      <input class="input" name="name" placeholder="Nouvelle catégorie…" required />
      <button type="submit" class="btn-icon">${icon("plus", { size: 20 })}</button>
    </form>
    <p class="settings-app-status" id="category-modal-status" aria-live="polite"></p>
  `);

  sheet.querySelector("#add-category-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[name="name"]');
    const result = store.addGroceryCategory(input.value);
    if (!result.ok) {
      showCategoryStatus(result.error === "duplicate" ? "Cette catégorie existe déjà." : "Le nom ne peut pas être vide.");
      return;
    }
    onAfterChange();
    openGroceryCategoriesModal();
  });
}

function showCategoryStatus(message) {
  const statusEl = sheet.querySelector("#category-modal-status");
  if (statusEl) statusEl.textContent = message;
}

function handleRenameGroceryCategory(cat) {
  const value = prompt("Renommer la catégorie :", cat);
  if (value === null) return;
  const result = store.renameGroceryCategory(cat, value);
  if (!result.ok) {
    if (result.error === "duplicate") alert("Une catégorie porte déjà ce nom.");
    else if (result.error === "empty") alert("Le nom ne peut pas être vide.");
    return;
  }
  onAfterChange();
  openGroceryCategoriesModal();
}

function handleDeleteGroceryCategory(cat) {
  const categories = store.getState().settings.groceryCategories;
  if (categories.length <= 1) {
    alert("Il doit toujours rester au moins une catégorie.");
    return;
  }
  const count = store.getState().groceries.filter((g) => g.category === cat).length;
  let target = null;
  if (count > 0) {
    const others = categories.filter((c) => c !== cat);
    const defaultTarget = others.includes("Autres") ? "Autres" : others[0];
    const choice = prompt(
      `"${cat}" contient ${count} article${count > 1 ? "s" : ""}. Vers quelle catégorie les déplacer ?\n(${others.join(", ")})`,
      defaultTarget
    );
    if (choice === null) return;
    target = others.find((c) => c.toLowerCase() === choice.trim().toLowerCase()) || defaultTarget;
  } else if (!confirm(`Supprimer la catégorie "${cat}" ?`)) {
    return;
  }
  const result = store.deleteGroceryCategory(cat, target);
  if (!result.ok) return;
  onAfterChange();
  openGroceryCategoriesModal();
}

/* ---------- Paramètres ---------- */
export function openSettingsModal() {
  const s = store.getState().settings;
  open(`
    <div class="modal-header">
      <h2>Paramètres</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <div class="field">
      <label>Ville (pour la météo, si la localisation est refusée)</label>
      <input class="input" id="settings-city" placeholder="Ex : Lyon" value="${escapeAttr(s.city || "")}" />
    </div>
    <div class="switch-row field">
      <label style="margin:0">Activer la météo</label>
      <button type="button" class="switch ${s.weatherEnabled ? "on" : ""}" id="settings-weather-toggle">
        <span class="switch-knob"></span>
      </button>
    </div>
    <button class="btn-primary" id="settings-save">${icon("check", { size: 18 })} Enregistrer</button>
    <div class="confirm-inline">
      <p>Réinitialiser toutes les données de l'application (tâches, planning, projets, courses, notes).</p>
      <button class="btn-danger-text" id="settings-reset">${icon("trash", { size: 16 })} Réinitialiser les données</button>
    </div>

    <div class="project-body">
      <div>
        <div class="project-body-label">Application</div>
        <p class="settings-app-text">
          Si l'application semble bloquée sur une ancienne version, tu peux vider le cache applicatif
          et recharger la dernière version. Tes données personnelles seront conservées.
        </p>
        <button class="btn-secondary" id="settings-update-btn" style="width:100%; justify-content:center;">
          ${icon("refresh", { size: 17 })} Vider le cache et mettre à jour
        </button>
        <p class="settings-app-subtext">Les tâches, projets, notes, courses et événements ne seront pas supprimés.</p>
        <p class="settings-app-status" id="settings-update-status" aria-live="polite"></p>
        <p class="settings-version">Version ${APP_VERSION} · Build ${BUILD_DATE}</p>
      </div>
    </div>
  `);

  let weatherEnabled = s.weatherEnabled;
  const toggle = sheet.querySelector("#settings-weather-toggle");
  toggle.addEventListener("click", () => {
    weatherEnabled = !weatherEnabled;
    toggle.classList.toggle("on", weatherEnabled);
  });

  sheet.querySelector("#settings-save").addEventListener("click", () => {
    const city = sheet.querySelector("#settings-city").value.trim();
    store.updateSettings({ city, weatherEnabled, lastWeather: null });
    closeModal();
    onAfterChange();
  });

  sheet.querySelector("#settings-reset").addEventListener("click", () => {
    if (confirm("Toutes tes données locales seront supprimées définitivement. Continuer ?")) {
      store.resetAll();
      closeModal();
      onAfterChange();
    }
  });

  const updateBtn = sheet.querySelector("#settings-update-btn");
  const updateStatus = sheet.querySelector("#settings-update-status");
  updateBtn.addEventListener("click", async () => {
    updateBtn.disabled = true;
    updateBtn.style.opacity = "0.6";
    updateStatus.textContent = "Mise à jour…";
    try {
      // Ne vide que le Cache Storage / service worker : les données
      // utilisateur en localStorage ne sont jamais touchées par cette action.
      await clearAppCacheAndPrepareUpdate();
      updateStatus.textContent = "Cache vidé, rechargement…";
      setTimeout(reloadFreshApp, 500);
    } catch (err) {
      console.warn("Échec de la mise à jour du cache :", err);
      updateStatus.textContent =
        "Impossible de vider le cache automatiquement. Essaie de fermer puis rouvrir l'application.";
      updateBtn.disabled = false;
      updateBtn.style.opacity = "";
    }
  });
}
