import { useMemo, useState } from "react";
import { useSlotsRange } from "../lib/useSlots";

// Add more names here anytime
const EMPLOYEES = ["JOSH", "JOE", "ALEX", "FRANCES"];

// AM/PM rows like your sheet
const PERIODS = ["AM", "PM"];

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

// Monday as start of week
function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun,1=Mon...
  const diff = (day === 0 ? -6 : 1 - day);
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function prettyDay(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

function truncate(s, max = 26) {
  if (!s) return "";
  const clean = String(s).replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

export default function Home() {
  const [anchorDate, setAnchorDate] = useState(new Date()); // any date within the week
  const [weeksToShow, setWeeksToShow] = useState(1);

  const start = useMemo(() => startOfWeekMonday(anchorDate), [anchorDate]);
  const days = useMemo(() => {
    const totalDays = weeksToShow * 7;
    return Array.from({ length: totalDays }, (_, i) => addDays(start, i));
  }, [start, weeksToShow]);

  const startIso = useMemo(() => isoDate(days[0]), [days]);
  const endIso = useMemo(() => isoDate(days[days.length - 1]), [days]);

  const { data, error, upsertSlot } = useSlotsRange(startIso, endIso);

  const onCellClick = async (dateIso, period, employee) => {
    const key = `${dateIso}_${period}_${employee}`;
    const existing = data?.[key]?.value || "";

    // Simple + reliable for now. We can upgrade to a modal next.
    const hint =
      "Enter booking details (e.g. name + address). Leave blank and press OK to clear.\n\nExample:\nSmith Kitchen\n12 High Street, Winchester";
    const next = window.prompt(hint, existing);

    // If user cancelled prompt, do nothing
    if (next === null) return;

    await upsertSlot({ date: dateIso, period, employee, value: next });
  };

  const moveWeeks = (deltaWeeks) => {
    setAnchorDate((prev) => addDays(prev, deltaWeeks * 7));
  };

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
      <h1 style={{ margin: 0 }}>Team Schedule</h1>
      <p style={{ marginTop: 6, marginBottom: 12, color: "#555" }}>
        Click a cell to add/edit a booking (name/address). Blank clears.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => moveWeeks(-1)} style={btn}>← Prev</button>
        <button onClick={() => moveWeeks(1)} style={btn}>Next →</button>

        <label style={{ marginLeft: 8 }}>
          Weeks:&nbsp;
          <select
            value={weeksToShow}
            onChange={(e) => setWeeksToShow(Number(e.target.value))}
            style={{ padding: 6, fontSize: 14 }}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </label>

        <span style={{ marginLeft: 8, color: "#555", fontSize: 14 }}>
          Showing {startIso} → {endIso}
        </span>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#ffecec", border: "1px solid #f5b5b5", marginBottom: 12 }}>
          Error loading schedule. If you see a “permission” message, we’ll adjust Firestore rules.
        </div>
      )}

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #ddd",
          borderRadius: 10,
          // Stop the blue highlight selection issue
          userSelect: "none",
          WebkitUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={thStickyLeft}>DATE</th>
              <th style={th}>PERIOD</th>
              {EMPLOYEES.map((e) => (
                <th key={e} style={th}>{e}</th>
              ))}
              <th style={th}>NOTES</th>
            </tr>
          </thead>

          <tbody>
            {days.map((d) => {
              const dateIso = isoDate(d);
              return PERIODS.map((period, idx) => (
                <tr key={`${dateIso}_${period}`}>
                  {idx === 0 && (
                    <td style={tdStickyLeft} rowSpan={2}>
                      <div style={{ fontWeight: 700 }}>{prettyDay(d)}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{dateIso}</div>
                    </td>
                  )}

                  <td style={tdPeriod}><strong>{period}</strong></td>

                  {EMPLOYEES.map((emp) => {
                    const key = `${dateIso}_${period}_${emp}`;
                    const value = data?.[key]?.value || "";
                    const booked = !!value;

                    return (
                      <td key={emp} style={tdCell}>
                        <button
                          type="button"
                          onClick={() => onCellClick(dateIso, period, emp)}
                          style={{
                            ...cellButton,
                            background: booked ? "#c8e6c9" : "#fff",
                            borderColor: booked ? "#77c47a" : "#ddd",
                          }}
                          title={value || "Click to add booking"}
                        >
                          {truncate(value)}
                        </button>
                      </td>
                    );
                  })}

                  {/* NOTES column placeholder: we can wire this up next */}
                  <td style={tdNotes}>
                    {/* future: store notes per date+period */}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        Tip: Put booking name + address on separate lines. Example: <br />
        <code>Smith Kitchen{"\\n"}12 High Street, Winchester</code>
      </div>
    </div>
  );
}

const btn = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const th = {
  background: "#f3f4f6",
  borderBottom: "1px solid #ddd",
  padding: 10,
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 2,
};

const thStickyLeft = {
  ...th,
  left: 0,
  zIndex: 3,
};

const tdStickyLeft = {
  borderBottom: "1px solid #eee",
  padding: 10,
  background: "#fff",
  position: "sticky",
  left: 0,
  zIndex: 1,
  minWidth: 180,
};

const tdPeriod = {
  borderBottom: "1px solid #eee",
  padding: 10,
  background: "#fff",
  minWidth: 90,
};

const tdCell = {
  borderBottom: "1px solid #eee",
  padding: 6,
  background: "#fff",
  minWidth: 170,
};

const tdNotes = {
  borderBottom: "1px solid #eee",
  padding: 6,
  background: "#fff",
  minWidth: 220,
};

const cellButton = {
  width: "100%",
  padding: "10px 10px",
  borderRadius: 10,
  border: "1px solid #ddd",
  textAlign: "left",
  cursor: "pointer",
  lineHeight: 1.2,
  // helps prevent mobile text highlighting
  WebkitTapHighlightColor: "transparent",
};
