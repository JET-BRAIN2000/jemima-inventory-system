import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StoreInfo, UserProfile } from '../types';
import { CURRENCIES, TIMEZONES } from '../data/currencies';
import {
  Store, User, Shield, Copy, CheckCircle2, AlertCircle,
  Eye, EyeOff, Lock, Save, ChevronDown, ChevronUp, Loader2,
  Phone, Calendar, MapPin, Briefcase, Mail,
} from 'lucide-react';

type Section = 'store' | 'profile' | 'security';

/* ─────────────────────────────────────────────────────────
   These must be OUTSIDE the main component so React keeps
   stable references — otherwise they remount on every render,
   killing input focus and accordion toggles.
   ───────────────────────────────────────────────────────── */

function SectionHeader({
  id, label, icon, isOpen, isDark, textCls, subtext, onToggle,
}: {
  id: Section; label: string; icon: React.ReactNode;
  isOpen: boolean; isDark: boolean; textCls: string; subtext: string;
  onToggle: (id: Section) => void;
}) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={`w-full flex items-center justify-between p-3 sm:p-5 text-left transition-colors duration-150 cursor-pointer select-none ${
        isOpen ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
          isOpen ? 'bg-emerald-100 text-emerald-700' : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
        }`}>
          {icon}
        </div>
        <span className={`font-bold text-sm sm:text-base truncate ${textCls}`}>{label}</span>
      </div>
      {isOpen
        ? <ChevronUp className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${subtext}`} />
        : <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${subtext}`} />}
    </button>
  );
}

