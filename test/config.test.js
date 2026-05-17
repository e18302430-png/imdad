import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfig } from '../src/config.js';

test('getConfig reports missing required environment variables', () => {
  const { missing } = getConfig({});

  assert.deepEqual(missing, [
    'OPENAI_API_KEY',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_VERIFY_TOKEN'
  ]);
});

test('getConfig builds defaults and custom values', () => {
  const { config, missing } = getConfig({
    OPENAI_API_KEY: 'openai-key',
    WHATSAPP_ACCESS_TOKEN: 'whatsapp-token',
    WHATSAPP_PHONE_NUMBER_ID: 'phone-id',
    WHATSAPP_VERIFY_TOKEN: 'verify-token',
    PORT: '8080',
    BUSINESS_NAME: 'My Shop'
  });

  assert.deepEqual(missing, []);
  assert.equal(config.port, 8080);
  assert.equal(config.openaiModel, 'gpt-4.1-mini');
  assert.equal(config.businessName, 'My Shop');
});
