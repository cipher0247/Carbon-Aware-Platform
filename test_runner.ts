import { calculateEmissions, calculateEcoScore } from './src/utils/calculator';
import { LifestyleAssessment } from './src/types';
import { LifestyleAssessmentSchema, CoachMessageSchema } from './src/utils/validation';

interface TestCase {
  name: string;
  input: LifestyleAssessment;
  expectedMinTotal: number;
  expectedMaxTotal: number;
}

const TEST_ASSESSMENTS: TestCase[] = [
  {
    name: 'Eco-Champion Vegan EV Driver',
    input: {
      carKmPerWeek: 0,
      carFuelType: 'electric',
      publicTransportKmPerWeek: 20,
      flightsHoursPerYear: 0,
      meatDietType: 'vegan',
      localFoodRatio: 80,
      foodWasteLevel: 'low',
      electricityKwhPerMonth: 80,
      renewableEnergyRatio: 90,
      clothingPurchasesPerMonth: 0,
      electronicsPurchasesPerYear: 0,
      wasteBagsPerWeek: 1,
      recyclingRatio: 90,
    },
    expectedMinTotal: 0.5,
    expectedMaxTotal: 1.5,
  },
  {
    name: 'Standard Commuter Balanced Lifestyle',
    input: {
      carKmPerWeek: 150,
      carFuelType: 'gasoline',
      publicTransportKmPerWeek: 50,
      flightsHoursPerYear: 10,
      meatDietType: 'balanced',
      localFoodRatio: 30,
      foodWasteLevel: 'medium',
      electricityKwhPerMonth: 300,
      renewableEnergyRatio: 20,
      clothingPurchasesPerMonth: 2,
      electronicsPurchasesPerYear: 1,
      wasteBagsPerWeek: 3,
      recyclingRatio: 40,
    },
    expectedMinTotal: 4.5,
    expectedMaxTotal: 6.5,
  },
  {
    name: 'High-Emission Luxury Traveler',
    input: {
      carKmPerWeek: 500,
      carFuelType: 'diesel',
      publicTransportKmPerWeek: 0,
      flightsHoursPerYear: 45,
      meatDietType: 'meat-heavy',
      localFoodRatio: 10,
      foodWasteLevel: 'high',
      electricityKwhPerMonth: 800,
      renewableEnergyRatio: 0,
      clothingPurchasesPerMonth: 8,
      electronicsPurchasesPerYear: 4,
      wasteBagsPerWeek: 6,
      recyclingRatio: 10,
    },
    expectedMinTotal: 12.0,
    expectedMaxTotal: 18.0,
  },
];

