import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CONTACT = {
  office: 'Hostel Administration Office, RP Musanze College',
  phone: '+250 788 300 000',
  email: 'hosteladmin@rpmusanze.ac.rw',
  hours: 'Monday–Friday, 08:00–17:00',
};

export default function SiteFooter({ variant = 'public' }) {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    api
      .get('/public/overview')
      .then((res) => setInfo(res.data))
      .catch(() => setInfo({ contact: DEFAULT_CONTACT, institution: 'RP Musanze College' }));
  }, []);

  const contact = info?.contact || DEFAULT_CONTACT;
  const publicLinks = [
    { href: '/', label: 'Home', type: 'route' },
    { href: '/#about', label: 'About', type: 'hash' },
    { href: '/#hostels', label: 'Hostels', type: 'hash' },
    { href: '/#features', label: 'Services', type: 'hash' },
    { href: '/#contact', label: 'Contact', type: 'hash' },
    { href: '/login', label: 'Login', type: 'route' },
  ];
  const appLinks = user?.role === 'STUDENT'
    ? [
        { href: '/dashboard', label: 'Dashboard', type: 'route' },
        { href: '/my-request', label: 'Hostel request', type: 'route' },
        { href: '/my-fees', label: 'Fees', type: 'route' },
        { href: '/my-maintenance', label: 'Maintenance', type: 'route' },
        { href: '/profile', label: 'Profile', type: 'route' },
      ]
    : [
        { href: '/dashboard', label: 'Dashboard', type: 'route' },
        { href: '/students', label: 'Students', type: 'route' },
        { href: '/rooms', label: 'Rooms', type: 'route' },
        { href: '/allocations', label: 'Allocations', type: 'route' },
        { href: '/requests', label: 'Requests', type: 'route' },
        { href: '/', label: 'Campus home', type: 'route' },
      ];

  const links = variant === 'app' ? appLinks : publicLinks;

  return (
    <footer className="bg-[var(--brand-dark)] text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-display text-xl">SHMS</div>
          <p className="opacity-80 mt-2 leading-relaxed">
            {info?.system || 'Student Hostel Management System'}
            <br />
            {info?.institution || 'RP Musanze College'}
          </p>
          <p className="opacity-70 mt-2">www.rp.ac.rw</p>
        </div>

        <div>
          <h2 className="font-display text-lg mb-3">Quick links</h2>
          <ul className="space-y-2">
            {links.map((l) => (
              <li key={l.href}>
                {l.type === 'hash' ? (
                  <a href={l.href} className="opacity-85 hover:opacity-100 underline-offset-2 hover:underline">
                    {l.label}
                  </a>
                ) : (
                  <Link to={l.href} className="opacity-85 hover:opacity-100 underline-offset-2 hover:underline">
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
            {user && variant === 'public' && (
              <li>
                <Link to="/dashboard" className="opacity-85 hover:opacity-100 underline-offset-2 hover:underline">
                  Open dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div id="contact">
          <h2 className="font-display text-lg mb-3">Admin contact</h2>
          <ul className="space-y-2 opacity-90">
            <li>{contact.office}</li>
            <li>
              Phone:{' '}
              <a className="underline underline-offset-2" href={`tel:${contact.phone}`}>
                {contact.phone}
              </a>
            </li>
            <li>
              Email:{' '}
              <a className="underline underline-offset-2" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </li>
            <li>Hours: {contact.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="max-w-6xl mx-auto px-4 py-3 text-xs opacity-70 flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} RP Musanze College · SHMS</span>
          <span>Academic year {info?.academicYear || '2025/2026'}</span>
        </div>
      </div>
    </footer>
  );
}
