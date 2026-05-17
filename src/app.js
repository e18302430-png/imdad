import http from 'node:http';
import { URL } from 'node:url';
import { config } from './config.js';
import { OpenAiAgent } from './openaiAgent.js';
import { extractIncomingMessages, sendWhatsAppText, verifyMetaSignature } from './whatsapp.js';

export function createApp({ agent = new OpenAiAgent(), sendMessage = sendWhatsAppText } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      return sendJson(res, 200, { ok: true, service: 'imdad-whatsapp-ai-agent' });
    }

    if (req.method === 'GET' && url.pathname === '/webhooks/whatsapp') {
      return handleWebhookVerification(url, res);
    }

    if (req.method === 'POST' && url.pathname === '/webhooks/whatsapp') {
      return handleWebhookEvent(req, res, agent, sendMessage);
    }

    return sendJson(res, 404, { error: 'Not Found' });
  });
}

function handleWebhookVerification(url, res) {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken && challenge) {
    return sendText(res, 200, challenge);
  }

  return sendText(res, 403, 'Forbidden');
}

async function handleWebhookEvent(req, res, agent, sendMessage) {
  const rawBody = await readBody(req);

  if (config.whatsapp.verifySignature) {
    const valid = verifyMetaSignature(rawBody, req.headers['x-hub-signature-256']);
    if (!valid) return sendText(res, 403, 'Forbidden');
  }

  const payload = parseJson(rawBody);
  if (!payload) return sendJson(res, 400, { error: 'Invalid JSON' });

  const incomingMessages = extractIncomingMessages(payload);
  sendText(res, 200, 'OK');

  Promise.all(
    incomingMessages.map(async (message) => {
      const answer = await agent.reply(message.from, message.text);
      await sendMessage(message.from, answer);
    })
  ).catch((error) => {
    console.error('Failed to process WhatsApp webhook event', error);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseJson(buffer) {
  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch {
    return null;
  }
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}
