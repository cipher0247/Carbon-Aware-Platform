/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LifestyleAssessment {
  // Transportation
  carKmPerWeek: number;
  carFuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  publicTransportKmPerWeek: number;
  flightsHoursPerYear: number;

  // Food
  meatDietType: 'meat-heavy' | 'balanced' | 'low-meat' | 'vegetarian' | 'vegan';
  localFoodRatio: number; // Percentage (0-100)
  foodWasteLevel: 'high' | 'medium' | 'low';

  // Energy
  electricityKwhPerMonth: number;
  renewableEnergyRatio: number; // Percentage (0-100)

  // Shopping
  clothingPurchasesPerMonth: number;
  electronicsPurchasesPerYear: number;

  // Waste
  wasteBagsPerWeek: number;
  recyclingRatio: number; // Percentage (0-100)
}

export interface EmissionBreakdown {
  transportation: number; // Tons of CO2e per year
  food: number;
  energy: number;
  shopping: number;
  waste: number;
  total: number;
}

export interface Hotspot {
  category: keyof Omit<EmissionBreakdown, 'total'>;
  percentage: number;
  value: number;
  description: string;
}

export interface GreenPersona {
  title: string;
  badge: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  goals: string[];
  imagePrompt: string; // Used if we want to display an elegant representation
}

export interface RoadmapWeek {
  week: number;
  title: string;
  tasks: {
    id: string;
    description: string;
    impact: string; // e.g. "High", "Medium", "Low"
    completed: boolean;
  }[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  impactWeightKnob: string; // e.g. "-15kg CO2e"
  completed: boolean;
  category: 'transport' | 'food' | 'energy' | 'consumption' | 'waste';
}

export interface TrackedHistory {
  date: string;
  id: string;
  emissions: EmissionBreakdown;
  ecoScore: number;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export interface FullProfile {
  assessment: LifestyleAssessment;
  breakdown: EmissionBreakdown;
  hotspots: Hotspot[];
  persona: GreenPersona;
  roadmap: RoadmapWeek[];
  challenges: Challenge[];
  history: TrackedHistory[];
  ecoScore: number;
}
