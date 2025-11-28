export interface Theme {
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    bg: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export const themes: Record<string, Theme> = {
  blue: {
    name: 'Azul Profesional',
    description: 'Tema por defecto - Moderno y profesional',
    colors: {
      primary: '#2b6cee',
      primaryDark: '#1e4fd8',
      primaryLight: '#4d7ef0',
      bg: '#f6f6f8',
      surface: '#ffffff',
      text: '#0d121b',
      textSecondary: '#4c669a',
      border: '#e5e7eb',
    },
  },
  green: {
    name: 'Verde Fresco',
    description: 'Inspirado en la naturaleza',
    colors: {
      primary: '#27AE60',
      primaryDark: '#1e8449',
      primaryLight: '#52c77a',
      bg: '#f6f6f8',
      surface: '#ffffff',
      text: '#0d121b',
      textSecondary: '#4c6658',
      border: '#e5e7eb',
    },
  },
  purple: {
    name: 'Morado Elegante',
    description: 'Moderno y sofisticado',
    colors: {
      primary: '#8e44ad',
      primaryDark: '#6c3483',
      primaryLight: '#a569bd',
      bg: '#f6f6f8',
      surface: '#ffffff',
      text: '#0d121b',
      textSecondary: '#5e4c66',
      border: '#e5e7eb',
    },
  },
  orange: {
    name: 'Naranja Energía',
    description: 'Vibrante y dinámico',
    colors: {
      primary: '#F39C12',
      primaryDark: '#D68910',
      primaryLight: '#f5b041',
      bg: '#f6f6f8',
      surface: '#ffffff',
      text: '#0d121b',
      textSecondary: '#6b5940',
      border: '#e5e7eb',
    },
  },
  dark: {
    name: 'Modo Oscuro',
    description: 'Reduce la fatiga visual',
    colors: {
      primary: '#4d7ef0',
      primaryDark: '#2b6cee',
      primaryLight: '#6b8ef2',
      bg: '#101622',
      surface: '#1a2332',
      text: '#ffffff',
      textSecondary: '#a0aec0',
      border: '#2d3748',
    },
  },
  rose: {
    name: 'Rosa Suave',
    description: 'Delicado y elegante',
    colors: {
      primary: '#E6C0C8',
      primaryDark: '#d4a8b2',
      primaryLight: '#f0d8de',
      bg: '#f6f6f8',
      surface: '#ffffff',
      text: '#0d121b',
      textSecondary: '#6b5459',
      border: '#e5e7eb',
    },
  },
};

export const defaultTheme = 'blue';

