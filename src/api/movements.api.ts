import { apiClient } from './client';
import type {
  CreateMovementDto,
  MovementHeader,
} from '../types/movement.types';

export const movementsApi = {
  getAll: () => apiClient.get<MovementHeader[]>('/movements'),
  getById: (id: number) => apiClient.get<MovementHeader>(`/movements/${id}`),
  create: (data: CreateMovementDto) =>
    apiClient.post<MovementHeader>('/movements', data),
};

