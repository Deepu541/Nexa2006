import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json({ limit: '10mb' }));

// AI Support Chatbot Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, orderInfo, customerInfo } = req.body;
  
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are the AI Customer Support for NexaMart Nepal. 
        Help customers with order status, delivery, returns, and products.
        Order Info: ${JSON.stringify(orderInfo || {})}
        Customer Info: ${JSON.stringify(customerInfo || {})}
        Admin WhatsApp: +9779700694631
        Languages: English, Hindi, Nepali.
        Be polite, helpful, and concise. If you can't solve it, suggest escalating to WhatsApp.`,
      },
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage({ message: lastMessage });
    
    res.json({ content: result.text });
  } catch (error: any) {
    console.error("Chat AI Error:", error);
    res.status(500).json({ error: "AI failed to respond" });
  }
});

// AI Image Tagging & Analysis
app.post("/api/ai/analyze-image", async (req, res) => {
  const { imageBase64, country = 'Nepal' } = req.body;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } },
          { text: `Analyze this product image for a professional e-commerce store (NexaMart) operating in ${country}. 
          Perform the following detections:
          1. Category Detection: Choose the most accurate from: electronics, fashion, beauty, grocery, sports, stationery, home_products.
          2. Product Details: Suggest a professional e-commerce title, a compelling short description (sales-focused), 5 selling tags, and 5 primary keywords.
          3. Price Suggestion: Suggest a realistic price in ${country === 'India' ? 'INR (Indian Rupees)' : 'NPR (Nepalese Rupees)'} based on the product type.
          4. Quality Audit: Rate the image quality 0-100. Identify specific issues like blur, poor lighting, cluttered background, or off-center product.
          5. Enhancement Plan: Suggest what needs to be fixed to make it look like a premium marketplace listing.
          
          Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            suggestedName: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPrice: { type: Type.NUMBER },
            qualityScore: { type: Type.NUMBER },
            qualityIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
            enhancementTips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["category", "suggestedName", "description", "tags", "keywords", "suggestedPrice", "qualityScore", "qualityIssues", "enhancementTips"]
        }
      }
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error("Vision AI Error:", error);
    res.status(500).json({ error: "AI failed to analyze image" });
  }
});

// Professional Image Generator (AI Enhancement & Styling)
app.post("/api/ai/optimize-image", async (req, res) => {
  const { imageBase64, style } = req.body;
  
  const stylePrompts: Record<string, string> = {
    'amazon': 'Amazon Marketplace Style: Pure white background (#FFFFFF), centered, sharp focus, high-key studio lighting, soft natural shadow at the base, professional e-commerce style.',
    'flipkart': 'Flipkart/Marketplace Style: Clean bright background, vibrant color enhancement, product slightly tilted for 3D perspective, sharp details, high contrast.',
    'premium': 'Premium Luxury Style: Elegant minimal background (light gray/off-white), cinematic soft lighting with highlights, professional retouching, sharp edges, luxury brand feel.',
    'catalog': 'Technical Catalog Style: Flat clean background, even lighting, no shadows, every technical detail sharpened and visible for zoom view.'
  };

  const chosenStyle = stylePrompts[style] || stylePrompts['amazon'];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64.split(',')[1] } },
          { text: `Enhance and transform this product photo into a professional e-commerce asset.
            MANDATORY AI ENHANCEMENTS:
            1. Background Removal: Completely remove the current background and replace with ${chosenStyle}.
            2. Lighting Correction: Improve brightness, adjust contrast, and balance exposure for a professional look.
            3. Sharpening: Enhance textures and sharpen product edges for high-definition clarity.
            4. Centering & Composition: Center the product perfectly and adjust the scale for a professional marketplace layout.
            5. Professional Styling: Apply e-commerce color grading and noise reduction.
            
            Return the modified image as a base64 string.` 
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    let optimizedImage = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        optimizedImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (optimizedImage) {
      res.json({ imageUrl: optimizedImage });
    } else {
      res.status(500).json({ error: "AI failed to generate refined image asset" });
    }
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    res.status(500).json({ error: "AI failed to process image enhancement" });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // AI Reverse Geocoding (Enrichment)
app.post("/api/ai/reverse-geocode", async (req, res) => {
  const { latitude, longitude, rawAddress } = req.body;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        role: 'user',
        parts: [
          { text: `Analyze these coordinates (${latitude}, ${longitude}) and this raw address: "${rawAddress}". 
          Extract and enrich the following details for a professional ecommerce delivery system (specifically for Nepal/India contexts):
          1. House/Street Name
          2. Area Name (Sub-locality)
          3. Ward Number (If applicable in Nepal/India)
          4. Municipality / City
          5. District
          6. State / Province
          7. Country
          8. PIN / Postal Code
          9. Nearby Landmark (Optional)

          Return the data in a clean JSON format.` }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            streetAddress: { type: Type.STRING },
            area: { type: Type.STRING },
            ward: { type: Type.STRING },
            city: { type: Type.STRING },
            district: { type: Type.STRING },
            state: { type: Type.STRING },
            country: { type: Type.STRING },
            pinCode: { type: Type.STRING },
            landmark: { type: Type.STRING }
          },
          required: ["streetAddress", "area", "city", "district", "state", "country"]
        }
      }
    });

    res.json(JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || '{}'));
  } catch (err) {
    console.error("AI Geocoding Error:", err);
    res.status(500).json({ error: "AI address detection failed" });
  }
});

// Secure Payment Verification Simulation
app.post("/api/payments/verify", async (req, res) => {
  const { paymentMethod, transactionId, amount, country } = req.body;
  
  // In a real app, you'd verify this with eSewa/Khalti/UPI/Stripe APIs here
  // For demo/production-ready skeleton, we simulate a secure check
  console.log(`Verifying payment: ${paymentMethod} | TXN: ${transactionId} | Amt: ${amount} | ${country}`);

  try {
    // Simulate API network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success logic (e.g. if transactionId starts with 'FAIL', it fails)
    if (transactionId && transactionId.toString().toUpperCase().startsWith('FAIL')) {
      return res.json({ 
        success: false, 
        message: "Transaction verification failed at gateway",
        status: 'failed'
      });
    }

    // Simulate pending logic
    if (transactionId && transactionId.toString().toUpperCase().startsWith('PEND')) {
      return res.json({ 
        success: false, 
        message: "Payment is still processing in gateway",
        status: 'pending'
      });
    }

    res.json({
      success: true,
      message: "Payment successfully verified",
      transactionId: transactionId || `TXN-${Date.now()}`,
      gatewayResponse: { status: 'COMPLETE', timestamp: new Date().toISOString() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error during verification" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
