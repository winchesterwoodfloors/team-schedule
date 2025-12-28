import { useMemo, useState } from "react";
import { useSlotsRange } from "../lib/useSlots";

const EMPLOYEES = ["JOSH", "JOE", "ALEX", "FRANCES"];
const PERIODS = ["AM", "PM"];

/* ---------- date helpers ---------- */
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function prettyDay(d) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/* ---------- main ---------- */
export default function Home() {
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [weeksToShow, setWeeksToShow] = useState(1);

  const start = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);

  const days = useMemo(() => {
    return Array.from({ length: weeksToShow * 7 }, (_, i) =>
      addDays(start, i)
    );
  }, [start, weeksToShow]);

  const startIso = isoDate(days[0]);
  const endIso = isoDate(days[days.length - 1]);

  const { data, error, upsertSlot } = useSlotsRange(startIso, endIso);

  const moveWeeks = (n) =>
    setAnchorDate((prev) => addDays(prev, n * 7));

  const editCell = async (date, period, employee) => {
    const key = `${date}_${period}_${employee}`;
    const existing = data?.[key]?.value || "";

    const next = window.prompt(
      "Enter booking details (name + address). Leave blank to clear.",
      existing
    );

    if (next === null) return;

    await upsertSlot({
      date,
      period,
      employee,
      value: next,
    });
  };

  return (
    <div style={page}>
      <h1>Team Schedule</h1>

      <div style={controls}>
        <button onClick={() => moveWeeks(-1)}>← Prev</button>
        <button onClick={() => moveWeeks(1)}>Next →</button>

        <label>
          Weeks:&nbsp;
          <select
            value={weeksToShow}
            onChange={(e) => setWeeksToShow(Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>

        <span>
          {startIso} → {endIso}
        </span>
      </div>

      {error && (
        <div style={errorBox}>
          Error loading data (check Firestore permissions)
        </div>
      )}

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={thSticky}>DATE</th>
              <th style={th}>PERIOD</th>
              {EMPLOYEES.map((e) => (
                <th key={e} style={th}>{e}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {days.map((d) => {
              const date = isoDate(d);
              return PERIODS.map((period, i) => (
                <tr key={`${date}_${period}`}>
                  {i === 0 && (
                    <td rowSpan={2} style={tdSticky}>
                      <b>{prettyDay(d)}</b>
                      <div style={small}>{date}</div>
                    </td>
                  )}

                  <td style={tdPeriod}>{period}</td>

                  {EMPLOYEES.map((emp) => {
                    const key = `${date}_${period}_${emp}`;
                    const value = data?.[key]?.value || "";

                    return (
                      <td key={emp} style={tdCell}>
                        <button
                          onClick={() =>
                            editCell(date, period, emp)
                          }
                          style={{
                            ...cellBtn,
                            background: value ? "#c8e6c9" : "#fff",
                          }}
                        >
                          {value || "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
const page = {
  padding: 16,
  fontFamily: "system-ui, sans-serif",
};

const controls = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginBottom: 12,
  flexWrap: "wrap",
};

const tableWrap = {
  overflowX: "auto",
  border: "1px solid #ddd",
  borderRadius: 8,
};

const table = {
  borderCollapse: "collapse",
  width: "100%",
  minWidth: 800,
};

const th = {
  background: "#f3f4f6",
  padding: 8,
  borderBottom: "1px solid #ddd",
  textAlign: "left",
};

const thSticky = {
  ...th,
  position: "sticky",
  left: 0,
  zIndex: 2,
};

const tdSticky = {
  padding: 8,
  borderBottom: "1px solid #eee",
  background: "#fff",
  position: "sticky",
  left: 0,
  zIndex: 1,
  minWidth: 160,
};

const tdPeriod = {
  padding: 8,
  borderBottom: "1px solid #eee",
  minWidth: 70,
};

const tdCell = {
  padding: 6,
  borderBottom: "1px solid #eee",
  minWidth: 160,
};

const cellBtn = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ccc",
  textAlign: "left",
  cursor: "pointer",
};

const small = {
  fontSize: 12,
  color: "#666",
};

const errorBox = {
  background: "#ffecec",
  border: "1px solid #f5b5b5",
  padding: 10,
  marginBottom: 10,
};
