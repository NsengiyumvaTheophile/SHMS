import { useEffect, useState } from 'react';
import api, { formatDate, money } from '../../api';

export default function MyFees() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/fees/account/me')
      .then((res) => setAccount(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!account) return <div className="text-[var(--muted)]">Loading...</div>;

  return (
    <div>
      <h1 className="page-title">My Fees & Payments</h1>
      <p className="page-sub">
        Pay using approved external methods, then present payment proof to the Hostel Administrator for verification.
      </p>

      <div className="stat-grid mb-4">
        <div className="stat">
          <div className="label">Total Hostel Fee</div>
          <div className="value">{money(account.totalFee)}</div>
        </div>
        <div className="stat">
          <div className="label">Amount Paid</div>
          <div className="value">{money(account.totalPaid)}</div>
        </div>
        <div className="stat">
          <div className="label">Outstanding Balance</div>
          <div className="value">{money(account.outstandingBalance)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-display text-xl mb-3">Assigned Fees</h2>
          <ul className="space-y-2 text-sm">
            {account.feeAssignments.map((a) => (
              <li key={a.id} className="flex justify-between border-b border-[var(--line)] pb-2">
                <span>{a.fee.name}</span>
                <strong>{money(a.fee.amount)}</strong>
              </li>
            ))}
            {!account.feeAssignments.length && <li className="text-[var(--muted)]">No fees assigned yet.</li>}
          </ul>
        </div>
        <div className="card">
          <h2 className="font-display text-xl mb-3">Payment History</h2>
          <ul className="space-y-2 text-sm">
            {account.payments.map((p) => (
              <li key={p.id} className="border-b border-[var(--line)] pb-2">
                <div className="flex justify-between">
                  <span>{formatDate(p.paymentDate)}</span>
                  <strong>{money(p.amount)}</strong>
                </div>
                <div className="text-[var(--muted)]">
                  {p.paymentMethod} {p.referenceNumber ? `· ${p.referenceNumber}` : ''}
                </div>
              </li>
            ))}
            {!account.payments.length && <li className="text-[var(--muted)]">No payments recorded yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
