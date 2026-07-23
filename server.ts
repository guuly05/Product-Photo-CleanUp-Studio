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

async function startServer() {
  const app = express();

  // Middleware to parse large base64 image uploads
  app.use(express.json({ limit: "25mb" }));

  // API endpoints
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Photo editing endpoint using Gemini
  app.post("/api/edit-photo", async (req, res) => {
    try {
      const { image, prompt, mimeType = "image/png", aspectRatio = "1:1", model = "gemini-3.1-flash-image" } = req.body;

      if (!image || !prompt) {
        return res.status(400).json({ error: "Both 'image' and 'prompt' are required." });
      }

      // Strip data URL prefix if present (e.g., "data:image/jpeg;base64,...")
      let cleanBase64 = image;
      let detectedMime = mimeType;

      if (image.includes(";base64,")) {
        const parts = image.split(";base64,");
        detectedMime = parts[0].replace("data:", "") || mimeType;
        cleanBase64 = parts[1];
      }

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
