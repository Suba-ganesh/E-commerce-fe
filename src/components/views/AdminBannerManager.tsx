import React, { useState, useEffect } from 'react';
import { campaignService, type PromotionSetting, type NewsletterSubscriber } from '../../services/campaignService';
import { useToast } from '../../context/ToastContext';

export const AdminBannerManager: React.FC = () => {
  const toast = useToast();
  const [promotions, setPromotions] = useState<PromotionSetting[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>('food_offer');
  const [activeTab, setActiveTab] = useState<'banners' | 'subscribers' | 'counters'>('banners');

  // Counters State
  const [counterValues, setCounterValues] = useState<Record<string, { value: string; label: string }>>({});

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    promo_code: '',
    discount_percent: 0,
    target_date: '',
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [promRes, subRes, countRes] = await Promise.all([
        campaignService.getPromotions(),
        campaignService.getSubscribers(),
        campaignService.getCounters(),
      ]);

      if (promRes.success) {
        setPromotions(promRes.data);
        // Set initial form state for the selectedKey
        const selected = promRes.data.find(p => p.key === selectedKey);
        if (selected) {
          updateFormFields(selected);
        }
      }
      if (subRes.success) {
        setSubscribers(subRes.data);
      }
      if (countRes.success) {
        setCounters(countRes.data);
        const mapped: Record<string, { value: string; label: string }> = {};
        countRes.data.forEach((c: any) => {
          mapped[c.key] = { value: c.value, label: c.label };
        });
        setCounterValues(mapped);
      }
    } catch (err) {
      console.error('Failed to load campaigns data:', err);
      toast.error('Failed to load campaigns and newsletter data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateFormFields = (item: PromotionSetting) => {
    setForm({
      title: item.title || '',
      description: item.description || '',
      image_url: item.image_url || '',
      promo_code: item.promo_code || '',
      discount_percent: item.discount_percent || 0,
      target_date: item.target_date ? new Date(item.target_date).toISOString().slice(0, 16) : '',
      is_active: item.is_active,
    });
  };

  useEffect(() => {
    const selected = promotions.find(p => p.key === selectedKey);
    if (selected) {
      updateFormFields(selected);
    }
  }, [selectedKey, promotions]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedDate = form.target_date ? new Date(form.target_date).toISOString() : '';
      
      const formData = new FormData();
      formData.append('key', selectedKey);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('promo_code', form.promo_code);
      formData.append('discount_percent', String(form.discount_percent));
      formData.append('is_active', String(form.is_active));
      
      if (formattedDate) {
        formData.append('target_date', formattedDate);
      }

      const imgFile = (form as any).imageFile;
      if (imgFile) {
        formData.append('image', imgFile);
      } else {
        // Keep existing URL if file is not changed
        formData.append('image_url', form.image_url);
      }

      const res = await campaignService.updatePromotions(formData);

      if (res.success) {
        toast.success('Campaign settings saved successfully!');
        // Reload list to update states
        const promoRes = await campaignService.getPromotions();
        if (promoRes.success) {
          setPromotions(promoRes.data);
        }
      }
    } catch (err) {
      console.error('Error updating banner:', err);
      toast.error('Failed to save campaign settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-g3">
        <h3 className="text-xl font-bold">Loading Campaign Data...</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left animate-fade-in">
      <div className="flex justify-between items-center border-b border-border-design pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-[28px] font-black text-g3 leading-none m-0">Campaigns & Marketing</h2>
          <p className="text-gray-500 text-[13.5px] mt-1.5 font-semibold">Customize homepage banners, promo timers, and view subscriber registrations.</p>
        </div>
        <div className="flex bg-off p-1.5 rounded-xl border border-border-design">
          <button
            onClick={() => setActiveTab('banners')}
            className={`border-none rounded-lg py-2 px-4 text-[13px] font-bold cursor-pointer transition-all ${
              activeTab === 'banners' ? 'bg-white text-g1 shadow-sm' : 'bg-transparent text-muted'
            }`}
          >
            Customize Banners & Timers
          </button>
          <button
            onClick={() => setActiveTab('counters')}
            className={`border-none rounded-lg py-2 px-4 text-[13px] font-bold cursor-pointer transition-all ${
              activeTab === 'counters' ? 'bg-white text-g1 shadow-sm' : 'bg-transparent text-muted'
            }`}
          >
            Live Counters
          </button>
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`border-none rounded-lg py-2 px-4 text-[13px] font-bold cursor-pointer transition-all ${
              activeTab === 'subscribers' ? 'bg-white text-g1 shadow-sm' : 'bg-transparent text-muted'
            }`}
          >
            Newsletter Subscribers ({subscribers.length})
          </button>
        </div>
      </div>

      {activeTab === 'banners' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Selector Column */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <h4 className="text-[13px] font-bold text-g3 uppercase tracking-wider mb-1">Select Campaign Asset</h4>
            {[
              { key: 'food_offer', name: 'Food Banner Promo', desc: 'Get 25% Off Organic Food banner card' },
              { key: 'cosmetics_offer', name: 'Cosmetics Banner Promo', desc: 'Buy 2 Get 1 Free Cosmetics banner card' },
              { key: 'flash_sale', name: 'Flash Sale Timer Bar', desc: 'Lightning countdown ticker footer banner' }
            ].map(campaign => (
              <button
                key={campaign.key}
                onClick={() => setSelectedKey(campaign.key)}
                className={`w-full text-left p-4 border rounded-2xl cursor-pointer transition-all ${
                  selectedKey === campaign.key
                    ? 'bg-emerald-50 border-g1 shadow-[0_4px_12px_rgba(0,143,68,0.06)]'
                    : 'bg-white border-border-design hover:bg-gray-50'
                }`}
              >
                <div className="font-extrabold text-[14px] text-g3 flex items-center justify-between">
                  {campaign.name}
                  {promotions.find(p => p.key === campaign.key)?.is_active && (
                    <span className="w-2.5 h-2.5 rounded-full bg-g1"></span>
                  )}
                </div>
                <div className="text-[12px] text-muted mt-1 leading-snug">{campaign.desc}</div>
              </button>
            ))}
          </div>

          {/* Configuration Form Panel */}
          <div className="lg:col-span-2 bg-white border border-border-design rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <h3 className="font-black text-[18px] text-g3 border-b border-border-design pb-3 mb-1 uppercase tracking-wide">
              Configure {selectedKey.replace('_', ' ')} Settings
            </h3>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-g3 uppercase tracking-wide">Campaign Heading / Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="px-4 py-3 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-g3 uppercase tracking-wide">Subtext / Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="px-4 py-3 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1 resize-none"
                />
              </div>

              {selectedKey !== 'flash_sale' && (
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-g3 uppercase tracking-wide">Background Cover Image</label>
                  {form.image_url && (
                    <div className="w-full max-w-[280px] h-32 rounded-xl overflow-hidden border border-border-design bg-off mb-2">
                      <img
                        src={
                          form.image_url.startsWith('http')
                            ? form.image_url
                            : `${(import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '')}${form.image_url}`
                        }
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="banner-image-upload"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Temporarily show preview using URL.createObjectURL or state
                          const localUrl = URL.createObjectURL(file);
                          setForm({ ...form, image_url: localUrl });
                          // Attach actual file to custom form field
                          (form as any).imageFile = file;
                        }
                      }}
                    />
                    <label
                      htmlFor="banner-image-upload"
                      className="px-4 py-2 bg-off hover:bg-gray-200 border border-border-design rounded-xl text-[13px] font-bold cursor-pointer transition text-g3"
                    >
                      <i className="fa-solid fa-cloud-arrow-up mr-1.5"></i> Select Cover Image
                    </label>
                    {form.image_url && (
                      <span className="text-[12px] text-muted font-semibold truncate max-w-[200px]">
                        Image Selected
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-g3 uppercase tracking-wide">Promotion Code</label>
                  <input
                    type="text"
                    value={form.promo_code}
                    onChange={e => setForm({...form, promo_code: e.target.value.toUpperCase()})}
                    placeholder="e.g. CHENNI15"
                    className="px-4 py-3 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-g3 uppercase tracking-wide">Voucher Discount Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount_percent}
                    onChange={e => setForm({...form, discount_percent: parseInt(e.target.value, 10) || 0})}
                    className="px-4 py-3 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1"
                  />
                </div>
              </div>

              {selectedKey === 'flash_sale' && (
                <div className="flex flex-col gap-2 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
                  <label className="text-[12px] font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <i className="fa-solid fa-clock text-amber-700"></i> Timer Target Countdown Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.target_date}
                    onChange={e => setForm({...form, target_date: e.target.value})}
                    className="px-4 py-3 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1 bg-white"
                  />
                  <span className="text-[11px] text-amber-800/80 font-medium">Specifies exactly when the ticking down ends. Setting this updates the homepage flash bar timer.</span>
                </div>
              )}

              <div className="flex items-center gap-3 mt-1.5">
                <input
                  type="checkbox"
                  id="campaign_active"
                  checked={form.is_active}
                  onChange={e => setForm({...form, is_active: e.target.checked})}
                  className="w-5 h-5 accent-g1 cursor-pointer"
                />
                <label htmlFor="campaign_active" className="text-[14px] font-bold text-g3 cursor-pointer">
                  Activate banner display on website homepage
                </label>
              </div>

              <button
                type="submit"
                className="mt-4 w-full py-4 bg-g1 hover:bg-g3 text-white border-none rounded-xl text-[15px] font-extrabold cursor-pointer transition shadow-[0_6px_20px_rgba(0,143,68,0.15)] uppercase tracking-wider"
              >
                Save &amp; Apply Configurations
              </button>
            </form>
          </div>
        </div>
      ) : activeTab === 'counters' ? (
        <div className="bg-white border border-border-design rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h3 className="font-black text-[18px] text-g3 border-b border-border-design pb-3 mb-1 uppercase tracking-wide">
              Homepage Live Counters
            </h3>
            <p className="text-[13px] text-muted font-medium mt-2">Modify the statistics counter numbers that appear in the highlight ribbon on the homepage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {counters.map(counter => (
              <div key={counter.key} className="border border-border-design rounded-xl p-5 bg-off/50 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border-design/60 pb-2">
                  <span className="font-extrabold text-[14px] text-g3 flex items-center gap-2">
                    <i className={`fa-solid ${counter.icon || 'fa-chart-simple'} text-g1`}></i>
                    {counter.label}
                  </span>
                  <span className="text-[10px] bg-white border border-border-design rounded-full px-2.5 py-0.5 font-bold text-muted uppercase">
                    key: {counter.key}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-g3 uppercase tracking-wider">Display Label</label>
                    <input
                      type="text"
                      value={counterValues[counter.key]?.label || ''}
                      onChange={e => setCounterValues({
                        ...counterValues,
                        [counter.key]: { ...counterValues[counter.key], label: e.target.value }
                      })}
                      className="px-4.5 py-2.5 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-g3 uppercase tracking-wider">Display Value (text/number)</label>
                    <input
                      type="text"
                      value={counterValues[counter.key]?.value || ''}
                      onChange={e => setCounterValues({
                        ...counterValues,
                        [counter.key]: { ...counterValues[counter.key], value: e.target.value }
                      })}
                      className="px-4.5 py-2.5 border border-border-design rounded-xl outline-none font-semibold text-gray-800 focus:border-g1 bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const cur = counterValues[counter.key];
                      const res = await campaignService.updateCounter(counter.key, cur.value, cur.label);
                      if (res.success) {
                        toast.success(`Counter "${counter.label}" updated successfully!`);
                        const updated = await campaignService.getCounters();
                        if (updated.success) setCounters(updated.data);
                      }
                    } catch (err) {
                      toast.error('Failed to update counter.');
                    }
                  }}
                  className="w-full py-2 bg-g1 hover:bg-g3 text-white border-none rounded-xl text-[12.5px] font-bold cursor-pointer transition shadow-sm"
                >
                  Save Counter
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-border-design rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="bg-off border-b border-border-design p-4 flex justify-between items-center">
            <h3 className="font-extrabold text-[15px] text-[#0B8F3A] uppercase tracking-wide m-0">Subscribed Accounts</h3>
            <span className="text-[12px] bg-white border border-border-design rounded-full px-3 py-1 font-bold text-g3">
              Total: {subscribers.length} Emails
            </span>
          </div>

          {subscribers.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-[13.5px] font-semibold">No registered newsletter subscribers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px] text-left">
                <thead>
                  <tr className="border-b border-border-design bg-off text-gray-700 font-semibold">
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Subscribed At</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-design">
                  {subscribers.map(sub => (
                    <tr key={sub.id} className="hover:bg-off">
                      <td className="p-4 font-bold text-gray-800">{sub.email}</td>
                      <td className="p-4 text-muted font-medium">{new Date(sub.created_at).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          sub.is_active ? 'bg-emerald-50 text-g1 border border-g1/10' : 'bg-red-50 text-red-600'
                        }`}>
                          {sub.is_active ? 'Active' : 'Unsubscribed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
