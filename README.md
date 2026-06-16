# Carbon Footprint Awareness Coach Base (Full-Stack AI Platform)

An elite, full-stack **AI Sustainability Coach** engineered with React, Express, and Google Gemini API (`@google/genai`). High-contrast layout designed for the Carbon Footprint Awareness Challenge.

---

## 🌎 Problem Statement
Modern consumption habits across transport, agriculture, retail, and energy grids have accelerated global greenhouse concentrations. While carbon footprint calculators exist, they often present dull, static, self-contained calculations that fail to educate or motivate people. Individuals struggle to understand structural causes, resulting in limited long-term sustainable behavior modification.

---

## ✨ Solution Overview & AI Carbon Coach
This application acts as a high-fidelity **AI Sustainability Coach**. It leverages Gemini LLM reasoning alongside standard IPCC math logic, serving as a customized coach to:
1. Parse dynamic lifestyle assessment traits.
2. Formulate highly personalized 30-Day strategic environmental roadmaps.
3. Detect highest and secondary emission contributors (hotspots).
4. Run live what-if simulators modeling predicted monthly metrics.
5. Provide interactive conversation channels with coach context.

---

## 🛠️ Complete Technical Architecture
- **Frontend State**: Modern React 19 SPA running behind Vite 6, using Tailwind CSS, and Recharts.
- **Backend Service**: Express.js server on Node.js running on Port 3000, serving APIs and static content.
- **Database Storage**: Standaloneコレクション persistent JSON database (`database.json`) storing profiles, historical timelines, custom weekly challenges, and messages.
- **AI Core**: Google GenAI SDK (`@google/genai` model `gemini-3.5-flash`) executing structured response formatting schema definitions.

---

## 📦 Folder Structure
```bash
/
├── .env.example            # Configuration schema
├── database.json           # Atomic relational database layer
├── metadata.json           # Applet configurations
├── tsconfig.json           # Typed config rules
├── server.ts               # Core full-stack Express controller
├── server/
│   ├── db.ts               # Collection DB & seeding controller 
│   └── gemini.ts           # Gemini API wrappers & fallbacks
├── src/
│   ├── App.tsx             # Main orchestrator
│   ├── types.ts            # Project typescript models
│   ├── constants.ts        # Config-driven CO2 emission factors
│   ├── main.tsx            # DOM mounting
│   ├── index.css           # Styling declarations
│   ├── services/
│   │   └── api.ts          # Unified client-side AJAX service
│   ├── utils/
│   │   └── calculator.ts   # Precise EPA/IPCC-aligned carbon math
│   └── components/
│       ├── Dashboard.tsx    # Charts, Hotspots, and Persona card
│       ├── AssessmentForm.tsx # Responsive form wizard
│       ├── WhatIfSimulator.tsx # Sliders & debounced Gemini predicting
│       ├── ActiveRoadmap.tsx  # 30-Day week strategic checklists
│       ├── ActiveChallenges.tsx # Weekly challenges & customized entries
│       └── CoachChat.tsx      # Advisor companion sandbox
└── test_runner.ts          # QA mathematical testing suite
```

---

## 🌟 Core Features Walkthrough

### Feature 1: Carbon Footprint Assessment Engine
- Config-driven math calculates emissions across transportation, food, energy, shopping, and waste.
- Provides transparent calculations breakdown panels showing the exact math models for maximum user confidence.

### Feature 2: AI Carbon Coach
- The user engages in a companion chat dialog with their advisor.
- Gemini receives full metric contexts, responding with personalized actionable recommendations.

### Feature 3: Emission Hotspot Detection
- Sorts category percentages returning Highest, Secondary, and Lowest carbon leakages with textual root explanations.

### Feature 4: What-If Simulator
- User slides transportation mileage, vegetarian days, and shopping counts, watching instantaneous predicted offsets.
- Gemini provides dynamic scientific explanations regarding the mathematical savings of the combination.

### Feature 5: Personal Sustainability Roadmap
- Tailors 4 distinct weekly challenges (Week 1 to Week 4) focusing on specific habit offsets with checkable completion indicators.

### Feature 6: Weekly AI Challenges
- Delivers highly targeted weekly micro-tasks such as "Meat-free Monday" and supports creating fully custom eco challenges.

### Feature 7: Green Persona
- Profiling analyzes user variables to categorize them into tailored persona classes (e.g., *Climate Champion* or *Conscious Commuter*), highlighting custom strengths, weaknesses, and targets.

### Feature 8: Progress Analytics
- Recharts integration plots user carbon levels chronologically over time, allowing visual confirmation of reductions.

---

## 🎨 Design and Typography
- **Core Theme**: High-contrast, elegant off-white canvas paired with charcoal gray texts, structured frames, and comforting forest-green slate accents.
- **Font Selection**: Visual readability utilizing standard **Inter** sans-serif font family coupled with high-legibility **JetBrains Mono** font metrics inside statistics cards.

---

## 🔒 Security Measures
- **Proxy Architectures**: All Gemini API queries and key parameters reside strictly on the server-side (`server/gemini.ts`), keeping secrets fully hidden from browser inspect tools.
- **Rate-Limiting**: In-memory IP tracking restricts API endpoints to 60 queries/min to avoid denial-of-service fatigue.
- **Input Sanitization**: Numerical input clamps avoid negative counts or NaN leaks during assessments.

---

## ♿ WCAG Accessibility Audit Checklist
Our platform complies with WCAG standards. The following audit outlines completed features:
- [x] **Semantic HTML**: Fully engineered utilizing `<section>`, `<form>`, `<legend>`, `<fieldset>`, and `<button>` markers.
- [x] **Form Inputs**: Labels are explicitly bound to inputs via `htmlFor` attributes to support immediate screen-reader interpretation.
- [x] **Keyboard Navigation**: Buttons support tab indexing and focus indicators (`focus:ring-2 focus:ring-emerald-500`).
- [x] **Color Contrast**: Main backgrounds use high-contrast text ratios exceeding **4.5:1** (using slate darks and slate-grays on white).
- [x] **Touch Targets**: Handheld buttons maintain dimensions above **44px** height for accessibility on mobile devices.

---

## 🚀 Setup & Local Execution

### 1. Requirements
Ensure you are running **Node.js v20+** on your machine.

### 2. Variables Config
Create a `.env` in the root (matching `.env.example` schema):
```env
GEMINI_API_KEY="YOUR_ACTUAL_API_KEY"
APP_URL="http://localhost:3000"
```

### 3. Installation & Boot (Dev)
```bash
# Install initial assets
npm install

# Start full-stack system on matching port 3000
npm run dev
```

### 4. Build & Production Start
```bash
# Compile client and express standalone bundle
npm run build

# Direct Production Launch
npm run start
```

---

## 🧪 Testing Instructions (QA)
We have written a dedicated mathematical test runner module at the root directory. To verify the calculator logic:
```bash
# Execute standard integrity test suite
npm run test
```

---

## 🧠 Future Enhancements
- **Geo-Matching Tracking**: Integrate Google Maps API to track real-time bike transit distances automatically.
- **Integration with Utility Bills**: Support direct PDF billing uploads parsed via Gemini Vision models.

---

## 📝 Assumptions
- Calculations presume average grid coefficients of approximately `0.4kg CO2e` per electricity kWh.
- Persona mappings assume standard consumer averages around `8.5 tons` CO2e value per year as median target baselines.
