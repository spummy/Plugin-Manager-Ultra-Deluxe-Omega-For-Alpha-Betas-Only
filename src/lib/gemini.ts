import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PluginResearch {
  description: string;
  tags: string[];
  manufacturer?: string;
  category?: string;
  domain?: string;
}

export interface EncyclopediaData {
  companyDescription: string;
  aiSummary: string;
  tips: string[];
  youtubeQuery: string;
}

export async function researchPlugin(pluginName: string, manufacturer: string, category: string): Promise<PluginResearch | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Research the following audio plugin and provide a short description, 3-5 tags, and the primary website domain of the manufacturer.
      If the manufacturer or category is "Unknown" or "Not Supplied" or clearly wrong, please provide the corrected manufacturer and category in the response.
      Plugin: ${pluginName}
      Current Manufacturer: ${manufacturer}
      Current Category: ${category}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            domain: { type: Type.STRING, description: "The core domain of the manufacturer (e.g. native-instruments.com). Return empty if unknown." },
            manufacturer: { type: Type.STRING, description: "Corrected manufacturer if it was unknown or incorrect" },
            category: { type: Type.STRING, description: "Corrected category if it was unknown or incorrect" },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["description", "tags"]
        }
      }
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    if (!cleanText) return null;
    try {
      return JSON.parse(cleanText) as PluginResearch;
    } catch (parseError) {
      console.error("JSON Parse Error for Plugin Research:", cleanText);
      return null;
    }
  } catch (error) {
    console.error("Error researching plugin:", error);
    return null;
  }
}

export async function researchEncyclopedia(pluginName: string, manufacturer: string): Promise<EncyclopediaData | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert audio engineering encyclopedist. Write a detailed entry for the audio plugin "${pluginName}" by "${manufacturer}".
      1. Provide a professional 'companyDescription' as the manufacturer would describe it.
      2. Provide an 'aiSummary' reflecting real user experiences, quirks, CPU usage, and general community consensus.
      3. Provide a 'tips' array with 3-5 practical, specific use-case tips (e.g., "Use 2x oversampling on the master bus").
      4. Provide a 'youtubeQuery' which would be the best search string to find a comprehensive tutorial on YouTube (e.g., "${pluginName} ${manufacturer} tutorial mix").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyDescription: { type: Type.STRING },
            aiSummary: { type: Type.STRING },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            youtubeQuery: { type: Type.STRING }
          },
          required: ["companyDescription", "aiSummary", "tips", "youtubeQuery"]
        }
      }
    });
    
    const text = response.text || '';
    const cleanText = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    if (!cleanText) return null;
    try {
      return JSON.parse(cleanText) as EncyclopediaData;
    } catch (parseError) {
      console.error("JSON Parse Error for Encyclopedia:", cleanText);
      return null;
    }
  } catch (error) {
    console.error("Error fetching encyclopedia data:", error);
    return null;
  }
}

export async function generateWords(theme: string, count: number): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) return [];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of ${count} creative, highly evocative words related to audio plugins, synthesis, digital art, physics, or abstract concepts. 
      Theme or inspiration context: "${theme}". 
      Explicitly include a balanced mix of all parts of speech: nouns, adjectives, verbs, and adverbs. Just provide the strings back.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const text = response.text || '';
    const cleanText = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    if (!cleanText) return [];
    return JSON.parse(cleanText) as string[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export interface BulkCategorizationResult {
  [pluginId: string]: {
    category?: string;
    synthesisType?: 'Subtractive' | 'FM' | 'Wavetable' | 'Granular' | 'Additive' | 'Physical Modeling' | 'None';
    saturationType?: 'Tube' | 'Tape' | 'Solid State' | 'Bitcrush' | 'Transformer' | 'None';
    tags?: string[];
  }
}

export async function bulkCategorizePlugins(plugins: {id: string, name: string, manufacturer: string}[]): Promise<BulkCategorizationResult | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const listDescription = plugins.map(p => `ID: ${p.id} | Name: ${p.name} | Mfr: ${p.manufacturer}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert audio plugin librarian. Identify the Category, Synthesis Type, Saturation Type, and general tags for the following list of plugins.
      Allowed Synthesis Types: Subtractive, FM, Wavetable, Granular, Additive, Physical Modeling, None.
      Allowed Saturation Types: Tube, Tape, Solid State, Bitcrush, Transformer, None.
      Tags should be 2-3 short descriptive terms.
      
      Plugins to categorize:
      ${listDescription}
      
      Return a JSON object where the keys are the plugin IDs.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          description: "Map of plugin ID to its categorization",
          additionalProperties: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              synthesisType: { type: Type.STRING },
              saturationType: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const text = response.text || '';
    const cleanText = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    if (!cleanText) return null;
    return JSON.parse(cleanText) as BulkCategorizationResult;
  } catch (err) {
    console.error("Error bulk categorizing:", err);
    return null;
  }
}
