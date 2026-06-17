import type {
  CreateOrderRequest,
  OrderResponse,
  PaginatedOrdersResponse,
  ProductCatalogResponse,
} from '@repo/schemas';

const API_URL = import.meta.env.VITE_ORDERS_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new ApiError(response.status, `Request failed with status ${response.status}`, body);
  }

  return response.json() as Promise<T>;
}

export function getCatalogProducts() {
  return request<ProductCatalogResponse>('/catalog/products');
}

export function listOrders(page = 1, limit = 20) {
  return request<PaginatedOrdersResponse>(`/orders?page=${page}&limit=${limit}`);
}

export function createOrder(body: CreateOrderRequest) {
  return request<OrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
