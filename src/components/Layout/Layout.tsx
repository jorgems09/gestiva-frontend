import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Drawer from '../common/Drawer';
import { brandingConfig } from '../../config/branding';
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
  { path: '/movements', label: 'Movimientos', icon: 'shopping_cart', mobilePriority: true },
  { path: '/products', label: 'Productos', icon: 'inventory_2', mobilePriority: true },
  { path: '/clients', label: 'Clientes', icon: 'people', mobilePriority: true },
  { path: '/reports', label: 'Reportes', icon: 'assessment', mobilePriority: false },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const SidebarContent = () => (
    <>
      <div className="sidebar-header">
        <div className="sidebar-branding">
          {/* Logo de la empresa - espacio reservado */}
          <div className="company-logo-container">
            <img 
              src={brandingConfig.logoPath} 
              alt={brandingConfig.logoAlt} 
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
            {brandingConfig.companyName && (
              <h2 className="company-name">{brandingConfig.companyName}</h2>
            )}
            <h1 className="app-name">{brandingConfig.appName}</h1>
            {brandingConfig.appSubtitle && (
              <span className="app-subtitle">{brandingConfig.appSubtitle}</span>
            )}
          </div>
        </div>
      </div>
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
    </>
  );

  return (
    <div className="layout">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <nav className="sidebar">
          <SidebarContent />
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
                    src={brandingConfig.logoPath} 
                    alt={brandingConfig.logoAlt} 
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
                  {brandingConfig.companyName && (
                    <div className="company-name-small">{brandingConfig.companyName}</div>
                  )}
                  <h2 className="app-name">{brandingConfig.appName}</h2>
                  {brandingConfig.appSubtitle && (
                    <span className="app-subtitle">{brandingConfig.appSubtitle}</span>
                  )}
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

