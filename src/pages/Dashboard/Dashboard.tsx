import { useQuery } from '@tanstack/react-query';
import { movementsApi } from '../../api/movements.api';
import { reportsApi } from '../../api/reports.api';
import Loading from '../../components/common/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './Dashboard.css';

export default function Dashboard() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split('T')[0];

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

  if (movementsLoading || dailyLoading || profitLoading) {
    return <Loading />;
  }

  const recentMovements = movements?.slice(0, 5) || [];

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Informe Diario</h3>
          <p className="card-date">{formatDate(today)}</p>
          {dailyReport?.totals.map((item) => (
            <div key={item.process} className="card-item">
              <span>{item.process}:</span>
              <strong>{formatCurrency(item.total)}</strong>
            </div>
          ))}
        </div>

        <div className="dashboard-card">
          <h3>Rentabilidad del Mes</h3>
          {profitability && (
            <>
              <div className="card-item">
                <span>Ingresos:</span>
                <strong>{formatCurrency(profitability.revenue)}</strong>
              </div>
              <div className="card-item">
                <span>Costos:</span>
                <strong>{formatCurrency(profitability.cost)}</strong>
              </div>
              <div className="card-item highlight">
                <span>Margen:</span>
                <strong>{formatCurrency(profitability.grossMargin)}</strong>
              </div>
              <div className="card-item">
                <span>Margen %:</span>
                <strong>{profitability.marginPercent.toFixed(2)}%</strong>
              </div>
            </>
          )}
        </div>

        <div className="dashboard-card full-width">
          <h3>Movimientos Recientes</h3>
          {recentMovements.length > 0 ? (
            <table className="movements-table">
              <thead>
                <tr>
                  <th>Consecutivo</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.consecutive}</td>
                    <td>{movement.processType}</td>
                    <td>{formatDate(movement.documentDate)}</td>
                    <td>{movement.client?.name || '-'}</td>
                    <td>{formatCurrency(movement.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay movimientos recientes</p>
          )}
        </div>
      </div>
    </div>
  );
}

