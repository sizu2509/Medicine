import React, { createContext, useContext, useState, useEffect } from 'react';
import { PharmacySettings } from '../types';
import { db, subscribeToDB } from '../services/db';

interface SettingsContextType {
  settings: PharmacySettings;
  updateSettings: (newSettings: Partial<PharmacySettings>) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateStr: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PharmacySettings>(() => db.getSettings());

  useEffect(() => {
    const unsubscribe = subscribeToDB(() => {
      setSettings(db.getSettings());
    });
    return unsubscribe;
  }, []);

  const updateSettings = (newSettings: Partial<PharmacySettings>) => {
    const updated = db.updateSettings(newSettings);
    setSettings(updated);
  };

  const formatCurrency = (amount: number): string => {
    const safeAmount = isNaN(amount) ? 0 : amount;
    const formatted = safeAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${settings.currency_symbol}${formatted}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      if (settings.date_format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
      }
      return `${year}-${month}-${day}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
