import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('Vietnam flight search API', () => {
  it('reports provider configuration without exposing credentials', async () => {
    const response = await request(app).get('/api/v1/flights/status');

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      provider: 'serpapi',
      configured: expect.any(Boolean),
      live: expect.any(Boolean),
    });
    expect(response.body.data).not.toHaveProperty('clientId');
    expect(response.body.data).not.toHaveProperty('clientSecret');
  });

  it('returns the supported Vietnamese airport catalog', async () => {
    const response = await request(app).get('/api/v1/flights/airports');

    expect(response.status).toBe(200);
    expect(response.body.count).toBeGreaterThanOrEqual(20);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'HAN', city: 'Hà Nội' }),
      expect.objectContaining({ code: 'SGN', city: 'TP. Hồ Chí Minh' }),
      expect.objectContaining({ code: 'PQC', city: 'Kiên Giang' }),
    ]));
  });

  it('rejects identical origin and destination before contacting the provider', async () => {
    const response = await request(app).get('/api/v1/flights/search').query({
      origin: 'SGN',
      destination: 'SGN',
      departure_date: '2026-09-15',
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an airport outside the domestic catalog', async () => {
    const response = await request(app).get('/api/v1/flights/search').query({
      origin: 'SGN',
      destination: 'BKK',
      departure_date: '2026-09-15',
    });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('UNSUPPORTED_AIRPORT');
  });

  it('returns an explicit setup error when the SerpApi key is absent', async () => {
    const status = await request(app).get('/api/v1/flights/status');
    if (status.body.data.configured) return;

    const response = await request(app).get('/api/v1/flights/search').query({
      origin: 'SGN',
      destination: 'DAD',
      departure_date: '2026-09-15',
      non_stop: 'false',
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('FLIGHT_API_NOT_CONFIGURED');
    expect(response.body.message).toContain('SERPAPI_API_KEY');
  });
});
