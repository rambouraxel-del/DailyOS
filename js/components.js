// Petits fragments HTML réutilisés entre plusieurs vues.

import { icon } from "./icons.js";

/**
 * Ligne cochable générique (tâche, article de courses, tâche de projet).
 * data-action de bascule/suppression/édition paramétrables par le contexte appelant.
 */
export function checkRow({ id, title, done }, actions) {
  return `
    <li class="check-row ${done ? "done" : ""}" data-id="${id}">
      <button class="checkbox ${done ? "checked" : ""}" data-action="${actions.toggle}" data-id="${id}" aria-label="Cocher">
        ${done ? icon("check", { size: 14 }) : ""}
      </button>
      <span class="check-row-label">${escapeHTML(title)}</span>
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
