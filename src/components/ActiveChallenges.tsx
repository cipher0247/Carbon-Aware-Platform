import React, { useState } from 'react';
import { Challenge } from '../types';

interface ActiveChallengesProps {
  challenges: Challenge[];
  onToggle: (id: string) => Promise<void>;
  onAddCustom: (challenge: { title: string; description: string; category: string; impactWeightKnob: string }) => Promise<void>;
}

export function ActiveChallenges({ challenges, onToggle, onAddCustom }: ActiveChallengesProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<'transport' | 'food' | 'energy' | 'consumption' | 'waste'>('energy');
  const [newImpact, setNewImpact] = useState('-3.5 kg CO2e');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    setIsAdding(true);
    try {
      await onAddCustom({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        impactWeightKnob: newImpact,
      });
      setNewTitle('');
      setNewDesc('');
      setNewImpact('-3.5 kg CO2e');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'transport':
        return { bg: 'bg-[#E9EDC9]/20 border-[#CCD5AE]/40', icon: '🚙', text: 'text-natural-moss', badge: 'bg-[#FEFAE0]/80 text-natural-moss border-[#CCD5AE]/30' };
      case 'food':
        return { bg: 'bg-[#D4A373]/10 border-[#FEFAE0]/40', icon: '🥗', text: 'text-natural-earth-dark', badge: 'bg-[#FEFAE0] text-natural-earth-dark border-natural-border/30' };
      case 'energy':
        return { bg: 'bg-natural-cream/30 border-natural-border/30', icon: '🔌', text: 'text-natural-moss', badge: 'bg-natural-cream text-natural-moss border-natural-border/30' };
      case 'waste':
        return { bg: 'bg-[#E9EDC9]/15 border-natural-border/30', icon: '🗑️', text: 'text-natural-moss', badge: 'bg-[#E9EDC9]/45 text-natural-moss border-natural-border/30' };
      default:
        return { bg: 'bg-[#F9F9F4] border-natural-border/20', icon: '🛍️', text: 'text-natural-muted-dark', badge: 'bg-[#F9F9F4] text-natural-muted-dark border-natural-border/20' };
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-natural-cream/30 border border-natural-border p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-natural-moss">Weekly AI Sustainability Challenges</h2>
          <p className="text-sm text-natural-muted font-medium">Complete localized challenges tailored to shift high hotspots into sustainable habits.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-natural-moss hover:bg-natural-moss/90 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-xs"
        >
          {showAddForm ? 'Cancel New Challenge' : '+ Add Custom Challenge'}
        </button>
      </div>

      {/* Add Custom Challenge Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl border border-natural-border p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-natural-moss">Create a New Footprint Challenge</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="challengeTitle" className="block text-sm font-semibold text-natural-text">Challenge Title</label>
              <input
                id="challengeTitle"
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Turn off router overnight"
                className="w-full h-10 px-3 rounded-lg border border-natural-border bg-white focus:ring-2 focus:ring-natural-moss outline-hidden text-sm text-natural-text"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="challengeCategory" className="block text-sm font-semibold text-natural-text">Topic Category</label>
              <select
                id="challengeCategory"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg border border-natural-border bg-white focus:ring-2 focus:ring-natural-moss outline-hidden text-sm text-natural-text"
              >
                <option value="energy">Household Energy</option>
                <option value="transport">Low Emissions Transport</option>
                <option value="food">Conscious Nutrition</option>
                <option value="waste">Trash & Recycle Management</option>
                <option value="consumption">Minimalist Shopping</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="challengeDesc" className="block text-sm font-semibold text-natural-text">Specific Instruction</label>
              <input
                id="challengeDesc"
                type="text"
                required
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Unplug routers and appliances before going to sleep"
                className="w-full h-10 px-3 rounded-lg border border-natural-border bg-white focus:ring-2 focus:ring-natural-moss outline-hidden text-sm text-natural-text"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="challengeImpact" className="block text-sm font-semibold text-natural-text">Estimated CO2 Saved Weight</label>
              <input
                id="challengeImpact"
                type="text"
                required
                value={newImpact}
                onChange={e => setNewImpact(e.target.value)}
                placeholder="e.g. -2.5 kg CO2e"
                className="w-full h-10 px-3 rounded-lg border border-natural-border bg-white focus:ring-2 focus:ring-natural-moss outline-hidden text-sm text-natural-text"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAdding}
              className="px-5 py-2 bg-natural-moss hover:bg-natural-moss/90 text-white rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {isAdding ? 'Sourcing...' : 'Deploy Challenge'}
            </button>
          </div>
        </form>
      )}

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map(ch => {
          const theme = getCategoryTheme(ch.category);
          return (
            <div
              key={ch.id}
              className={`border rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-xs ${ch.completed ? 'bg-natural-bg/50 border-natural-border/60 opacity-80' : 'bg-white border-natural-border hover:bg-[#F9F9F4]/20'}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border ${theme.bg} ${theme.text}`}
              >
                {theme.icon}
              </div>

              <div className="space-y-2 grow">
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`font-bold text-base leading-snug ${ch.completed ? 'text-natural-muted-dark line-through' : 'text-natural-text'}`}>
                    {ch.title}
                  </h3>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border shrink-0 ${ch.completed ? 'bg-natural-cream text-natural-muted-dark border-natural-border/50' : theme.badge}`}>
                    {ch.impactWeightKnob}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${ch.completed ? 'text-natural-muted-dark font-medium' : 'text-natural-text font-medium'}`}>
                  {ch.description}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onToggle(ch.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${ch.completed ? 'bg-natural-cream hover:bg-[#CCD5AE]/20 text-natural-moss border border-natural-border' : 'bg-natural-moss hover:bg-natural-moss/90 text-white shadow-xs'}`}
                  >
                    {ch.completed ? 'Mark Active' : 'Log Completion ✓'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {challenges.length === 0 && (
          <div className="col-span-full py-12 text-center space-y-2 bg-white rounded-2xl border border-natural-border">
            <span className="text-4xl">🌟</span>
            <p className="text-natural-muted text-sm font-semibold">No active weekly challenges detected. Create a custom challenge to start tracking!</p>
          </div>
        )}
      </div>
    </div>
  );
}
