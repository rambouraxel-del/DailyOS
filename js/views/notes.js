import { icon } from "../icons.js";
import { escapeHTML, emptyState } from "../components.js";
import { formatNoteDate } from "../date-utils.js";

export function renderNotes(state) {
  const sorted = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Notes</h1>
      <button class="btn-icon" data-action="open-add-modal" data-add-type="note">${icon("plus", { size: 20 })}</button>
    </div>

    <div class="notes-grid">
      ${
        sorted.length
          ? sorted.map(noteCard).join("")
          : `<div class="glass-card" style="padding:30px 16px;">${emptyState("Aucune note pour l'instant.")}</div>`
      }
    </div>
  `;
}

function noteCard(note) {
  const snippet = note.content?.trim() || "Note vide";
  return `
    <div class="glass-card note-card" data-action="open-note" data-id="${note.id}">
      <div class="note-title">${escapeHTML(note.title || "Sans titre")}</div>
      <div class="note-snippet">${escapeHTML(snippet)}</div>
      <div class="note-date">Modifiée le ${formatNoteDate(note.updatedAt)}</div>
    </div>
  `;
}

export function renderNoteDetail(note) {
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-notes">${icon("back", { size: 20 })}</button>
      <h1></h1>
      <button class="btn-icon" data-action="delete-note" data-id="${note.id}">${icon("trash", { size: 18 })}</button>
    </div>
    <input class="note-editor-title" id="note-title-input" value="${escapeHTML(note.title)}" placeholder="Titre" />
    <textarea class="note-editor-content" id="note-content-input" placeholder="Écris quelque chose…">${escapeHTML(note.content)}</textarea>
  `;
}
