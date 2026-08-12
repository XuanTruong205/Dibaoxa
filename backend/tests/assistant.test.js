import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { buildOpenAiRequestBody, getOpenAiFallbackReason } from '../src/services/assistantService.js';

describe('customer travel assistant', () => {
  it('builds a valid OpenAI Responses API request without an undefined safety identifier', () => {
    const body = buildOpenAiRequestBody({
      message: 'Tư vấn cho tôi chuyến đi Đà Nẵng',
      history: [{ role: 'user', content: 'Tôi đi cùng gia đình' }],
      hotels: [],
      packages: [],
      cruises: [],
      profile: { destinations: ['Đà Nẵng'] },
      safetyIdentifier: undefined,
    });

    expect(body.model).toEqual(expect.any(String));
    expect(body.instructions).toContain('Bạn là Vi');
    expect(body.input).toContain('Khách hỏi: Tư vấn cho tôi chuyến đi Đà Nẵng');
    expect(body.reasoning).toEqual({ effort: 'low' });
    expect(body.text).toEqual({ verbosity: 'low' });
    expect(body.store).toBe(false);
    expect(body).not.toHaveProperty('messages');
    expect(body).not.toHaveProperty('safety_identifier');
  });

  it('reports exhausted OpenAI credit without exposing a generic integration error', () => {
    expect(getOpenAiFallbackReason(new Error('OpenAI request failed with 429 (credit_balance_exhausted)')))
      .toContain('Hạn mức OpenAI API đã hết');
  });

  it('rejects an empty message', async () => {
    const response = await request(app).post('/api/v1/assistant/chat').send({ message: '' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns grounded recommendations and quick follow ups', async () => {
    const response = await request(app)
      .post('/api/v1/assistant/chat')
      .send({ message: 'Tôi muốn nghỉ gần biển cùng gia đình', history: [] });

    expect(response.status).toBe(200);
    expect(response.body.data.answer).toEqual(expect.any(String));
    expect(response.body.data.answer.length).toBeGreaterThan(20);
    expect(response.body.data.suggestions.length).toBeGreaterThan(0);
    expect(response.body.data.matches.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data.matches.every((item) => typeof item.name === 'string' && typeof item.city === 'string')).toBe(true);
    expect(response.body.data.profile.intents).toEqual(expect.arrayContaining(['beach', 'family']));
    expect(response.body.data.answer).not.toContain('Chào bạn');
    expect(['local', 'ai']).toContain(response.body.data.mode);
  });
});
