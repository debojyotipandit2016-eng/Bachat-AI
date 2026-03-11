import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProductResult {
  platform: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  deliveryTime: string;
  url: string;
  imageUrl: string;
  isAvailable: boolean;
  recommendationReason?: string;
  category: 'food' | 'shopping' | 'grocery';
}

export async function searchProducts(query: string, location?: string): Promise<ProductResult[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are Bachat AI, India's most advanced shopping and food delivery engine. 
    Your goal is to provide a comprehensive, accurate, and diverse list of results for any query.
    
    CURRENT LOCATION CONTEXT: ${location || "India (General)"}
    
    CRITICAL REQUIREMENTS:
    1. RESULT VOLUME: 
       - For FOOD queries (e.g., burger, pizza, biryani): You MUST return AT LEAST 10-15 different options.
       - For SHOPPING/GROCERY queries: Return AT LEAST 20-30 results across all platforms.
       - Aggregate results from ALL integrated platforms simultaneously.
    
    2. PLATFORM COVERAGE:
       - FOOD: Zomato, Swiggy, EatSure, Domino's, McDonald's, Burger King, KFC, Pizza Hut.
       - SHOPPING: Flipkart (Priority), Amazon.in, Myntra, Ajio, Nykaa, Meesho.
       - GROCERY: Blinkit, Zepto, Swiggy Instamart, BigBasket.
    
    3. IMAGE & PRICE INTEGRITY:
       - Fetch the EXACT image URL from the platform's CDN. 
       - If the query is "Chicken Burger", every food result MUST show a chicken burger.
       - Prices MUST be the final checkout price (including basic taxes/fees) as of today.
    
    4. DEEP LINKING:
       - Provide direct URLs that trigger app opens if possible (standard web URLs are fine as fallbacks).
       - Ensure links are VALID and lead directly to the item/restaurant page.
    
    5. DIVERSITY & NORMALIZATION:
       - Include variations (e.g., for "burger": Crispy, Grilled, Spicy, Cheese, Veg, Non-Veg, Combos).
       - List multiple different restaurants for food queries.
    
    Return the data in a structured JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Search for "${query}" in ${location || "India"}. Provide a diverse list of at least 20-30 results with accurate prices, real images, and direct links.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              platform: { type: "STRING" },
              name: { type: "STRING" },
              price: { type: "NUMBER" },
              originalPrice: { type: "NUMBER" },
              discount: { type: "STRING" },
              deliveryTime: { type: "STRING" },
              url: { type: "STRING" },
              imageUrl: { type: "STRING" },
              isAvailable: { type: "BOOLEAN" },
              recommendationReason: { type: "STRING" },
              category: { type: "STRING", enum: ["food", "shopping", "grocery"] }
            },
            required: ["platform", "name", "price", "deliveryTime", "url", "imageUrl", "isAvailable", "category"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results;
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
}
