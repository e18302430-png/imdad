const WHATSAPP_API_VERSION = 'v21.0';

export function verifyWebhook(query, verifyToken) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return { ok: true, challenge };
  }

  return { ok: false };
}

export function extractTextMessages(payload) {
  const messages = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      for (const message of change.value?.messages || []) {
        if (message.type !== 'text' || !message.text?.body || !message.from) {
          continue;
        }

        messages.push({
          from: message.from,
          id: message.id,
          text: message.text.body
        });
      }
    }
  }

  return messages;
}

export async function sendWhatsAppText({ accessToken, phoneNumberId, to, text, fetchImpl = fetch }) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const response = await fetchImpl(url, {
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
        body: text.slice(0, 4096)
      }
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${details}`);
  }

  return response.json();
}
