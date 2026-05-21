import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Check, Zap, ArrowRight, Crown, Sparkles, Building2, TrendingUp, FileText, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const PLAN_META = {
  free:       { icon: '🌱', color: '#6b7280', gradient: 'linear-gradient(135deg,#374151,#1f2937)', glow: 'rgba(107,114,128,0.2)' },
  pro:        { icon: '⚡', color: '#6366f1', gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', glow: 'rgba(99,102,241,0.25)' },
  enterprise: { icon: '🏢', color: '#f59e0b', gradient: 'linear-gradient(135deg,#d97706,#b45309)', glow: 'rgba(245,158,11,0.25)' },
};

export default function BillingPage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: usage } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => api.get('/billing/usage').then(r => r.data.data),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/billing/invoices').then(r => r.data.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/billing/plans').then(r => r.data.data),
  });

  const upgradeMut = useMutation({
    mutationFn: (plan) => api.post('/billing/upgrade', { plan }),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      queryClient.invalidateQueries(['billing-usage']);
    },
  });

  const plans    = plansData?.plans || [];
  const invoices = invoicesData?.invoices || [];
  const pct      = Math.min(100, usage?.usagePercent || 0);
  const barColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';

  const currentPlanMeta = PLAN_META[user?.plan] || PLAN_META.free;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Billing</h1>
          <p className="text-sm text-white/35 mt-0.5">Manage your subscription and view invoices</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: `${currentPlanMeta.color}15`, border: `1px solid ${currentPlanMeta.color}30`, color: currentPlanMeta.color }}>
          <span>{currentPlanMeta.icon}</span>
          <span className="capitalize">{user?.plan || 'Free'} Plan</span>
        </div>
      </div>

      {/* Usage card */}
      {usage && (
        <div className="rounded-2xl p-6" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold text-white/70">Current Billing Period</p>
              <p className="text-xs text-white/30 mt-0.5">{usage.billingPeriod}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Estimated Cost</p>
              <p className="text-2xl font-bold text-emerald-400">₹{usage.estimatedCost?.amount?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-5">
            {[
              { label: 'Requests Used',   val: (usage.totalRequests || 0).toLocaleString(), color: '#6366f1' },
              { label: 'Plan Limit',      val: (usage.planLimit || 0).toLocaleString(),    color: '#6b7280' },
              { label: 'Usage %',         val: `${pct}%`,                                  color: barColor  },
              { label: 'Remaining',       val: Math.max(0, (usage.planLimit || 0) - (usage.totalRequests || 0)).toLocaleString(), color: '#10b981' },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-xl font-bold" style={{ color }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-white/30">
              <span>Usage</span>
              <span>{pct}% of {(usage.planLimit || 0).toLocaleString()}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${pct}%`, background: pct >= 90
                  ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                  : pct >= 70
                  ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                  : 'linear-gradient(90deg,#10b981,#059669)' }} />
            </div>
            {pct >= 90 && (
              <p className="text-[10px] text-red-400 flex items-center gap-1">
                <span>⚠</span> You're near your plan limit — consider upgrading
              </p>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Crown size={14} className="text-amber-400" />
          <h2 className="text-sm font-bold text-white">Available Plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const meta      = PLAN_META[plan.id] || PLAN_META.free;
            const isCurrent = user?.plan === plan.id;
            const currentPrice = plans.find(p => p.id === user?.plan)?.price || 0;
            const isUpgrade = plan.price > currentPrice;

            return (
              <div key={plan.id}
                className="rounded-2xl p-5 transition-all duration-300 relative overflow-hidden"
                style={{
                  background: isCurrent ? `${meta.color}08` : '#0e0e28',
                  border: `1px solid ${isCurrent ? `${meta.color}35` : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isCurrent ? `0 0 32px ${meta.glow}` : 'none',
                }}>
                {isCurrent && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 rounded-t-2xl"
                    style={{ background: meta.gradient }} />
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}25` }}>
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                      {isCurrent && <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>Current Plan</span>}
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-black text-white">
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-xs text-white/30 ml-1.5">/month</span>}
                </div>

                <div className="space-y-2.5 mb-6">
                  {[
                    `${plan.features.requestsPerMonth.toLocaleString()} req/month`,
                    `${plan.features.requestsPerMinute} req/min rate limit`,
                    `Up to ${plan.features.apisAllowed} APIs`,
                    `${plan.features.analytics} analytics`,
                    `${plan.features.support} support`,
                    plan.features.webhooks    ? 'Webhooks included'    : null,
                    plan.features.customDomain ? 'Custom domain'        : null,
                  ].filter(Boolean).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-white/55">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${meta.color}15` }}>
                        <Check size={9} style={{ color: meta.color }} />
                      </div>
                      {feat}
                    </div>
                  ))}
                  {plan.overage && (
                    <div className="flex items-center gap-2.5 text-xs text-white/25 mt-1">
                      <ArrowRight size={10} />
                      Overage: ₹{plan.overage.per100Requests}/100 req
                    </div>
                  )}
                </div>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl text-xs font-semibold text-center"
                    style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}25` }}>
                    Your current plan
                  </div>
                ) : (
                  <button onClick={() => upgradeMut.mutate(plan.id)}
                    disabled={upgradeMut.isPending}
                    className={`w-full justify-center ${isUpgrade ? 'btn-primary' : 'btn-secondary'}`}>
                    {isUpgrade ? <Zap size={12} /> : <ArrowRight size={12} />}
                    {upgradeMut.isPending ? 'Switching…' : isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice history */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <FileText size={14} className="text-white/40" />
          <h2 className="text-sm font-bold text-white">Invoice History</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Receipt size={32} className="text-white/10 mb-3" />
            <p className="text-white/40 text-sm font-medium mb-1">No invoices yet</p>
            <p className="text-white/20 text-xs">Invoices are generated automatically at the end of each billing period</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Invoice #', 'Period', 'Requests', 'Status', 'Total', 'Date', ''].map(h => (
                      <th key={h} className="table-header-cell whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="table-row">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-white/55">{inv.invoiceNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-white/50">{inv.billingPeriod}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-white/50">{(inv.totalRequests || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`badge text-[10px] ${
                          inv.status === 'paid' ? 'badge-green' : inv.status === 'open' ? 'badge-yellow' : 'badge-red'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-white">₹{(inv.total / 100).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-white/30">{new Date(inv.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors" title="View invoice">
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
