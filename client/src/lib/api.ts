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

export const facilitiesApi = {
  list: (params?: { district?: string; type?: string; search?: string; hasAvailableBeds?: boolean; service?: string }) => {
    const query = new URLSearchParams();
    if (params?.district) query.set('district', params.district);
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.hasAvailableBeds) query.set('hasAvailableBeds', 'true');
    if (params?.service) query.set('service', params.service);
    return apiFetch<{ success: boolean; data: { facilities: Facility[]; total: number } }>(`/facilities?${query.toString()}`);
  },

  nearby: (params: { lat: number; lng: number; radius?: number; district?: string; type?: string; service?: string; hasBeds?: boolean; hasMedicine?: string; test?: string }) => {
    const query = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    });
    if (params.radius) query.set('radius', params.radius.toString());
    if (params.district) query.set('district', params.district);
    if (params.type) query.set('type', params.type);
    if (params.service) query.set('service', params.service);
    if (params.hasBeds) query.set('hasBeds', 'true');
    if (params.hasMedicine) query.set('hasMedicine', params.hasMedicine);
    if (params.test) query.set('test', params.test);
    return apiFetch<{ success: boolean; data: (Facility & { distanceKm: number })[] }>(`/facilities/nearby?${query.toString()}`);
  },

  getById: (id: string) =>
    apiFetch<{ success: boolean; data: Facility }>(`/facilities/${id}`),

  create: (body: Omit<Partial<Facility>, 'services'> & { services?: string[]; totalBeds?: number; availableBeds?: number }) =>
    apiFetch<{ success: boolean; data: Facility }>('/facilities', { method: 'POST', body: body as unknown as Record<string, unknown> }),

  updateBeds: (id: string, body: Partial<FacilityBedStatus>) =>
    apiFetch<{ success: boolean; data: FacilityBedStatus }>(`/facilities/${id}/beds`, { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  upsertMedicine: (id: string, body: Partial<FacilityMedicine>) =>
    apiFetch<{ success: boolean; data: FacilityMedicine }>(`/facilities/${id}/medicines`, { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  upsertDiagnostic: (id: string, body: Partial<FacilityDiagnostic>) =>
    apiFetch<{ success: boolean; data: FacilityDiagnostic }>(`/facilities/${id}/diagnostics`, { method: 'PATCH', body: body as unknown as Record<string, unknown> }),
};

export const adminApi = {
  provisionUser: (body: {
    email: string;
    password?: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    district?: string;
    facilityId?: string;
    specialty?: string;
    qualification?: string;
    registrationNo?: string;
    workerType?: string;
    villageArea?: string;
  }) =>
    apiFetch<{ success: boolean; data: { userId: string; email: string; role: string; fullName: string }; message: string }>('/admin/users/provision', {
      method: 'POST',
      body: body as unknown as Record<string, unknown>,
    }),

  listStaff: (params?: { role?: string; district?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set('role', params.role);
    if (params?.district) query.set('district', params.district);
    return apiFetch<{ success: boolean; data: UserProfile[] }>(`/admin/users/staff?${query.toString()}`);
  },

  getDistrictSummary: (district?: string) => {
    const query = new URLSearchParams();
    if (district) query.set('district', district);
    return apiFetch<{ success: boolean; data: { district: string; totalFacilities: number; totalBeds: number; availableBeds: number; totalDoctors: number } }>(`/admin/districts/summary?${query.toString()}`);
  },
};

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'DISTRICT_ADMIN' | 'FACILITY_ADMIN' | 'DOCTOR' | 'HEALTH_WORKER' | 'PATIENT';
export type RegistrationStep = 'CREDENTIALS' | 'EMAIL_VERIFIED' | 'PROFILE_STEP_1' | 'PROFILE_STEP_2' | 'COMPLETE';
export type FacilityType = 'SUB_CENTRE' | 'PHC' | 'CHC' | 'RURAL_HOSPITAL' | 'DISTRICT_HOSPITAL' | 'DIAGNOSTIC_CENTER' | 'PHARMACY';

export interface FacilityBedStatus {
  id?: string;
  facilityId: string;
  totalBeds: number;
  availableBeds: number;
  icuBedsTotal: number;
  icuBedsAvailable: number;
  oxygenBedsTotal: number;
  oxygenBedsAvailable: number;
  updatedAt?: string;
}

export interface FacilityMedicine {
  id?: string;
  facilityId: string;
  medicineName: string;
  category: string | null;
  quantity: number;
  unit: string;
  stockThreshold: number;
  isAvailable: boolean;
  expiryDate: string | null;
}

export interface FacilityDiagnostic {
  id?: string;
  facilityId: string;
  testName: string;
  category: string | null;
  isAvailable: boolean;
  turnaroundHours: number;
  costInr: number;
}

export interface FacilityService {
  id?: string;
  facilityId: string;
  name: string;
  category: string | null;
  isActive: boolean;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  village: string | null;
  address: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  contactPhone: string | null;
  contactEmail: string | null;
  workingHours: string | null;
  isActive: boolean;
  services?: FacilityService[];
  bedStatus?: FacilityBedStatus | null;
  medicines?: FacilityMedicine[];
  diagnostics?: FacilityDiagnostic[];
  doctors?: {
    id: string;
    specialty: string | null;
    qualification: string | null;
    registrationNo?: string | null;
    isAvailable?: boolean;
    user?: { id: string; fullName: string; email?: string | null; phone?: string | null };
  }[];
  workers?: {
    id: string;
    workerType: string | null;
    villageArea: string | null;
    user?: { id: string; fullName: string; phone?: string | null };
  }[];
  admins?: {
    id: string;
    user?: { id: string; fullName: string; email: string | null };
  }[];
}

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
  districtAdmin?: { id: string; district: string } | null;
  facilityAdmin?: { id: string; facilityId: string; facility?: Facility } | null;
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
  doctor?: { id: string; specialty: string | null; qualification: string | null; registrationNo: string | null; facility?: Facility | null } | null;
  healthWorker?: { id: string; workerType: string | null; villageArea: string | null; facility?: Facility | null } | null;
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
