import { useState, useEffect } from 'react';
import client from '../api/client';
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

interface Store {
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
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'stores' | 'queue'>('overview');

  const adminClient = {
    get: (url: string) => client.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    post: (url: string, data?: any) => client.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await client.post('/auth/admin/login', { email, password });
      const tok = res.data?.accessToken || res.data;
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

  // Always require explicit admin login (no auto-restore from localStorage)
  // This ensures admin access is deliberate

  useEffect(() => { if (logged) fetchData(); }, [logged]);

  if (!logged) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in-up">
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-8 border border-blue-100/60 dark:border-white/5 shadow-sm shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield size={24} className="text-red-600" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{t('admin_login_title')}</h1>
            <p className="text-sm text-gray-500 mt-2">{t('admin_login_desc')}</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl input-premium outline-none text-gray-900 dark:text-white" />
            <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield size={28} className="text-red-500" />
            {t('admin_dashboard')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('admin_subtitle')}</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('admin_refresh')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-kz-blue text-white shadow-md'
                : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-blue-100/60 dark:border-white/5 shadow-sm'
            }`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label={t('admin_total_merchants')} value={merchants.length} color="blue" />
          <StatCard icon={Store} label={t('admin_total_stores')} value={stores.length} color="green" />
          <StatCard icon={Mail} label={t('admin_email_queue')} value={queue ? queue.emails?.waiting || 0 : '—'} color="purple" />
          <StatCard icon={ShoppingCart} label={t('admin_cart_queue')} value={queue ? queue.abandonedCarts?.waiting || 0 : '—'} color="amber" />
        </div>
      )}

      {/* Merchants Tab */}
      {activeTab === 'merchants' && (
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl border border-blue-100/60 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Business</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400">Verified</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map(m => (
                  <tr key={m.id} className="border-t border-blue-100/60 dark:border-white/5 shadow-sm">
                    <td className="px-4 py-3 font-mono text-gray-400">#{m.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.email}</td>
                    <td className="px-4 py-3 text-gray-500">{m.businessName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${m.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.emailVerified ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {merchants.length === 0 && <p className="text-center py-8 text-gray-400">{t('admin_no_data')}</p>}
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <div className="grid gap-4">
          {stores.map(s => (
            <div key={s.id} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-kz-blue to-kz-gold rounded-xl flex items-center justify-center text-white font-bold">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                  <p className="text-sm text-gray-400">{s.subdomain} · {s.plan} plan</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                  {s.status}
                </span>
                {s.isLive ? <CheckCircle size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-yellow-500" />}
              </div>
            </div>
          ))}
          {stores.length === 0 && <p className="text-center py-8 text-gray-400">{t('admin_no_data')}</p>}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && queue && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QueueCard title="📧 Email Queue" data={queue.emails} />
          <QueueCard title="🛒 Abandoned Cart Queue" data={queue.abandonedCarts} />
        </div>
      )}
      {activeTab === 'queue' && !queue && (
        <div className="text-center py-12 text-gray-400">
          <Activity size={40} className="mx-auto mb-3 opacity-50" />
          <p>{t('admin_queue_unavailable')}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    amber: 'from-amber-500 to-amber-600',
  };
  return (
    <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm">
      <div className={`w-10 h-10 bg-gradient-to-br ${colorMap[color]} rounded-xl flex items-center justify-center text-white mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function QueueCard({ title, data }: { title: string; data: any }) {
  if (!data) return null;
  return (
    <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-blue-100/60 dark:border-white/5 shadow-sm">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Waiting', value: data.waiting, icon: Clock, color: 'text-yellow-500' },
          { label: 'Active', value: data.active, icon: Activity, color: 'text-blue-500' },
          { label: 'Completed', value: data.completed, icon: CheckCircle, color: 'text-green-500' },
          { label: 'Failed', value: data.failed, icon: XCircle, color: 'text-red-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3">
            <item.icon size={16} className={item.color} />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
