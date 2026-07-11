import { icon } from "../icons.js";
import { escapeHTML, emptyState, escapeAttrValue } from "../components.js";
import { formatNoteDate } from "../date-utils.js";
import { blockTextContent, searchNotes } from "../storage.js";

export function renderNotes(state, { searchQuery = "", filter = "all" } = {}) {
  const q = (searchQuery || "").trim();
  const isSearching = Boolean(q);

  let notesToShow;
  if (isSearching) {
    notesToShow = searchNotes(q);
  } else {
    notesToShow = state.notes.filter((n) => !n.parentId);
    if (filter === "favorites") notesToShow = notesToShow.filter((n) => n.favorite);
  }
  notesToShow = [...notesToShow].sort((a, b) => b.updatedAt - a.updatedAt);

  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Notes</h1>
      <button class="btn-icon" data-action="open-add-modal" data-add-type="note">${icon("plus", { size: 20 })}</button>
    </div>

    <div class="search-row">
      ${icon("search", { size: 18 })}
      <input type="text" id="notes-search-input" placeholder="Rechercher une note, un tag…" value="${escapeAttrValue(searchQuery)}" />
    </div>

    <div class="notes-toolbar">
      <button class="btn-chip" data-action="go-notes-tree">${icon("tree", { size: 16 })} Vue arbre</button>
      <button class="btn-chip" data-action="go-notes-mindmap">${icon("network", { size: 16 })} Carte</button>
      <button class="btn-chip" data-action="open-quick-idea">${icon("calloutIdea", { size: 16 })} Idée rapide</button>
    </div>

    ${
      isSearching
        ? `<div class="search-results-label">${notesToShow.length} résultat${notesToShow.length > 1 ? "s" : ""} pour "${escapeHTML(q)}"</div>`
        : `<div class="segmented">
            <button data-action="filter-notes" data-filter="all" class="${filter === "all" ? "active" : ""}">Toutes</button>
            <button data-action="filter-notes" data-filter="favorites" class="${filter === "favorites" ? "active" : ""}">Favoris</button>
          </div>`
    }

    <div class="notes-grid">
      ${
        notesToShow.length
          ? notesToShow.map((n) => noteCard(n, state)).join("")
          : `<div class="glass-card" style="padding:30px 16px;">${emptyState(isSearching ? "Aucun résultat." : "Aucune note pour l'instant.")}</div>`
      }
    </div>
  `;
}

function noteCard(note, state) {
  const childCount = state.notes.filter((n) => n.parentId === note.id).length;
  const firstTextBlock = note.blocks.find((b) => blockTextContent(b).trim());
  const snippet = firstTextBlock
    ? blockTextContent(firstTextBlock)
    : note.blocks.length
      ? `${note.blocks.length} bloc${note.blocks.length > 1 ? "s" : ""}`
      : "Note vide";

  return `
    <div class="glass-card note-card" data-action="open-note" data-id="${note.id}">
      <div class="note-card-header">
        <div class="note-card-title">${escapeHTML(note.title || "Sans titre")}</div>
        <button class="note-favorite-btn ${note.favorite ? "active" : ""}" data-action="toggle-note-favorite" data-id="${note.id}" aria-label="Marquer comme favori">
          ${icon("star", { size: 18 })}
        </button>
      </div>
      <div class="note-snippet">${escapeHTML(snippet)}</div>
      ${
        note.tags?.length
          ? `<div class="note-tags">${note.tags.map((t) => `<span class="note-tag-pill">${escapeHTML(t)}</span>`).join("")}</div>`
          : ""
      }
      <div class="note-meta-row">
        <span>Modifiée le ${formatNoteDate(note.updatedAt)}</span>
        ${childCount ? `<span>· ${childCount} sous-note${childCount > 1 ? "s" : ""}</span>` : ""}
      </div>
    </div>
  `;
}
