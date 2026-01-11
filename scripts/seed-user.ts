import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

async function main() {
  const defaultUsername = process.env.DEFAULT_USERNAME || 'admin';
  const defaultPassword = process.env.DEFAULT_PASSWORD || 'admin123';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: defaultUsername },
    });

    if (existingUser) {
      console.log(`✅ User "${defaultUsername}" already exists`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: defaultUsername,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    console.log('✅ Default user created successfully!');
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('\n⚠️  Please change the default password after first login!');
  } catch (error) {
    console.error('Error creating default user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
