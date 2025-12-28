import { useState } from 'react';
import { useSlots } from '../lib/useSlots';

const EMPLOYEES = ['JOSH', 'JOE', 'ALEX', 'FRANCES'];

const formatDate = (d) => d.toISOString().slice(0, 10);

export default function Home() {
  const [date, setDate] = useState(formatDate(new Date()));
  const { data, error, toggleSlot } = useSlots(date);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <h1>Team Schedule</h1>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />

      <table style={{ marginTop: 16, borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={th}>Period</th>
            {EMPLOYEES.map(e => <th key={e} style={th}>{e}</th>)}
            <th style={th}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {['AM', 'PM'].map(period => (
            <tr key={period}>
              <td style={td}><strong>{period}</strong></td>
              {EMPLOYEES.map(emp => {
                const booked = data[`${period}_${emp}`];
                return (
                  <td
                    key={emp}
                    style={{ ...td, background: booked ? '#c8e6c9' : '#fff', cursor: 'pointer' }}
                    onClick={() => toggleSlot({ period, employee: emp })}
                  >
                    {booked ? 'Booked' : ''}
                  </td>
                );
              })}
              <td style={td}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = { border: '1px solid #ccc', padding: 8, background: '#eee' };
const td = { border: '1px solid #ccc', padding: 8, textAlign: 'center' };
