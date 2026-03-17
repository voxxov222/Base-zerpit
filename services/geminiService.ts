import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SearchResult, DeepAnalysisResult, GraphData } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const isQuotaError = (e: any) => {
  const msg = e.toString().toLowerCase();
  const errMsg = e.message?.toLowerCase() || "";
  return msg.includes('429') || 
         errMsg.includes('429') || 
         e.status === 429 || 
         e.code === 429 ||
         errMsg.includes('quota') ||
         errMsg.includes('resource_exhausted');
};

// Retry Helper
async function retryWithDelay<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      const isQuota = isQuotaError(error);
      // If it's a quota error, wait longer (exponential backoff + extra buffer)
      const nextDelay = isQuota ? delay * 3 : delay * 2;
      
      console.warn(`Operation failed${isQuota ? ' (QUOTA)' : ''}, retrying in ${nextDelay}ms... (${retries} attempts left)`, error);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      return retryWithDelay(fn, retries - 1, nextDelay);
    }
    throw error;
  }
}

// Initial Discovery: Uses Flash 2.5 + Google Search
export const searchTopic = async (topic: string): Promise<SearchResult> => {
  const ai = getAI();
  
  // NOTE: Google Search Tool does not support responseMimeType: 'application/json'
  const systemInstruction = `You are a futuristic data retrieval system. 
  Your goal is to extract key information about the user's query and identify diverse, broad connections.
  Return the response in a structured JSON format with the following keys:
  - summary: string (max 3 sentences)
  - relatedTopics: Array<{ name: string, description: string }> (20-30 items, covering different angles, sub-disciplines, and related entities to create a dense network)
  Ensure the output is valid JSON only. Do not wrap in markdown code blocks.`;

  const execute = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Search for "${topic}". Provide a brief summary and a list of related key concepts with descriptions.`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: systemInstruction,
        },
      });
      return response;
  };

  try {
    const response = await retryWithDelay(execute);

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }
        data = JSON.parse(text);
    } catch (e) {
        console.warn("JSON Parse failed", text);
        data = { summary: text.substring(0, 300), relatedTopics: [] };
    }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links: { title: string; uri: string }[] = [];

    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        links.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });

    // Normalize data structure if model returns strings instead of objects
    const formattedTopics = (data.relatedTopics || []).map((t: any) => {
        if (typeof t === 'string') return { name: t, description: 'Related concept.' };
        return t;
    });

    return {
      summary: data.summary || "Summary unavailable.",
      relatedTopics: formattedTopics,
      links: links
    };

  } catch (error) {
    if (isQuotaError(error)) {
        console.warn("Quota exceeded caught in searchTopic. Returning fallback.");
        return {
            summary: "⚠️ SYSTEM ALERT: Neural Uplink Rate Limit Exceeded. The external knowledge matrix is currently saturated. Standby mode active.",
            relatedTopics: [
                { name: "BANDWIDTH_LIMIT", description: "API Rate limit reached (HTTP 429)." },
                { name: "RETRY_LATER", description: "Please wait 60 seconds before re-engaging." },
                { name: "SYSTEM_COOLDOWN", description: "Processing logic throttled to prevent overheating." }
            ],
            links: []
        };
    }
    console.error("Gemini Search Error:", error);
    throw error;
  }
};

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Detailed markdown analysis" },
    newConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING }
        }
      }
    }
  },
  required: ["analysis", "newConcepts"]
};

// Deep Dive: Uses Gemini 3 Pro + Thinking (with Fallback)
export const expandNodeDeep = async (topic: string, parentContext: string): Promise<DeepAnalysisResult> => {
  const ai = getAI();

  const prompt = `
    Analyze the concept "${topic}" specifically in the context of "${parentContext}".
    Provide a detailed, in-depth analysis (markdown supported).
    Identify 6-10 new, diverse sub-branches or deeper concepts to significantly expand the scope of the mind map.
    Include concepts from related fields, historical context, or future implications if applicable.
  `;

  const fallbackResult = {
      analysis: "⚠️ **CONNECTION INTERRUPTED**\n\nDeep analysis protocols suspended due to network congestion (429 Quota Exceeded). Please wait for the neural link to stabilize.",
      newConcepts: [
          { name: "CONNECTION_PAUSED", description: "Rate limit hit." },
          { name: "CACHED_PROTOCOL", description: "Using localized fallback logic." }
      ]
  };

  // 1. Try Premium Model
  try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 2048 },
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA
        }
      });
      const text = response.text || "{}";
      return JSON.parse(text) as DeepAnalysisResult;
  } catch (error) {
      if (isQuotaError(error)) return fallbackResult; // Fail fast for premium model quota
      console.warn("Pro Model failed, falling back to Flash:", error);
  }

  // 2. Fallback to Flash (with simple retry)
  try {
      return await retryWithDelay(async () => {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: ANALYSIS_SCHEMA
            }
          });
          const text = response.text || "{}";
          return JSON.parse(text) as DeepAnalysisResult;
      }, 1, 1000); // 1 retry for Flash
  } catch (error) {
      if (isQuotaError(error)) return fallbackResult;

      console.error("Deep Expansion completely failed", error);
      return {
          analysis: "System unable to establish deep neural link. Retrieval failed due to network instability.",
          newConcepts: []
      };
  }
};

export const askSystemArchitect = async (userQuery: string, currentContext: string): Promise<{ text: string; dataPayload?: GraphData }> => {
  const ai = getAI();
  const systemInstruction = `
    You are the "Architect", a hidden super-user AI embedded within the NeonMind application.
    Current App Context: ${currentContext}
    GENERATE NEW GRAPH DATA: If the user asks to "add" or "visualize" new nodes/connections, 
    return a JSON block at the end of your response with "nodes" and "links".
  `;

  const execute = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userQuery,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      return response;
  };

  try {
    const response = await retryWithDelay(execute);
    const fullText = response.text || "";
    let dataPayload: GraphData | undefined;
    const jsonMatch = fullText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const potentialData = JSON.parse(jsonMatch[1]);
            if (potentialData.nodes && Array.isArray(potentialData.nodes)) {
                dataPayload = potentialData;
            }
        } catch (e) { console.warn("Architect JSON parse failed", e); }
    }
    return { text: fullText, dataPayload };
  } catch (error) {
    if (isQuotaError(error)) {
        return { text: "CRITICAL FAILURE // 429 QUOTA EXCEEDED // TERMINAL LOCKED.", dataPayload: undefined };
    }
    return { text: "CRITICAL FAILURE // CONNECTION SEVERED.", dataPayload: undefined };
  }
};