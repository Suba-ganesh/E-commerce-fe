import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: string;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('chennis_admin_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.language && translations[parsed.language]) {
          return parsed.language;
        }
      }
    } catch (e) {
      console.error("Failed to parse saved settings language", e);
    }
    return 'English (US)';
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const saved = localStorage.getItem('chennis_admin_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.language && translations[parsed.language]) {
            setLanguage(parsed.language);
          }
        }
      } catch (e) {
        console.error("Failed to update language from settings event", e);
      }
    };

    window.addEventListener('chennis:settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('chennis:settings_updated', handleSettingsUpdate);
  }, []);

  const t = (key: string): string => {
    const langDict = translations[language] || translations['English (US)'];
    return langDict[key] || translations['English (US)'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
