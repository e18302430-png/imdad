import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredKeys = [
  'OPENAI_API_KEY',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN'
];

export function loadDotEnv(filePath = resolve(process.cwd(), '.env'), env = process.env) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    if (env[key] === undefined) {
      env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    }
  }
}

export function getConfig(env = process.env) {
  const config = {
    port: Number(env.PORT || 3000),
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL || 'gpt-4.1-mini',
    whatsappAccessToken: env.WHATSAPP_ACCESS_TOKEN,
    whatsappPhoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    whatsappVerifyToken: env.WHATSAPP_VERIFY_TOKEN,
    agentName: env.AGENT_NAME || 'Imdad Assistant',
    businessName: env.BUSINESS_NAME || 'Imdad',
    supportPhone: env.SUPPORT_PHONE || '',
    businessSummary: env.BUSINESS_SUMMARY || 'مساعد ذكي يجيب عن الاستفسارات ويرتب الطلبات الأولية.'
  };

  const missing = requiredKeys.filter((key) => !env[key]);
  return { config, missing };
}

export function assertConfig(configResult = getConfig()) {
  if (configResult.missing.length > 0) {
    throw new Error(`Missing required environment variables: ${configResult.missing.join(', ')}`);
  }

  return configResult.config;
}
