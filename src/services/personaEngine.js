/**
 * MyFriend AI - Persona Reply Generation Engine
 * Features Chat Pair Memory Retrieval, Fuzzy Keyword Matching, Hinglish Support, and Gemini LLM Integration.
 */

export async function generatePersonaReply({ persona, conversationHistory, userMessage, apiKey }) {
  if (!persona) return "Hey, pick a contact first!";

  // 1. If Gemini API Key is provided, use Gemini REST API
  if (apiKey && apiKey.trim() !== '') {
    try {
      const llmReply = await fetchGeminiReply(persona, conversationHistory, userMessage, apiKey);
      if (llmReply) return llmReply;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to Memory Retrieval Engine:", err);
    }
  }

  // 2. Offline Memory Retrieval & Persona Synthesis Engine
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
 * Offline Memory Retrieval Engine
 * Matches input against real conversation turn pairs and actual sample messages.
 */
function generateHeuristicReply(persona, history, userMsg) {
  const input = userMsg.toLowerCase().trim();
  const inputWords = new Set(input.replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean));

  const chatPairs = persona.chatPairs || [];
  const allSampleMessages = persona.allSampleMessages || persona.sampleMessages || [];
  const topEmojis = (persona.topEmojis || []).map(e => e.emoji);
  const isHinglish = persona.detectedLanguage?.toLowerCase().includes('hinglish');

  const mainEmoji = topEmojis.length > 0 ? topEmojis[0] : (isHinglish ? '🥲' : '💀');

  // STEP 1: Check Chat Pairs Memory for Similar User Prompt
  if (chatPairs.length > 0) {
    let bestMatch = null;
    let maxScore = 0;

    for (const pair of chatPairs) {
      const promptLower = pair.prompt.toLowerCase().trim();
      
      // Substring match (e.g. "oiee", "kya karra", "tujhe hindi aati")
      if (promptLower === input || promptLower.includes(input) || input.includes(promptLower)) {
        return applyStyleModifiers(pair.response, persona);
      }

      // Word Jaccard Similarity Match
      const pairWords = new Set(promptLower.replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean));
      let intersection = 0;
      inputWords.forEach(w => {
        if (pairWords.has(w)) intersection++;
      });

      const union = new Set([...inputWords, ...pairWords]).size;
      const score = union > 0 ? intersection / union : 0;

      if (score > maxScore && score >= 0.3) {
        maxScore = score;
        bestMatch = pair.response;
      }
    }

    if (bestMatch) {
      return applyStyleModifiers(bestMatch, persona);
    }
  }

  // STEP 2: Search Bunty's Real Messages for Keyword Relevance
  if (allSampleMessages.length > 0) {
    const keywordMatches = [];

    for (const msg of allSampleMessages) {
      const msgLower = msg.toLowerCase();
      let matchCount = 0;

      inputWords.forEach(w => {
        if (w.length > 2 && msgLower.includes(w)) {
          matchCount++;
        }
      });

      if (matchCount > 0) {
        keywordMatches.push(msg);
      }
    }

    if (keywordMatches.length > 0) {
      return applyStyleModifiers(pickRandom(keywordMatches), persona);
    }
  }

  // STEP 3: Fallback to Real Random Message from Persona's Chat History
  if (allSampleMessages.length > 0 && Math.random() > 0.3) {
    const randomRealMsg = pickRandom(allSampleMessages);
    if (randomRealMsg && randomRealMsg.length < 100) {
      return applyStyleModifiers(randomRealMsg, persona);
    }
  }

  // STEP 4: Language-Aware Synthetic Fallback (Hinglish vs English)
  if (isHinglish) {
    const hinglishFallbacks = [
      `haa ${mainEmoji}`,
      `bol bhai kya hua`,
      `kuch nhi yrr, tu bata`,
      `sahi h ${mainEmoji}`,
      `hn`
    ];
    return applyStyleModifiers(pickRandom(hinglishFallbacks), persona);
  } else {
    const englishFallbacks = [
      `yeah for real ${mainEmoji}`,
      `haha valid point ngl`,
      `wait really? tell me more`,
      `idk man let's see ${mainEmoji}`
    ];
    return applyStyleModifiers(pickRandom(englishFallbacks), persona);
  }
}

function applyStyleModifiers(text, persona) {
  let result = text;
  const casing = persona.casing || {};

  // Preserve persona's exact capitalization
  if (parseFloat(casing.allLowerRatio) > 0.7) {
    result = result.toLowerCase();
  }

  // Inject persona emoji occasionally if not present
  const topEmojis = (persona.topEmojis || []).map(e => e.emoji);
  if (topEmojis.length > 0 && !topEmojis.some(e => result.includes(e)) && Math.random() > 0.5) {
    result += ` ${topEmojis[0]}`;
  }

  return result;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
