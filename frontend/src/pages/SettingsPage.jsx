import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Building2, Lock, Save, Check, Mail, Shield, AlertTriangle, Eye, EyeOff, Calendar, Hash, Crown } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const PLAN_META = {
  free:       { color: '#6b7280', label: 'Free'       },
  pro:        { color: '#6366f1', label: 'Pro'        },
  enterprise: { color: '#f59e0b', label: 'Enterprise' },
};

function Section({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <Icon size={13} className="text-brand-400" />
        </div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', company: user?.company || '' });
  const [passForm, setPassForm]       = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [passError, setPassError]     = useState('');
  const [saved, setSaved]             = useState('');

  const profileMut = useMutation({
    mutationFn: (data) => api.patch('/auth/profile', data),
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      setSaved('profile');
      setTimeout(() => setSaved(''), 2500);
    },
  });

  const passMut = useMutation({
    mutationFn: (data) => api.patch('/auth/change-password', data),
    onSuccess: () => {
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
      setSaved('password');
      setPassError('');
      setTimeout(() => setSaved(''), 3000);
    },
    onError: (err) => setPassError(err.response?.data?.message || 'Password change failed'),
  });

  const handlePassword = (e) => {
    e.preventDefault();
    setPassError('');
    if (passForm.newPassword !== passForm.confirm) { setPassError('Passwords do not match.'); return; }
    if (passForm.newPassword.length < 8)           { setPassError('Password must be at least 8 characters.'); return; }
    passMut.mutate({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
  };

  const initials = (user?.name || 'U').split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const planMeta = PLAN_META[user?.plan] || PLAN_META.free;
  const passStrength = (() => {
    const p = passForm.newPassword;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8)   s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/35 mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Avatar + name card */}
      <div className="rounded-2xl p-5 flex items-center gap-5"
        style={{ background: '#0e0e28', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-white truncate">{user?.name}</p>
          <p className="text-sm text-white/40 truncate">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Crown size={11} style={{ color: planMeta.color }} />
            <span className="text-xs font-semibold capitalize" style={{ color: planMeta.color }}>{planMeta.label} Plan</span>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <Section icon={User} title="Profile">
        <form onSubmit={e => { e.preventDefault(); profileMut.mutate(profileForm); }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input className="input pl-9" value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label className="label">Company <span className="text-white/20 font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input className="input pl-9" placeholder="Acme Corp" value={profileForm.company}
                  onChange={e => setProfileForm(f => ({ ...f, company: e.target.value }))} />
              </div>
            </div>
          </div>
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input className="input pl-9 cursor-not-allowed" value={user?.email} disabled
                style={{ opacity: 0.4 }} />
            </div>
            <p className="text-[10px] text-white/20 mt-1">Email address cannot be changed</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={profileMut.isPending} className="btn-primary">
              {saved === 'profile'
                ? <><Check size={13} /> Saved!</>
                : <><Save size={13} /> Save Changes</>}
            </button>
            {saved === 'profile' && <span className="text-xs text-emerald-400">Profile updated successfully</span>}
          </div>
        </form>
      </Section>

      {/* Change password */}
      <Section icon={Lock} title="Change Password">
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input type={showCurrent ? 'text' : 'password'} className="input pl-9 pr-10"
                value={passForm.currentPassword}
                onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} required />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors">
                {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input type={showNew ? 'text' : 'password'} className="input pl-9 pr-10"
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={8} />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors">
                {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {passStrength !== null && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: passStrength >= n
                        ? passStrength <= 1 ? '#ef4444' : passStrength <= 2 ? '#f59e0b' : passStrength <= 3 ? '#22d3ee' : '#10b981'
                        : 'rgba(255,255,255,0.08)' }} />
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: passStrength <= 1 ? '#ef4444' : passStrength <= 2 ? '#f59e0b' : passStrength <= 3 ? '#22d3ee' : '#10b981' }}>
                  {['', 'Weak', 'Fair', 'Good', 'Strong'][passStrength]}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input type="password" className={`input pl-9 ${passForm.confirm && passForm.confirm !== passForm.newPassword ? 'border-red-500/40' : passForm.confirm && passForm.confirm === passForm.newPassword ? 'border-emerald-500/40' : ''}`}
                value={passForm.confirm}
                onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>
          </div>
          {passError && (
            <div className="flex items-center gap-2 text-xs text-red-400 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertTriangle size={12} />{passError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={passMut.isPending} className="btn-primary">
              {saved === 'password'
                ? <><Check size={13} /> Changed!</>
                : <><Shield size={13} /> Update Password</>}
            </button>
            {saved === 'password' && <span className="text-xs text-emerald-400">Password changed successfully</span>}
          </div>
        </form>
      </Section>

      {/* Account info */}
      <Section icon={Building2} title="Account Information">
        <div className="space-y-0 divide-y" style={{ '--tw-divide-opacity': 1 }}>
          {[
            { label: 'Plan',         val: planMeta.label,  icon: Crown,    color: planMeta.color  },
            { label: 'Role',         val: user?.role,       icon: Shield,   color: '#6366f1'       },
            { label: 'Email',        val: user?.email,      icon: Mail,     color: '#22d3ee'       },
            { label: 'Member Since', val: user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: Calendar, color: '#10b981' },
            { label: 'Account ID',   val: user?.id,         icon: Hash,     color: '#6b7280', mono: true },
          ].map(({ label, val, icon: Icon, color, mono }) => (
            <div key={label} className="flex items-center justify-between py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-white/45">
                <Icon size={12} style={{ color }} />
                {label}
              </div>
              <span className={`text-sm font-semibold text-white/80 ${mono ? 'font-mono text-xs text-white/30' : 'capitalize'}`}>
                {val || '—'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} className="text-red-400" />
          <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-white/35 mb-4">Once you delete your account, there is no going back. This will permanently delete all your APIs, keys, and usage data.</p>
        <button className="btn-danger" disabled>
          Delete Account
        </button>
        <p className="text-[10px] text-white/20 mt-2">Account deletion coming soon — contact support to request deletion</p>
      </div>
    </div>
  );
}
