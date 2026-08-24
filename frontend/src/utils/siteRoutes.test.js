import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateTab, pathForTab, resolveSitePath } from './siteRoutes.js';

test('resolves stable public service URLs', () => {
  assert.deepEqual(resolveSitePath('/du-thuyen'), { tab: 'cruises', params: {} });
  assert.deepEqual(resolveSitePath('/khach-san/hotel-123'), { tab: 'hotel-detail', params: { id: 'hotel-123' } });
  assert.equal(pathForTab('cruise-detail', { id: 'cruise 1' }), '/du-thuyen/cruise%201');
});

test('renders a custom 404 for an unknown URL', () => {
  assert.equal(resolveSitePath('/dia-chi-khong-ton-tai').tab, 'not-found');
});

test('keeps account and checkout routes out of search indexes', () => {
  assert.equal(isPrivateTab('profile'), true);
  assert.equal(isPrivateTab('booking'), true);
  assert.equal(isPrivateTab('hotels'), false);
});
