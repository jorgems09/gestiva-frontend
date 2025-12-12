import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BusinessInfoProvider } from './contexts/BusinessInfoContext';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import DashboardNew from './pages/Dashboard/DashboardNew';
import ClientsNew from './pages/Clients/ClientsNew';
import Suppliers from './pages/Suppliers/Suppliers';
import Products from './pages/Products/Products';
import Movements from './pages/Movements/Movements';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import { Login } from './pages/Login/Login';
import { useTheme } from './hooks/useTheme';
import './App.css';

function AppContent() {
  const { currentTheme, applyTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  // Aplicar tema guardado al cargar la aplicación
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardNew />} />
          <Route path="/clients" element={<ClientsNew />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <BusinessInfoProvider>
        <AppContent />
      </BusinessInfoProvider>
    </AuthProvider>
  );
}

export default App;
