import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteFooter from '../components/SiteFooter';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('hosteladmin');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usernameOrEmail, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
    <div
      className="flex-1 flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(circle at top left, #d8efe6, transparent 40%), radial-gradient(circle at bottom right, #f7e4d6, transparent 35%), linear-gradient(160deg, #f7faf8, #eef5f1)',
      }}
    >
      <div className="w-full max-w-md card shadow-sm">
        <div className="mb-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">RP Musanze College</div>
          <h1 className="font-display text-3xl mt-1 text-[var(--brand-dark)]">SHMS Login</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Student Hostel Management System
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--muted)]">
            Username or Email
            <input
              className="input mt-1"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-[var(--muted)]">
            Password
            <input
              type="password"
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-3 flex justify-between text-sm">
          <Link to="/" className="text-[var(--brand)]">
            Back to home
          </Link>
          <Link to="/forgot-password" className="text-[var(--brand)]">
            Forgot password?
          </Link>
        </div>

        
      </div>
    </div>
    <SiteFooter />
    </div>
  );
}
