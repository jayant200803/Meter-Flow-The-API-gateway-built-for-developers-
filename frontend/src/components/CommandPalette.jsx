import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, LayoutDashboard, Plug, Key, BarChart3, Receipt,
  FlaskConical, Settings, Zap, ChevronRight, Webhook,
} from 'lucide-react';
import api from '../services/api';

const PAGES = [
  { label: 'Dashboard',   to: '/dashboard',  icon: LayoutDashboard, desc: 'Overview & stats'      },
  { label: 'My APIs',     to: '/apis',        icon: Plug,            desc: 'Manage APIs'           },
  { label: 'API Keys',    to: '/keys',        icon: Key,             desc: 'Manage keys'           },
  { label: 'Usage & Logs',to: '/usage',       icon: BarChart3,       desc: 'View request logs'     },
  { label: 'Billing',     to: '/billing',     icon: Receipt,         desc: 'Plans & invoices'      },
  { label: 'Playground',  to: '/playground',  icon: FlaskConical,    desc: 'Test APIs interactively'},
  { label: 'Webhooks',    to: '/webhooks',    icon: Zap,             desc: 'Manage webhooks'       },
  { label: 'Settings',    to: '/settings',    icon: Settings,        desc: 'Profile & account'     },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery]     = useState('');
  const [selected, setSelected] = useState(0);
  const navigate  = useNavigate();
  const inputRef  = useRef(null);

  const { data: apisData } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data),
    enabled: open,
    staleTime: 30000,
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const apiItems = (apisData?.apis || []).map(a => ({
    label: a.name,
    emoji: a.icon,
    to: `/apis/${a._id}`,
    desc: a.baseUrl,
    color: a.color,
    group: 'APIs',
  }));

  const pageItems = PAGES.map(p => ({ ...p, group: 'Pages' }));
  const allItems  = [...pageItems, ...apiItems];

  const q = query.toLowerCase();
  const filtered = q
    ? allItems.filter(i =>
        i.label.toLowerCase().includes(q) ||
        i.desc?.toLowerCase().includes(q)
      )
    : pageItems;

  const handleSelect = (item) => {
    navigate(item.to);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected]);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected]);

  if (!open) return null;

  let lastGroup = null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[14vh]"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#0f0f2a',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
          animation: 'slideUp 0.15s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={16} className="text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search pages, APIs, keys…"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
          />
          <kbd className="text-[10px] text-white/20 px-1.5 py-0.5 rounded"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-white/25 text-sm">
              No results for "<span className="text-white/40">{query}</span>"
            </div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <div key={i}>
                  {showGroup && (
                    <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20">
                      {item.group}
                    </div>
                  )}
                  <button
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelected(i)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: i === selected ? 'rgba(99,102,241,0.14)' : 'transparent' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                      style={{
                        background: item.color ? `${item.color}18` : 'rgba(255,255,255,0.06)',
                        border: item.color ? `1px solid ${item.color}20` : '1px solid rgba(255,255,255,0.07)',
                      }}>
                      {item.emoji
                        ? <span>{item.emoji}</span>
                        : Icon ? <Icon size={14} className="text-white/45" /> : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 font-medium">{item.label}</div>
                      {item.desc && (
                        <div className="text-[11px] text-white/30 truncate">{item.desc}</div>
                      )}
                    </div>
                    {i === selected && <ChevronRight size={12} className="text-brand-400 flex-shrink-0" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-5 px-4 py-2.5 text-[10px] text-white/20"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>↵</kbd>
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>⌘K</kbd>
            Toggle
          </span>
          <span className="ml-auto text-white/15">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