function InlineMsg({
  msg, section,
}: {
  msg: { section: Section; type: 'error' | 'success'; text: string } | null;
  section: Section;
}) {
  if (!msg || msg.section !== section) return null;
  return (
    <div className={`flex items-start sm:items-center gap-2 p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 text-xs sm:text-sm font-medium ${
      msg.type === 'error'
        ? 'bg-red-50 text-red-700 border border-red-200'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    }`}>
      {msg.type === 'error'
        ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
        : <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />}
      <span className="break-words min-w-0">{msg.text}</span>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { currentUser, currentProfile, storeInfo, updateProfile, updateStoreInfo, changePassword, theme } = useApp();

  const [openSection, setOpenSection] = useState<Section>('store');
  const [msg, setMsg] = useState<{ section: Section; type: 'error' | 'success'; text: string } | null>(null);
  const [savedStore, setSavedStore] = useState<StoreInfo | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Track whether a profile save is in-flight so we don't reset form state from the
  // context update that the save itself triggers.
  const profileSaveInFlight = useRef(false);

  const showMsg = (section: Section, type: 'error' | 'success', text: string) => {
    setMsg({ section, type, text });
    if (type === 'success') setTimeout(() => setMsg(null), 3000);
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textCls = isDark ? 'text-white' : 'text-gray-800';
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputCls = `w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800'}`;
  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${subtext}`;

  // ─ Store Form ──────────────────────────────────────────
  const [store, setStore] = useState<StoreInfo>(storeInfo ?? {
    store_id: 's001', user_id: currentUser?.user_id ?? '', store_name: '', store_description: '',
    store_address: '', store_phone: '', store_email: '', store_logo_path: '', base_currency: 'USD',
    currency_symbol: '$', timezone: 'UTC+00:00 (GMT / London)',
    date_created: new Date().toISOString(), date_modified: new Date().toISOString(),
  });

  const [profile, setProfile] = useState<UserProfile>(currentProfile ?? {
    user_id: currentUser?.user_id ?? '', full_name: '', job_title: 'Store Owner',
    phone_number: '', date_of_birth: '', address: '', profile_picture_path: '',
    date_modified: new Date().toISOString(),
  });

  const [copiedId, setCopiedId] = useState(false);
  const [initialized, setInitialized] = useState(false);
  // Only true after we have loaded profile data from the server at least once
  const profileInitialized = useRef(false);

  useEffect(() => {
    if (storeInfo && !initialized) {
      setStore(storeInfo);
      setInitialized(true);
    }
  }, [storeInfo, initialized]);

  // Sync profile from context ONLY on first load (when we haven't received data yet).
  // After that, the user owns the form state — do NOT overwrite what they typed.
  useEffect(() => {
    if (currentProfile && !profileInitialized.current) {
      setProfile({
        user_id:              currentProfile.user_id              ?? '',
        full_name:            currentProfile.full_name            ?? '',
        job_title:            currentProfile.job_title            ?? 'Store Owner',
        phone_number:         currentProfile.phone_number         ?? '',
        date_of_birth:        currentProfile.date_of_birth        ?? '',
        address:              currentProfile.address              ?? '',
        profile_picture_path: currentProfile.profile_picture_path ?? '',
        date_modified:        currentProfile.date_modified        ?? new Date().toISOString(),
      });
      profileInitialized.current = true;
    }
  }, [currentProfile]);

  const handleStoreSave = async () => {
    if (!store.store_name.trim() || store.store_name.trim().length < 3)
      return showMsg('store', 'error', 'Store name must be at least 3 characters.');
    if (store.store_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.store_email))
      return showMsg('store', 'error', 'Please enter a valid email address.');
    setSavingStore(true);
    const result = await updateStoreInfo(store);
    if (result.success && result.store) {
      setSavedStore(result.store);
      setStore(result.store);
    }
    showMsg('store', result.success ? 'success' : 'error', result.message);
    setSavingStore(false);
  };

  const copyStoreId = () => {
    navigator.clipboard.writeText(store.store_id || 'JEMIMA-STORE-2026-001').catch(() => {});
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // ─ Profile Form ────────────────────────────────────────
  const handleProfileSave = async () => {
    if (!profile.full_name.trim() || profile.full_name.trim().length < 3)
      return showMsg('profile', 'error', 'Full name must be at least 3 characters.');

    profileSaveInFlight.current = true;
    setSavingProfile(true);

    const result = await updateProfile({ ...profile, date_modified: new Date().toISOString() });
    showMsg('profile', result.success ? 'success' : 'error', result.message);

    // After a successful save, update the local form with what came back from the DB
    // so values stay in sync without triggering the context useEffect reset.
    if (result.success && result.profile) {
      setProfile(result.profile as UserProfile);
    }

    setSavingProfile(false);
  };

  // ─ Security Form ───────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const pwStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = pwStrength(newPw);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] ?? '';
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'][strength] ?? '';

  const handlePasswordChange = async () => {
    if (!currentPw || !newPw || !confirmPw) return showMsg('security', 'error', 'All password fields are required.');
    if (newPw.length < 8) return showMsg('security', 'error', 'New password must be at least 8 characters.');
    if (newPw !== confirmPw) return showMsg('security', 'error', 'New passwords do not match.');
    setSavingPassword(true);
    const result = await changePassword(currentPw, newPw);
    showMsg('security', result.success ? 'success' : 'error', result.message);
    if (result.success) { setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
    setSavingPassword(false);
  };

  const handleToggleSection = (id: Section) => {
    setOpenSection(id);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="mb-1 sm:mb-2">
          <h2 className={`text-xl sm:text-2xl font-extrabold ${textCls}`}>Settings</h2>
          <p className={`text-xs sm:text-sm ${subtext}`}>Manage your store and account settings</p>
        </div>

        {/* Store ID Badge */}
        <div className={`rounded-2xl border p-3 sm:p-4 ${cardBg} shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4`}>
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 w-full">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs ${subtext}`}>Store ID (Auto-Generated)</p>
              <p className={`font-mono font-bold text-xs sm:text-sm ${textCls} truncate`}>{store.store_id || 'JEMIMA-STORE-2026-001'}</p>
            </div>
          </div>
          <button onClick={copyStoreId} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all w-full sm:w-auto justify-center ${copiedId ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {copiedId ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>

        {/* ═══════════════════ Store Info Section ═══════════════════ */}
        <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
          <SectionHeader
            id="store" label="General Store Information" icon={<Store className="w-4 h-4" />}
            isOpen={openSection === 'store'} isDark={isDark} textCls={textCls} subtext={subtext}
            onToggle={handleToggleSection}
          />
          {openSection === 'store' && (
            <div className="p-3 sm:p-5 border-t border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
              <InlineMsg msg={msg} section="store" />

              <div>
                <label className={labelCls}>Store Name <span className="text-red-500">*</span></label>
                <input type="text" value={store.store_name} onChange={e => setStore({ ...store, store_name: e.target.value })} className={inputCls} placeholder="Your store name" maxLength={100} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>Base Currency</label>
                  <select value={store.base_currency} onChange={e => setStore({ ...store, base_currency: e.target.value })} className={inputCls}>
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Timezone</label>
                  <select value={store.timezone} onChange={e => setStore({ ...store, timezone: e.target.value })} className={inputCls}>
                    {TIMEZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Store Description</label>
                <textarea value={store.store_description} onChange={e => setStore({ ...store, store_description: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Brief description of your store..." />
              </div>

              <div>
                <label className={labelCls}>Store Address</label>
                <input type="text" value={store.store_address} onChange={e => setStore({ ...store, store_address: e.target.value })} className={inputCls} placeholder="123 Market Street, City, Country" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>Store Phone</label>
                  <input type="tel" value={store.store_phone} onChange={e => setStore({ ...store, store_phone: e.target.value })} className={inputCls} placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <label className={labelCls}>Store Email</label>
                  <input type="email" value={store.store_email} onChange={e => setStore({ ...store, store_email: e.target.value })} className={inputCls} placeholder="info@yourstore.com" />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button onClick={() => setStore(storeInfo ?? store)} className={`flex-1 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'} hover:bg-gray-50 dark:hover:bg-gray-700 transition-all`}>Reset</button>
                  <button onClick={handleStoreSave} disabled={savingStore} className="flex-1 py-2.5 sm:py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {savingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingStore ? 'Saving...' : 'Update Store Info'}
                  </button>
                </div>
                {savedStore && (
                  <div className={`rounded-2xl border p-3 sm:p-4 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <p className={`text-sm font-semibold mb-2 sm:mb-3 ${textCls}`}>Saved values returned from database:</p>
                    <div className="grid grid-cols-1 gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <div className="break-words"><span className="font-semibold">Store Name:</span> {savedStore.store_name}</div>
                      <div className="break-words"><span className="font-semibold">Currency:</span> {savedStore.base_currency} ({savedStore.currency_symbol})</div>
                      <div className="break-words"><span className="font-semibold">Timezone:</span> {savedStore.timezone}</div>
                      <div className="break-words"><span className="font-semibold">Description:</span> {savedStore.store_description || '—'}</div>
                      <div className="break-words"><span className="font-semibold">Address:</span> {savedStore.store_address || '—'}</div>
                      <div className="break-words"><span className="font-semibold">Phone:</span> {savedStore.store_phone || '—'}</div>
                      <div className="break-words"><span className="font-semibold">Email:</span> {savedStore.store_email || '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ Profile Section ═══════════════════ */}
        <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
          <SectionHeader
            id="profile" label="User Profile Management" icon={<User className="w-4 h-4" />}
            isOpen={openSection === 'profile'} isDark={isDark} textCls={textCls} subtext={subtext}
            onToggle={handleToggleSection}
          />
          {openSection === 'profile' && (
            <div className="p-3 sm:p-5 border-t border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
              <InlineMsg msg={msg} section="profile" />

              {/* User info preview card */}
              <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold flex-shrink-0 shadow-lg">
                    {(profile.full_name || currentUser?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="text-center sm:text-left min-w-0 w-full space-y-0.5">
                    <p className={`font-bold text-sm sm:text-base ${textCls} truncate`}>{profile.full_name || currentUser?.username}</p>
                    <p className={`text-xs sm:text-sm ${subtext} truncate`}>{currentUser?.email}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Briefcase className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs text-emerald-600 font-semibold">{profile.job_title}</span>
                    </div>
                  </div>
                </div>

                {(profile.phone_number || profile.address || profile.date_of_birth) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex flex-wrap gap-2">
                    {profile.phone_number && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'}`}>
                        <Phone className="w-3 h-3" /> {profile.phone_number}
                      </span>
                    )}
                    {profile.date_of_birth && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'}`}>
                        <Calendar className="w-3 h-3" /> {profile.date_of_birth}
                      </span>
                    )}
                    {profile.address && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs max-w-full ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-600'}`}>
                        <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{profile.address}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                <input type="text" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className={inputCls} placeholder="Your full name" maxLength={100} />
              </div>

              {/* Job Title */}
              <div>
                <label className={labelCls}>Job Title</label>
                <select value={profile.job_title} onChange={e => setProfile({ ...profile, job_title: e.target.value as UserProfile['job_title'] })} className={inputCls}>
                  {['Store Owner', 'Manager', 'Cashier', 'Sales Representative', 'Accountant'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Phone & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input type="tel" value={profile.phone_number} onChange={e => setProfile({ ...profile, phone_number: e.target.value })} className={inputCls} placeholder="+234 801 234 5678" />
                </div>
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <input type="date" value={profile.date_of_birth} onChange={e => setProfile({ ...profile, date_of_birth: e.target.value })} className={inputCls} />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} className={inputCls} placeholder="Your home/business address" />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button onClick={() => setProfile(currentProfile ?? profile)} className={`flex-1 py-2.5 sm:py-3 rounded-xl border text-sm font-semibold ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700'} hover:bg-gray-50 dark:hover:bg-gray-700 transition-all`}>Reset</button>
                <button onClick={handleProfileSave} disabled={savingProfile} className="flex-1 py-2.5 sm:py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingProfile ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ Security Section ═══════════════════ */}
        <div className={`rounded-2xl border ${cardBg} shadow-sm overflow-hidden`}>
          <SectionHeader
            id="security" label="Security & Password" icon={<Shield className="w-4 h-4" />}
            isOpen={openSection === 'security'} isDark={isDark} textCls={textCls} subtext={subtext}
            onToggle={handleToggleSection}
          />
          {openSection === 'security' && (
            <div className="p-3 sm:p-5 border-t border-gray-100 dark:border-gray-700 space-y-3 sm:space-y-4">
              <InlineMsg msg={msg} section="security" />

              {/* Account info banner */}
              <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                    <Lock className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-blue-800'}`}>Account: @{currentUser?.username}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3">
                      <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                        Last login: {currentUser?.last_login ? new Date(currentUser.last_login).toLocaleString() : 'First time'}
                      </p>
                      {currentUser?.email && (
                        <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                          <Mail className="w-3 h-3" /> {currentUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Password */}
              <div>
                <label className={labelCls}>Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className={`${inputCls} pr-11`}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(v => !v)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className={labelCls}>New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className={`${inputCls} pr-11`}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(v => !v)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`flex-1 h-full rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-gray-200 dark:bg-gray-600'}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${strengthColor.replace('bg-', 'text-')}`}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className={labelCls}>Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className={`${inputCls} pr-11`}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(v => !v)}
                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPw && newPw !== confirmPw && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
                {confirmPw && newPw === confirmPw && confirmPw.length >= 8 && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <button onClick={handlePasswordChange} disabled={savingPassword} className="w-full py-2.5 sm:py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {savingPassword ? 'Changing Password...' : 'Change Password'}
                </button>

                {/* Two-Factor Authentication */}
                <div className={`p-3 sm:p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${textCls}`}>Two-Factor Authentication</p>
                      <p className={`text-xs ${subtext}`}>Add an extra layer of security</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 transition-all w-full sm:w-auto text-center">Setup</button>
                  </div>
                </div>

                {/* Password Tips */}
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-amber-50'}`}>
                  <p className={`text-xs font-semibold mb-1.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Password Tips</p>
                  <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-amber-600'}`}>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                      Use at least 8 characters with uppercase, numbers, and symbols
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                      Don&apos;t reuse passwords from other accounts
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-current flex-shrink-0" />
                      Change your password every 3-6 months
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App Info */}
        <div className={`rounded-2xl border p-3 sm:p-4 ${cardBg} shadow-sm text-center`}>
          <p className={`text-xs ${subtext}`}>JEMIMA 1 · Provision Store Inventory Management System</p>
          <p className={`text-xs ${subtext} mt-0.5`}>Version 1.0.0 · © 2026 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
