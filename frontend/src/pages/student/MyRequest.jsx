import { useEffect, useMemo, useState } from 'react';
import api, { formatDate, statusBadge } from '../../api';

export default function MyRequest() {
  const [student, setStudent] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ preferredHostelId: '', preferredRoomId: '', reason: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [me, h, r, rm] = await Promise.all([
      api.get('/students/me'),
      api.get('/hostels', { params: { activeOnly: true } }),
      api.get('/requests'),
      api.get('/rooms', { params: { availableOnly: true } }),
    ]);
    setStudent(me.data);
    setHostels(h.data);
    setRequests(r.data);
    setRooms(rm.data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const latest = requests[0];
  const activeRequest = requests.find((r) => ['PENDING', 'APPROVED'].includes(r.status));
  const currentRoom = student?.allocations?.find((a) => ['ACTIVE', 'CHECKED_IN'].includes(a.status));
  const canSubmit = !activeRequest && !currentRoom;

  const visibleRooms = useMemo(
    () =>
      rooms.filter((r) => {
        if (form.preferredHostelId && String(r.hostelId) !== String(form.preferredHostelId)) return false;
        return true;
      }),
    [rooms, form.preferredHostelId]
  );

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await api.post('/requests', {
        preferredHostelId: form.preferredHostelId || null,
        preferredRoomId: form.preferredRoomId || null,
        reason: form.reason,
      });
      setMsg('Hostel request submitted. Status is Pending until an administrator reviews it.');
      setForm({ preferredHostelId: '', preferredRoomId: '', reason: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  const statusHelp = () => {
    if (currentRoom) {
      return `You are allocated to ${currentRoom.room.hostel.name} / ${currentRoom.room.roomNumber}.`;
    }
    if (latest?.status === 'PENDING') {
      return 'Your request is waiting for hostel office review. You can cancel it while it is still pending.';
    }
    if (latest?.status === 'APPROVED' && !latest?.allocation) {
      return 'Your request was approved. The hostel office will assign you an available room.';
    }
    if (latest?.status === 'REJECTED') {
      return `Your last request was rejected${latest.decisionNote ? `: ${latest.decisionNote}` : '.'} You may submit a new request.`;
    }
    if (latest?.status === 'CANCELLED') {
      return 'Your last request was cancelled. You may submit a new request.';
    }
    return 'Submit a hostel request to be considered for a room.';
  };

  return (
    <div>
      <h1 className="page-title">My Hostel Request</h1>
      <p className="page-sub">Choose a hostel and optional room, then track approval and allocation</p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="alert alert-info">{statusHelp()}</div>

      {canSubmit ? (
        <div className="card mb-4">
          <h2 className="font-display text-xl mb-3">Submit hostel request</h2>
          <form onSubmit={submit} className="form-grid">
            <label>
              Preferred Hostel
              <select
                className="select"
                value={form.preferredHostelId}
                onChange={(e) => setForm({ ...form, preferredHostelId: e.target.value, preferredRoomId: '' })}
              >
                <option value="">Any available</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.available != null ? `(${h.available} spaces)` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferred room (optional)
              <select
                className="select"
                value={form.preferredRoomId}
                onChange={(e) => setForm({ ...form, preferredRoomId: e.target.value })}
              >
                <option value="">Any available room</option>
                {visibleRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.hostel.name} / {r.roomNumber} ({r.available} spaces)
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input
                className="input"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Why you need campus accommodation"
                required
              />
            </label>
            <div className="flex items-end">
              <button className="btn btn-primary">Submit Request</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card mb-4">
          <h2 className="font-display text-xl mb-2">Current request</h2>
          {activeRequest ? (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Request number</dt>
                <dd className="font-semibold">{activeRequest.requestNumber}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Status</dt>
                <dd>
                  <span className={statusBadge(activeRequest.status)}>{activeRequest.status}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Preferred hostel / room</dt>
                <dd className="font-semibold">
                  {activeRequest.preferredHostel?.name || 'Any'}
                  {activeRequest.preferredRoom ? ` / ${activeRequest.preferredRoom.roomNumber}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Submitted</dt>
                <dd className="font-semibold">{formatDate(activeRequest.requestDate)}</dd>
              </div>
              {activeRequest.decisionNote && (
                <div className="sm:col-span-2">
                  <dt className="text-[var(--muted)]">Office note</dt>
                  <dd className="font-semibold">{activeRequest.decisionNote}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-[var(--muted)]">You already have an active room assignment.</p>
          )}
        </div>
      )}

      <div className="card table-wrap">
        <h2 className="font-display text-xl mb-3">Request history</h2>
        <table className="data">
          <thead>
            <tr>
              <th>Request #</th>
              <th>Date</th>
              <th>Preferred Hostel / Room</th>
              <th>Status</th>
              <th>Office note</th>
              <th>Allocated room</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.requestNumber}</td>
                <td>{formatDate(r.requestDate)}</td>
                <td>
                  {r.preferredHostel?.name || 'Any'}
                  {r.preferredRoom ? ` / ${r.preferredRoom.roomNumber}` : ''}
                </td>
                <td>
                  <span className={statusBadge(r.status)}>{r.status}</span>
                </td>
                <td>{r.decisionNote || '—'}</td>
                <td>
                  {r.allocation
                    ? `${r.allocation.room.hostel.name} / ${r.allocation.room.roomNumber}`
                    : '—'}
                </td>
                <td>
                  {r.status === 'PENDING' && (
                    <button
                      className="btn btn-danger"
                      onClick={async () => {
                        if (!confirm('Cancel this pending request?')) return;
                        try {
                          setError('');
                          await api.post(`/requests/${r.id}/cancel`);
                          setMsg('Request cancelled. You can submit a new one.');
                          await load();
                        } catch (err) {
                          setError(err.response?.data?.message || 'Cancel failed');
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr>
                <td colSpan="7" className="text-[var(--muted)]">
                  You have not submitted a hostel request yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
