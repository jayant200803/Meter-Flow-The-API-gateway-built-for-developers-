import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Copy, Check, RotateCcw, Ban, Shield, Clock, Activity } from 'lucide-react';
import api from '../services/api';

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [modal, setModal]         = useState(false);
  const [newKey, setNewKey]       = useState(null);
  const [copied, setCopied]       = useState('');
  const [form, setForm]           = useState({ apiId: '', name: '', environment: 'live' });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['all-keys'],
    queryFn: () => api.get('/keys').then(r => r.data.data.keys),
  });
  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data.apis),
  });

  const createMut = useMutation({
    mutationFn: (p) => api.post('/keys', p),
    onSuccess: (res) => { qc.invalidateQueries(['all-keys']); setNewKey(res.data.data.apiKey.key); setModal(false); },
  });
  const revokeMut = useMutation({
    mutationFn: (id) => api.post(`/keys/${id}/revoke`),
    onSuccess: () => qc.invalidateQueries(['all-keys']),
  });
  const rotateMut = useMutation({
    mutationFn: (id) => api.post(`/keys/${id}/rotate`),
    onSuccess: (res) => { qc.invalidateQueries(['all-keys']); setNewKey(res.data.data.newKey.key); },
  });

  const copy = (val) => {
    navigator.clipboard.writeText(val);
    setCopied(val);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">API Keys</h1>
          <p className="text-sm text-white/35 mt-0.5">{keys?.length || 0} keys managed</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={14} /> Generate Key
        </button>
      </div>

      {/* New key reveal */}
      {newKey && (
        <div className="rounded-2xl p-5 animate-slide-up"
          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-start gap-3">
            <Shield size={17} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-400">API Key Generated Successfully</p>
              <p className="text-xs text-white/40 mt-0.5 mb-3">
                Copy this key now — it will <span className="font-semibold text-amber-400">never be shown again</span>.
              </p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs overflow-x-auto"
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(16,185,129,0.20)' }}>
                <span className="flex-1 text-emerald-300 break-all select-all">{newKey}</span>
                <button onClick={() => copy(newKey)} className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-emerald-500/10 text-emerald-400">
                  {copied === newKey ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <button onClick={() => setNewKey(null)} className="mt-3 text-xs text-white/25 hover:text-white/50 transition-colors">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton animate-pulse m-3 rounded-xl" />)}
        </div>
      ) : !keys?.length ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Key size={36} className="text-white/10 mb-3" />
          <p className="text-white/40 font-medium mb-1">No API keys yet</p>
          <p className="text-white/20 text-sm mb-5">Generate a key to start making authenticated requests</p>
          <button onClick={() => setModal(true)} className="btn-primary"><Plus size={14} /> Generate Your First Key</button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Name','API','Key Prefix','Env','Status','Requests','Last Used','Actions'].map(h => (
                    <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k._id} className="table-row">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-semibold text-white/85">{k.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{k.apiId?.icon || '🔌'}</span>
                        <span className="text-xs text-white/50">{k.apiId?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg text-white/45"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {k.keyPrefix}…
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge text-[10px] ${k.environment === 'live' ? 'badge-green' : 'badge-yellow'}`}>
                        {k.environment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge text-[10px] ${k.status === 'active' ? 'badge-green' : k.status === 'revoked' ? 'badge-red' : 'badge-gray'}`}>
                        {k.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-white/50 flex items-center gap-1">
                        <Activity size={10} />{(k.totalRequests || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Clock size={10} />{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {k.status === 'active' && (
                          <>
                            <button onClick={() => rotateMut.mutate(k._id)}
                              className="p-1.5 rounded-lg transition-colors text-white/25 hover:text-amber-400 hover:bg-amber-400/10"
                              title="Rotate key">
                              <RotateCcw size={13} />
                            </button>
                            <button onClick={() => { if (confirm('Revoke this key? This cannot be undone.')) revokeMut.mutate(k._id); }}
                              className="p-1.5 rounded-lg transition-colors text-white/25 hover:text-red-400 hover:bg-red-400/10"
                              title="Revoke key">
                              <Ban size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}
            style={{ background: '#0f0f28', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
            <h2 className="text-lg font-bold text-white mb-1">Generate API Key</h2>
            <p className="text-xs text-white/35 mb-5">Create a new key to authenticate gateway requests</p>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
              <div>
                <label className="label">API</label>
                <select className="input" value={form.apiId} onChange={e => setForm(f => ({ ...f, apiId: e.target.value }))} required>
                  <option value="">Select an API…</option>
                  {(apis || []).map(a => <option key={a._id} value={a._id}>{a.icon} {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Key Name</label>
                <input className="input" placeholder="Production Key" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Environment</label>
                <div className="grid grid-cols-2 gap-2">
                  {['live','test'].map(env => (
                    <button key={env} type="button" onClick={() => setForm(f => ({ ...f, environment: env }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        form.environment === env
                          ? env === 'live'
                            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/35 text-amber-400'
                          : 'bg-white/[0.04] border-white/10 text-white/40 hover:bg-white/[0.07]'
                      }`}>
                      {env === 'live' ? '🟢 Live' : '🟡 Test'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMut.isPending} className="btn-primary">
                  {createMut.isPending ? 'Generating…' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
