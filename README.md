# Imdad WhatsApp AI Agent

وكيل ذكاء اصطناعي جاهز كبداية عملية للرد على رسائل واتساب تلقائياً باستخدام:

- **OpenAI Responses API** لتوليد ردود ذكية ومضبوطة بتعليمات نشاطك.
- **WhatsApp Cloud API** من Meta لاستقبال الرسائل وإرسال الردود عبر Webhook.
- **Node.js HTTP server** لتشغيل خادم الويب هوك بدون اعتماديات خارجية.

> ملاحظة: هذا المشروع لا يحتوي على مفاتيح فعلية. يجب إضافة مفاتيح OpenAI وMeta في ملف `.env` عند التشغيل.

## المتطلبات

- Node.js 20 أو أحدث.
- حساب OpenAI API ومفتاح `OPENAI_API_KEY`.
- تطبيق Meta Developers مفعّل عليه WhatsApp Cloud API.
- رقم WhatsApp Business أو رقم الاختبار من Meta.
- رابط عام HTTPS للويب هوك عند التجربة، مثل ngrok أو Cloudflare Tunnel أو خادم منشور.

## التشغيل المحلي

1. ثبّت الحزم:

   ```bash
   npm install
   ```

2. انسخ ملف البيئة وعدّل القيم:

   ```bash
   cp .env.example .env
   ```

3. شغّل الخادم:

   ```bash
   npm run dev
   ```

4. اختبر الصحة:

   ```bash
   curl http://localhost:3000/health
   ```

## ربط WhatsApp Cloud API

1. افتح لوحة Meta Developers ثم تطبيقك المرتبط بـ WhatsApp.
2. احصل على القيم التالية وضعها في `.env`:
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN`، وهي قيمة سرية تختارها أنت وتدخلها نفسها في إعدادات Webhook.
3. انشر الخادم أو افتح نفق HTTPS محلياً، ثم استخدم رابط الويب هوك:

   ```text
   https://YOUR_DOMAIN/webhook/whatsapp
   ```

4. في إعدادات Webhook لدى Meta، اشترك في حدث `messages`.
5. أرسل رسالة نصية إلى رقم WhatsApp Business، وسيقوم الخادم بالرد تلقائياً.

## تخصيص شخصية الوكيل

عدّل هذه القيم في `.env` لتخصيص الردود دون تغيير الكود:

```env
AGENT_NAME=Imdad Assistant
BUSINESS_NAME=Imdad
BUSINESS_SUMMARY=اكتب الخدمات والأسعار وساعات العمل وسياسة الحجز هنا.
SUPPORT_PHONE=+966500000000
```

تعليمات الوكيل موجودة في `src/openaiAgent.js`، ويمكن توسيعها لإضافة قواعد مثل:

- حجز موعد.
- تصنيف العملاء المحتملين.
- تحويل المحادثات الحساسة لموظف.
- الإجابة من قاعدة معرفة أو ملفات داخلية.

## نقاط النهاية

| الطريقة | المسار | الغرض |
| --- | --- | --- |
| `GET` | `/health` | فحص أن الخدمة تعمل. |
| `GET` | `/webhook/whatsapp` | تحقق Meta من الويب هوك عبر `hub.challenge`. |
| `POST` | `/webhook/whatsapp` | استقبال رسائل WhatsApp والرد عليها. |

## الاختبارات

```bash
npm test
```

## الأمان والتشغيل الإنتاجي

- لا تضع مفاتيح API داخل الكود أو Git.
- استخدم HTTPS دائماً في رابط الويب هوك.
- أضف تخزيناً للمحادثات إذا كنت تريد ذاكرة طويلة بين الرسائل.
- أضف تحقق توقيع طلبات Meta في الإنتاج إذا كان متاحاً في إعدادات تطبيقك.
- أضف مراقبة وسجلات مركزية عند النشر.
