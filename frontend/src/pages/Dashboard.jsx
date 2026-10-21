import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { money, statusBadge } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = user.role === 'STUDENT' ? '/dashboard/student' : '/dashboard/admin';
    api
      .get(url)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, [user.role]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="text-[var(--muted)]">Loading dashboard...</div>;

  if (user.role === 'STUDENT') {
    return (
      <div>
        <h1 className="page-title">Student Dashboard</h1>
        <p className="page-sub">
          Welcome, {data.student.firstName} {data.student.lastName}
        </p>
        <div className="stat-grid mb-5">
          <StatCard label="Request Status" value={data.latestRequest?.status || 'None'} />
          <StatCard label="Hostel" value={data.hostel?.name || 'Not assigned'} />
          <StatCard label="Room" value={data.room?.roomNumber || '—'} />
          <StatCard label="Hostel Fees" value={money(data.fees)} />
          <StatCard label="Amount Paid" value={money(data.amountPaid)} />
          <StatCard label="Outstanding" value={money(data.outstandingBalance)} />
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <Link to="/my-request" className="btn btn-primary">
            Hostel request
          </Link>
          <Link to="/my-fees" className="btn btn-secondary">
            Fees & payments
          </Link>
          <Link to="/my-maintenance" className="btn btn-secondary">
            Maintenance
          </Link>
          <Link to="/profile" className="btn btn-secondary">
            My profile
          </Link>
        </div>
        <div className="card">
          <h2 className="font-display text-xl mb-3">Recent Maintenance</h2>
          {data.maintenance?.length ? (
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Title</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.maintenance.map((m) => (
                    <tr key={m.id}>
                      <td>{m.requestNumber}</td>
                      <td>{m.title}</td>
                      <td>
                        <span className={statusBadge(m.status)}>{m.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--muted)]">No maintenance requests yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Administrator Dashboard</h1>
      <p className="page-sub">Hostel operations overview for RP Musanze College</p>
      <div className="stat-grid">
        <StatCard label="Students" value={data.totalStudents} />
        <StatCard label="Hostels" value={data.totalHostels} />
        <StatCard label="Rooms" value={data.totalRooms} />
        <StatCard label="Capacity" value={data.totalCapacity} />
        <StatCard label="Occupied" value={data.occupiedSpaces} />
        <StatCard label="Available" value={data.availableSpaces} />
        <StatCard label="Pending Requests" value={data.pendingRequests} />
        <StatCard label="Approved" value={data.approvedRequests} />
        <StatCard label="Rejected" value={data.rejectedRequests} />
        <StatCard label="Checked In" value={data.checkedIn} />
        <StatCard label="Checked Out" value={data.checkedOut} />
        <StatCard label="Total Fees" value={money(data.totalFees)} />
        <StatCard label="Payments" value={money(data.totalPayments)} />
        <StatCard label="Outstanding" value={money(data.outstandingBalances)} />
        <StatCard label="Pending Maintenance" value={data.pendingMaintenance} />
      </div>
      <div className="flex flex-wrap gap-2 mt-5">
        <Link to="/requests" className="btn btn-primary">
          Review requests
        </Link>
        <Link to="/allocations" className="btn btn-secondary">
          Allocate rooms
        </Link>
        <Link to="/rooms" className="btn btn-secondary">
          Add or delete rooms
        </Link>
        <Link to="/occupancy" className="btn btn-secondary">
          Occupancy
        </Link>
      </div>
    </div>
  );
}
