import { prisma } from '../config/db.js';

export function listPublicTeam() {
  return prisma.staffDirectory.findMany({
    where: {
      status: 'active',
      is_public: true,
      photo_url: { not: null },
    },
    orderBy: [
      { display_order: 'asc' },
      { full_name: 'asc' },
    ],
    select: {
      id: true,
      full_name: true,
      job_title: true,
      assigned_hotel: true,
      photo_url: true,
      bio: true,
    },
  });
}
