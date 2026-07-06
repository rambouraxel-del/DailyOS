import { icon } from "../icons.js";
import {
  formatRelativeDayFR,
  getWeekStart,
  getWeekDays,
  formatWeekRangeFR,
  formatWeekdayFR,
  formatShortDMY,
  isToday,
} from "../date-utils.js";
import { emptyState, escapeHTML } from "../components.js";

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 64; // px par heure

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function renderPlanning(state, dateISO, mode = "day") {
  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Mon agenda</h1>
      <button class="btn-icon" data-action="open-add-event">${icon("plus", { size: 20 })}</button>
    </div>

    <div class="segmented">
      <button data-action="set-agenda-mode" data-mode="day" class="${mode === "day" ? "active" : ""}">Jour</button>
      <button data-action="set-agenda-mode" data-mode="week" class="${mode === "week" ? "active" : ""}">Semaine</button>
    </div>

    ${mode === "week" ? renderWeekView(state, dateISO) : renderDayView(state, dateISO)}
  `;
}

function renderDayView(state, dateISO) {
  const events = state.events
    .filter((e) => e.date === dateISO)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const baseMinutes = START_HOUR * 60;
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const pxPerMin = HOUR_HEIGHT / 60;
  const timelineHeight = totalMinutes * pxPerMin;

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(h);
  }

  const eventBlocks = events
    .map((evt) => {
      const start = Math.max(0, timeToMinutes(evt.startTime) - baseMinutes);
      const endMinRaw = evt.endTime ? timeToMinutes(evt.endTime) - baseMinutes : start + 60;
      const end = Math.max(start + 30, Math.min(endMinRaw, totalMinutes));
      const top = Math.min(start, totalMinutes - 10) * pxPerMin;
      const height = Math.max(44, (end - start) * pxPerMin);
      return `
        <div class="timeline-event evt-${evt.color}" style="top:${top}px; height:${height}px;" data-action="edit-event" data-id="${evt.id}">
          <span class="evt-title">${escapeHTML(evt.title)}</span>
          <span class="evt-time">${evt.startTime}${evt.endTime ? " – " + evt.endTime : ""}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="planning-nav">
      <button class="btn-icon" data-action="prev-day">${icon("arrowLeft", { size: 18 })}</button>
      <span class="day-label">${formatRelativeDayFR(dateISO)}</span>
      <button class="btn-icon" data-action="next-day">${icon("arrowRight", { size: 18 })}</button>
    </div>

    ${
      events.length
        ? `<div class="timeline" style="height:${timelineHeight}px;">
            ${hours.map((h) => `<div class="timeline-hour" style="top:${(h - START_HOUR) * HOUR_HEIGHT}px;">${String(h).padStart(2, "0")}:00</div>`).join("")}
            <div class="timeline-line"></div>
            <div class="timeline-events">${eventBlocks}</div>
          </div>`
        : `<div class="glass-card" style="padding: 30px 16px;">${emptyState("Aucun événement ce jour-là.")}</div>`
    }
  `;
}

function renderWeekView(state, dateISO) {
  const monday = getWeekStart(dateISO);
  const days = getWeekDays(monday);

  const dayCards = days
    .map((day) => {
      const dayEvents = state.events
        .filter((e) => e.date === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return `
        <div class="glass-card week-day-card ${isToday(day) ? "week-day-today" : ""}">
          <div class="week-day-header">
            <div>
              <div class="week-day-name">${formatWeekdayFR(day)}${isToday(day) ? " · Aujourd'hui" : ""}</div>
              <div class="week-day-date">${formatShortDMY(day)}</div>
            </div>
            <button class="icon-btn-sm" data-action="open-add-event" data-date="${day}" aria-label="Ajouter un événement">
              ${icon("plus", { size: 17 })}
            </button>
          </div>
          <div class="week-day-events">
            ${
              dayEvents.length
                ? dayEvents.map(weekEventRow).join("")
                : `<div class="week-day-empty">Aucun événement</div>`
            }
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="planning-nav">
      <button class="btn-icon" data-action="prev-week">${icon("arrowLeft", { size: 18 })}</button>
      <span class="day-label">${formatWeekRangeFR(monday)}</span>
      <button class="btn-icon" data-action="next-week">${icon("arrowRight", { size: 18 })}</button>
    </div>

    <div class="week-list">${dayCards}</div>
  `;
}

function weekEventRow(evt) {
  return `
    <div class="mini-event" data-action="edit-event" data-id="${evt.id}">
      <span class="mini-event-time">${evt.startTime}</span>
      <span class="mini-event-dot dot-${evt.color}"></span>
      <span class="mini-event-title">${escapeHTML(evt.title)}</span>
    </div>
  `;
}
