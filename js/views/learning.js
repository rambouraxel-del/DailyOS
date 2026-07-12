import { icon } from "../icons.js";
import { escapeHTML, escapeAttrValue as escapeAttr, emptyState } from "../components.js";

export function renderLearning(state) {
  const docs = [...state.documents].sort((a, b) => b.createdAt - a.createdAt);
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Apprentissage</h1>
      <button class="btn-icon" data-action="trigger-doc-import" aria-label="Importer un document">${icon("upload", { size: 20 })}</button>
    </div>
    <input type="file" id="doc-file-input" accept=".pdf,.doc,.docx,.txt" hidden />

    <div class="section doc-list">
      ${docs.length ? docs.map(docCard).join("") : `<div class="glass-card" style="padding:30px 16px;">${emptyState("Aucun document importé pour l'instant.")}</div>`}
    </div>
  `;
}

function docCard(d) {
  return `
    <div class="glass-card doc-card">
      <div class="card-header-row">
        <input class="input doc-name-input" data-action="edit-doc-name" data-id="${d.id}" value="${escapeAttr(d.name)}" />
        <button class="icon-btn-sm" data-action="delete-document" data-id="${d.id}" aria-label="Supprimer">${icon("trash", { size: 16 })}</button>
      </div>
      <textarea class="textarea doc-desc-input" data-action="edit-doc-desc" data-id="${d.id}" rows="2" placeholder="Description (optionnel)">${escapeHTML(d.description || "")}</textarea>
      <div class="doc-card-footer">
        <span class="badge">${escapeHTML(d.fileName || "")}</span>
        <button class="btn-chip ${d.read ? "active" : ""}" data-action="toggle-doc-read" data-id="${d.id}">
          ${icon(d.read ? "check" : "close", { size: 14 })} ${d.read ? "Lu" : "Non lu"}
        </button>
        ${d.dataUrl ? `<a class="btn-secondary" href="${d.dataUrl}" download="${escapeAttr(d.fileName || d.name)}" target="_blank" rel="noopener">${icon("note", { size: 15 })} Ouvrir</a>` : ""}
      </div>
    </div>
  `;
}
