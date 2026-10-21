import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

const FEATURES = [
  {
    title: 'Accommodation Requests',
    text: 'Students submit hostel requests. Hostel administrators review, approve, or reject them with a recorded decision.',
  },
  {
    title: 'Room Allocation',
    text: 'Approved students are allocated to rooms using capacity rules. Available spaces equal room capacity minus assigned students.',
  },
  {
    title: 'Check-in & Check-out',
    text: 'Administrators record occupancy movement so hostel spaces stay accurate after students arrive or leave.',
  },
  {
    title: 'Fees & Verified Payments',
    text: 'Fees are assigned in the system. Students pay outside SHMS and bring proof. Administrators record confirmed payments only.',
  },
  {
    title: 'Maintenance',
    text: 'Students report facility issues. Staff update progress from pending to in progress or completed.',
  },
  {
    title: 'Reports & Occupancy',
    text: 'Administrators generate student, occupancy, payment, and outstanding-balance reports with CSV export.',
  },
];

export default function Home() {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api
      .get('/public/overview')
      .then((res) => setInfo(res.data))
      .catch(() => {
        setInfo({
          institution: 'RP Musanze College',
          system: 'Student Hostel Management System',
          academicYear: '2025/2026',
          hostels: [],
          totals: { hostels: 0, rooms: 0, capacity: 0, occupied: 0, available: 0 },
        });
      });
  }, []);

  const totals = info?.totals;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="sticky top-0 z-20 bg-[var(--brand-dark)] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <a href="#top" className="font-display text-xl tracking-wide">
            SHMS 
          </a>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <a href="#about" className="opacity-90 hover:opacity-100">
              About
            </a>
            <a href="#hostels" className="opacity-90 hover:opacity-100">
              Hostels
            </a>
            <a href="#features" className="opacity-90 hover:opacity-100">
              Services
            </a>
            <a href="#contact" className="opacity-90 hover:opacity-100">
              Contact
            </a>
            {user ? (
              <Link to="/dashboard" className="btn btn-secondary">
                Open dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-secondary">
                Staff / Student login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section id="top" className="relative min-h-[78vh] flex items-end">
        <img
          src="/images/campus.jpg"
          alt="RP Musanze College campus entrance sign"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="relative max-w-6xl mx-auto px-4 pb-14 pt-28 text-white">
          <p className="text-xs uppercase tracking-[0.22em] opacity-90">
            {info?.institution || 'RP Musanze College'}
          </p>
          <h1 className="font-display text-4xl md:text-6xl mt-2 max-w-3xl leading-tight">
            Student Hostel Management System
          </h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg text-white/90">
            A college system for hostel requests, room allocation, occupancy, fees, verified
            payments, maintenance, and reports — built for RP Musanze College.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" className="btn btn-primary">
              Sign in to SHMS
            </Link>
            <a href="#hostels" className="btn btn-secondary">
              View hostel information
            </a>
          </div>
        </div>
      </section>

      {totals && (
        <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
          <div className="stat-grid">
            <div className="stat">
              <div className="label">Hostels</div>
              <div className="value">{totals.hostels}</div>
            </div>
            <div className="stat">
              <div className="label">Rooms</div>
              <div className="value">{totals.rooms}</div>
            </div>
            <div className="stat">
              <div className="label">Capacity</div>
              <div className="value">{totals.capacity}</div>
            </div>
            <div className="stat">
              <div className="label">Occupied</div>
              <div className="value">{totals.occupied}</div>
            </div>
            <div className="stat">
              <div className="label">Available spaces</div>
              <div className="value">{totals.available}</div>
            </div>
          </div>
        </section>
      )}

      <section id="about" className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="font-display text-3xl text-[var(--brand-dark)]">About US </h2>
          <p className="mt-4 text-[var(--muted)] leading-relaxed">
            SHMS helps RP Musanze College manage student accommodation in one place. Students
            request a hostel, administrators review the request, and rooms are allocated only when
            space remains. Check-in and check-out keep occupancy current.
          </p>
          <p className="mt-3 text-[var(--muted)] leading-relaxed">
            Hostel fees are assigned in the system. Payment is made outside SHMS (mobile money,
            bank, or cash). Students present proof to the hostel office, and staff record the
            verified amount. There is no online payment gateway and no proof upload.
          </p>
          <p className="mt-3 text-[var(--muted)] leading-relaxed">
            Academic year: <strong>{info?.academicYear || '2025/2026'}</strong>
          </p>
        </div>
        <img
          src="/images/hostel.jpg"
          alt="RP Musanze College hostel building"
          className="w-full rounded-2xl border border-[var(--line)] object-cover max-h-[420px]"
        />
      </section>

      <section id="hostels" className="bg-white border-y border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="font-display text-3xl text-[var(--brand-dark)]">Hostel information</h2>
          <p className="page-sub mt-2">Live occupancy uses the same rule as the administration system.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {(info?.hostels || []).map((h) => (
              <article key={h.id} className="card">
                <h3 className="font-display text-2xl text-[var(--brand-dark)]">{h.name}</h3>
                <p className="text-sm text-[var(--muted)] mt-1">{h.location || 'RP Musanze Campus'}</p>
                <p className="mt-3 text-sm">{h.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">Rooms</dt>
                    <dd className="font-semibold">{h.roomCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Capacity</dt>
                    <dd className="font-semibold">{h.capacity}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Occupied</dt>
                    <dd className="font-semibold">{h.occupied}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Available</dt>
                    <dd className="font-semibold">{h.available}</dd>
                  </div>
                </dl>
              </article>
            ))}
            {!info?.hostels?.length && (
              <p className="text-[var(--muted)]">Hostel records will appear here when the API is running.</p>
            )}
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl text-[var(--brand-dark)]">What SHMS manages</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {FEATURES.map((f) => (
            <article key={f.title} className="card">
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="text-sm text-[var(--muted)] mt-2 leading-relaxed">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-white border-t border-[var(--line)]">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display text-3xl text-[var(--brand-dark)]">Hostel office contact</h2>
            <p className="mt-3 text-[var(--muted)] leading-relaxed">
              Visit the hostel administration office for requests, room allocation, and to present
              payment proof. There is no online payment in SHMS.
            </p>
          </div>
          <div className="card">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Office</dt>
                <dd className="font-semibold">{info?.contact?.office || 'Hostel Administration Office, RP Musanze College'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Phone</dt>
                <dd className="font-semibold">{info?.contact?.phone || '+250 788 300 000'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Email</dt>
                <dd className="font-semibold">{info?.contact?.email || 'hosteladmin@rpmusanze.ac.rw'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Hours</dt>
                <dd className="font-semibold">{info?.contact?.hours || 'Monday–Friday, 08:00–17:00'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
