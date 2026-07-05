// Formatage des dates en français + calculs de semaine/jour.

export function formatFullDateFR(date = new Date()) {
  const str = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatShortDateFR(date = new Date()) {
  const str = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getISOWeekNumber(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function toISODate(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function isToday(isoDate) {
  return isoDate === toISODate(new Date());
}

export function addDays(isoDate, delta) {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

export function formatRelativeDayFR(isoDate) {
  const today = toISODate(new Date());
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  if (isoDate === today) return "Aujourd'hui";
  if (isoDate === yesterday) return "Hier";
  if (isoDate === tomorrow) return "Demain";
  return formatShortDateFR(new Date(isoDate + "T00:00:00"));
}

export function formatNoteDate(timestamp) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
