import { randomUUID } from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ENV } from '../src/config/env.js';
import { prisma } from '../src/config/db.js';
import { processSepayWebhook, verifySepayApiKey } from '../src/services/paymentService.js';
import { serializeTravelOrder } from '../src/services/travelOrderService.js';
import { buildVietQrImageUrl } from '../src/services/vietqrService.js';

const previous = {};
const webhookId = `test-${Date.now()}`;
const successWebhookId = `test-success-${Date.now()}`;
const userEmail = `vietqr-${Date.now()}@example.com`;

beforeAll(() => {
  for (const key of ['VIETQR_BANK_ID', 'VIETQR_ACCOUNT_NO', 'VIETQR_ACCOUNT_NAME', 'SEPAY_WEBHOOK_API_KEY']) previous[key] = ENV[key];
  Object.assign(ENV, {
    VIETQR_BANK_ID: 'MB',
    VIETQR_ACCOUNT_NO: '0099999999678',
    VIETQR_ACCOUNT_NAME: 'LAM XUAN TRUONG',
    SEPAY_WEBHOOK_API_KEY: 'test-webhook-secret',
  });
});

afterAll(async () => {
  await prisma.bankWebhookEvent.deleteMany({ where: { provider_transaction_id: { in: [webhookId, successWebhookId] } } });
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (user) {
    const orders = await prisma.travelOrder.findMany({ where: { user_id: user.id }, select: { id: true } });
    await prisma.travelOrderPayment.deleteMany({ where: { order_id: { in: orders.map((order) => order.id) } } });
    await prisma.travelOrder.deleteMany({ where: { user_id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  Object.assign(ENV, previous);
});

describe('VietQR and SePay payment plumbing', () => {
  it('builds a dynamic MB VietQR URL with exact amount and reference', () => {
    const url = new URL(buildVietQrImageUrl({ amount: 3_850_000, transactionRef: 'DBXABC123' }));
    expect(url.hostname).toBe('img.vietqr.io');
    expect(url.pathname).toContain('/MB-0099999999678-compact2.png');
    expect(url.searchParams.get('amount')).toBe('3850000');
    expect(url.searchParams.get('addInfo')).toBe('DBXABC123');
  });

  it('uses a constant-time compatible API-key header format', () => {
    expect(verifySepayApiKey('Apikey test-webhook-secret')).toBe(true);
    expect(verifySepayApiKey('Apikey wrong')).toBe(false);
  });

  it('lets Admin serialize existing VietQR travel orders when bank settings are unavailable', () => {
    const configured = {
      VIETQR_BANK_ID: ENV.VIETQR_BANK_ID,
      VIETQR_ACCOUNT_NO: ENV.VIETQR_ACCOUNT_NO,
      VIETQR_ACCOUNT_NAME: ENV.VIETQR_ACCOUNT_NAME,
    };
    Object.assign(ENV, { VIETQR_BANK_ID: '', VIETQR_ACCOUNT_NO: '', VIETQR_ACCOUNT_NAME: '' });
    try {
      const payment = { payment_method: 'VietQR', amount: 1_000_000, transaction_ref: 'DBXUNCONFIGURED' };
      const serialized = serializeTravelOrder({
        id: 'order-without-vietqr-config',
        order_code: 'DBX-ORDER',
        product_type: 'cruise',
        product_ref: 'cruise-id',
        title: 'Cruise order',
        summary: 'Summary',
        product_snapshot: '{}',
        traveler_name: 'Test User',
        traveler_email: 'test@example.com',
        traveler_phone: '0900000000',
        quantity: 1,
        unit_price: 1_000_000,
        total_price: 1_000_000,
        status: 'pending_payment',
        payment_expires_at: new Date(),
        earned_points: 0,
        payments: [payment],
      });
      expect(serialized.payment_qr).toBeNull();
      expect(serialized.payments).toEqual([payment]);
    } finally {
      Object.assign(ENV, configured);
    }
  });

  it('acknowledges and deduplicates an unmatched incoming webhook', async () => {
    const payload = {
      id: webhookId,
      gateway: 'MBBank',
      transactionDate: '2026-08-14 12:00:00',
      accountNumber: '0099999999678',
      code: 'DBXDOESNOTEXIST',
      content: 'DBXDOESNOTEXIST',
      transferType: 'in',
      description: 'Test transfer',
      transferAmount: 1000,
      referenceCode: 'TEST-REFERENCE',
    };
    const first = await processSepayWebhook(payload, 'Apikey test-webhook-secret');
    expect(first).toMatchObject({ matched: false, reason: 'PAYMENT_NOT_FOUND' });
    const duplicate = await processSepayWebhook(payload, 'Apikey test-webhook-secret');
    expect(duplicate).toMatchObject({ matched: false, already_processed: true, status: 'unmatched' });
  });

  it('confirms a pending travel order only when amount and reference match', async () => {
    const user = await prisma.user.create({ data: { email: userEmail, password_hash: 'test', full_name: 'VietQR Test' } });
    const order = await prisma.travelOrder.create({
      data: {
        order_code: `DBX-TEST-${Date.now()}`,
        client_request_id: randomUUID(),
        user_id: user.id,
        product_type: 'cruise',
        product_ref: 'test-cruise',
        title: 'Test cruise',
        summary: 'Webhook settlement test',
        product_snapshot: '{}',
        traveler_name: 'VietQR Test',
        traveler_email: userEmail,
        traveler_phone: '0900000000',
        quantity: 1,
        unit_price: 3_850_000,
        total_price: 3_850_000,
        payment_expires_at: new Date(Date.now() + 600_000),
      },
    });
    await prisma.travelOrderPayment.create({
      data: { order_id: order.id, amount: 3_850_000, payment_method: 'VietQR', transaction_ref: 'DBXTESTSUCCESS' },
    });

    const result = await processSepayWebhook({
      id: successWebhookId,
      gateway: 'MBBank',
      transactionDate: '2026-08-14 12:00:00',
      accountNumber: '0099999999678',
      code: 'DBXTESTSUCCESS',
      content: 'DBXTESTSUCCESS',
      transferType: 'in',
      description: 'Payment DBXTESTSUCCESS',
      transferAmount: 3_850_000,
      referenceCode: 'MB-TEST-SUCCESS',
    }, 'Apikey test-webhook-secret');

    expect(result).toMatchObject({ matched: true, kind: 'travel_order', transaction_ref: 'DBXTESTSUCCESS' });
    const paid = await prisma.travelOrderPayment.findUnique({ where: { transaction_ref: 'DBXTESTSUCCESS' } });
    const confirmed = await prisma.travelOrder.findUnique({ where: { id: order.id } });
    expect(paid.status).toBe('completed');
    expect(confirmed.status).toBe('confirmed');
  });
});
