import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const mustChangePassword = process.argv[4] === 'true' || process.argv[4] === '--must-change';

  if (!username || !password) {
    console.error('Usage: npx tsx scripts/create-user.ts <username> <password> [--must-change]');
    process.exit(1);
  }

  // Allow shorter passwords if mustChangePassword is true (they'll be changed anyway)
  const minPasswordLength = mustChangePassword ? 4 : 6;
  if (password.length < minPasswordLength) {
    console.error(`Error: Password must be at least ${minPasswordLength} characters`);
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
        mustChangePassword,
      },
      select: {
        id: true,
        username: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    console.log('✅ User created successfully!');
    console.log(`   Username: ${user.username}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Must Change Password: ${user.mustChangePassword}`);
    console.log(`   Created: ${user.createdAt}`);
  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
