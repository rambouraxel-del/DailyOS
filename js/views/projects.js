import { icon } from "../icons.js";
import { checkRow, sortByDoneThenDate, emptyState, escapeHTML } from "../components.js";

export function renderProjects(state, expandedId) {
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Projets</h1>
      <button class="btn-icon" data-action="open-add-modal" data-add-type="project">${icon("plus", { size: 20 })}</button>
    </div>

    ${
      state.projects.length
        ? state.projects.map((p) => projectRow(p, p.id === expandedId)).join("")
        : `<div class="glass-card" style="padding:30px 16px;">${emptyState("Aucun projet pour l'instant.")}</div>`
    }
  `;
}

function projectRow(project, expanded) {
  const doneCount = project.tasks.filter((t) => t.done).length;
  return `
    <div class="glass-card project-row ${expanded ? "expanded" : ""}" data-id="${project.id}">
      <div class="project-row-head" data-action="toggle-project" data-id="${project.id}">
        <span class="project-icon accent-${project.color}">${icon("folder", { size: 20 })}</span>
        <div class="project-info">
          <div class="project-name">${escapeHTML(project.name)}</div>
          <div class="project-meta">${project.tasks.length ? `${doneCount}/${project.tasks.length} tâches` : "Aucune tâche"}</div>
        </div>
        <button class="icon-btn-sm" data-action="rename-project" data-id="${project.id}" aria-label="Renommer">${icon("edit", { size: 16 })}</button>
        <button class="icon-btn-sm" data-action="delete-project" data-id="${project.id}" aria-label="Supprimer">${icon("trash", { size: 16 })}</button>
        <span class="project-chevron">${icon("chevronDown", { size: 18 })}</span>
      </div>
      ${expanded ? projectBody(project) : ""}
    </div>
  `;
}

function projectBody(project) {
  return `
    <div class="project-body">
      <div>
        <div class="project-body-label">Bloc-note</div>
        <textarea class="textarea" data-action="edit-project-notes" data-id="${project.id}" placeholder="Idées, réflexions, informations importantes…">${escapeHTML(project.notes)}</textarea>
      </div>
      <div>
        <div class="project-body-label">Liste de tâches</div>
        <form class="quick-add-row" data-action="add-project-task-form" data-id="${project.id}">
          <input class="input" name="title" placeholder="Ajouter une tâche…" required />
          <button type="submit" class="btn-icon">${icon("plus", { size: 18 })}</button>
        </form>
        <ul class="check-list">
          ${
            project.tasks.length
              ? sortByDoneThenDate(project.tasks.map((t) => ({ ...t, createdAt: t.createdAt || 0 })))
                  .map((t) =>
                    checkRow(t, {
                      toggle: `toggle-project-task|${project.id}`,
                      delete: `delete-project-task|${project.id}`,
                    })
                  )
                  .join("")
              : emptyState("Aucune tâche dans ce projet.")
          }
        </ul>
      </div>
    </div>
  `;
}
