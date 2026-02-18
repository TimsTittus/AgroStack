import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateInventoryDescription(inventoryData: any[]) {
    console.log("Generating inventory description for data:", JSON.stringify(inventoryData, null, 2));
  const prompt = `
You are an agricultural inventory analyst.

Write a short description with 3 lines or 4 lines of this farmer's inventory in Malayalam.

Instructions:
- Use clear and natural Malayalam.
- Include total crops and quantities.
- Explain each crop.
- Provide profitability insights.
- Give market observations.
- Suggest ways to improve revenue.

Inventory Data:
${JSON.stringify(inventoryData, null, 2)}
`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: "You must respond only in Malayalam language."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.4,
  });

  return completion.choices[0]?.message?.content || "";
}
