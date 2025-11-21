import { useQuery } from '@tanstack/react-query';
import { movementsApi } from '../../api/movements.api';
import Loading from '../../components/common/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './Movements.css';

export default function Movements() {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: () => movementsApi.getAll().then((res) => res.data),
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="movements-page">
      <div className="page-header">
        <h1>Movimientos</h1>
      </div>

      <div className="movements-list">
        {movements && movements.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Consecutivo</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Cliente/Proveedor</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.consecutive}</td>
                  <td>{movement.processType}</td>
                  <td>{formatDate(movement.documentDate)}</td>
                  <td>
                    {movement.client?.name || movement.supplierName || '-'}
                  </td>
                  <td>{formatCurrency(movement.subtotal)}</td>
                  <td>{formatCurrency(movement.taxTotal)}</td>
                  <td>
                    <strong>{formatCurrency(movement.total)}</strong>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        movement.status === 1 ? 'active' : 'inactive'
                      }`}
                    >
                      {movement.status === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay movimientos registrados</p>
        )}
      </div>
    </div>
  );
}

