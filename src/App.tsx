import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout/Layout';
import DashboardNew from './pages/Dashboard/DashboardNew';
import ClientsNew from './pages/Clients/ClientsNew';
import Suppliers from './pages/Suppliers/Suppliers';
import Products from './pages/Products/Products';
import Movements from './pages/Movements/Movements';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const { currentTheme, applyTheme } = useTheme();

  // Aplicar tema guardado al cargar la aplicación
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
