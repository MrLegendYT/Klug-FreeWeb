import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editThemeCode = async (
  currentHtml: string,
  userPrompt: string,
  selectedElementContext?: string
): Promise<string> => {
  const systemInstruction = `
    You are an expert web developer and UI designer.
    Your task is to modify the provided HTML code based on the user's request.
    
    Rules:
    1. Return ONLY the full, valid, updated HTML code. 
    2. Do not include markdown backticks (e.g. \`\`\`html).
    3. Do not add explanations or conversational text.
    4. Maintain the existing style structure (inline styles or classes) unless asked to change them.
    5. If the user provided a specific selected element context, focus changes there but return the full document.
  `;

  let prompt = `
    Here is the current HTML:
    ${currentHtml}
    
    User Request: ${userPrompt}
  `;

  if (selectedElementContext) {
    prompt += `\n\nContext: The user specifically selected this element to modify: ${selectedElementContext}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    let result = response.text || currentHtml;
    // Clean up if the model accidentally included markdown
    result = result.replace(/^```html/, '').replace(/^```/, '').replace(/```$/, '');
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return original HTML on error so the app doesn't break
    return currentHtml;
  }
};