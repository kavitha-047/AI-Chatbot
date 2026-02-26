import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
});

export const getGeminiStreamResponse = async (prompt) => {
    try {
        if (!apiKey) {
            throw new Error("Gemini API Key is missing. Please check your .env file and ensure VITE_GEMINI_API_KEY is set.");
        }

        const systemInstruction = "You are a professional AI assistant. Provide helpful, concise, and accurate responses. Format code blocks clearly.\n\n";
        const result = await model.generateContentStream(systemInstruction + prompt);
        return result.stream;
    } catch (error) {
        console.error("Gemini Streaming Error:", error);
        throw error;
    }
};

export const getGeminiResponse = async (prompt) => {
    try {
        if (!apiKey) {
            throw new Error("Gemini API Key is missing. Please check your .env file and ensure VITE_GEMINI_API_KEY is set.");
        }

        const systemInstruction = "You are a professional AI assistant. Provide helpful, concise, and accurate responses.\n\n";
        const result = await model.generateContent(systemInstruction + prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
