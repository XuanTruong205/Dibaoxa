import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully via Prisma.');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}
