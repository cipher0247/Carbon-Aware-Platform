import React, { useState } from 'react';
import { LifestyleAssessment } from '../types';
import { LifestyleAssessmentSchema } from '../utils/validation';

interface AssessmentFormProps {
  initialData: LifestyleAssessment;
  onSave: (data: LifestyleAssessment) => Promise<void>;
}

export function AssessmentForm({ initialData, onSave }: AssessmentFormProps) {
  const [formData, setFormData] = useState<LifestyleAssessment>({ ...initialData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Math.max(0, parseFloat(value) || 0),
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof LifestyleAssessment) => {
    const val = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      [fieldName]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    const validationResult = LifestyleAssessmentSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Invalid assessment variables.';
      setSubmitMessage(`Validation error: ${firstError}`);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave(validationResult.data);
      setSubmitMessage('Your Carbon Footprint profile and personalized roadmap have been updated successfully!');
      setTimeout(() => setSubmitMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setSubmitMessage('We had an error updating your carbon assessment. Please make sure the backend is active.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto" id="lifestyle-assessment-form">
      <div className="natural-card p-6 md:p-8 space-y-8 bg-white">
        
        {/* Section 1: Transportation */}
        <fieldset className="space-y-6">
          <legend className="text-lg font-bold text-natural-moss flex items-center gap-2 border-b border-natural-border pb-3 w-full">
            <span>🚗</span> Transportation & Commuting
          </legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="carKmPerWeek" className="block text-sm font-semibold text-natural-text">
                Weekly Car Mileage (km)
              </label>
              <input
                id="carKmPerWeek"
                name="carKmPerWeek"
                type="number"
                min="0"
                value={formData.carKmPerWeek}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 150"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Total km driven as passenger or driver per week.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="carFuelType" className="block text-sm font-semibold text-natural-text">
                Car Engine / Fuel Type
              </label>
              <select
                id="carFuelType"
                name="carFuelType"
                value={formData.carFuelType}
                onChange={handleSelectChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all text-natural-text bg-white"
              >
                <option value="gasoline">Gasoline / Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Standard Hybrid</option>
                <option value="electric">Battery Electric (EV)</option>
              </select>
              <p className="text-xs text-natural-muted font-medium">EV emissions are mapped using direct grid-weighted rates.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="publicTransportKmPerWeek" className="block text-sm font-semibold text-natural-text">
                Weekly Public Transit Mileage (km)
              </label>
              <input
                id="publicTransportKmPerWeek"
                name="publicTransportKmPerWeek"
                type="number"
                min="0"
                value={formData.publicTransportKmPerWeek}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 50"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Combined weekly distance on buses, subways, and trains.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="flightsHoursPerYear" className="block text-sm font-semibold text-natural-text">
                Annual Flight Duration (Hours)
              </label>
              <input
                id="flightsHoursPerYear"
                name="flightsHoursPerYear"
                type="number"
                min="0"
                value={formData.flightsHoursPerYear}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 10"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Sum of short-haul or long-haul flight hours per year.</p>
            </div>
          </div>
        </fieldset>

        {/* Section 2: Diet Habits */}
        <fieldset className="space-y-6">
          <legend className="text-lg font-bold text-natural-moss flex items-center gap-2 border-b border-natural-border pb-3 w-full">
            <span>🥗</span> Diet and Agriculture Sourcing
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="meatDietType" className="block text-sm font-semibold text-natural-text">
                Common Dietary Intake Pattern
              </label>
              <select
                id="meatDietType"
                name="meatDietType"
                value={formData.meatDietType}
                onChange={handleSelectChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all text-natural-text bg-white"
              >
                <option value="meat-heavy">Meat-Heavy (Eat beef/pork daily)</option>
                <option value="balanced">Balanced (Moderate meat & fish)</option>
                <option value="low-meat">Low Meat (Rarely eat red meat)</option>
                <option value="vegetarian">Vegetarian (No meat, eat dairy/eggs)</option>
                <option value="vegan">Vegan (Zero animal-derived food)</option>
              </select>
              <p className="text-xs text-natural-muted font-medium">Reflects agriculture farm methane and packaging loads.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="foodWasteLevel" className="block text-sm font-semibold text-natural-text">
                Food Waste Generation
              </label>
              <select
                id="foodWasteLevel"
                name="foodWasteLevel"
                value={formData.foodWasteLevel}
                onChange={handleSelectChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all text-natural-text bg-white"
              >
                <option value="high">High (Discard leftovers or spoiled produce weekly)</option>
                <option value="medium">Medium (Occasionally waste surplus cooked meals)</option>
                <option value="low">Low (Zero plate waste, cook leftovers creatively)</option>
              </select>
              <p className="text-xs text-natural-muted font-medium">Rotting organic trash creates powerful landfill methane.</p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center text-sm font-semibold text-natural-text">
                <label htmlFor="localFoodRatio">Local Sourcing Ratio (%)</label>
                <span className="font-mono text-natural-moss bg-natural-cream/70 px-2.5 py-0.5 rounded-lg border border-natural-border/30">{formData.localFoodRatio}%</span>
              </div>
              <input
                id="localFoodRatio"
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.localFoodRatio}
                onChange={(e) => handleSliderChange(e, 'localFoodRatio')}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted font-medium">Groceries produced locally (e.g., within 100km). High values bypass maritime emission chains.</p>
            </div>
          </div>
        </fieldset>

        {/* Section 3: Home Energy */}
        <fieldset className="space-y-6">
          <legend className="text-lg font-bold text-natural-moss flex items-center gap-2 border-b border-natural-border pb-3 w-full">
            <span>🔌</span> Home Utility and Energy
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="electricityKwhPerMonth" className="block text-sm font-semibold text-natural-text">
                Average Monthly Electricity Usage (kWh)
              </label>
              <input
                id="electricityKwhPerMonth"
                name="electricityKwhPerMonth"
                type="number"
                min="0"
                value={formData.electricityKwhPerMonth}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 300"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Check your utility bill for accurate kilowatt-hours.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-natural-text">
                <label htmlFor="renewableEnergyRatio">Renewable Share & Energy Supply (%)</label>
                <span className="font-mono text-natural-moss bg-natural-cream/70 px-2.5 py-0.5 rounded-lg border border-natural-border/30">{formData.renewableEnergyRatio}%</span>
              </div>
              <input
                id="renewableEnergyRatio"
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.renewableEnergyRatio}
                onChange={(e) => handleSliderChange(e, 'renewableEnergyRatio')}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted font-medium">Percentage of active home power generated by solar panels or green utility providers.</p>
            </div>
          </div>
        </fieldset>

        {/* Section 4: Shopping Habits */}
        <fieldset className="space-y-6">
          <legend className="text-lg font-bold text-natural-moss flex items-center gap-2 border-b border-natural-border pb-3 w-full">
            <span>🛍️</span> Shopping & Consumer Habits
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="clothingPurchasesPerMonth" className="block text-sm font-semibold text-natural-text">
                New Clothes Purchased per Month
              </label>
              <input
                id="clothingPurchasesPerMonth"
                name="clothingPurchasesPerMonth"
                type="number"
                min="0"
                value={formData.clothingPurchasesPerMonth}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 2"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Includes new garments, shoes, or accessories.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="electronicsPurchasesPerYear" className="block text-sm font-semibold text-natural-text">
                Electronics / Tech Purchased per Year
              </label>
              <input
                id="electronicsPurchasesPerYear"
                name="electronicsPurchasesPerYear"
                type="number"
                min="0"
                value={formData.electronicsPurchasesPerYear}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 1"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Includes replacement smartphones, tablets, screens, laptops, etc.</p>
            </div>
          </div>
        </fieldset>

        {/* Section 5: Waste & Recycling */}
        <fieldset className="space-y-6">
          <legend className="text-lg font-bold text-natural-moss flex items-center gap-2 border-b border-natural-border pb-3 w-full">
            <span>🗑️</span> Waste & Material Recycling
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="wasteBagsPerWeek" className="block text-sm font-semibold text-natural-text">
                Weekly Trash Bags Discarded
              </label>
              <input
                id="wasteBagsPerWeek"
                name="wasteBagsPerWeek"
                type="number"
                min="0"
                value={formData.wasteBagsPerWeek}
                onChange={handleNumberChange}
                className="w-full h-11 px-3.5 rounded-xl border border-natural-border outline-hidden focus:ring-2 focus:ring-natural-moss/40 focus:border-natural-moss transition-all font-mono text-natural-text"
                placeholder="e.g. 3"
                required
              />
              <p className="text-xs text-natural-muted font-medium">Standard household trash bags (approx. 30L size) carrying raw garbage.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-semibold text-natural-text">
                <label htmlFor="recyclingRatio">Household Recycling Ratio (%)</label>
                <span className="font-mono text-natural-moss bg-natural-cream/70 px-2.5 py-0.5 rounded-lg border border-natural-border/30">{formData.recyclingRatio}%</span>
              </div>
              <input
                id="recyclingRatio"
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.recyclingRatio}
                onChange={(e) => handleSliderChange(e, 'recyclingRatio')}
                className="w-full accent-natural-moss h-2 bg-[#F0F0E8] rounded-lg cursor-pointer"
              />
              <p className="text-xs text-natural-muted font-medium">Percentage of recyclable glass, plastic, and cardboard diverted from regional landfills.</p>
            </div>
          </div>
        </fieldset>

        {/* Form CTA status alerts */}
        {submitMessage && (
          <div className={`p-4 rounded-xl text-sm ${submitMessage.includes('successfully') ? 'bg-[#FEFAE0] text-natural-moss border border-natural-cream' : 'bg-red-50 text-red-850 border border-red-100'}`} role="alert">
            <p className="flex items-center gap-2 font-semibold">
              <span>{submitMessage.includes('successfully') ? '✨' : '⚠️'}</span>
              {submitMessage}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-natural-border flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 h-12 bg-natural-moss hover:bg-natural-moss/90 active:bg-natural-moss/80 text-white font-bold rounded-xl flex items-center justify-center gap-2 transform active:scale-98 transition-all shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-natural-moss focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing & Rebuilding Roadmap...</span>
              </>
            ) : (
              <>
                <span>Update My Coach Profile & Plan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
