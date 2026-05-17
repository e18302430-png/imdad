import { config } from './config.js';

const MAX_HISTORY_MESSAGES = 12;
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

export class OpenAiAgent {
  constructor({ fetchImpl = fetch, model = config.openai.model, systemPrompt = config.agent.systemPrompt } = {}) {
    this.fetchImpl = fetchImpl;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.histories = new Map();
  }

  getHistory(userId) {
    return this.histories.get(userId) || [];
  }

  remember(userId, role, content) {
    const history = [...this.getHistory(userId), { role, content }].slice(-MAX_HISTORY_MESSAGES);
    this.histories.set(userId, history);
    return history;
  }

  buildInput(userId, userMessage) {
    const history = this.getHistory(userId);
    return [
      ...history.map((message) => ({
        role: message.role,
        content: message.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];
  }

  async reply(userId, userMessage) {
    if (!config.openai.apiKey) throw new Error('Missing OPENAI_API_KEY');

    const response = await this.fetchImpl(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        instructions: this.systemPrompt,
        input: this.buildInput(userId, userMessage)
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI response failed with ${response.status}: ${body}`);
    }

    const data = await response.json();
    const text = extractOutputText(data) || 'عذرًا، لم أتمكن من إنشاء رد الآن. حاول مرة أخرى بعد قليل.';

    this.remember(userId, 'user', userMessage);
    this.remember(userId, 'assistant', text);
    return text;
  }
}

export function extractOutputText(response) {
  if (typeof response?.output_text === 'string') return response.output_text.trim();

  const output = response?.output || [];
  return output
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('\n')
    .trim();
}
