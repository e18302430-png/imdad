import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { extractIncomingMessages, verifyMetaSignature } from '../src/whatsapp.js';

test('extractIncomingMessages returns text messages from WhatsApp webhook payloads', () => {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: '12345' },
              messages: [
                {
                  id: 'wamid.1',
                  from: '15551234567',
                  timestamp: '1710000000',
                  type: 'text',
                  text: { body: 'مرحبا' }
                },
                {
                  id: 'wamid.2',
                  from: '15557654321',
                  timestamp: '1710000001',
                  type: 'image'
                }
              ]
            }
          }
        ]
      }
    ]
  };

  assert.deepEqual(extractIncomingMessages(payload), [
    {
      id: 'wamid.1',
      from: '15551234567',
      text: 'مرحبا',
      timestamp: '1710000000',
      phoneNumberId: '12345'
    }
  ]);
});

test('verifyMetaSignature validates the x-hub-signature-256 header', () => {
  const body = Buffer.from(JSON.stringify({ hello: 'world' }));
  const appSecret = 'secret';
  const digest = crypto.createHmac('sha256', appSecret).update(body).digest('hex');

  assert.equal(verifyMetaSignature(body, `sha256=${digest}`, appSecret), true);
  assert.equal(verifyMetaSignature(body, 'sha256=bad', appSecret), false);
});
