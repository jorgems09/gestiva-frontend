import Chip from '../common/Chip';
import { formatCurrency } from '../../utils/formatters';
import type { Product } from '../../types/product.types';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

function getStockLevel(stock: number): 'high' | 'medium' | 'low' {
  if (stock >= 20) return 'high';
  if (stock >= 5) return 'medium';
  return 'low';
}

function getStockLabel(stock: number): string {
  const level = getStockLevel(stock);
  if (level === 'high') return 'Alto';
  if (level === 'medium') return 'Medio';
  return 'Bajo';
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const stockLevel = getStockLevel(product.stock);
  const stockVariant =
    stockLevel === 'high' ? 'success' : stockLevel === 'medium' ? 'warning' : 'error';

  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-card-image">
        {/* Placeholder para imagen - preparado para futuro */}
        <span className="material-icons product-image-placeholder">inventory_2</span>
      </div>
      <div className="product-card-content">
        <div className="product-card-header">
          <h3 className="product-card-title">{product.description}</h3>
          <span className="product-card-reference">{product.reference}</span>
        </div>
        <div className="product-card-price">
          {formatCurrency(product.salePrice)}
        </div>
        <div className="product-card-footer">
          <Chip variant={stockVariant} size="sm">
            Stock: {product.stock} ({getStockLabel(product.stock)})
          </Chip>
          {product.costPrice && (
            <span className="product-card-cost">
              Costo: {formatCurrency(product.costPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

