// Icônes SVG inline (style trait, "currentColor") - pas de dépendance externe.

const PATHS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9"/><path d="M9.5 20v-6h5v6"/>',
  tasks: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12l2.5 2.5L16 9"/>',
  planning: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17"/><path d="M8 3v3.5M16 3v3.5"/><circle cx="8" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
  projects: '<path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z"/>',
  groceries: '<path d="M4 6h2l1.2 10.4A2 2 0 0 0 9.2 18h7.6a2 2 0 0 0 2-1.7L20 8H6.5"/><circle cx="10" cy="21" r="1.4"/><circle cx="17" cy="21" r="1.4"/>',
  notes: '<path d="M6 3.5h9l3.5 3.5V19.5A1.5 1.5 0 0 1 17 21H6a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 6 3.5Z"/><path d="M14.5 3.5V7a1 1 0 0 0 1 1h3.5"/><path d="M8 12h8M8 15.5h8M8 8.5h3"/>',
  plus: '<path d="M12 4.5v15M4.5 12h15"/>',
  back: '<path d="M15 5 8 12l7 7"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  settings:
    '<path d="M10.63 2.8h2.74l1.35 2.64 2.81-.92 1.95 1.95-.92 2.81 2.64 1.35v2.74l-2.64 1.35.92 2.81-1.95 1.95-2.81-.92-1.35 2.64h-2.74l-1.35-2.64-2.81.92-1.95-1.95.92-2.81L2.8 13.37v-2.74l2.64-1.35-.92-2.81 1.95-1.95 2.81.92Z"/><circle cx="12" cy="12" r="3.2"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2"/><path d="M6.5 7l.7 12.1A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.9L17.5 7"/><path d="M10 11v6M14 11v6"/>',
  edit: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5Z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17"/><path d="M8 3v3.5M16 3v3.5"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/>',
  "sun-cloud": '<circle cx="8" cy="8.5" r="3"/><path d="M8 3.3v1.4M3.3 8h1.4M4.9 4.9l1 1M12.9 4.9l-1 1"/><path d="M8.5 14.5h9a3.2 3.2 0 0 0 .5-6.36A5 5 0 0 0 9 10.2"/>',
  cloud: '<path d="M6.5 18.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.8 4.2 4.2 0 0 1-.7 9.8Z"/>',
  rain: '<path d="M6.5 14.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.8 4.2 4.2 0 0 1-.7 9.8Z"/><path d="M8 18.5l-1 2.5M12 18.5l-1 2.5M16 18.5l-1 2.5"/>',
  snow: '<path d="M6.5 14.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.8 4.2 4.2 0 0 1-.7 9.8Z"/><path d="M9 18v3M11 21l-1-1 1-1M13 21l1-1-1-1M15 18v3"/>',
  storm: '<path d="M6.5 13.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.8 4.2 4.2 0 0 1-.7 9.8Z"/><path d="M13 14l-3 4h2.5l-1.5 4 4-5h-2.5Z"/>',
  fog: '<path d="M6.5 12.5a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.7-1.8 4.2 4.2 0 0 1-.7 9.4"/><path d="M4 16h16M4 19.5h16"/>',
  folder: '<path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18Z"/>',
  note: '<path d="M6 3.5h9l3.5 3.5V19.5A1.5 1.5 0 0 1 17 21H6a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 6 3.5Z"/><path d="M8 12h8M8 15.5h8M8 8.5h3"/>',
  cart: '<path d="M4 6h2l1.2 10.4A2 2 0 0 0 9.2 18h7.6a2 2 0 0 0 2-1.7L20 8H6.5"/><circle cx="10" cy="21" r="1.4"/><circle cx="17" cy="21" r="1.4"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  location: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/>',
  refresh: '<path d="M4.5 12a7.5 7.5 0 0 1 12.62-5.5"/><path d="M19.5 12a7.5 7.5 0 0 1-12.62 5.5"/><path d="M17.5 3.3v3.5h-3.5"/><path d="M6.5 20.7v-3.5h3.5"/>',

  /* ---------- Notes en blocs ---------- */
  star: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/>',
  tag: '<path d="M3.5 11.5V5a1.5 1.5 0 0 1 1.5-1.5h6.5L20.5 12 12 20.5 3.5 12Z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/>',
  chevronUp: '<path d="M6 15l6-6 6 6"/>',
  bulletList: '<circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none"/><path d="M9 6h11M9 12h11M9 18h11"/>',
  paragraph: '<path d="M4 6h16M4 10h16M4 14h11M4 18h7"/>',
  heading: '<path d="M6 5v14M17 5v14M6 12h11"/>',
  subheading: '<path d="M5 6h14M5 12h14M5 18h8"/>',
  toggleBlock: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="M9.5 10l2.5 2.5 2.5-2.5"/>',
  divider: '<path d="M4 12h16"/><path d="M4 9v6M20 9v6"/>',
  tree: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="17" cy="12" r="2"/><path d="M6 7v10"/><path d="M6 12h9"/>',
  network: '<circle cx="12" cy="4.5" r="2"/><circle cx="5" cy="18.5" r="2"/><circle cx="19" cy="18.5" r="2"/><path d="M12 6.5v3.5M12 10 6 16.5M12 10l6 6.5"/>',
  calloutInfo: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none"/>',
  calloutIdea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>',
  calloutImportant: '<path d="M12 3.2 21 19.5H3Z"/><path d="M12 9.2v5"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none"/>',
  calloutWarning: '<path d="M12 3l7.8 7.8-7.8 7.8-7.8-7.8Z"/><path d="M12 8.5v4"/><circle cx="12" cy="15" r="0.6" fill="currentColor" stroke="none"/>',
  calloutDecision: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.3 2.3 4.7-4.9"/>',
  calloutQuestion: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.3 2-2.3 3.6"/><circle cx="12" cy="16.8" r="0.6" fill="currentColor" stroke="none"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5"/>',

  /* ---------- Apprentissage ---------- */
  learning: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16.5v2A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-2"/>',
};

export function icon(name, { size = 22, className = "" } = {}) {
  const path = PATHS[name] || PATHS.close;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
