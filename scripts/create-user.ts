import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: npx tsx scripts/create-user.ts <username> <password>');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.error(`Error: User "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    console.log('✅ User created successfully!');
    console.log(`   Username: ${user.username}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt}`);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
