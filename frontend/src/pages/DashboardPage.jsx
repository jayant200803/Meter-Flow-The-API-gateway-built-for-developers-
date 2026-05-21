import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Zap, Key, BarChart3, AlertTriangle,
  Clock, ArrowUpRight, Activity, CheckCircle2, Circle, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { format, parseISO } from 'date-fns';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

function useCounter(end = 0, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!end) { setVal(0); return; }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 4)) * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return val;
}

function Spark({ data = [], color = '#6366f1' }) {
  if (!data.length) return null;
  const parsed = data.map((v, i) => ({ i, v: typeof v === 'object' ? (v.requests ?? 0) : v }));
  const id = `sp${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={parsed} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} fill={`url(#${id})`} strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({ label, rawValue = 0, suffix = '', sub, trend, icon: Icon, color, sparkData }) {
  const n = useCounter(rawValue);
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:scale-[1.015] cursor-default"
      style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}38`; e.currentTarget.style.boxShadow = `0 0 28px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="absolute inset-0 opacity-[0.035]" style={{ background: `radial-gradient(ellipse at top right,${color},transparent 70%)` }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">{label}</p>
            <p className="text-[28px] font-bold leading-none mt-1.5 text-white tabular-nums">
              {n.toLocaleString()}{suffix}
            </p>
            {sub && <p className="text-[11px] text-white/25 mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
            <Icon size={17} style={{ color }} />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 mt-2">
          {trend !== undefined
            ? <div className={`flex items-center gap-1 text-[11px] font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(trend)}% vs last month
              </div>
            : <div />}
          {sparkData && <div className="w-20 opacity-70"><Spark data={sparkData} color={color} /></div>}
        </div>
      </div>
    </div>
  );
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-xs shadow-2xl"
      style={{ background: '#0f0f28', border: '1px solid rgba(255,255,255,0.10)' }}>
      <p className="text-white/40 font-medium mb-2">{label}</p>
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
          <span className="text-white/55">{e.name}:</span>
          <span className="text-white font-bold">{(e.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

const MC = { GET: ['#22d3ee','#22d3ee18'], POST: ['#10b981','#10b98118'], DELETE: ['#f87171','#f8717118'], PUT: ['#fbbf24','#fbbf2418'], PATCH: ['#c084fc','#c084fc18'] };

function OnboardingChecklist({ hasApis, hasKeys, hasRequests }) {
  const steps = [
    { label: 'Create your first API', done: hasApis, to: '/apis', action: 'Add API →' },
    { label: 'Generate an API key', done: hasKeys, to: '/keys', action: 'Create Key →' },
    { label: 'Make your first request', done: hasRequests, to: '/playground', action: 'Open Playground →' },
  ];
  const doneCount = steps.filter(s => s.done).length;
  if (doneCount === 3) return null;

  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Getting Started</h3>
          <p className="text-xs text-white/35 mt-0.5">{doneCount} of 3 steps completed</p>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: s.done ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 group">
            {step.done
              ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              : <Circle size={16} className="text-white/20 flex-shrink-0" />}
            <span className={`text-sm flex-1 ${step.done ? 'text-white/35 line-through' : 'text-white/70'}`}>{step.label}</span>
            {!step.done && (
              <Link to={step.to} className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors opacity-0 group-hover:opacity-100">
                {step.action}
              </Link>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(doneCount / 3) * 100}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [liveEvents, setLiveEvents] = useState([]);
  const socketRef = useRef(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data.data),
    refetchInterval: 30000,
  });

  // Socket.io real-time connection
  useEffect(() => {
    if (!user?._id) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.emit('join-dashboard', user._id);
    socket.on('request-logged', (data) => {
      setLiveEvents(prev => [{ ...data, _live: true, _id: Date.now() }, ...prev].slice(0, 8));
    });
    return () => { socket.disconnect(); };
  }, [user?._id]);

  const ov = stats?.overview || {};
  const hourly = stats?.hourlyTraffic || [];
  const chartData = hourly.map(h => ({
    time: format(parseISO(h._id), 'HH:mm'),
    requests: h.requests, errors: h.errors, latency: Math.round(h.avgLatency || 0),
  }));
  const success = Math.max(0, (ov.monthlyRequests || 0) - (ov.errorCount || 0));
  const rate = ov.monthlyRequests > 0 ? ((success / ov.monthlyRequests) * 100).toFixed(1) : '100.0';
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';

  // Merge live events with historical activity
  const activityFeed = liveEvents.length > 0
    ? [...liveEvents, ...(stats?.recentActivity || [])].slice(0, 8)
    : (stats?.recentActivity || []);

  if (isLoading) return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl skeleton animate-pulse" style={{ height: 140 }} />)}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{greet}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-white/35 mt-0.5">Here's your API performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {liveEvents.length > 0 ? 'Live' : 'Connected'}
          </div>
          <span className="text-[11px] text-white/25">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist
        hasApis={(ov.totalApis || 0) > 0}
        hasKeys={(ov.activeKeys || 0) > 0}
        hasRequests={(ov.monthlyRequests || 0) > 0}
      />

      {ov.planUsagePercent >= 80 && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-400 flex-1">
            {ov.planUsagePercent}% of monthly limit used &mdash;{' '}
            <span className="font-normal text-white/40">
              {(ov.monthlyRequests || 0).toLocaleString()} / {(ov.planLimit || 0).toLocaleString()} requests
            </span>
          </p>
          <Link to="/billing" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Upgrade <ArrowUpRight size={11} />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Monthly Requests" rawValue={ov.monthlyRequests || 0}
          sub={`of ${(ov.planLimit || 0).toLocaleString()} limit`}
          trend={ov.requestsGrowth} icon={Zap} color="#6366f1" sparkData={hourly} />
        <StatCard label="Active APIs" rawValue={ov.totalApis || 0}
          sub="Endpoints deployed" icon={Activity} color="#22d3ee"
          sparkData={[1,2,2,3,3,4,ov.totalApis||4]} />
        <StatCard label="API Keys" rawValue={ov.activeKeys || 0}
          sub="Active credentials" icon={Key} color="#f59e0b"
          sparkData={[1,2,3,3,4,5,ov.activeKeys||5]} />
        <StatCard label="Avg Latency" rawValue={ov.avgLatency || 0} suffix="ms"
          sub="This month" icon={Clock}
          color={ov.avgLatency > 1000 ? '#ef4444' : '#10b981'}
          sparkData={hourly.map(h => ({ requests: Math.round(h.avgLatency || 0) }))} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white">Request Traffic</h3>
              <p className="text-xs text-white/30 mt-0.5">Last 24 hours</p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-white/40"><span className="w-2 h-2 rounded-full bg-[#6366f1]" />Requests</span>
              <span className="flex items-center gap-1.5 text-white/40"><span className="w-2 h-2 rounded-full bg-[#ef4444]" />Errors</span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gR2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gE2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.22)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#gR2)" strokeWidth={2} name="Requests" />
                <Area type="monotone" dataKey="errors"   stroke="#ef4444" fill="url(#gE2)" strokeWidth={1.5} name="Errors" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <BarChart3 size={30} className="text-white/10" />
              <p className="text-white/25 text-sm">No traffic data yet</p>
              <p className="text-white/15 text-xs">Make requests through the gateway</p>
            </div>
          )}
        </div>

        {/* Donut */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-sm font-bold text-white">Success Rate</h3>
          <p className="text-xs text-white/30 mt-0.5 mb-4">This month</p>
          <div className="relative flex items-center justify-center my-2">
            <PieChart width={150} height={150}>
              <Pie data={[{ value: success },{ value: ov.errorCount||0 }]} cx={70} cy={70}
                innerRadius={50} outerRadius={68} dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                <Cell fill="#6366f1" /><Cell fill="rgba(255,255,255,0.05)" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white tabular-nums">{rate}%</span>
              <span className="text-[10px] text-white/30 mt-0.5">success</span>
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {[['#6366f1','Successful',success],['#ef4444','Failed',ov.errorCount||0]].map(([c,n,v]) => (
              <div key={n} className="flex items-center justify-between text-xs px-1">
                <span className="flex items-center gap-2 text-white/50">
                  <span className="w-2 h-2 rounded-full" style={{ background: c }} />{n}
                </span>
                <span className="text-white font-bold tabular-nums">{(v||0).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between text-[11px] mb-2">
              <span className="text-white/40">Plan Usage</span>
              <span className="text-white/65 font-semibold">{ov.planUsagePercent || 0}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, ov.planUsagePercent || 0)}%`,
                  background: ov.planUsagePercent >= 90 ? '#ef4444' : ov.planUsagePercent >= 70 ? '#f59e0b' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                }} />
            </div>
          </div>
        </div>
      </div>

      {/* Live activity feed */}
      {activityFeed.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <h3 className="text-sm font-bold text-white">Live Activity</h3>
              <p className="text-xs text-white/30 mt-0.5">Real-time gateway requests</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
            </div>
          </div>
          {activityFeed.slice(0, 8).map((log, i) => {
            const isErr = log.isError || log.statusCode >= 400;
            const [mc, mbg] = MC[log.method] || ['#9ca3af','#9ca3af18'];
            const isNew = log._live;
            return (
              <div key={log._id || i}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.02]"
                style={{
                  borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: isNew ? 'rgba(99,102,241,0.04)' : 'transparent',
                  animation: isNew ? 'fadeIn 0.4s ease' : 'none',
                }}>
                {isNew && <span className="w-1 h-full absolute left-0 rounded-r" style={{ background: '#6366f1' }} />}
                <span className="text-[18px] flex-shrink-0">{log.apiId?.icon || log.apiName?.[0] || '🔌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/75 font-medium truncate">{log.endpoint}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">
                    {log.apiId?.name || log.apiName || 'Unknown'} · {new Date(log.createdAt || log.timestamp).toLocaleTimeString()}
                    {isNew && <span className="ml-2 text-brand-400 font-semibold">● new</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ color: mc, background: mbg }}>{log.method}</span>
                  <span className={`text-[10px] font-mono font-semibold ${log.latency < 200 ? 'text-emerald-400' : log.latency < 500 ? 'text-amber-400' : 'text-red-400'}`}>{log.latency}ms</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${isErr ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/[0.12] text-emerald-400'}`}>{log.statusCode}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
