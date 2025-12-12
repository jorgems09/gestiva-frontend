import { useEffect, useState, useCallback } from 'react';
import { themes, defaultTheme, type Theme } from '../config/themes';

const THEME_STORAGE_KEY = 'gestiva-theme';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
  });

  const applyTheme = useCallback((themeKey: string) => {
    const theme = themes[themeKey];
    if (!theme) {
      console.warn(`Theme "${themeKey}" not found, using default`);
      return;
    }

    // Aplicar cada color como variable CSS
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convertir camelCase a kebab-case para CSS
      const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      document.documentElement.style.setProperty(`--color-${cssVarName}`, value);
    });

    // Función para convertir hex a rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Crear variables con transparencia para el color primary
    const primaryHex = theme.colors.primary;
    document.documentElement.style.setProperty('--color-primary-alpha-10', hexToRgba(primaryHex, 0.1));
    document.documentElement.style.setProperty('--color-primary-alpha-20', hexToRgba(primaryHex, 0.2));
    document.documentElement.style.setProperty('--color-primary-alpha-30', hexToRgba(primaryHex, 0.3));
    document.documentElement.style.setProperty('--color-primary-alpha-50', hexToRgba(primaryHex, 0.5));
    document.documentElement.style.setProperty('--color-primary-alpha-90', hexToRgba(primaryHex, 0.9));

    // Guardar en localStorage
    localStorage.setItem(THEME_STORAGE_KEY, themeKey);
    setCurrentTheme(themeKey);
  }, []);

  // Aplicar tema al montar componente
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || defaultTheme;
    applyTheme(savedTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const getTheme = (): Theme | undefined => {
    return themes[currentTheme];
  };

  const getAllThemes = () => {
    return Object.entries(themes).map(([key, theme]) => ({
      key,
      ...theme,
    }));
  };

  return {
    currentTheme,
    applyTheme,
    getTheme,
    getAllThemes,
    themes,
  };
};

