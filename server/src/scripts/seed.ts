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
    // If user already exists in auth, retrieve them
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const found = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (!found) {
      throw new Error(`Failed to create/find Supabase auth user for ${cleanEmail}: ${createError.message}`);
    }
    userId = found.id;
    // Update password to ensure it matches
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
  const superAdmin = await seedUser({
    email: 'superadmin@swasthya.gov.in',
    password: 'SuperAdmin@123',
    fullName: 'Dr. Rajesh Sharma (Director Health Services)',
    phone: '9800000001',
    role: UserRole.SUPER_ADMIN,
  });
  console.log(`   Super Admin ready: ${superAdmin.email}`);

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
    {
      name: 'Nashik District Civil Hospital',
      type: FacilityType.DISTRICT_HOSPITAL,
      district: 'Nashik',
      village: 'Nashik City',
      address: 'Trimbak Road, Nashik',
      pincode: '422002',
      latitude: new Prisma.Decimal(19.9975),
      longitude: new Prisma.Decimal(73.7898),
      contactPhone: '0253-2572000',
      contactEmail: 'civil.nashik@swasthya.gov.in',
      workingHours: '24x7 Multi-Specialty & ICU',
      bedStatus: { totalBeds: 200, availableBeds: 28, oxygenBedsTotal: 50, oxygenBedsAvailable: 10, icuBedsTotal: 20, icuBedsAvailable: 3 },
      services: ['General Surgery', 'Obstetrics & Gynecology', 'Pediatrics', 'Orthopedics', 'Dialysis Center', '24x7 Pharmacy'],
      medicines: [
        { medicineName: 'Paracetamol 500mg', category: 'Analgesic', quantity: 3000, unit: 'strips', isAvailable: true },
        { medicineName: 'Anti-Rabies Vaccine', category: 'Immunization', quantity: 100, unit: 'vials', isAvailable: true },
      ],
      diagnostics: [
        { testName: 'Digital Chest X-Ray', category: 'Radiology', isAvailable: true, turnaroundHours: 1, costInr: 0 },
        { testName: 'Ultrasonography (USG)', category: 'Radiology', isAvailable: true, turnaroundHours: 3, costInr: 0 },
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

  // ─── 4. Facility Admins ─────────────────────────────────────────────────────
  console.log('👨‍💼 Seeding Facility Admins...');

  const ambegaonFacilityId = createdFacilities['Primary Health Centre (PHC) Ambegaon'];
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

  const aundhFacilityId = createdFacilities['Aundh District Civil Hospital'];
  const adminAundh = await seedUser({
    email: 'admin.aundh@swasthya.gov.in',
    password: 'FacilityAdmin@123',
    fullName: 'Dr. Ramesh Deshmukh (Hospital Administrator)',
    phone: '9800000005',
    role: UserRole.FACILITY_ADMIN,
  });
  if (aundhFacilityId) {
    await prisma.facilityAdmin.upsert({
      where: { userId: adminAundh.id },
      create: { userId: adminAundh.id, facilityId: aundhFacilityId },
      update: { facilityId: aundhFacilityId },
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
  await prisma.doctor.upsert({
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

  const doctor2 = await seedUser({
    email: 'dr.patil@swasthya.gov.in',
    password: 'Doctor@123',
    fullName: 'Dr. Sunita Patil',
    phone: '9800000007',
    role: UserRole.DOCTOR,
  });
  await prisma.doctor.upsert({
    where: { userId: doctor2.id },
    create: {
      userId: doctor2.id,
      specialty: 'Obstetrics & Maternal Care',
      qualification: 'MBBS, DGO',
      registrationNo: 'MMC-2018-49281',
      facilityId: ambegaonFacilityId,
    },
    update: {
      specialty: 'Obstetrics & Maternal Care',
      qualification: 'MBBS, DGO',
      registrationNo: 'MMC-2018-49281',
      facilityId: ambegaonFacilityId,
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
  await prisma.healthWorker.upsert({
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

  console.log('✅ [SEED]: Database seeding completed successfully!');
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
