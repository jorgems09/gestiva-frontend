import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardNew from './pages/Dashboard/DashboardNew';
import ClientsNew from './pages/Clients/ClientsNew';
import Suppliers from './pages/Suppliers/Suppliers';
import Products from './pages/Products/Products';
import Movements from './pages/Movements/Movements';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import './App.css';

function App() {
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
