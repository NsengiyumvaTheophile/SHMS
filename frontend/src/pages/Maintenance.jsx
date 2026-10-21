import { useEffect, useState } from 'react';
import api, { formatDate, statusBadge } from '../api';

export default function Maintenance() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await api.get('/maintenance');
    setItems(data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const update = async (id, status) => {
    const actionsTaken = prompt('Actions taken / notes:') || '';
    try {
      await api.put(`/maintenance/${id}`, { status, actionsTaken });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      <h1 className="page-title">Maintenance Requests</h1>
      <p className="page-sub">Review and update hostel facility maintenance requests</p>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Number</th>
              <th>Student</th>
              <th>Title</th>
              <th>Description</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.requestNumber}</td>
                <td>
                  {m.student.firstName} {m.student.lastName}
                </td>
                <td>{m.title}</td>
                <td>{m.description}</td>
                <td>{formatDate(m.submittedAt)}</td>
                <td>
                  <span className={statusBadge(m.status)}>{m.status}</span>
                </td>
                <td className="space-x-1">
                  {m.status === 'PENDING' && (
                    <button className="btn btn-secondary" onClick={() => update(m.id, 'IN_PROGRESS')}>
                      Start
                    </button>
                  )}
                  {m.status !== 'COMPLETED' && m.status !== 'REJECTED' && (
                    <button className="btn btn-primary" onClick={() => update(m.id, 'COMPLETED')}>
                      Complete
                    </button>
                  )}
                  {m.status === 'PENDING' && (
                    <button className="btn btn-danger" onClick={() => update(m.id, 'REJECTED')}>
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
