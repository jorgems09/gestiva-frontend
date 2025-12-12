import apiClient from './client';

export interface BusinessInfo {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  logo?: string;
  sidebarName?: string;
  sidebarLogo?: string;
}

export interface BusinessInfoResponse {
  businessInfo: BusinessInfo | null;
}

export const businessInfoApi = {
  get: async (): Promise<BusinessInfo | null> => {
    try {
      const response = await apiClient.get<BusinessInfoResponse>('/auth/business-info');
      return response.data.businessInfo;
    } catch (error) {
      console.error('Error al obtener información del negocio:', error);
      return null;
    }
  },

  update: async (businessInfo: Partial<BusinessInfo>): Promise<BusinessInfo> => {
    const response = await apiClient.put<BusinessInfoResponse>('/auth/business-info', businessInfo);
    return response.data.businessInfo as BusinessInfo;
  },
};

