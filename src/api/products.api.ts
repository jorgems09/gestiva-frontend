import { apiClient } from './client';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
} from '../types/product.types';

// Transforma los valores DECIMAL de MySQL (strings) a números
function transformProduct(product: Product | Record<string, unknown>): Product {
  return {
    id: product.id as number,
    reference: product.reference as string,
    description: product.description as string,
    salePrice: typeof product.salePrice === 'string' 
      ? parseFloat(product.salePrice) 
      : (product.salePrice as number),
    costPrice: typeof product.costPrice === 'string' 
      ? parseFloat(product.costPrice) 
      : (product.costPrice as number),
    stock: typeof product.stock === 'string' 
      ? parseFloat(product.stock) 
      : (product.stock as number),
  };
}

export const productsApi = {
  getAll: async () => {
    const response = await apiClient.get<Product[]>('/products');
    return {
      ...response,
      data: response.data.map(transformProduct),
    };
  },
  getById: async (id: number) => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return {
      ...response,
      data: transformProduct(response.data),
    };
  },
  create: async (data: CreateProductDto) => {
    const response = await apiClient.post<Product>('/products', data);
    return {
      ...response,
      data: transformProduct(response.data),
    };
  },
  update: async (id: number, data: UpdateProductDto) => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return {
      ...response,
      data: transformProduct(response.data),
    };
  },
  delete: (id: number) => apiClient.delete(`/products/${id}`),
};

