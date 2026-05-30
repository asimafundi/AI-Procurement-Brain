const API_URL = "http://localhost:3004/api/analyze-project";

/**
 * إرسال بيانات المشروع إلى الـ Backend
 */
export const analyzeProjectWithAI = async (data) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // 🚨 إذا السيرفر رجع خطأ (404 / 500)
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server Error Response:", errorText);

      throw new Error(
        `فشل الاتصال بالسيرفر (HTTP ${response.status})`
      );
    }

    // 📦 نحاول قراءة الرد كـ JSON
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("❌ الرد ليس JSON:", text);

      throw new Error(
        "السيرفر لم يرجع بيانات صحيحة (JSON غير صالح)"
      );
    }

  } catch (error) {
    console.error("AI Service Error:", error);

    throw new Error(
      error.message || "حدث خطأ أثناء تحليل المشروع"
    );
  }
};