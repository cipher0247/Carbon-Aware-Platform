import fs from 'fs';
import path from 'path';
import { LifestyleAssessment, EmissionBreakdown, Hotspot, GreenPersona, RoadmapWeek, Challenge, TrackedHistory, CoachMessage, FullProfile } from '../src/types';
import { calculateEmissions, calculateEcoScore } from '../src/utils/calculator';

const isVercel = process.env.VERCEL || process.env.NOW_REGION;
const DB_FILE = isVercel
  ? path.join('/tmp', 'database.json')
  : path.join(process.cwd(), 'database.json');

interface Schema {
  profile: {
    assessment: LifestyleAssessment | null;
    breakdown: EmissionBreakdown | null;
    persona: GreenPersona | null;
    ecoScore: number;
  };
  history: TrackedHistory[];
  roadmap: RoadmapWeek[];
  challenges: Challenge[];
  messages: CoachMessage[];
}

const DEFAULT_LIFESTYLE: LifestyleAssessment = {
  carKmPerWeek: 180,
  carFuelType: 'gasoline',
  publicTransportKmPerWeek: 40,
  flightsHoursPerYear: 12,
  meatDietType: 'balanced',
  localFoodRatio: 25,
  foodWasteLevel: 'medium',
  electricityKwhPerMonth: 350,
  renewableEnergyRatio: 10,
  clothingPurchasesPerMonth: 2,
  electronicsPurchasesPerYear: 1,
  wasteBagsPerWeek: 3,
  recyclingRatio: 30,
};

const DEFAULT_PERSONA: GreenPersona = {
  title: 'Conscious Commuter',
  badge: '🌱 Eco Explorer',
  description: 'You are taking active steps to balance modern life with environmental mindfulness. You are familiar with recycling and public transit, but fuel-powered driving and home energy consumption remain your primary hotspots.',
  strengths: ['Active recycler', 'Uses public transport weekly', 'Low clothing consumption'],
  weaknesses: ['Daily usage of gasoline car', 'Incomplete home energy insulation', 'Diet includes red meat'],
  goals: ['Halve gasoline car trips', 'Introduce Meat-free Mondays', 'Increase renewable electricity share'],
  imagePrompt: 'A clean modern flat vector icon representing a professional commuter with bicycle and green leaves',
};

const DEFAULT_ROADMAP: RoadmapWeek[] = [
  {
    week: 1,
    title: 'Energy and Power Saving',
    tasks: [
      { id: 'rm-1-1', description: 'Switch off appliances at the wall outlet to eliminate standby power', impact: 'Medium', completed: true },
      { id: 'rm-1-2', description: 'Swap 5 main household incandescent globes to high-efficiency LEDs', impact: 'High', completed: false },
      { id: 'rm-1-3', description: 'Reduce HVAC heater thermostat by 1°C during winters', impact: 'High', completed: false },
    ],
  },
  {
    week: 2,
    title: 'Sustainable Commuting Habits',
    tasks: [
      { id: 'rm-2-1', description: 'Combine multiple quick weekly running errands into one single trip', impact: 'Medium', completed: false },
      { id: 'rm-2-2', description: 'Ride public transit or work from home twice this week', impact: 'High', completed: false },
      { id: 'rm-2-3', description: 'Inflate car tires to recommended levels to improve fuel mileage', impact: 'Low', completed: false },
    ],
  },
  {
    week: 3,
    title: 'Mindful Meals & Sourcing',
    tasks: [
      { id: 'rm-3-1', description: 'Participate in Meat-free Monday with totally plant-based meals', impact: 'High', completed: false },
      { id: 'rm-3-2', description: 'Audit fridge contents before grocery trips to reduce food spoilage', impact: 'Medium', completed: false },
      { id: 'rm-3-3', description: 'Purchase fresh groceries from local farmers markets instead of imported goods', impact: 'Low', completed: false },
    ],
  },
  {
    week: 4,
    title: 'Circular Wardrobe & Garbage Reduction',
    tasks: [
      { id: 'rm-4-1', description: 'Adopt proper trash segregation for plastic, paper, and food scraps', impact: 'Medium', completed: false },
      { id: 'rm-4-2', description: 'Refrain from purchasing brand new fast-fashion garments for 30 days', impact: 'High', completed: false },
      { id: 'rm-4-3', description: 'Donate, recycle or sell 5 items of unused clothing', impact: 'Low', completed: false },
    ],
  },
];

const DEFAULT_CHALLENGES: Challenge[] = [
  { id: 'ch-1', title: 'Meat-free Monday', description: 'Replace all meat dishes with satisfying vegetarian or vegan alternatives for 24 hours.', impactWeightKnob: '-5.2 kg CO2e', completed: false, category: 'food' },
  { id: 'ch-2', title: 'Energy-Saving Evening', description: 'Turn off all screens and non-essential lights after 8 PM. Read a physical book or play a board game.', impactWeightKnob: '-2.4 kg CO2e', completed: false, category: 'energy' },
  { id: 'ch-3', title: 'Car-Free Day', description: 'Swap the car for walking, cycling, or public transport on all commutes today.', impactWeightKnob: '-8.1 kg CO2e', completed: false, category: 'transport' },
  { id: 'ch-4', title: 'Zero Waste Zero Spoilage', description: 'Finish every portion on your plate and cook creatively using leftovers.', impactWeightKnob: '-1.8 kg CO2e', completed: false, category: 'waste' },
];

