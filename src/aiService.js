import OpenAI from "openai";

// إنشاء عميل OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * تحليل البيانات بـ AI
 * @param {Object} formData - بيانات النموذج
 * @returns {String} - التقرير من AI
 */
export async function analyzeProjectWithAI(formData) {
  try {
    const prompt = `
أنت مهندس استشاري متخصص في المشاريع التقنية.

حلّل هذا المشروع وأعطني تقرير احترافي:

**البيانات:**
- اسم الشركة: ${formData.company_name}
- نوع المشروع: ${formData.project_types}
- الهدف: ${formData.project_goal}
- المساحة: ${formData.area} م²
- الطوابق: ${formData.floors}
- حالة المبنى: ${formData.building_status}
- ارتفاع السقف: ${formData.ceiling_height}
- مستوى الأمان: ${formData.security_level}/5
- عدد الموظفين: ${formData.employees}

أعطني تقرير يتضمن:
1. ملخص المشروع
2. المتطلبات التقنية الرئيسية
3. المخاطر المحتملة
4. درجة التعقيد (سهل/متوسط/صعب)
5. التوصيات

اكتب التقرير بصيغة احترافية وواضحة.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("خطأ في التحليل:", error);
    throw new Error("فشل التحليل: " + error.message);
  }
}