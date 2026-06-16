// app.ts
import express from "express";
import path2 from "path";

// server/db.ts
import fs from "fs";
import path from "path";

// src/constants.ts
var EMISSION_FACTORS = {
  // Transport factors in kg CO2e per km
  transport: {
    car: {
      gasoline: 0.18,
      diesel: 0.17,
      hybrid: 0.09,
      electric: 0.04
    },
    publicTransport: 0.05,
    flightHour: 90
    // kg CO2e per flight hour
  },
  // Food factors (base tons CO2e per year)
  food: {
    diets: {
      "meat-heavy": 2.5,
      balanced: 1.8,
      "low-meat": 1.4,
      vegetarian: 1,
      vegan: 0.6
    },
    wasteModifiers: {
      high: 0.3,
      medium: 0.1,
      low: 0
    },
    localSourcingMaxSavingsRatio: 0.15
    // Up to 15% reduction for 100% local sourcing
  },
  // Energy factors
  energy: {
    electricityKwhCo2: 0.4
    // kg CO2e per kWh
  },
  // Shopping factors (kg CO2e per item)
  shopping: {
    clothingItem: 8,
    electronicsItem: 150
  },
  // Waste factors (kg CO2e per bag)
  waste: {
    bag: 2.5,
    recyclingMaxSavingsRatio: 0.5
    // Up to 50% waste emission reduction for 100% recycling
  }
};

// src/utils/calculator.ts
function calculateEmissions(assessment) {
  const currentFactors = EMISSION_FACTORS;
  const carFuelFactor = currentFactors.transport.car[assessment.carFuelType] || currentFactors.transport.car.gasoline;
  const carEmissionsYearly = assessment.carKmPerWeek * 52 * carFuelFactor / 1e3;
  const publicTransportEmissionsYearly = assessment.publicTransportKmPerWeek * 52 * currentFactors.transport.publicTransport / 1e3;
  const flightEmissionsYearly = assessment.flightsHoursPerYear * currentFactors.transport.flightHour / 1e3;
  const transportTotal = Number((carEmissionsYearly + publicTransportEmissionsYearly + flightEmissionsYearly).toFixed(2));
  const baseFoodEmissions = currentFactors.food.diets[assessment.meatDietType] || currentFactors.food.diets.balanced;
  const foodWasteAdded = currentFactors.food.wasteModifiers[assessment.foodWasteLevel] || 0.1;
  const foodSourcingSavings = assessment.localFoodRatio / 100 * currentFactors.food.localSourcingMaxSavingsRatio;
  const foodTotal = Number(((baseFoodEmissions + foodWasteAdded) * (1 - foodSourcingSavings)).toFixed(2));
  const yearlyElectricityKwh = assessment.electricityKwhPerMonth * 12;
  const baseEnergyEmissions = yearlyElectricityKwh * currentFactors.energy.electricityKwhCo2 / 1e3;
  const energySavings = assessment.renewableEnergyRatio / 100;
  const energyTotal = Number((baseEnergyEmissions * (1 - energySavings)).toFixed(2));
  const clothesYearly = assessment.clothingPurchasesPerMonth * 12;
  const electronicsYearly = assessment.electronicsPurchasesPerYear;
  const clothingEmissions = clothesYearly * currentFactors.shopping.clothingItem / 1e3;
  const electronicsEmissions = electronicsYearly * currentFactors.shopping.electronicsItem / 1e3;
  const shoppingTotal = Number((clothingEmissions + electronicsEmissions).toFixed(2));
  const wasteBagsYearly = assessment.wasteBagsPerWeek * 52;
  const baseWasteEmissions = wasteBagsYearly * currentFactors.waste.bag / 1e3;
  const recycleSavings = assessment.recyclingRatio / 100 * currentFactors.waste.recyclingMaxSavingsRatio;
  const wasteTotal = Number((baseWasteEmissions * (1 - recycleSavings)).toFixed(2));
  const total = Number((transportTotal + foodTotal + energyTotal + shoppingTotal + wasteTotal).toFixed(2));
  return {
    transportation: transportTotal,
    food: foodTotal,
    energy: energyTotal,
    shopping: shoppingTotal,
    waste: wasteTotal,
    total
  };
}
function calculateEcoScore(totalEmissions) {
  if (totalEmissions <= 1.5) return 100;
  if (totalEmissions <= 3) {
    return Math.round(100 - (totalEmissions - 1.5) / 1.5 * 10);
  }
  if (totalEmissions <= 7) {
    return Math.round(90 - (totalEmissions - 3) / 4 * 20);
  }
  if (totalEmissions <= 15) {
    return Math.round(70 - (totalEmissions - 7) / 8 * 40);
  }
  if (totalEmissions <= 25) {
    return Math.round(30 - (totalEmissions - 15) / 10 * 20);
  }
  return 10;
}

