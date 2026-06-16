import { z } from 'zod';

export const LifestyleAssessmentSchema = z.object({
  // Transportation
  carKmPerWeek: z.coerce.number().min(0, "Kilometers must be a positive number").max(10000, "Maximum car kilometers exceeded"),
  carFuelType: z.enum(['gasoline', 'diesel', 'hybrid', 'electric']),
  publicTransportKmPerWeek: z.coerce.number().min(0, "Kilometers must be a positive number").max(10000, "Maximum public transit kilometers exceeded"),
  flightsHoursPerYear: z.coerce.number().min(0, "Flight hours must be positive").max(2000, "Maximum flight hours exceeded"),

  // Diet
  meatDietType: z.enum(['meat-heavy', 'balanced', 'low-meat', 'vegetarian', 'vegan']),
  localFoodRatio: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100"),
  foodWasteLevel: z.enum(['high', 'medium', 'low']),

  // Energy
  electricityKwhPerMonth: z.coerce.number().min(0, "Electricity kWh must be positive").max(100000, "Maximum electricity exceeded"),
  renewableEnergyRatio: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100"),

  // Shopping
  clothingPurchasesPerMonth: z.coerce.number().min(0, "Clothing purchases must be positive").max(1000, "Purchases must be realistic"),
  electronicsPurchasesPerYear: z.coerce.number().min(0, "Electronics purchases must be positive").max(500, "Purchases must be realistic"),

  // Waste
  wasteBagsPerWeek: z.coerce.number().min(0, "Waste bags must be positive").max(1000, "Bags must be realistic"),
  recyclingRatio: z.coerce.number().min(0).max(100, "Percentage must be between 0 and 100"),
});

export type LifestyleAssessmentType = z.infer<typeof LifestyleAssessmentSchema>;

export const RoadmapToggleSchema = z.object({
  week: z.coerce.number().int().min(1).max(52),
  taskId: z.string().min(1, "Task ID is required"),
});

export const ChallengeToggleSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required"),
});

export const ChallengeAddSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(80, "Title is too long"),
  description: z.string().min(5, "Description must be at least 5 characters").max(180, "Description is too long"),
  category: z.enum(['transport', 'food', 'energy', 'consumption', 'waste']),
  impactWeightKnob: z.string().max(25).optional().default("-2.0 kg CO2e"),
});

export const CoachMessageSchema = z.object({
  text: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
});

export const WhatIfExplainSchema = z.object({
  currentTotal: z.coerce.number().min(0).max(500),
  projectedTotal: z.coerce.number().min(0).max(500),
  monthlyReductionKg: z.coerce.number().min(0).max(10000),
  yearlyReductionKg: z.coerce.number().min(0).max(120000),
  adjustments: z.record(z.string(), z.any()).optional(),
});
