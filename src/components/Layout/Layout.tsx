import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Drawer from '../common/Drawer';
import { brandingConfig } from '../../config/branding';
import { useBusinessInfoContext } from '../../contexts/BusinessInfoContext';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  mobilePriority?: boolean;
}

const menuItems: MenuItem[] = [
  { path: '/', label: 'Dashboard', icon: 'dashboard', mobilePriority: true },
  { path: '/movements', label: 'Movimientos', icon: 'receipt_long', mobilePriority: true },
  { path: '/products', label: 'Productos', icon: 'checkroom', mobilePriority: true },
  { path: '/clients', label: 'Clientes', icon: 'groups', mobilePriority: true },
  { path: '/suppliers', label: 'Proveedores', icon: 'group', mobilePriority: true },
  { path: '/reports', label: 'Reportes', icon: 'assessment', mobilePriority: false },
];

interface SidebarContentProps {
  isActive: (path: string) => boolean;
  isMobile: boolean;
  setDrawerOpen: (open: boolean) => void;
  location: { pathname: string };
  onLogout: () => void;
}

const SidebarContent = ({ isActive, isMobile, setDrawerOpen, location, onLogout }: SidebarContentProps) => {
  const { businessInfo } = useBusinessInfoContext();
  
  // Usar configuración personalizada del negocio o fallback a brandingConfig
  const sidebarName = businessInfo?.sidebarName || businessInfo?.name || brandingConfig.companyName || 'Tu Empresa';
  const sidebarLogo = businessInfo?.sidebarLogo || brandingConfig.logoPath || '/logo-empresa.svg';
  const appName = brandingConfig.appSubtitle || brandingConfig.appName || 'Gestiva';
  
  return (
    <>
      <div className="sidebar-header">
        <div className="sidebar-branding">
          {/* Logo de la empresa - espacio reservado */}
          <div className="company-logo-container">
            <img 
              src={sidebarLogo} 
              alt={`Logo de ${sidebarName}`} 
              className="company-logo"
              onError={(e) => {
                // Si no existe el logo, mostrar un placeholder elegante
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="company-logo-placeholder hidden">
              <span className="material-icons">store</span>
            </div>
          </div>
          {/* Nombre de la empresa y aplicación */}
          <div className="app-name-container">
            {sidebarName && (
              <h2 className="company-name">{sidebarName}</h2>
            )}
            <p className="app-name">{appName}</p>
          </div>
        </div>
      </div>
      <nav className="sidebar-menu-wrapper">
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={isActive(item.path) ? 'active' : ''}
                onClick={() => isMobile && setDrawerOpen(false)}
              >
                <span className="material-icons menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Botón Nuevo Movimiento en sidebar (solo en página de movimientos) */}
      {location.pathname === '/movements' && (
        <div className="sidebar-actions">
          <button
            className="sidebar-new-movement-btn"
            onClick={() => {
              // Esto se manejará desde el componente Movements
              window.dispatchEvent(new CustomEvent('open-movement-form'));
            }}
          >
            <span className="truncate">Nuevo Movimiento</span>
          </button>
        </div>
      )}
      {/* Links de Configuración, Ayuda y Logout */}
      <div className="sidebar-footer">
        <Link
          to="/settings"
          className="sidebar-footer-link"
          onClick={() => isMobile && setDrawerOpen(false)}
        >
          <span className="material-icons menu-icon">settings</span>
          <span className="menu-label">Configuración</span>
        </Link>
        <Link
          to="/help"
          className="sidebar-footer-link"
          onClick={() => isMobile && setDrawerOpen(false)}
        >
          <span className="material-icons menu-icon">help</span>
          <span className="menu-label">Ayuda</span>
        </Link>
        <button
          className="sidebar-footer-link logout-button"
          onClick={() => {
            onLogout();
            if (isMobile) setDrawerOpen(false);
          }}
        >
          <span className="material-icons menu-icon">logout</span>
          <span className="menu-label">Cerrar Sesión</span>
        </button>
      </div>
    </>
  );
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { businessInfo } = useBusinessInfoContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const mobileMenuItems = menuItems.filter((item) => item.mobilePriority);
  
  // Usar configuración personalizada del negocio o fallback a brandingConfig
  const sidebarName = businessInfo?.sidebarName || businessInfo?.name || brandingConfig.companyName || 'Tu Empresa';
  const sidebarLogo = businessInfo?.sidebarLogo || brandingConfig.logoPath || '/logo-empresa.svg';
  const appName = brandingConfig.appSubtitle || brandingConfig.appName || 'Gestiva';

  return (
    <div className="layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <nav className="sidebar">
          <SidebarContent 
            isActive={isActive}
            isMobile={isMobile}
            setDrawerOpen={setDrawerOpen}
            location={location}
            onLogout={handleLogout}
          />
        </nav>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          <button
            className="mobile-menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
          >
            <span className="material-icons">menu</span>
          </button>
          <Drawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title={
              <div className="drawer-branding">
                <div className="company-logo-container mobile">
                  <img 
                    src={sidebarLogo} 
                    alt={`Logo de ${sidebarName}`} 
                    className="company-logo"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="company-logo-placeholder hidden">
                    <span className="material-icons">store</span>
                  </div>
                </div>
                <div className="app-name-container mobile">
                  {sidebarName && (
                    <div className="company-name-small">{sidebarName}</div>
                  )}
                  <h2 className="app-name">{appName}</h2>
                </div>
              </div>
            }
          >
            <div className="drawer-menu">
              <ul className="sidebar-menu">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={isActive(item.path) ? 'active' : ''}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <span className="material-icons menu-icon">{item.icon}</span>
                      <span className="menu-label">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Drawer>
        </>
      )}

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      {isMobile && (
        <nav className="bottom-nav">
          {mobileMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${isActive(item.path) ? 'active' : ''}`}
              aria-label={item.label}
            >
              <span className="material-icons bottom-nav-icon">{item.icon}</span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

