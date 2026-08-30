import { prisma } from '../config/prisma';
import { redisCache } from '../config/redis';
import { RegistrationStep, Gender } from '@prisma/client';

export interface PatientStep1Input {
  userId: string;
  dateOfBirth?: string;  // ISO date string
  gender?: Gender;
  village?: string;
  district?: string;
  pincode?: string;
  abhaId?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface PatientStep2Input {
  userId: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  notes?: string;
}

export const profileService = {
  /**
   * Upsert Patient demographics (Step 1 of patient profile completion).
   */
  async savePatientStep1(input: PatientStep1Input) {
    const { userId, dateOfBirth, gender, village, district, pincode, abhaId, bloodGroup, emergencyContactName, emergencyContactPhone } = input;

    // Validate and parse date safely
    let parsedDob: Date | undefined = undefined;
    if (dateOfBirth && dateOfBirth.trim()) {
      const d = new Date(dateOfBirth);
      if (!isNaN(d.getTime())) {
        parsedDob = d;
      }
    }

    // Validate gender enum
    const validGender = gender && Object.values(Gender).includes(gender) ? gender : null;

    const patient = await prisma.patient.upsert({
      where: { userId },
      create: {
        userId,
        dateOfBirth: parsedDob,
        gender: validGender,
        village: village?.trim() || null,
        district: district?.trim() || null,
        pincode: pincode?.trim() || null,
        abhaId: abhaId?.trim() || null,
        bloodGroup: bloodGroup?.trim() || null,
        emergencyContactName: emergencyContactName?.trim() || null,
        emergencyContactPhone: emergencyContactPhone?.trim() || null,
      },
      update: {
        dateOfBirth: parsedDob,
        gender: validGender,
        village: village?.trim() || null,
        district: district?.trim() || null,
        pincode: pincode?.trim() || null,
        abhaId: abhaId?.trim() || null,
        bloodGroup: bloodGroup?.trim() || null,
        emergencyContactName: emergencyContactName?.trim() || null,
        emergencyContactPhone: emergencyContactPhone?.trim() || null,
      },
    });

    // Advance registration step if currently on earlier steps
    await prisma.registrationProgress.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: RegistrationStep.PROFILE_STEP_1,
      },
      update: {
        currentStep: RegistrationStep.PROFILE_STEP_1,
      },
    });

    // Invalidate Redis caches so fresh profile is reflected everywhere
    await Promise.all([
      redisCache.del(`user:profile:${userId}`),
      redisCache.del(`user:identity:${userId}`),
    ]).catch(() => {});

    return patient;
  },

  /**
   * Upsert MedicalHistory (Step 2 of patient profile completion).
   */
  async savePatientStep2(input: PatientStep2Input) {
    const { userId, allergies, chronicConditions, currentMedications, notes } = input;

    // Ensure Patient record exists (in case Step 1 was skipped)
    const patient = await prisma.patient.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const medicalHistory = await prisma.medicalHistory.upsert({
      where: { patientId: patient.id },
      create: {
        patientId: patient.id,
        allergies: (allergies ?? []).map(a => a.trim()).filter(Boolean),
        chronicConditions: (chronicConditions ?? []).map(c => c.trim()).filter(Boolean),
        currentMedications: (currentMedications ?? []).map(m => m.trim()).filter(Boolean),
        notes: notes?.trim() || null,
      },
      update: {
        allergies: (allergies ?? []).map(a => a.trim()).filter(Boolean),
        chronicConditions: (chronicConditions ?? []).map(c => c.trim()).filter(Boolean),
        currentMedications: (currentMedications ?? []).map(m => m.trim()).filter(Boolean),
        notes: notes?.trim() || null,
      },
    });

    // Advance registration step to COMPLETE
    await prisma.registrationProgress.upsert({
      where: { userId },
      create: {
        userId,
        currentStep: RegistrationStep.COMPLETE,
      },
      update: {
        currentStep: RegistrationStep.COMPLETE,
      },
    });

    // Activate user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    // Invalidate Redis caches
    await Promise.all([
      redisCache.del(`user:profile:${userId}`),
      redisCache.del(`user:identity:${userId}`),
    ]).catch(() => {});

    return medicalHistory;
  },

  /**
   * Get the full profile for the currently authenticated user with Redis caching.
   */
  async getProfile(userId: string) {
    const cacheKey = `user:profile:${userId}`;
    const cached = await redisCache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: { include: { medicalHistory: true } },
        doctor: true,
        healthWorker: true,
        registrationProgress: true,
      },
    });

    if (profile) {
      await redisCache.set(cacheKey, profile, 900); // 15 min TTL
    }

    return profile;
  },
};
