import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import GuestNavbar from '../components/GuestNavbar';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const notice = location.state?.registered
    ? 'Account created successfully. Please sign in.'
    : params.get('logout') !== null
      ? 'You have been logged out.'
      : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      // Same landing page as the old formLogin defaultSuccessUrl, unless a protected page sent us here
      const from = location.state?.from?.pathname;
      navigate(from && from !== '/login' ? from + (location.state.from.search || '') : '/user/profile', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="hero-bg-home min-h-screen flex flex-col text-white">
      <GuestNavbar currentPage="login" />

      <div className="flex-1 flex justify-center items-center px-4 py-28">
        <div className="login-card rounded-2xl p-8 md:p-10 w-full max-w-md fade-up">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent mb-3">
              Welcome Back!
            </h2>
            <p className="text-gray-400">Continue your journey with us</p>
          </div>

          {notice && !error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-green-600/20 border border-green-500/30 text-green-300 text-sm">
              {notice}
            </div>
          )}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-300 text-sm" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
              <div className="input-wrapper bg-gray-800/50 rounded-xl border border-gray-700 focus-within:border-violet-500 transition-colors duration-300">
                <div className="flex items-center">
                  <span className="pl-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 4h16v16H4z"></path>
                      <path d="M22 6L12 13 2 6"></path>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    className="w-full p-4 bg-transparent focus:outline-none text-white placeholder-gray-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
              <div className="input-wrapper bg-gray-800/50 rounded-xl border border-gray-700 focus-within:border-violet-500 transition-colors duration-300">
                <div className="flex items-center">
                  <span className="pl-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17v.01"></path>
                      <path d="M19 11a7 7 0 1 0-14 0v4a3 3 0 0 0 6 0v-4"></path>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={update('password')}
                    className="w-full p-4 bg-transparent focus:outline-none text-white placeholder-gray-500"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full gradient-button bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white font-medium py-4 rounded-xl transition-all duration-300 disabled:opacity-60"
            >
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <p className="text-gray-400">
              New to STC?{' '}
              <Link to="/register" className="text-violet-400 hover:text-violet-300 transition-colors duration-300">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-black/50 backdrop-blur-md py-6 text-center">
        <p className="text-gray-400">&copy; 2025 Solo Travel Companion. All rights reserved.</p>
      </footer>
    </div>
  );
}
