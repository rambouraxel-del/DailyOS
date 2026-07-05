import * as store from "./storage.js";
import { renderHome, loadWeatherInto } from "./views/home.js";
import { renderTasks } from "./views/tasks.js";
import { renderPlanning } from "./views/planning.js";
import { renderProjects } from "./views/projects.js";
import { renderGroceries } from "./views/groceries.js";
import { renderNotes, renderNoteDetail } from "./views/notes.js";
import * as modal from "./modal.js";
import { toISODate, addDays } from "./date-utils.js";

const viewRoot = document.getElementById("view-root");
const navItems = document.querySelectorAll(".nav-item[data-view]");

const ui = {
  view: "home",
  taskFilter: "all",
  planningDate: toISODate(new Date()),
  expandedProjectId: null,
  currentNoteId: null,
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
    attachNoteEditor();
  }
  if (ui.view === "projects" && ui.expandedProjectId) {
    attachProjectNotesAutosave();
  }
}

function buildViewHTML(state) {
  switch (ui.view) {
    case "home":
      return renderHome(state);
    case "tasks":
      return renderTasks(state, ui.taskFilter);
    case "planning":
      return renderPlanning(state, ui.planningDate);
    case "projects":
      return renderProjects(state, ui.expandedProjectId);
    case "groceries":
      return renderGroceries(state);
    case "notes":
      return renderNotes(state);
    case "note-detail": {
      const note = state.notes.find((n) => n.id === ui.currentNoteId);
      if (!note) {
        ui.view = "notes";
        return renderNotes(state);
      }
      return renderNoteDetail(note);
    }
    default:
      return renderHome(state);
  }
}

function updateNavActive() {
  navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === ui.view);
  });
}

function attachNoteEditor() {
  const titleInput = document.getElementById("note-title-input");
  const contentInput = document.getElementById("note-content-input");
  titleInput?.addEventListener("input", () => {
    store.updateNote(ui.currentNoteId, { title: titleInput.value });
  });
  contentInput?.addEventListener("input", () => {
    store.updateNote(ui.currentNoteId, { content: contentInput.value });
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

    case "open-add-modal": {
      const type = target.dataset.addType;
      if (type) {
        modal.openAddModalForType(type, ui.view === "planning" ? ui.planningDate : null);
      } else {
        modal.openAddModal(ui.view === "planning" ? ui.planningDate : null);
      }
      break;
    }
    case "open-add-event":
      modal.openEventModal(null, ui.planningDate);
      break;
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
      const value = prompt("Modifier la tâche :", t?.title || "");
      if (value !== null && value.trim()) {
        store.updateTask(id, value);
        render();
      }
      break;
    }
    case "filter-tasks":
      ui.taskFilter = target.dataset.filter;
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
    case "edit-grocery": {
      const g = store.getState().groceries.find((g) => g.id === id);
      const value = prompt("Modifier l'article :", g?.name || "");
      if (value !== null && value.trim()) {
        store.updateGrocery(id, value);
        render();
      }
      break;
    }

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
    case "delete-note":
      if (confirm("Supprimer cette note définitivement ?")) {
        store.deleteNote(id);
        navigate("notes");
      }
      break;

    case "prev-day":
      ui.planningDate = addDays(ui.planningDate, -1);
      render();
      break;
    case "next-day":
      ui.planningDate = addDays(ui.planningDate, 1);
      render();
      break;
  }
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
    if (input.value.trim()) {
      store.addGrocery(input.value);
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
