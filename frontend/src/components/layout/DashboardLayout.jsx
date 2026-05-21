import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import CommandPalette from '../CommandPalette';
import {
  LayoutDashboard, Plug, Key, BarChart3, Receipt, FlaskConical,
  Settings, LogOut, Bell, ChevronDown, Zap, Menu, X, ChevronRight, Search,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',   accent: '#6366f1' },
  { to: '/apis',       icon: Plug,            label: 'My APIs',      accent: '#22d3ee' },
  { to: '/keys',       icon: Key,             label: 'API Keys',     accent: '#f59e0b' },
  { to: '/usage',      icon: BarChart3,       label: 'Usage & Logs', accent: '#10b981' },
  { to: '/billing',    icon: Receipt,         label: 'Billing',      accent: '#ec4899' },
  { to: '/playground', icon: FlaskConical,    label: 'Playground',   accent: '#8b5cf6' },
  { to: '/webhooks',   icon: Zap,             label: 'Webhooks',     accent: '#f59e0b' },
];

const PLAN_STYLE = {
  free:       { color: '#9ca3af', border: 'rgba(156,163,175,0.25)', bg: 'rgba(156,163,175,0.07)' },
  pro:        { color: '#818cf8', border: 'rgba(99,102,241,0.30)',  bg: 'rgba(99,102,241,0.08)'  },
  enterprise: { color: '#fbbf24', border: 'rgba(245,158,11,0.30)', bg: 'rgba(245,158,11,0.08)'  },
};

const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/apis': 'My APIs', '/keys': 'API Keys',
  '/usage': 'Usage & Logs', '/billing': 'Billing',
  '/playground': 'Playground', '/settings': 'Settings', '/webhooks': 'Webhooks',
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen]         = useState(true);
  const [dropdown, setDropdown] = useState(false);
  const [palette, setPalette]   = useState(false);

  const ps    = PLAN_STYLE[user?.plan] || PLAN_STYLE.free;
  const title = PAGE_TITLES[pathname] || 'MeterFlow';
  const initial = user?.name?.[0]?.toUpperCase() || 'U';

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPalette(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#06061a' }}>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />

      {/* Sidebar */}
      <aside style={{
        width: open ? '256px' : '72px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        background: 'linear-gradient(180deg,#0b0b23 0%,#090918 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 18px rgba(99,102,241,0.45)' }}>
            <Zap size={17} className="text-white" />
          </div>
          {open && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="font-bold text-white text-[15px] leading-none whitespace-nowrap">MeterFlow</div>
              <div className="text-[9px] mt-0.5 tracking-[0.2em] font-semibold uppercase whitespace-nowrap"
                style={{ background: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                API BILLING
              </div>
            </div>
          )}
          <button onClick={() => setOpen(v => !v)}
            className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all flex-shrink-0">
            {open ? <X size={14} /> : <Menu size={14} />}
          </button>
        </div>

        {/* Search shortcut */}
        {open && (
          <div className="px-2.5 pt-3">
            <button onClick={() => setPalette(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-white/50 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Search size={12} />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="text-[9px] px-1 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>⌘K</kbd>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto scrollbar-none">
          {NAV.map(({ to, icon: Icon, label, accent }) => (
            <NavLink key={to} to={to} title={!open ? label : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: `linear-gradient(135deg,${accent}22,transparent)`, border: `1px solid ${accent}30` }} />
                  )}
                  <span className="relative z-10 flex-shrink-0" style={{ color: isActive ? accent : undefined }}>
                    <Icon size={16} />
                  </span>
                  {open && <span className="relative z-10 whitespace-nowrap">{label}</span>}
                  {isActive && open && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
                  )}
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <NavLink to="/settings" title={!open ? 'Settings' : undefined}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }} />
                  )}
                  <Settings size={16} className="relative z-10 flex-shrink-0" />
                  {open && <span className="relative z-10">Settings</span>}
                </>
              )}
            </NavLink>
          </div>
        </nav>

        {/* Plan card */}
        {open && (
          <div className="px-2.5 pb-2">
            <button onClick={() => navigate('/billing')} className="w-full text-left rounded-xl p-3 transition-opacity hover:opacity-90"
              style={{ background: ps.bg, border: `1px solid ${ps.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/35 font-medium uppercase tracking-wider">Plan</span>
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ps.color }}>
                  {user?.plan || 'free'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/25">
                  {(user?.planLimits?.requestsPerMonth || 0).toLocaleString()} req/mo
                </span>
                {user?.plan === 'free' && (
                  <span className="text-[10px] font-semibold" style={{ color: ps.color }}>Upgrade →</span>
                )}
              </div>
            </button>
          </div>
        )}

        {/* User footer */}
        <div className="p-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative">
            <button onClick={() => setDropdown(v => !v)}
              className="flex items-center gap-2.5 w-full px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {initial}
              </div>
              {open && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[12px] font-semibold text-white truncate">{user?.name}</div>
                    <div className="text-[10px] text-white/30 truncate">{user?.email}</div>
                  </div>
                  <ChevronDown size={12} className={`text-white/30 transition-transform duration-200 ${dropdown ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>

            {dropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-xl overflow-hidden z-50 animate-slide-up"
                style={{ background: '#0f0f28', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
                <button onClick={() => { navigate('/settings'); setDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/60 hover:bg-white/5 flex items-center gap-2.5 transition-colors">
                  <Settings size={13} className="text-white/35" /> Profile Settings
                </button>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-400/80 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2.5 transition-colors">
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between h-16 px-6 flex-shrink-0"
          style={{ background: 'rgba(6,6,26,0.85)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <span className="text-white/25 text-xs">MeterFlow</span>
            <ChevronRight size={11} className="text-white/20" />
            <span className="text-white/80 font-semibold text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setPalette(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/30 hover:text-white/55 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <Search size={12} />
              <span>Search</span>
              <kbd className="text-[9px] px-1 py-0.5 rounded ml-1" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>⌘K</kbd>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">Live</span>
            </div>
            <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <Bell size={15} className="text-white/40" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                style={{ background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.7)' }} />
            </button>
            <div className="pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 12px rgba(99,102,241,0.3)' }}>
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: '#06061a' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
