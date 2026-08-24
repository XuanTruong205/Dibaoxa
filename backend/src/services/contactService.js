import { prisma } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

const publicFields = {
  id: true,
  name: true,
  service: true,
  status: true,
  created_at: true,
};

export async function createInquiry(input) {
  return prisma.contactInquiry.create({
    data: {
      ...input,
      email: input.email.toLowerCase(),
    },
    select: publicFields,
  });
}

export async function listInquiries({ page = 1, limit = 50, status } = {}) {
  const where = status ? { status } : {};
  const [items, total] = await Promise.all([
    prisma.contactInquiry.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactInquiry.count({ where }),
  ]);
  return { items, pagination: { page, limit, total } };
}

export async function updateInquiryStatus(id, status) {
  const existing = await prisma.contactInquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw httpError(404, 'Không tìm thấy yêu cầu liên hệ.', 'CONTACT_INQUIRY_NOT_FOUND');
  return prisma.contactInquiry.update({
    where: { id },
    data: {
      status,
      resolved_at: status === 'resolved' ? new Date() : null,
    },
  });
}
