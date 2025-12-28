import { useMemo, useState } from "react";
import { useSlotsRange } from "../lib/useSlots";

const EMPLOYEES = ["JOSH", "JOE", "ALEX", "FRANCES"];
const PERIODS = ["AM", "PM"];

/* ---------- date helpers ---------- */
function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay(); //
const tdNotes = {
  padding: 6,
  borderBottom: "1px solid #eee",
  minWidth: 220,
};
