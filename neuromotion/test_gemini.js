const GEMINI_API_KEY = 'AIzaSyBhBeGw511PgOYgJfnRyL3TNCWB2JpIDJk';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const userScores = { memoryAccuracy: 80, attentionScore: 70, reactionSpeed: 60 };
const sessions = [ { gameType: 'memory', score: 80, timestamp: new Date().toISOString() } ];

const prompt = `
      As a clinical cognitive therapist, analyze this patient's performance data:
      Current Scores: ${JSON.stringify(userScores)}
      Recent Sessions: ${JSON.stringify(sessions)}

      Based on this, create a personalized training report.
      Identify which cognitive domain (Attention, Memory, Reflex, or Functional Recall) needs the most focus in the next 48 hours and why.
      Respond ONLY with a JSON object in this format:
      {
        "goal": "overall clinical goal",
        "tasks": [
          { "id": "memory", "name": "Memory Card Game", "level": "Easy/Medium/Hard", "reason": "Why this task?" },
          { "id": "attention", "name": "Attention Stability", "level": "Easy/Medium/Hard", "reason": "Why this task?" },
          { "id": "reaction", "name": "Reaction Speed", "level": "Easy/Medium/Hard", "reason": "Why this task?" },
          { "id": "story", "name": "Functional Recall", "level": "Easy/Medium/Hard", "reason": "Why this task?" }
        ],
        "insights": {
          "memory": "Short analysis of memory trend",
          "attention": "Short analysis of attention trend",
          "reaction": "Short analysis of reaction trend",
          "story": "Short analysis of functional recall trend"
        },
        "suggestions": {
          "how": "Prescriptive advice on exactly what areas to prioritize next.",
          "why": "Clinical reason for this advice based on the patient's performance gaps."
        }
      }
      Return exactly 4 tasks. Guidance must be highly personalized.
      Return ONLY valid JSON, no markdown, no code fences.
`;

async function test() {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are a clinical cognitive therapist. Return JSON only.\n\n${prompt}` }] }],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: 'application/json',
        }
      })
    });
    console.log(response.status);
    const text = await response.text();
    console.log(text);
}
test();
