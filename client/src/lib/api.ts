/**
 * api.ts — Typed fetch wrapper for all client → Express server communication.
 */

const BASE_URL = process.env.NEXT_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

// ─── Auth API ─────────────────────────────────────────────────────────────────

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

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  step1: (body: PatientStep1Body) =>
    apiFetch('/profile/patient/step/1', { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  step2: (body: PatientStep2Body) =>
    apiFetch('/profile/patient/step/2', { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  me: () =>
    apiFetch<{ success: boolean; data: UserProfile }>('/profile/me'),
};

// ─── Facilities API ───────────────────────────────────────────────────────────

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

  getAvailabilityMatrix: (id: string) =>
    apiFetch<{ success: boolean; data: AvailabilityMatrix }>(`/facilities/${id}/availability`),

  getServicesCatalog: () =>
    apiFetch<{ success: boolean; data: Array<{ name: string; category: string; facilityCount: number }> }>('/facilities/services/catalog'),

  create: (body: Omit<Partial<Facility>, 'services' | 'medicines' | 'diagnostics' | 'slots'> & {
    services?: string[];
    totalBeds?: number;
    availableBeds?: number;
    oxygenBedsTotal?: number;
    oxygenBedsAvailable?: number;
    icuBedsTotal?: number;
    icuBedsAvailable?: number;
    medicines?: Array<{ medicineName: string; category?: string; quantity: number; unit?: string; stockThreshold?: number; isAvailable?: boolean }>;
    diagnostics?: Array<{ testName: string; category?: string; isAvailable?: boolean; turnaroundHours?: number; costInr?: number }>;
    slots?: Array<{ slotName: string; startTime?: string; endTime?: string; maxCapacity?: number; isAvailable?: boolean }>;
  }) =>
    apiFetch<{ success: boolean; data: Facility }>('/facilities', { method: 'POST', body: body as unknown as Record<string, unknown> }),

  updateBeds: (id: string, body: Partial<FacilityBedStatus>) =>
    apiFetch<{ success: boolean; data: FacilityBedStatus }>(`/facilities/${id}/beds`, { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  upsertMedicine: (id: string, body: Partial<FacilityMedicine>) =>
    apiFetch<{ success: boolean; data: FacilityMedicine }>(`/facilities/${id}/medicines`, { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  toggleMedicine: (facilityId: string, medicineId: string, isAvailable?: boolean) =>
    apiFetch<{ success: boolean; data: FacilityMedicine }>(`/facilities/${facilityId}/medicines/${medicineId}/toggle`, {
      method: 'PATCH',
      body: { isAvailable } as unknown as Record<string, unknown>,
    }),

  upsertDiagnostic: (id: string, body: Partial<FacilityDiagnostic>) =>
    apiFetch<{ success: boolean; data: FacilityDiagnostic }>(`/facilities/${id}/diagnostics`, { method: 'PATCH', body: body as unknown as Record<string, unknown> }),

  toggleDiagnostic: (facilityId: string, diagnosticId: string, isAvailable?: boolean) =>
    apiFetch<{ success: boolean; data: FacilityDiagnostic }>(`/facilities/${facilityId}/diagnostics/${diagnosticId}/toggle`, {
      method: 'PATCH',
      body: { isAvailable } as unknown as Record<string, unknown>,
    }),

  toggleDoctorAvailability: (facilityId: string, doctorId: string, isAvailable: boolean) =>
    apiFetch<{ success: boolean; data: DoctorProfile }>(`/facilities/${facilityId}/doctors/${doctorId}/availability`, {
      method: 'PATCH',
      body: { isAvailable } as unknown as Record<string, unknown>,
    }),

  upsertSlot: (facilityId: string, body: { id?: string; slotName: string; startTime?: string; endTime?: string; maxCapacity?: number; isAvailable?: boolean }) =>
    apiFetch<{ success: boolean; data: FacilitySlot }>(`/facilities/${facilityId}/slots`, {
      method: 'POST',
      body: body as unknown as Record<string, unknown>,
    }),

  toggleSlot: (facilityId: string, slotId: string, isAvailable?: boolean) =>
    apiFetch<{ success: boolean; data: FacilitySlot }>(`/facilities/${facilityId}/slots/${slotId}`, {
      method: 'PATCH',
      body: { isAvailable } as unknown as Record<string, unknown>,
    }),

  deleteSlot: (facilityId: string, slotId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/facilities/${facilityId}/slots/${slotId}`, {
      method: 'DELETE',
    }),

  addService: (facilityId: string, name: string, category?: string) =>
    apiFetch<{ success: boolean; data: FacilityService }>(`/facilities/${facilityId}/services`, {
      method: 'POST',
      body: { name, category } as unknown as Record<string, unknown>,
    }),

  deleteService: (facilityId: string, serviceId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/facilities/${facilityId}/services/${serviceId}`, {
      method: 'DELETE',
    }),
};

// ─── Doctors API (FR-13) ──────────────────────────────────────────────────────

export const doctorsApi = {
  search: (params?: {
    specialty?: string;
    facilityId?: string;
    district?: string;
    isAvailable?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.specialty) query.set('specialty', params.specialty);
    if (params?.facilityId) query.set('facilityId', params.facilityId);
    if (params?.district) query.set('district', params.district);
    if (params?.isAvailable !== undefined) query.set('isAvailable', String(params.isAvailable));
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return apiFetch<{ success: boolean; data: { doctors: DoctorSearchResult[]; total: number; limit: number; offset: number } }>(`/doctors?${query.toString()}`);
  },

  getSpecialties: () =>
    apiFetch<{ success: boolean; data: string[] }>('/doctors/specialties'),
};

// ─── Appointments API ─────────────────────────────────────────────────────────

export const appointmentsApi = {
  list: (params?: { patientId?: string; doctorId?: string; facilityId?: string; status?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.doctorId) query.set('doctorId', params.doctorId);
    if (params?.facilityId) query.set('facilityId', params.facilityId);
    if (params?.status) query.set('status', params.status);
    if (params?.date) query.set('date', params.date);
    return apiFetch<{ success: boolean; data: Appointment[] }>(`/appointments?${query.toString()}`);
  },

  getById: (id: string) =>
    apiFetch<{ success: boolean; data: Appointment }>(`/appointments/${id}`),

  create: (body: { patientId?: string; facilityId: string; doctorId?: string; type?: string; appointmentDate: string; slot?: string; notes?: string }) =>
    apiFetch<{ success: boolean; data: Appointment; message: string }>('/appointments', { method: 'POST', body }),

  getPatientQueue: (id: string) =>
    apiFetch<{ success: boolean; data: PatientQueueStatus }>(`/appointments/${id}/queue`),

  getFacilityQueue: (params: { facilityId: string; doctorId?: string; date?: string }) => {
    const query = new URLSearchParams();
    query.set('facilityId', params.facilityId);
    if (params.doctorId) query.set('doctorId', params.doctorId);
    if (params.date) query.set('date', params.date);
    return apiFetch<{ success: boolean; data: FacilityQueueStatus }>(`/appointments/queue/status?${query.toString()}`);
  },

  callNextPatient: (body: { facilityId: string; doctorId?: string }) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/appointments/queue/call-next', {
      method: 'POST',
      body,
    }),

  reschedule: (id: string, body: { newDate: string; newSlot: string; newDoctorId?: string }) =>
    apiFetch<{ success: boolean; data: Appointment; message: string }>(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body,
    }),

  cancel: (id: string, reason?: string) =>
    apiFetch<{ success: boolean; data: Appointment; message: string }>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: { reason },
    }),

  rebook: (id: string, body: { newDate: string; newSlot: string; newDoctorId?: string }) =>
    apiFetch<{ success: boolean; data: Appointment; message: string }>(`/appointments/${id}/rebook`, {
      method: 'POST',
      body,
    }),

  updateStatus: (id: string, status: string) =>
    apiFetch<{ success: boolean; data: Appointment; message: string }>(`/appointments/${id}/status`, { method: 'PATCH', body: { status } }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/appointments/${id}`, { method: 'DELETE' }),
};

// ─── Prescriptions API ────────────────────────────────────────────────────────

export const prescriptionsApi = {
  list: (params?: { patientId?: string; doctorId?: string; facilityId?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.doctorId) query.set('doctorId', params.doctorId);
    if (params?.facilityId) query.set('facilityId', params.facilityId);
    return apiFetch<{ success: boolean; data: Prescription[] }>(`/prescriptions?${query.toString()}`);
  },

  getById: (id: string) =>
    apiFetch<{ success: boolean; data: Prescription }>(`/prescriptions/${id}`),

  create: (body: {
    patientId: string;
    doctorId?: string;
    facilityId: string;
    diagnosis: string;
    advice?: string;
    followUpDate?: string;
    items: Array<{ medicineName: string; dosage: string; duration: string; frequency?: string; instructions?: string; inStock?: boolean }>;
  }) =>
    apiFetch<{ success: boolean; data: Prescription; message: string }>('/prescriptions', { method: 'POST', body }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/prescriptions/${id}`, { method: 'DELETE' }),
};

// ─── Referrals API ────────────────────────────────────────────────────────────

export const referralsApi = {
  list: (params?: { patientId?: string; fromFacilityId?: string; toFacilityId?: string; status?: string; priority?: string; district?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.fromFacilityId) query.set('fromFacilityId', params.fromFacilityId);
    if (params?.toFacilityId) query.set('toFacilityId', params.toFacilityId);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.district) query.set('district', params.district);
    return apiFetch<{ success: boolean; data: Referral[] }>(`/referrals?${query.toString()}`);
  },

  getById: (id: string) =>
    apiFetch<{ success: boolean; data: Referral }>(`/referrals/${id}`),

  create: (body: {
    patientId: string;
    fromFacilityId: string;
    toFacilityId: string;
    reason: string;
    requiredSpecialty?: string;
    priority?: string;
    notes?: string;
  }) =>
    apiFetch<{ success: boolean; data: Referral; message: string }>('/referrals', { method: 'POST', body }),

  updateStatus: (id: string, status: string) =>
    apiFetch<{ success: boolean; data: Referral; message: string }>(`/referrals/${id}/status`, { method: 'PATCH', body: { status } }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/referrals/${id}`, { method: 'DELETE' }),
};

// ─── Doorstep Triage API ──────────────────────────────────────────────────────

export const triageApi = {
  list: (params?: { patientId?: string; assessedById?: string; facilityId?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.assessedById) query.set('assessedById', params.assessedById);
    if (params?.facilityId) query.set('facilityId', params.facilityId);
    if (params?.priority) query.set('priority', params.priority);
    return apiFetch<{ success: boolean; data: TriageAssessment[] }>(`/triage?${query.toString()}`);
  },

  create: (body: {
    patientId?: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    village?: string;
    facilityId?: string;
    bpSystolic?: number;
    bpDiastolic?: number;
    spo2?: number;
    temperature?: number;
    pulse?: number;
    symptoms?: string[];
    isPregnant?: boolean;
    notes?: string;
  }) =>
    apiFetch<{ success: boolean; data: TriageAssessment; message: string }>('/triage', { method: 'POST', body }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/triage/${id}`, { method: 'DELETE' }),
};

