/* =========================================================================
   config.js — business rules: services, hours, and time-slot generation.
   Edit this file to change what you offer or when you're open.
   ========================================================================= */
"use strict";

const SERVICES = [
  { id: "air-duct",       name: "Air Duct Cleaning",          duration: "2–3 hrs", desc: "Whole-home or commercial HVAC duct cleaning." },
  { id: "dryer-vent",     name: "Dryer Vent Cleaning",        duration: "1 hr",    desc: "Clear lint buildup to prevent fire hazards." },
  { id: "kitchen-hood",   name: "Kitchen Exhaust Hood Cleaning", duration: "2–4 hrs", desc: "NFPA #96-compliant commercial hood cleaning." },
  { id: "hvac-inspection",name: "HVAC Visual Inspection",     duration: "30 min",  desc: "Honest, no-pressure assessment of your system." },
  { id: "air-filter",     name: "Air Filter Replacement",     duration: "30 min",  desc: "Swap in fresh, high-quality filters." },
  { id: "duct-replace",   name: "Air Duct Replacement",       duration: "Varies",  desc: "Replace damaged ductwork with sealed, efficient runs." },
];

// 0 = Sunday … 6 = Saturday. Closed Sundays.
const OPEN_DAYS = [1, 2, 3, 4, 5, 6];

// Two-hour arrival windows the crew can cover in a day.
const SLOTS = [
  { time: "08:00", label: "8:00 AM – 10:00 AM" },
  { time: "10:00", label: "10:00 AM – 12:00 PM" },
  { time: "12:00", label: "12:00 PM – 2:00 PM" },
  { time: "14:00", label: "2:00 PM – 4:00 PM" },
  { time: "16:00", label: "4:00 PM – 6:00 PM" },
];

const SERVICE_AREAS = [
  "Riverside","Moreno Valley","Perris","Norco","Chino","Corona","Pomona",
  "Canyon Lake","Temecula","Menifee","Murrieta","Sun City","Winchester",
  "Lake Elsinore","Upland","Rialto","Yucaipa","Palm Springs","Palm Desert",
  "La Quinta","Rancho Mirage","Chula Vista","El Cajon","Oceanside",
  "Rancho Bernardo","San Diego","Las Vegas, NV",
];

function isOpenOn(dateStr) {
  // dateStr = YYYY-MM-DD, interpret as local date
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return OPEN_DAYS.includes(day);
}

function serviceName(id) {
  const s = SERVICES.find((x) => x.id === id);
  return s ? s.name : id;
}

module.exports = { SERVICES, OPEN_DAYS, SLOTS, SERVICE_AREAS, isOpenOn, serviceName };
