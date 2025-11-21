import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Gestiva</h1>
        </div>
        <ul className="sidebar-menu">
          <li>
            <Link
              to="/"
              className={isActive('/') ? 'active' : ''}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/clients"
              className={isActive('/clients') ? 'active' : ''}
            >
              Clientes
            </Link>
          </li>
          <li>
            <Link
              to="/products"
              className={isActive('/products') ? 'active' : ''}
            >
              Productos
            </Link>
          </li>
          <li>
            <Link
              to="/movements"
              className={isActive('/movements') ? 'active' : ''}
            >
              Movimientos
            </Link>
          </li>
          <li>
            <Link
              to="/reports"
              className={isActive('/reports') ? 'active' : ''}
            >
              Reportes
            </Link>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