const SECOND_DEFAULT_HISTORY: TrackedHistory[] = [
  { date: '2026-03-01', id: 'h-1', emissions: { transportation: 4.8, food: 2.1, energy: 3.2, shopping: 1.5, waste: 0.8, total: 12.4 }, ecoScore: 41 },
  { date: '2026-04-01', id: 'h-2', emissions: { transportation: 4.2, food: 1.9, energy: 2.8, shopping: 1.2, waste: 0.7, total: 10.8 }, ecoScore: 49 },
  { date: '2026-05-01', id: 'h-3', emissions: { transportation: 3.5, food: 1.8, energy: 2.2, shopping: 0.9, waste: 0.5, total: 8.9 }, ecoScore: 61 },
  { date: '2026-06-01', id: 'h-4', emissions: { transportation: 2.9, food: 1.6, energy: 1.8, shopping: 0.6, waste: 0.4, total: 7.3 }, ecoScore: 69 },
];

class Database {
  private schema: Schema;

  constructor() {
    this.schema = {
      profile: {
        assessment: null,
        breakdown: null,
        persona: null,
        ecoScore: 0,
      },
      history: [],
      roadmap: [],
      challenges: [],
      messages: [],
    };
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf8');
        this.schema = JSON.parse(content);
      } else {
        // Run seed
        this.seed();
      }
    } catch (err) {
      console.warn('Failed to load database. Re-seeding as precaution...', err);
      this.seed();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  private seed() {
    const breakdown = calculateEmissions(DEFAULT_LIFESTYLE);
    const ecoScore = calculateEcoScore(breakdown.total);

    this.schema = {
      profile: {
        assessment: DEFAULT_LIFESTYLE,
        breakdown,
        persona: DEFAULT_PERSONA,
        ecoScore,
      },
      history: [
        ...SECOND_DEFAULT_HISTORY,
        {
          date: '2026-06-16',
          id: 'h-current',
          emissions: breakdown,
          ecoScore,
        }
      ],
      roadmap: DEFAULT_ROADMAP,
      challenges: DEFAULT_CHALLENGES,
      messages: [
        {
          id: 'm-init',
          sender: 'coach',
          text: "Greetings! I'm your AI Sustainability Coach. I've designed a specialized eco-plan based on your energy and transport profile. Try experimenting with the What-If Simulator or track your carbon reduction targets below!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ],
    };
    this.save();
  }

  // API operations
  getProfile(): FullProfile {
    // If not calculated yet, seed
    if (!this.schema.profile.assessment) {
      this.seed();
    }
    return {
      assessment: this.schema.profile.assessment!,
      breakdown: this.schema.profile.breakdown!,
      hotspots: this.getHotspots(this.schema.profile.breakdown!),
      persona: this.schema.profile.persona!,
      roadmap: this.schema.roadmap,
      challenges: this.schema.challenges,
      history: this.schema.history,
      ecoScore: this.schema.profile.ecoScore,
    };
  }

  updateAssessment(assessment: LifestyleAssessment, generatedPersona?: GreenPersona, generatedRoadmap?: RoadmapWeek[]): FullProfile {
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

    // Capture in history
    const todayStr = new Date().toISOString().split('T')[0];
    const existingIndex = this.schema.history.findIndex(h => h.date === todayStr);
    const newHistoryNode: TrackedHistory = {
      date: todayStr,
      id: existingIndex >= 0 ? this.schema.history[existingIndex].id : 'h-' + Date.now(),
      emissions: breakdown,
      ecoScore,
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
  toggleRoadmapTask(weekNum: number, taskId: string): RoadmapWeek[] {
    const week = this.schema.roadmap.find(w => w.week === weekNum);
    if (week) {
      const task = week.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        this.save();
      }
    }
    return this.schema.roadmap;
  }

  // Toggle challenges
  toggleChallenge(challengeId: string): Challenge[] {
    const challenge = this.schema.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.completed = !challenge.completed;
      this.save();
    }
    return this.schema.challenges;
  }

  // Add customized challenge
  addChallenge(challenge: Challenge) {
    this.schema.challenges.push(challenge);
    this.save();
    return this.schema.challenges;
  }

  // Reset/seed helper for testing or clean start
  resetDB() {
    this.seed();
    return this.getProfile();
  }

  // Get messages
  getMessages(): CoachMessage[] {
    return this.schema.messages;
  }

  // Add message
  addMessage(msg: Omit<CoachMessage, 'id' | 'timestamp'>): CoachMessage {
    const newMsg: CoachMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.schema.messages.push(newMsg);
    this.save();
    return newMsg;
  }

  // Calculation for Emission Hostspots
  private getHotspots(breakdown: EmissionBreakdown): Hotspot[] {
    const categories: { key: keyof Omit<EmissionBreakdown, 'total'>; label: string }[] = [
      { key: 'transportation', label: 'Transportation' },
      { key: 'food', label: 'Food & Diet' },
      { key: 'energy', label: 'Electricity & Energy' },
      { key: 'shopping', label: 'Shopping & Consumerism' },
      { key: 'waste', label: 'Household Waste' },
    ];

    const mapped = categories.map(cat => {
      const val = breakdown[cat.key];
      const percentage = breakdown.total > 0 ? (val / breakdown.total) * 100 : 0;
      return {
        key: cat.key,
        label: cat.label,
        value: val,
        percentage: Number(percentage.toFixed(1)),
      };
    }).sort((a, b) => b.value - a.value);

    // Mapped contains highest, second highest, ... lowest
    return mapped.map((item, idx) => {
      let desc = '';
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
        description: desc,
      };
    });
  }
}

export const db = new Database();
