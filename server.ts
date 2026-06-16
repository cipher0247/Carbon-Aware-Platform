import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { generateEcoProfile, interactWithCoach } from './server/gemini';
import { LifestyleAssessment } from './src/types';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  LifestyleAssessmentSchema,
  RoadmapToggleSchema,
  ChallengeToggleSchema,
  ChallengeAddSchema,
  CoachMessageSchema,
  WhatIfExplainSchema
} from './src/utils/validation';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable standard JSON parsing with strict 10kb body size safety limits
app.use(express.json({ limit: '10kb' }));

// ----------------------------------------------------
// SECURITY: Simple custom in-memory rate-limiting
// ----------------------------------------------------
interface RateLimitData {
  hits: number;
  resetTime: number;
}
const rateLimits = new Map<string, RateLimitData>();

function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Split x-forwarded-for to handle standard proxy arrays safely and extract originating IP
  const rawIpHeader = req.headers['x-forwarded-for'] as string || '';
  const ip = rawIpHeader.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60; // 60 requests per minute

  let limitData = rateLimits.get(ip);
  if (!limitData || limitData.resetTime < now) {
    limitData = { hits: 1, resetTime: now + windowMs };
    rateLimits.set(ip, limitData);
    return next();
  }

  limitData.hits += 1;
  if (limitData.hits > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down and respect climate pacing!',
      retryAfter: Math.round((limitData.resetTime - now) / 1000),
    });
  }

  next();
}

// Apply rate limiting specifically on API endpoints
app.use('/api', apiRateLimiter);


// ----------------------------------------------------
// FULL-STACK API ROUTINGS
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/**
 * Fetch full sustainability profile
 */
app.get('/api/profile', (req: Request, res: Response) => {
  try {
    const profile = db.getProfile();
    res.json(profile);
  } catch (err: any) {
    console.error('Failed to retrieve profile:', err);
    res.status(500).json({ error: 'Failed to retrieve carbon profile data.' });
  }
});

/**
 * Update lifestyle assessment variables
 * Optionally queries Gemini to generate personalized Coach persona & 4-week roadmap
 */
app.post('/api/assessment', async (req: Request, res: Response) => {
  try {
    const validationResult = LifestyleAssessmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed for lifestyle assessment factors.',
        details: validationResult.error.format()
      });
    }

    const assessment = validationResult.data;

    // Call Gemini to generate customized, high-fidelity profile
    console.log('Querying Gemini API to construct eco-roadmap & persona cards...');
    const result = await generateEcoProfile(assessment);

    // Save profile
    const updated = db.updateAssessment(assessment, result.persona, result.roadmap);
    res.json(updated);
  } catch (err: any) {
    console.error('Error during assessment saving:', err);
    res.status(400).json({ error: 'Failed to process carbon assessment factors.' });
  }
});

/**
 * Toggle roadmap checklist items
 */
app.post('/api/roadmap/toggle', (req: Request, res: Response) => {
  try {
    const validationResult = RoadmapToggleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid parameters: ' + validationResult.error.message });
    }
    const { week, taskId } = validationResult.data;
    const updatedRoadmap = db.toggleRoadmapTask(week, taskId);
    res.json(updatedRoadmap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle roadmap check.' });
  }
});

/**
 * Toggle active weekly challenges
 */
app.post('/api/challenge/toggle', (req: Request, res: Response) => {
  try {
    const validationResult = ChallengeToggleSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Invalid parameter: ' + validationResult.error.message });
    }
    const { challengeId } = validationResult.data;
    const updatedChallenges = db.toggleChallenge(challengeId);
    res.json(updatedChallenges);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle challenge.' });
  }
});

/**
 * Create a new customized weekly challenge
 */
app.post('/api/challenge/add', (req: Request, res: Response) => {
  try {
    const validationResult = ChallengeAddSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed: ' + validationResult.error.message });
    }
    const { title, description, category, impactWeightKnob } = validationResult.data;
    
    // Rigorous security sanitization to guard against XSS and buffer stuffing
    const sanitize = (val: string, maxLen: number) => {
      return val.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim().substring(0, maxLen);
    };

    const cleanTitle = sanitize(title, 80);
    const cleanDesc = sanitize(description, 180);
    const cleanCategory = category;
    const cleanImpact = sanitize(impactWeightKnob || '-2.0 kg CO2e', 25);

    const newChallenge = {
      id: 'ch-' + Date.now(),
      title: cleanTitle,
      description: cleanDesc,
      impactWeightKnob: cleanImpact,
      category: cleanCategory,
      completed: false,
    };
    const updated = db.addChallenge(newChallenge);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to append custom environmental challenge.' });
  }
});

