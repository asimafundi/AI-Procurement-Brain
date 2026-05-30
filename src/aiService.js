export async function analyzeProjectWithAI(
  formData
) {
  try {

    const response = await fetch(
      "/api/analyze-project",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          formData,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "فشل التحليل"
      );
    }

    return data.analysis;

  } catch (error) {

    console.error(
      "AI Error:",
      error
    );

    throw new Error(
      "فشل التحليل: " +
      error.message
    );
  }
}