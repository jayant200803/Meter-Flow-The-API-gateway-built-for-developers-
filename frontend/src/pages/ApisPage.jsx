import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Plug, ExternalLink, Trash2, Key, Zap } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = [
  { value: '',           label: 'All'         },
  { value: 'ecommerce',  label: '🛍️ E-commerce' },
  { value: 'weather',    label: '🌤️ Weather'    },
  { value: 'finance',    label: '💰 Finance'    },
  { value: 'gaming',     label: '⚡ Gaming'     },
  { value: 'social',     label: '👥 Social'     },
  { value: 'custom',     label: '🔧 Custom'     },
  { value: 'other',      label: '📦 Other'      },
];

const PRESETS = [
  { name: 'DummyJSON',        baseUrl: 'https://dummyjson.com',                category: 'ecommerce', icon: '🛍️', color: '#96bf48' },
  { name: 'PokéAPI',          baseUrl: 'https://pokeapi.co/api/v2',            category: 'gaming',    icon: '⚡', color: '#ef4444' },
  { name: 'CoinGecko',        baseUrl: 'https://api.coingecko.com/api/v3',    category: 'finance',   icon: '💰', color: '#f59e0b' },
  { name: 'JSONPlaceholder',  baseUrl: 'https://jsonplaceholder.typicode.com', category: 'other',     icon: '📋', color: '#3b82f6' },
];

function HealthDot({ apiId }) {
  const [health, setHealth]   = useState(null);
  const [latency, setLatency] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      setChecking(true);
      try {
        const res = await api.get(`/apis/${apiId}/health`);
        if (!cancelled) {
          setHealth(res.data.data.healthy);
          setLatency(res.data.data.latency);
        }
      } catch {
        if (!cancelled) setHealth(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [apiId]);

  if (checking && health === null) {
    return <span className="w-1.5 h-1.5 rounded-full bg-white/15 animate-pulse" title="Checking upstream…" />;
  }
  if (health === null) return null;

  return (
    <div className="flex items-center gap-1 text-[10px]"
      title={health ? `Upstream up (${latency}ms)` : 'Upstream not responding'}>
      <span className={`w-1.5 h-1.5 rounded-full ${health ? 'bg-emerald-400' : 'bg-red-400'}`}
        style={health ? { boxShadow: '0 0 4px #10b981' } : {}} />
      <span style={{ color: health ? '#10b981' : '#ef4444' }}>
        {health ? `${latency}ms` : 'Down'}
      </span>
    </div>
  );
}

export default function ApisPage() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat]       = useState('');
  const [form, setForm]     = useState({ name: '', description: '', baseUrl: '', category: 'other', icon: '🔌', color: '#6366f1' });

  const { data, isLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data),
  });

  const createMut = useMutation({
    mutationFn: (p) => api.post('/apis', p),
    onSuccess: () => {
      qc.invalidateQueries(['apis']);
      setModal(false);
      setForm({ name: '', description: '', baseUrl: '', category: 'other', icon: '🔌', color: '#6366f1' });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/apis/${id}`),
    onSuccess: () => qc.invalidateQueries(['apis']),
  });

  const apis = (data?.apis || []).filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) &&
    (cat === '' || a.category === cat)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My APIs</h1>
          <p className="text-sm text-white/35 mt-0.5">{data?.apis?.length || 0} APIs configured</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={14} /> Add API
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input className="input pl-9 w-56 text-sm" placeholder="Search APIs…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-xl overflow-x-auto" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${cat === c.value ? 'text-white' : 'text-white/40 hover:text-white/65'}`}
              style={cat === c.value ? { background: 'rgba(99,102,241,0.25)', color: '#818cf8' } : {}}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl skeleton animate-pulse" style={{ height: 200 }} />)}
        </div>
      ) : apis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Plug size={36} className="text-white/10 mb-3" />
          <p className="text-white/40 font-medium mb-1">No APIs found</p>
          <p className="text-white/20 text-sm mb-5">{search ? 'Try a different search term' : 'Create your first API to get started'}</p>
          {!search && (
            <button onClick={() => setModal(true)} className="btn-primary">
              <Plus size={14} /> Create Your First API
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apis.map((a) => (
            <div key={a._id} className="rounded-2xl p-5 group transition-all duration-300 hover:scale-[1.015]"
              style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}35`; e.currentTarget.style.boxShadow = `0 0 24px ${a.color}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${a.color}18`, border: `1px solid ${a.color}25` }}>
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white/90">{a.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`badge text-[10px] ${a.status === 'active' ? 'badge-green' : 'badge-red'}`}>{a.status}</span>
                      <HealthDot apiId={a._id} />
                    </div>
                  </div>
                </div>
                <button onClick={() => { if (confirm('Deprecate this API and revoke all keys?')) deleteMut.mutate(a._id); }}
                  className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>

              <p className="text-xs text-white/30 mb-3 line-clamp-2 leading-relaxed">{a.description || 'No description provided'}</p>

              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[11px] text-white/25 font-mono truncate flex-1">{a.baseUrl}</span>
                <ExternalLink size={10} className="text-white/20 flex-shrink-0" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] text-white/35">
                  <span className="flex items-center gap-1"><Zap size={10} />{(a.totalRequests || 0).toLocaleString()} req</span>
                  <span className="flex items-center gap-1"><Key size={10} />{a.activeKeys || 0} keys</span>
                </div>
                <Link to={`/apis/${a._id}`} className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: a.color || '#818cf8' }}>
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setModal(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}
            style={{ background: '#0f0f28', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
            <h2 className="text-lg font-bold text-white mb-1">Add New API</h2>
            <p className="text-xs text-white/35 mb-5">Connect an external API and route traffic through MeterFlow gateway</p>

            <div className="mb-5">
              <p className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mb-2">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.name} onClick={() => setForm(f => ({ ...f, ...p }))}
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors text-white/55 hover:text-white/80"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    {p.icon} {p.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
              <div>
                <label className="label">API Name</label>
                <input className="input" placeholder="My Awesome API" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Base URL</label>
                <input className="input font-mono text-xs" placeholder="https://api.example.com/v1" value={form.baseUrl} onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="What does this API do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Accent Color</label>
                  <input type="color" className="input h-10 p-1.5 cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="btn-primary">
                  {createMut.isPending ? 'Creating…' : 'Create API'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
