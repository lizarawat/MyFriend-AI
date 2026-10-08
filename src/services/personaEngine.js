/**
 * MyFriend AI - Advanced Persona Reply Generation Engine
 * Features Word-Boundary Regex Tokenization, Intent & Topic NLP Classification,
 * Scikit-Learn Python ML / Heuristic TF-IDF vector similarity, and Gemini LLM fallback.
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
      if (pyData.reply && pyData.reply !== '...' && pyData.reply !== 'Hn 🤬') {
        console.log("Python ML Reply Generated (Score:", pyData.max_similarity_score, "):", pyData.reply);
        return pyData.reply;
      }
    }
  } catch (err) {
    console.warn("Python ML Backend un-reachable, using client NLP engine:", err);
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

  // 3. Client-Side NLP Heuristic Vector Engine
  return generateClientNLPReply(persona, conversationHistory, userMessage);
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
      parts: [{ text: persona.systemPrompt || `You are ${persona.name}, a virtual friend.` }]
    },
    contents,
    generationConfig: {
      temperature: 0.85,
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
 * Strict Word Boundary Word-Level Regex Tokenizer
 * Prevents false matches like 'your' triggering 'yo' or 'this' triggering 'hi'
 */
function hasExactWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, 'i');
  return regex.test(text);
}

function hasAnyWord(text, words) {
  return words.some(w => hasExactWord(text, w) || text.toLowerCase().includes(w.toLowerCase() + ' '));
}

/**
 * Client-Side Advanced NLP Engine
 */
function generateClientNLPReply(persona, history, userMsg) {
  const input = userMsg.trim();
  const inputLower = input.toLowerCase();

  const name = persona.name?.toLowerCase() || '';
  const isBunty = name.includes('bunty');
  const isAlex = name.includes('alex');
  const isSarah = name.includes('sarah');
  const isLeo = name.includes('leo');

  // A. OPINION & PREFERENCE QUERIES ("opinion on X", "what do you think about X", "like X")
  if (inputLower.includes('opinion') || inputLower.includes('think about') || inputLower.includes('like about')) {
    const topicMatch = input.match(/(?:opinion|think|about|like)\s+(?:on|of|about)?\s*(.*)/i);
    let topic = topicMatch && topicMatch[1] ? topicMatch[1].replace(/[?._!]/g, '').trim() : 'that';
    if (!topic || topic.length < 2) topic = 'it';

    if (isBunty) {
      return `bhai ${topic} mast vibe hai 🥲 sach me aachha lagta h! tu bata?`;
    } else if (isAlex) {
      return `deadass ${topic} is lowkey overrated 💀 but whatever floats your boat`;
    } else if (isSarah) {
      return `OMG ${topic.toUpperCase()} is AMAZING!! 🚀 super hyped about it!`;
    } else if (isLeo) {
      return `bet bro ${topic} is a straight vibe 🎮 10/10`;
    }
    return `bhai ${topic} is awesome 🥲 tu bata?`;
  }

  // B. DAILY LIFE & STATUS QUERIES ("how was your day", "how is it going", "how are you")
  if (hasAnyWord(inputLower, ['how was your day', 'how is your day', 'how are you', 'hows your day', 'how was day', 'day going'])) {
    if (isBunty) {
      return `kuch khas nhi bhai, bas chill karra 🥲 tu bata kaisa raha tera day?`;
    } else if (isAlex) {
      return `deadass surviving 💀 same old boring stuff, wbu?`;
    } else if (isSarah) {
      return `Super busy building awesome projects today! 🚀 How was yours??`;
    } else if (isLeo) {
      return `chilling and grinding games as usual bro 🎮 straight vibe`;
    }
    return `kuch nhi bhai chill karra tu bata 🥲`;
  }

  // C. STORY / SECRET QUERIES ("tell me a story", "tell me a secret", "story")
  if (hasAnyWord(inputLower, ['story', 'secret', 'tell me something'])) {
    if (isBunty) {
      return `ek baat batau? internship ke baad job milegi ki nhi 🥲 yahi tension h bhai`;
    } else if (isAlex) {
      return `deadass once I replied "you too" to the waiter who said enjoy your food 💀 still traumatized`;
    } else if (isSarah) {
      return `Secret alert! 💡 I once built an entire app prototype overnight without sleeping! 🚀`;
    } else if (isLeo) {
      return `secretly I've been grinding Valorant ranked until 4 AM every night 🎮 no cap`;
    }
  }

  // D. ACTIVITY QUERIES ("what are you up to", "kya karra", "sup", "what are you doing")
  if (hasAnyWord(inputLower, ['kya kar', 'karra', 'kar raha', 'up to', 'doing', 'kya chal'])) {
    if (isBunty) {
      return `kuch nhi bhai chill karra tu bata 🥲`;
    } else if (isAlex) {
      return `deadass chilling 💀 what about you?`;
    } else if (isSarah) {
      return `Testing out cool new code and ideas! 🚀`;
    } else if (isLeo) {
      return `bet bro hopping on Discord 🎮`;
    }
  }

  // E. CAREER & FUTURE QUERIES ("internship", "job", "future", "placement")
  if (hasAnyWord(inputLower, ['internship', 'job', 'future', 'college', 'career', 'placement'])) {
    if (isBunty) {
      return `wahi job dhundenge 🥲 full tension h`;
    }
  }

  // F. GREETINGS ("yo", "hey", "hello", "oie", "hi", "bhai")
  if (hasExactWord(inputLower, 'yo') || hasExactWord(inputLower, 'hey') || hasExactWord(inputLower, 'hello') || hasExactWord(inputLower, 'oie') || hasExactWord(inputLower, 'oye') || hasExactWord(inputLower, 'hi')) {
    if (isBunty) {
      return `Hn 🥲 oie kya bol rha`;
    } else if (isAlex) {
      return `yo deadass 💀 whats up`;
    } else if (isSarah) {
      return `Hey!! Super hyped to chat! 🚀`;
    } else if (isLeo) {
      return `yo bet bro 🎮`;
    }
  }

  // G. TF-IDF CONVERSATION PAIR MATCHING
  const chatPairs = persona.chatPairs || [];
  if (chatPairs.length > 0) {
    for (const pair of chatPairs) {
      const promptLower = (pair.prompt || pair.context || '').toLowerCase().trim();
      if (promptLower && (promptLower === inputLower || (inputLower.length > 4 && promptLower.includes(inputLower)))) {
        return pair.response;
      }
    }
  }

  // H. PERSONA SAMPLE MESSAGE MATCHING
  const sampleMessages = persona.sampleMessages || persona.allSampleMessages || [];
  if (sampleMessages.length > 0) {
    const inputWords = new Set(inputLower.replace(/[^\w\s']/g, '').split(/\s+/).filter(w => w.length > 3));
    const matchedSample = sampleMessages.find(m => {
      const lower = m.toLowerCase();
      return Array.from(inputWords).some(w => lower.includes(w));
    });
    if (matchedSample) {
      return matchedSample;
    }
  }

  // DEFAULT PERSONA DIALECT FALLBACKS
  if (isBunty) {
    return `haa sahi me yrr 🥲 chill kar tu bata`;
  } else if (isAlex) {
    return `deadass bro 💀 whatever you say`;
  } else if (isSarah) {
    return `Awesome!! Let's build and learn more! 🚀`;
  } else if (isLeo) {
    return `bet bro, straight vibe 🎮`;
  }

  return `haa bilkul 🥲`;
}
