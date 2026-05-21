import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Mail, Lock, Building2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const [form, setForm]         = useState({ name: '', email: '', password: '', company: '' });
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
      const { data } = await api.post('/auth/register', form);
      login(data.data.user, data.data.accessToken, data.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FREE_PERKS = [
    '1,000 requests per month',
    'Up to 3 APIs',
    'Real-time analytics dashboard',
    'API key management',
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#06061a' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0c0c24 0%,#080819 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle,#6366f1,transparent)', filter: 'blur(48px)' }} />
          <div className="absolute bottom-1/4 right-1/3 w-52 h-52 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle,#10b981,transparent)', filter: 'blur(36px)' }} />
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
          <h2 className="text-[30px] font-bold text-white leading-tight mb-3">
            Start for free.<br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Scale as you grow.
            </span>
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            No credit card required. Set up your first API in minutes.
          </p>
          <div className="rounded-2xl p-5 mb-2"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.20)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Free Plan Includes</span>
            </div>
            <div className="space-y-3">
              {FREE_PERKS.map(p => (
                <div key={p} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  <span className="text-white/70">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="relative z-10 text-[11px] text-white/20">© {new Date().getFullYear()} MeterFlow — Portfolio Project</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap size={17} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">MeterFlow</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-white/40 text-sm mb-8">Free plan · No credit card required</p>

          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', color: '#f87171' }}>
              <AlertCircle size={14} className="flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type="text" className="input pl-10" placeholder="Jane Doe"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
              </div>
              <div className="col-span-2">
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type="email" className="input pl-10" placeholder="you@example.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>
              <div className="col-span-2">
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10"
                    placeholder="Min 8 characters" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="label">Company <span className="normal-case text-white/20 font-normal">(optional)</span></label>
                <div className="relative">
                  <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input type="text" className="input pl-10" placeholder="Acme Corp"
                    value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
              <CheckCircle2 size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
              <span className="text-white/50">Free plan includes 1,000 requests/month and 3 APIs — no credit card needed</span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[15px]">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/35">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold transition-colors hover:text-white/80" style={{ color: '#818cf8' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
