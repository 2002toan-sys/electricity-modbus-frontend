import React, { useState, useEffect } from 'react';
import { Lock, User, AlertCircle, PowerIcon } from 'lucide-react';
const API_BASE = window._env_?.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Migrate old saved credentials to just username if necessary
    const saved = localStorage.getItem('savedCredentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.u) {
          setUsername(parsed.u);
          setRememberMe(true);
        }
      } catch (e) {
        // Not JSON or just a string
        if (saved && !saved.startsWith('{')) {
          setUsername(saved);
          setRememberMe(true);
        }
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let data;

      // ---- Real login ----
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
        credentials: 'include',
      });
      data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Đăng nhập thất bại');

      if (rememberMe) {
        // Only save username to avoid XSS stealing password
        localStorage.setItem('savedCredentials', username);
      } else {
        localStorage.removeItem('savedCredentials');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hiệu ứng ánh sáng trang trí nền (glowing orbs) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-500 p-4 rounded-full">
            <PowerIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Hệ thống điều khiển điện
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Đăng nhập để tiếp tục
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={loading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Ghi nhớ đăng nhập
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-all ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }`}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Demo Credentials */}

      </div>
    </div>
  );
}

export default Login;
