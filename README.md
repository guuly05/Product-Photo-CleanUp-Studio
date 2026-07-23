# 📸 CleanSnap AI Studio — Professional E-Commerce Product Photo Retoucher

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini_API-2.5_&_3.6-8E75FF?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**CleanSnap AI Studio** is a full-stack, enterprise-grade e-commerce product photo retouching workspace. Powered by Google Gemini multimodal models (`gemini-2.5-flash`, `gemini-3.6-flash`, etc.), CleanSnap transforms raw product photographs into high-converting studio assets in seconds — featuring automated background removal, soft contact shadow generation, smart canvas artifact erasing, and batch ZIP archive processing.

---

## ✨ Key Features

### 🤖 AI Product Retouching Engine
- **Background Removal & Studio Backdrops**: Instantly isolate products on pure white (`#FFFFFF`), subtle studio gray, or custom backdrop environments (e.g., polished marble pedestals, wooden surfaces, gradient softboxes).
- **Natural Shadow & Reflection Synthesis**: Synthesize drop shadows with adjustable angle, blur radius, opacity, offset, and ground mirror reflections.
- **Multimodal Gemini Model Switching**: Seamlessly toggle between fast draft models (`gemini-2.5-flash`), high-accuracy production models (`gemini-3.6-flash`), and specialized vision aliases.

### 🪄 Smart Eraser Tool
- **Manual Canvas Brush Touch-Up**: Brush over micro dust specks, lens flares, or remaining background artifacts directly on the canvas.
- **Dynamic Brush Controls**: Adjust brush pixel diameter, preview real-time brush cursor rings, and apply undo/clear state management for precision control.

### ⚡ One-Click AI Auto Enhance
- **Automated Exposure & Color Balance**: Automatically analyzes image luminance and color distribution to calculate optimal contrast, brightness, and color saturation values in a single click.

### 📦 Batch ZIP Archive Processor
- **Automated Bulk Processing**: Upload a `.ZIP` archive containing dozens of product images and execute shared AI retouching instructions across all files simultaneously.
- **Parallel Processing Queue**: Features an optimized concurrent execution pool with live per-image status badges, individual item previews, and bulk `.ZIP` package download.

### 🎛️ Post-Processing Adjustments Panel
- **Real-Time Sliders**: Adjust exposure, contrast, color saturation, warmth, Gaussian blur, and sharpen filter overlays live on the canvas.
- **Granular Undo & Redo Stack**: Step back and forth through individual slider tweaks using dedicated toolbar buttons or keyboard shortcuts (`Ctrl+Z` / `Ctrl+Y`).

### 🔍 Interactive Before/After Canvas
- **Split Comparison Slider**: Drag the interactive divider to visually compare raw original photos against cleaned studio outputs.
- **Zoom & Alignment Grid**: Smooth canvas zoom from **50% to 300%** with a range slider and toggleable center alignment grid overlays for perfect product centering.

### 📚 Prompt Library & Sample Gallery
- **One-Click Retouching Phrases**: Quick-add industry-standard phrasing (e.g., *"remove dust and lint"*, *"fix glare hotspots"*, *"soft drop shadow"*).
- **Preset Sample Gallery**: Pre-loaded with studio product samples (cosmetics, watches, sneakers, ceramics, tech gear) for instant testing.

---

## 🏗️ Architecture & Stack Overview

CleanSnap AI Studio employs a secure **Full-Stack (Express + React + Vite)** architecture, proxying all Gemini AI API calls server-side to safeguard API credentials from browser exposure.

```
┌─────────────────────────────────────────────────────────────┐
│                       React 18 SPA                          │
│   (Vite + TypeScript + Tailwind CSS + Lucide React Icons)   │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
     HTTP POST │ /api/edit-photo              │ JSON Response
               │ /api/analyze-lighting        │ (Base64 Data URI)
               ▼                              │
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                       │
│     - Server-side Gemini API Proxy (@google/genai)          │
│     - Secure process.env.GEMINI_API_KEY handling            │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
    REST / gRPC│ @google/genai SDK            │ Image Output
               ▼                              │
┌─────────────────────────────────────────────────────────────┐
│                    Google Gemini API                        │
│          (gemini-2.5-flash / gemini-3.6-flash)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure

```text
├── server.ts                       # Express.js server & Gemini API proxy endpoints
├── src/
│   ├── App.tsx                     # Main application layout, state manager & keyboard shortcuts
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles & Tailwind CSS imports
│   ├── types.ts                    # Shared TypeScript interfaces & types
│   ├── data/
│   │   └── samples.ts              # Pre-configured sample product photos & prompts
│   └── components/
│       ├── Header.tsx              # Top bar with export options & model selector
│       ├── BeforeAfterSlider.tsx   # Interactive canvas with split slider & Smart Eraser
│       ├── InstructionConsole.tsx  # Prompt console & quick-phrase prompt library
│       ├── AdjustmentsPanel.tsx    # Studio sliders, One-Click Enhance & Undo/Redo
│       ├── HistoryTimeline.tsx     # Sequential edit steps & snapshot gallery
│       ├── BatchProcessorModal.tsx # ZIP archive uploader & bulk processing engine
│       ├── SamplePickerModal.tsx   # Sample product gallery modal
│       └── GuidedTour.tsx          # Interactive onboarding walkthrough
├── metadata.json                   # Application metadata & capabilities
├── package.json                    # Dependencies & build scripts
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### 1. Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 2. Installation
Install project dependencies:

```bash
npm install
```

### 3. Development Mode
Launch the unified development server (Express + Vite on port `3000`):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access CleanSnap AI Studio.

### 4. Production Build
Compile the frontend assets with Vite and bundle the server script with esbuild:

```bash
npm run build
npm start
```

---

## 🛠️ API Reference

### `POST /api/edit-photo`
Proxies product photo retouching requests to Google Gemini.

- **Request Body**:
  ```json
  {
    "image": "data:image/png;base64,...",
    "prompt": "Isolate product on pure white background (#FFFFFF)",
    "mimeType": "image/png",
    "model": "gemini-2.5-flash"
  }
  ```
- **Response**:
  ```json
  {
    "imageUrl": "data:image/png;base64,..."
  }
  ```

### `POST /api/analyze-lighting`
Analyzes product photo histogram and lighting parameters to suggest optimal adjustments.

- **Request Body**:
  ```json
  {
    "image": "data:image/png;base64,...",
    "mimeType": "image/png"
  }
  ```
- **Response**:
  ```json
  {
    "recommendedAdjustments": {
      "brightness": 105,
      "contrast": 110,
      "saturation": 108
    },
    "explanation": "Image slightly underexposed; bumped brightness by 5% and contrast by 10% for e-commerce clarity.",
    "suggestedPrompt": "Fix harsh shadows on top left and enhance specular highlights"
  }
  ```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Z` / `Cmd + Z` | Undo last tool adjustment |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo tool adjustment |
| `Space` + Drag | Pan/zoom canvas |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
