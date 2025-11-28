import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all users from the database...');

  // Delete Payment records first to avoid foreign key constraints if cascade isn't set up (though schema usually handles it, explicit is safer)
  try {
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`- Deleted ${deletedPayments.count} payment records.`);
  } catch (e) {
    console.log('  (No payments table or error deleting payments, continuing...)');
  }

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`- Deleted ${deletedUsers.count} users.`);

  console.log('✨ Database cleared.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

