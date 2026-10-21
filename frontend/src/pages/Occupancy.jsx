import { useEffect, useState } from 'react';
import api, { statusBadge } from '../api';

export default function Occupancy() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/rooms')
      .then((res) => setRooms(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const capacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupied = rooms.reduce((s, r) => s + r.occupied, 0);

  return (
    <div>
      <h1 className="page-title">Hostel Occupancy</h1>
      <p className="page-sub">Available Spaces = Room Capacity − Assigned Students</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid mb-4">
        <div className="stat">
          <div className="label">Total Capacity</div>
          <div className="value">{capacity}</div>
        </div>
        <div className="stat">
          <div className="label">Occupied</div>
          <div className="value">{occupied}</div>
        </div>
        <div className="stat">
          <div className="label">Available</div>
          <div className="value">{capacity - occupied}</div>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Hostel</th>
              <th>Room</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Available</th>
              <th>Occupants</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r.id}>
                <td>{r.hostel?.name}</td>
                <td>{r.roomNumber}</td>
                <td>{r.capacity}</td>
                <td>{r.occupied}</td>
                <td>{r.available}</td>
                <td className="text-sm">
                  {r.allocations?.length
                    ? r.allocations.map((a) => `${a.student.firstName} ${a.student.lastName}`).join(', ')
                    : '—'}
                </td>
                <td>
                  <span className={statusBadge(r.isFull ? 'FULL' : r.status)}>
                    {r.isFull ? 'FULL' : r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