/**
 * Fetch conversational chat messages log
 */
app.get('/api/messages', (req: Request, res: Response) => {
  try {
    res.json(db.getMessages());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chatbot archives.' });
  }
});

/**
 * Send interactive message to AI Sustainability Coach
 */
/**
 * Send interactive message to AI Sustainability Coach
 */
app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const validationResult = CoachMessageSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Message validation failed: ' + validationResult.error.message });
    }
    const { text } = validationResult.data;

    // Sanitize user query message to guard against XSS and control character injection
    const cleanText = text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // remove non-printable ASCII control characters
      .trim();

    // Save user message
    db.addMessage({ sender: 'user', text: cleanText });

    // Fetch full system history and profile
    const activeMessages = db.getMessages();
    const profile = db.getProfile();

    // Trigger AI model
    console.log('Fwd query to Sustainability Advisor context...');
    const reply = await interactWithCoach(activeMessages, cleanText, profile);

    // Save coach reply
    const finalReplyObject = db.addMessage({ sender: 'coach', text: reply });

    res.json({
      userMessage: activeMessages[activeMessages.length - 2], // user message was inserted first
      coachReply: finalReplyObject,
      allMessages: db.getMessages(),
    });
  } catch (err) {
    console.error('Error in coach conversation pipeline:', err);
    res.status(500).json({ error: 'Sustainability advisor is currently calculating high-priority grids. Please query again.' });
  }
});

/**
 * Generates dynamic scientific reasoning explanation for the what-if engine simulation
 */
app.post('/api/whatif/explain', async (req: Request, res: Response) => {
  try {
    const validationResult = WhatIfExplainSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Simulation variables validation failed' });
    }
    const { currentTotal, projectedTotal, monthlyReductionKg, yearlyReductionKg, adjustments } = validationResult.data;

    const safeCurrent = currentTotal;
    const safeProjected = projectedTotal;
    const safeMonthly = monthlyReductionKg;
    const safeYearly = yearlyReductionKg;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Default rule-based fallback response
      return res.json({
        explanation: `With these adjustments, your annual footprint decreases from **${safeCurrent.toFixed(1)} tons** to **${safeProjected.toFixed(1)} tons**, saving **${safeMonthly.toFixed(0)} kg CO2e** every month. This results in standardizing your household emissions with regional targets!`
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const prompt = `
      You are an elite, highly scientific Sustainability Advisor.
      The user is running a "What-If Simulator" to model reductions in their carbon footprint.
      Provide a highly realistic, encouraging 2-sentence explanation of what these combined simulator changes accomplish.

      Metrics table:
      - Current annual footprint: ${safeCurrent} tons CO2e
      - Projected annual footprint: ${safeProjected} tons CO2e
      - Monthly Carbon Saved: ${safeMonthly} kg CO2e
      - Yearly Carbon Saved: ${safeYearly} kg CO2e

      Selected adjustments modeled by user:
      ${adjustments ? JSON.stringify(adjustments, null, 2).substring(0, 500) : 'none'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Provide an extremely encouraging, mathematically precise, scientifically accurate 2-sentence response detailing the ecological benefits of the selected what-if steps. Keep it highly readable.',
        temperature: 0.5,
      }
    });

    res.json({ explanation: response.text?.trim() || 'Calculated successfully!' });
  } catch (err) {
    res.json({
      explanation: 'Modeling shows these adjustments will lower emissions efficiently. Great progress!'
    });
  }
});

/**
 * Reset database trigger (handy for evaluations and tests)
 */
app.post('/api/reset', (req: Request, res: Response) => {
  try {
    const resetProfile = db.resetDB();
    res.json({ message: 'Database reset successfully!', profile: resetProfile });
  } catch (err) {
    res.status(500).json({ error: 'Database reset procedure failed.' });
  }
});


// ----------------------------------------------------
// INTEGRATE VITE DEVELOPMENT MIDDLEWARE OR STATIC SERVER
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Launching in Developer mode with active Vite middlewares...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Launching in Production mode...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Carbon Aware Platform Server running on port ${PORT}`);
  });
}

startServer();
