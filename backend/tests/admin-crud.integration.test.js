import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  deleteUser,
  updatePackage,
  updateStaff,
  updateUser,
} from '../src/services/adminService.js';

const fixture = {
  actorId: randomUUID(),
  userId: randomUUID(),
  packageId: randomUUID(),
  staffId: randomUUID(),
};

describe.sequential('admin editable entities', () => {
  beforeAll(async () => {
    await prisma.user.createMany({ data: [
      { id: fixture.actorId, email: `crud-admin-${randomUUID()}@example.com`, password_hash: await bcrypt.hash('StrongPass123!', 4), full_name: 'CRUD Admin', role: 'admin' },
      { id: fixture.userId, email: `crud-user-${randomUUID()}@example.com`, password_hash: await bcrypt.hash('StrongPass123!', 4), full_name: 'Old Customer', role: 'customer' },
    ] });
    await prisma.travelPackage.create({ data: { id: fixture.packageId, title: 'Old Package', destination: 'Hue', duration: '2N1D', price: 1_000_000 } });
    await prisma.staffDirectory.create({ data: { id: fixture.staffId, full_name: 'Old Staff', job_title: 'Guide', phone: '0905123456', assigned_hotel: 'Hue', status: 'active' } });
  });

  afterAll(async () => {
    await prisma.staffDirectory.deleteMany({ where: { id: fixture.staffId } });
    await prisma.travelPackage.deleteMany({ where: { id: fixture.packageId } });
    await prisma.user.deleteMany({ where: { id: { in: [fixture.userId, fixture.actorId] } } });
  });

  it('updates packages and staff instead of forcing delete-and-recreate', async () => {
    const travelPackage = await updatePackage(fixture.packageId, {
      title: 'Updated Package', destination: 'Da Nang', duration: '3N2D', price: 2_500_000, included: ['Hotel'], status: 'inactive',
    });
    const staff = await updateStaff(fixture.staffId, {
      full_name: 'Updated Staff', email: 'updated-staff@example.com', job_title: 'Senior Guide', phone: '0905999999', assigned_hotel: 'Da Nang', status: 'inactive',
    });
    expect(travelPackage).toMatchObject({ title: 'Updated Package', included: ['Hotel'], status: 'inactive' });
    expect(staff).toMatchObject({ full_name: 'Updated Staff', status: 'inactive' });
  });

  it('updates and safely deletes a customer account', async () => {
    const actor = { userId: fixture.actorId, role: 'admin' };
    const user = await updateUser(actor, fixture.userId, { full_name: 'Updated Customer', phone: '0905888888', role: 'customer' });
    expect(user).toMatchObject({ full_name: 'Updated Customer', phone: '0905888888' });

    await expect(deleteUser(actor, fixture.actorId)).rejects.toMatchObject({ code: 'CANNOT_DELETE_SELF' });
    await expect(deleteUser(actor, fixture.userId)).resolves.toEqual({ id: fixture.userId });
    expect(await prisma.user.findUnique({ where: { id: fixture.userId } })).toBeNull();
  });
});
