/**
 * api.ts — Typed fetch wrapper for all client → Express server communication.
 *
 * Design principles:
 * - credentials: 'include' so the browser automatically sends the httpOnly session cookie.
 * - Centralised base URL from NEXT_PUBLIC_API_URL env variable.
 * - Throws on non-2xx so callers can use try/catch without inspecting status manually.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
}

export async function apiFetch<T = unknown>(
  path: string,
  { body, headers: extraHeaders, ...options }: FetchOptions = {}
): Promise<T> {
  const isFormData = body instanceof FormData;

  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...extraHeaders,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      message = data.error ?? data.message ?? message;
    } catch {
      // ignore json parse error
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

// ─── Typed API helpers ────────────────────────────────────────────────────────

export const authApi = {
  register: (body: { email: string; password: string; fullName: string; phone?: string }) =>
    apiFetch<{ success: boolean; data: { userId: string; email: string; role: string; message: string } }>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    apiFetch<{ success: boolean; data: { userId: string; role: string } }>('/auth/login', { method: 'POST', body }),

  googleOAuth: () =>
    apiFetch<{ success: boolean; data: { url: string } }>('/auth/google'),

  logout: () =>
    apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  forgotPassword: (body: { email: string }) =>
    apiFetch<{ success: boolean; data: { message: string } }>('/auth/forgot-password', { method: 'POST', body }),

  resetPassword: (body: { newPassword: string }) =>
    apiFetch<{ success: boolean; data: { message: string } }>('/auth/reset-password', { method: 'POST', body }),

  me: () =>
    apiFetch<{ success: boolean; data: UserProfile }>('/auth/me'),

  refresh: () =>
    apiFetch<{ success: boolean }>('/auth/refresh', { method: 'POST' }),
};

export const profileApi = {
  step1: (body: PatientStep1Body) =>
    apiFetch('/profile/patient/step/1', { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  step2: (body: PatientStep2Body) =>
    apiFetch('/profile/patient/step/2', { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  me: () =>
    apiFetch<{ success: boolean; data: UserProfile }>('/profile/me'),
};

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type UserRole = 'PATIENT' | 'HEALTH_WORKER' | 'DOCTOR' | 'FACILITY_ADMIN' | 'DISTRICT_ADMIN';
export type RegistrationStep = 'CREDENTIALS' | 'EMAIL_VERIFIED' | 'PROFILE_STEP_1' | 'PROFILE_STEP_2' | 'COMPLETE';

export interface UserProfile {
  id: string;
  role: UserRole;
  status: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  preferredLang: string;
  createdAt: string;
  registrationProgress?: { currentStep: RegistrationStep } | null;
  patient?: {
    id: string;
    dateOfBirth: string | null;
    gender: string | null;
    village: string | null;
    district: string | null;
    state: string;
    pincode: string | null;
    abhaId: string | null;
    bloodGroup: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    medicalHistory?: {
      allergies: string[];
      chronicConditions: string[];
      currentMedications: string[];
      notes: string | null;
    } | null;
  } | null;
  doctor?: { id: string; specialty: string | null; qualification: string | null; registrationNo: string | null } | null;
  healthWorker?: { id: string; workerType: string | null; villageArea: string | null } | null;
}

export interface PatientStep1Body {
  dateOfBirth?: string;
  gender?: string;
  village?: string;
  district?: string;
  pincode?: string;
  abhaId?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface PatientStep2Body {
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  notes?: string;
}
