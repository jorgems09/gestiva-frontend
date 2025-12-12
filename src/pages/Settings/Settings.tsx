import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useBusinessInfoContext } from '../../contexts/BusinessInfoContext';
import { useToast } from '../../hooks/useToast';
import './Settings.css';

export default function Settings() {
  const { currentTheme, applyTheme, getAllThemes } = useTheme();
  const { businessInfo, updateBusinessInfo } = useBusinessInfoContext();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('appearance');
  const [businessForm, setBusinessForm] = useState(businessInfo);

  const themes = getAllThemes();

  const handleThemeChange = (themeKey: string) => {
    applyTheme(themeKey);
  };

  const handleBusinessInfoChange = (field: keyof typeof businessInfo, value: string) => {
    setBusinessForm({ ...businessForm, [field]: value });
  };

  const handleSaveBusinessInfo = () => {
    updateBusinessInfo(businessForm);
    showToast('Datos del negocio guardados exitosamente', 'success');
  };

  // Sincronizar formulario cuando cambie la pestaña o los datos del negocio
  useEffect(() => {
    if (activeTab === 'business') {
      // Sincronizar formulario con datos del contexto cuando se activa la pestaña
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBusinessForm(businessInfo);
    }
  }, [activeTab, businessInfo]);

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
              className={`settings-nav-item ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              <span className="material-symbols-outlined">store</span>
              <span>Datos del Negocio</span>
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

          {activeTab === 'business' && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Datos del Negocio</h2>
                <p>Configura la información de tu negocio que aparecerá en las tirillas de impresión</p>
              </div>

              <div className="business-info-form">
                <div className="form-group">
                  <label htmlFor="business-name">Nombre del Negocio *</label>
                  <input
                    id="business-name"
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => handleBusinessInfoChange('name', e.target.value)}
                    placeholder="Ej: Tienda Femenina"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business-nit">NIT / Identificación *</label>
                  <input
                    id="business-nit"
                    type="text"
                    value={businessForm.nit}
                    onChange={(e) => handleBusinessInfoChange('nit', e.target.value)}
                    placeholder="Ej: 123456789-0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business-address">Dirección *</label>
                  <input
                    id="business-address"
                    type="text"
                    value={businessForm.address}
                    onChange={(e) => handleBusinessInfoChange('address', e.target.value)}
                    placeholder="Ej: Calle Principal #123"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business-phone">Teléfono *</label>
                  <input
                    id="business-phone"
                    type="text"
                    value={businessForm.phone}
                    onChange={(e) => handleBusinessInfoChange('phone', e.target.value)}
                    placeholder="Ej: (57) 300 123 4567"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business-email">Email (Opcional)</label>
                  <input
                    id="business-email"
                    type="email"
                    value={businessForm.email || ''}
                    onChange={(e) => handleBusinessInfoChange('email', e.target.value)}
                    placeholder="Ej: contacto@tienda.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business-website">Sitio Web (Opcional)</label>
                  <input
                    id="business-website"
                    type="url"
                    value={businessForm.website || ''}
                    onChange={(e) => handleBusinessInfoChange('website', e.target.value)}
                    placeholder="Ej: www.tienda.com"
                    className="form-input"
                  />
                </div>

                <div className="settings-divider"></div>
                <h3 className="settings-subsection-title">Personalización del Sidebar</h3>
                <p className="settings-subsection-description">Configura cómo aparece tu negocio en el menú lateral</p>

                <div className="form-group">
                  <label htmlFor="sidebar-name">Nombre en el Sidebar (Opcional)</label>
                  <textarea
                    id="sidebar-name"
                    value={businessForm.sidebarName || ''}
                    onChange={(e) => handleBusinessInfoChange('sidebarName', e.target.value)}
                    placeholder="Ej: Mi Tienda
Puedes usar Enter para saltos de línea"
                    className="form-input"
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '60px' }}
                  />
                  <small className="form-hint">Si no especificas, se usará el nombre del negocio. Puedes usar Enter para crear saltos de línea.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="sidebar-logo">Ruta del Logo del Sidebar (Opcional)</label>
                  <input
                    id="sidebar-logo"
                    type="text"
                    value={businessForm.sidebarLogo || ''}
                    onChange={(e) => handleBusinessInfoChange('sidebarLogo', e.target.value)}
                    placeholder="Ej: /logo-empresa.svg"
                    className="form-input"
                  />
                  <small className="form-hint">
                    Coloca tu logo en la carpeta /public y especifica la ruta (ej: /logo-empresa.svg, /logo-empresa.png)
                  </small>
                </div>

                <div className="form-actions">
                  <button className="btn btn-primary" onClick={handleSaveBusinessInfo}>
                    <span className="material-symbols-outlined">save</span>
                    Guardar Cambios
                  </button>
                </div>

                <div className="settings-info">
                  <span className="material-symbols-outlined">info</span>
                  <p>Esta información aparecerá en las tirillas de impresión de movimientos. Los campos marcados con * son obligatorios.</p>
                </div>
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