// ─── Maternal & Child Health (MCH) API ────────────────────────────────────────

export const mchApi = {
  list: (params?: { healthWorkerId?: string; facilityId?: string; riskLevel?: string }) => {
    const query = new URLSearchParams();
    if (params?.healthWorkerId) query.set('healthWorkerId', params.healthWorkerId);
    if (params?.facilityId) query.set('facilityId', params.facilityId);
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    return apiFetch<{ success: boolean; data: MchRecord[] }>(`/mch?${query.toString()}`);
  },

  create: (body: {
    patientId?: string;
    healthWorkerId?: string;
    facilityId?: string;
    motherName: string;
    age?: number;
    village?: string;
    edd?: string;
    trimester?: string;
    riskLevel?: string;
    ancCount?: number;
    hemoglobin?: number;
    ifaDelivered?: boolean;
    notes?: string;
  }) =>
    apiFetch<{ success: boolean; data: MchRecord; message: string }>('/mch', { method: 'POST', body }),

  update: (id: string, body: Partial<MchRecord>) =>
    apiFetch<{ success: boolean; data: MchRecord; message: string }>(`/mch/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/mch/${id}`, { method: 'DELETE' }),
};

// ─── Diagnostic Reports API ───────────────────────────────────────────────────

export const diagnosticReportsApi = {
  list: (params?: { patientId?: string; facilityId?: string; doctorId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.patientId) query.set('patientId', params.patientId);
    if (params?.facilityId) query.set('facilityId', params.facilityId);
    if (params?.doctorId) query.set('doctorId', params.doctorId);
    if (params?.status) query.set('status', params.status);
    return apiFetch<{ success: boolean; data: DiagnosticReport[] }>(`/diagnostics/reports?${query.toString()}`);
  },

  create: (body: {
    patientId: string;
    facilityId: string;
    doctorId?: string;
    testName: string;
    category?: string;
    status?: string;
    sampleCollectedAt?: string;
    keyResult: string;
    findings?: string;
    normalRange?: string;
    verifiedBy?: string;
  }) =>
    apiFetch<{ success: boolean; data: DiagnosticReport; message: string }>('/diagnostics/reports', { method: 'POST', body }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/diagnostics/reports/${id}`, { method: 'DELETE' }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

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
  category?: string;
  isActive?: boolean;
}

export interface FacilitySlot {
  id: string;
  facilityId: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  isAvailable: boolean;
  status?: string;
}

export interface AvailabilityMatrix {
  facilityId: string;
  facilityName: string;
  facilityType: FacilityType;
  district: string;
  village: string | null;
  workingHours: string | null;
  beds: {
    total: number;
    available: number;
    oxygenTotal: number;
    oxygenAvailable: number;
    icuTotal: number;
    icuAvailable: number;
    statusText: string;
  };
  doctors: Array<{
    id: string;
    fullName: string;
    specialty: string;
    qualification: string;
    isAvailable: boolean;
    status: string;
  }>;
  diagnostics: Array<{
    id: string;
    testName: string;
    category: string | null;
    isAvailable: boolean;
    turnaroundHours: number;
    costInr: number;
    status: string;
  }>;
  medicines: Array<{
    id: string;
    medicineName: string;
    category: string | null;
    quantity: number;
    unit: string;
    stockThreshold: number;
    isAvailable: boolean;
    status: string;
  }>;
  slots: Array<FacilitySlot>;
  summaryMatrix: Array<{
    item: string;
    category: 'DOCTOR' | 'DIAGNOSTIC' | 'MEDICINE' | 'BED' | 'SLOT';
    status: string;
    isAvailable: boolean;
  }>;
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
  bedStatus?: FacilityBedStatus | null;
  services?: FacilityService[];
  medicines?: FacilityMedicine[];
  diagnostics?: FacilityDiagnostic[];
  doctors?: DoctorProfile[];
  slots?: FacilitySlot[];
}

export interface DoctorProfile {
  id: string;
  userId: string;
  specialty: string | null;
  qualification: string | null;
  registrationNo: string | null;
  isAvailable?: boolean;
  facilityId?: string | null;
  facility?: Facility | null;
  user?: {
    fullName: string;
    email: string;
    phone?: string | null;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string | null;
  facilityId: string;
  type: 'IN_PERSON' | 'TELE_OPD';
  appointmentDate: string;
  slot: string;
  status: 'BOOKED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  token: string | null;
  notes: string | null;
  createdAt: string;
  facility?: Facility;
  doctor?: DoctorProfile | null;
  patient?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
      phone?: string | null;
    };
  };
}

export interface PrescriptionItem {
  id?: string;
  prescriptionId?: string;
  medicineName: string;
  dosage: string;
  duration: string;
  frequency?: string | null;
  instructions?: string | null;
  inStock: boolean;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  facilityId: string;
  diagnosis: string;
  advice: string | null;
  followUpDate: string | null;
  createdAt: string;
  items: PrescriptionItem[];
  facility?: Facility;
  doctor?: DoctorProfile;
  patient?: {
    id: string;
    user?: {
      fullName: string;
      email: string;
      phone?: string | null;
    };
  };
}

export interface Referral {
  id: string;
  patientId: string;
  fromFacilityId: string;
  toFacilityId: string;
  createdById: string;
  reason: string;
  requiredSpecialty: string | null;
  priority: 'ROUTINE' | 'URGENT' | 'HIGH' | 'CRITICAL';
  status: 'CREATED' | 'ACCEPTED' | 'BED_RESERVED' | 'PATIENT_ARRIVED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  fromFacility?: Facility;
  toFacility?: Facility;
  createdBy?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  patient?: {
    id: string;
    user?: {
      fullName: string;
      phone?: string | null;
    };
  };
}

export interface TriageAssessment {
  id: string;
  patientId: string | null;
  patientName: string;
  patientAge: number | null;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
  village: string | null;
  assessedById: string;
  facilityId: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  spo2: number | null;
  temperature: number | null;
  pulse: number | null;
  symptoms: string[];
  isPregnant: boolean;
  priority: 'ROUTINE' | 'MODERATE' | 'CRITICAL';
  actionTaken: string | null;
  notes: string | null;
  createdAt: string;
  facility?: Facility | null;
  assessedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface MchRecord {
  id: string;
  patientId: string | null;
  healthWorkerId: string | null;
  facilityId: string | null;
  motherName: string;
  age: number | null;
  village: string | null;
  edd: string | null;
  trimester: string | null;
  riskLevel: 'NORMAL' | 'HIGH_RISK';
  ancCount: number;
  hemoglobin: number | null;
  ifaDelivered: boolean;
  notes: string | null;
  createdAt: string;
  facility?: Facility | null;
  healthWorker?: {
    id: string;
    user?: {
      fullName: string;
      phone?: string | null;
    };
  } | null;
}

export interface DiagnosticReport {
  id: string;
  patientId: string;
  facilityId: string;
  doctorId: string | null;
  testName: string;
  category: string | null;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  sampleCollectedAt: string | null;
  keyResult: string;
  findings: string | null;
  normalRange: string | null;
  verifiedBy: string | null;
  createdAt: string;
  facility?: Facility;
  doctor?: DoctorProfile | null;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  patient?: {
    id: string;
    dateOfBirth: string | null;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | null;
    village: string | null;
    district: string | null;
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
  registrationProgress?: {
    currentStep: RegistrationStep;
  } | null;
  doctor?: DoctorProfile | null;
  healthWorker?: {
    id: string;
    workerType: string | null;
    villageArea: string | null;
    facilityId?: string | null;
    facility?: Facility | null;
  } | null;
  facilityAdmin?: {
    id: string;
    facilityId: string;
    facility?: Facility | null;
  } | null;
  districtAdmin?: {
    id: string;
    district: string;
  } | null;
}

export interface PatientStep1Body {
  dateOfBirth?: string;
  gender?: string;
  village?: string;
  district?: string;
  pincode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  abhaId?: string;
}

export interface PatientStep2Body {
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  notes?: string;
}

export interface DoctorSearchResult {
  id: string;
  userId: string;
  specialty: string | null;
  qualification: string | null;
  registrationNo: string | null;
  isAvailable: boolean;
  facilityId: string | null;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
  facility: {
    id: string;
    name: string;
    type: string;
    district: string;
    village: string | null;
    contactPhone: string | null;
    workingHours: string | null;
  } | null;
  rosterEntries?: Array<{
    shiftName: string;
    startTime: string;
    endTime: string;
    status: string;
  }>;
}

export interface PatientQueueStatus {
  appointmentId: string;
  yourToken: string;
  currentToken: string;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  status: string;
  doctorName: string;
  facilityName: string;
  slot?: string;
  appointmentDate?: string;
}

export interface FacilityQueueStatus {
  facilityId: string;
  doctorId?: string;
  date: string;
  currentToken: string;
  inProgressAppointment: any | null;
  metrics: {
    total: number;
    waiting: number;
    completed: number;
    cancelled: number;
  };
  queueList: Array<{
    id: string;
    token: string;
    slot: string;
    status: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    type: string;
  }>;
}

