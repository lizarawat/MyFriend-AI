/**
 * MyFriend AI - Persona Reply Generation Engine
 * Connects to Python Machine Learning Backend (Flask + Scikit-Learn TF-IDF/Char N-Gram) + Gemini LLM fallback.
 */

const PYTHON_ML_BACKEND_URL = 'http://127.0.0.1:5000/api/generate';

export async function generatePersonaReply({ persona, conversationHistory, userMessage, apiKey }) {
  if (!persona) return "Hey, pick a contact first!";

  // 1. Python Scikit-Learn Machine Learning Engine (Highest Priority)
  try {
    const pyResponse = await fetch(PYTHON_ML_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona_id: persona.id,
        user_message: userMessage,
        chat_pairs: persona.chatPairs || []
      })
    });

    if (pyResponse.ok) {
      const pyData = await pyResponse.json();
      if (pyData.reply && pyData.reply !== '...') {
        console.log("Python ML Reply Generated (Score:", pyData.max_similarity_score, "):", pyData.reply);
        return pyData.reply;
      }
    }
  } catch (err) {
    console.warn("Python ML Backend un-reachable, trying fallback options:", err);
  }

  // 2. Gemini REST API Call (If API Key set)
  if (apiKey && apiKey.trim() !== '') {
    try {
      const llmReply = await fetchGeminiReply(persona, conversationHistory, userMessage, apiKey);
      if (llmReply) return llmReply;
    } catch (err) {
      console.warn("Gemini API call failed:", err);
    }
  }

  // 3. Fallback Heuristic Matcher
  return generateHeuristicReply(persona, conversationHistory, userMessage);
}

/**
 * Gemini REST API Call
 */
async function fetchGeminiReply(persona, conversationHistory, userMessage, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const contents = [];
  const recentHistory = (conversationHistory || []).slice(-8);
  recentHistory.forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  const body = {
    system_instruction: {
      parts: [{ text: persona.systemPrompt }]
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 200,
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Gemini API status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
}

/**
 * Fallback Offline Matcher
 */
function generateHeuristicReply(persona, history, userMsg) {
  const input = userMsg.toLowerCase().trim();
  const inputWords = new Set(input.replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean));

  const chatPairs = persona.chatPairs || [];
  const allSampleMessages = persona.allSampleMessages || persona.sampleMessages || [];
  const topEmojis = (persona.topEmojis || []).map(e => e.emoji);
  const isHinglish = persona.detectedLanguage?.toLowerCase().includes('hinglish');

  const mainEmoji = topEmojis.length > 0 ? topEmojis[0] : (isHinglish ? '🥲' : '💀');

  if (chatPairs.length > 0) {
    for (const pair of chatPairs) {
      const promptLower = pair.prompt.toLowerCase().trim();
      if (promptLower === input || promptLower.includes(input) || input.includes(promptLower)) {
        return pair.response;
      }
    }
  }

  if (allSampleMessages.length > 0) {
    const matches = allSampleMessages.filter(m => {
      const lower = m.toLowerCase();
      return Array.from(inputWords).some(w => w.length > 2 && lower.includes(w));
    });
    if (matches.length > 0) {
      return pickRandom(matches);
    }

    return pickRandom(allSampleMessages);
  }

  return isHinglish ? `haa ${mainEmoji}` : `yeah for real ${mainEmoji}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
