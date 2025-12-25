
import { GoogleGenAI, Type } from "@google/genai";
import { GradeLevel, MathTopic, MathQuestion } from "./types";

export const generateMathQuestion = async (
  grade: GradeLevel,
  topic: MathTopic,
  difficulty: number
): Promise<MathQuestion> => {
  // Check for API Key presence
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing. If you are on Vercel, add it to Environment Variables. If you are in AI Studio, refresh the preview.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-3-pro-preview for complex math reasoning
  const modelName = "gemini-3-pro-preview";
  
  const prompt = `Generate a unique multiple-choice math question for Grade ${grade} students on the topic of ${topic}. 
  The difficulty level is ${difficulty}/10 (1 is basic, 10 is very advanced). 
  Respond with a JSON object containing:
  - question (string)
  - options (array of 4 strings)
  - correctAnswerIndex (number 0-3)
  - explanation (string)`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 4,
              maxItems: 4
            },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("The AI returned an empty response.");
    
    // Clean potential markdown wrap just in case
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    return {
      ...data,
      id: Math.random().toString(36).substring(7),
      difficulty
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate math problem. Please try again.");
  }
};
