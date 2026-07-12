import * as store from "./storage.js";
import { renderHome, loadWeatherInto } from "./views/home.js";
import { renderTasks } from "./views/tasks.js";
import { renderPlanning } from "./views/planning.js";
import { renderProjects } from "./views/projects.js";
import { renderGroceries } from "./views/groceries.js";
import { renderNotes } from "./views/notes.js";
import { renderNoteDetail, attachNoteEditorAutosave } from "./views/notes-editor.js";
import { renderNotesTree } from "./views/notes-tree.js";
import { renderNotesMindMap } from "./views/notes-mindmap.js";
import { renderLearning } from "./views/learning.js";
import * as modal from "./modal.js";
import { toISODate, addDays } from "./date-utils.js";

const viewRoot = document.getElementById("view-root");
const navItems = document.querySelectorAll(".nav-item[data-view]");

const ui = {
  view: "home",
  taskFilter: "all",
  taskSort: "created",
  planningDate: toISODate(new Date()),
  agendaMode: "day",
  expandedProjectId: null,
  currentNoteId: null,
  lastGroceryCategory: "Autres",
  notesSearchQuery: "",
  notesFilter: "all",
  treeCollapsed: new Set(),
  mindMapRootId: null,
  editingDocId: null,
};

function navigate(view, opts = {}) {
  ui.view = view;
  if (opts.reset !== false) {
    if (view !== "projects") ui.expandedProjectId = null;
  }
  Object.assign(ui, opts);
  render();
}

function render() {
  const state = store.getState();
  viewRoot.innerHTML = buildViewHTML(state);
  updateNavActive();
  viewRoot.scrollTop = 0;

  if (ui.view === "home") {
    loadWeatherInto(document.getElementById("weather-slot"), state.settings);
  }
  if (ui.view === "note-detail") {
    attachNoteEditorAutosave(viewRoot, ui.currentNoteId);
  }
  if (ui.view === "notes") {
    attachNotesSearch();
  }
  if (ui.view === "projects" && ui.expandedProjectId) {
    attachProjectNotesAutosave();
  }
  if (ui.view === "learning") {
    attachLearningHandlers();
  }
}

function buildViewHTML(state) {
  switch (ui.view) {
    case "home":
      return renderHome(state);
    case "tasks":
      return renderTasks(state, ui.taskFilter, ui.taskSort);
    case "planning":
      return renderPlanning(state, ui.planningDate, ui.agendaMode);
    case "projects":
      return renderProjects(state, ui.expandedProjectId);
    case "groceries":
      return renderGroceries(state, ui.lastGroceryCategory);
    case "notes":
      return renderNotes(state, { searchQuery: ui.notesSearchQuery, filter: ui.notesFilter });
    case "note-detail": {
      const note = state.notes.find((n) => n.id === ui.currentNoteId);
      if (!note) {
        ui.view = "notes";
        return renderNotes(state, { searchQuery: ui.notesSearchQuery, filter: ui.notesFilter });
      }
      return renderNoteDetail(note, state);
    }
    case "notes-tree":
      return renderNotesTree(state, ui.treeCollapsed);
    case "notes-mindmap":
      return renderNotesMindMap(state, ui.mindMapRootId);
    case "learning":
      return renderLearning(state, ui.editingDocId);
    default:
      return renderHome(state);
  }
}

function updateNavActive() {
  navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === ui.view);
  });
}

function attachNotesSearch() {
  const input = document.getElementById("notes-search-input");
  input?.addEventListener("input", () => {
    ui.notesSearchQuery = input.value;
    render();
    const freshInput = document.getElementById("notes-search-input");
    if (freshInput) {
      freshInput.focus();
      const pos = freshInput.value.length;
      freshInput.setSelectionRange(pos, pos);
    }
  });
}

function attachLearningHandlers() {
  const fileInput = document.getElementById("doc-file-input");
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const name = file.name.replace(/\.[^.]+$/, "");
        store.addDocument({ name, fileName: file.name, mimeType: file.type, dataUrl: reader.result });
        render();
      } catch (err) {
        alert("Impossible d'importer ce fichier (trop volumineux pour le stockage local).");
      }
    };
    reader.readAsDataURL(file);
  });
}

function attachProjectNotesAutosave() {
  const textarea = viewRoot.querySelector('[data-action="edit-project-notes"]');
  textarea?.addEventListener("input", () => {
    store.updateProject(ui.expandedProjectId, { notes: textarea.value });
  });
}

