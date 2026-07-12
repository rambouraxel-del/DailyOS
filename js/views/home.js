import { icon } from "../icons.js";
import { checkRow, sortByDoneThenDate, emptyState } from "../components.js";
import { formatFullDateFR, getISOWeekNumber, toISODate } from "../date-utils.js";
import { getWeather } from "../weather.js";
import * as store from "../storage.js";

const WEATHER_ICON_COLOR = {
  sun: "weather-icon",
};

export function renderHome(state) {
  const today = toISODate(new Date());
  const todaysTasks = sortByDoneThenDate(state.tasks);
  const doneCount = state.tasks.filter((t) => !t.done).length;
  const todaysEvents = state.events
    .filter((e) => e.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 4);

  const activeProjects = state.projects.length;
  const groceriesLeft = state.groceries.filter((g) => !g.done).length;

  return `
    <div class="home-header">
      <div>
        <h1>Bonjour Axel 👋</h1>
        <p>Prêt à organiser ta journée ?</p>
      </div>
      <button class="avatar" data-action="open-settings" aria-label="Paramètres">${icon("settings", { size: 20 })}</button>
    </div>

    <div class="glass-card date-weather-card">
      <div class="date-block">
        <span class="date-icon">${icon("calendar", { size: 20 })}</span>
        <div class="date-text">
          <div class="date-main">${formatFullDateFR(new Date())}</div>
          <div class="date-sub">Semaine ${getISOWeekNumber(new Date())}</div>
        </div>
      </div>
      <div id="weather-slot" class="weather-block">${weatherLoadingHTML()}</div>
    </div>

    <div class="home-grid">
      <div class="glass-card today-card" data-action="go-tasks">
        <div class="card-header-row">
          <h3>Ma to-do list</h3>
          <span class="badge badge-accent">${state.tasks.length} tâche${state.tasks.length > 1 ? "s" : ""}</span>
        </div>
        <ul class="check-list">
          ${
            todaysTasks.length
              ? todaysTasks
                  .slice(0, 6)
                  .map((t) => checkRow(t, { toggle: "toggle-task", delete: "delete-task" }))
                  .join("")
              : emptyState("Aucune tâche pour l'instant.")
          }
        </ul>
        <button class="btn-primary mt-16" data-action="open-add-modal" data-add-type="task">
          ${icon("plus", { size: 18 })} Ajouter une tâche
        </button>
      </div>

      <div class="glass-card planning-card" data-action="go-planning">
        <div class="card-header-row">
          <h3>Mon agenda</h3>
          <span class="badge">${todaysEvents.length}</span>
        </div>
        <div class="mini-event-list">
          ${
            todaysEvents.length
              ? todaysEvents.map(miniEvent).join("")
              : emptyState("Aucun événement aujourd'hui.")
          }
        </div>
      </div>
    </div>

    <div class="section">
      <div class="quick-grid">
        ${quickCard("tasks", "Tâches", `${doneCount} à faire`, "accent-violet", "go-tasks")}
        ${quickCard("projects", "Projets", `${activeProjects} projet${activeProjects > 1 ? "s" : ""}`, "accent-blue", "go-projects")}
        ${quickCard("groceries", "Courses", `${groceriesLeft} article${groceriesLeft > 1 ? "s" : ""}`, "accent-orange", "go-groceries")}
        ${quickCard("notes", "Notes", `${state.notes.length} note${state.notes.length > 1 ? "s" : ""}`, "accent-pink", "go-notes")}
        ${quickCard("learning", "Apprentissage", `${state.documents.length} document${state.documents.length > 1 ? "s" : ""}`, "accent-green", "go-learning")}
      </div>
    </div>
  `;
}

function quickCard(iconName, label, count, accentClass, navAction) {
  return `
    <button class="glass-card quick-card" data-action="${navAction}">
      <span class="quick-icon ${accentClass}">${icon(iconName, { size: 22 })}</span>
      <span class="quick-label">${label}</span>
      <span class="quick-count">${count}</span>
    </button>
  `;
}

function miniEvent(evt) {
  return `
    <div class="mini-event" data-action="go-planning">
      <span class="mini-event-time">${evt.startTime}</span>
      <span class="mini-event-dot dot-${evt.color}"></span>
      <span class="mini-event-title">${evt.title}</span>
    </div>
  `;
}

function weatherLoadingHTML() {
  return `<div class="weather-unavailable">Chargement…</div>`;
}

export async function loadWeatherInto(container, settings) {
  const result = await getWeather(settings);
  if (!container) return;
  if (result.error === "disabled") {
    container.innerHTML = `<div class="weather-unavailable">Météo désactivée</div>`;
    return;
  }
  if (result.error) {
    container.innerHTML = `
      <div class="weather-unavailable">
        Météo indisponible
        <button data-action="open-settings">Configurer une ville</button>
      </div>`;
    return;
  }
  store.updateSettings({ lastWeather: result });
  container.innerHTML = `
    <span class="weather-icon">${icon(result.icon, { size: 30 })}</span>
    <div>
      <div class="weather-temp">${result.temperature}°C</div>
      <div class="weather-label">${result.label}</div>
    </div>
  `;
}
