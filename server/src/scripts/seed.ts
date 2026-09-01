import { supabaseAdmin } from '../config/supabase';
import { prisma } from '../config/prisma';
import { UserRole, RegistrationStep, FacilityType, Prisma } from '@prisma/client';

async function seedUser(input: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}) {
  const { email, password = "Password@123", fullName, phone, role } = input;
  const cleanEmail = email.trim().toLowerCase();

  let userId: string;

  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const found = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (!found) {
      throw new Error(`Failed to create/find Supabase auth user for ${cleanEmail}: ${createError.message}`);
    }
    userId = found.id;
    await supabaseAdmin.auth.admin.updateUserById(userId, { password });
  } else {
    userId = createData.user.id;
  }

  const user = await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: cleanEmail,
      fullName,
      phone: phone || null,
      role,
      status: 'ACTIVE',
    },
    update: {
      fullName,
      phone: phone || null,
      role,
      status: 'ACTIVE',
    },
  });

  await prisma.registrationProgress.upsert({
    where: { userId: user.id },
    create: { userId: user.id, currentStep: RegistrationStep.COMPLETE },
    update: { currentStep: RegistrationStep.COMPLETE },
  });

  return user;
}

export async function runSeed() {
  console.log('🌱 [SEED]: Starting Swasthya Sahayak seed process...');

  // ─── 1. Super Admin ─────────────────────────────────────────────────────────
  console.log('👑 Seeding Super Admin...');
  await seedUser({
    email: 'superadmin@swasthya.gov.in',
    password: 'SuperAdmin@123',
    fullName: 'Dr. Rajesh Sharma (Director Health Services)',
    phone: '9800000001',
    role: UserRole.SUPER_ADMIN,
  });

  // ─── 2. District Admins ─────────────────────────────────────────────────────
  console.log('🏛️ Seeding District Admins...');
  const dhoPune = await seedUser({
    email: 'dho.pune@swasthya.gov.in',
    password: 'DistrictAdmin@123',
    fullName: 'Dr. Vivek Gaikwad (DHO Pune)',
    phone: '9800000002',
    role: UserRole.DISTRICT_ADMIN,
  });
  await prisma.districtAdmin.upsert({
    where: { userId: dhoPune.id },
    create: { userId: dhoPune.id, district: 'Pune' },
    update: { district: 'Pune' },
  });

  const dhoNashik = await seedUser({
    email: 'dho.nashik@swasthya.gov.in',
    password: 'DistrictAdmin@123',
    fullName: 'Dr. Sneha Jadhav (DHO Nashik)',
    phone: '9800000003',
    role: UserRole.DISTRICT_ADMIN,
  });
  await prisma.districtAdmin.upsert({
    where: { userId: dhoNashik.id },
    create: { userId: dhoNashik.id, district: 'Nashik' },
    update: { district: 'Nashik' },
  });

  // ─── 3. Facilities Network (Maharashtra) ────────────────────────────────────
  console.log('🏥 Seeding Facilities, Beds, Medicines, and Diagnostics...');

  const facilitiesData = [
    {
      name: 'Primary Health Centre (PHC) Ambegaon',
      type: FacilityType.PHC,
      district: 'Pune',
      village: 'Ambegaon',
      address: 'Main Chowk, Village Ambegaon, Taluka Haveli',
      pincode: '411046',
      latitude: new Prisma.Decimal(18.4529),
      longitude: new Prisma.Decimal(73.8370),
      contactPhone: '020-24381001',
      contactEmail: 'phc.ambegaon@swasthya.gov.in',
      workingHours: '24x7 Emergency / 09:00 - 17:00 OPD',
      bedStatus: { totalBeds: 12, availableBeds: 5, oxygenBedsTotal: 4, oxygenBedsAvailable: 2, icuBedsTotal: 0, icuBedsAvailable: 0 },
      services: ['General Consultation', 'Maternal & Child Health', 'Emergency Triage', 'Immunization / Vaccination', 'Basic Pathology'],
      medicines: [
        { medicineName: 'Paracetamol 500mg', category: 'Analgesic', quantity: 450, unit: 'strips', isAvailable: true },
        { medicineName: 'Amoxicillin 500mg', category: 'Antibiotic', quantity: 180, unit: 'strips', isAvailable: true },
        { medicineName: 'ORS Sachets', category: 'Electrolyte', quantity: 300, unit: 'packets', isAvailable: true },
        { medicineName: 'Iron & Folic Acid (IFA)', category: 'Maternal Supplement', quantity: 600, unit: 'strips', isAvailable: true },
        { medicineName: 'Amlodipine 5mg', category: 'Antihypertensive', quantity: 80, unit: 'strips', isAvailable: true },
      ],
      diagnostics: [
        { testName: 'Complete Blood Count (CBC)', category: 'Pathology', isAvailable: true, turnaroundHours: 4, costInr: 0 },
        { testName: 'Rapid Malaria Antigen', category: 'Pathology', isAvailable: true, turnaroundHours: 1, costInr: 0 },
        { testName: 'Blood Sugar (FBS / PPBS)', category: 'Biochemistry', isAvailable: true, turnaroundHours: 2, costInr: 0 },
        { testName: 'Urine Routine & Micro', category: 'Pathology', isAvailable: true, turnaroundHours: 3, costInr: 0 },
      ],
    },
    {
      name: 'Community Health Centre (CHC) Junnar',
      type: FacilityType.CHC,
      district: 'Pune',
      village: 'Junnar',
      address: 'Near Fort Road, Junnar',
      pincode: '410502',
      latitude: new Prisma.Decimal(19.2081),
      longitude: new Prisma.Decimal(73.8765),
      contactPhone: '02132-222104',
      contactEmail: 'chc.junnar@swasthya.gov.in',
      workingHours: '24x7 Emergency & Inpatient Care',
      bedStatus: { totalBeds: 30, availableBeds: 11, oxygenBedsTotal: 10, oxygenBedsAvailable: 4, icuBedsTotal: 4, icuBedsAvailable: 1 },
      services: ['Specialist OPD', 'Maternal & Delivery Care', 'Emergency Trauma Care', 'Radiology / X-Ray', 'Minor Surgery', 'Pharmacy'],
      medicines: [
        { medicineName: 'Paracetamol 500mg', category: 'Analgesic', quantity: 1200, unit: 'strips', isAvailable: true },
        { medicineName: 'Metformin 500mg', category: 'Antidiabetic', quantity: 500, unit: 'strips', isAvailable: true },
        { medicineName: 'Rabies Vaccine (ARV)', category: 'Immunization', quantity: 45, unit: 'vials', isAvailable: true },
        { medicineName: 'Anti-Snake Venom (ASV)', category: 'Emergency Antidote', quantity: 30, unit: 'vials', isAvailable: true },
        { medicineName: 'Ceftriaxone 1g Inj', category: 'Antibiotic', quantity: 120, unit: 'vials', isAvailable: true },
      ],
      diagnostics: [
        { testName: 'Digital Chest X-Ray', category: 'Radiology', isAvailable: true, turnaroundHours: 2, costInr: 0 },
        { testName: 'ECG 12-Lead', category: 'Cardiology', isAvailable: true, turnaroundHours: 1, costInr: 0 },
        { testName: 'Liver Function Test (LFT)', category: 'Biochemistry', isAvailable: true, turnaroundHours: 12, costInr: 0 },
        { testName: 'Kidney Function Test (KFT)', category: 'Biochemistry', isAvailable: true, turnaroundHours: 12, costInr: 0 },
      ],
    },
    {
      name: 'Aundh District Civil Hospital',
      type: FacilityType.DISTRICT_HOSPITAL,
      district: 'Pune',
      village: 'Aundh',
      address: 'Aundh Camp, Pune',
      pincode: '411027',
      latitude: new Prisma.Decimal(18.5601),
      longitude: new Prisma.Decimal(73.8055),
      contactPhone: '020-27282000',
      contactEmail: 'civil.aundh@swasthya.gov.in',
      workingHours: '24x7 Multi-Specialty & ICU',
      bedStatus: { totalBeds: 250, availableBeds: 42, oxygenBedsTotal: 60, oxygenBedsAvailable: 15, icuBedsTotal: 25, icuBedsAvailable: 6 },
      services: ['Multi-Specialty Consultation', 'ICU & Critical Care', 'Cardiology', 'Pediatrics', 'Obstetrics & Gynecology', 'Tele-OPD Hub', 'Blood Bank'],
      medicines: [
        { medicineName: 'Paracetamol 500mg', category: 'Analgesic', quantity: 5000, unit: 'strips', isAvailable: true },
        { medicineName: 'Insulin Glargine', category: 'Antidiabetic', quantity: 200, unit: 'vials', isAvailable: true },
        { medicineName: 'Atorvastatin 20mg', category: 'Cardiovascular', quantity: 800, unit: 'strips', isAvailable: true },
        { medicineName: 'Anti-Snake Venom (ASV)', category: 'Emergency Antidote', quantity: 150, unit: 'vials', isAvailable: true },
      ],
      diagnostics: [
        { testName: 'CT Scan Brain/Chest', category: 'Radiology', isAvailable: true, turnaroundHours: 6, costInr: 0 },
        { testName: 'Digital Chest X-Ray', category: 'Radiology', isAvailable: true, turnaroundHours: 1, costInr: 0 },
        { testName: 'Full Biochemical Panel', category: 'Biochemistry', isAvailable: true, turnaroundHours: 6, costInr: 0 },
        { testName: 'Blood Culture & Sensitivity', category: 'Microbiology', isAvailable: true, turnaroundHours: 48, costInr: 0 },
      ],
    },
  ];

  const createdFacilities: Record<string, string> = {};

  for (const fac of facilitiesData) {
    const existing = await prisma.facility.findFirst({ where: { name: fac.name } });
    let facilityId = existing?.id;

    if (!existing) {
      const created = await prisma.facility.create({
        data: {
          name: fac.name,
          type: fac.type,
          district: fac.district,
          village: fac.village,
          address: fac.address,
          pincode: fac.pincode,
          latitude: fac.latitude,
          longitude: fac.longitude,
          contactPhone: fac.contactPhone,
          contactEmail: fac.contactEmail,
          workingHours: fac.workingHours,
          bedStatus: { create: fac.bedStatus },
          services: { create: fac.services.map((s) => ({ name: s })) },
          medicines: { create: fac.medicines },
          diagnostics: { create: fac.diagnostics },
        },
      });
      facilityId = created.id;
    }

    createdFacilities[fac.name] = facilityId!;
  }

  const ambegaonFacilityId = createdFacilities['Primary Health Centre (PHC) Ambegaon'];
  const aundhFacilityId = createdFacilities['Aundh District Civil Hospital'];

  // ─── 4. Facility Admins ─────────────────────────────────────────────────────
  console.log('👨‍💼 Seeding Facility Admins...');
  const adminAmbegaon = await seedUser({
    email: 'admin.ambegaon@swasthya.gov.in',
    password: 'FacilityAdmin@123',
    fullName: 'Suresh More (Medical Superintendent)',
    phone: '9800000004',
    role: UserRole.FACILITY_ADMIN,
  });
  if (ambegaonFacilityId) {
    await prisma.facilityAdmin.upsert({
      where: { userId: adminAmbegaon.id },
      create: { userId: adminAmbegaon.id, facilityId: ambegaonFacilityId },
      update: { facilityId: ambegaonFacilityId },
    });
  }

  // ─── 5. Doctors ─────────────────────────────────────────────────────────────
  console.log('🩺 Seeding Doctors...');
  const doctor1 = await seedUser({
    email: 'doctor.pune@swasthya.gov.in',
    password: 'Doctor@123',
    fullName: 'Dr. Anand Kulkarni',
    phone: '9800000006',
    role: UserRole.DOCTOR,
  });
  const doc = await prisma.doctor.upsert({
    where: { userId: doctor1.id },
    create: {
      userId: doctor1.id,
      specialty: 'General Medicine & Tele-Triage',
      qualification: 'MBBS, MD (Medicine)',
      registrationNo: 'MMC-2015-84920',
      facilityId: aundhFacilityId,
    },
    update: {
      specialty: 'General Medicine & Tele-Triage',
      qualification: 'MBBS, MD (Medicine)',
      registrationNo: 'MMC-2015-84920',
      facilityId: aundhFacilityId,
    },
  });

  // ─── 6. Frontline Health Workers (ASHA) ────────────────────────────────────
  console.log('👩‍⚕️ Seeding ASHA & ANM Workers...');
  const asha1 = await seedUser({
    email: 'asha.ambegaon@swasthya.gov.in',
    password: 'AshaWorker@123',
    fullName: 'Savita Tai Shinde (ASHA Worker)',
    phone: '9800000008',
    role: UserRole.HEALTH_WORKER,
  });
  const hw = await prisma.healthWorker.upsert({
    where: { userId: asha1.id },
    create: {
      userId: asha1.id,
      workerType: 'ASHA',
      villageArea: 'Ambegaon & Haveli Sub-Centres',
      facilityId: ambegaonFacilityId,
    },
    update: {
      workerType: 'ASHA',
      villageArea: 'Ambegaon & Haveli Sub-Centres',
      facilityId: ambegaonFacilityId,
    },
  });

  // ─── 7. Citizen / Patient ──────────────────────────────────────────────────
  console.log('👤 Seeding Test Citizen / Patient...');
  const patientUser = await seedUser({
    email: 'patient.pune@swasthya.gov.in',
    password: 'Patient@123',
    fullName: 'Ramesh Tukaram Patil',
    phone: '9800000009',
    role: UserRole.PATIENT,
  });
  const pat = await prisma.patient.upsert({
    where: { userId: patientUser.id },
    create: {
      userId: patientUser.id,
      village: 'Ambegaon',
      district: 'Pune',
      state: 'Maharashtra',
      bloodGroup: 'B+',
      abhaId: '91-4029-8812-4419',
      facilityId: ambegaonFacilityId,
    },
    update: {
      village: 'Ambegaon',
      district: 'Pune',
      bloodGroup: 'B+',
      abhaId: '91-4029-8812-4419',
    },
  });

  // Seed initial live records if tables are empty
  const apptCount = await prisma.appointment.count();
  if (apptCount === 0 && pat && doc && ambegaonFacilityId) {
    console.log('📅 Seeding sample appointment...');
    await prisma.appointment.create({
      data: {
        patientId: pat.id,
        doctorId: doc.id,
        facilityId: ambegaonFacilityId,
        type: 'IN_PERSON',
        appointmentDate: new Date(),
        slot: '10:30 AM - 11:30 AM',
        status: 'CONFIRMED',
        token: 'Token #01',
        notes: 'Follow up checkup for seasonal pyrexia and vitals check',
      },
    });
  }

  const rxCount = await prisma.prescription.count();
  if (rxCount === 0 && pat && doc && ambegaonFacilityId) {
    console.log('💊 Seeding sample prescription...');
    await prisma.prescription.create({
      data: {
        patientId: pat.id,
        doctorId: doc.id,
        facilityId: ambegaonFacilityId,
        diagnosis: 'Acute Upper Respiratory Tract Infection',
        advice: 'Drink warm water and rest for 3 days',
        followUpDate: new Date(Date.now() + 5 * 86400000),
        items: {
          create: [
            { medicineName: 'Paracetamol 500mg', dosage: '1 tablet TDS', duration: '5 days', instructions: 'After food', inStock: true },
            { medicineName: 'Amoxicillin 500mg', dosage: '1 capsule BD', duration: '5 days', instructions: 'After food', inStock: true },
            { medicineName: 'ORS Sachets', dosage: '1 packet in 1L water', duration: '3 days', instructions: 'Throughout the day', inStock: true },
          ],
        },
      },
    });
  }

  const refCount = await prisma.referral.count();
  if (refCount === 0 && pat && ambegaonFacilityId && aundhFacilityId) {
    console.log('🔄 Seeding sample referral...');
    await prisma.referral.create({
      data: {
        patientId: pat.id,
        fromFacilityId: ambegaonFacilityId,
        toFacilityId: aundhFacilityId,
        createdById: doctor1.id,
        reason: 'Requires advanced chest imaging (CT) and pulmonology evaluation',
        requiredSpecialty: 'Pulmonology',
        priority: 'URGENT',
        status: 'BED_RESERVED',
        notes: 'Bed reserved in Inpatient Ward 4',
      },
    });
  }

  const triageCount = await prisma.triageAssessment.count();
  if (triageCount === 0 && pat && ambegaonFacilityId) {
    console.log('🩺 Seeding sample triage record...');
    await prisma.triageAssessment.create({
      data: {
        patientId: pat.id,
        patientName: patientUser.fullName,
        patientAge: 48,
        patientGender: 'MALE',
        village: 'Ambegaon',
        assessedById: asha1.id,
        facilityId: ambegaonFacilityId,
        bpSystolic: 135,
        bpDiastolic: 88,
        spo2: 97,
        temperature: new Prisma.Decimal(99.2),
        pulse: 78,
        symptoms: ['Fever', 'Mild Cough'],
        priority: 'ROUTINE',
        actionTaken: 'Assisted Tele-OPD consult initiated at Sub-Centre kiosk',
      },
    });
  }

  const mchCount = await prisma.mchRecord.count();
  if (mchCount === 0 && hw && ambegaonFacilityId) {
    console.log('🤰 Seeding sample MCH record...');
    await prisma.mchRecord.create({
      data: {
        healthWorkerId: hw.id,
        facilityId: ambegaonFacilityId,
        motherName: 'Pooja Santosh Gaikwad',
        age: 23,
        village: 'Ambegaon',
        edd: new Date(Date.now() + 45 * 86400000),
        trimester: '3rd Trimester',
        riskLevel: 'NORMAL',
        ancCount: 3,
        hemoglobin: new Prisma.Decimal(11.4),
        ifaDelivered: true,
        notes: '3 of 4 ANC checkups completed. Blood pressure normal.',
      },
    });
  }

  const diagCount = await prisma.diagnosticReport.count();
  if (diagCount === 0 && pat && ambegaonFacilityId) {
    console.log('🧪 Seeding sample diagnostic lab report...');
    await prisma.diagnosticReport.create({
      data: {
        patientId: pat.id,
        facilityId: ambegaonFacilityId,
        doctorId: doc ? doc.id : null,
        testName: 'Complete Blood Count (CBC)',
        category: 'Pathology',
        status: 'COMPLETED',
        sampleCollectedAt: new Date(),
        keyResult: 'Hemoglobin: 13.2 g/dL (Normal) | WBC: 7,400 /mcL',
        findings: 'Normal hemogram parameters. No active leukocytosis.',
        normalRange: 'Hb: 12.0 - 15.5 g/dL | WBC: 4,000 - 11,000 /mcL',
        verifiedBy: 'Dr. Anand Kulkarni (Medical Officer)',
      },
    });
  }

  console.log('✅ [SEED]: Database seeding completed successfully with live records!');
}

if (require.main === module) {
  runSeed()
    .catch((err) => {
      console.error('❌ [SEED ERROR]:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
