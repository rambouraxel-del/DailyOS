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

/**
 * Formate une deadline de tâche (YYYY-MM-DD) en texte relatif sobre.
 * Retourne null si aucune deadline (rien à afficher).
 */
export function formatDeadline(deadlineISO) {
  if (!deadlineISO) return null;
  const today = toISODate(new Date());
  const diffDays = Math.round(
    (new Date(deadlineISO + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays > 1) return `J-${diffDays}`;
  return `En retard de ${Math.abs(diffDays)} j`;
}

/** Retourne le lundi (ISO) de la semaine contenant isoDate. */
export function getWeekStart(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay(); // 0 = dimanche ... 6 = samedi
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** Les 7 dates ISO de la semaine (lundi -> dimanche) contenant mondayISO. */
export function getWeekDays(mondayISO) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayISO, i));
}

/** "Semaine du 6 au 12 juillet" (ou "du 30 juin au 6 juillet" si la semaine chevauche deux mois). */
export function formatWeekRangeFR(mondayISO) {
  const start = new Date(mondayISO + "T00:00:00");
  const sundayISO = addDays(mondayISO, 6);
  const end = new Date(sundayISO + "T00:00:00");
  const startMonth = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(start);
  const endMonth = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(end);
  if (startMonth === endMonth) {
    return `Semaine du ${start.getDate()} au ${end.getDate()} ${endMonth}`;
  }
  return `Semaine du ${start.getDate()} ${startMonth} au ${end.getDate()} ${endMonth}`;
}

/** "Lundi", "Mardi"... */
export function formatWeekdayFR(isoDate) {
  const str = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date(isoDate + "T00:00:00"));
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** "08/07" */
export function formatShortDMY(isoDate) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(
    new Date(isoDate + "T00:00:00")
  );
}

export function formatNoteDate(timestamp) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
