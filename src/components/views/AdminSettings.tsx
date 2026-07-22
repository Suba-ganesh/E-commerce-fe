import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

export const AdminSettings: React.FC = () => {
  const toast = useToast();
  
  // State for all settings
  const [storeName, setStoreName] = useState("Chenni's Marketplace");
  const [contactEmail, setContactEmail] = useState("support@chennis.com");
  const [contactPhone, setContactPhone] = useState("+60 3 1234 5678");
  const [businessAddress, setBusinessAddress] = useState("123 Green Valley Tech Park, 50000 Kuala Lumpur");
  
  const [defaultRole, setDefaultRole] = useState("Super Admin (Full Access)");
  const [require2FA, setRequire2FA] = useState(true);
  const [strictPassword, setStrictPassword] = useState(true);
  
  const [currency, setCurrency] = useState("MYR (RM)");
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState("GMT+8 (Kuala Lumpur)");
  const [taxConfig, setTaxConfig] = useState("Inclusive (6% SST)");
  
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifyOrder, setNotifyOrder] = useState(true);
  const [notifyStock, setNotifyStock] = useState(true);
  const [notifyReviews, setNotifyReviews] = useState(true);
  
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(5);
  
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chennis_admin_settings');
      if (saved) {
        const config = JSON.parse(saved);
        if (config.storeName !== undefined) setStoreName(config.storeName);
        if (config.contactEmail !== undefined) setContactEmail(config.contactEmail);
        if (config.contactPhone !== undefined) setContactPhone(config.contactPhone);
        if (config.businessAddress !== undefined) setBusinessAddress(config.businessAddress);
        if (config.defaultRole !== undefined) setDefaultRole(config.defaultRole);
        if (config.require2FA !== undefined) setRequire2FA(config.require2FA);
        if (config.strictPassword !== undefined) setStrictPassword(config.strictPassword);
        if (config.currency !== undefined) setCurrency(config.currency);
        if (config.language !== undefined) setLanguage(config.language);
        if (config.timezone !== undefined) setTimezone(config.timezone);
        if (config.taxConfig !== undefined) setTaxConfig(config.taxConfig);
        if (config.notifySystem !== undefined) setNotifySystem(config.notifySystem);
        if (config.notifyOrder !== undefined) setNotifyOrder(config.notifyOrder);
        if (config.notifyStock !== undefined) setNotifyStock(config.notifyStock);
        if (config.notifyReviews !== undefined) setNotifyReviews(config.notifyReviews);
        if (config.sessionTimeout !== undefined) setSessionTimeout(config.sessionTimeout);
        if (config.maxAttempts !== undefined) setMaxAttempts(config.maxAttempts);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  }, []);

  // Save changes to localStorage
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API delay for a premium feel
    setTimeout(() => {
      try {
        const config = {
          storeName,
          contactEmail,
          contactPhone,
          businessAddress,
          defaultRole,
          require2FA,
          strictPassword,
          currency,
          language,
          timezone,
          taxConfig,
          notifySystem,
          notifyOrder,
          notifyStock,
          notifyReviews,
          sessionTimeout,
          maxAttempts
        };
        localStorage.setItem('chennis_admin_settings', JSON.stringify(config));
        
        // Dispatch sync event for other components if needed
        window.dispatchEvent(new Event('chennis:settings_updated'));
        
        toast.success("Settings saved successfully!");
      } catch (e) {
        console.error("Failed to save settings", e);
        toast.error("Failed to save settings. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }, 800);
  };

  // Revert/Cancel changes
  const handleCancel = () => {
    try {
      const saved = localStorage.getItem('chennis_admin_settings');
      if (saved) {
        const config = JSON.parse(saved);
        setStoreName(config.storeName || "Chenni's Marketplace");
        setContactEmail(config.contactEmail || "support@chennis.com");
        setContactPhone(config.contactPhone || "+60 3 1234 5678");
        setBusinessAddress(config.businessAddress || "123 Green Valley Tech Park, 50000 Kuala Lumpur");
        setDefaultRole(config.defaultRole || "Super Admin (Full Access)");
        setRequire2FA(config.require2FA ?? true);
        setStrictPassword(config.strictPassword ?? true);
        setCurrency(config.currency || "MYR (RM)");
        setLanguage(config.language || "English (US)");
        setTimezone(config.timezone || "GMT+8 (Kuala Lumpur)");
        setTaxConfig(config.taxConfig || "Inclusive (6% SST)");
        setNotifySystem(config.notifySystem ?? true);
        setNotifyOrder(config.notifyOrder ?? true);
        setNotifyStock(config.notifyStock ?? true);
        setNotifyReviews(config.notifyReviews ?? true);
        setSessionTimeout(config.sessionTimeout ?? 30);
        setMaxAttempts(config.maxAttempts ?? 5);
      }
      toast.info("Changes discarded.");
    } catch (e) {
      toast.error("Failed to revert settings.");
    }
  };

  const handleForcePasswordChange = () => {
    toast.warning("Force Password Change request triggered. All administrator accounts will be prompted on next login.");
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[28px] font-extrabold text-g3 m-0">Settings</h2>
        <div className="flex gap-3">
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="px-5 py-2.5 bg-white border border-border-design rounded-lg font-semibold text-g3 cursor-pointer hover:bg-off transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-g1 border-none text-white rounded-lg font-bold cursor-pointer hover:bg-g3 transition shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* General Settings */}
          <div className="bg-white border border-border-design rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-extrabold text-g3 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-store text-muted"></i> General Settings
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Store Name</label>
                <input 
                  type="text" 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 focus:border-g1" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Contact Email</label>
                  <input 
                    type="email" 
                    value={contactEmail} 
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 focus:border-g1" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Contact Phone</label>
                  <input 
                    type="text" 
                    value={contactPhone} 
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 focus:border-g1" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Business Address</label>
                <input 
                  type="text" 
                  value={businessAddress} 
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 focus:border-g1" 
                />
              </div>
            </div>
          </div>

          {/* User & Access Management */}
          <div className="bg-white border border-border-design rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-extrabold text-g3 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-users-gear text-muted"></i> User & Access Management
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Role Permissions</label>
                <select 
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 cursor-pointer bg-white"
                >
                  <option>Super Admin (Full Access)</option>
                  <option>Manager (Limited Access)</option>
                  <option>Support (View Only)</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer text-[14px] font-semibold text-txt mt-2">
                <input 
                  type="checkbox" 
                  checked={require2FA} 
                  onChange={(e) => setRequire2FA(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-g1" 
                />
                Require Two-Factor Authentication (2FA) for Admins
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-[14px] font-semibold text-txt">
                <input 
                  type="checkbox" 
                  checked={strictPassword} 
                  onChange={(e) => setStrictPassword(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-g1" 
                />
                Enforce Strict Password Policy
              </label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* System Preferences */}
          <div className="bg-white border border-border-design rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-extrabold text-g3 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-sliders text-muted"></i> System Preferences
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 cursor-pointer bg-white"
                >
                  <option>MYR (RM)</option>
                  <option>USD ($)</option>
                  <option>SGD (S$)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 cursor-pointer bg-white"
                >
                  <option>English (US)</option>
                  <option>Bahasa Melayu</option>
                  <option>Mandarin</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Timezone</label>
                <select 
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 cursor-pointer bg-white"
                >
                  <option>GMT+8 (Kuala Lumpur)</option>
                  <option>GMT+8 (Singapore)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Tax Configuration</label>
                <select 
                  value={taxConfig}
                  onChange={(e) => setTaxConfig(e.target.value)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 cursor-pointer bg-white"
                >
                  <option>Inclusive (6% SST)</option>
                  <option>Exclusive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white border border-border-design rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-extrabold text-g3 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-bell text-muted"></i> Notification Settings
            </h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer text-[14px] font-semibold text-txt">
                <input 
                  type="checkbox" 
                  checked={notifySystem} 
                  onChange={(e) => setNotifySystem(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-g1" 
                />
                Email Notifications for System Events
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-[14px] font-semibold text-txt">
                <input 
                  type="checkbox" 
                  checked={notifyOrder} 
                  onChange={(e) => setNotifyOrder(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-g1" 
                />
                New Order Alerts (Push & Email)
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-[14px] font-semibold text-txt">
                <input 
                  type="checkbox" 
                  checked={notifyStock} 
                  onChange={(e) => setNotifyStock(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-g1" 
                />
                Low Inventory & Out-of-Stock Alerts
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-[14px] font-semibold text-txt">
                <input 
                  type="checkbox" 
                  checked={notifyReviews} 
                  onChange={(e) => setNotifyReviews(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-g1" 
                />
                Require Review Moderation Alerts
              </label>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white border border-border-design rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-extrabold text-g3 mb-5 flex items-center gap-2">
              <i className="fa-solid fa-shield-halved text-muted"></i> Security Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Session Timeout (Minutes)</label>
                <input 
                  type="number" 
                  value={sessionTimeout} 
                  onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 0)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 focus:border-g1" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-g3 uppercase tracking-wide">Max Login Attempts</label>
                <input 
                  type="number" 
                  value={maxAttempts} 
                  onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 0)}
                  className="px-4 py-3 border border-border-design rounded-lg outline-none font-semibold text-gray-800 focus:border-g1" 
                />
              </div>
            </div>
            <button 
              onClick={handleForcePasswordChange}
              className="w-full py-3 bg-off border border-border-design rounded-lg font-bold text-g3 cursor-pointer flex justify-center items-center gap-2 hover:bg-gray-100 transition mt-2"
            >
              <i className="fa-solid fa-key"></i> Force Password Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
