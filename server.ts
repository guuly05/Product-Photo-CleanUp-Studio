import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables. Please check your settings/secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function resolveImageBase64(
  imageStr: string,
  defaultMime: string = "image/png"
): Promise<{ cleanBase64: string; detectedMime: string }> {
  if (!imageStr) {
    throw new Error("No image data provided.");
  }

  // Handle external HTTP/HTTPS URLs (e.g. Unsplash sample URLs)
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    const response = await fetch(imageStr);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL (${response.status} ${response.statusText})`);
    }
    const contentType = response.headers.get("content-type");
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return {
      cleanBase64: base64,
      detectedMime: contentType ? contentType.split(";")[0] : defaultMime,
    };
  }

  // Handle data URL scheme (e.g., "data:image/png;base64,...")
  if (imageStr.includes(";base64,")) {
    const parts = imageStr.split(";base64,");
    const mime = parts[0].replace("data:", "") || defaultMime;
    return {
      cleanBase64: parts[1],
      detectedMime: mime,
    };
  }

  // Plain base64 string
  return {
    cleanBase64: imageStr,
    detectedMime: defaultMime,
  };
}

async function startServer() {
  const app = express();

  // Middleware to parse large base64 image uploads
  app.use(express.json({ limit: "25mb" }));

  // API endpoints
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Lighting Analysis endpoint
  app.post("/api/analyze-lighting", async (req, res) => {
    try {
      const { image, mimeType = "image/png" } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image data is required." });
      }

      const { cleanBase64, detectedMime } = await resolveImageBase64(image, mimeType);

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: detectedMime,
              },
            },
            {
              text: `Analyze this product photo as a commercial studio photography lighting engineer.
Examine exposure, brightness, contrast, color saturation, grounding shadows, reflections, and backdrop framing.
Return optimal studio lighting post-processing settings and recommendations for commercial e-commerce.

Return JSON with:
- brightness: integer from -50 to 50
- contrast: integer from -50 to 50
- saturation: integer from -50 to 50
- shadow: { enabled: boolean, opacity: integer 0-100, blur: integer 0-50, offsetY: integer 0-40 }
- suggestedBackdropColor: hex string (e.g., "#FFFFFF", "#F1F5F9", or "#F5F2EB")
- lightingAssessment: 1-2 sentence professional assessment of current lighting and exposure
- recommendedPrompt: tailored retouching prompt for this image`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              brightness: { type: "INTEGER" },
              contrast: { type: "INTEGER" },
              saturation: { type: "INTEGER" },
              shadow: {
                type: "OBJECT",
                properties: {
                  enabled: { type: "BOOLEAN" },
                  opacity: { type: "INTEGER" },
                  blur: { type: "INTEGER" },
                  offsetY: { type: "INTEGER" },
                },
                required: ["enabled", "opacity", "blur", "offsetY"],
              },
              suggestedBackdropColor: { type: "STRING" },
              lightingAssessment: { type: "STRING" },
              recommendedPrompt: { type: "STRING" },
            },
            required: [
              "brightness",
              "contrast",
              "saturation",
              "shadow",
              "suggestedBackdropColor",
              "lightingAssessment",
              "recommendedPrompt",
            ],
          },
        },
      });

      let analysis = null;
      if (response.text) {
        analysis = JSON.parse(response.text);
      }

      if (!analysis) {
        throw new Error("Model returned empty analysis.");
      }

      res.json({
        success: true,
        analysis,
      });
    } catch (error: any) {
      console.error("Error in /api/analyze-lighting:", error);
      res.status(500).json({
        error: error.message || "Failed to analyze photo lighting.",
      });
    }
  });

  // AI Product Tag Analysis endpoint
  app.post("/api/analyze-tags", async (req, res) => {
    try {
      const { image, mimeType = "image/png", filename = "" } = req.body;

      if (!image) {
        return res.status(400).json({ error: "Image data is required for product tag analysis." });
      }

      const { cleanBase64, detectedMime } = await resolveImageBase64(image, mimeType);

      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: detectedMime,
              },
            },
            {
              text: `Analyze this commercial product photo as an e-commerce product catalog taxonomist.
Examine the subject matter, category, material, style, composition, lighting depth (e.g., 'macro', 'studio-shot', 'flatlay', 'close-up'), and e-commerce applicability.
Context filename: "${filename}"

Return JSON with:
- tags: array of 5 to 8 concise, lower-case tags (e.g., ["electronics", "audio", "macro", "wireless", "matte-black", "studio", "ecommerce"])
- primaryCategory: main category name (e.g., "Electronics", "Apparel & Accessories", "Footwear", "Beauty & Cosmetics", "Home & Goods")
- confidence: number between 0.8 and 1.0
- summary: 1 short sentence describing the product subject`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              tags: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              primaryCategory: { type: "STRING" },
              confidence: { type: "NUMBER" },
              summary: { type: "STRING" },
            },
            required: ["tags", "primaryCategory", "confidence", "summary"],
          },
        },
      });

      let tagData = null;
      if (response.text) {
        tagData = JSON.parse(response.text);
      }

      if (!tagData || !Array.isArray(tagData.tags)) {
        throw new Error("Invalid tag analysis output from AI model.");
      }

      res.json({
        success: true,
        tags: tagData.tags,
        primaryCategory: tagData.primaryCategory,
        confidence: tagData.confidence,
        summary: tagData.summary,
      });
    } catch (error: any) {
      console.error("Error in /api/analyze-tags:", error);
      res.status(500).json({
        error: error.message || "Failed to generate AI product tags.",
      });
    }
  });

  // Photo editing endpoint using Gemini
  app.post("/api/edit-photo", async (req, res) => {
    try {
      const { image, prompt, mimeType = "image/png", aspectRatio = "1:1", model = "gemini-3.1-flash-image" } = req.body;

      if (!image || !prompt) {
        return res.status(400).json({ error: "Both 'image' and 'prompt' are required." });
      }

      const { cleanBase64, detectedMime } = await resolveImageBase64(image, mimeType);

      const ai = getGeminiClient();

      // Formulate detailed system prompt instructing image editing for product photos
      const enhancedPrompt = `You are an expert commercial product photographer and digital photo retoucher.
Instruction: ${prompt}

Key guidelines:
1. Preserve the original subject product intact with precise product outlines, textures, labels, and geometry.
2. If requested to remove background, isolate the product cleanly, removing all original background elements, busy context, or reflections, placing it on the requested clean studio background (e.g. pure seamless white #FFFFFF, solid neutral color, wooden display, or elegant podium).
3. If requested to clean up blemishes, dust, scratches, glare or reflections, touch up the product surface naturally while retaining realistic metallic/glass/matte material qualities.
4. Ensure professional studio lighting, realistic ground contact shadows under the product so it doesn't float, and commercial grade color balance suitable for e-commerce (Shopify, Amazon, Instagram).`;

      const response = await ai.models.generateContent({
        model: model, // e.g. gemini-3.1-flash-image or gemini-3.1-flash-lite-image
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: detectedMime,
              },
            },
            {
              text: enhancedPrompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let resultImageUrl = null;
      let textFeedback = "";

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const resultMime = part.inlineData.mimeType || "image/png";
            resultImageUrl = `data:${resultMime};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textFeedback += part.text + " ";
          }
        }
      }

      if (!resultImageUrl) {
        // Fallback: If model returned text only without inline image, inform client
        return res.status(422).json({
          error: "The model processed the instruction but did not return an updated image. Please try refining your instruction or selecting a specific preset.",
          feedback: textFeedback.trim(),
        });
      }

      res.json({
        success: true,
        imageUrl: resultImageUrl,
        feedback: textFeedback.trim(),
      });
    } catch (error: any) {
      console.error("Error in /api/edit-photo:", error);
      res.status(500).json({
        error: error.message || "Failed to process photo edit instruction.",
      });
    }
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Product Photo CleanUp Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
