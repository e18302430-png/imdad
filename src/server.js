import { createServer } from 'node:http';
import { URL } from 'node:url';
import { assertConfig, loadDotEnv } from './config.js';
import { buildAgentInstructions, createOpenAIAgent } from './openaiAgent.js';
import { extractTextMessages, sendWhatsAppText, verifyWebhook } from './whatsapp.js';

loadDotEnv();

const config = assertConfig();
const agent = createOpenAIAgent({
  apiKey: config.openaiApiKey,
  model: config.openaiModel,
  instructions: buildAgentInstructions(config)
});

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2 * 1024 * 1024) {
        request.destroy(new Error('Request body is too large'));
      }
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

async function processMessage(message) {
  try {
    const reply = await agent.reply({
      message: message.text,
      customerPhone: message.from
    });

    await sendWhatsAppText({
      accessToken: config.whatsappAccessToken,
      phoneNumberId: config.whatsappPhoneNumberId,
      to: message.from,
      text: reply
    });
  } catch (error) {
    console.error('Failed to process WhatsApp message', {
      messageId: message.id,
      from: message.from,
      error: error.message
    });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { ok: true, service: 'whatsapp-ai-agent' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/webhook/whatsapp') {
    const query = Object.fromEntries(url.searchParams.entries());
    const verification = verifyWebhook(query, config.whatsappVerifyToken);

    if (!verification.ok) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(verification.challenge);
    return;
  }

  if (request.method === 'POST' && url.pathname === '/webhook/whatsapp') {
    try {
      const body = await readJsonBody(request);
      const messages = extractTextMessages(body);

      response.writeHead(200);
      response.end('OK');

      await Promise.allSettled(messages.map(processMessage));
    } catch (error) {
      console.error('Invalid WhatsApp webhook payload', { error: error.message });
      sendJson(response, 400, { ok: false, error: 'Invalid JSON payload' });
    }
    return;
  }

  sendJson(response, 404, { ok: false, error: 'Not found' });
});

server.listen(config.port, () => {
  console.log(`WhatsApp AI agent is listening on port ${config.port}`);
});