// server/db.ts
var isVercel = process.env.VERCEL || process.env.NOW_REGION;
var DB_FILE = isVercel ? path.join("/tmp", "database.json") : path.join(process.cwd(), "database.json");
var DEFAULT_LIFESTYLE = {
  carKmPerWeek: 180,
  carFuelType: "gasoline",
  publicTransportKmPerWeek: 40,
  flightsHoursPerYear: 12,
  meatDietType: "balanced",
  localFoodRatio: 25,
  foodWasteLevel: "medium",
  electricityKwhPerMonth: 350,
  renewableEnergyRatio: 10,
  clothingPurchasesPerMonth: 2,
  electronicsPurchasesPerYear: 1,
  wasteBagsPerWeek: 3,
  recyclingRatio: 30
};
var DEFAULT_PERSONA = {
  title: "Conscious Commuter",
  badge: "\u{1F331} Eco Explorer",
  description: "You are taking active steps to balance modern life with environmental mindfulness. You are familiar with recycling and public transit, but fuel-powered driving and home energy consumption remain your primary hotspots.",
  strengths: ["Active recycler", "Uses public transport weekly", "Low clothing consumption"],
  weaknesses: ["Daily usage of gasoline car", "Incomplete home energy insulation", "Diet includes red meat"],
  goals: ["Halve gasoline car trips", "Introduce Meat-free Mondays", "Increase renewable electricity share"],
  imagePrompt: "A clean modern flat vector icon representing a professional commuter with bicycle and green leaves"
};
var DEFAULT_ROADMAP = [
  {
    week: 1,
    title: "Energy and Power Saving",
    tasks: [
      { id: "rm-1-1", description: "Switch off appliances at the wall outlet to eliminate standby power", impact: "Medium", completed: true },
      { id: "rm-1-2", description: "Swap 5 main household incandescent globes to high-efficiency LEDs", impact: "High", completed: false },
      { id: "rm-1-3", description: "Reduce HVAC heater thermostat by 1\xB0C during winters", impact: "High", completed: false }
    ]
  },
  {
    week: 2,
    title: "Sustainable Commuting Habits",
    tasks: [
      { id: "rm-2-1", description: "Combine multiple quick weekly running errands into one single trip", impact: "Medium", completed: false },
      { id: "rm-2-2", description: "Ride public transit or work from home twice this week", impact: "High", completed: false },
      { id: "rm-2-3", description: "Inflate car tires to recommended levels to improve fuel mileage", impact: "Low", completed: false }
    ]
  },
  {
    week: 3,
    title: "Mindful Meals & Sourcing",
    tasks: [
      { id: "rm-3-1", description: "Participate in Meat-free Monday with totally plant-based meals", impact: "High", completed: false },
      { id: "rm-3-2", description: "Audit fridge contents before grocery trips to reduce food spoilage", impact: "Medium", completed: false },
      { id: "rm-3-3", description: "Purchase fresh groceries from local farmers markets instead of imported goods", impact: "Low", completed: false }
    ]
  },
  {
    week: 4,
    title: "Circular Wardrobe & Garbage Reduction",
    tasks: [
      { id: "rm-4-1", description: "Adopt proper trash segregation for plastic, paper, and food scraps", impact: "Medium", completed: false },
      { id: "rm-4-2", description: "Refrain from purchasing brand new fast-fashion garments for 30 days", impact: "High", completed: false },
      { id: "rm-4-3", description: "Donate, recycle or sell 5 items of unused clothing", impact: "Low", completed: false }
    ]
  }
];
var DEFAULT_CHALLENGES = [
  { id: "ch-1", title: "Meat-free Monday", description: "Replace all meat dishes with satisfying vegetarian or vegan alternatives for 24 hours.", impactWeightKnob: "-5.2 kg CO2e", completed: false, category: "food" },
  { id: "ch-2", title: "Energy-Saving Evening", description: "Turn off all screens and non-essential lights after 8 PM. Read a physical book or play a board game.", impactWeightKnob: "-2.4 kg CO2e", completed: false, category: "energy" },
  { id: "ch-3", title: "Car-Free Day", description: "Swap the car for walking, cycling, or public transport on all commutes today.", impactWeightKnob: "-8.1 kg CO2e", completed: false, category: "transport" },
  { id: "ch-4", title: "Zero Waste Zero Spoilage", description: "Finish every portion on your plate and cook creatively using leftovers.", impactWeightKnob: "-1.8 kg CO2e", completed: false, category: "waste" }
];
var SECOND_DEFAULT_HISTORY = [
  { date: "2026-03-01", id: "h-1", emissions: { transportation: 4.8, food: 2.1, energy: 3.2, shopping: 1.5, waste: 0.8, total: 12.4 }, ecoScore: 41 },
  { date: "2026-04-01", id: "h-2", emissions: { transportation: 4.2, food: 1.9, energy: 2.8, shopping: 1.2, waste: 0.7, total: 10.8 }, ecoScore: 49 },
  { date: "2026-05-01", id: "h-3", emissions: { transportation: 3.5, food: 1.8, energy: 2.2, shopping: 0.9, waste: 0.5, total: 8.9 }, ecoScore: 61 },
  { date: "2026-06-01", id: "h-4", emissions: { transportation: 2.9, food: 1.6, energy: 1.8, shopping: 0.6, waste: 0.4, total: 7.3 }, ecoScore: 69 }
];
var Database = class {
  constructor() {
    this.isLoaded = false;
    this.schema = {
      profile: {
        assessment: null,
        breakdown: null,
        persona: null,
        ecoScore: 0
      },
      history: [],
      roadmap: [],
      challenges: [],
      messages: []
    };
  }
  ensureLoaded() {
    if (this.isLoaded) return;
    this.isLoaded = true;
    this.load();
  }
  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, "utf8");
        this.schema = JSON.parse(content);
      } else {
        let backupFile = "";
        const pathsToTry = [
          path.join(process.cwd(), "database.json"),
          path.join(__dirname, "database.json"),
          path.join(__dirname, "..", "database.json"),
          path.join(__dirname, "../..", "database.json")
        ];
        for (const p of pathsToTry) {
          if (fs.existsSync(p)) {
            backupFile = p;
            break;
          }
        }
        if (isVercel && backupFile) {
          console.log(`Copying read-only packaged database from ${backupFile} to writeable /tmp partition...`);
          const content = fs.readFileSync(backupFile, "utf8");
          fs.writeFileSync(DB_FILE, content, "utf8");
          this.schema = JSON.parse(content);
        } else {
          this.seed();
        }
      }
    } catch (err) {
      console.warn("Failed to load database. Re-seeding as precaution...", err);
      this.seed();
    }
  }
  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write database file", err);
    }
  }
  seed() {
    const breakdown = calculateEmissions(DEFAULT_LIFESTYLE);
    const ecoScore = calculateEcoScore(breakdown.total);
    this.schema = {
      profile: {
        assessment: DEFAULT_LIFESTYLE,
        breakdown,
        persona: DEFAULT_PERSONA,
        ecoScore
      },
      history: [
        ...SECOND_DEFAULT_HISTORY,
        {
          date: "2026-06-16",
          id: "h-current",
          emissions: breakdown,
          ecoScore
        }
      ],
      roadmap: DEFAULT_ROADMAP,
      challenges: DEFAULT_CHALLENGES,
      messages: [
        {
          id: "m-init",
          sender: "coach",
          text: "Greetings! I'm your AI Sustainability Coach. I've designed a specialized eco-plan based on your energy and transport profile. Try experimenting with the What-If Simulator or track your carbon reduction targets below!",
          timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]
    };
    this.save();
  }
  // API operations
  getProfile() {
    this.ensureLoaded();
    if (!this.schema.profile.assessment) {
      this.seed();
    }
    return {
      assessment: this.schema.profile.assessment,
      breakdown: this.schema.profile.breakdown,
      hotspots: this.getHotspots(this.schema.profile.breakdown),
      persona: this.schema.profile.persona,
      roadmap: this.schema.roadmap,
      challenges: this.schema.challenges,
      history: this.schema.history,
      ecoScore: this.schema.profile.ecoScore
    };
  }
  updateAssessment(assessment, generatedPersona, generatedRoadmap) {
    this.ensureLoaded();
    const breakdown = calculateEmissions(assessment);
    const ecoScore = calculateEcoScore(breakdown.total);
    this.schema.profile.assessment = assessment;
    this.schema.profile.breakdown = breakdown;
    this.schema.profile.ecoScore = ecoScore;
    if (generatedPersona) {
      this.schema.profile.persona = generatedPersona;
    }
    if (generatedRoadmap && generatedRoadmap.length > 0) {
      this.schema.roadmap = generatedRoadmap;
    }
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const existingIndex = this.schema.history.findIndex((h) => h.date === todayStr);
    const newHistoryNode = {
      date: todayStr,
      id: existingIndex >= 0 ? this.schema.history[existingIndex].id : "h-" + Date.now(),
      emissions: breakdown,
      ecoScore
    };
    if (existingIndex >= 0) {
      this.schema.history[existingIndex] = newHistoryNode;
    } else {
      this.schema.history.push(newHistoryNode);
    }
    this.save();
    return this.getProfile();
  }
  // Toggle tasks
  toggleRoadmapTask(weekNum, taskId) {
    this.ensureLoaded();
    const week = this.schema.roadmap.find((w) => w.week === weekNum);
    if (week) {
      const task = week.tasks.find((t) => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        this.save();
      }
    }
    return this.schema.roadmap;
  }
  // Toggle challenges
  toggleChallenge(challengeId) {
    this.ensureLoaded();
    const challenge = this.schema.challenges.find((c) => c.id === challengeId);
    if (challenge) {
      challenge.completed = !challenge.completed;
      this.save();
    }
    return this.schema.challenges;
  }
  // Add customized challenge
  addChallenge(challenge) {
    this.ensureLoaded();
    this.schema.challenges.push(challenge);
    this.save();
    return this.schema.challenges;
  }
  // Reset/seed helper for testing or clean start
  resetDB() {
    this.ensureLoaded();
    this.seed();
    return this.getProfile();
  }
  // Get messages
  getMessages() {
    this.ensureLoaded();
    return this.schema.messages;
  }
  // Add message
  addMessage(msg) {
    this.ensureLoaded();
    const newMsg = {
      ...msg,
      id: "msg-" + Date.now(),
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    this.schema.messages.push(newMsg);
    this.save();
    return newMsg;
  }
  // Calculation for Emission Hostspots
  getHotspots(breakdown) {
    const categories = [
      { key: "transportation", label: "Transportation" },
      { key: "food", label: "Food & Diet" },
      { key: "energy", label: "Electricity & Energy" },
      { key: "shopping", label: "Shopping & Consumerism" },
      { key: "waste", label: "Household Waste" }
    ];
    const mapped = categories.map((cat) => {
      const val = breakdown[cat.key];
      const percentage = breakdown.total > 0 ? val / breakdown.total * 100 : 0;
      return {
        key: cat.key,
        label: cat.label,
        value: val,
        percentage: Number(percentage.toFixed(1))
      };
    }).sort((a, b) => b.value - a.value);
    return mapped.map((item, idx) => {
      let desc = "";
      if (idx === 0) {
        desc = `Highest Contributor: ${item.label} accounts for ${item.percentage}% (${item.value.toFixed(1)}t CO2e) of your carbon footprint. This is your largest sustainability leakage.`;
      } else if (idx === 1) {
        desc = `Secondary Hotspot: ${item.label} represents ${item.percentage}% (${item.value.toFixed(1)}t CO2e) of total monthly output. Focusing secondary energy reduction efforts here yields highly efficient progress.`;
      } else if (idx === mapped.length - 1) {
        desc = `Lowest Footprint: ${item.label} makes up only ${item.percentage}% (${item.value.toFixed(1)}t CO2e). Excellent job keeping this metric isolated!`;
      } else {
        desc = `${item.label} matches standard baseline rates at ${item.percentage}% (${item.value.toFixed(1)}t CO2e).`;
      }
      return {
        category: item.key,
        percentage: item.percentage,
        value: Number(item.value.toFixed(2)),
        description: desc
      };
    });
  }
};
var db = new Database();

// server/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not defined. Falling back to rules-based logic fallback.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function generateEcoProfile(assessment) {
  const ai = getGeminiClient();
  if (!ai) {
    return getFallbackProfile(assessment);
  }
  try {
    const prompt = `
      You are an expert Sustainability Analyst and Eco Coach.
      Analyze the user's lifestyle assessment and generate:
      1. A customized "Green Persona" (e.g. "Eco Enthusiast", "High-Energy Urbanite", "Conscious Commuter") depicting their sustainability stage.
      2. A personalized, detailed 30-Day (4-Week) Sustainability Roadmap containing realistic, modular action steps.

      Adjust the roadmap to address their highest footprints. For example, if they drive a lot of gasoline kilometers, prioritize transportation in weeks 1 and 2. If they have high electricity usage, target energy-efficiency.

      User Assessment Data:
      - Car km per week: ${assessment.carKmPerWeek} (${assessment.carFuelType} engine)
      - Public Transport km per week: ${assessment.publicTransportKmPerWeek}
      - Flight hours per year: ${assessment.flightsHoursPerYear}
      - Diet type: ${assessment.meatDietType}
      - Local food ratio: ${assessment.localFoodRatio}%
      - Food waste level: ${assessment.foodWasteLevel}
      - Home electricity: ${assessment.electricityKwhPerMonth} kWh/month
      - Renewable energy share: ${assessment.renewableEnergyRatio}%
      - Clothes items per month: ${assessment.clothingPurchasesPerMonth}
      - Tech items per year: ${assessment.electronicsPurchasesPerYear}
      - Waste bags per week: ${assessment.wasteBagsPerWeek}
      - Recycling ratio: ${assessment.recyclingRatio}%

      Generate the response strictly as a JSON object matching the following schema structure. Each task ID must be unique (e.g. "task-1", "task-2", etc.).
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly encouraging Sustainability Coach. You provide specific, realistic, context-aware emission plans and personas. Avoid generic advice, speak with architectural precision and scientific accuracy.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["persona", "roadmap"],
          properties: {
            persona: {
              type: Type.OBJECT,
              required: ["title", "badge", "description", "strengths", "weaknesses", "goals", "imagePrompt"],
              properties: {
                title: { type: Type.STRING, description: "Short catchy persona name (e.g. Urban Grid Eco-Beginner)" },
                badge: { type: Type.STRING, description: "Emoji + short text badge" },
                description: { type: Type.STRING, description: "Thoughtful analysis on how they live and where their footprint stands" },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 concrete green highlights from their lifestyle" },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 clear high-emission habits to improve" },
                goals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 personalized, measurable sustainability goals" },
                imagePrompt: { type: Type.STRING, description: "Detailed visual prompt representing this persona" }
              }
            },
            roadmap: {
              type: Type.ARRAY,
              description: "Exactly 4 Roadmap Weeks, representing weeks 1, 2, 3, and 4",
              items: {
                type: Type.OBJECT,
                required: ["week", "title", "tasks"],
                properties: {
                  week: { type: Type.INTEGER, description: "Week number (1, 2, 3, or 4)" },
                  title: { type: Type.STRING, description: "Theme of the week (e.g. Clean Energy Transition)" },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["id", "description", "impact", "completed"],
                      properties: {
                        id: { type: Type.STRING, description: "Unique string id (e.g., rm-1-1)" },
                        description: { type: Type.STRING, description: "Highly specific micro-habit action (e.g. Unplug major appliances before bed)" },
                        impact: { type: Type.STRING, description: "Emission impact level: High, Medium, or Low" },
                        completed: { type: Type.BOOLEAN, description: "Must default to false" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    if (parsed.persona && parsed.roadmap) {
      return parsed;
    }
    throw new Error("Gemini JSON did not conform to the expected profile structure.");
  } catch (err) {
    console.error("Failed to generate profile with Gemini. Resorting to smart rules-based profiles:", err);
    return getFallbackProfile(assessment);
  }
}
async function interactWithCoach(messages, userPrompt, profile) {
  const ai = getGeminiClient();
  const assessment = profile.assessment;
  const breakdown = profile.breakdown;
  const context = `
    User Footprint Summary:
    - Persona: ${profile.persona.title} (${profile.persona.badge})
    - Total Yearly Emissions: ${breakdown.total.toFixed(2)} tons of CO2e
    - Eco Balance Score: ${profile.ecoScore}/100
    - Top Contributor: ${profile.hotspots[0]?.category} (${profile.hotspots[0]?.percentage}%)

    Details:
    - Car km/week: ${assessment.carKmPerWeek} (${assessment.carFuelType} engine)
    - Transit km/week: ${assessment.publicTransportKmPerWeek}
    - Dietary Footprint: ${breakdown.food.toFixed(2)} tons (Diet option: ${assessment.meatDietType})
    - Electricity: ${assessment.electricityKwhPerMonth} kWh/month with ${assessment.renewableEnergyRatio}% green supply.
    - Household waste bags: ${assessment.wasteBagsPerWeek} per week (Recycling ratio: ${assessment.recyclingRatio}%)
    - Global baseline average matches standard consumption: 8.5 tons. Direct target budget is under 2.5 tons.
  `;
  if (!ai) {
    return getRuleChatResponse(userPrompt, profile);
  }
  try {
    const historicalContext = messages.map((m) => `${m.sender === "user" ? "User" : "Coach"}: ${m.text}`).join("\n");
    const systemPrompt = `
      You are the ultimate personalized AI Sustainability Coach and Environmental Advisor.
      Your goal is to guide the user to track, predict, and reduce their carbon footprint with compassion, realistic advice, and data-driven recommendations.

      Always base your evaluations on the user's personal context:
      ${context}

      Rule Checklist:
      1. Reference specific details of their activities when answering questions.
      2. If they ask how to lower emissions, detail 2-3 specific adjustments matching their lifestyle constraints.
      3. Maintain an inspiring, conversational, scientific, and compassionate persona.
      4. Avoid lecturing; instead, act as a co-collaborator in their eco journey.
      5. Keep responses concise and structured with legible bullet points or bold keys.
    `;
    const chatInput = `
      Previous History:
      ${historicalContext}

      User New Query:
      "${userPrompt}"
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatInput,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7
      }
    });
    return response.text || "I apologize, I've had a minor disruption computing that request. Please try again in a moment!";
  } catch (err) {
    console.error("Error during Coach Chat generation:", err);
    return getRuleChatResponse(userPrompt, profile);
  }
}
function getFallbackProfile(assessment) {
  const emissionBreakdown = calculateEmissions(assessment);
  let title = "Eco Beginner";
  let badge = "\u{1F331} Steady Starter";
  let description = "Starting your climate awareness journey! You have clear avenues for high-impact carbon offsets.";
  const strengths = [];
  const weaknesses = [];
  const goals = [];
  if (assessment.carKmPerWeek > 250) {
    weaknesses.push("High-intensity driving habit with weekly car mileage exceeding 250km.");
    goals.push("Reduce private driving km by 20% through trip sharing or public transit integration.");
  } else {
    strengths.push("Commendably low car driving carbon impact.");
  }
  if (assessment.meatDietType === "meat-heavy" || assessment.meatDietType === "balanced") {
    weaknesses.push("Frequent animal protein consumption with a high agriculture foot print.");
    goals.push("Try a vegetarian or vegan lifestyle once a week to cut methane outputs.");
  } else {
    strengths.push("Eco-friendly, low-greenhouse-gas dietary choices.");
  }
  if (assessment.renewableEnergyRatio > 50) {
    strengths.push("Excellent clean utility supply, covering over half your power load.");
  } else {
    weaknesses.push("High reliance on non-renewable grid-average local energy supply.");
    goals.push("Investigate clean community solar programs or energy auditing.");
  }
  if (emissionBreakdown.total < 3.5) {
    title = "Climate Champion";
    badge = "\u{1F3C5} Green Champion";
    description = "Outstanding work. Your carbon footprint is below the global eco-limit. You are a role model for zero-carbon lifestyles!";
  } else if (emissionBreakdown.total < 7.5) {
    title = "Green Explorer";
    badge = "\u{1F9D7} Active Explorer";
    description = "You are taking conscious efforts. By tweaking active energy consumption and driving habits, you will soon hit gold standard levels!";
  } else if (assessment.carKmPerWeek > 200 && assessment.publicTransportKmPerWeek < 20) {
    title = "Conscious Commuter";
    badge = "\u{1F697} Frequent Driver";
    description = "Your daily transport dominates your total greenhouse contribution. Transitioning to hybrid habits will be highly effective.";
  }
  if (strengths.length < 3) strengths.push("Aware of personal ecological calculations");
  if (strengths.length < 3) strengths.push("Seeking active carbon roadmap options");
  if (weaknesses.length < 3) weaknesses.push("General reliance on standard manufacturing cycles");
  if (weaknesses.length < 3) weaknesses.push("Opportunity to expand recycling ratios");
  if (goals.length < 3) goals.push("Increase home garbage recycling to at least 50%");
  if (goals.length < 3) goals.push("Reduce annual checkout clothes purchases to under 15 units");
  const roadmap = [
    {
      week: 1,
      title: "Energy & Utility Auditing",
      tasks: [
        { id: "fb-1-1", description: "Unplug devices left in standby overnight to avoid vampire power draw", impact: "Medium", completed: false },
        { id: "fb-1-2", description: "Set winter heating thermostat 1 degree lower to reduce power bills", impact: "High", completed: false },
        { id: "fb-1-3", description: "Audit local light fixtures and swap standard bulbs to LED technology", impact: "High", completed: false }
      ]
    },
    {
      week: 2,
      title: "Transport Swapping",
      tasks: [
        { id: "fb-2-1", description: "Swap at least one short car trip (<3km) with walking or cycling", impact: "Medium", completed: false },
        { id: "fb-2-2", description: "Ensure regular car oil changes and proper tire inflation", impact: "Low", completed: false },
        { id: "fb-2-3", description: "Utilize public transit for a full return journey twice this week", impact: "High", completed: false }
      ]
    },
    {
      week: 3,
      title: "Climate Cooking & Waste Reduce",
      tasks: [
        { id: "fb-3-1", description: "Prepare 100% plant-based recipes during dinner times", impact: "High", completed: false },
        { id: "fb-3-2", description: "Create grocery shopping list based strictly on real ingredients to drop waste", impact: "Medium", completed: false },
        { id: "fb-3-3", description: "Segregate all plastics, cardboard, and aluminum cans for municipal recycling", impact: "Medium", completed: false }
      ]
    },
    {
      week: 4,
      title: "Mindful Consumer Habits",
      tasks: [
        { id: "fb-4-1", description: "Repair damaged household items instead of repurchasing newer versions", impact: "Medium", completed: false },
        { id: "fb-4-2", description: "Decline one unnecessary clothing checkout to prevent retail manufacturing CO2", impact: "High", completed: false },
        { id: "fb-4-3", description: "Initiate a 30-day eco-diary tracking local community clean campaigns", impact: "Low", completed: false }
      ]
    }
  ];
  return {
    persona: {
      title,
      badge,
      description,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      goals: goals.slice(0, 3),
      imagePrompt: "Flat illustration of a green leafy tree representing climate awareness"
    },
    roadmap
  };
}
function getRuleChatResponse(query, profile) {
  const normQuery = query.toLowerCase();
  const breakdown = profile.breakdown;
  if (normQuery.includes("transport") || normQuery.includes("car") || normQuery.includes("drive") || normQuery.includes("flight")) {
    return `### \u{1F697} Transport Offset Diagnosis
Based on your transport footprint (**${breakdown.transportation.toFixed(2)} tons CO2e/year**):
1. **Public Transit Pivot**: Swapping standard fuel commutes for trains or buses cuts traveling footprint by up to **75% per kilometer**.
2. **Drive Smarter**: Maintaining recommended tire pressures increases fuel range, preserving up to **3% efficiency** immediately.
3. **Flight Truncating**: Aviation generates a vast greenhouse footprint. Swapping long flights for video conferences saves massive chunks of carbon.
Let me know if you would like me to customize your Weekly Challenges for commuting!`;
  }
  if (normQuery.includes("eat") || normQuery.includes("food") || normQuery.includes("diet") || normQuery.includes("meat") || normQuery.includes("waste")) {
    return `### \u{1F957} Dietary Carbon Insights
Your agricultural feeding footprint contributes **${breakdown.food.toFixed(2)} tons CO2e/year**:
1. **The Methane Factor**: Beef and sheep farming are highly calorie-intensive crops emitting significant methane. Swapping red meat for poultry, fish, or vegetable proteins twice a week results in notable footprint improvements.
2. **Eliminate Wastage**: Food decomposing in standard community dumps produces volatile gas. Planning meals precisely isolates spoilage.
3. **Sourcing Local**: Shipping groceries from far off coordinates burns heavy diesel in ocean ships. Consuming local farm-grown crops reduces transportation chain footprint.`;
  }
  if (normQuery.includes("electricity") || normQuery.includes("solar") || normQuery.includes("energy") || normQuery.includes("power")) {
    return `### \u{1F50C} Home Energy Audit
Your energy grid emissions are **${breakdown.energy.toFixed(2)} tons CO2e/year**:
1. **Standby Draw**: Many electronic screens, charging plugs, and media boxes draw trickle power continuously when sleeping. Unplugging them saves up to 500 kWh annually.
2. **Smart Thermostats**: Trimming temperature ranges by just 1 degree Celsius dynamically offsets HVAC electricity by **7% to 10%** over active semesters.
3. **Renewable Plans**: Subscribing to municipal clean wind energy offsets base grid coal footprint completely.`;
  }
  return `### Hello! I am your AI Sustainability Coach.
I am analyzing your carbon score of **${profile.ecoScore}/100** and yearly footprint of **${breakdown.total.toFixed(2)} tons CO2e**.

Here are your key priorities based on your lifestyle metrics:
- **Top Hotspot**: Our calculators detect your biggest priority for improvement is **${profile.hotspots[0]?.percentage}% emissions** inside **${profile.hotspots[0]?.category.toUpperCase()}**.
- **Action plan**: I recommend visiting your customized **30-Day Personal Sustainability Roadmap** and checking off Weeks 1-4.
- **Micro habits**: Engage with the **What-If Simulator** to model changes in mileage or cooking habits and see predicted monthly savings in real-time.

How can I help you improve your sustainability profile today? Feel free to ask about specific habits or carbon calculations!`;
}

