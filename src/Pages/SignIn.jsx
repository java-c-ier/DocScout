import React, { useState, useEffect } from 'react';
import PageTransition from '../Components/PageTransition';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../AuthContext';

const ADMIN_EMAIL = 'jimutksahoo99@gmail.com';
const MSG_NOT_FOUND = 'No account found for this email. Please sign up first.';
const MSG_NOT_VERIFIED = 'Your email is not verified yet. Please check your inbox for the verification email.';
const MSG_INACTIVE = 'Your account is inactive. Please contact your admin or fill the contact form.';

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname === '/signup' ? 'signup' : 'login');
  const { blockedError, clearBlockedError, user } = useAuth();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationSource, setVerificationSource] = useState('signup');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (blockedError) { setError(blockedError); clearBlockedError(); }
  }, [blockedError]);

  // Auto-redirect when Tab 3 verifies email and creates session (localStorage storage event)
  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((v) => { if (v <= 1) { clearInterval(interval); return 0; } return v - 1; });
    }, 1000);
  };

  const callVerification = async ({ source, email: emailAddr, name, origin }) => {
    const res = await fetch('/.netlify/functions/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, email: emailAddr, name, origin }),
    });
    return res.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (tab === 'signup' && !fullName.trim()) { setError('Please enter your full name.'); return; }
    setLoading(true);
    try {
      const result = await callVerification({
        source: tab === 'signup' ? 'signup' : 'login',
        email: email.trim(),
        name: fullName.trim(),
        origin: window.location.origin,
      });

      if (result.error === 'already_registered') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (result.error === 'not_found') {
        setError(MSG_NOT_FOUND);
      } else if (result.error === 'not_verified') {
        setError(MSG_NOT_VERIFIED);
      } else if (result.error === 'blocked') {
        setError(MSG_INACTIVE);
      } else if (result.success) {
        setPendingEmail(email.trim());
        setPendingName(fullName.trim());
        setVerificationEmail(email.trim());
        setVerificationSource(tab === 'signup' ? 'signup' : 'login');
        setVerificationSent(true);
        startResendCooldown();
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !pendingEmail) return;
    setResending(true);
    try {
      await callVerification({ source: verificationSource, email: pendingEmail, name: pendingName, origin: window.location.origin });
      startResendCooldown();
    } catch { /* ignore */ }
    finally { setResending(false); }
  };

  const switchTab = (t) => {
    setTab(t); setError(''); setEmail(''); setFullName('');
    navigate(t === 'signup' ? '/signup' : '/signin', { replace: true });
  };

  const inputClass = 'w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a8efd] focus:border-transparent transition';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  if (verificationSent) {
    const isLogin = verificationSource === 'login';
    return (
      <PageTransition>
        <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isLogin ? 'bg-blue-50' : 'bg-blue-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1a8efd]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'One-Click Login sent!' : 'Check your inbox'}
            </h2>
            <p className="text-gray-500 text-sm mb-1">
              {isLogin ? 'We sent a one-click login link to' : 'We sent a verification email to'}
            </p>
            <p className="text-[#1a8efd] font-semibold text-sm mb-4">{verificationEmail}</p>
            <p className="text-gray-400 text-xs mb-8">
              {isLogin
                ? 'Click the link in the email to sign in. The link expires in 1 hour.'
                : 'Click the link in the email to verify your account. After verifying, come back and sign in.'}
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="w-full border border-[#1a8efd] text-[#1a8efd] hover:bg-blue-50 disabled:opacity-50 py-2.5 rounded-lg text-sm font-semibold transition mb-3"
            >
              {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : `Resend ${isLogin ? 'login link' : 'verification email'}`}
            </button>
            <button
              type="button"
              onClick={() => { setVerificationSent(false); switchTab('login'); }}
              className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition"
            >
              Back to Sign in
            </button>
          </div>
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 gap-2">
            <h1 className="text-3xl font-bold text-[#1a8efd] tracking-tight">DocScout</h1>
            <p className="text-gray-500 text-sm">
              {tab === 'login' ? 'One-Click Login — no password needed.' : 'Create your account to get started.'}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex rounded-xl bg-gray-100 p-1 mb-7">
              {[{ key: 'login', label: 'Sign in' }, { key: 'signup', label: 'Sign up' }].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === key ? 'bg-white text-[#1a8efd] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {tab === 'signup' && (
                <div>
                  <label className={labelClass}>Full name <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input
                  required
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-60 text-white py-3 rounded-lg text-base font-semibold transition"
              >
                {loading ? 'Please wait...' : tab === 'login' ? 'Send login link' : 'Create account'}
              </button>

              {tab === 'login' && (
                <p className="text-center text-xs text-gray-400">
                  We'll email you a one-click login link — no password required.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

export default SignIn;
