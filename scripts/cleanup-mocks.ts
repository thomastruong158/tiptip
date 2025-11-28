import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up mock Stripe accounts...');
  
  const users = await prisma.user.findMany({
    where: {
      stripeAccountId: {
        startsWith: 'acct_MOCK'
      }
    }
  });

  console.log(`Found ${users.length} users with mock accounts.`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeAccountId: null,
        chargesEnabled: false
      }
    });
    console.log(`- Cleared mock account for user: ${user.username}`);
  }

  // Also specifically check 'aze' just in case
  const aze = await prisma.user.findUnique({ where: { username: 'aze' }});
  if (aze && aze.stripeAccountId?.startsWith('acct_MOCK')) {
      await prisma.user.update({
        where: { id: aze.id },
        data: { stripeAccountId: null, chargesEnabled: false }
      });
      console.log(`- Force cleared 'aze' account.`);
  }

  console.log('✨ Cleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

