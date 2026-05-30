import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function analyzeProjectWithAI(formData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `أنت مهندس استشاري متخصص في المشاريع التقنية.
حلّل هذا المشروع وأعطني تقرير احترافي:

- اسم الشركة: ${formData.company_name}
- نوع المشروع: ${formData.project_types}
- الهدف: ${formData.project_goal}
- المساحة: ${formData.area} م²
- الطوابق: ${formData.floors}
- حالة المبنى: ${formData.building_status}
- ارتفاع السقف: ${formData.ceiling_height}
- مستوى الأمان: ${formData.security_level}/5
- عدد الموظفين: ${formData.employees}

أعطني:
1. ملخص المشروع
2. المتطلبات التقنية
3. المخاطر المحتملة
4. درجة التعقيد (سهل/متوسط/صعب)
5. التوصيات`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Error:", error);
    throw new Error("فشل التحليل: " + error.message);
  }
}