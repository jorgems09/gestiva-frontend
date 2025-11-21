import { apiClient } from './client';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
} from '../types/product.types';

export const productsApi = {
  getAll: () => apiClient.get<Product[]>('/products'),
  getById: (id: number) => apiClient.get<Product>(`/products/${id}`),
  create: (data: CreateProductDto) => apiClient.post<Product>('/products', data),
  update: (id: number, data: UpdateProductDto) =>
    apiClient.put<Product>(`/products/${id}`, data),
  delete: (id: number) => apiClient.delete(`/products/${id}`),
};