/* ---------- Délégation des clics ---------- */
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const [action, extraId] = target.dataset.action.split("|");
  const id = target.dataset.id;

  switch (action) {
    case "go-home":
      navigate("home");
      break;
    case "go-tasks":
      navigate("tasks");
      break;
    case "go-planning":
      navigate("planning");
      break;
    case "go-projects":
      navigate("projects");
      break;
    case "go-groceries":
      navigate("groceries");
      break;
    case "go-notes":
      navigate("notes");
      break;
    case "go-learning":
      navigate("learning");
      break;

    case "open-add-modal": {
      const type = target.dataset.addType;
      if (type) {
        modal.openAddModalForType(type, ui.view === "planning" ? ui.planningDate : null);
      } else {
        modal.openAddModal(ui.view === "planning" ? ui.planningDate : null);
      }
      break;
    }
    case "open-add-event": {
      const date = target.dataset.date || ui.planningDate;
      modal.openEventModal(null, date);
      break;
    }
    case "edit-event": {
      const evt = store.getState().events.find((e) => e.id === id);
      if (evt) modal.openEventModal(evt, evt.date);
      break;
    }
    case "close-modal":
      modal.closeModal();
      break;
    case "open-settings":
      modal.openSettingsModal();
      break;

    case "toggle-task":
      store.toggleTask(id);
      render();
      break;
    case "delete-task":
      store.deleteTask(id);
      render();
      break;
    case "edit-task": {
      const t = store.getState().tasks.find((t) => t.id === id);
      if (t) modal.openTaskModal(t);
      break;
    }
    case "filter-tasks":
      ui.taskFilter = target.dataset.filter;
      render();
      break;
    case "sort-tasks":
      ui.taskSort = target.dataset.sort;
      render();
      break;

    case "toggle-grocery":
      store.toggleGrocery(id);
      render();
      break;
    case "delete-grocery":
      store.deleteGrocery(id);
      render();
      break;

    case "toggle-project":
      ui.expandedProjectId = ui.expandedProjectId === id ? null : id;
      render();
      break;
    case "rename-project": {
      const p = store.getState().projects.find((p) => p.id === id);
      const value = prompt("Renommer le projet :", p?.name || "");
      if (value !== null && value.trim()) {
        store.updateProject(id, { name: value.trim() });
        render();
      }
      break;
    }
    case "delete-project": {
      if (confirm("Supprimer ce projet et tout son contenu ?")) {
        store.deleteProject(id);
        if (ui.expandedProjectId === id) ui.expandedProjectId = null;
        render();
      }
      break;
    }
    case "toggle-project-task":
      store.toggleProjectTask(extraId, id);
      render();
      break;
    case "delete-project-task":
      store.deleteProjectTask(extraId, id);
      render();
      break;

    case "open-note":
      navigate("note-detail", { currentNoteId: id });
      break;
    case "delete-note": {
      const note = store.getNote(id);
      if (!note) break;
      const parentId = note.parentId;
      let result = store.deleteNote(id);
      if (!result.ok && result.error === "has-children") {
        const msg = `Cette note contient ${result.childCount} sous-note${result.childCount > 1 ? "s" : ""}. Supprimer cette note supprimera aussi ses sous-notes. Continuer ?`;
        if (!confirm(msg)) break;
        result = store.deleteNote(id, { cascade: true });
      }
      if (result.ok) {
        navigate(parentId ? "note-detail" : "notes", parentId ? { currentNoteId: parentId } : {});
      }
      break;
    }
    case "duplicate-note": {
      const copy = store.duplicateNote(id);
      if (copy) navigate("note-detail", { currentNoteId: copy.id });
      break;
    }
    case "toggle-note-favorite":
      store.toggleNoteFavorite(id);
      render();
      break;
    case "filter-notes":
      ui.notesFilter = target.dataset.filter;
      render();
      break;
    case "go-notes-tree":
      navigate("notes-tree");
      break;
    case "go-notes-mindmap":
      navigate("notes-mindmap");
      break;
    case "toggle-tree-node":
      if (ui.treeCollapsed.has(id)) ui.treeCollapsed.delete(id);
      else ui.treeCollapsed.add(id);
      render();
      break;
    case "set-mindmap-root":
      ui.mindMapRootId = id || null;
      render();
      break;
    case "open-quick-idea":
      modal.openQuickIdeaModal();
      break;

    case "open-add-block":
      modal.openAddBlockModal(id);
      break;
    case "move-block-up":
      store.moveBlock(target.dataset.noteId, target.dataset.blockId, "up");
      render();
      break;
    case "move-block-down":
      store.moveBlock(target.dataset.noteId, target.dataset.blockId, "down");
      render();
      break;
    case "delete-block":
      store.deleteBlock(target.dataset.noteId, target.dataset.blockId);
      render();
      break;
    case "toggle-block-open": {
      const { noteId, blockId } = target.dataset;
      const block = store.getNote(noteId)?.blocks.find((b) => b.id === blockId);
      if (block) {
        store.updateBlock(noteId, blockId, { open: block.open === false });
        render();
      }
      break;
    }
    case "toggle-checklist-item":
      store.toggleChecklistItem(target.dataset.noteId, target.dataset.blockId, target.dataset.itemId);
      render();
      break;
    case "delete-checklist-item":
      store.deleteChecklistItem(target.dataset.noteId, target.dataset.blockId, target.dataset.itemId);
      render();
      break;
    case "add-bullet-item": {
      const { noteId, blockId } = target.dataset;
      const block = store.getNote(noteId)?.blocks.find((b) => b.id === blockId);
      if (block) {
        store.updateBlock(noteId, blockId, { content: [...(block.content || []), ""] });
        render();
      }
      break;
    }
    case "delete-bullet-item": {
      const { noteId, blockId, index } = target.dataset;
      const block = store.getNote(noteId)?.blocks.find((b) => b.id === blockId);
      if (block) {
        const content = (block.content || []).filter((_, i) => i !== Number(index));
        store.updateBlock(noteId, blockId, { content });
        render();
      }
      break;
    }

    case "prev-day":
      ui.planningDate = addDays(ui.planningDate, -1);
      render();
      break;
    case "next-day":
      ui.planningDate = addDays(ui.planningDate, 1);
      render();
      break;
    case "prev-week":
      ui.planningDate = addDays(ui.planningDate, -7);
      render();
      break;
    case "next-week":
      ui.planningDate = addDays(ui.planningDate, 7);
      render();
      break;
    case "set-agenda-mode":
      ui.agendaMode = target.dataset.mode;
      render();
      break;

    case "trigger-doc-import":
      document.getElementById("doc-file-input")?.click();
      break;
    case "toggle-doc-read":
      store.toggleDocumentRead(id);
      render();
      break;
    case "delete-document":
      if (confirm("Supprimer ce document ?")) {
        store.deleteDocument(id);
        render();
      }
      break;
    case "edit-document":
      ui.editingDocId = id;
      render();
      break;
    case "cancel-edit-document":
      ui.editingDocId = null;
      render();
      break;
    case "save-document": {
      const nameInput = document.getElementById(`doc-name-${id}`);
      const descInput = document.getElementById(`doc-desc-${id}`);
      store.updateDocument(id, { name: nameInput.value.trim() || "Document", description: descInput.value });
      ui.editingDocId = null;
      render();
      break;
    }
    case "open-document": {
      const doc = store.getDocuments().find((d) => d.id === id);
      if (doc) modal.openDocumentPreview(doc);
      break;
    }

    case "open-grocery-categories":
      modal.openGroceryCategoriesModal();
      break;
    case "edit-grocery": {
      const g = store.getState().groceries.find((g) => g.id === id);
      if (g) modal.openGroceryModal(g);
      break;
    }
  }
});

