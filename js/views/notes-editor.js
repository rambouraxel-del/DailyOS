import { icon } from "../icons.js";
import { escapeHTML, escapeAttrValue, emptyState } from "../components.js";
import { formatNoteDate } from "../date-utils.js";
import * as store from "../storage.js";

export const CALLOUT_META = {
  info: { icon: "calloutInfo", label: "Info" },
  idea: { icon: "calloutIdea", label: "Idée" },
  important: { icon: "calloutImportant", label: "Important" },
  warning: { icon: "calloutWarning", label: "Risque" },
  decision: { icon: "calloutDecision", label: "Décision" },
  question: { icon: "calloutQuestion", label: "Question" },
};

export function renderNoteDetail(note, state) {
  const ancestors = store.getNoteAncestors(note.id);
  const backTarget = ancestors.length > 1 ? ancestors[ancestors.length - 2] : null;

  return `
    <div class="page-header">
      <button class="btn-icon" data-action="${backTarget ? "open-note" : "go-notes"}" ${backTarget ? `data-id="${backTarget.id}"` : ""} aria-label="Retour">${icon("back", { size: 20 })}</button>
      <h1></h1>
      <button class="btn-icon" data-action="duplicate-note" data-id="${note.id}" aria-label="Dupliquer">${icon("copy", { size: 17 })}</button>
      <button class="btn-icon" data-action="delete-note" data-id="${note.id}" aria-label="Supprimer">${icon("trash", { size: 18 })}</button>
    </div>

    ${breadcrumb(ancestors)}

    <div class="note-editor-header-row">
      <input class="note-editor-title" id="note-title-input" value="${escapeAttrValue(note.title)}" placeholder="Titre" />
      <button class="note-favorite-btn ${note.favorite ? "active" : ""}" data-action="toggle-note-favorite" data-id="${note.id}" aria-label="Favori">
        ${icon("star", { size: 22 })}
      </button>
    </div>

    <div class="note-tags-row">
      <input class="input" id="note-tags-input" placeholder="Tags séparés par une virgule…" value="${escapeAttrValue((note.tags || []).join(", "))}" style="font-size:13px; padding:9px 12px;" />
    </div>

    <div class="note-editor-meta">Modifiée le ${formatNoteDate(note.updatedAt)}</div>

    ${
      note.blocks.length
        ? `<div class="block-list">${note.blocks.map((b, i) => renderBlock(b, note, i, state)).join("")}</div>`
        : `<div class="glass-card" style="padding:24px 16px; margin-bottom:16px;">${emptyState("Cette note est vide. Ajoute ton premier bloc.")}</div>`
    }

    <button class="btn-secondary" data-action="open-add-block" data-id="${note.id}" style="width:100%; justify-content:center;">
      ${icon("plus", { size: 17 })} Ajouter un bloc
    </button>
  `;
}

function breadcrumb(ancestors) {
  const items = [`<button data-action="go-notes">Notes</button>`, `<span class="crumb-sep">›</span>`];
  ancestors.forEach((n, i) => {
    const isLast = i === ancestors.length - 1;
    if (isLast) {
      items.push(`<span class="crumb-current">${escapeHTML(n.title || "Sans titre")}</span>`);
    } else {
      items.push(`<button data-action="open-note" data-id="${n.id}">${escapeHTML(n.title || "Sans titre")}</button>`);
      items.push(`<span class="crumb-sep">›</span>`);
    }
  });
  return `<div class="breadcrumb">${items.join("")}</div>`;
}

function blockToolbar(note, block, index) {
  return `
    <div class="block-toolbar">
      ${index > 0 ? `<button class="icon-btn-sm" data-action="move-block-up" data-note-id="${note.id}" data-block-id="${block.id}" aria-label="Monter le bloc">${icon("chevronUp", { size: 15 })}</button>` : ""}
      ${index < note.blocks.length - 1 ? `<button class="icon-btn-sm" data-action="move-block-down" data-note-id="${note.id}" data-block-id="${block.id}" aria-label="Descendre le bloc">${icon("chevronDown", { size: 15 })}</button>` : ""}
      <button class="icon-btn-sm" data-action="delete-block" data-note-id="${note.id}" data-block-id="${block.id}" aria-label="Supprimer le bloc">${icon("trash", { size: 15 })}</button>
    </div>
  `;
}