// app.ts
import dotenv from "dotenv";
import { GoogleGenAI as GoogleGenAI2 } from "@google/genai";

// src/utils/validation.ts
import { z } from "zod";
var LifestyleAssessmentSchema = z.object({
  // Transportation
  carKmPerWeek: z.coerce.number().min(0, "Kilometers must be a positive number").max(1e4, "Maximum car kilometers exceeded"),
  carFuelType: z.enum(["gasoline", "diesel", "hybrid", "electric"]),
  publicTransportKmPerWeek: z.coerce.number().min(0, "Kilometers must be a positive number").max(1e4, "Maximum public transit kilometers exceeded"),
  flightsHoursPerYear: z.coerce.number().min(0, "Flight hours must be positive").max(2e3, "Maximum flight hours exceeded"),
  // Diet
  meatDietType: z.enum(["meat-heavy", "balanced", "low-meat", "vegetarian", "vegan"]),
  localFoodRatio: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100"),
  foodWasteLevel: z.enum(["high", "medium", "low"]),
  // Energy
  electricityKwhPerMonth: z.coerce.number().min(0, "Electricity kWh must be positive").max(1e5, "Maximum electricity exceeded"),
  renewableEnergyRatio: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100"),
  // Shopping
  clothingPurchasesPerMonth: z.coerce.number().min(0, "Clothing purchases must be positive").max(1e3, "Purchases must be realistic"),
  electronicsPurchasesPerYear: z.coerce.number().min(0, "Electronics purchases must be positive").max(500, "Purchases must be realistic"),
  // Waste
  wasteBagsPerWeek: z.coerce.number().min(0, "Waste bags must be positive").max(1e3, "Bags must be realistic"),
  recyclingRatio: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100")
});
var RoadmapToggleSchema = z.object({
  week: z.coerce.number().int().min(1).max(52),
  taskId: z.string().min(1, "Task ID is required")
});
var ChallengeToggleSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required")
});
var ChallengeAddSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(80, "Title is too long"),
  description: z.string().min(5, "Description must be at least 5 characters").max(180, "Description is too long"),
  category: z.enum(["transport", "food", "energy", "consumption", "waste"]),
  impactWeightKnob: z.string().max(25).optional().default("-2.0 kg CO2e")
});
var CoachMessageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty").max(1e3, "Message is too long")
});
var WhatIfExplainSchema = z.object({
  currentTotal: z.coerce.number().min(0).max(500),
  projectedTotal: z.coerce.number().min(0).max(500),
  monthlyReductionKg: z.coerce.number().min(0).max(1e4),
  yearlyReductionKg: z.coerce.number().min(0).max(12e4),
  adjustments: z.record(z.string(), z.any()).optional()
});

