// استيراد المكتبة
const OpenAI = require("openai");
require("dotenv").config();

// إنشاء العميل
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// الدالة الرئيسية
async function analyzeProject(projectData) {
  try {
    // إرسال الطلب إلى AI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `
أنت مهندس استشاري متخصص في المشاريع التقنية.

حلّل هذا المشروع وأعطني:
1. ملخص المشروع
2. المتطلبات التقنية
3. المخاطر المحتملة
4. درجة التعقيد (سهل/متوسط/صعب)

البيانات:
${JSON.stringify(projectData, null, 2)}

أرجع الرد بصيغة مرتبة وواضحة.
`,
        },
      ],
      max_tokens: 1000,
    });

    // إرجاع النتيجة
    return response.choices[0].message.content;
  } catch (error) {
    console.error("خطأ:", error.message);
    return "حدث خطأ في التحليل";
  }
}

// اختبار البرنامج
const testProject = {
  name: "مشروع كاميرات",
  description: "500 كاميرا لمستودع",
  area: 20000,
  timeline: "90 يوم",
};

analyzeProject(testProject).then((result) => {
  console.log("التحليل:\n");
  console.log(result);
});