import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { movementsApi } from '../../api/movements.api';
import { reportsApi } from '../../api/reports.api';
import { productsApi } from '../../api/products.api';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ProcessType } from '../../constants/process-types';
import './DashboardNew.css';

type TimePeriod = '7days' | '30days';

export default function DashboardNew() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const navigate = useNavigate();
  
  // Usar fecha local (Colombia UTC-5) en lugar de UTC
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFirstDayOfMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const today = getLocalDate();
  const firstDayOfMonth = getFirstDayOfMonth();

  // Queries
  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementsApi.getAll().then((res) => res.data),
  });

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-report', today],
    queryFn: () => reportsApi.daily(today).then((res) => res.data),
  });

  const { data: profitability, isLoading: profitLoading } = useQuery({
    queryKey: ['profitability', firstDayOfMonth, today],
    queryFn: () =>
      reportsApi.profitability(firstDayOfMonth, today).then((res) => res.data),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
  });

  if (movementsLoading || dailyLoading || profitLoading || productsLoading) {
    return <Loading />;
  }

  // Calcular KPIs
  const todaySales = dailyReport?.totals.find(t => t.process === 'VENTA')?.total || 0;

  // Pedidos pendientes (ventas con estado "pending")
  const pendingOrders = movements?.filter(m => {
    if (m.processType !== ProcessType.SALE || m.status !== 1) return false;
    
    // Verificar si tiene cuentas por cobrar pendientes
    if (m.receivables && m.receivables.length > 0) {
      return m.receivables.some((r: any) => r.status === 'PENDIENTE' && Number(r.balance) > 0);
    }
    
    // Si no tiene receivables, verificar pagos
    const paymentsTotal = m.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    return Number(m.total) > paymentsTotal;
  }).length || 0;

  // Productos con stock bajo (< 10)
  const lowStockCount = products?.filter(p => p.stock < 10).length || 0;

  // Ingresos del mes
  const monthRevenue = profitability?.revenue || 0;

  // Gastos del mes desde el endpoint profitability
  const monthExpensesFromApi = profitability?.expenses || 0;

  // Utilidad neta del mes (ahora viene directamente del endpoint)
  const netProfit = profitability?.netProfit || 0;

  // Margen de rentabilidad (%) (ahora viene directamente del endpoint)
  const profitMargin = profitability?.marginPercent || 0;

  // Clasificación del margen
  const getProfitMarginStatus = (margin: number): { label: string; variant: string } => {
    if (margin >= 25) return { label: 'Excelente', variant: 'success-dark' };
    if (margin >= 15) return { label: 'Saludable', variant: 'success' };
    if (margin >= 10) return { label: 'Aceptable', variant: 'warning' };
    if (margin >= 5) return { label: 'Crítico', variant: 'error' };
    return { label: 'Pérdidas', variant: 'error-dark' };
  };

  const marginStatus = getProfitMarginStatus(profitMargin);

  // Movimientos recientes (últimos 5 activos)
  const recentMovements = movements
    ?.filter(m => m.status === 1 && !m.consecutive.startsWith('ANL-'))
    .slice(0, 4) || [];

  // Productos más vendidos (basado en movimientos de venta)
  const salesMovements = movements?.filter(m => 
    m.processType === ProcessType.SALE && m.status === 1
  ) || [];

  const productSales = new Map<string, { name: string; sku: string; quantity: number }>();
  
  salesMovements.forEach(sale => {
    sale.details?.forEach(detail => {
      const productCode = detail.productReference || '';
      const existing = productSales.get(productCode);
      if (existing) {
        existing.quantity += detail.quantity;
      } else {
        productSales.set(productCode, {
          name: detail.description || 'Producto',
          sku: productCode,
          quantity: detail.quantity
        });
      }
    });
  });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  // Función para obtener el status del movimiento (considerando receivables y payables)
  const getPaymentStatus = (movement: any): 'paid' | 'pending' | 'overdue' | 'cancelled' => {
    if (movement.status === 0 || movement.consecutive?.startsWith('ANL-')) {
      return 'cancelled';
    }
    
    // Para VENTAS: Verificar el estado de las cuentas por cobrar
    if (movement.processType === ProcessType.SALE && movement.receivables && movement.receivables.length > 0) {
      const hasActiveReceivables = movement.receivables.some((r: any) => 
        r.status === 'PENDIENTE' && Number(r.balance) > 0
      );
      
      if (hasActiveReceivables) {
        return 'pending';  // Hay deuda activa del cliente
      } else {
        return 'paid';  // Todas las cuentas por cobrar han sido canceladas
      }
    }
    
    // Para COMPRAS: Verificar el estado de las cuentas por pagar
    if (movement.processType === ProcessType.PURCHASE && movement.payables && movement.payables.length > 0) {
      const hasActivePayables = movement.payables.some((p: any) => 
        p.status === 'PENDIENTE' && Number(p.balance) > 0
      );
      
      if (hasActivePayables) {
        return 'pending';  // Hay deuda activa con el proveedor
      } else {
        return 'paid';  // Todas las cuentas por pagar han sido canceladas
      }
    }
    
    // Para otros tipos: usar la lógica de pagos directos
    const paymentsTotal = movement.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const movementTotal = Number(movement.total);
    
    if (paymentsTotal >= movementTotal) {
      return 'paid';
    }
    
    return 'pending';
  };

  // Convertir status a badge
  const getMovementStatusBadge = (movement: any) => {
    const status = getPaymentStatus(movement);
    
    switch (status) {
      case 'paid':
        return <StatusBadge variant="success" label="Pagado" />;
      case 'pending':
        return <StatusBadge variant="warning" label="Pendiente" />;
      case 'overdue':
        return <StatusBadge variant="error" label="Vencido" />;
      case 'cancelled':
        return <StatusBadge variant="default" label="Anulado" />;
      default:
        return <StatusBadge variant="default" label="Desconocido" />;
    }
  };

  // Calcular comparación con día anterior (placeholder - en producción usar datos reales)
  const yesterdayComparison = "+5.2%";

  return (
    <div className="dashboard-new">
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>Dashboard General</h1>
          <p className="dashboard-subtitle">
            Resumen de los KPIs más importantes de tu tienda.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button className="btn-icon-round">
            <span className="material-icons">notifications</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/movements')}>
            <span className="material-icons">add</span>
            Crear Movimiento
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="kpi-grid">
        <div className="kpi-card" title="Total de ventas realizadas hoy">
          <p className="kpi-label">Ventas de Hoy</p>
          <p className="kpi-value">{formatCurrency(todaySales)}</p>
          <p className="kpi-change positive">{yesterdayComparison} vs ayer</p>
        </div>

        <div className="kpi-card" title="Ventas con pagos pendientes o cuentas por cobrar activas">
          <p className="kpi-label">Pedidos Pendientes</p>
          <p className="kpi-value">{pendingOrders}</p>
          <p className="kpi-change neutral">
            {pendingOrders > 0 
              ? `${pendingOrders} venta${pendingOrders !== 1 ? 's' : ''} sin completar` 
              : 'Todo al día'}
          </p>
        </div>

        <div className="kpi-card" title="Productos con menos de 10 unidades en inventario">
          <p className="kpi-label">Stock Bajo (&lt;10 unidades)</p>
          <p className="kpi-value">{lowStockCount}</p>
          <p className="kpi-change negative">
            {lowStockCount > 0 
              ? `${lowStockCount} producto${lowStockCount !== 1 ? 's' : ''} por reponer` 
              : 'Stock saludable'}
          </p>
        </div>

        <div className="kpi-card" title="Total de ingresos generados en el mes actual">
          <p className="kpi-label">Ingresos del Mes</p>
          <p className="kpi-value">{formatCurrency(monthRevenue)}</p>
          <p className="kpi-change positive">
            {profitability ? `${profitability.marginPercent.toFixed(1)}% margen bruto` : 'Calculando...'}
          </p>
        </div>

        <div className="kpi-card" title="Ganancia neta después de restar costos y gastos del mes">
          <p className="kpi-label">Utilidad del Mes</p>
          <p className={`kpi-value ${netProfit >= 0 ? 'kpi-value-positive' : 'kpi-value-negative'}`}>
            {formatCurrency(netProfit)}
          </p>
          <p className={`kpi-change ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            {netProfit >= 0 ? '↗' : '↘'} {Math.abs(netProfit) > 0 
              ? `${formatCurrency(Math.abs((profitability?.cost || 0) + monthExpensesFromApi))} en costos` 
              : 'Sin movimientos'}
          </p>
        </div>

        <div className="kpi-card" title="Porcentaje de ganancia sobre las ventas totales del mes">
          <p className="kpi-label">Margen de Rentabilidad</p>
          <p className={`kpi-value kpi-value-${marginStatus.variant}`}>
            {profitMargin.toFixed(1)}%
          </p>
          <p className={`kpi-change ${marginStatus.variant === 'success-dark' || marginStatus.variant === 'success' ? 'positive' : marginStatus.variant === 'warning' ? 'neutral' : 'negative'}`}>
            {marginStatus.label}
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="dashboard-content-grid">
        {/* Sales Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>Resumen de Ventas</h3>
            <div className="time-period-selector">
              <button
                className={timePeriod === '7days' ? 'active' : ''}
                onClick={() => setTimePeriod('7days')}
              >
                7 Días
              </button>
              <button
                className={timePeriod === '30days' ? 'active' : ''}
                onClick={() => setTimePeriod('30days')}
              >
                30 Días
              </button>
            </div>
          </div>
          <div className="chart-container">
            {/* Simple SVG placeholder chart - en producción usar Chart.js o Recharts */}
            <svg
              fill="none"
              height="100%"
              preserveAspectRatio="none"
              viewBox="0 0 540 320"
              width="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="salesChartGradient"
                  x1="266.786"
                  x2="266.786"
                  y1="1"
                  y2="320"
                >
                  <stop stopColor="var(--color-primary)" stopOpacity="0.3"></stop>
                  <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path
                d="M0 242.067C29.6429 242.067 29.6429 88.8 59.2857 88.8C88.9286 88.8 88.9286 142.933 118.571 142.933C148.214 142.933 148.214 220 177.857 220C207.5 220 207.5 120.933 237.143 120.933C266.786 120.933 266.786 150 296.429 150C326.071 150 326.071 270 355.714 270C385.357 270 385.357 1 415 1C444.643 1 444.643 194 474.286 194C503.929 194 503.929 96.8 533.571 96.8L540 96.8V320H0V242.067Z"
                fill="url(#salesChartGradient)"
              ></path>
              <path
                d="M0 242.067C29.6429 242.067 29.6429 88.8 59.2857 88.8C88.9286 88.8 88.9286 142.933 118.571 142.933C148.214 142.933 148.214 220 177.857 220C207.5 220 207.5 120.933 237.143 120.933C266.786 120.933 266.786 150 296.429 150C326.071 150 326.071 270 355.714 270C385.357 270 385.357 1 415 1C444.643 1 444.643 194 474.286 194C503.929 194 503.929 96.8 533.571 96.8"
                stroke="var(--color-primary)"
                strokeLinecap="round"
                strokeWidth="3"
              ></path>
            </svg>
          </div>
        </div>

        {/* Top Products */}
        <div className="dashboard-card top-products-card">
          <div className="card-header">
            <h3>Productos Más Vendidos</h3>
          </div>
          <ul className="top-products-list">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <li key={index} className="top-product-item">
                  <div className="product-avatar">
                    {product.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="product-info">
                    <p className="product-name">{product.name}</p>
                    <p className="product-sku">SKU: {product.sku}</p>
                  </div>
                  <p className="product-quantity">{product.quantity} uds</p>
                </li>
              ))
            ) : (
              <li className="empty-state">
                <span className="material-icons">inventory_2</span>
                <p>No hay datos de ventas aún</p>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* Recent Orders Table */}
      <section className="dashboard-card recent-orders-card">
        <div className="card-header">
          <h3>Movimientos Recientes</h3>
        </div>
        <div className="table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Consecutivo</th>
                <th>Cliente/Proveedor</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.length > 0 ? (
                recentMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="font-medium">{movement.consecutive}</td>
                    <td>
                      {(() => {
                        if (
                          movement.processType === ProcessType.PURCHASE ||
                          movement.processType === ProcessType.EXPENSE
                        ) {
                          return movement.supplier?.name || movement.supplierName || '-';
                        }
                        if (
                          movement.processType === ProcessType.SALE ||
                          movement.processType === ProcessType.RECEIPT
                        ) {
                          return movement.client?.name || '-';
                        }
                        return movement.client?.name || movement.supplier?.name || '-';
                      })()}
                    </td>
                    <td>{formatDate(movement.documentDate)}</td>
                    <td>{getMovementStatusBadge(movement)}</td>
                    <td className="text-right font-medium">
                      {formatCurrency(movement.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center empty-state-row">
                    <span className="material-icons">receipt_long</span>
                    <p>No hay movimientos recientes</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

