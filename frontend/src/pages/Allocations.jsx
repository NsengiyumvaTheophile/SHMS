import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { formatDate, statusBadge } from '../api';

export default function Allocations() {
  const [searchParams] = useSearchParams();
  const [allocations, setAllocations] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ requestId: searchParams.get('requestId') || '', roomId: '' });
  const [preferHostelOnly, setPreferHostelOnly] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [moveRoom, setMoveRoom] = useState({});

  const load = async () => {
    const [a, req, rm] = await Promise.all([
      api.get('/allocations'),
      api.get('/requests', { params: { status: 'APPROVED' } }),
      api.get('/rooms', { params: { availableOnly: true } }),
    ]);
    setAllocations(a.data);
    setApproved(req.data.filter((r) => !r.allocation));
    setRooms(rm.data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const selectedRequest = approved.find((r) => String(r.id) === String(form.requestId));

  const roomsForStudent = useMemo(() => {
    if (!selectedRequest) return rooms;
    const preferredId = selectedRequest.preferredHostelId;
    if (preferHostelOnly && preferredId) {
      const matching = rooms.filter((r) => r.hostelId === preferredId);
      return matching.length ? matching : rooms;
    }
    return rooms;
  }, [rooms, selectedRequest, preferHostelOnly]);

  const allocate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api.post('/allocations', {
        requestId: Number(form.requestId),
        roomId: Number(form.roomId),
      });
      setMsg('Student allocated to the selected room');
      setForm({ requestId: '', roomId: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Allocation failed');
    }
  };

  const checkIn = async (allocationId) => {
    try {
      await api.post('/check-in', { allocationId });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in failed');
    }
  };

  const checkOut = async (allocationId) => {
    const reason = prompt('Check-out reason (optional):') || '';
    try {
      await api.post('/check-out', { allocationId, reason });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Check-out failed');
    }
  };

  const cancelAllocation = async (allocationId) => {
    const reason = prompt('Reason for cancellation (e.g. student did not attend / withdrew):') || 'Cancelled by admin due to non-attendance or withdrawal';
    try {
      await api.post(`/allocations/${allocationId}/cancel`, { reason });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Allocation cancellation failed');
    }
  };

  const transfer = async (allocationId) => {
    const roomId = moveRoom[allocationId];
    if (!roomId) {
      setError('Select a different available room first');
      return;
    }
    setError('');
    setMsg('');
    try {
      await api.post(`/allocations/${allocationId}/transfer`, { roomId: Number(roomId) });
      setMsg('Student moved to the new room');
      setMoveRoom((m) => ({ ...m, [allocationId]: '' }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Room change failed');
    }
  };

  return (
    <div>
      <h1 className="page-title">Room Allocation & Occupancy Movement</h1>
      <p className="page-sub">Select an approved student, then assign them to a room that still has space</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card mb-4">
        <h2 className="font-display text-xl mb-3">Allocate student to an available room</h2>
        {approved.length === 0 && (
          <p className="text-sm text-[var(--muted)] mb-3">
            No approved students waiting for a room. Review pending requests first.
          </p>
        )}
        <form onSubmit={allocate} className="form-grid">
          <label>
            Select student
            <select
              className="select"
              value={form.requestId}
              onChange={(e) => {
                const requestId = e.target.value;
                const req = approved.find((r) => String(r.id) === requestId);
                const preferred = req?.preferredRoomId;
                const stillOpen = rooms.some((room) => room.id === preferred);
                setForm({ requestId, roomId: stillOpen ? String(preferred) : '' });
              }}
              required
            >
              <option value="">Select student...</option>
              {approved.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.student.firstName} {r.student.lastName} ({r.student.studentId}) — {r.requestNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            Available room
            <select
              className="select"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              required
              disabled={!form.requestId}
            >
              <option value="">{form.requestId ? 'Select available room...' : 'Select a student first'}</option>
              {roomsForStudent.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.hostel.name} / {r.roomNumber} — {r.available} of {r.capacity} spaces free
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 font-normal text-sm text-[var(--muted)]">
              <input
                type="checkbox"
                checked={preferHostelOnly}
                onChange={(e) => setPreferHostelOnly(e.target.checked)}
              />
              Prefer the student’s requested hostel
            </label>
            <button className="btn btn-primary" disabled={!form.requestId || !form.roomId}>
              Allocate to room
            </button>
          </div>
        </form>
        {selectedRequest?.preferredHostel && (
          <p className="text-sm text-[var(--muted)] mt-3">
            Preferred hostel: <strong>{selectedRequest.preferredHostel.name}</strong>
            {roomsForStudent.length === 0 && ' — no rooms with free space in that hostel. Uncheck the preference to see other hostels.'}
          </p>
        )}
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Student</th>
              <th>Hostel / Room</th>
              <th>Date</th>
              <th>Status</th>
              <th>Move to another room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((a) => {
              const otherRooms = rooms.filter((r) => r.id !== a.roomId);
              const canMove = ['ACTIVE', 'CHECKED_IN'].includes(a.status);
              return (
                <tr key={a.id}>
                  <td>
                    {a.student.firstName} {a.student.lastName}
                    <div className="text-xs text-[var(--muted)]">{a.student.studentId}</div>
                  </td>
                  <td>
                    {a.room.hostel.name} / {a.room.roomNumber}
                  </td>
                  <td>{formatDate(a.allocationDate)}</td>
                  <td>
                    <span className={statusBadge(a.status)}>{a.status}</span>
                  </td>
                  <td>
                    {canMove ? (
                      <div className="flex flex-wrap gap-2">
                        <select
                          className="select"
                          value={moveRoom[a.id] || ''}
                          onChange={(e) => setMoveRoom((m) => ({ ...m, [a.id]: e.target.value }))}
                        >
                          <option value="">Different available room...</option>
                          {otherRooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.hostel.name} / {r.roomNumber} ({r.available} free)
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-secondary" onClick={() => transfer(a.id)}>
                          Move
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="space-x-2">
                    {a.status === 'ACTIVE' && (
                      <>
                        <button className="btn btn-primary" onClick={() => checkIn(a.id)}>
                          Check In
                        </button>
                        <button className="btn btn-danger" onClick={() => cancelAllocation(a.id)}>
                          Cancel
                        </button>
                      </>
                    )}
                    {a.status === 'CHECKED_IN' && (
                      <>
                        <button className="btn btn-secondary" onClick={() => checkOut(a.id)}>
                          Check Out
                        </button>
                        <button className="btn btn-danger" onClick={() => cancelAllocation(a.id)}>
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {!allocations.length && (
              <tr>
                <td colSpan="6" className="text-[var(--muted)]">
                  No allocations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
