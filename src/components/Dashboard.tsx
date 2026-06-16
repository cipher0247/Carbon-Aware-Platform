import React from 'react';
import { FullProfile } from '../types';
import { CALCULATION_FORMULAS } from '../constants';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardProps {
  profile: FullProfile;
  onReset: () => Promise<void>;
}

export function Dashboard({ profile, onReset }: DashboardProps) {
  const { breakdown, hotspots, persona, history, ecoScore } = profile;

  // Chart Mapping: Formats data for Area / Line Chart
  const chartData = React.useMemo(() => history.map(h => ({
    date: h.date,
    total: h.emissions.total,
    transport: h.emissions.transportation,
    food: h.emissions.food,
    energy: h.emissions.energy,
    shopping: h.emissions.shopping,
    waste: h.emissions.waste,
  })), [history]);

  // Render Category colors
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'transportation':
        return '#3b82f6'; // Blue
      case 'food':
        return '#f97316'; // Orange
      case 'energy':
        return '#f59e0b'; // Amber
      case 'shopping':
        return '#d946ef'; // Fuchsia
      default:
        return '#14b8a6'; // Teal
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'transportation': return 'Transportation';
      case 'food': return 'Food & Diet';
      case 'energy': return 'Home Energy';
      case 'shopping': return 'Shopping';
      default: return 'Waste Management';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto" id="sustainability-dashboard">
      
      {/* Top Main Cards: Summary Metrics & Score with Natural Tones Card Themes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Main Metric (Class: natural-card-dark with Glowing Ambient Circle) */}
        <div className="natural-card-dark p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-bold text-natural-cream uppercase tracking-widest block mb-1">Estimated Carbon Footprint</span>
            <div className="my-4 flex items-baseline space-x-2">
              <span className="text-5xl font-extrabold font-mono tracking-tight text-white">{breakdown.total.toFixed(2)}</span>
              <span className="text-xs font-semibold opacity-80 text-white">tons CO2e / yr</span>
            </div>
          </div>
          <div className="text-xs border-t border-white/20 pt-2 flex justify-between items-center relative z-10">
            <span className="opacity-80">Global Goal Margin:</span>
            <span className="font-bold font-mono text-natural-cream">&lt; 2.50 tons</span>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#CCD5AE]/20 rounded-full blur-2xl"></div>
        </div>

        {/* Card 2: Eco Score Indicators (Class: natural-card-warm) */}
        <div className="natural-card-warm p-6 flex flex-col justify-between border border-natural-cream">
          <div>
            <span className="text-xs font-bold text-natural-moss uppercase tracking-widest block mb-1">Your Eco-Score Indicator</span>
            <div className="my-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold font-mono tracking-tight text-natural-moss">{ecoScore}</span>
              <span className="text-xs font-semibold text-natural-muted-dark">/ 100 max</span>
            </div>
          </div>
          <div className="text-xs text-natural-muted-dark border-t border-natural-cream pt-2 flex justify-between items-center">
            <span>Status Ranking:</span>
            <span className={`font-bold uppercase ${ecoScore >= 80 ? 'text-natural-moss' : ecoScore >= 50 ? 'text-natural-earth-dark' : 'text-rose-700'}`}>
              {ecoScore >= 80 ? 'Excellent' : ecoScore >= 50 ? 'Moderate' : 'High Footprint'}
            </span>
          </div>
        </div>

        {/* Card 3: Green Persona summary (Class: natural-card) */}
        <div className="natural-card p-6 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-natural-muted-dark uppercase tracking-widest block mb-1">Generated Climate Persona</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg bg-[#CCD5AE]/30 p-1 rounded-md">{persona.badge.split(' ')[0] || '🌱'}</span>
              <h3 className="font-bold text-natural-moss text-lg leading-tight">{persona.title}</h3>
            </div>
          </div>
          <p className="text-xs text-natural-muted-dark mt-2 line-clamp-2 leading-relaxed font-medium">
            {persona.description}
          </p>
          <div className="text-xs border-natural-border border-t pt-2 text-natural-earth-dark font-bold">
            {persona.goals[0] ? `Next Priority: ${persona.goals[0]}` : 'Set customized goals via assessment form.'}
          </div>
        </div>
      </div>

      {/* Grid: Green Persona & Hotspots list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Column 1: Persona Details */}
        <div className="lg:col-span-4 natural-card p-6 space-y-6">
          <div className="border-b border-natural-border pb-3">
            <h3 className="font-bold text-natural-moss text-base flex items-center gap-2">
              <span>👤</span> Persona Profile & Strengths
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-[#5A5A40] tracking-wider">🌿 Key Strengths</h4>
              <ul className="space-y-1.5 text-xs text-natural-text">
                {persona.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <span className="text-natural-moss font-bold">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-[#D4A373] tracking-wider">⚠️ Key Areas of Growth</h4>
              <ul className="space-y-1.5 text-xs text-natural-muted">
                {persona.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <span className="text-natural-earth">⚠</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-natural-moss tracking-wider">🎯 Growth Goals</h4>
              <ul className="space-y-1.5 text-xs text-natural-text">
                {persona.goals.map((goal, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <span className="text-natural-moss font-bold shrink-0">→</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Column 2: Emission Hotspots Detection (Feature 3) */}
        <div className="lg:col-span-8 natural-card p-6 space-y-6">
          <div className="border-b border-natural-border pb-3 flex justify-between items-center">
            <h3 className="font-bold text-natural-moss text-base flex items-center gap-2">
              <span>🔥</span> Emission Hotspot Detection
            </h3>
            <span className="text-xs text-natural-muted font-bold">Categorized by priority ranking</span>
          </div>

          <div className="space-y-4">
            {hotspots.map((hotspot, idx) => {
              const label = getCategoryLabel(hotspot.category);
              
              // Map earthy primary colors matching requested Mockup scheme
              const earthyColor = hotspot.category === 'transportation' ? '#D4A373' : hotspot.category === 'food' ? '#CCD5AE' : '#5A5A40';
              
              return (
                <div key={idx} className="relative border border-natural-border p-4 rounded-2xl space-y-2 bg-[#F9F9F4]/40">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: earthyColor }}
                      />
                      <h4 className="font-bold text-natural-moss text-sm">{label}</h4>
                    </div>
                    <span className="font-mono text-xs font-bold text-natural-text bg-[#E0E0D6]/40 px-2.5 py-0.5 rounded-lg border border-natural-border/30">
                      {hotspot.value.toFixed(1)}t CO2e ({hotspot.percentage}%)
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-natural-muted font-medium">{hotspot.description}</p>
                  
                  {/* Performance bar matching mockup - Light beige track #F0F0E8 */}
                  <div className="w-full bg-[#F0F0E8] h-2 rounded-full overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: earthyColor,
                        width: `${hotspot.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Analytics Chart Panel (Feature 8) - Implemented with Natural Tones colors */}
      <div className="natural-card p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-natural-moss flex items-center gap-2">
            <span>📈</span> Carbon Footprint Reduction Trends
          </h3>
          <p className="text-xs text-natural-muted-dark font-medium">Track how your lifestyle assessments and reductions map chronological improvements against baseline goals.</p>
        </div>

        <div className="w-full h-[300px] sm:h-[350px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#5A5A40" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0D6" />
              <XAxis dataKey="date" stroke="#5C5C50" style={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <YAxis stroke="#5C5C50" style={{ fontSize: '11px' }} unit="t" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E0E0D6', borderRadius: '16px', color: '#2D2D2A', fontSize: '12px' }}
                itemStyle={{ color: '#2D2D2A' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="total" stroke="#5A5A40" fillOpacity={1} fill="url(#colorTotal)" name="Total Footprint (Yearly Level)" strokeWidth={2.5} />
              <Line type="monotone" dataKey="transport" stroke="#8C4E1D" dot={false} strokeWidth={2} name="Transport" />
              <Line type="monotone" dataKey="food" stroke="#5A5A40" dot={false} strokeWidth={2} name="Diet" />
              <Line type="monotone" dataKey="energy" stroke="#373724" dot={false} strokeWidth={2} name="Home Energy" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature 1: Transparent Formulas and Calculation breakdown */}
      <div className="natural-card p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-natural-moss flex items-center gap-2">
            <span>🔬</span> Transparent Calculation Standards
          </h3>
          <p className="text-xs text-natural-muted-dark font-medium">Every calculation and output is built using IPCC/EPA-compliant emissions logic structures. No hidden math.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {CALCULATION_FORMULAS.map((formula, idx) => (
            <div key={idx} className="border border-natural-border p-5 rounded-[24px] space-y-3 bg-[#FEFAE0]/30 hover:bg-[#FEFAE0]/70 transition-colors">
              <span className="text-xs font-bold text-natural-muted-dark uppercase tracking-wider">{formula.category}</span>
              <div className="bg-white p-3 rounded-lg border border-natural-border font-mono text-[11px] font-bold text-natural-moss break-words leading-relaxed">
                {formula.formula}
              </div>
              <p className="text-xs text-natural-muted-dark leading-relaxed font-medium">{formula.details}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-between items-center flex-col sm:flex-row gap-4 border-t border-natural-border/60">
          <p className="text-[10px] text-natural-muted-dark font-medium">Carbon Coach model databases auto-expire cache layers daily.</p>
          <button
            onClick={onReset}
            className="text-xs font-bold text-natural-muted-dark hover:text-red-700 transition-colors uppercase tracking-widest cursor-pointer"
          >
            Reset Database & Re-seed
          </button>
        </div>
      </div>

    </div>
  );
}
