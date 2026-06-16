import React, { useState } from 'react';
import { RoadmapWeek } from '../types';

interface ActiveRoadmapProps {
  roadmap: RoadmapWeek[];
  onToggleTask: (weekNum: number, id: string) => Promise<void>;
}

export function ActiveRoadmap({ roadmap, onToggleTask }: ActiveRoadmapProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  const getImpactBadgeStyle = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-[#FEFAE0] text-natural-earth-dark border-[#E9EDC9]';
      case 'medium':
        return 'bg-natural-cream/40 text-natural-moss border-natural-border/50';
      default:
        return 'bg-[#F9F9F4] text-natural-muted-dark border-natural-border/30';
    }
  };

  const currentWeek = roadmap.find(w => w.week === activeTab);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Intro Header */}
      <div className="natural-card p-6 md:p-8 space-y-4 bg-white">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-natural-moss">Your 30-Day Personal Sustainability Roadmap</h2>
          <p className="text-sm text-natural-muted font-medium">A customized tactical roadmap designed weekly by Gemini to address your top greenhouse hotspots.</p>
        </div>

        {/* Weekly Segment Navigation */}
        <div className="flex border-b border-natural-border pt-2" role="tablist">
          {roadmap.map(w => (
            <button
              key={w.week}
              role="tab"
              aria-selected={activeTab === w.week}
              onClick={() => setActiveTab(w.week)}
              className={`flex-1 py-3 text-center text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === w.week ? 'border-natural-moss text-natural-moss font-extrabold' : 'border-transparent text-natural-muted hover:text-natural-moss'}`}
            >
              Week {w.week}
            </button>
          ))}
        </div>

        {/* Current Week Plan */}
        {currentWeek ? (
          <div className="space-y-6 pt-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-natural-cream text-natural-moss flex items-center justify-center font-bold text-sm border border-natural-border/40">📅</span>
              <h3 className="font-bold text-natural-moss text-lg">{currentWeek.title}</h3>
            </div>

            <div className="space-y-4">
              {currentWeek.tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-start md:items-center gap-4 p-4 rounded-2xl border transition-all ${task.completed ? 'bg-natural-bg/50 border-natural-border text-natural-muted-dark' : 'bg-white border-natural-border hover:bg-[#F9F9F4]/25'}`}
                >
                  <button
                    onClick={() => onToggleTask(currentWeek.week, task.id)}
                    className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs shrink-0 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-natural-moss ${task.completed ? 'bg-natural-moss border-natural-moss text-white' : 'border-natural-border bg-white text-natural-text'}`}
                    aria-label={`Toggle task: ${task.description}`}
                    aria-checked={task.completed}
                    role="checkbox"
                  >
                    {task.completed && '✓'}
                  </button>

                  <div className="flex-1 space-y-1 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
                    <p className={`text-sm ${task.completed ? 'text-natural-muted-dark line-through font-medium' : 'text-natural-text font-semibold'}`}>
                      {task.description}
                    </p>
                    
                    <span className={`inline-block text-xs font-mono px-2.5 py-0.5 rounded-lg border shrink-0 font-bold ${getImpactBadgeStyle(task.impact)}`}>
                      {task.impact} Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion Summary banner */}
            <div className="bg-natural-cream/30 rounded-2xl p-4 text-xs sm:text-sm text-natural-muted-dark flex flex-col sm:flex-row justify-between items-center gap-2 border border-natural-border">
              <span className="font-semibold">Goal completions in Week {currentWeek.week}:</span>
              <span className="font-mono bg-white px-3 py-1 rounded-md border border-natural-border text-natural-moss font-bold">
                {currentWeek.tasks.filter(t => t.completed).length} of {currentWeek.tasks.length} resolved
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-natural-muted font-medium">
            No roadmap configuration available. Try completing the assessment first!
          </div>
        )}
      </div>
    </div>
  );
}
