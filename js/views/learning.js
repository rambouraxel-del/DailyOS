import { icon } from "../icons.js";
import { escapeHTML, escapeAttrValue as escapeAttr, emptyState } from "../components.js";

export function renderLearning(state, editingDocId = null) {
  const docs = [...state.documents].sort((a, b) => b.createdAt - a.createdAt);
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Apprentissage</h1>
      <button class="btn-icon" data-action="trigger-doc-import" aria-label="Importer un document">${icon("upload", { size: 20 })}</button>
    </div>
    <input type="file" id="doc-file-input" accept=".pdf,.doc,.docx,.txt" hidden />

    <div class="section doc-list">
      ${docs.length ? docs.map((d) => docCard(d, d.id === editingDocId)).join("") : `<div class="glass-card" style="padding:30px 16px;">${emptyState("Aucun document importé pour l'instant.")}</div>`}
    </div>
  `;
}

function docCard(d, editing) {
  return `
    <div class="glass-card doc-card">
      <div class="card-header-row">
        ${editing
          ? `<input class="input doc-name-input" id="doc-name-${d.id}" value="${escapeAttr(d.name)}" />`
          : `<div class="doc-name-display">${escapeHTML(d.name)}</div>`}
        <button class="icon-btn-sm" data-action="delete-document" data-id="${d.id}" aria-label="Supprimer">${icon("trash", { size: 16 })}</button>
      </div>
      ${editing
        ? `<textarea class="textarea doc-desc-input" id="doc-desc-${d.id}" rows="2" placeholder="Description (optionnel)">${escapeHTML(d.description || "")}</textarea>`
        : d.description
          ? `<div class="doc-desc-display">${escapeHTML(d.description)}</div>`
          : ""}
      <div class="doc-card-footer">
        <span class="badge">${escapeHTML(d.fileName || "")}</span>
        <button class="btn-chip ${d.read ? "active" : ""}" data-action="toggle-doc-read" data-id="${d.id}">
          ${icon(d.read ? "check" : "close", { size: 14 })} ${d.read ? "Lu" : "Non lu"}
        </button>
        <button class="btn-secondary" data-action="open-document" data-id="${d.id}">${icon("note", { size: 15 })} Ouvrir</button>
        ${editing
          ? `<button class="btn-secondary" data-action="save-document" data-id="${d.id}">${icon("check", { size: 15 })} Enregistrer</button>
             <button class="icon-btn-sm" data-action="cancel-edit-document" data-id="${d.id}" aria-label="Annuler">${icon("close", { size: 15 })}</button>`
          : `<button class="btn-secondary" data-action="edit-document" data-id="${d.id}">${icon("edit", { size: 15 })} Modifier</button>`}
      </div>
    </div>
  `;
}