function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING SUSTAINABILITY INTEGRITY TEST SUITE...');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Emissions calculator & configurations consistency
  for (const tc of TEST_ASSESSMENTS) {
    console.log(`Testing Case: [${tc.name}]`);
    try {
      const breakdown = calculateEmissions(tc.input);
      console.log(`  -> Transportation: ${breakdown.transportation.toFixed(2)} t`);
      console.log(`  -> Food & Diet:     ${breakdown.food.toFixed(2)} t`);
      console.log(`  -> Home Energy:     ${breakdown.energy.toFixed(2)} t`);
      console.log(`  -> Shopping Habits: ${breakdown.shopping.toFixed(2)} t`);
      console.log(`  -> Waste Disposal:  ${breakdown.waste.toFixed(2)} t`);
      console.log(`  -> Total:           ${breakdown.total.toFixed(2)} t`);

      if (breakdown.total >= tc.expectedMinTotal && breakdown.total <= tc.expectedMaxTotal) {
        console.log('  🟢 PASS: Emissions calculation within realistic bounds.');
        passed++;
      } else {
        console.log(`  🔴 FAIL: Calc total ${breakdown.total} outside target bounds [${tc.expectedMinTotal}, ${tc.expectedMaxTotal}]`);
        failed++;
      }
    } catch (err: any) {
      console.error('  🔴 FAIL: System threw unexpected exception:', err.message);
      failed++;
    }
    console.log('');
  }

  // Test 2: Boundaries of Eco Score calculations
  console.log('Testing Case: [Eco-Score boundaries logic]');
  try {
    const excellentScore = calculateEcoScore(1.2); // Expected 100
    const highModerateScore = calculateEcoScore(5.2); // Expected approx 75-80
    const extremelyHighScore = calculateEcoScore(25.0); // Expected floor ~10

    console.log(`  -> Footprint 1.2 tons  => Score: ${excellentScore} (Expected: 100)`);
    console.log(`  -> Footprint 5.2 tons  => Score: ${highModerateScore} (Expected: ~79)`);
    console.log(`  -> Footprint 25.0 tons => Score: ${extremelyHighScore} (Expected: 10)`);

    if (excellentScore === 100 && extremelyHighScore === 10 && highModerateScore > 50 && highModerateScore < 90) {
      console.log('  🟢 PASS: Eco Score curves are operating properly.');
      passed++;
    } else {
      console.log('  🔴 FAIL: Score interpolation bounds did not line up correctly.');
      failed++;
    }
  } catch (err: any) {
    console.error('  🔴 FAIL:', err.message);
    failed++;
  }
  console.log('');

  // Test 3: Input Validation and Schema Robustness
  console.log('Testing Case: [Zod Input Validation Schema Checks]');
  try {
    // Valid assessment payload
    const validPayload = {
      carKmPerWeek: 120,
      carFuelType: 'electric',
      publicTransportKmPerWeek: 40,
      flightsHoursPerYear: 5,
      meatDietType: 'balanced',
      localFoodRatio: 45,
      foodWasteLevel: 'medium',
      electricityKwhPerMonth: 150,
      renewableEnergyRatio: 50,
      clothingPurchasesPerMonth: 2,
      electronicsPurchasesPerYear: 1,
      wasteBagsPerWeek: 2,
      recyclingRatio: 60,
    };
    
    const validCheck = LifestyleAssessmentSchema.safeParse(validPayload);
    if (validCheck.success) {
      console.log('  🟢 PASS: Valid Lifestyle assessment was parsed successfully.');
      passed++;
    } else {
      console.log('  🔴 FAIL: Valid assessment was rejected by Zod schema.');
      failed++;
    }

    // Invalid negative values payload
    const invalidPayloadNegative = { ...validPayload, carKmPerWeek: -15 };
    const invalidCheckNegative = LifestyleAssessmentSchema.safeParse(invalidPayloadNegative);
    if (!invalidCheckNegative.success) {
      console.log('  🟢 PASS: Schema rejected negative driving distance correctly.');
      passed++;
    } else {
      console.log('  🔴 FAIL: Schema incorrectly permitted negative driving values.');
      failed++;
    }

    // Out-of-bounds percentage ratio payload
    const invalidPayloadRatio = { ...validPayload, recyclingRatio: 150 };
    const invalidCheckRatio = LifestyleAssessmentSchema.safeParse(invalidPayloadRatio);
    if (!invalidCheckRatio.success) {
      console.log('  🟢 PASS: Schema rejected ratio above 100% correct.');
      passed++;
    } else {
      console.log('  🔴 FAIL: Schema incorrectly permitted percentage value > 100%.');
      failed++;
    }

    // Coach message input validation checks
    const validMessage = { text: 'Hello, I want to plant 10 trees' };
    const invalidMessage = { text: '' }; // empty text fail bounds
    
    if (CoachMessageSchema.safeParse(validMessage).success && !CoachMessageSchema.safeParse(invalidMessage).success) {
      console.log('  🟢 PASS: Coach message text empty constraints handled correctly.');
      passed++;
    } else {
      console.log('  🔴 FAIL: Coach message character boundaries breached.');
      failed++;
    }

  } catch (err: any) {
    console.error('  🔴 FAIL: Validation tests caught exception:', err.message);
    failed++;
  }
  console.log('');

  console.log('==================================================');
  console.log(`📊 TEST EXECUTION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
