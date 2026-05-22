import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import { formatPrice } from '../types';
import {
  Store, Plus, Package, ShoppingCart, Settings, BarChart3,
  ExternalLink, RefreshCw, LogOut, ChevronRight, Globe, Zap,
} from 'lucide-react';

interface StoreData {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  isLive: boolean;
  currency: string;
  createdAt: string;
}

interface MerchantInfo {
  id: number;
  email: string;
  name: string;
  businessName?: string;
  status: string;
  emailVerified: boolean;
}

export function MerchantDashboardPage() {
  const { t } = useLang();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', subdomain: '', timezone: 'Asia/Almaty' });
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'stores' | 'create'>('stores');

  const token = localStorage.getItem('merchant_token');

  const api = useCallback(() => ({
    get: (url: string) => client.get(url, { headers: { Authorization: `Bearer ${token}` } }),
    post: (url: string, data?: any) => client.post(url, data, { headers: { Authorization: `Bearer ${token}` } }),
    patch: (url: string, data?: any) => client.patch(url, data, { headers: { Authorization: `Bearer ${token}` } }),
  }), [token]);

  useEffect(() => {
    const saved = localStorage.getItem('merchant_user');
    if (!token || !saved) {
      navigate('/merchant/login');
      return;
    }
    try { setMerchant(JSON.parse(saved)); } catch { /* ignore */ }
  }, [token, navigate]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api().get('/stores');
      const d = res.data?.data || res.data;
      const list = Array.isArray(d) ? d : (d?.data || []);
      setStores(list);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        addToast(t('merchant_session_expired'), 'error');
        localStorage.removeItem('merchant_token');
        localStorage.removeItem('merchant_user');
        navigate('/merchant/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, api, navigate, addToast, t]);

  useEffect(() => { if (token) fetchData(); }, [token, fetchData]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api().post('/stores', {
        name: createForm.name,
        subdomain: createForm.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        timezone: createForm.timezone,
      });
      addToast(t('merchant_store_created'), 'success');
      setShowCreate(false);
      setCreateForm({ name: '', subdomain: '', timezone: 'Asia/Almaty' });
      setActiveTab('stores');
      fetchData();
    } catch (err: any) {
      addToast(err?.response?.data?.message || t('merchant_store_error'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleStoreLive = async (store: StoreData) => {
    try {
      await api().patch(`/stores/${store.id}`, { isLive: !store.isLive });
      addToast(store.isLive ? t('merchant_store_offline') : t('merchant_store_online'), 'success');
      fetchData();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Error', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('merchant_token');
    localStorage.removeItem('merchant_user');
    navigate('/merchant/login');
  };

  if (!merchant) return null;

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    setup: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  const merchantStatusColor: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <Store size={28} className="text-kz-blue" />
            {t('merchant_dashboard')}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">{merchant.email}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${merchantStatusColor[merchant.status] || 'bg-gray-100 text-gray-600'}`}>
              {merchant.status}
            </span>
            {merchant.emailVerified && (
              <span className="text-xs text-green-500 font-medium">✓ {t('merchant_verified')}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {t('admin_refresh')}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition">
            <LogOut size={14} /> {t('nav_logout')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-kz-blue to-kz-blue-dark rounded-xl flex items-center justify-center text-white mb-3">
            <Store size={18} />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{stores.length}</p>
          <p className="text-sm text-gray-500">{t('merchant_my_stores')}</p>
        </div>
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white mb-3">
            <Zap size={18} />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{stores.filter(s => s.isLive).length}</p>
          <p className="text-sm text-gray-500">{t('merchant_live_stores')}</p>
        </div>
        <div className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white mb-3">
            <Globe size={18} />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{merchant.businessName || '—'}</p>
          <p className="text-sm text-gray-500">{t('merchant_business')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'stores'
              ? 'bg-kz-blue text-white shadow-md'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-blue-100/60 dark:border-white/5 shadow-sm'
          }`}>
          <Store size={16} /> {t('merchant_my_stores')}
        </button>
        <button onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'create'
              ? 'bg-kz-blue text-white shadow-md'
              : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-blue-100/60 dark:border-white/5 shadow-sm'
          }`}>
          <Plus size={16} /> {t('merchant_create_store')}
        </button>
      </div>

      {/* Stores List */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          {stores.map(s => (
            <div key={s.id} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-5 border border-blue-100/60 dark:border-white/5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-kz-blue to-kz-gold rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">{s.subdomain}.shopbuilder.kz</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${statusColor[s.status] || 'bg-gray-100 text-gray-600'}`}>
                        {s.status}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-lg">{s.plan}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStoreLive(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                      s.isLive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}>
                    {s.isLive ? '🟢 ' + t('merchant_live') : '⏸ ' + t('merchant_offline')}
                  </button>
                  <Link to={`/merchant/stores/${s.id}`}
                    className="px-4 py-2 bg-kz-blue/10 text-kz-blue rounded-xl text-sm font-medium hover:bg-kz-blue/20 transition flex items-center gap-1">
                    <Settings size={14} /> {t('merchant_manage')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {stores.length === 0 && !loading && (
            <div className="text-center py-16">
              <Store size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg font-medium">{t('merchant_no_stores')}</p>
              <button onClick={() => setActiveTab('create')}
                className="mt-4 px-6 py-2.5 bg-kz-blue text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2 mx-auto">
                <Plus size={16} /> {t('merchant_create_first_store')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Store Form */}
      {activeTab === 'create' && (
        <div className="max-w-lg">
          <form onSubmit={handleCreateStore} className="bg-white dark:bg-[#14141F]/80 rounded-2xl p-6 border border-blue-100/60 dark:border-white/5 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('merchant_store_name_label')}</label>
              <input type="text" placeholder={t('merchant_store_name_ph')} value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('merchant_store_subdomain_label')}</label>
              <div className="flex items-center">
                <input type="text" placeholder="my-store" value={createForm.subdomain} onChange={e => setCreateForm(p => ({ ...p, subdomain: e.target.value }))} required
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-l-xl outline-none text-gray-900 dark:text-white placeholder-gray-400 focus:border-kz-blue transition font-mono lowercase" />
                <span className="px-4 py-3 bg-gray-100 dark:bg-white/5 border border-l-0 border-gray-200 dark:border-white/10 rounded-r-xl text-gray-400 text-sm">
                  .shopbuilder.kz
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{t('merchant_subdomain_hint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('merchant_timezone_label')}</label>
              <select value={createForm.timezone} onChange={e => setCreateForm(p => ({ ...p, timezone: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none text-gray-900 dark:text-white">
                <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                <option value="Asia/Aqtobe">Asia/Aqtobe (UTC+5)</option>
                <option value="Asia/Qyzylorda">Asia/Qyzylorda (UTC+5)</option>
                <option value="Asia/Aqtau">Asia/Aqtau (UTC+5)</option>
              </select>
            </div>
            <button type="submit" disabled={creating}
              className="w-full bg-gradient-to-r from-kz-blue to-kz-blue-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? '...' : <><Plus size={16} /> {t('merchant_create_store_btn')}</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
