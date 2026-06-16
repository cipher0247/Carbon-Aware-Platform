import { GoogleGenAI, Type } from '@google/genai';
import { LifestyleAssessment, GreenPersona, RoadmapWeek, FullProfile, CoachMessage } from '../src/types';
import { calculateEmissions, calculateEcoScore } from '../src/utils/calculator';

// Guard clause for Gemini API key lazy initialization and safety
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is not defined. Falling back to rules-based logic fallback.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

/**
 * Customizes the user's Green Persona and 4-Week Roadmap based on their lifestyle assessment.
 * Safe fallback is included if Gemini API Key is unconfigured.
 */
export async function generateEcoProfile(assessment: LifestyleAssessment): Promise<{ persona: GreenPersona; roadmap: RoadmapWeek[] }> {
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
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an elite, highly encouraging Sustainability Coach. You provide specific, realistic, context-aware emission plans and personas. Avoid generic advice, speak with architectural precision and scientific accuracy.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['persona', 'roadmap'],
          properties: {
            persona: {
              type: Type.OBJECT,
              required: ['title', 'badge', 'description', 'strengths', 'weaknesses', 'goals', 'imagePrompt'],
              properties: {
                title: { type: Type.STRING, description: 'Short catchy persona name (e.g. Urban Grid Eco-Beginner)' },
                badge: { type: Type.STRING, description: 'Emoji + short text badge' },
                description: { type: Type.STRING, description: 'Thoughtful analysis on how they live and where their footprint stands' },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 concrete green highlights from their lifestyle' },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 clear high-emission habits to improve' },
                goals: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 personalized, measurable sustainability goals' },
                imagePrompt: { type: Type.STRING, description: 'Detailed visual prompt representing this persona' },
              },
            },
            roadmap: {
              type: Type.ARRAY,
              description: 'Exactly 4 Roadmap Weeks, representing weeks 1, 2, 3, and 4',
              items: {
                type: Type.OBJECT,
                required: ['week', 'title', 'tasks'],
                properties: {
                  week: { type: Type.INTEGER, description: 'Week number (1, 2, 3, or 4)' },
                  title: { type: Type.STRING, description: 'Theme of the week (e.g. Clean Energy Transition)' },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ['id', 'description', 'impact', 'completed'],
                      properties: {
                        id: { type: Type.STRING, description: 'Unique string id (e.g., rm-1-1)' },
                        description: { type: Type.STRING, description: 'Highly specific micro-habit action (e.g. Unplug major appliances before bed)' },
                        impact: { type: Type.STRING, description: 'Emission impact level: High, Medium, or Low' },
                        completed: { type: Type.BOOLEAN, description: 'Must default to false' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.persona && parsed.roadmap) {
      return parsed;
    }
    throw new Error('Gemini JSON did not conform to the expected profile structure.');
  } catch (err) {
    console.error('Failed to generate profile with Gemini. Resorting to smart rules-based profiles:', err);
    return getFallbackProfile(assessment);
  }
}

/**
 * Handles conversational tutoring between the user and their AI Sustainability Coach.
 * Combines profile context and historical progress.
 */
export async function interactWithCoach(
  messages: CoachMessage[],
  userPrompt: string,
  profile: FullProfile
): Promise<string> {
  const ai = getGeminiClient();

  // Create context summary
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
    // Generate intelligent simulation rule and template chatbot answer
    return getRuleChatResponse(userPrompt, profile);
  }

  try {
    const historicalContext = messages.map(m => `${m.sender === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n');
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
      model: 'gemini-3.5-flash',
      contents: chatInput,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return response.text || "I apologize, I've had a minor disruption computing that request. Please try again in a moment!";
  } catch (err) {
    console.error('Error during Coach Chat generation:', err);
    return getRuleChatResponse(userPrompt, profile);
  }
}

/**
 * Rules-based backup engine ensuring 100% operation even if API keys are offline or rate-limited.
 */
function getFallbackProfile(assessment: LifestyleAssessment): { persona: GreenPersona; roadmap: RoadmapWeek[] } {
  const emissionBreakdown = calculateEmissions(assessment);
  let title = 'Eco Beginner';
  let badge = '🌱 Steady Starter';
  let description = 'Starting your climate awareness journey! You have clear avenues for high-impact carbon offsets.';
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const goals: string[] = [];

  // Rules
  if (assessment.carKmPerWeek > 250) {
    weaknesses.push('High-intensity driving habit with weekly car mileage exceeding 250km.');
    goals.push('Reduce private driving km by 20% through trip sharing or public transit integration.');
  } else {
    strengths.push('Commendably low car driving carbon impact.');
  }

  if (assessment.meatDietType === 'meat-heavy' || assessment.meatDietType === 'balanced') {
    weaknesses.push('Frequent animal protein consumption with a high agriculture foot print.');
    goals.push('Try a vegetarian or vegan lifestyle once a week to cut methane outputs.');
  } else {
    strengths.push('Eco-friendly, low-greenhouse-gas dietary choices.');
  }

  if (assessment.renewableEnergyRatio > 50) {
    strengths.push('Excellent clean utility supply, covering over half your power load.');
  } else {
    weaknesses.push('High reliance on non-renewable grid-average local energy supply.');
    goals.push('Investigate clean community solar programs or energy auditing.');
  }

  // Final Persona determination
  if (emissionBreakdown.total < 3.5) {
    title = 'Climate Champion';
    badge = '🏅 Green Champion';
    description = 'Outstanding work. Your carbon footprint is below the global eco-limit. You are a role model for zero-carbon lifestyles!';
  } else if (emissionBreakdown.total < 7.5) {
    title = 'Green Explorer';
    badge = '🧗 Active Explorer';
    description = 'You are taking conscious efforts. By tweaking active energy consumption and driving habits, you will soon hit gold standard levels!';
  } else if (assessment.carKmPerWeek > 200 && assessment.publicTransportKmPerWeek < 20) {
    title = 'Conscious Commuter';
    badge = '🚗 Frequent Driver';
    description = 'Your daily transport dominates your total greenhouse contribution. Transitioning to hybrid habits will be highly effective.';
  }

  // Refine strengths/weaknesses to exactly 3 items
  if (strengths.length < 3) strengths.push('Aware of personal ecological calculations');
  if (strengths.length < 3) strengths.push('Seeking active carbon roadmap options');
  if (weaknesses.length < 3) weaknesses.push('General reliance on standard manufacturing cycles');
  if (weaknesses.length < 3) weaknesses.push('Opportunity to expand recycling ratios');
  if (goals.length < 3) goals.push('Increase home garbage recycling to at least 50%');
  if (goals.length < 3) goals.push('Reduce annual checkout clothes purchases to under 15 units');

  const roadmap: RoadmapWeek[] = [
    {
      week: 1,
      title: 'Energy & Utility Auditing',
      tasks: [
        { id: 'fb-1-1', description: 'Unplug devices left in standby overnight to avoid vampire power draw', impact: 'Medium', completed: false },
        { id: 'fb-1-2', description: 'Set winter heating thermostat 1 degree lower to reduce power bills', impact: 'High', completed: false },
        { id: 'fb-1-3', description: 'Audit local light fixtures and swap standard bulbs to LED technology', impact: 'High', completed: false },
      ],
    },
    {
      week: 2,
      title: 'Transport Swapping',
      tasks: [
        { id: 'fb-2-1', description: 'Swap at least one short car trip (<3km) with walking or cycling', impact: 'Medium', completed: false },
        { id: 'fb-2-2', description: 'Ensure regular car oil changes and proper tire inflation', impact: 'Low', completed: false },
        { id: 'fb-2-3', description: 'Utilize public transit for a full return journey twice this week', impact: 'High', completed: false },
      ],
    },
    {
      week: 3,
      title: 'Climate Cooking & Waste Reduce',
      tasks: [
        { id: 'fb-3-1', description: 'Prepare 100% plant-based recipes during dinner times', impact: 'High', completed: false },
        { id: 'fb-3-2', description: 'Create grocery shopping list based strictly on real ingredients to drop waste', impact: 'Medium', completed: false },
        { id: 'fb-3-3', description: 'Segregate all plastics, cardboard, and aluminum cans for municipal recycling', impact: 'Medium', completed: false },
      ],
    },
    {
      week: 4,
      title: 'Mindful Consumer Habits',
      tasks: [
        { id: 'fb-4-1', description: 'Repair damaged household items instead of repurchasing newer versions', impact: 'Medium', completed: false },
        { id: 'fb-4-2', description: 'Decline one unnecessary clothing checkout to prevent retail manufacturing CO2', impact: 'High', completed: false },
        { id: 'fb-4-3', description: 'Initiate a 30-day eco-diary tracking local community clean campaigns', impact: 'Low', completed: false },
      ],
    },
  ];

  return {
    persona: {
      title,
      badge,
      description,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      goals: goals.slice(0, 3),
      imagePrompt: 'Flat illustration of a green leafy tree representing climate awareness',
    },
    roadmap,
  };
}

function getRuleChatResponse(query: string, profile: FullProfile): string {
  const normQuery = query.toLowerCase();
  const breakdown = profile.breakdown;

  if (normQuery.includes('transport') || normQuery.includes('car') || normQuery.includes('drive') || normQuery.includes('flight')) {
    return `### 🚗 Transport Offset Diagnosis
Based on your transport footprint (**${breakdown.transportation.toFixed(2)} tons CO2e/year**):
1. **Public Transit Pivot**: Swapping standard fuel commutes for trains or buses cuts traveling footprint by up to **75% per kilometer**.
2. **Drive Smarter**: Maintaining recommended tire pressures increases fuel range, preserving up to **3% efficiency** immediately.
3. **Flight Truncating**: Aviation generates a vast greenhouse footprint. Swapping long flights for video conferences saves massive chunks of carbon.
Let me know if you would like me to customize your Weekly Challenges for commuting!`;
  }

  if (normQuery.includes('eat') || normQuery.includes('food') || normQuery.includes('diet') || normQuery.includes('meat') || normQuery.includes('waste')) {
    return `### 🥗 Dietary Carbon Insights
Your agricultural feeding footprint contributes **${breakdown.food.toFixed(2)} tons CO2e/year**:
1. **The Methane Factor**: Beef and sheep farming are highly calorie-intensive crops emitting significant methane. Swapping red meat for poultry, fish, or vegetable proteins twice a week results in notable footprint improvements.
2. **Eliminate Wastage**: Food decomposing in standard community dumps produces volatile gas. Planning meals precisely isolates spoilage.
3. **Sourcing Local**: Shipping groceries from far off coordinates burns heavy diesel in ocean ships. Consuming local farm-grown crops reduces transportation chain footprint.`;
  }

  if (normQuery.includes('electricity') || normQuery.includes('solar') || normQuery.includes('energy') || normQuery.includes('power')) {
    return `### 🔌 Home Energy Audit
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
