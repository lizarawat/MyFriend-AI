/**
 * PersonaEcho AI - Persona Reply Generation Engine
 * Handles dual-mode reply generation (Offline Heuristic Synthesis & Online Gemini LLM API).
 */

export async function generatePersonaReply({ persona, conversationHistory, userMessage, apiKey }) {
  if (!persona) return "Hey, pick a contact first!";

  // 1. If Gemini API Key is provided, use Gemini REST API
  if (apiKey && apiKey.trim() !== '') {
    try {
      const llmReply = await fetchGeminiReply(persona, conversationHistory, userMessage, apiKey);
      if (llmReply) return llmReply;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to Heuristic Engine:", err);
    }
  }

  // 2. Fallback to Offline Heuristic Engine (Zero API Key needed)
  return generateHeuristicReply(persona, conversationHistory, userMessage);
}

/**
 * Gemini REST API Call
 */
async function fetchGeminiReply(persona, conversationHistory, userMessage, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  // Format history for Gemini
  const contents = [];

  // Add conversation history
  const recentHistory = (conversationHistory || []).slice(-8);
  recentHistory.forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

  // Add current user prompt
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
      maxOutputTokens: 250,
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : null;
}

/**
 * Offline Heuristic Reply Generator
 * Synthesizes replies matching persona slang, emojis, sample sentences, and trait modifiers.
 */
function generateHeuristicReply(persona, history, userMsg) {
  const text = userMsg.toLowerCase().trim();
  const traits = persona.traits || { sarcasm: 50, energy: 50, formality: 50 };
  const topEmojis = (persona.topEmojis || []).map(e => e.emoji);
  const sampleMsgs = persona.sampleMessages || [];
  const topWords = (persona.topWords || []).map(w => w.word);
  const catchphrases = persona.topCatchphrases || [];

  const mainEmoji = topEmojis.length > 0 ? topEmojis[0] : (traits.sarcasm > 60 ? '💀' : '🔥');
  const secEmoji = topEmojis.length > 1 ? topEmojis[1] : '😂';

  // Greeting check
  if (/^(hi|hello|hey|yo|sup|wassup|good morning|heyy)/i.test(text)) {
    const greetings = [
      `yo! what's up? ${mainEmoji}`,
      `hey bro, wassup! ${secEmoji}`,
      `yo yo, how's it going?`,
      `hey! what are you up to today? ${mainEmoji}`
    ];
    return applyStyleModifiers(pickRandom(greetings), persona);
  }

  // Question check ("what are you doing", "where are you", "how are you")
  if (text.includes('?') || /^(what|where|how|why|who|when)/i.test(text)) {
    const questionReplies = [
      `ngl just chilling right now ${mainEmoji} what about you?`,
      `working on some stuff, why what's up? ${secEmoji}`,
      `haha honest truth? not much ${mainEmoji}`,
      `idk man, depends on the vibe today ${mainEmoji}`
    ];
    if (catchphrases.length > 0) {
      questionReplies.push(`${catchphrases[0]}... honestly just relaxing ${secEmoji}`);
    }
    return applyStyleModifiers(pickRandom(questionReplies), persona);
  }

  // Laughter / Joke / Reaction check
  if (/(lol|lmao|haha|funny|rofl|joke|dead)/i.test(text)) {
    const reactions = [
      `lmao no way 💀💀`,
      `hahaha deadass ${mainEmoji}`,
      `bro you're ridiculous ${secEmoji}`,
      `haha fr fr ${mainEmoji}`
    ];
    return applyStyleModifiers(pickRandom(reactions), persona);
  }

  // Agreement / Opinion request
  if (/(think|agree|opinion|good|bad|cool|nice)/i.test(text)) {
    const opinions = [
      `100% agree with you on that ${mainEmoji}`,
      `tbh I've been thinking the exact same thing!`,
      traits.sarcasm > 65 ? `sureee, if you say so 💀` : `sounds pretty cool ngl ${mainEmoji}`,
      `idk could be better but it's alright ${secEmoji}`
    ];
    return applyStyleModifiers(pickRandom(opinions), persona);
  }

  // Match sample messages if available
  if (sampleMsgs.length > 0 && Math.random() > 0.4) {
    const sample = pickRandom(sampleMsgs);
    if (sample.length < 80) {
      return applyStyleModifiers(sample, persona);
    }
  }

  // General fallback synthetic response
  const generalResponses = [
    `yeah for real ${mainEmoji}`,
    `haha valid point ngl`,
    `wait really? tell me more ${secEmoji}`,
    `bruh that's crazy 💀`,
    `idk man let's see how it goes ${mainEmoji}`
  ];

  return applyStyleModifiers(pickRandom(generalResponses), persona);
}

function applyStyleModifiers(text, persona) {
  let result = text;

  const traits = persona.traits || {};
  const casing = persona.casing || {};

  // All lower case modifier if persona prefers lowercase
  if (parseFloat(casing.allLowerRatio) > 0.6) {
    result = result.toLowerCase();
  }

  // Energy modifier (ALL CAPS or Exclamations)
  if (traits.energy > 80 && Math.random() > 0.5) {
    result = result.toUpperCase() + "!!";
  }

  // Emoji injection
  const topEmojis = (persona.topEmojis || []).map(e => e.emoji);
  if (topEmojis.length > 0 && !result.includes(topEmojis[0]) && Math.random() > 0.3) {
    result += ` ${topEmojis[0]}`;
  }

  return result;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
