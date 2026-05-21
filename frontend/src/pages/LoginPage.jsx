import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, BarChart3, Shield, Cpu } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const FEATURES = [
  { icon: BarChart3, color: '#6366f1', title: 'Real-time Analytics',  desc: 'Monitor every API call with live dashboards and charts' },
  { icon: Shield,    color: '#10b981', title: 'Secure API Gateway',   desc: 'Key auth, rate limiting, and request logging built in'  },
  { icon: Cpu,       color: '#f59e0b', title: 'Usage-Based Billing',  desc: 'Automatic invoices — pay only for what you use'          },
];

export default function LoginPage() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login }               = useAuthStore();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data.user, data.data.accessToken, data.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#06061a' }}>
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0c0c24 0%,#080819 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle,#6366f1,transparent)', filter: 'blur(48px)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-52 h-52 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle,#8b5cf6,transparent)', filter: 'blur(36px)' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.45)' }}>
              <Zap size={19} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-lg leading-none">MeterFlow</div>
              <div className="text-[9px] tracking-[0.22em] font-semibold uppercase mt-0.5"
                style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                API BILLING
              </div>
            </div>
          </div>
          <h2 className="text-[32px] font-bold text-white leading-tight mb-3">
            The API billing<br />platform for{' '}
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              builders
            </span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-10">
            Gateway, metering, analytics and billing — everything you need to monetise your APIs.
          </p>
          <div className="space-y-6">
            {FEATURES.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/85">{title}</div>
                  <div className="text-xs text-white/35 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-[11px] text-white/20">© {new Date().getFullYear()} MeterFlow — Portfolio Project</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap size={17} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">MeterFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm mb-8">Sign in to your dashboard</p>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171' }}>
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type="email" className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10"
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px] mt-2">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <button onClick={() => setForm({ email: 'demo@meterflow.dev', password: 'Demo123!' })}
            className="w-full mt-3 py-2.5 rounded-xl text-xs text-white/35 hover:text-white/55 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
            Use demo credentials → <span className="font-mono text-white/45">demo@meterflow.dev</span>
          </button>

          <p className="mt-7 text-center text-sm text-white/35">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors hover:text-white/80" style={{ color: '#818cf8' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
