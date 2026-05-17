# Imdad WhatsApp AI Agent

Imdad is a starter WhatsApp AI agent that receives WhatsApp Cloud API webhooks, sends each inbound text message to the OpenAI Responses API, and replies to the user through the official Meta Graph API.

## Features

- Dependency-free Node.js HTTP server with health check and WhatsApp webhook endpoints.
- Meta webhook verification endpoint for the `hub.challenge` flow.
- Optional `x-hub-signature-256` validation using your Meta app secret.
- Text-message extraction from WhatsApp Cloud API webhook payloads.
- OpenAI-powered replies with short in-memory conversation history per WhatsApp user.
- Unit and integration tests using Node's built-in test runner.

## Requirements

- Node.js 20 or newer.
- A Meta app with WhatsApp Cloud API enabled.
- A WhatsApp phone number ID and access token from Meta.
- An OpenAI API key.
- A public HTTPS URL for local development or production, such as a deployed app URL or an HTTPS tunnel.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Update `.env` with your real credentials before receiving live WhatsApp traffic.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port used by the Node.js HTTP app. |
| `PUBLIC_BASE_URL` | Public base URL shown in startup logs. |
| `WHATSAPP_VERIFY_TOKEN` | Random token you also enter in the Meta webhook configuration screen. |
| `WHATSAPP_ACCESS_TOKEN` | Meta Graph API token used to send WhatsApp messages. |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Cloud API phone number ID used in the `/messages` endpoint. |
| `WHATSAPP_APP_SECRET` | Meta app secret used to verify webhook signatures. |
| `WHATSAPP_GRAPH_API_VERSION` | Meta Graph API version, for example `v24.0`. |
| `OPENAI_API_KEY` | OpenAI API key used by the Responses API client. |
| `OPENAI_MODEL` | Model used for replies. Defaults to `gpt-5.4-mini`. |
| `AGENT_NAME` | Human-readable assistant name. |
| `AGENT_SYSTEM_PROMPT` | System instructions that control the assistant's tone and behavior. |
| `ENABLE_SIGNATURE_VERIFICATION` | Set to `false` only for local tests or temporary debugging. |

## WhatsApp setup

1. In Meta for Developers, configure your webhook callback URL as:

   ```text
   https://your-domain.example/webhooks/whatsapp
   ```

2. Enter the same verify token value you placed in `WHATSAPP_VERIFY_TOKEN`.
3. Subscribe the WhatsApp Business Account webhook to message events.
4. Keep `ENABLE_SIGNATURE_VERIFICATION=true` in production and set `WHATSAPP_APP_SECRET`.
5. Send a WhatsApp message to your connected business number. The app will respond after the OpenAI API creates an answer.

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Returns service health JSON. |
| `GET` | `/webhooks/whatsapp` | Handles Meta's webhook verification challenge. |
| `POST` | `/webhooks/whatsapp` | Receives WhatsApp webhook events and replies to inbound text messages. |

## Development commands

```bash
npm run dev
npm test
npm start
```

## Production notes

- Use a persistent store such as Redis or Postgres if you need durable conversation memory.
- Add idempotency by storing processed WhatsApp message IDs before running at scale.
- The WhatsApp 24-hour customer-service window and template-message rules still apply to outbound business messaging.
- Rotate Meta and OpenAI credentials regularly and never commit `.env`.
