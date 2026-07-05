// Modale d'ajout rapide ("+") + modale d'édition d'événement + modale Paramètres.

import { icon } from "./icons.js";
import * as store from "./storage.js";
import { toISODate } from "./date-utils.js";

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
  }
});

function renderFormFor(type, existing, defaultDate) {
  if (type === "task") return taskForm(existing);
  if (type === "grocery") return groceryForm(existing);
  if (type === "note") return noteForm();
  if (type === "project") return projectForm();
  if (type === "event") return eventForm(existing, defaultDate);
}

function taskForm() {
  open(`
    <div class="modal-header">
      <h2>Nouvelle tâche</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Titre</label>
        <input class="input" name="title" placeholder="Ex : Appeler le dentiste" required autofocus />
      </div>
      <button type="submit" class="btn-primary">${icon("plus", { size: 18 })} Ajouter la tâche</button>
    </form>
  `);
  bindSimpleForm((data) => {
    if (!data.title.trim()) return;
    store.addTask(data.title);
  });
}

function groceryForm() {
  open(`
    <div class="modal-header">
      <h2>Nouvel article</h2>
      <button class="btn-icon" data-action="close-modal">${icon("close", { size: 18 })}</button>
    </div>
    <form id="quick-form">
      <div class="field">
        <label>Article</label>
        <input class="input" name="title" placeholder="Ex : Bananes" required autofocus />
      </div>
      <div class="field">
        <label>Catégorie</label>
        <select class="input" name="category">
          <option value="Fruits & légumes">Fruits & légumes</option>
          <option value="Frais">Frais</option>
          <option value="Épicerie">Épicerie</option>
          <option value="Autres" selected>Autres</option>
        </select>
      </div>
      <button type="submit" class="btn-primary">${icon("plus", { size: 18 })} Ajouter l'article</button>
    </form>
  `);
  bindSimpleForm((data) => {
    if (!data.title.trim()) return;
    store.addGrocery(data.title, data.category);
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

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;");
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
}