// app.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "10kb" }));
var rateLimits = /* @__PURE__ */ new Map();
function apiRateLimiter(req, res, next) {
  const rawIpHeader = req.headers["x-forwarded-for"] || "";
  const ip = rawIpHeader.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1e3;
  const maxRequests = 60;
  let limitData = rateLimits.get(ip);
  if (!limitData || limitData.resetTime < now) {
    limitData = { hits: 1, resetTime: now + windowMs };
    rateLimits.set(ip, limitData);
    return next();
  }
  limitData.hits += 1;
  if (limitData.hits > maxRequests) {
    return res.status(429).json({
      error: "Too many requests. Please slow down and respect climate pacing!",
      retryAfter: Math.round((limitData.resetTime - now) / 1e3)
    });
  }
  next();
}
app.use("/api", apiRateLimiter);
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/profile", (req, res) => {
  try {
    const profile = db.getProfile();
    res.json(profile);
  } catch (err) {
    console.error("Failed to retrieve profile:", err);
    res.status(500).json({ error: "Failed to retrieve carbon profile data." });
  }
});
app.post("/api/assessment", async (req, res) => {
  try {
    const validationResult = LifestyleAssessmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed for lifestyle assessment factors.",
        details: validationResult.error.format()
      });
    }
    const assessment = validationResult.data;
    console.log("Querying Gemini API to construct eco-roadmap & persona cards...");
    const result = await generateEcoProfile(assessment);
    const updated = db.updateAssessment(assessment, result.persona, result.roadmap);
    res.json(updated);
  } catch (err) {
    console.error("Error during assessment saving:", err);
    res.status(400).json({ error: "Failed to process carbon assessment factors." });
  }
});
app.post("/api/roadmap/toggle", (req, res) => {
  try {
    const validationResult = RoadmapToggleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid parameters: " + validationResult.error.message });
    }
    const { week, taskId } = validationResult.data;
    const updatedRoadmap = db.toggleRoadmapTask(week, taskId);
    res.json(updatedRoadmap);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle roadmap check." });
  }
});
app.post("/api/challenge/toggle", (req, res) => {
  try {
    const validationResult = ChallengeToggleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Invalid parameter: " + validationResult.error.message });
    }
    const { challengeId } = validationResult.data;
    const updatedChallenges = db.toggleChallenge(challengeId);
    res.json(updatedChallenges);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle challenge." });
  }
});
app.post("/api/challenge/add", (req, res) => {
  try {
    const validationResult = ChallengeAddSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Validation failed: " + validationResult.error.message });
    }
    const { title, description, category, impactWeightKnob } = validationResult.data;
    const sanitize = (val, maxLen) => {
      return val.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim().substring(0, maxLen);
    };
    const cleanTitle = sanitize(title, 80);
    const cleanDesc = sanitize(description, 180);
    const cleanCategory = category;
    const cleanImpact = sanitize(impactWeightKnob || "-2.0 kg CO2e", 25);
    const newChallenge = {
      id: "ch-" + Date.now(),
      title: cleanTitle,
      description: cleanDesc,
      impactWeightKnob: cleanImpact,
      category: cleanCategory,
      completed: false
    };
    const updated = db.addChallenge(newChallenge);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to append custom environmental challenge." });
  }
});
app.get("/api/messages", (req, res) => {
  try {
    res.json(db.getMessages());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chatbot archives." });
  }
});
app.post("/api/messages", async (req, res) => {
  try {
    const validationResult = CoachMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Message validation failed: " + validationResult.error.message });
    }
    const { text } = validationResult.data;
    const cleanText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
    db.addMessage({ sender: "user", text: cleanText });
    const activeMessages = db.getMessages();
    const profile = db.getProfile();
    console.log("Fwd query to Sustainability Advisor context...");
    const reply = await interactWithCoach(activeMessages, cleanText, profile);
    const finalReplyObject = db.addMessage({ sender: "coach", text: reply });
    res.json({
      userMessage: activeMessages[activeMessages.length - 2],
      // user message was inserted first
      coachReply: finalReplyObject,
      allMessages: db.getMessages()
    });
  } catch (err) {
    console.error("Error in coach conversation pipeline:", err);
    res.status(500).json({ error: "Sustainability advisor is currently calculating high-priority grids. Please query again." });
  }
});
app.post("/api/whatif/explain", async (req, res) => {
  try {
    const validationResult = WhatIfExplainSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: "Simulation variables validation failed" });
    }
    const { currentTotal, projectedTotal, monthlyReductionKg, yearlyReductionKg, adjustments } = validationResult.data;
    const safeCurrent = currentTotal;
    const safeProjected = projectedTotal;
    const safeMonthly = monthlyReductionKg;
    const safeYearly = yearlyReductionKg;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        explanation: `With these adjustments, your annual footprint decreases from **${safeCurrent.toFixed(1)} tons** to **${safeProjected.toFixed(1)} tons**, saving **${safeMonthly.toFixed(0)} kg CO2e** every month. This results in standardizing your household emissions with regional targets!`
      });
    }
    const ai = new GoogleGenAI2({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
    const prompt = `
      You are an elite, highly scientific Sustainability Advisor.
      The user is running a "What-If Simulator" to model reductions in their carbon footprint.
      Provide a highly realistic, encouraging 2-sentence explanation of what these combined simulator changes accomplish.

      Metrics table:
      - Current annual footprint: ${safeCurrent} tons CO2e
      - Projected annual footprint: ${safeProjected} tons CO2e
      - Monthly Carbon Saved: ${safeMonthly} kg CO2e
      - Yearly Carbon Saved: ${safeYearly} kg CO2e

      Selected adjustments modeled by user:
      ${adjustments ? JSON.stringify(adjustments, null, 2).substring(0, 500) : "none"}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Provide an extremely encouraging, mathematically precise, scientifically accurate 2-sentence response detailing the ecological benefits of the selected what-if steps. Keep it highly readable.",
        temperature: 0.5
      }
    });
    res.json({ explanation: response.text?.trim() || "Calculated successfully!" });
  } catch (err) {
    res.json({
      explanation: "Modeling shows these adjustments will lower emissions efficiently. Great progress!"
    });
  }
});
app.post("/api/reset", (req, res) => {
  try {
    const resetProfile = db.resetDB();
    res.json({ message: "Database reset successfully!", profile: resetProfile });
  } catch (err) {
    res.status(500).json({ error: "Database reset procedure failed." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Launching in Developer mode with active Vite middlewares...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Launching in Production mode...");
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Carbon Aware Platform Server running on port ${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var app_default = app;

// api/index.ts
var index_default = app_default;
export {
  index_default as default
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=index.js.map
