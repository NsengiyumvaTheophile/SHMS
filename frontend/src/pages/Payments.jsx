import { useEffect, useState } from 'react';
import api, { formatDate, money } from '../api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    studentId: '',
    amount: '',
    paymentMethod: 'MOBILE_MONEY',
    referenceNumber: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [p, s] = await Promise.all([api.get('/payments'), api.get('/students')]);
    setPayments(p.data);
    setStudents(s.data);
  };

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      const { data } = await api.post('/payments', form);
      setMsg(
        `Payment recorded. Outstanding balance now ${money(data.balance.outstandingBalance)}`
      );
      setForm({ studentId: '', amount: '', paymentMethod: 'MOBILE_MONEY', referenceNumber: '', notes: '' });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  return (
    <div>
      <h1 className="page-title">Payment Verification & Recording</h1>
      <p className="page-sub">
        Students pay outside the system and bring proof physically. Admins verify and record confirmed payments here.
        No online payment gateway or proof upload.
      </p>
      {error && <div className="alert alert-error">{error}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="card mb-4">
        <form onSubmit={submit} className="form-grid">
          <label>
            Student
            <select className="select" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.studentId})
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount (RWF)
            <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </label>
          <label>
            Payment Method
            <select className="select" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="BANK">Bank</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            Reference Number
            <input className="input" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
          </label>
          <label>
            Notes
            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </label>
          <div className="flex items-end">
            <button className="btn btn-primary">Record Verified Payment</button>
          </div>
        </form>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{formatDate(p.paymentDate)}</td>
                <td>
                  {p.student.firstName} {p.student.lastName}
                </td>
                <td>{money(p.amount)}</td>
                <td>{p.paymentMethod}</td>
                <td>{p.referenceNumber || '—'}</td>
                <td>{p.recordedBy?.username || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
