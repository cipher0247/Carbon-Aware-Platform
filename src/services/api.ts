import { FullProfile, LifestyleAssessment, RoadmapWeek, Challenge, CoachMessage } from '../types';

export async function fetchProfile(): Promise<FullProfile> {
  const res = await fetch('/api/profile');
  if (!res.ok) {
    throw new Error('Failed to retrieve CO2 profile. Ensure server is active.');
  }
  return res.json();
}

export async function updateAssessment(assessment: LifestyleAssessment): Promise<FullProfile> {
  const res = await fetch('/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assessment),
  });
  if (!res.ok) {
    throw new Error('Failed to compute assessment values. Please check credentials.');
  }
  return res.json();
}

export async function toggleRoadmapTask(week: number, taskId: string): Promise<RoadmapWeek[]> {
  const res = await fetch('/api/roadmap/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ week, taskId }),
  });
  if (!res.ok) {
    throw new Error('Failed to persist roadmap checklist status.');
  }
  return res.json();
}

export async function toggleChallenge(challengeId: string): Promise<Challenge[]> {
  const res = await fetch('/api/challenge/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeId }),
  });
  if (!res.ok) {
    throw new Error('Failed to toggle weekly challenge logs.');
  }
  return res.json();
}

export async function addCustomChallenge(challenge: { title: string; description: string; category: string; impactWeightKnob: string }): Promise<Challenge[]> {
  const res = await fetch('/api/challenge/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(challenge),
  });
  if (!res.ok) {
    throw new Error('Failed to register custom challenge.');
  }
  return res.json();
}

export async function fetchMessages(): Promise<CoachMessage[]> {
  const res = await fetch('/api/messages');
  if (!res.ok) {
    throw new Error('Failed to sync tutor message queue.');
  }
  return res.json();
}

export async function sendMessageToCoach(text: string): Promise<{ coachReply: CoachMessage; allMessages: CoachMessage[] }> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error('Failed to receive response from Coach. Check API keys.');
  }
  return res.json();
}

export async function requestWhatIfExplanation(payload: {
  currentTotal: number;
  projectedTotal: number;
  monthlyReductionKg: number;
  yearlyReductionKg: number;
  adjustments: Record<string, any>;
}): Promise<string> {
  const res = await fetch('/api/whatif/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return 'Your simulations show major long-term benefits in atmospheric conservation!';
  }
  const data = await res.json();
  return data.explanation;
}

export async function resetDatabase(): Promise<FullProfile> {
  const res = await fetch('/api/reset', { method: 'POST' });
  if (!res.ok) {
    throw new Error('Failed to flush local storage.');
  }
  const data = await res.json();
  return data.profile;
}
