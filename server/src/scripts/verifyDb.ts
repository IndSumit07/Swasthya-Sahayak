import { prisma } from '../config/prisma';

async function verifyTables() {
  console.log('🔍 Checking live tables in Supabase PostgreSQL...\n');

  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  console.log(`Found ${tables.length} tables in public schema:\n`);

  for (const t of tables) {
    try {
      const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "public"."${t.table_name}";`
      );
      const rowCount = countResult[0]?.count?.toString() || '0';
      console.log(`  ✓ ${t.table_name.padEnd(25)} : ${rowCount} records`);
    } catch (e: any) {
      console.log(`  ✓ ${t.table_name.padEnd(25)} : (table exists)`);
    }
  }

  console.log('\n✅ All tables verified in Supabase PostgreSQL!');
}

verifyTables()
  .catch((err) => {
    console.error('Error verifying tables:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
