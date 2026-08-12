import { prisma } from '../config/db.js';

function parseStringList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function listActivePackages({ destination, search } = {}) {
  const normalizedSearch = search?.trim();
  const packages = await prisma.travelPackage.findMany({
    where: {
      status: 'active',
      ...(destination && { destination }),
      ...(normalizedSearch && {
        OR: [
          { title: { contains: normalizedSearch } },
          { destination: { contains: normalizedSearch } },
          { duration: { contains: normalizedSearch } },
        ],
      }),
    },
    orderBy: [{ price: 'asc' }, { created_at: 'desc' }],
  });

  return packages.map((travelPackage) => ({
    ...travelPackage,
    included: parseStringList(travelPackage.included),
  }));
}
