import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const plain = 'Admin123!';
  const passwordHash = await bcrypt.hash(plain, 10);

  // upsert = crée si n’existe pas, sinon met à jour le hash et isActive
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true, role: Role.ADMIN, firstName: 'Admin', lastName: 'Demo' },
    create: {
      email,
      passwordHash,
      isActive: true,
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Demo',
    },
    select: { id: true, email: true, isActive: true, role: true },
  });

  console.log('✅ Admin seedé :', admin.email, '(password: Admin123!)');
}

main()
  .catch((e) => {
    console.error('Seed error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
