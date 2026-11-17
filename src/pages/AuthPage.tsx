import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, Store, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const { login, register } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login
  const [loginUser, setLoginUser] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPw, setRegPw] = useState('');
  const [regConfirmPw, setRegConfirmPw] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);
  const [regMsg, setRegMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPw) {
      setLoginMsg({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }
    setLoginLoading(true);
    const result = await login(loginUser.trim(), loginPw);
    setLoginMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUser || !regEmail || !regPw || !regConfirmPw) {
      setRegMsg({ type: 'error', text: 'All fields are required.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      setRegMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (regPw.length < 8) {
      setRegMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (regPw !== regConfirmPw) {
      setRegMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setRegLoading(true);
    const result = await register(regUser.trim(), regEmail.trim(), regPw);
    setRegMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setRegLoading(false);
    if (result.success) {
      setTimeout(() => { setMode('login'); setRegMsg(null); }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-2xl mb-4">
            <Store className="w-10 h-10 text-emerald-700" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">JEMIMA 1</h1>
          <p className="text-emerald-200 text-sm mt-1">Provision Store Inventory Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode('login'); setLoginMsg(null); }}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${mode === 'login' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setRegMsg(null); }}
              className={`flex-1 py-4 text-sm font-semibold transition-all ${mode === 'register' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Create Account
            </button>
          </div>

          <div className="p-8">
            {mode === 'login' ? (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome back!</h2>
                <p className="text-gray-500 text-sm mb-6">Sign in to your store dashboard</p>

                {loginMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${loginMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {loginMsg.text}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username</label>
                    <input
                      type="text"
                      value={loginUser}
                      onChange={e => setLoginUser(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-gray-800 text-sm"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={loginPw}
                        onChange={e => setLoginPw(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-gray-800 text-sm"
                        placeholder="Enter your password"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loginLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-60 shadow-lg shadow-emerald-200">
                    {loginLoading ? 'Signing in...' : 'Sign In to Dashboard'}
                  </button>
                </form>

              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Create your account</h2>
                <p className="text-gray-500 text-sm mb-6">Set up your store management system</p>

                {regMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${regMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {regMsg.text}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Username</label>
                    <input type="text" value={regUser} onChange={e => setRegUser(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 text-sm"
                      placeholder="Choose a username" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 text-sm"
                      placeholder="your@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input type={showRegPw ? 'text' : 'password'} value={regPw} onChange={e => setRegPw(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 text-sm"
                        placeholder="Min 8 characters" />
                      <button type="button" onClick={() => setShowRegPw(!showRegPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showRegPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                    <input type="password" value={regConfirmPw} onChange={e => setRegConfirmPw(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-gray-800 text-sm"
                      placeholder="Repeat your password" />
                  </div>
                  <button type="submit" disabled={regLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-60 shadow-lg shadow-emerald-200">
                    {regLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-emerald-300 text-xs mt-6">
          © 2026 JEMIMA 1 · Provision Store Inventory System
        </p>
      </div>
    </div>
  );
}
