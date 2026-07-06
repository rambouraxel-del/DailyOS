import { icon } from "../icons.js";
import { checkRow, sortByDoneThenDate, emptyState, escapeHTML, escapeAttrValue } from "../components.js";

export function renderGroceries(state, lastCategory = "Autres") {
  const remaining = state.groceries.filter((g) => !g.done).length;
  const categories = state.settings.groceryCategories?.length ? state.settings.groceryCategories : ["Autres"];

  // Filet de sécurité : si un article référence une catégorie absente de la
  // liste (ne devrait plus arriver grâce à la migration), on l'affiche quand
  // même plutôt que de le faire disparaître silencieusement.
  const extraCategories = [
    ...new Set(state.groceries.map((g) => g.category).filter((c) => c && !categories.includes(c))),
  ];
  const allCategories = [...categories, ...extraCategories];

  const byCategory = new Map(allCategories.map((c) => [c, []]));
  for (const g of state.groceries) {
    const cat = allCategories.includes(g.category) ? g.category : "Autres";
    byCategory.get(cat)?.push(g);
  }

  const sections = [...byCategory.entries()]
    .filter(([, items]) => items.length)
    .map(
      ([cat, items]) => `
      <div class="grocery-category">
        <div class="grocery-category-title">${escapeHTML(cat)}</div>
        <div class="glass-card" style="padding: 6px 16px;">
          <ul class="check-list">
            ${sortByDoneThenDate(items)
              .map((g) => checkRow({ id: g.id, title: g.name, done: g.done }, { toggle: "toggle-grocery", edit: "edit-grocery", delete: "delete-grocery" }))
              .join("")}
          </ul>
        </div>
      </div>`
    )
    .join("");

  const defaultCategory = categories.includes(lastCategory) ? lastCategory : categories[0];
  const categoryOptions = categories
    .map((c) => `<option value="${escapeAttrValue(c)}" ${c === defaultCategory ? "selected" : ""}>${escapeHTML(c)}</option>`)
    .join("");

  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Courses</h1>
      <span class="badge badge-accent">${remaining} restant${remaining > 1 ? "s" : ""}</span>
    </div>

    <form id="add-grocery-form">
      <div class="quick-add-row">
        <input class="input" name="title" placeholder="Ajouter un article…" required />
        <button type="submit" class="btn-icon">${icon("plus", { size: 20 })}</button>
      </div>
      <select class="input" name="category" aria-label="Catégorie" style="margin-bottom:18px;">
        ${categoryOptions}
      </select>
    </form>

    ${state.groceries.length ? sections : emptyState("Ta liste de courses est vide.")}

    <button class="btn-secondary mt-8" data-action="open-grocery-categories" style="width:100%; justify-content:center;">
      ${icon("edit", { size: 16 })} Personnaliser les catégories
    </button>
  `;
}
