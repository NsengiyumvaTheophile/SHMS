import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SiteFooter from '../components/SiteFooter';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md card">
        <h1 className="font-display text-3xl text-[var(--brand-dark)]">Forgot password</h1>
        <p className="text-sm text-[var(--muted)] mt-1 mb-4">
          Enter the account email. In this version the reset token is shown here (no email service).
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {result && (
          <div className="alert alert-success text-sm break-all">
            {result.message}
            {result.resetToken && (
              <div className="mt-2">
                Token: <code>{result.resetToken}</code>
              </div>
            )}
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--muted)]">
            Email
            <input
              type="email"
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn btn-primary w-full">Generate reset token</button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/login" className="text-[var(--brand)]">
            Back to login
          </Link>
          <Link to="/reset-password" className="text-[var(--brand)]">
            I have a token
          </Link>
        </div>
      </div>
    </div>
    <SiteFooter />
    </div>
  );
}
