import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, ChevronLeft, ChevronRight, Clock, TrendingUp,
  CheckCircle2, XCircle, Gauge, X, Download, Globe, Server,
} from 'lucide-react';
import api from '../services/api';

const METHOD_COLORS = {
  GET:    { bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.25)',  text: '#22d3ee'  },
  POST:   { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  text: '#10b981'  },
  PUT:    { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b'  },
  PATCH:  { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)', text: '#a855f7'  },
  DELETE: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444'  },
};

function MethodBadge({ method }) {
  const c = METHOD_COLORS[method] || METHOD_COLORS.GET;
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {method}
    </span>
  );
}

function StatusBadge({ code }) {
  const ok = code >= 200 && code < 300;
  const warn = code >= 400 && code < 500;
  const color = ok ? '#10b981' : warn ? '#f59e0b' : '#ef4444';
  const bg    = ok ? 'rgba(16,185,129,0.1)' : warn ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  return (
    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold"
      style={{ background: bg, color }}>
      {code}
    </span>
  );
}

function LatencyBar({ ms }) {
  const pct   = Math.min(100, (ms / 2000) * 100);
  const color = ms < 200 ? '#10b981' : ms < 500 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono w-12 text-right" style={{ color }}>{ms}ms</span>
    </div>
  );
}

