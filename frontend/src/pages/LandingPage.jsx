import { Link } from 'react-router-dom';
import { Zap, Shield, BarChart3, Clock, Key, Globe, ArrowRight, Check, ChevronRight } from 'lucide-react';

const FEATURES = [
  { icon: Zap,      color: '#6366f1', title: 'API Gateway',        desc: 'Route all traffic through a unified gateway with sub-millisecond overhead. Zero config required.' },
  { icon: Shield,   color: '#10b981', title: 'Rate Limiting',       desc: 'Per-key, per-minute and per-month limits. Automatically enforced at the edge with Redis.' },
  { icon: BarChart3,color: '#22d3ee', title: 'Usage Analytics',     desc: 'Real-time charts, error rates, latency percentiles and per-endpoint breakdowns.' },
  { icon: Key,      color: '#f59e0b', title: 'API Key Management',  desc: 'Generate, rotate and revoke keys instantly. Live and sandbox environments supported.' },
  { icon: Clock,    color: '#a855f7', title: 'Request Logs',        desc: 'Every request logged with endpoint, method, status code, latency and IP address.' },
  { icon: Globe,    color: '#ec4899', title: 'Webhooks',            desc: 'Fire webhooks on rate-limit hits, error spikes or usage thresholds. Automate alerts.' },
];

const PLANS = [
  {
    id: 'free', name: 'Free', price: '₹0', period: '/month',
    color: '#6b7280', glow: 'rgba(107,114,128,0)',
    features: ['1,000 requests/month','3 APIs','60 req/min rate limit','Basic analytics','Community support'],
    cta: 'Get Started Free', ctaClass: 'btn-secondary w-full justify-center',
  },
  {
    id: 'pro', name: 'Pro', price: '₹999', period: '/month',
    color: '#6366f1', glow: 'rgba(99,102,241,0.3)',
    badge: 'Most Popular',
    features: ['100,000 requests/month','20 APIs','600 req/min rate limit','Advanced analytics','Webhooks','Email support'],
    cta: 'Start Pro Trial', ctaClass: 'btn-primary w-full justify-center',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '₹4,999', period: '/month',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',
    features: ['10M requests/month','Unlimited APIs','6,000 req/min rate limit','Enterprise analytics','Custom domain','Dedicated support'],
    cta: 'Contact Sales', ctaClass: 'btn-secondary w-full justify-center',
  },
];

const STEPS = [
  { n: '01', title: 'Register your API', desc: 'Point MeterFlow at any upstream API URL. Pick a preset or add your own.' },
  { n: '02', title: 'Generate a key',    desc: 'Create API keys for live or sandbox environments in one click.' },
  { n: '03', title: 'Route traffic',     desc: 'Replace the upstream URL with your MeterFlow gateway URL. Done.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#06061a', color: '#fff' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{ background: 'rgba(6,6,26,0.85)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-bold text-white text-[15px]">MeterFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/55 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary text-sm py-2 px-5">
            Get Started <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center pt-40 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now in public beta — free to start
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-[1.08] mb-6">
            <span className="text-white">The API gateway</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg,#818cf8,#c084fc,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              built for developers
            </span>
          </h1>

          <p className="text-lg text-white/45 max-w-xl mx-auto mb-10 leading-relaxed">
            Rate limit, meter, and monitor every API call in real time.
            Drop-in proxy for any REST API. No infrastructure to manage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-base px-7 py-3">
              Start for free <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-7 py-3">
              Sign in
            </Link>
          </div>

          <p className="text-xs text-white/20 mt-6">No credit card required · 1,000 free requests/month</p>
        </div>

        {/* Mock gateway diagram */}
        <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto">
          <div className="rounded-2xl p-6 text-left overflow-hidden"
            style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-amber-400/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-[11px] text-white/20 font-mono">gateway request</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">GET</span>
                <span className="text-white/60">https://</span>
                <span className="text-brand-400">meterflow.app</span>
                <span className="text-white/60">/gateway/pokemon/ditto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/25">Header:</span>
                <span className="text-amber-300">X-API-Key</span>
                <span className="text-white/25">:</span>
                <span className="text-white/50">mf_live_••••••••••••••••</span>
              </div>
              <div className="mt-3 pt-3 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-emerald-400 font-bold">200</span>
                <span className="text-white/30">·</span>
                <span className="text-emerald-400">42ms</span>
                <span className="text-white/30">·</span>
                <span className="text-white/30">logged · rate checked · proxied</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-semibold text-center mb-3">How it works</p>
          <h2 className="text-3xl font-black text-white text-center mb-14">Up and running in 3 steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-5 left-full w-full h-px z-0"
                    style={{ background: 'linear-gradient(90deg,rgba(99,102,241,0.3),transparent)' }} />
                )}
                <div className="relative z-10">
                  <div className="text-[11px] font-black text-brand-400 mb-3 tracking-widest">{s.n}</div>
                  <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-semibold text-center mb-3">Features</p>
          <h2 className="text-3xl font-black text-white text-center mb-14">Everything you need to meter APIs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-2xl p-5 transition-all duration-300 group"
                  style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}30`; e.currentTarget.style.boxShadow = `0 0 24px ${f.color}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}>
                    <Icon size={18} style={{ color: f.color }} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-semibold text-center mb-3">Pricing</p>
          <h2 className="text-3xl font-black text-white text-center mb-3">Simple, transparent pricing</h2>
          <p className="text-sm text-white/35 text-center mb-14">Start free. Scale when you need to.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div key={plan.id} className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300"
                style={{
                  background: plan.id === 'pro' ? 'rgba(99,102,241,0.06)' : '#0e0e28',
                  border: `1px solid ${plan.id === 'pro' ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: plan.id === 'pro' ? `0 0 40px ${plan.glow}` : 'none',
                }}>
                {plan.id === 'pro' && (
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)' }} />
                )}
                {plan.badge && (
                  <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold mb-4"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-white/30">{plan.period}</span>
                </div>
                <div className="space-y-2.5 mb-8">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm text-white/55">
                      <Check size={13} style={{ color: plan.color, flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <Link to="/register" className={plan.ctaClass}>
                  {plan.cta} <ChevronRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Ready to meter your APIs?</h2>
          <p className="text-white/35 mb-8">Join developers already using MeterFlow to manage their API infrastructure.</p>
          <Link to="/register" className="btn-primary text-base px-8 py-3 inline-flex">
            Get started for free <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Zap size={11} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white/70">MeterFlow</span>
          </div>
          <p className="text-xs text-white/20">© 2026 MeterFlow. Built with React, Express & MongoDB.</p>
          <div className="flex items-center gap-5 text-xs text-white/30">
            <Link to="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
