/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FullProfile, LifestyleAssessment } from './types';
import {
  fetchProfile,
  updateAssessment,
  toggleRoadmapTask,
  toggleChallenge,
  addCustomChallenge,
  fetchMessages,
  sendMessageToCoach,
  resetDatabase,
} from './services/api';
import { Dashboard } from './components/Dashboard';
import { AssessmentForm } from './components/AssessmentForm';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { ActiveRoadmap } from './components/ActiveRoadmap';
import { ActiveChallenges } from './components/ActiveChallenges';
import { CoachChat } from './components/CoachChat';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assessment' | 'simulator' | 'roadmap' | 'challenges' | 'chat'>('dashboard');
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Load profile database on startup
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorText(null);
      try {
        const fullProf = await fetchProfile();
        setProfile(fullProf);
        
        // Sync messages log
        const msgs = await fetchMessages();
        setChatMessages(msgs);
      } catch (err: any) {
        console.error('Initial metadata sync failed:', err);
        setErrorText('Failed to sync sustainability parameters. Verify full-stack Express is responding.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update assessment
  const handleSaveAssessment = async (assessment: LifestyleAssessment) => {
    setErrorText(null);
    try {
      const updated = await updateAssessment(assessment);
      setProfile(updated);
      
      // Auto-pull welcome message from advisor matching new assessment
      const mArray = await fetchMessages();
      setChatMessages(mArray);
    } catch (err) {
      console.error('Failed to post assessment values:', err);
      throw err;
    }
  };

  // Toggle tasks
  const handleToggleRoadmapTask = async (week: number, id: string) => {
    if (!profile) return;
    try {
      const updatedRoadmap = await toggleRoadmapTask(week, id);
      setProfile(prev => prev ? { ...prev, roadmap: updatedRoadmap } : null);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle challenges
  const handleToggleChallenge = async (id: string) => {
    if (!profile) return;
    try {
      const updatedChallenges = await toggleChallenge(id);
      setProfile(prev => prev ? { ...prev, challenges: updatedChallenges } : null);
    } catch (err) {
      console.error(err);
    }
  };

  // Create custom challenge
  const handleAddChallenge = async (challData: { title: string; description: string; category: string; impactWeightKnob: string }) => {
    if (!profile) return;
    try {
      const updatedChallenges = await addCustomChallenge(challData);
      setProfile(prev => prev ? { ...prev, challenges: updatedChallenges } : null);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Coach Chat message
  const handleSendCoachMessage = async (text: string) => {
    try {
      // Local immediate insertion to appear snapping
      const tempMsg = {
        id: 'msg-temp-' + Date.now(),
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages(prev => [...prev, tempMsg]);

      const res = await sendMessageToCoach(text);
      setChatMessages(res.allMessages);
    } catch (err) {
      console.error('Failed to dispatch coach message:', err);
      throw err;
    }
  };

  // Reset core database
  const handleResetDatabase = async () => {
    if (!window.confirm('Do you want to reset your emission logs and re-seed with standard baseline history?')) {
      return;
    }
    setIsLoading(true);
    try {
      const seedProfile = await resetDatabase();
      setProfile(seedProfile);
      const msgs = await fetchMessages();
      setChatMessages(msgs);
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-lg font-bold text-slate-800">Sourcing Coach Engine...</h1>
          <p className="text-xs text-slate-400">Assembling eco databases and carbon multipliers.</p>
        </div>
      </div>
    );
  }

  if (errorText || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border p-8 rounded-2xl max-w-md w-full shadow-xs text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-slate-800">Synchronization Error</h2>
          <p className="text-xs text-slate-500">{errorText || 'Failed to initialize system state parameters.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Retry Connection Grid
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col">
      
      {/* Top Main Navigation Bar */}
      <header className="bg-white/50 backdrop-blur-md border-b border-natural-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand with Natural Tones Design Elements */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-natural-moss rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-natural-cream rounded-full"></div>
            </div>
            <span className="font-bold text-xl tracking-tight text-natural-moss">
              Carbon Balance <span className="font-normal text-natural-muted">AI</span>
            </span>
          </div>

          {/* Persona quick badge shortcut styled with theme components */}
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-natural-cream text-natural-moss border border-natural-border rounded-full px-3 py-1 text-xs font-bold font-mono">
            <span>{profile.persona.badge.split(' ')[0] || '🏅'}</span>
            <span>{profile.persona.title}</span>
          </div>

        </div>
      </header>

      {/* Segment Navigation Slider */}
      <nav className="bg-white/30 border-b border-natural-border py-2 text-sm sticky top-16 z-40 backdrop-blur-xs" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="-mb-px flex gap-2 md:gap-4 overflow-x-auto scrollbar-none py-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'assessment', label: 'Lifestyle Assessment', icon: '📝' },
              { id: 'simulator', label: 'What-If Predicter', icon: '🔮' },
              { id: 'roadmap', label: '30-Day Strategic Plan', icon: '📅' },
              { id: 'challenges', label: 'Weekly Challenges', icon: '🏆' },
              { id: 'chat', label: 'Coach Companion', icon: '🗣️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-3.5 rounded-xl flex items-center gap-2 shrink-0 transition-all cursor-pointer font-semibold text-xs md:text-sm ${activeTab === tab.id ? 'bg-natural-moss text-white shadow-xs font-bold' : 'text-natural-muted hover:text-natural-moss hover:bg-[#F0F0E8]'}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Container Stage */}
      <main className="flex-1 py-8 px-4 md:px-8">
        <div className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard
              profile={profile}
              onReset={handleResetDatabase}
            />
          )}

          {activeTab === 'assessment' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl font-black text-natural-moss">Your Sustainability Persona Profiler</h2>
                <p className="text-xs md:text-sm text-natural-muted">Completing or updating these lifestyle counts allows Gemini to redesign a 4-week tactical roadmap specifically matching your consumption leaks.</p>
              </div>
              <AssessmentForm
                initialData={profile.assessment}
                onSave={handleSaveAssessment}
              />
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl font-black text-natural-moss">What-If Lifecycle Simulator</h2>
                <p className="text-xs md:text-sm text-natural-muted">Model hypothetical adjustments below and immediately run predictions to observe monthly carbon offset ratios.</p>
              </div>
              <WhatIfSimulator
                baseAssessment={profile.assessment}
                baseEmissions={profile.breakdown}
              />
            </div>
          )}

          {activeTab === 'roadmap' && (
            <ActiveRoadmap
              roadmap={profile.roadmap}
              onToggleTask={handleToggleRoadmapTask}
            />
          )}

          {activeTab === 'challenges' && (
            <ActiveChallenges
              challenges={profile.challenges}
              onToggle={handleToggleChallenge}
              onAddCustom={handleAddChallenge}
            />
          )}

          {activeTab === 'chat' && (
            <CoachChat
              messages={chatMessages}
              onSendMessage={handleSendCoachMessage}
            />
          )}
        </div>
      </main>

      {/* Global Minimalist Footer matching Natural Tones Theme requirements */}
      <footer className="bg-white/30 border-t border-natural-border py-6 text-xs text-natural-muted font-medium">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:gap-6 text-center sm:text-left">
            <span>&copy; 2026 Carbon Balance EcoCoach. All systems green.</span>
            <span>Gemini v2.4 Flash Model Connected</span>
          </div>
          <div className="flex items-center space-x-4 text-[10px]">
            <span>WCAG 2.1 Level AA Compliant</span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full mr-1.5 animate-pulse"></span>
              Live Structured Calculations
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
