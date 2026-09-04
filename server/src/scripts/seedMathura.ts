import { prisma } from '../config/prisma';

async function main() {
  const f = await prisma.facility.findFirst({
    where: { district: 'Mathura' },
  });

  if (!f) {
    console.log('No facility in Mathura found.');
    return;
  }

  // Set Beds: 3 Available
  await prisma.facilityBedStatus.upsert({
    where: { facilityId: f.id },
    create: {
      facilityId: f.id,
      totalBeds: 10,
      availableBeds: 3,
      oxygenBedsTotal: 2,
      oxygenBedsAvailable: 1,
      icuBedsTotal: 0,
      icuBedsAvailable: 0,
    },
    update: {
      totalBeds: 10,
      availableBeds: 3,
    },
  });

  // Set Paracetamol: Available
  await prisma.facilityMedicine.upsert({
    where: {
      facilityId_medicineName: {
        facilityId: f.id,
        medicineName: 'Paracetamol',
      },
    },
    create: {
      facilityId: f.id,
      medicineName: 'Paracetamol',
      category: 'Analgesic',
      quantity: 150,
      unit: 'tablets',
      isAvailable: true,
    },
    update: {
      isAvailable: true,
      quantity: 150,
    },
  });

  // Set Blood Test: Available
  await prisma.facilityDiagnostic.upsert({
    where: {
      facilityId_testName: {
        facilityId: f.id,
        testName: 'Blood Test',
      },
    },
    create: {
      facilityId: f.id,
      testName: 'Blood Test',
      category: 'Pathology',
      isAvailable: true,
      turnaroundHours: 2,
      costInr: 0,
    },
    update: {
      isAvailable: true,
    },
  });

  // Set X-Ray: Unavailable
  await prisma.facilityDiagnostic.upsert({
    where: {
      facilityId_testName: {
        facilityId: f.id,
        testName: 'X-Ray',
      },
    },
    create: {
      facilityId: f.id,
      testName: 'X-Ray',
      category: 'Radiology',
      isAvailable: false,
      turnaroundHours: 24,
      costInr: 0,
    },
    update: {
      isAvailable: false,
    },
  });

  console.log('✓ Successfully synced PHC Mathura FR-07 resources in Supabase PostgreSQL!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
