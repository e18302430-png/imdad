import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  console.log(`WhatsApp AI agent listening on port ${config.port}`);
  if (config.publicBaseUrl) {
    console.log(`Webhook URL: ${config.publicBaseUrl}/webhooks/whatsapp`);
  }
});
