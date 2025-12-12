import { useState, useEffect, useCallback } from 'react';
import { businessInfoApi } from '../api/business-info.api';
import type { BusinessInfo } from '../api/business-info.api';
import { useAuth } from '../contexts/AuthContext';

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
  const { isAuthenticated } = useAuth();
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    // Cargar desde localStorage como fallback inicial
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadBusinessInfoFromBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const backendInfo = await businessInfoApi.get();
      if (backendInfo) {
        // Si hay información en el backend, usarla y actualizar localStorage
        setBusinessInfo(backendInfo);
        localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(backendInfo));
      } else {
        // Si no hay información en el backend pero hay en localStorage, sincronizar
        const localInfo = localStorage.getItem(BUSINESS_INFO_STORAGE_KEY);
        if (localInfo) {
          try {
            const parsed = JSON.parse(localInfo);
            // Solo sincronizar si no es la información por defecto
            if (parsed.name !== defaultBusinessInfo.name || parsed.nit !== defaultBusinessInfo.nit) {
              await businessInfoApi.update(parsed);
            }
          } catch {
            // Ignorar errores de parseo
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar información del negocio desde el backend:', error);
      // En caso de error, usar información local
    } finally {
      setIsLoading(false);
    }
    // isAuthenticated se usa dentro pero no necesita estar en las dependencias
    // porque solo queremos ejecutar esto una vez al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar con el backend cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadBusinessInfoFromBackend();
    }
  }, [isAuthenticated, loadBusinessInfoFromBackend]);

  const updateBusinessInfo = async (info: Partial<BusinessInfo>) => {
    const updated = { ...businessInfo, ...info };
    setBusinessInfo(updated);
    
    // Guardar en localStorage inmediatamente (para respuesta rápida)
    localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(updated));

    // Sincronizar con el backend si está autenticado
    if (isAuthenticated) {
      setIsSyncing(true);
      try {
        await businessInfoApi.update(updated);
      } catch (error) {
        console.error('Error al sincronizar información del negocio:', error);
        // El error no bloquea la actualización local
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const resetBusinessInfo = async () => {
    setBusinessInfo(defaultBusinessInfo);
    localStorage.setItem(BUSINESS_INFO_STORAGE_KEY, JSON.stringify(defaultBusinessInfo));
    
    // Sincronizar con el backend si está autenticado
    if (isAuthenticated) {
      setIsSyncing(true);
      try {
        await businessInfoApi.update(defaultBusinessInfo);
      } catch (error) {
        console.error('Error al resetear información del negocio:', error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  return {
    businessInfo,
    updateBusinessInfo,
    resetBusinessInfo,
    isLoading,
    isSyncing,
  };
};

