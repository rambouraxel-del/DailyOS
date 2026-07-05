import { icon } from "../icons.js";
import { formatRelativeDayFR } from "../date-utils.js";
import { emptyState } from "../components.js";

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 64; // px par heure

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function renderPlanning(state, dateISO) {
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
          <span class="evt-title">${evt.title}</span>
          <span class="evt-time">${evt.startTime}${evt.endTime ? " – " + evt.endTime : ""}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="page-header">
      <button class="btn-icon" data-action="go-home">${icon("back", { size: 20 })}</button>
      <h1>Planning</h1>
      <button class="btn-icon" data-action="open-add-event">${icon("plus", { size: 20 })}</button>
    </div>

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
