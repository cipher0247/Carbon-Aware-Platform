/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const EMISSION_FACTORS = {
  // Transport factors in kg CO2e per km
  transport: {
    car: {
      gasoline: 0.18,
      diesel: 0.17,
      hybrid: 0.09,
      electric: 0.04,
    },
    publicTransport: 0.05,
    flightHour: 90.0, // kg CO2e per flight hour
  },

  // Food factors (base tons CO2e per year)
  food: {
    diets: {
      'meat-heavy': 2.5,
      balanced: 1.8,
      'low-meat': 1.4,
      vegetarian: 1.0,
      vegan: 0.6,
    },
    wasteModifiers: {
      high: 0.3,
      medium: 0.1,
      low: 0.0,
    },
    localSourcingMaxSavingsRatio: 0.15, // Up to 15% reduction for 100% local sourcing
  },

  // Energy factors
  energy: {
    electricityKwhCo2: 0.4, // kg CO2e per kWh
  },

  // Shopping factors (kg CO2e per item)
  shopping: {
    clothingItem: 8.0,
    electronicsItem: 150.0,
  },

  // Waste factors (kg CO2e per bag)
  waste: {
    bag: 2.5,
    recyclingMaxSavingsRatio: 0.50, // Up to 50% waste emission reduction for 100% recycling
  },
};

// Help text for transparency
export const CALCULATION_FORMULAS = [
  {
    category: 'Transportation',
    formula: 'Yearly Car Km × Fuel Factor + Yearly Public Transport Km × 0.05 + Yearly Flight Hours × 90',
    details: 'Car emissions vary by fuel (Gasoline: 180g/km, Diesel: 170g/km, Hybrid: 90g/km, Electric: 40g/km). Public transit is highly efficient (50g/km). Flight hours account for aviation fuel burn (90kg/hour).',
  },
  {
    category: 'Food Habits',
    formula: '(Diet Base + Waste Modifier) × (1 - Local Sourcing Savings)',
    details: 'Base annual emissions of diets: Meat-heavy (2.5t), Balanced (1.8t), Vegetarian (1.0t), Vegan (0.6t). Food waste contributes up to 300kg/year. High local sourcing can offset up to 15% of food emissions.',
  },
  {
    category: 'Electricity & Energy',
    formula: 'Monthly kWh × 12 × 0.4kg CO2 × (1 - Renewable Ratio)',
    details: 'Standard grid average is approximately 400g CO2 per kWh. Providing electricity through solar or renewable energy plans offsets these emissions dynamically.',
  },
  {
    category: 'Shopping Habits',
    formula: 'Yearly Clothes × 8kg CO2 + Yearly Electronics × 150kg CO2',
    details: 'Garment production uses significant water and energy (8kg per piece). Tech electronics are high-impact items due to precious metal extraction and semiconductor manufacturing (150kg per item).',
  },
  {
    category: 'Waste Generation',
    formula: 'Bags per week × 52 × 2.5kg CO2 × (1 - 0.5 × Recycling Ratio)',
    details: 'Decomposing waste creates landfill greenhouse gases (2.5kg per bag). Standard recycling practices can save up to 50% of landfill emissions.',
  },
];
