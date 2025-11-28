import { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import './Settings.css';

export default function Settings() {
  const { currentTheme, applyTheme, getAllThemes } = useTheme();
  const [activeTab, setActiveTab] = useState('appearance');

  const themes = getAllThemes();

  const handleThemeChange = (themeKey: string) => {
    applyTheme(themeKey);
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <div className="page-header-new">
        <div className="page-header-content">
          <h1>Configuración</h1>
          <p className="page-subtitle">Personaliza la apariencia y comportamiento de la aplicación</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Sidebar de navegación */}
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            <button
              className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <span className="material-symbols-outlined">palette</span>
              <span>Apariencia</span>
            </button>
            <button
              className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <span className="material-symbols-outlined">settings</span>
              <span>General</span>
            </button>
            <button
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span>Notificaciones</span>
            </button>
            <button
              className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <span className="material-symbols-outlined">info</span>
              <span>Acerca de</span>
            </button>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="settings-content">
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Tema de Color</h2>
                <p>Personaliza los colores de la interfaz según tus preferencias</p>
              </div>

              <div className="theme-grid">
                {themes.map((theme) => (
                  <div
                    key={theme.key}
                    className={`theme-card ${currentTheme === theme.key ? 'active' : ''}`}
                    onClick={() => handleThemeChange(theme.key)}
                  >
                    <div className="theme-card-preview">
                      <div 
                        className="theme-color-primary" 
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="theme-color-bg" 
                        style={{ backgroundColor: theme.colors.bg }}
                      />
                      <div 
                        className="theme-color-surface" 
                        style={{ backgroundColor: theme.colors.surface }}
                      />
                    </div>
                    <div className="theme-card-content">
                      <h3>{theme.name}</h3>
                      <p>{theme.description}</p>
                      {currentTheme === theme.key && (
                        <div className="theme-card-badge">
                          <span className="material-symbols-outlined">check_circle</span>
                          <span>Activo</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-info">
                <span className="material-symbols-outlined">info</span>
                <p>El tema seleccionado se aplicará inmediatamente y se guardará en tu navegador</p>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Configuración General</h2>
                <p>Opciones generales de la aplicación</p>
              </div>
              <div className="settings-placeholder">
                <span className="material-symbols-outlined">construction</span>
                <p>Próximamente: Idioma, formato de fecha, moneda, etc.</p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Notificaciones</h2>
                <p>Configura cómo y cuándo recibir notificaciones</p>
              </div>
              <div className="settings-placeholder">
                <span className="material-symbols-outlined">construction</span>
                <p>Próximamente: Preferencias de notificaciones</p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Acerca de Gestiva</h2>
                <p>Información sobre la aplicación</p>
              </div>
              <div className="about-content">
                <div className="about-logo">
                  <span className="material-symbols-outlined">store</span>
                  <h3>Gestiva</h3>
                </div>
                <div className="about-info">
                  <div className="about-item">
                    <strong>Versión:</strong>
                    <span>1.0.0</span>
                  </div>
                  <div className="about-item">
                    <strong>Última actualización:</strong>
                    <span>Noviembre 2025</span>
                  </div>
                  <div className="about-item">
                    <strong>Descripción:</strong>
                    <span>Sistema de gestión de inventario y ventas para tiendas de ropa femenina</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

