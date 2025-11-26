import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products.api';
import Loading from '../../components/common/Loading';
import ProductCard from '../../components/products/ProductCard';
import Chip from '../../components/common/Chip';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';
import type { CreateProductDto } from '../../types/product.types';
import './Products.css';

function getStockLevel(stock: number): 'high' | 'medium' | 'low' {
  if (stock >= 20) return 'high';
  if (stock >= 5) return 'medium';
  return 'low';
}

function getStockVariant(stock: number): 'success' | 'warning' | 'error' {
  const level = getStockLevel(stock);
  if (level === 'high') return 'success';
  if (level === 'medium') return 'warning';
  return 'error';
}

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll().then((res) => res.data),
  });

  const { showToast } = useToast();

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      showToast('Producto guardado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al crear producto: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: import('../../types/product.types').UpdateProductDto }) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditingProduct(null);
      showToast('Producto actualizado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al actualizar producto: ${error.message}`, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('Producto eliminado exitosamente', 'success');
    },
    onError: (error: Error) => {
      showToast(`Error al eliminar producto: ${error.message}`, 'error');
    },
  });

  const handleEdit = (productId: number) => {
    setEditingProduct(productId);
    setShowForm(true);
  };

  const handleDelete = (product: import('../../types/product.types').Product) => {
    if (window.confirm(`¿Está seguro de eliminar el producto "${product.description}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleFormSubmit = (data: CreateProductDto) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const editingProductData = editingProduct
    ? products?.find((p) => p.id === editingProduct)
    : undefined;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Productos</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <span className="material-icons btn-icon">
            {showForm ? 'close' : 'add'}
          </span>
          {showForm ? 'Cancelar' : 'Nuevo Producto'}
        </button>
      </div>

      {showForm && (
        <ProductForm
          product={editingProductData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <div className="products-list">
        {products && products.length > 0 ? (
          isMobile ? (
            <div className="products-grid-mobile">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="products-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Descripción</th>
                    <th>Precio Venta</th>
                    <th>Costo</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className="product-reference">{product.reference}</span>
                      </td>
                      <td>
                        <div className="product-description">
                          <span className="material-icons product-image-icon">inventory_2</span>
                          <span>{product.description}</span>
                        </div>
                      </td>
                      <td className="product-price-cell">
                        <strong>{formatCurrency(product.salePrice)}</strong>
                      </td>
                      <td>{formatCurrency(product.costPrice)}</td>
                      <td>
                        <Chip variant={getStockVariant(product.stock)} size="sm">
                          {product.stock}
                        </Chip>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="btn-icon-edit"
                            title="Editar"
                          >
                            <span className="material-icons">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="btn-icon-delete"
                            title="Eliminar"
                            disabled={deleteMutation.isPending}
                          >
                            <span className="material-icons">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="products-empty">
            <p>No hay productos registrados</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Crear primer producto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
}: {
  product?: import('../../types/product.types').Product;
  onSubmit: (data: CreateProductDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Si es edición, usar la referencia del producto (porque el campo está disabled)
    const reference = product?.reference || (formData.get('reference') as string);
    onSubmit({
      reference: reference,
      description: formData.get('description') as string,
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
        <input
          name="reference"
          defaultValue={product?.reference || ''}
          required
          disabled={!!product}
          readOnly={!!product}
        />
        {/* Campo hidden para asegurar que la referencia se envíe cuando está disabled */}
        {product && (
          <input type="hidden" name="reference" value={product.reference} />
        )}
      </div>
      <div className="form-group">
        <label>Descripción *</label>
        <input
          name="description"
          defaultValue={product?.description || ''}
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Precio de Venta *</label>
          <input
            name="salePrice"
            type="number"
            step="1"
            min="0"
            defaultValue={product?.salePrice || ''}
            required
          />
        </div>
        <div className="form-group">
          <label>Costo</label>
          <input
            name="costPrice"
            type="number"
            step="1"
            min="0"
            defaultValue={product?.costPrice || ''}
          />
        </div>
        <div className="form-group">
          <label>Stock</label>
          <input
            name="stock"
            type="number"
            step="1"
            min="0"
            defaultValue={product?.stock || ''}
            disabled={!!product}
            title={
              product
                ? 'El stock no se puede editar directamente. Use movimientos de tipo ENTRADA_ESPECIAL o SALIDA_ESPECIAL para ajustar el inventario.'
                : undefined
            }
          />
          {product && (
            <small className="form-hint" style={{ color: 'var(--color-warning)', display: 'block', marginTop: '0.5rem' }}>
              ⚠️ El stock debe ajustarse mediante movimientos (ENTRADA_ESPECIAL o SALIDA_ESPECIAL) para mantener la trazabilidad.
            </small>
          )}
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          <span className="material-icons btn-icon">
            {isLoading ? 'hourglass_empty' : 'save'}
          </span>
          {isLoading ? 'Guardando...' : product ? 'Actualizar Producto' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          <span className="material-icons btn-icon">close</span>
          Cancelar
        </button>
      </div>
    </form>
  );
}