function LogDetailDrawer({ log, onClose }) {
  if (!log) return null;
  const isErr = log.isError || log.statusCode >= 400;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative w-full max-w-md h-full overflow-y-auto"
        style={{ background: '#0e0e28', borderLeft: '1px solid rgba(255,255,255,0.1)', boxShadow: '-20px 0 60px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ background: '#0e0e28', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}>
          <div>
            <h3 className="text-sm font-bold text-white">Request Details</h3>
            <p className="text-[10px] text-white/30 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status summary */}
          <div className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: isErr ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)',
              border: `1px solid ${isErr ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isErr ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' }}>
              {isErr
                ? <XCircle size={18} className="text-red-400" />
                : <CheckCircle2 size={18} className="text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge code={log.statusCode} />
                <MethodBadge method={log.method} />
              </div>
              <p className="text-[11px] text-white/40 mt-1">{isErr ? 'Request failed' : 'Request successful'}</p>
            </div>
          </div>

          {[
            {
              title: 'Request', icon: Globe,
              rows: [
                ['Endpoint',   log.endpoint],
                ['Method',     log.method],
                ['IP Address', log.ip || '—'],
              ],
            },
            {
              title: 'Response', icon: Server,
              rows: [
                ['Status Code', log.statusCode],
                ['Latency',     `${log.latency}ms`],
                ['Timestamp',   new Date(log.createdAt).toLocaleString()],
                ['API',         log.apiId?.name || '—'],
                ['Key',         log.apiKeyId?.keyPrefix ? `${log.apiKeyId.keyPrefix}…` : '—'],
              ],
            },
          ].map(({ title, icon: Icon, rows }) => (
            <div key={title} className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Icon size={12} className="text-white/35" />
                <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">{title}</span>
              </div>
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 px-4 py-2.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[11px] text-white/35 flex-shrink-0 w-24">{k}</span>
                  <span className="text-[11px] text-white/70 font-mono text-right break-all">{String(v)}</span>
                </div>
              ))}
            </div>
          ))}

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Latency</p>
            <LatencyBar ms={log.latency} />
            <p className="text-[10px] text-white/20 mt-2">
              {log.latency < 200 ? 'Fast — under 200ms' : log.latency < 500 ? 'Moderate — 200–500ms' : 'Slow — over 500ms'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportCSV(logs) {
  const headers = ['Time', 'API', 'Endpoint', 'Method', 'Status', 'Latency (ms)', 'IP', 'Error'];
  const rows = logs.map(l => [
    new Date(l.createdAt).toISOString(),
    l.apiId?.name || '',
    l.endpoint,
    l.method,
    l.statusCode,
    l.latency,
    l.ip || '',
    l.isError ? 'yes' : 'no',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `meterflow-logs-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsagePage() {
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState('');
  const [apiFilter, setApiFilter]   = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [csvLoading, setCsvLoading]   = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: () => api.get('/usage/stats').then(r => r.data.data).catch(() => null),
  });

  const { data: apisData } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['usage-logs', page, statusFilter, apiFilter],
    queryFn: () => api.get('/usage/logs', {
      params: { page, limit: 25, status: statusFilter || undefined, apiId: apiFilter || undefined },
    }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const handleExport = async () => {
    setCsvLoading(true);
    try {
      const res = await api.get('/usage/logs', {
        params: { page: 1, limit: 10000, status: statusFilter || undefined, apiId: apiFilter || undefined },
      });
      exportCSV(res.data.data.logs || []);
    } finally {
      setCsvLoading(false);
    }
  };

  const logs  = data?.logs  || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;
  const apis  = apisData?.apis || [];

  const stats = [
    { label: 'Total Requests',  val: (statsData?.totalRequests || total || 0).toLocaleString(), icon: Activity,      color: '#6366f1' },
    { label: 'Success Rate',    val: statsData ? `${statsData.successRate?.toFixed(1) || 100}%` : '—',                icon: CheckCircle2, color: '#10b981' },
    { label: 'Error Rate',      val: statsData ? `${(100 - (statsData.successRate || 100)).toFixed(1)}%` : '—',       icon: XCircle,      color: '#ef4444' },
    { label: 'Avg Latency',     val: statsData ? `${Math.round(statsData.avgLatency || 0)}ms` : '—',                  icon: Gauge,        color: '#f59e0b' },
  ];

  return (
    <div className="p-6 space-y-6">
      {selectedLog && <LogDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Usage & Logs</h1>
          <p className="text-sm text-white/35 mt-0.5">{total.toLocaleString()} total requests logged</p>
        </div>
        <button onClick={handleExport} disabled={csvLoading} className="btn-secondary text-xs">
          <Download size={13} />
          {csvLoading ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color }} />
              <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5 p-0.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { val: '',        label: 'All'      },
            { val: 'success', label: '✅ Success' },
            { val: 'error',   label: '❌ Errors'  },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => { setStatus(val); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === val ? 'text-white' : 'text-white/40 hover:text-white/65'
              }`}
              style={statusFilter === val ? { background: 'rgba(99,102,241,0.25)', color: '#818cf8' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {apis.length > 0 && (
          <select value={apiFilter} onChange={e => { setApiFilter(e.target.value); setPage(1); }}
            className="input text-xs py-1.5 h-auto w-44">
            <option value="">All APIs</option>
            {apis.map(a => <option key={a._id} value={a._id}>{a.icon} {a.name}</option>)}
          </select>
        )}

        <span className="text-xs text-white/20 ml-auto">
          Page {page} of {pages} · {total.toLocaleString()} logs
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-2xl overflow-hidden space-y-2 p-4"
          style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-9 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Activity size={36} className="text-white/10 mb-3" />
          <p className="text-white/40 font-medium mb-1">No logs found</p>
          <p className="text-white/20 text-sm">
            {statusFilter || apiFilter ? 'Try adjusting your filters' : 'Make requests through the gateway to see data here'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Time', 'API', 'Endpoint', 'Method', 'Status', 'Latency', 'IP'].map(h => (
                    <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}
                    className="table-row cursor-pointer"
                    onClick={() => setSelectedLog(log)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/35">
                        <Clock size={10} />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{log.apiId?.icon || '🔌'}</span>
                        <span className="text-xs text-white/55 whitespace-nowrap">{log.apiId?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <span className="font-mono text-[11px] text-white/45 truncate block">{log.endpoint}</span>
                    </td>
                    <td className="px-4 py-3"><MethodBadge method={log.method} /></td>
                    <td className="px-4 py-3"><StatusBadge code={log.statusCode} /></td>
                    <td className="px-4 py-3"><LatencyBar ms={log.latency} /></td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-white/20 font-mono">{log.ip || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs text-white/25">Showing {logs.length} of {total.toLocaleString()} · Click row to inspect</span>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg text-white/30 disabled:opacity-30 hover:bg-white/5 hover:text-white/60 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                        page === p ? 'bg-brand-500/20 text-brand-400' : 'text-white/30 hover:bg-white/5 hover:text-white/55'
                      }`}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg text-white/30 disabled:opacity-30 hover:bg-white/5 hover:text-white/60 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
