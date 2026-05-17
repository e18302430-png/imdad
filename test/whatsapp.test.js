import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTextMessages, sendWhatsAppText, verifyWebhook } from '../src/whatsapp.js';

test('verifyWebhook returns challenge for a valid token', () => {
  const result = verifyWebhook(
    {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'secret-token',
      'hub.challenge': 'challenge-value'
    },
    'secret-token'
  );

  assert.deepEqual(result, { ok: true, challenge: 'challenge-value' });
});

test('verifyWebhook rejects invalid token', () => {
  const result = verifyWebhook(
    {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'challenge-value'
    },
    'secret-token'
  );

  assert.deepEqual(result, { ok: false });
});

test('extractTextMessages extracts only WhatsApp text messages', () => {
  const messages = extractTextMessages({
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: '15551234567',
                  id: 'wamid.text',
                  type: 'text',
                  text: { body: 'مرحبا' }
                },
                {
                  from: '15557654321',
                  id: 'wamid.image',
                  type: 'image',
                  image: { id: 'image-id' }
                }
              ]
            }
          }
        ]
      }
    ]
  });

  assert.deepEqual(messages, [
    {
      from: '15551234567',
      id: 'wamid.text',
      text: 'مرحبا'
    }
  ]);
});

test('sendWhatsAppText posts a truncated text body to the Graph API', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { messages: [{ id: 'wamid.reply' }] };
      }
    };
  };

  const result = await sendWhatsAppText({
    accessToken: 'token',
    phoneNumberId: 'phone-number-id',
    to: '15551234567',
    text: 'أ'.repeat(5000),
    fetchImpl
  });

  assert.deepEqual(result, { messages: [{ id: 'wamid.reply' }] });
  assert.equal(calls[0].url, 'https://graph.facebook.com/v21.0/phone-number-id/messages');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
  assert.equal(JSON.parse(calls[0].options.body).text.body.length, 4096);
});
