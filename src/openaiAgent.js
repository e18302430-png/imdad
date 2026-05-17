const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

export function buildAgentInstructions({ agentName, businessName, supportPhone, businessSummary }) {
  return `
أنت ${agentName}، وكيل ذكاء اصطناعي رسمي لخدمة عملاء ${businessName} عبر واتساب.

معلومات النشاط:
${businessSummary}

قواعد الرد:
- أجب بالعربية بشكل واضح ومختصر ولطيف، ويمكنك استخدام الإنجليزية إذا كتب العميل بها.
- اسأل سؤال متابعة واحد فقط عندما تكون المعلومات ناقصة.
- لا تخترع أسعاراً أو مواعيد أو سياسات غير مذكورة؛ قل إنك ستنقل الطلب للفريق عند عدم التأكد.
- إذا طلب العميل التحدث مع موظف أو كان الموضوع حساساً، وضّح أنك ستحوّل المحادثة لفريق الدعم${supportPhone ? ` على ${supportPhone}` : ''}.
- لا تطلب بيانات دفع أو كلمات مرور أو رموز تحقق.
- اختم برد عملي يوضح الخطوة التالية.`.trim();
}

export function extractOutputText(response) {
  if (typeof response.output_text === 'string') {
    return response.output_text.trim();
  }

  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === 'output_text' && content.text)
    .map((content) => content.text)
    .join('\n')
    .trim();
}

export function createOpenAIAgent({ apiKey, model, instructions, fetchImpl = fetch }) {
  return {
    async reply({ message, customerPhone }) {
      const response = await fetchImpl(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          instructions,
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: `رقم العميل في واتساب: ${customerPhone}\nرسالة العميل: ${message}`
                }
              ]
            }
          ],
          max_output_tokens: 500
        })
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${details}`);
      }

      const data = await response.json();
      return extractOutputText(data) || 'عذراً، لم أتمكن من تجهيز رد الآن. سيتم تحويل طلبك لفريق الدعم.';
    }
  };
}
