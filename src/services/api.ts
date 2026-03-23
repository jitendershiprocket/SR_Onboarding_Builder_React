import type { OnboardingSchema } from '../types/schema.types';

const API_URL = import.meta.env.VITE_API_URL || 'https://apiv2.shiprocket.co/v1';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('builder_token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ─── Schema CRUD ────────────────────────────────────────────

export const api = {
  getActiveSchema: () =>
    request<{ success: boolean; data: OnboardingSchema }>('/onboarding/schema/active'),

  listSchemas: (status?: string) =>
    request<{ success: boolean; data: any[] }>(`/onboarding/schema/list${status ? `?status=${status}` : ''}`),

  getSchema: (id: number) =>
    request<{ success: boolean; data: any }>(`/onboarding/schema/${id}`),

  saveSchema: (name: string, schemaData: OnboardingSchema) =>
    request<{ success: boolean; data: any }>('/onboarding/schema', {
      method: 'POST',
      body: JSON.stringify({ name, schema_data: schemaData }),
    }),

  updateSchema: (id: number, data: { name?: string; schema_data?: OnboardingSchema }) =>
    request<{ success: boolean; data: any }>(`/onboarding/schema/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  publishSchema: (id: number) =>
    request<{ success: boolean; data: any }>(`/onboarding/schema/${id}/publish`, { method: 'POST' }),

  archiveSchema: (id: number) =>
    request<{ success: boolean; data: any }>(`/onboarding/schema/${id}/archive`, { method: 'POST' }),

  activateVersion: (id: number) =>
    request<{ success: boolean; data: any }>(`/onboarding/schema/${id}/activate`, { method: 'POST' }),

  deleteSchema: (id: number) =>
    request<{ success: boolean }>(`/onboarding/schema/${id}`, { method: 'DELETE' }),

  getVersions: (schemaId: string) =>
    request<{ success: boolean; data: any[] }>(`/onboarding/schema/${schemaId}/versions`),

  generateSchema: (prompt: string) =>
    request<{ success: boolean; data: OnboardingSchema; message?: string }>('/ai/generate-schema', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  editSchemaWithAI: (schema: OnboardingSchema, prompt: string) =>
    request<{ success: boolean; data: OnboardingSchema; message?: string }>('/ai/edit-schema', {
      method: 'POST',
      body: JSON.stringify({ schema, prompt }),
    }),

  designToSchema: async (file: File): Promise<{ success: boolean; data: OnboardingSchema; message?: string }> => {
    const token = localStorage.getItem('builder_token') || '';
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/ai/design-to-schema`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  },
};
