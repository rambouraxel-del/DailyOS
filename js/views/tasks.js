import { icon } from "../icons.js";
import { checkRow, sortByDoneThenDate, emptyState } from "../components.js";

export function renderTasks(state, filter = "all") {
  const sorted = sortByDoneThenDate(state.tasks);
  const filtered = sorted.filter((t) => {
    if (filter === "active") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });
  const remaining = state.tasks.filter((t) => !t.done).length;

  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Tâches</h1>
      <span class="badge badge-accent">${remaining} à faire</span>
    </div>

    <form id="add-task-form" class="quick-add-row">
      <input class="input" name="title" placeholder="Ajouter une tâche…" required />
      <button type="submit" class="btn-icon">${icon("plus", { size: 20 })}</button>
    </form>

    <div class="segmented">
      <button data-action="filter-tasks" data-filter="all" class="${filter === "all" ? "active" : ""}">Toutes</button>
      <button data-action="filter-tasks" data-filter="active" class="${filter === "active" ? "active" : ""}">À faire</button>
      <button data-action="filter-tasks" data-filter="done" class="${filter === "done" ? "active" : ""}">Terminées</button>
    </div>

    <div class="glass-card" style="padding: 6px 16px;">
      <ul class="check-list">
        ${
          filtered.length
            ? filtered.map((t) => checkRow(t, { toggle: "toggle-task", edit: "edit-task", delete: "delete-task" })).join("")
            : emptyState("Aucune tâche ici.")
        }
      </ul>
    </div>
  `;
}
