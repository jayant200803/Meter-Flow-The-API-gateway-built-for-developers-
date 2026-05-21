import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  ArrowLeft, ExternalLink, Copy, Check, Key, Zap, AlertTriangle, Clock, TrendingUp,
  Activity, Shield, DollarSign,
} from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';

const METHOD_COLORS = {
  GET: '#22d3ee', POST: '#10b981', PUT: '#f59e0b', PATCH: '#a855f7', DELETE: '#ef4444',
};

function StatCard({ label, value, sub, color = '#6366f1', icon: Icon }) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200"
      style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.boxShadow = `0 0 20px ${color}12`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-white/35 uppercase tracking-wider">{label}</p>
        {Icon && <Icon size={14} style={{ color }} className="opacity-60" />}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{ background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.12)' }}>
      <p className="text-white/50 mb-2 font-semibold">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-bold text-white">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function ApiDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState('');

  const { data: apiData } = useQuery({
    queryKey: ['api', id],
    queryFn: () => api.get(`/apis/${id}`).then(r => r.data.data.api),
  });

  const { data: stats } = useQuery({
    queryKey: ['api-stats', id],
    queryFn: () => api.get(`/apis/${id}/stats`).then(r => r.data.data),
  });

  const { data: keysData } = useQuery({
    queryKey: ['api-keys', id],
    queryFn: () => api.get(`/keys?apiId=${id}`).then(r => r.data.data.keys),
  });

  const copy = (val, key) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const a            = apiData;
  const s24          = stats?.last24h || {};
  const dailyStats   = (stats?.dailyStats || []).map(d => ({ ...d, day: d._id?.slice(5) || d._id }));
  const topEndpoints = stats?.topEndpoints || [];
  const keys         = keysData || [];

  if (!a) {
    return (
      <div className="p-6">
        <div className="rounded-2xl p-12" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-5 animate-pulse rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.04)', width: `${[40,60,30][i]}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const gatewayUrl = `${window.location.origin}/gateway/`;
  const successRate = s24.totalRequests > 0
    ? (((s24.totalRequests - (s24.errors || 0)) / s24.totalRequests) * 100).toFixed(1)
    : '—';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/apis')}
          className="mt-1.5 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${a.color}18`, border: `1px solid ${a.color}30` }}>
              {a.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-white">{a.name}</h1>
                <span className={`badge text-[10px] ${a.status === 'active' ? 'badge-green' : 'badge-red'}`}>{a.status}</span>
                <span className="badge badge-gray text-[10px] capitalize">{a.category}</span>
              </div>
              {a.description && <p className="text-xs text-white/35 mt-0.5 truncate max-w-lg">{a.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* URL cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Upstream Base URL</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="font-mono text-xs text-white/50 truncate flex-1">{a.baseUrl}</span>
            <ExternalLink size={11} className="text-white/20 flex-shrink-0" />
          </div>
        </div>
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.25)' }}>
          <p className="text-[10px] text-brand-400/60 uppercase tracking-wider mb-2">Gateway URL (use in requests)</p>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span className="font-mono text-xs text-brand-300 truncate flex-1">{gatewayUrl}</span>
            <button onClick={() => copy(gatewayUrl, 'gateway')}
              className="flex-shrink-0 text-brand-400 hover:text-brand-300 transition-colors">
              {copied === 'gateway' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>

      {/* 24h stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Requests (24h)" value={(s24.totalRequests || 0).toLocaleString()} icon={Activity}    color="#6366f1" />
        <StatCard label="Errors (24h)"   value={(s24.errors || 0).toLocaleString()}         icon={AlertTriangle} color="#ef4444" />
        <StatCard label="Avg Latency"    value={`${Math.round(s24.avgLatency || 0)}ms`}     icon={Clock}      color="#22d3ee" />
        <StatCard label="Active Keys"    value={keys.filter(k => k.status === 'active').length} icon={Key}   color="#10b981" sub={`${keys.length} total`} />
      </div>

      {/* Daily traffic chart */}
      <div className="rounded-2xl p-5" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={14} className="text-brand-400" />
          <h3 className="text-sm font-bold text-white">Daily Traffic — Last 7 Days</h3>
        </div>
        {dailyStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyStats} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="requests" name="Requests" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="errors"   name="Errors"   fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center gap-2 text-white/15">
            <Activity size={28} />
            <p className="text-sm">No traffic data yet</p>
          </div>
        )}
      </div>

      {/* Top endpoints + Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top endpoints */}
        <div className="rounded-2xl p-5" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Top Endpoints</h3>
          </div>
          {topEndpoints.length > 0 ? (
            <div className="space-y-0">
              {topEndpoints.slice(0, 8).map((ep, i) => {
                const maxCount = topEndpoints[0]?.count || 1;
                const pct = (ep.count / maxCount) * 100;
                return (
                  <div key={i} className="py-2.5 group" style={{ borderBottom: i < topEndpoints.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[11px] text-white/55 truncate flex-1 mr-3">{ep._id}</span>
                      <span className="text-[11px] text-white/40 flex-shrink-0">{ep.count.toLocaleString()} req</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-white/15 text-sm">No endpoint data yet</div>
          )}
        </div>

        {/* API Keys */}
        <div className="rounded-2xl p-5" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Key size={13} className="text-brand-400" />
            <h3 className="text-sm font-bold text-white">API Keys</h3>
          </div>
          {keys.length > 0 ? (
            <div className="space-y-0">
              {keys.map((k, i) => (
                <div key={k._id} className="flex items-center justify-between py-3"
                  style={{ borderBottom: i < keys.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${k.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="text-xs text-white/65 truncate">{k.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="font-mono text-[10px] text-white/30 px-2 py-0.5 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.05)' }}>
                      {k.keyPrefix}…
                    </span>
                    <span className={`badge text-[9px] ${k.environment === 'live' ? 'badge-green' : 'badge-yellow'}`}>{k.environment}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-white/15 text-sm">No keys created yet</div>
          )}
        </div>
      </div>

      {/* Rate limits + pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={13} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Rate Limits</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Per Minute',  val: (a.rateLimit?.requestsPerMinute || 60).toLocaleString()          },
              { label: 'Per Day',     val: (a.rateLimit?.requestsPerDay    || 10000).toLocaleString()       },
              { label: 'Per Month',   val: (a.rateLimit?.requestsPerMonth  || 100000).toLocaleString()      },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-white/40">{label}</span>
                <span className="font-semibold text-white/80">{val} req</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={13} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Pricing</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pricing Model',    val: (a.pricing?.model || 'per_request').replace(/_/g, ' ') },
              { label: 'Free Tier',        val: `${(a.pricing?.freeTierRequests || 1000).toLocaleString()} req`  },
              { label: 'Price / Request',  val: `₹${a.pricing?.pricePerRequest || 0}`                           },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="text-white/40">{label}</span>
                <span className="font-semibold text-white/80 capitalize">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
