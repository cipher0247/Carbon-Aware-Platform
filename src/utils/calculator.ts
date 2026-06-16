import { LifestyleAssessment, EmissionBreakdown } from '../types';
import { EMISSION_FACTORS } from '../constants';

export function calculateEmissions(assessment: LifestyleAssessment): EmissionBreakdown {
  const currentFactors = EMISSION_FACTORS;

  // 1. Transportation
  const carFuelFactor = currentFactors.transport.car[assessment.carFuelType] || currentFactors.transport.car.gasoline;
  const carEmissionsYearly = (assessment.carKmPerWeek * 52 * carFuelFactor) / 1000; // in tons CO2e
  const publicTransportEmissionsYearly = (assessment.publicTransportKmPerWeek * 52 * currentFactors.transport.publicTransport) / 1000; // in tons
  const flightEmissionsYearly = (assessment.flightsHoursPerYear * currentFactors.transport.flightHour) / 1000; // in tons
  const transportTotal = Number((carEmissionsYearly + publicTransportEmissionsYearly + flightEmissionsYearly).toFixed(2));

  // 2. Food
  const baseFoodEmissions = currentFactors.food.diets[assessment.meatDietType] || currentFactors.food.diets.balanced;
  const foodWasteAdded = currentFactors.food.wasteModifiers[assessment.foodWasteLevel] || 0.1;
  const foodSourcingSavings = (assessment.localFoodRatio / 100) * currentFactors.food.localSourcingMaxSavingsRatio;
  const foodTotal = Number(((baseFoodEmissions + foodWasteAdded) * (1 - foodSourcingSavings)).toFixed(2));

  // 3. Energy
  const yearlyElectricityKwh = assessment.electricityKwhPerMonth * 12;
  const baseEnergyEmissions = (yearlyElectricityKwh * currentFactors.energy.electricityKwhCo2) / 1000; // tons
  const energySavings = (assessment.renewableEnergyRatio / 100);
  const energyTotal = Number((baseEnergyEmissions * (1 - energySavings)).toFixed(2));

  // 4. Shopping
  const clothesYearly = assessment.clothingPurchasesPerMonth * 12;
  const electronicsYearly = assessment.electronicsPurchasesPerYear;
  const clothingEmissions = (clothesYearly * currentFactors.shopping.clothingItem) / 1000; // tons
  const electronicsEmissions = (electronicsYearly * currentFactors.shopping.electronicsItem) / 1000; // tons
  const shoppingTotal = Number((clothingEmissions + electronicsEmissions).toFixed(2));

  // 5. Waste
  const wasteBagsYearly = assessment.wasteBagsPerWeek * 52;
  const baseWasteEmissions = (wasteBagsYearly * currentFactors.waste.bag) / 1000; // tons
  const recycleSavings = (assessment.recyclingRatio / 100) * currentFactors.waste.recyclingMaxSavingsRatio;
  const wasteTotal = Number((baseWasteEmissions * (1 - recycleSavings)).toFixed(2));

  const total = Number((transportTotal + foodTotal + energyTotal + shoppingTotal + wasteTotal).toFixed(2));

  return {
    transportation: transportTotal,
    food: foodTotal,
    energy: energyTotal,
    shopping: shoppingTotal,
    waste: wasteTotal,
    total,
  };
}

// Computes a visual 0-100 Eco Score based on how close emissions are to global climate targets
// (Under 2.5 tons is excellent (score 90-100), standard average is ~8.5 tons, high emissions > 15 tons)
export function calculateEcoScore(totalEmissions: number): number {
  if (totalEmissions <= 1.5) return 100;
  if (totalEmissions <= 3.0) {
    // 3.0 tons is 90, 1.5 tons is 100
    return Math.round(100 - ((totalEmissions - 1.5) / 1.5) * 10);
  }
  if (totalEmissions <= 7.0) {
    // 7.0 tons is 70, 3.0 tons is 90
    return Math.round(90 - ((totalEmissions - 3.0) / 4.0) * 20);
  }
  if (totalEmissions <= 15.0) {
    // 15.0 tons is 30, 7.0 tons is 70
    return Math.round(70 - ((totalEmissions - 7.0) / 8.0) * 40);
  }
  if (totalEmissions <= 25.0) {
    // 25.0 tons is 10, 15.0 tons is 30
    return Math.round(30 - ((totalEmissions - 15.0) / 10.0) * 20);
  }
  return 10;
}
