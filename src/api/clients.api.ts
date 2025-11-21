import { apiClient } from './client';
import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
} from '../types/client.types';

export const clientsApi = {
  getAll: () => apiClient.get<Client[]>('/clients'),
  getById: (id: number) => apiClient.get<Client>(`/clients/${id}`),
  create: (data: CreateClientDto) => apiClient.post<Client>('/clients', data),
  update: (id: number, data: UpdateClientDto) =>
    apiClient.put<Client>(`/clients/${id}`, data),
  delete: (id: number) => apiClient.delete(`/clients/${id}`),
};