/* ---------- Délégation des changements (select) ---------- */
document.addEventListener("change", (e) => {
  const target = e.target.closest('[data-action="set-callout-variant"]');
  if (!target) return;
  store.updateBlock(target.dataset.noteId, target.dataset.blockId, { variant: target.value });
  render();
});

/* ---------- Délégation des soumissions de formulaire ---------- */
document.addEventListener("submit", (e) => {
  if (e.target.id === "add-task-form") {
    e.preventDefault();
    const input = e.target.querySelector('input[name="title"]');
    if (input.value.trim()) {
      store.addTask(input.value);
      render();
    }
  } else if (e.target.id === "add-grocery-form") {
    e.preventDefault();
    const input = e.target.querySelector('input[name="title"]');
    const categorySelect = e.target.querySelector('select[name="category"]');
    if (input.value.trim()) {
      const category = categorySelect?.value || "Autres";
      ui.lastGroceryCategory = category;
      store.addGrocery(input.value, category);
      render();
    }
  } else if (e.target.dataset.action === "add-project-task-form") {
    e.preventDefault();
    const input = e.target.querySelector('input[name="title"]');
    const projectId = e.target.dataset.id;
    if (input.value.trim()) {
      store.addProjectTask(projectId, input.value);
      render();
    }
  } else if (e.target.dataset.action === "add-checklist-item-form") {
    e.preventDefault();
    const input = e.target.querySelector('input[name="text"]');
    const { noteId, blockId } = e.target.dataset;
    if (input.value.trim()) {
      store.addChecklistItem(noteId, blockId, input.value);
      render();
    }
  }
});

modal.setOnChange(render);

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((err) => {
      console.warn("Enregistrement du service worker impossible :", err);
    });
  });
}

render();
