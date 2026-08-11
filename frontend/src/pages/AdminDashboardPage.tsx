import { useState, useEffect } from 'react';
import client from '../api/client';
import { adminLogin } from '../api/auth';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import { Shield, Users, Store, BarChart3, Mail, ShoppingCart, Activity, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface QueueStatus {
  emails: { waiting: number; active: number; completed: number; failed: number; delayed: number };
  abandonedCarts: { waiting: number; active: number; completed: number; failed: number; delayed: number };
}

interface Merchant {
  id: number;
  email: string;
  name: string;
  businessName: string;
  status: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface StoreData {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  isLive: boolean;
}

export function AdminDashboardPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const [token, setToken] = useState('');
  const [logged, setLogged] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [queue, setQueue] = useState<QueueStatus | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'stores' | 'queue'>('overview');

  const adminClient = {
    get: (url: string) => client.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    post: (url: string, data?: any) => client.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminLogin(email, password);
      const tok = res?.accessToken || res?.data?.accessToken;
      if (tok) {
        setToken(tok);
        setLogged(true);
        localStorage.setItem('admin_token', tok);
        addToast('Admin login successful', 'success');
      }
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Login failed', 'error');
    }
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [queueRes, merchRes, storeRes] = await Promise.all([
        adminClient.get('/admin/queue/status').catch(() => ({ data: null })),
        adminClient.get('/admin/merchants').catch(() => ({ data: { data: [] } })),
        adminClient.get('/admin/stores').catch(() => ({ data: { data: [] } })),
      ]);
      setQueue(queueRes.data?.data || queueRes.data);
      setMerchants(Array.isArray(merchRes.data?.data) ? merchRes.data.data : Array.isArray(merchRes.data) ? merchRes.data : []);
      setStores(Array.isArray(storeRes.data?.data) ? storeRes.data.data : Array.isArray(storeRes.data) ? storeRes.data : []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { if (logged) fetchData(); }, [logged]);

  if (!logged) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield size={22} className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('admin_login_title')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('admin_login_desc')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white text-sm placeholder-slate-400" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg input-focus outline-none text-slate-900 dark:text-white text-sm placeholder-slate-400" />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors">
              {t('admin_login')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', icon: BarChart3, label: t('admin_overview') },
    { key: 'merchants', icon: Users, label: t('admin_merchants') },
    { key: 'stores', icon: Store, label: t('admin_stores') },
    { key: 'queue', icon: Activity, label: t('admin_queue') },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield size={24} className="text-red-500" />
            {t('admin_dashboard')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">{t('admin_subtitle')}</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {t('admin_refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label={t('admin_total_merchants')} value={merchants.length} />
          <StatCard icon={Store} label={t('admin_total_stores')} value={stores.length} />
          <StatCard icon={Mail} label={t('admin_email_queue')} value={queue ? queue.emails?.waiting || 0 : '—'} />
          <StatCard icon={ShoppingCart} label={t('admin_cart_queue')} value={queue ? queue.abandonedCarts?.waiting || 0 : '—'} />
        </div>
      )}

      {/* Merchants Tab */}
      {activeTab === 'merchants' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Verified</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map(m => (
                  <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-slate-400">#{m.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.email}</td>
                    <td className="px-4 py-3 text-slate-500">{m.businessName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${m.status === 'approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.emailVerified ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {merchants.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">{t('admin_no_data')}</p>}
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="grid gap-3">
          {stores.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.subdomain} · {s.plan} plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                  {s.status}
                </span>
                {s.isLive ? <CheckCircle size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
              </div>
            </div>
          ))}
          {stores.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">{t('admin_no_data')}</p>}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && queue && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <QueueCard title="Email Queue" data={queue.emails} />
          <QueueCard title="Abandoned Cart Queue" data={queue.abandonedCarts} />
        </div>
      )}
      {activeTab === 'queue' && !queue && (
        <div className="text-center py-12 text-slate-400">
          <Activity size={36} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('admin_queue_unavailable')}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function QueueCard({ title, data }: { title: string; data: any }) {
  if (!data) return null;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Waiting', value: data.waiting, icon: Clock, color: 'text-amber-500' },
          { label: 'Active', value: data.active, icon: Activity, color: 'text-indigo-500' },
          { label: 'Completed', value: data.completed, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Failed', value: data.failed, icon: XCircle, color: 'text-red-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <item.icon size={14} className={item.color} />
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
