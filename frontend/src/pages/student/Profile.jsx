import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Profile() {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/students/me')
      .then((res) => setStudent(res.data))
      .catch((e) => setError(e.response?.data?.message || 'Failed to load'));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!student) return <div className="text-[var(--muted)]">Loading...</div>;

  const currentRoom = student.allocations?.find((a) => ['ACTIVE', 'CHECKED_IN'].includes(a.status));

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <p className="page-sub">Your personal and academic information</p>
      <div className="card max-w-2xl">
        <dl className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Student ID</dt>
            <dd className="font-semibold">{student.studentId}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Registration No</dt>
            <dd className="font-semibold">{student.registrationNo}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Name</dt>
            <dd className="font-semibold">
              {student.firstName} {student.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Gender</dt>
            <dd className="font-semibold">{student.gender}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Phone</dt>
            <dd className="font-semibold">{student.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Email</dt>
            <dd className="font-semibold">{student.user?.email}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Program</dt>
            <dd className="font-semibold">{student.program || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Department</dt>
            <dd className="font-semibold">{student.department || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Year of Study</dt>
            <dd className="font-semibold">{student.yearOfStudy || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Status</dt>
            <dd className="font-semibold">{student.status}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Address</dt>
            <dd className="font-semibold">{student.address || '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Current hostel</dt>
            <dd className="font-semibold">{currentRoom?.room?.hostel?.name || 'Not assigned'}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Current room</dt>
            <dd className="font-semibold">{currentRoom?.room?.roomNumber || '—'}</dd>
          </div>
        </dl>
        <Link to="/account" className="btn btn-secondary mt-4">
          Change password
        </Link>
      </div>
    </div>
  );
}
