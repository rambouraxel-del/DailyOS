import { icon } from "../icons.js";
import { escapeHTML, emptyState } from "../components.js";

const header = `
  <div class="page-header">
    <button class="btn-icon" data-action="go-notes" aria-label="Retour">${icon("back", { size: 20 })}</button>
    <h1>Carte mentale</h1>
    <span style="width:42px"></span>
  </div>
`;

export function renderNotesMindMap(state, rootId) {
  const root = rootId ? state.notes.find((n) => n.id === rootId) : null;
  if (!root) return renderRootPicker(state);
  return renderMap(root, state);
}

function renderRootPicker(state) {
  const roots = [...state.notes.filter((n) => !n.parentId)].sort((a, b) => b.updatedAt - a.updatedAt);
  return `
    ${header}
    <div class="section-title-row"><span class="section-title">Choisis une note racine</span></div>
    ${
      roots.length
        ? `<div class="mindmap-picker-list">
            ${roots
              .map(
                (n) => `
              <button class="glass-card mindmap-root-card" data-action="set-mindmap-root" data-id="${n.id}">
                <div class="mindmap-root-title">${escapeHTML(n.title || "Sans titre")}</div>
                <div class="mindmap-root-sub">${state.notes.filter((c) => c.parentId === n.id).length} sous-note(s)</div>
              </button>`
              )
              .join("")}
          </div>`
        : `<div class="glass-card" style="padding:30px 16px;">${emptyState("Aucune note pour l'instant.")}</div>`
    }
  `;
}

function renderMap(root, state) {
  const children = [...state.notes.filter((n) => n.parentId === root.id)].sort((a, b) => a.createdAt - b.createdAt);
  return `
    ${header}
    <button class="btn-chip" data-action="set-mindmap-root" data-id="" style="margin-bottom:14px; width:auto; padding-left:16px; padding-right:16px;">
      ${icon("network", { size: 15 })} Changer de racine
    </button>

    <div class="glass-card mindmap-root-card" data-action="open-note" data-id="${root.id}">
      <div class="mindmap-root-title">${escapeHTML(root.title || "Sans titre")}</div>
      <div class="mindmap-root-sub">${children.length ? `${children.length} branche${children.length > 1 ? "s" : ""}` : "Aucune sous-note"}</div>
    </div>

    ${
      children.length
        ? `<div class="mindmap-connector"></div>
           <div class="mindmap-branches">${children.map((c) => renderBranch(c, state)).join("")}</div>`
        : `<div class="glass-card" style="padding:24px 16px; margin-top:14px;">${emptyState("Cette note n'a pas encore de sous-note.")}</div>`
    }
  `;
}

function renderBranch(child, state) {
  const grandChildren = [...state.notes.filter((n) => n.parentId === child.id)].sort((a, b) => a.createdAt - b.createdAt);
  return `
    <div class="mindmap-branch">
      <div class="glass-card mindmap-branch-card" data-action="open-note" data-id="${child.id}">
        <div class="mindmap-branch-title">${escapeHTML(child.title || "Sans titre")}</div>
        ${grandChildren.length ? `<div class="mindmap-branch-count">${grandChildren.length} sous-note${grandChildren.length > 1 ? "s" : ""}</div>` : ""}
      </div>
      ${
        grandChildren.length
          ? `<div class="mindmap-grandchildren">
              ${grandChildren.map((gc) => `<div class="mindmap-grandchild-chip" data-action="open-note" data-id="${gc.id}">${escapeHTML(gc.title || "Sans titre")}</div>`).join("")}
            </div>`
          : ""
      }
    </div>
  `;
}
