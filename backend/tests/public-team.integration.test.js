import { randomUUID } from 'crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';

const publicId = randomUUID();
const privateId = randomUUID();

describe.sequential('public team directory', () => {
  beforeAll(async () => {
    await prisma.staffDirectory.createMany({
      data: [
        {
          id: publicId,
          full_name: 'Nguyen Minh An',
          email: `public-team-${publicId}@example.com`,
          job_title: 'Travel advisor',
          phone: '0905123456',
          assigned_hotel: 'Ho Chi Minh City',
          photo_url: '/images/team/minh-an.webp',
          bio: 'Supports tailor-made journeys.',
          is_public: true,
          display_order: 2,
          status: 'active',
        },
        {
          id: privateId,
          full_name: 'Private Operator',
          email: `private-team-${privateId}@example.com`,
          job_title: 'Operator',
          phone: '0905999999',
          assigned_hotel: 'Ha Noi',
          photo_url: '/images/team/private.webp',
          is_public: false,
          status: 'active',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.staffDirectory.deleteMany({ where: { id: { in: [publicId, privateId] } } });
  });

  it('only exposes opted-in team profiles and never returns contact details', async () => {
    const response = await request(app).get('/api/v1/team').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ id: publicId, full_name: 'Nguyen Minh An' });
    expect(response.body.data[0]).not.toHaveProperty('is_public');
    expect(response.body.data[0]).not.toHaveProperty('email');
    expect(response.body.data[0]).not.toHaveProperty('phone');
  });
});
