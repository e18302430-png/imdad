import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIAgent, extractOutputText } from '../src/openaiAgent.js';

test('extractOutputText reads the OpenAI output_text helper field', () => {
  assert.equal(extractOutputText({ output_text: ' أهلاً بك ' }), 'أهلاً بك');
});

test('extractOutputText reads output message content', () => {
  assert.equal(
    extractOutputText({
      output: [
        {
          content: [
            { type: 'output_text', text: 'مرحبا' },
            { type: 'refusal', refusal: 'no' }
          ]
        }
      ]
    }),
    'مرحبا'
  );
});

test('agent sends a Responses API request and returns text', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { output_text: 'تم استلام طلبك' };
      }
    };
  };

  const agent = createOpenAIAgent({
    apiKey: 'api-key',
    model: 'test-model',
    instructions: 'be helpful',
    fetchImpl
  });

  const reply = await agent.reply({ message: 'مرحبا', customerPhone: '15551234567' });

  assert.equal(reply, 'تم استلام طلبك');
  assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer api-key');
  assert.equal(JSON.parse(calls[0].options.body).model, 'test-model');
});
