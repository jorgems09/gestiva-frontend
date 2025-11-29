import { useState } from 'react';

export interface BusinessInfo {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  logo?: string;
}

const BUSINESS_INFO_STORAGE_KEY = 'gestiva-business-info';

const defaultBusinessInfo: BusinessInfo = {
  name: 'TIENDA FEMENINA',
  nit: '123456789-0',
  address: 'Calle Principal #123',
  phone: '(57) 300 123 4567',
  email: '',
  website: '',
  logo: '',
};

export const useBusinessInfo = () => {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    const saved = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultBusinessInfo;
      }
    }
    return defaultBusinessInfo;
  });

  const updateBusinessInfo = (info: Partial<BusinessInfo>) => {
    const updated = { ...businessInfo, ...info };
    setBusinessInfo(updated);
    localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(updated));
  };

  const resetBusinessInfo = () => {
    setBusinessInfo(defaultBusinessInfo);
    localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(defaultBusinessInfo));
  };

  return {
    businessInfo,
    updateBusinessInfo,
    resetBusinessInfo,
  };
};

