import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useLang } from '../hooks/useLang';
import { useToast } from '../components/Toast';
import {
  Store, Plus, Settings, RefreshCw, LogOut, Globe, Zap,
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
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    setup: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    suspended: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  const merchantStatusColor: Record<string, string> = {
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    rejected: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    suspended: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Store size={24} className="text-indigo-600 dark:text-indigo-400" />
            {t('merchant_dashboard')}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-500 dark:text-slate-400 text-sm">{merchant.email}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${merchantStatusColor[merchant.status] || 'bg-slate-100 text-slate-600'}`}>
              {merchant.status}
            </span>
            {merchant.emailVerified && (
              <span className="text-xs text-emerald-600 font-medium">Verified</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {t('admin_refresh')}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <LogOut size={13} /> {t('nav_logout')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center">
              <Store size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('merchant_my_stores')}</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stores.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('merchant_live_stores')}</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stores.filter(s => s.isLive).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-violet-50 dark:bg-violet-950/30 rounded-lg flex items-center justify-center">
              <Globe size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('merchant_business')}</p>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{merchant.businessName || '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'stores'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          <Store size={14} /> {t('merchant_my_stores')}
        </button>
        <button onClick={() => setActiveTab('create')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}>
          <Plus size={14} /> {t('merchant_create_store')}
        </button>
      </div>

      {/* Stores List */}
      {activeTab === 'stores' && (
        <div className="space-y-3">
          {stores.map(s => (
            <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{s.subdomain}.shopbuilder.kz</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${statusColor[s.status] || 'bg-slate-100 text-slate-600'}`}>
                        {s.status}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{s.plan}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleStoreLive(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      s.isLive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}>
                    {s.isLive ? t('merchant_live') : t('merchant_offline')}
                  </button>
                  <Link to={`/merchant/stores/${s.id}`}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-1">
                    <Settings size={13} /> {t('merchant_manage')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {stores.length === 0 && !loading && (
            <div className="text-center py-16">
              <Store size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-400 text-sm font-medium">{t('merchant_no_stores')}</p>
              <button onClick={() => setActiveTab('create')}
                className="mt-4 px-5 py-2 btn-primary rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto">
                <Plus size={14} /> {t('merchant_create_first_store')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Store Form */}
      {activeTab === 'create' && (
        <div className="max-w-lg">
          <form onSubmit={handleCreateStore} className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('merchant_store_name_label')}</label>
              <input type="text" placeholder={t('merchant_store_name_ph')} value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('merchant_store_subdomain_label')}</label>
              <div className="flex items-center">
                <input type="text" placeholder="my-store" value={createForm.subdomain} onChange={e => setCreateForm(p => ({ ...p, subdomain: e.target.value }))} required
                  className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l-lg outline-none input-focus text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono lowercase" />
                <span className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-300 dark:border-slate-700 rounded-r-lg text-slate-400 text-sm">
                  .shopbuilder.kz
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{t('merchant_subdomain_hint')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('merchant_timezone_label')}</label>
              <select value={createForm.timezone} onChange={e => setCreateForm(p => ({ ...p, timezone: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white text-sm">
                <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                <option value="Asia/Aqtobe">Asia/Aqtobe (UTC+5)</option>
                <option value="Asia/Qyzylorda">Asia/Qyzylorda (UTC+5)</option>
                <option value="Asia/Aqtau">Asia/Aqtau (UTC+5)</option>
              </select>
            </div>
            <button type="submit" disabled={creating}
              className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? '...' : <><Plus size={14} /> {t('merchant_create_store_btn')}</>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
