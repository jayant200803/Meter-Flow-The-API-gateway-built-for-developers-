import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Trash2, ExternalLink, Check, Globe, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import api from '../services/api';

const EVENTS = [
  { id: 'request.error',        label: 'Request Error',           desc: 'Fires when any request returns 4xx or 5xx',         color: '#ef4444', icon: AlertTriangle },
  { id: 'rate_limit.exceeded',  label: 'Rate Limit Exceeded',     desc: 'Fires when a key hits its rate limit',              color: '#f59e0b', icon: Activity },
  { id: 'usage.threshold_80',   label: 'Usage at 80%',            desc: 'Monthly request usage reaches 80%',                color: '#f59e0b', icon: TrendingUp },
  { id: 'usage.threshold_100',  label: 'Usage at 100%',           desc: 'Monthly request limit fully consumed',             color: '#ef4444', icon: TrendingUp },
  { id: 'api.key_revoked',      label: 'API Key Revoked',         desc: 'Fires when any API key is revoked',                color: '#8b5cf6', icon: Zap },
];

const STATUS_COLORS = {
  active:   { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  text: '#10b981' },
  inactive: { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.25)', text: '#6b7280' },
  failed:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
};

export default function WebhooksPage() {
  const qc = useQueryClient();
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ url: '', events: [] });
  const [urlError, setUrlError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks/user').then(r => r.data.data.webhooks),
  });

  const createMut = useMutation({
    mutationFn: (body) => api.post('/webhooks/user', body),
    onSuccess: () => {
      qc.invalidateQueries(['webhooks']);
      setModal(false);
      setForm({ url: '', events: [] });
      setUrlError('');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/webhooks/user/${id}`),
    onSuccess: () => qc.invalidateQueries(['webhooks']),
  });

  const toggleEvent = (id) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(id) ? f.events.filter(e => e !== id) : [...f.events, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.url.startsWith('http')) { setUrlError('URL must start with http:// or https://'); return; }
    if (form.events.length === 0) { setUrlError('Select at least one event'); return; }
    setUrlError('');
    createMut.mutate(form);
  };

  const webhooks = data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Webhooks</h1>
          <p className="text-sm text-white/35 mt-0.5">Get notified when events happen in your account</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={14} /> Add Webhook
        </button>
      </div>

      {/* Event legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {EVENTS.map(ev => {
          const Icon = ev.icon;
          return (
            <div key={ev.id} className="rounded-xl p-3"
              style={{ background: `${ev.color}08`, border: `1px solid ${ev.color}18` }}>
              <Icon size={12} style={{ color: ev.color }} className="mb-1.5" />
              <p className="text-[11px] font-semibold text-white/70 leading-tight">{ev.label}</p>
              <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{ev.desc}</p>
            </div>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#0e0e28' }} />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Zap size={36} className="text-white/10 mb-3" />
          <p className="text-white/40 font-medium mb-1">No webhooks yet</p>
          <p className="text-white/20 text-sm mb-5">Add a webhook to get notified about events in real time</p>
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus size={14} /> Add Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => {
            const sc = STATUS_COLORS[wh.status] || STATUS_COLORS.active;
            return (
              <div key={wh._id} className="rounded-2xl p-5 group transition-all"
                style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Globe size={15} className="text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-sm text-white/80 truncate">{wh.url}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                          {wh.status || 'active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {(wh.events || []).map(ev => {
                          const meta = EVENTS.find(e => e.id === ev);
                          return (
                            <span key={ev} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{
                                background: meta ? `${meta.color}12` : 'rgba(255,255,255,0.06)',
                                color: meta ? meta.color : 'rgba(255,255,255,0.4)',
                                border: `1px solid ${meta ? `${meta.color}25` : 'rgba(255,255,255,0.08)'}`,
                              }}>
                              {meta?.label || ev}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a href={wh.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
                      <ExternalLink size={13} />
                    </a>
                    <button onClick={() => { if (confirm('Delete this webhook?')) deleteMut.mutate(wh._id); }}
                      className="p-1.5 rounded-lg text-white/15 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {modal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setModal(false)}>
          <div className="w-full max-w-lg rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}
            style={{ background: '#0f0f28', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Zap size={15} className="text-brand-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Add Webhook</h2>
                <p className="text-xs text-white/35">We'll send a POST request to your URL on each event</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Endpoint URL</label>
                <input
                  className="input font-mono text-xs"
                  placeholder="https://your-server.com/webhook"
                  value={form.url}
                  onChange={e => { setForm(f => ({ ...f, url: e.target.value })); setUrlError(''); }}
                  required
                />
                {urlError && <p className="text-xs text-red-400 mt-1">{urlError}</p>}
              </div>

              <div>
                <label className="label mb-3">Events to Subscribe</label>
                <div className="space-y-2">
                  {EVENTS.map(ev => {
                    const Icon = ev.icon;
                    const checked = form.events.includes(ev.id);
                    return (
                      <button key={ev.id} type="button" onClick={() => toggleEvent(ev.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: checked ? `${ev.color}0a` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${checked ? `${ev.color}30` : 'rgba(255,255,255,0.07)'}`,
                        }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: checked ? `${ev.color}18` : 'rgba(255,255,255,0.06)' }}>
                          {checked
                            ? <Check size={12} style={{ color: ev.color }} />
                            : <Icon size={12} className="text-white/25" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/75">{ev.label}</p>
                          <p className="text-[10px] text-white/30">{ev.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="btn-primary">
                  {createMut.isPending ? 'Creating…' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
