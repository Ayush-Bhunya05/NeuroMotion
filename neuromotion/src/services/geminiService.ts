// NeuroMotion AI — Gemini AI Service
const GEMINI_API_KEY = "AIzaSyBhBeGw511PgOYgJfnRyL3TNCWB2JpIDJk";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiStory {
  id: string;
  title: string;
  content: string;
  questions: {
    id: string;
    text: string;
    options: string[];
    correct: number;
  }[];
  readTime: number;
}

export interface GeminiRecommendation {
  goal: string;
  tasks: {
    id: 'memory' | 'attention' | 'reaction';
    name: string;
    level: string;
    reason: string;
  }[];
  insights: {
    memory: string;
    attention: string;
    reaction: string;
  };
  suggestions: {
    how: string;
    why: string;
  };
}

export const FALLBACK_INSIGHTS: GeminiRecommendation = {
  goal: "cognitive preservation and baseline tracking",
  tasks: [
    { id: "memory", name: "Memory Card Game", level: "Easy", reason: "Maintain working memory baseline." },
    { id: "attention", name: "Attention Stability", level: "Easy", reason: "Improve sustained focus." },
    { id: "reaction", name: "Quick Reaction", level: "Easy", reason: "Keep reflex pathways active." }
  ],
  insights: {
    memory: "Daily loops sustain baseline accuracy.",
    attention: "Focus tracks require daily stability.",
    reaction: "More data required for reflexes."
  },
  suggestions: {
    how: "Complete all 3 short cognitive tests daily to build a comprehensive clinical baseline.",
    why: "Consistent daily data allows the AI to track subtle changes in cognition and prescribe the optimal therapeutic difficulty."
  }
};

/**
 * Generates a clinically-focused functional recall story using Google Gemini.
 * Includes improved result mapping to handle AI variability and prevent blank content.
 */
export async function generateGeminiStory(difficulty: 'easy' | 'medium' | 'hard'): Promise<GeminiStory | null> {
  const diffMap = {
    easy: "brief (20-30 words), simple daily task, 3 basic multiple choice questions.",
    medium: "medium (40-60 words), specific quantities or names to remember, 4 multiple choice questions.",
    hard: "complex (80-100 words), dense data (medication times, bus numbers, room numbers), 5 multiple choice questions."
  };

  const prompt = {
    contents: [{
      parts: [{
        text: `You are a clinical training bot. Generate a Functional Recall Story.
        Level: ${difficulty} (${diffMap[difficulty]}).
        
        CRITICAL: Return EXACT JSON with "title", "content", and "questions". 
        {
          "title": "Story Title",
          "content": "Full story text must go here...",
          "readTime": 30,
          "questions": [{"id":"q1", "text":"Q?", "options":["A","B"], "correct":0}]
        }`
      }]
    }]
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt)
    });

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const startIdx = rawText.indexOf('{');
    const endIdx = rawText.lastIndexOf('}');
    if (startIdx === -1) return null;

    const parsed = JSON.parse(rawText.substring(startIdx, endIdx + 1));

    // 🛡️ Advanced Fallback Mapping: Check common AI aliases for "content"
    const content = parsed.content || parsed.story || parsed.text || parsed.scenario || "";
    const title = parsed.title || parsed.header || "Rehab Activity";

    const sanitizedStory: GeminiStory = {
      id: String(parsed.id || `gen_${Date.now()}`),
      title: String(title),
      content: String(content),
      readTime: Number(parsed.readTime || 25),
      questions: (parsed.questions || []).map((q: any, i: number) => ({
        id: String(q.id || `q${i+1}`),
        text: String(q.text || q.question || "Memory Question"),
        options: Array.isArray(q.options) ? q.options.map(String) : ["A", "B", "C"],
        correct: typeof q.correct === 'number' ? q.correct : parseInt(String(q.correct)) || 0
      }))
    };

    if (!sanitizedStory.content || sanitizedStory.questions.length === 0) {
      console.warn("AI Response semi-invalid, triggering fallback check.");
      return null;
    }

    return sanitizedStory;
    
  } catch (error) {
    console.error("Gemini Parse Failure:", error);
    return null;
  }
}

/**
 * Generates personalized performance insights using Google Gemini based on patient sessions.
 */
export const getGeminiInsights = async (userScores: any, sessions: any[]): Promise<GeminiRecommendation> => {
  try {
    const promptText = `
      As a clinical cognitive therapist, analyze this patient's performance data:
      Current Scores: ${JSON.stringify(userScores)}
      Recent Sessions: ${JSON.stringify(sessions.slice(0, 5))}

      Based on this, create a personalized training report.
      Identify which cognitive domain (Attention, Memory, or Reflex) needs the most focus in the next 48 hours and why.
      Respond ONLY with a JSON object in this format:
      {
        "goal": "overall clinical goal",
        "tasks": [
          { "id": "memory", "name": "Memory Card Game", "level": "Easy/Medium/Hard", "reason": "Why this task?" },
          { "id": "attention", "name": "Attention Stability", "level": "Easy/Medium/Hard", "reason": "Why this task?" },
          { "id": "reaction", name: "Quick Reaction", "level": "Easy/Medium/Hard", "reason": "Why this task?" }
        ],
        "insights": {
          "memory": "Extremely brief, punchy observation (<8 words).",
          "attention": "Extremely brief, punchy observation (<8 words).",
          "reaction": "Extremely brief, punchy observation (<8 words)."
        },
        "suggestions": {
          "how": "Prescriptive advice on exactly what areas (game/task) to prioritize next and how to train them.",
          "why": "Clinical reason for this advice based on the patient's performance gaps."
        }
      }
      IMPORTANT: Return exactly 3 tasks, one for each ID: memory, attention, reaction. 
      Use exactly these names: "Memory Card Game", "Attention Stability", "Quick Reaction".
      Guidance must be highly personalized and non-generic.
    `;

    const prompt = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemini API Error (fallback used):', response.status, errText);
      return FALLBACK_INSIGHTS;
    }

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      console.warn('Gemini AI Error: No content in choices (fallback used)', data);
      return FALLBACK_INSIGHTS;
    }

    const startIdx = rawText.indexOf('{');
    const endIdx = rawText.lastIndexOf('}');
    if (startIdx === -1) return FALLBACK_INSIGHTS;

    try {
      return JSON.parse(rawText.substring(startIdx, endIdx + 1));
    } catch (parseErr) {
      console.warn('Gemini JSON Parse Error (fallback used):', parseErr, rawText);
      return FALLBACK_INSIGHTS;
    }
  } catch (error) {
    console.warn('Gemini AI Network/System Error (fallback used):', error);
    return FALLBACK_INSIGHTS;
  }
};
