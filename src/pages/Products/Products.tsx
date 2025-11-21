import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products.api';
import Loading from '../../components/common/Loading';
import { formatCurrency } from '../../utils/formatters';
import './Products.css';

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Productos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : 'Nuevo Producto'}
        </button>
      </div>

      {showForm && (
        <ProductForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="products-list">
        {products && products.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Referencia</th>
                <th>Descripción</th>
                <th>Precio Venta</th>
                <th>Costo</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.reference}</td>
                  <td>{product.description}</td>
                  <td>{formatCurrency(product.salePrice)}</td>
                  <td>{formatCurrency(product.costPrice)}</td>
                  <td>{product.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay productos registrados</p>
        )}
      </div>
    </div>
  );
}

function ProductForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      reference: formData.get('reference'),
      description: formData.get('description'),
      salePrice: parseFloat(formData.get('salePrice') as string),
      costPrice: formData.get('costPrice')
        ? parseFloat(formData.get('costPrice') as string)
        : undefined,
      stock: formData.get('stock')
        ? parseFloat(formData.get('stock') as string)
        : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <div className="form-group">
        <label>Referencia *</label>
        <input name="reference" required />
      </div>
      <div className="form-group">
        <label>Descripción *</label>
        <input name="description" required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Precio de Venta *</label>
          <input name="salePrice" type="number" step="0.01" required />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input name="costPrice" type="number" step="0.01" />
        </div>
        <div className="form-group">
          <label>Stock Inicial</label>
          <input name="stock" type="number" step="0.001" />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}