function renderBlock(block, note, index, state) {
  if (block.type === "childNote") return renderChildNoteBlock(block, note, index, state);
  if (block.type === "divider") {
    return `<div class="note-block">${blockToolbar(note, block, index)}<div class="block-divider"></div></div>`;
  }

  let body = "";
  switch (block.type) {
    case "paragraph":
      body = `<textarea class="block-paragraph-textarea" data-field="content" data-note-id="${note.id}" data-block-id="${block.id}" placeholder="Écris quelque chose…" rows="3">${escapeHTML(block.content || "")}</textarea>`;
      break;
    case "heading":
      body = `<input class="block-heading-input" data-field="content" data-note-id="${note.id}" data-block-id="${block.id}" placeholder="Titre de section" value="${escapeAttrValue(block.content || "")}" />`;
      break;
    case "subheading":
      body = `<input class="block-subheading-input" data-field="content" data-note-id="${note.id}" data-block-id="${block.id}" placeholder="Sous-titre" value="${escapeAttrValue(block.content || "")}" />`;
      break;
    case "bulletList":
      body = renderBulletList(block, note);
      break;
    case "checklist":
      body = renderChecklist(block, note);
      break;
    case "callout":
      body = renderCallout(block, note);
      break;
    case "toggle":
      body = renderToggle(block, note);
      break;
    default:
      body = "";
  }
  return `<div class="note-block">${blockToolbar(note, block, index)}${body}</div>`;
}

function renderBulletList(block, note) {
  const items = block.content || [];
  return `
    <div class="block-bullet-list">
      ${items
        .map(
          (text, idx) => `
        <div class="block-bullet-row">
          <span class="bullet-dot"></span>
          <input value="${escapeAttrValue(text)}" data-field="bullet-item" data-note-id="${note.id}" data-block-id="${block.id}" data-index="${idx}" placeholder="Élément…" />
          <button class="icon-btn-sm" data-action="delete-bullet-item" data-note-id="${note.id}" data-block-id="${block.id}" data-index="${idx}" aria-label="Supprimer l'élément">${icon("close", { size: 14 })}</button>
        </div>`
        )
        .join("")}
      <button class="block-add-row" data-action="add-bullet-item" data-note-id="${note.id}" data-block-id="${block.id}">+ Ajouter un élément</button>
    </div>
  `;
}

function renderChecklist(block, note) {
  const items = block.items || [];
  return `
    <ul class="check-list">
      ${items
        .map(
          (item) => `
        <li class="check-row">
          <button class="checkbox ${item.checked ? "checked" : ""}" data-action="toggle-checklist-item" data-note-id="${note.id}" data-block-id="${block.id}" data-item-id="${item.id}" aria-label="Cocher">
            ${item.checked ? icon("check", { size: 14 }) : ""}
          </button>
          <div class="check-row-main">
            <input class="block-checklist-input ${item.checked ? "checked" : ""}" value="${escapeAttrValue(item.text)}" data-field="checklist-item" data-note-id="${note.id}" data-block-id="${block.id}" data-item-id="${item.id}" />
          </div>
          <span class="check-row-actions">
            <button class="icon-btn-sm" data-action="delete-checklist-item" data-note-id="${note.id}" data-block-id="${block.id}" data-item-id="${item.id}" aria-label="Supprimer">${icon("trash", { size: 16 })}</button>
          </span>
        </li>`
        )
        .join("")}
    </ul>
    <form data-action="add-checklist-item-form" data-note-id="${note.id}" data-block-id="${block.id}" class="quick-add-row" style="margin-top:${items.length ? "10px" : "0"}; margin-bottom:0;">
      <input class="input" name="text" placeholder="Ajouter un élément…" required />
      <button type="submit" class="btn-icon">${icon("plus", { size: 18 })}</button>
    </form>
  `;
}

