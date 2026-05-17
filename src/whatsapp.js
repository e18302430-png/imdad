import crypto from 'node:crypto';
import { config } from './config.js';

export function verifyMetaSignature(rawBody, signatureHeader, appSecret = config.whatsapp.appSecret) {
  if (!appSecret) return false;
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = signatureHeader.slice('sha256='.length);

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function extractIncomingMessages(payload) {
  const entries = payload?.entry || [];
  return entries.flatMap((entry) =>
    (entry.changes || []).flatMap((change) => {
      const value = change.value || {};
      const metadata = value.metadata || {};
      return (value.messages || [])
        .filter((message) => message.type === 'text' && message.text?.body)
        .map((message) => ({
          id: message.id,
          from: message.from,
          text: message.text.body,
          timestamp: message.timestamp,
          phoneNumberId: metadata.phone_number_id
        }));
    })
  );
}

export async function sendWhatsAppText(to, text, options = {}) {
  const accessToken = options.accessToken || config.whatsapp.accessToken;
  const phoneNumberId = options.phoneNumberId || config.whatsapp.phoneNumberId;
  const graphApiVersion = options.graphApiVersion || config.whatsapp.graphApiVersion;
  const fetchImpl = options.fetchImpl || fetch;

  if (!accessToken) throw new Error('Missing WHATSAPP_ACCESS_TOKEN');
  if (!phoneNumberId) throw new Error('Missing WHATSAPP_PHONE_NUMBER_ID');

  const response = await fetchImpl(`https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp send failed with ${response.status}: ${body}`);
  }

  return response.json();
}
