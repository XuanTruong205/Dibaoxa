import assert from 'node:assert/strict';
import test from 'node:test';
import { makeCruiseAdminId, validateCruiseAdminStep } from './cruiseAdminValidation.js';

const validForm = () => ({
  name: 'Du thuyền Hạ Long', operator: 'Dibaoxa Cruises', destination: 'Hạ Long', departurePort: 'Cảng Tuần Châu',
  durationDays: 2, shipClass: 5, launchedYear: '', cabinCount: '', hullMaterial: 'Kim loại', route: '',
  cabins: [{ name: 'Deluxe', price: 4_500_000, units: 8 }], image: '/images/cruise.webp', galleryImages: '',
  features: [], itinerary: 'Ngày 1', policies: '', description: 'Mô tả hành trình hợp lệ.', faqs: [{ question: '', answer: '' }],
  firstDepartureDate: '2099-07-01', departureTime: '11:30', departureCount: 4, departureIntervalDays: 7,
});

test('rejects an incomplete FAQ before the create-cruise request is sent', () => {
  const form = validForm();
  form.faqs = [{ question: 'Giờ đi?', answer: '' }];
  assert.match(validateCruiseAdminStep(form, 2), /cả câu hỏi và câu trả lời/);
});

test('rejects list entries longer than the backend limit', () => {
  const form = validForm();
  form.policies = 'x'.repeat(301);
  assert.match(validateCruiseAdminStep(form, 2), /Chính sách, dòng 1/);
});

test('accepts a complete form across all four steps', () => {
  const form = validForm();
  assert.deepEqual([0, 1, 2, 3].map((step) => validateCruiseAdminStep(form, step)), ['', '', '', '']);
});

test('creates a unique backend-safe id from a long Vietnamese cruise name', () => {
  const id = makeCruiseAdminId(`Đại dương xanh ${'rất dài '.repeat(30)}`, 1_700_000_000_000);
  assert.match(id, /^cruise-dai-duong-xanh-/);
  assert.ok(id.length <= 120);
});
