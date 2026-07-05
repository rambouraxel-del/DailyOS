import { icon } from "../icons.js";
import { checkRow, sortByDoneThenDate, emptyState } from "../components.js";

const CATEGORY_ORDER = ["Fruits & légumes", "Frais", "Épicerie", "Autres"];

export function renderGroceries(state) {
  const remaining = state.groceries.filter((g) => !g.done).length;
  const byCategory = new Map(CATEGORY_ORDER.map((c) => [c, []]));
  for (const g of state.groceries) {
    const cat = CATEGORY_ORDER.includes(g.category) ? g.category : "Autres";
    byCategory.get(cat).push(g);
  }

  const sections = [...byCategory.entries()]
    .filter(([, items]) => items.length)
    .map(
      ([cat, items]) => `
      <div class="grocery-category">
        <div class="grocery-category-title">${cat}</div>
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

  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Courses</h1>
      <span class="badge badge-accent">${remaining} restant${remaining > 1 ? "s" : ""}</span>
    </div>

    <form id="add-grocery-form" class="quick-add-row">
      <input class="input" name="title" placeholder="Ajouter un article…" required />
      <button type="submit" class="btn-icon">${icon("plus", { size: 20 })}</button>
    </form>

    ${state.groceries.length ? sections : emptyState("Ta liste de courses est vide.")}
  `;
}
