import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products.api';
import Loading from '../../components/common/Loading';
import StatusBadge from '../../components/common/StatusBadge';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatters';
import type { CreateProductDto } from '../../types/product.types';
import './Products.css';

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    stock: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

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

  // Filtrar y buscar productos
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const filtered = products.filter((product) => {
      // Filtro por stock
      if (filters.stock) {
        if (filters.stock === 'in-stock' && product.stock === 0) return false;
        if (filters.stock === 'low-stock' && (product.stock >= 5 || product.stock === 0)) return false;
        if (filters.stock === 'out-of-stock' && product.stock > 0) return false;
      }

      // Búsqueda por referencia o nombre
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesReference = product.reference?.toLowerCase().includes(searchLower);
        const matchesDescription = product.description?.toLowerCase().includes(searchLower);
        if (!matchesReference && !matchesDescription) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [products, filters, searchTerm]);

  // Paginación
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleImportProducts = () => {
    showToast('Funcionalidad de importación en desarrollo', 'info');
  };

  const getStockStatus = (stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (stock === 0) return 'out-of-stock';
    if (stock < 5) return 'low-stock';
    return 'in-stock';
  };

  const getStockLabel = (stock: number): string => {
    const status = getStockStatus(stock);
    if (status === 'in-stock') return 'En Stock';
    if (status === 'low-stock') return 'Stock Bajo';
    return 'Sin Stock';
  };

  const stockOptions = [
    { value: 'in-stock', label: 'En Stock' },
    { value: 'low-stock', label: 'Stock Bajo' },
    { value: 'out-of-stock', label: 'Sin Stock' },
  ];

  // Por ahora, categorías placeholder
  const categoryOptions = [
    { value: '', label: 'Todas las categorías' },
    // Se pueden agregar más cuando se implemente el sistema de categorías
  ];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="products-page">
      <header className="products-header">
        <div className="products-header-content">
          <h1>Gestión de Productos</h1>
          <p className="products-header-subtitle">Añade, edita y gestiona el catálogo de productos de tu tienda.</p>
        </div>
        <div className="products-header-actions">
          <button onClick={handleImportProducts} className="btn-import-products">
            <span className="material-symbols-outlined">upload</span>
            <span className="truncate">Importar Productos</span>
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-add-product">
            <span className="material-symbols-outlined">add</span>
            <span className="truncate">{showForm ? 'Cancelar' : 'Añadir Producto'}</span>
          </button>
        </div>
      </header>

      {showForm && (
        <ProductForm
          product={editingProductData}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {!showForm && (
        <>
          <div className="products-filters-container">
            <div className="products-toolbar">
              <div className="products-search-wrapper">
                <div className="products-search-icon">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  type="text"
                  className="products-search-input"
                  placeholder="Buscar por referencia o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="products-filters-row">
                <select
                  className="products-filter-select"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">Categoría</option>
                  {categoryOptions.filter(opt => opt.value).map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  className="products-filter-select"
                  value={filters.stock}
                  onChange={(e) => setFilters({ ...filters, stock: e.target.value })}
                >
                  <option value="">Stock</option>
                  {stockOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button className="products-filter-btn" title="Más filtros">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
            </div>
          </div>

          <div className="products-table-wrapper">
            {filteredProducts.length > 0 ? (
              <>
                <div className="products-table-container">
                  <div className="products-table-overflow">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th className="w-16" scope="col">Imagen</th>
                          <th scope="col">Referencia</th>
                          <th scope="col">Nombre Producto</th>
                          <th scope="col">Categoría</th>
                          <th scope="col">Precio Venta</th>
                          <th scope="col">Costo</th>
                          <th scope="col">Stock</th>
                          <th className="text-right" scope="col">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedProducts.map((product) => {
                          const stockStatus = getStockStatus(product.stock);
                          const stockLabel = getStockLabel(product.stock);
                          const stockVariant = stockStatus === 'in-stock' ? 'success' : stockStatus === 'low-stock' ? 'warning' : 'error';
                          return (
                            <tr key={product.id}>
                              <td>
                                <div className="product-image-cell">
                                  <span className="material-symbols-outlined">image</span>
                                </div>
                              </td>
                              <td className="product-reference-cell">{product.reference}</td>
                              <th className="product-name-cell" scope="row">{product.description}</th>
                              <td className="product-category-cell">-</td>
                              <td className="product-price-cell">{formatCurrency(product.salePrice)}</td>
                              <td className="product-cost-cell">{formatCurrency(product.costPrice)}</td>
                              <td>
                                <div className="product-stock-cell">
                                  <StatusBadge variant={stockVariant as 'success' | 'warning' | 'error'}>
                                    {stockLabel}
                                  </StatusBadge>
                                  <span className="stock-quantity">{Math.floor(product.stock)} unidades</span>
                                </div>
                              </td>
                              <td className="text-right">
                                <div className="products-table-actions">
                                  <button
                                    onClick={() => handleEdit(product.id)}
                                    className="products-action-btn"
                                    title="Editar"
                                  >
                                    <span className="material-symbols-outlined">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(product)}
                                    className="products-action-btn"
                                    title="Eliminar"
                                    disabled={deleteMutation.isPending}
                                  >
                                    <span className="material-symbols-outlined">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <nav className="products-pagination" aria-label="Table navigation">
                  <span className="products-pagination-info">
                    Mostrando <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> de <span className="font-semibold">{filteredProducts.length}</span>
                  </span>
                  <div className="products-pagination-controls">
                    <button
                      className="products-pagination-btn"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`products-pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="products-pagination-ellipsis">...</span>
                    )}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <button
                        className="products-pagination-number"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      className="products-pagination-btn"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </nav>
              </>
            ) : (
              <div className="products-empty">
                <p>
                  {searchTerm || filters.category || filters.stock
                    ? 'No se encontraron productos con los filtros aplicados'
                    : 'No hay productos registrados'}
                </p>
                {!searchTerm && !filters.category && !filters.stock && (
                  <button onClick={() => setShowForm(true)} className="btn-primary">
                    Crear primer producto
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
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

