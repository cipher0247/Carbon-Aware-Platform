import React, { useState, useEffect, useRef } from 'react';
import { LifestyleAssessment, EmissionBreakdown } from '../types';
import { calculateEmissions } from '../utils/calculator';
import { requestWhatIfExplanation } from '../services/api';
import { useDebounce } from '../utils/debounce';

interface WhatIfSimulatorProps {
  baseAssessment: LifestyleAssessment;
  baseEmissions: EmissionBreakdown;
}

export function WhatIfSimulator({ baseAssessment, baseEmissions }: WhatIfSimulatorProps) {
  // Simulator tuning states
  const [carReductionPercent, setCarReductionPercent] = useState(0); // 0 - 100
  const [publicTransitIncrease, setPublicTransitIncrease] = useState(0); // Add extra km
  const [meatFreeDaysPerWeek, setMeatFreeDaysPerWeek] = useState(0); // 0 - 7
  const [energySavingPercent, setEnergySavingPercent] = useState(0); // 0 - 50
  const [shoppingReductionPercent, setShoppingReductionPercent] = useState(0); // 0 - 100

  const [projectedEmissions, setProjectedEmissions] = useState<EmissionBreakdown>({ ...baseEmissions });
  const [aiExplanation, setAiExplanation] = useState('Adjust the sliders to run real-time predictions of lifestyle reductions.');
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const triggerRef = useRef<number | null>(null);

  // Run dynamic calculation
  useEffect(() => {
    // Model adjusted lifestyle assessment
    const adjustedAssessment: LifestyleAssessment = {
      ...baseAssessment,
      // Reduce car driving by x%
      carKmPerWeek: Math.max(0, baseAssessment.carKmPerWeek * (1 - carReductionPercent / 100)),
      // Public transport km scale up
      publicTransportKmPerWeek: baseAssessment.publicTransportKmPerWeek + publicTransitIncrease,
      // Modify diet based on veggie days
      meatDietType: meatFreeDaysPerWeek >= 5 ? 'vegan' : meatFreeDaysPerWeek >= 3 ? 'vegetarian' : meatFreeDaysPerWeek >= 1 ? 'low-meat' : baseAssessment.meatDietType,
      // Reduce electricity
      electricityKwhPerMonth: Math.max(0, baseAssessment.electricityKwhPerMonth * (1 - energySavingPercent / 100)),
      // Reduce purchases
      clothingPurchasesPerMonth: Math.max(0, baseAssessment.clothingPurchasesPerMonth * (1 - shoppingReductionPercent / 100)),
      electronicsPurchasesPerYear: Math.max(0, baseAssessment.electronicsPurchasesPerYear * (1 - shoppingReductionPercent / 100)),
    };

    const calculated = calculateEmissions(adjustedAssessment);
    setProjectedEmissions(calculated);
  }, [carReductionPercent, publicTransitIncrease, meatFreeDaysPerWeek, energySavingPercent, shoppingReductionPercent, baseAssessment]);

  // Memoize raw sliding adjustments
  const adjustments = React.useMemo(() => ({
    carReductionPercent,
    publicTransitIncrease,
    meatFreeDaysPerWeek,
    energySavingPercent,
    shoppingReductionPercent,
    projectedTotal: projectedEmissions.total,
  }), [carReductionPercent, publicTransitIncrease, meatFreeDaysPerWeek, energySavingPercent, shoppingReductionPercent, projectedEmissions.total]);

  // Debounce the adjustments by 1200ms
  const debouncedAdjustments = useDebounce(adjustments, 1200);

  // Request Gemini Explanation on debounced adjustments change to guard server resources
  useEffect(() => {
    const {
      carReductionPercent: debCar,
      publicTransitIncrease: debTransit,
      meatFreeDaysPerWeek: debMeat,
      energySavingPercent: debEnergy,
      shoppingReductionPercent: debShopping,
      projectedTotal: debProjectedTotal
    } = debouncedAdjustments;

    const changesMade = debCar > 0 || debTransit > 0 || debMeat > 0 || debEnergy > 0 || debShopping > 0;
    if (!changesMade) {
      setAiExplanation('Adjust the sliders to run real-time predictions of lifestyle reductions.');
      return;
    }

    let isSubscribed = true;
    setIsLoadingExplanation(true);

    const fetchExplanation = async () => {
      try {
        const payload = {
          currentTotal: baseEmissions.total,
          projectedTotal: debProjectedTotal,
          monthlyReductionKg: Math.max(0, ((baseEmissions.total - debProjectedTotal) * 1000) / 12),
          yearlyReductionKg: Math.max(0, (baseEmissions.total - debProjectedTotal) * 1000),
          adjustments: {
            carReductionPercent: `${debCar}% less driving`,
            publicTransitIncrease: `+${debTransit}km transit usage`,
            meatFreeDaysPerWeek: `${debMeat} vegetarian dishes/week`,
            energySavingPercent: `${debEnergy}% home utility savings`,
            shoppingReductionPercent: `${debShopping}% minimal purchases`,
          }
        };
        const explanation = await requestWhatIfExplanation(payload);
        if (isSubscribed) {
          setAiExplanation(explanation);
        }
      } catch (err) {
        console.error('Failed to update simulation explanation:', err);
      } finally {
        if (isSubscribed) {
          setIsLoadingExplanation(false);
        }
      }
    };

    fetchExplanation();

    return () => {
      isSubscribed = false;
    };
  }, [debouncedAdjustments, baseEmissions.total]);

  // Calculation parameters
  const yearlyReductionTons = Math.max(0, baseEmissions.total - projectedEmissions.total);
  const monthlyReductionKg = (yearlyReductionTons * 1000) / 12;
  const reductionPercentage = baseEmissions.total > 0 ? (yearlyReductionTons / baseEmissions.total) * 100 : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto" id="carbon-simulator-panel">
      
      {/* Simulation Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sliders Configuration */}
        <div className="lg:col-span-7 bg-white natural-card p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-natural-moss">Experiment with Sustainable Scenarios</h3>
            <p className="text-xs text-natural-muted-dark font-medium">Tune your environmental efforts to predict carbon decreases immediately!</p>
          </div>

          <div className="space-y-6 pt-4">
            {/* Tuning 1: Driving reduction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="drive-reduction-slider" className="text-natural-text font-semibold flex items-center gap-1.5">
                  <span>🚗</span> Reduce Car Driving
                </label>
                <span className="text-natural-moss font-mono text-xs bg-natural-cream/60 px-2 py-0.5 rounded-lg border border-natural-border/30">{carReductionPercent}% less</span>
              </div>
              <input
                id="drive-reduction-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                value={carReductionPercent}
                onChange={e => setCarReductionPercent(parseInt(e.target.value))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={carReductionPercent}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted-dark font-medium">Lowers direct tailpipe emissions from Gasoline/Diesel fuel combustions.</p>
            </div>

            {/* Tuning 2: Bus increase */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="transit-increase-slider" className="text-natural-text font-semibold flex items-center gap-1.5">
                  <span>🚌</span> Scale Public Transport Usage
                </label>
                <span className="text-natural-moss font-mono text-xs bg-natural-cream/60 px-2 py-0.5 rounded-lg border border-natural-border/30">+{publicTransitIncrease} km/week</span>
              </div>
              <input
                id="transit-increase-slider"
                type="range"
                min="0"
                max="150"
                step="10"
                value={publicTransitIncrease}
                onChange={e => setPublicTransitIncrease(parseInt(e.target.value))}
                aria-valuemin={0}
                aria-valuemax={150}
                aria-valuenow={publicTransitIncrease}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted-dark font-medium">Replaces private driving with highly localized city-transit grids.</p>
            </div>

            {/* Tuning 3: Meat-free days */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="meatfree-days-slider" className="text-natural-text font-semibold flex items-center gap-1.5">
                  <span>🥗</span> Meat-Free Days per Week
                </label>
                <span className="text-natural-moss font-mono text-xs bg-natural-cream/60 px-2 py-0.5 rounded-lg border border-natural-border/30">{meatFreeDaysPerWeek} days/week</span>
              </div>
              <input
                id="meatfree-days-slider"
                type="range"
                min="0"
                max="7"
                step="1"
                value={meatFreeDaysPerWeek}
                onChange={e => setMeatFreeDaysPerWeek(parseInt(e.target.value))}
                aria-valuemin={0}
                aria-valuemax={7}
                aria-valuenow={meatFreeDaysPerWeek}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted-dark font-medium">Swapping beef for plant-based grains decreases agricultural methane load.</p>
            </div>

            {/* Tuning 4: Electricity savings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="energy-saving-slider" className="text-natural-text font-semibold flex items-center gap-1.5">
                  <span>🔌</span> Save Household Power
                </label>
                <span className="text-natural-moss font-mono text-xs bg-natural-cream/60 px-2 py-0.5 rounded-lg border border-natural-border/30">-{energySavingPercent}% usage</span>
              </div>
              <input
                id="energy-saving-slider"
                type="range"
                min="0"
                max="50"
                step="5"
                value={energySavingPercent}
                onChange={e => setEnergySavingPercent(parseInt(e.target.value))}
                aria-valuemin={0}
                aria-valuemax={50}
                aria-valuenow={energySavingPercent}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted-dark font-medium">Simulate turning off standby power, LED upgrades, and insulation settings.</p>
            </div>

            {/* Tuning 5: Shopping reduction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="shopping-reduction-slider" className="text-natural-text font-semibold flex items-center gap-1.5">
                  <span>🛍️</span> Mindful Checkout Purchases
                </label>
                <span className="text-natural-moss font-mono text-xs bg-natural-cream/60 px-2 py-0.5 rounded-lg border border-natural-border/30">-{shoppingReductionPercent}%</span>
              </div>
              <input
                id="shopping-reduction-slider"
                type="range"
                min="0"
                max="100"
                step="10"
                value={shoppingReductionPercent}
                onChange={e => setShoppingReductionPercent(parseInt(e.target.value))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={shoppingReductionPercent}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted-dark font-medium">Cutting apparel discard rates and consumer tech turnover factors.</p>
            </div>
          </div>
        </div>

        {/* Prediction Results Board */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6" role="region" aria-live="polite" aria-label="Dynamic Projection Outcomes">
          
          <div className="natural-card-dark p-6 space-y-6 relative overflow-hidden">
            <h3 className="font-bold text-natural-cream text-xs tracking-wider uppercase relative z-10">Live Reduction Analytics</h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-xs text-white/70 block h-4 font-medium">Current Footprint</span>
                <span className="text-2xl font-bold font-mono text-white">{baseEmissions.total.toFixed(2)} <span className="text-xs font-normal text-white/80">tons CO2e</span></span>
              </div>

              <div>
                <span className="text-xs text-white/70 block h-4 font-medium">Projected Footprint</span>
                <span className="text-3xl font-extrabold font-mono text-natural-cream">{projectedEmissions.total.toFixed(2)} <span className="text-xs font-normal text-white">tons CO2e</span></span>
              </div>
            </div>

            {/* Split comparison bar - earth styling */}
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-xs text-white/70">
                <span>Savings Target</span>
                {reductionPercentage > 0 && <span className="text-natural-cream font-extrabold">-{reductionPercentage.toFixed(1)}%</span>}
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden flex" aria-hidden="true">
                <div
                  className="bg-[#CCD5AE] h-full transition-all duration-300"
                  style={{ width: `${Math.max(15, 100 - reductionPercentage)}%` }}
                />
                {reductionPercentage > 0 && (
                  <div
                    className="bg-natural-cream h-full transition-all duration-300 animate-pulse"
                    style={{ width: `${reductionPercentage}%` }}
                  />
                )}
              </div>
            </div>

            {/* Savings metrics indicators */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/15 pt-4 relative z-10">
              <div>
                <span className="text-[10px] uppercase text-white/75 font-semibold">Monthly Saved</span>
                <p className="text-base font-bold text-white mt-1 font-mono">-{monthlyReductionKg.toFixed(1)} kg</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-white/75 font-semibold">Yearly Saved</span>
                <p className="text-base font-bold text-white mt-1 font-mono">-{yearlyReductionTons.toFixed(2)} tons</p>
              </div>
            </div>
            
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#CCD5AE]/10 rounded-full blur-2xl"></div>
          </div>

          {/* Coach Reasoning Explanations */}
          <div className="natural-card-warm border border-natural-cream p-6 space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-natural-moss font-extrabold text-xs uppercase tracking-widest border-b border-natural-cream/60 pb-2 mb-1">
              <span>🤖</span> 
              <span>Coach Scientific Reasoning</span>
              {isLoadingExplanation && (
                <span className="inline-block w-2.5 h-2.5 rounded-full border-b border-natural-moss animate-spin" />
              )}
            </div>
            
            <p className="text-sm font-medium text-natural-text leading-released italic">
              "{aiExplanation}"
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
