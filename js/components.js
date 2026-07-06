// Petits fragments HTML réutilisés entre plusieurs vues.

import { icon } from "./icons.js";
import { formatDeadline } from "./date-utils.js";

/**
 * Ligne cochable générique (tâche, article de courses, tâche de projet).
 * data-action de bascule/suppression/édition paramétrables par le contexte appelant.
 * `comment` et `deadline` sont optionnels : absents pour les articles/tâches
 * de projet, ils n'affichent alors simplement aucun indicateur.
 */
export function checkRow({ id, title, done, comment, deadline }, actions) {
  const deadlineText = formatDeadline(deadline);
  const hasMeta = Boolean(comment?.trim()) || Boolean(deadlineText);
  return `
    <li class="check-row ${done ? "done" : ""}" data-id="${id}">
      <button class="checkbox ${done ? "checked" : ""}" data-action="${actions.toggle}" data-id="${id}" aria-label="Cocher">
        ${done ? icon("check", { size: 14 }) : ""}
      </button>
      <div class="check-row-main">
        <span class="check-row-label">${escapeHTML(title)}</span>
        ${
          hasMeta
            ? `<div class="check-row-meta">
                ${comment?.trim() ? `<span class="check-row-comment" title="${escapeHTML(comment)}">💬</span>` : ""}
                ${deadlineText ? `<span class="check-row-deadline">${deadlineText}</span>` : ""}
              </div>`
            : ""
        }
      </div>
      <span class="check-row-actions">
        ${actions.edit ? `<button class="icon-btn-sm" data-action="${actions.edit}" data-id="${id}" aria-label="Modifier">${icon("edit", { size: 16 })}</button>` : ""}
        <button class="icon-btn-sm" data-action="${actions.delete}" data-id="${id}" aria-label="Supprimer">${icon("trash", { size: 16 })}</button>
      </span>
    </li>
  `;
}

export function sortByDoneThenDate(items) {
  return [...items].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

/**
 * Tri dédié à la vue Tâches : les tâches terminées restent toujours en bas,
 * quel que soit le critère choisi pour les tâches actives.
 */
export function sortTasks(items, sortBy = "created") {
  const active = items.filter((t) => !t.done);
  const done = items.filter((t) => t.done);

  if (sortBy === "deadline") {
    active.sort((a, b) => {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  } else {
    active.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }
  done.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return [...active, ...done];
}

export function escapeHTML(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

export function emptyState(text) {
  return `<div class="empty-state">${escapeHTML(text)}</div>`;
}
