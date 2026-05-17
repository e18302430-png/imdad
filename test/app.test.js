import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.WHATSAPP_VERIFY_TOKEN = 'verify-token';
process.env.ENABLE_SIGNATURE_VERIFICATION = 'false';

const { createApp } = await import('../src/app.js');

async function withServer(app, callback) {
  await new Promise((resolve) => app.listen(0, resolve));
  const { port } = app.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await callback(baseUrl);
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }
}

test('GET /health returns service status', async () => {
  const app = createApp({ agent: {}, sendMessage: async () => ({}) });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, service: 'imdad-whatsapp-ai-agent' });
  });
});

test('GET /webhooks/whatsapp verifies Meta challenge tokens', async () => {
  const app = createApp({ agent: {}, sendMessage: async () => ({}) });

  await withServer(app, async (baseUrl) => {
    const goodUrl = new URL('/webhooks/whatsapp', baseUrl);
    goodUrl.search = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'verify-token',
      'hub.challenge': 'challenge-value'
    });

    const goodResponse = await fetch(goodUrl);
    assert.equal(goodResponse.status, 200);
    assert.equal(await goodResponse.text(), 'challenge-value');

    const badUrl = new URL('/webhooks/whatsapp', baseUrl);
    badUrl.search = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong-token',
      'hub.challenge': 'challenge-value'
    });

    const badResponse = await fetch(badUrl);
    assert.equal(badResponse.status, 403);
  });
});

test('POST /webhooks/whatsapp replies to incoming text messages', async () => {
  const sent = [];
  const app = createApp({
    agent: {
      reply: async (userId, text) => `Echo ${userId}: ${text}`
    },
    sendMessage: async (to, text) => {
      sent.push({ to, text });
      return { ok: true };
    }
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
                    }
                  ]
                }
              }
            ]
          }
        ]
      })
    });

    assert.equal(response.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(sent, [{ to: '15551234567', text: 'Echo 15551234567: مرحبا' }]);
  });
});
