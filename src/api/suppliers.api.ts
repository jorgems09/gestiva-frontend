import { apiClient } from './client';
import type {
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
} from '../types/supplier.types';

export const suppliersApi = {
  getAll: () => apiClient.get<Supplier[]>('/suppliers'),
  getById: (id: number) => apiClient.get<Supplier>(`/suppliers/${id}`),
  create: (data: CreateSupplierDto) => apiClient.post<Supplier>('/suppliers', data),
  update: (id: number, data: UpdateSupplierDto) =>
    apiClient.put<Supplier>(`/suppliers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/suppliers/${id}`),
};

