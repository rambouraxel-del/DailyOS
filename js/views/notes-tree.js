import { icon } from "../icons.js";
import { escapeHTML, emptyState } from "../components.js";
import * as store from "../storage.js";

export function renderNotesTree(state, collapsedSet) {
  const tree = store.getNoteTree();
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-notes" aria-label="Retour">${icon("back", { size: 20 })}</button>
      <h1>Vue arbre</h1>
      <span style="width:42px"></span>
    </div>

    ${
      tree.length
        ? `<div class="glass-card" style="padding:8px 10px;">${tree.map((n) => renderTreeNode(n, collapsedSet)).join("")}</div>`
        : `<div class="glass-card" style="padding:30px 16px;">${emptyState("Aucune note pour l'instant.")}</div>`
    }
  `;
}

function renderTreeNode(node, collapsedSet) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedSet.has(node.note.id);
  return `
    <div class="tree-node">
      <div class="tree-node-row" data-action="open-note" data-id="${node.note.id}">
        ${
          hasChildren
            ? `<button class="tree-toggle-btn ${isCollapsed ? "" : "open"}" data-action="toggle-tree-node" data-id="${node.note.id}" aria-label="Ouvrir/fermer la branche">${icon("chevronRight", { size: 16 })}</button>`
            : `<span class="tree-toggle-spacer"></span>`
        }
        <span class="tree-node-title">${escapeHTML(node.note.title || "Sans titre")}</span>
        ${hasChildren ? `<span class="tree-node-count">${node.children.length}</span>` : ""}
      </div>
      ${
        hasChildren && !isCollapsed
          ? `<div class="tree-children">${node.children.map((c) => renderTreeNode(c, collapsedSet)).join("")}</div>`
          : ""
      }
    </div>
  `;
}
