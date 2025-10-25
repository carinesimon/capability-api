import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = 'admin@example.com';
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        firstName: 'Admin',
      },
      create: {
        email,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
        firstName: 'Admin',
      },
    });

    console.log('✅ Admin prêt :', user.email, '/ Admin123!');
  } catch (e) {
    console.error('❌ Seed admin échoué:', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
