import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatDate, statusBadge } from '../api';

export default function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const load = async () => {
    const { data } = await api.get('/requests', { params: { status: status || undefined } });
    setRequests(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, [status]);

  const review = async (id, decision) => {
    try {
      await api.post(`/requests/${id}/review`, { status: decision, decisionNote: note });
      setNote('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed');
    }
  };

  const cancelRequest = async (id) => {
    try {
      await api.post(`/requests/${id}/cancel-admin`, { reason: 'Cancelled by admin due to non-attendance or withdrawal' });
      setNote('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed');
    }
  };

  return (
    <div>
      <h1 className="page-title">Hostel Request Review</h1>
      <p className="page-sub">Approve or reject student accommodation requests</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="flex flex-wrap gap-2 mb-3">
        {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', ''].map((s) => (
          <button key={s || 'ALL'} className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatus(s)}>
            {s || 'ALL'}
          </button>
        ))}
        <input className="input max-w-xs" placeholder="Decision note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Request #</th>
              <th>Student</th>
              <th>Preferred Hostel / Room</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.requestNumber}</td>
                <td>
                  {r.student.firstName} {r.student.lastName} ({r.student.studentId})
                </td>
                <td>
                  {r.preferredHostel?.name || 'Any'}
                  {r.preferredRoom ? ` / ${r.preferredRoom.roomNumber}` : ''}
                </td>
                <td>{r.reason || '—'}</td>
                <td>{formatDate(r.requestDate)}</td>
                <td>
                  <span className={statusBadge(r.status)}>{r.status}</span>
                </td>
                <td className="space-x-2">
                  {r.status === 'PENDING' && (
                    <>
                      <button className="btn btn-primary" onClick={() => review(r.id, 'APPROVED')}>
                        Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => review(r.id, 'REJECTED')}>
                        Reject
                      </button>
                    </>
                  )}
                  {r.status === 'APPROVED' && !r.allocation && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/allocations?requestId=${r.id}`)}
                      >
                        Allocate room
                      </button>
                      <button className="btn btn-danger" onClick={() => cancelRequest(r.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                  {r.status === 'PENDING' && (
                    <button className="btn btn-danger" onClick={() => cancelRequest(r.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && (
              <tr>
                <td colSpan="7" className="text-[var(--muted)]">
                  No hostel requests in this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
