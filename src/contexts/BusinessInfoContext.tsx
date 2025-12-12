import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useBusinessInfo } from '../hooks/useBusinessInfo';
import type { BusinessInfo } from '../api/business-info.api';

interface BusinessInfoContextType {
  businessInfo: BusinessInfo;
  updateBusinessInfo: (info: Partial<BusinessInfo>) => Promise<void>;
  resetBusinessInfo: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
}

const BusinessInfoContext = createContext<BusinessInfoContextType | undefined>(undefined);

export const BusinessInfoProvider = ({ children }: { children: ReactNode }) => {
  const businessInfoData = useBusinessInfo();

  return (
    <BusinessInfoContext.Provider value={businessInfoData}>
      {children}
    </BusinessInfoContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBusinessInfoContext = () => {
  const context = useContext(BusinessInfoContext);
  if (context === undefined) {
    throw new Error('useBusinessInfoContext must be used within a BusinessInfoProvider');
  }
  return context;
};

