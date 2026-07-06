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
};

export function icon(name, { size = 22, className = "" } = {}) {
  const path = PATHS[name] || PATHS.close;
  return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