function renderCallout(block, note) {
  const meta = CALLOUT_META[block.variant] || CALLOUT_META.info;
  const options = Object.entries(CALLOUT_META)
    .map(([key, m]) => `<option value="${key}" ${key === block.variant ? "selected" : ""}>${m.label}</option>`)
    .join("");
  return `
    <div class="block-callout">
      <span class="block-callout-icon">${icon(meta.icon, { size: 20 })}</span>
      <div class="block-callout-body">
        <div class="block-callout-top-row">
          <select class="block-callout-variant-select" data-action="set-callout-variant" data-note-id="${note.id}" data-block-id="${block.id}">${options}</select>
        </div>
        <textarea data-field="content" data-note-id="${note.id}" data-block-id="${block.id}" placeholder="Ton texte…" rows="2">${escapeHTML(block.content || "")}</textarea>
      </div>
    </div>
  `;
}

function renderToggle(block, note) {
  const isOpen = block.open !== false;
  return `
    <div class="block-toggle ${isOpen ? "open" : ""}">
      <div class="block-toggle-header">
        <button class="block-toggle-chevron ${isOpen ? "open" : ""}" data-action="toggle-block-open" data-note-id="${note.id}" data-block-id="${block.id}" aria-label="Ouvrir/fermer">${icon("chevronDown", { size: 16 })}</button>
        <input value="${escapeAttrValue(block.title || "")}" data-field="title" data-note-id="${note.id}" data-block-id="${block.id}" placeholder="Titre du menu…" />
      </div>
      ${
        isOpen
          ? `<div class="block-toggle-body"><textarea data-field="content" data-note-id="${note.id}" data-block-id="${block.id}" placeholder="Contenu…" rows="3">${escapeHTML(block.content || "")}</textarea></div>`
          : ""
      }
    </div>
  `;
}

function renderChildNoteBlock(block, note, index, state) {
  const child = state.notes.find((n) => n.id === block.noteId);
  const toolbar = blockToolbar(note, block, index);
  if (!child) {
    return `<div class="note-block">${toolbar}<div class="block-child-note">${icon("note", { size: 18 })}<span class="block-child-note-title" style="color:var(--text-muted)">Sous-note introuvable</span></div></div>`;
  }
  const grandChildCount = state.notes.filter((n) => n.parentId === child.id).length;
  return `
    <div class="note-block">
      ${toolbar}
      <div class="block-child-note" data-action="open-note" data-id="${child.id}">
        <span class="block-child-note-icon">${icon("note", { size: 18 })}</span>
        <span class="block-child-note-title">${escapeHTML(child.title || "Sans titre")}</span>
        ${grandChildCount ? `<span class="tree-node-count">${grandChildCount}</span>` : ""}
        <span style="color:var(--text-muted); flex-shrink:0; display:flex;">${icon("chevronRight", { size: 16 })}</span>
      </div>
    </div>
  `;
}

/**
 * Attache les listeners d'auto-sauvegarde (titre, tags, contenu des blocs)
 * après le rendu de l'éditeur. Chaque champ écrit directement dans le
 * storage sans forcer de re-rendu complet (pour ne pas perdre le focus /
 * la position du curseur pendant la frappe).
 */
export function attachNoteEditorAutosave(viewRoot, noteId) {
  const titleInput = viewRoot.querySelector("#note-title-input");
  titleInput?.addEventListener("input", () => {
    store.updateNote(noteId, { title: titleInput.value });
  });

  const tagsInput = viewRoot.querySelector("#note-tags-input");
  tagsInput?.addEventListener("input", () => {
    const tags = tagsInput.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    store.updateNote(noteId, { tags });
  });

  viewRoot.querySelectorAll("[data-field]").forEach((el) => {
    el.addEventListener("input", () => handleFieldInput(el));
  });
}

function handleFieldInput(el) {
  const { field, noteId, blockId, itemId, index } = el.dataset;
  if (!noteId || !blockId) return;

  if (field === "content" || field === "title") {
    store.updateBlock(noteId, blockId, { [field]: el.value });
    return;
  }
  if (field === "bullet-item") {
    const note = store.getNote(noteId);
    const block = note?.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const content = [...(block.content || [])];
    content[Number(index)] = el.value;
    store.updateBlock(noteId, blockId, { content });
    return;
  }
  if (field === "checklist-item") {
    store.updateChecklistItem(noteId, blockId, itemId, el.value);
  }
}
