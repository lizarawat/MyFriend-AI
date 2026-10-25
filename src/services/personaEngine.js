/**
 * MyFriend AI - Advanced Persona Reply Generation Engine
 * Features Word-Boundary Regex Tokenization, Intent & Topic NLP Classification,
 * Anti-Repetition Response Memory, Teacher Mode Learned Pairs, and Gemini LLM fallback.
 */

const PYTHON_ML_BACKEND_URL = 'http://127.0.0.1:5000/api/generate';

// Global memory buffer of recent persona responses to eliminate repetitive looping
const RECENT_RESPONSES_PER_PERSONA = {};

export async function generatePersonaReply({ persona, conversationHistory, userMessage, apiKey }) {
  if (!persona) return "Hey, pick a contact first!";

  // 1. Python Scikit-Learn Machine Learning Engine (Optional Local Server)
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
      if (pyData.reply && pyData.reply !== '...' && !pyData.reply.includes('Hn 🤬')) {
        console.log("Python ML Reply Generated (Score:", pyData.max_similarity_score, "):", pyData.reply);
        return pyData.reply;
      }
    }
  } catch (err) {
    // Local Python ML server not running; fall back smoothly to client NLP
  }

  // 2. Gemini REST API Call (If API Key provided)
  if (apiKey && apiKey.trim() !== '') {
    try {
      const llmReply = await fetchGeminiReply(persona, conversationHistory, userMessage, apiKey);
      if (llmReply) return llmReply;
    } catch (err) {
      console.warn("Gemini API call failed:", err);
    }
  }

  // 3. Client-Side Advanced Conversational NLP Engine
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

  const learnedRulesText = persona.learnedRules && persona.learnedRules.length > 0
    ? `\nLEARNED BEHAVIORAL RULES:\n- ${persona.learnedRules.join('\n- ')}`
    : '';

  const body = {
    system_instruction: {
      parts: [{
        text: (persona.systemPrompt || `You are ${persona.name}, a virtual friend.`) + learnedRulesText
      }]
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
  return words.some(w => hasExactWord(text, w) || text.toLowerCase().includes(w.toLowerCase()));
}

/**
 * Helper to pick non-repeating candidates from a pool
 */
function pickNonRepeating(candidates, personaId, history) {
  if (!candidates || candidates.length === 0) return "haa bilkul 🥲";

  if (!RECENT_RESPONSES_PER_PERSONA[personaId]) {
    RECENT_RESPONSES_PER_PERSONA[personaId] = [];
  }
  const recent = RECENT_RESPONSES_PER_PERSONA[personaId];

  // Also check last 3 bot messages in chat history
  const recentInHistory = (history || [])
    .filter(m => m.sender === 'bot')
    .slice(-3)
    .map(m => m.text.trim().toLowerCase());

  // Filter candidates that weren't used recently
  const freshCandidates = candidates.filter(c => {
    const clean = c.trim().toLowerCase();
    return !recent.includes(clean) && !recentInHistory.includes(clean);
  });

  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  // Record into buffer
  recent.push(chosen.trim().toLowerCase());
  if (recent.length > 5) {
    recent.shift();
  }

  return chosen;
}

/**
 * Client-Side Advanced NLP Conversational Engine
 */
function generateClientNLPReply(persona, history, userMsg) {
  const input = userMsg.trim();
  const inputLower = input.toLowerCase();
  const personaId = persona.id || 'default';

  const name = persona.name?.toLowerCase() || '';
  const isBunty = name.includes('bunty');
  const isAlex = name.includes('alex');
  const isSarah = name.includes('sarah');
  const isLeo = name.includes('leo');

  // 1. TEACHER LEARNED PAIRS & MANUAL DIALOGUE CORRECTIONS (Highest Priority)
  const chatPairs = persona.chatPairs || [];
  if (chatPairs.length > 0) {
    // Check for exact or high-similarity match
    for (const pair of [...chatPairs].reverse()) {
      const promptLower = (pair.prompt || pair.context || '').toLowerCase().trim();
      if (promptLower) {
        if (
          promptLower === inputLower ||
          inputLower.includes(promptLower) ||
          promptLower.includes(inputLower)
        ) {
          return pair.response;
        }
      }
    }
  }

  // 2. OUTING, TRAVEL & HANGOUT PLANS ("ghoomne chale", "kaha chale", "chal", "bahar chale", "meet")
  if (hasAnyWord(inputLower, ['kaha chale', 'kahan chale', 'kaha chalna', 'kahan chalna', 'kaha jaye', 'kahan jaye', 'where to go', 'where should we go'])) {
    if (isBunty) {
      return pickNonRepeating([
        "bhai CP ya cyber hub chalte hai mast momos khayenge 😋 tu bata?",
        "chal kisi badhiya cafe chalte hai bro, mast chai piyenge aur chill karenge ☕",
        "Hauz Khas chalte hai bhai lake side sham ko! 🚗 kya bolta h?",
        "kahi bhi chal bhai, bas momos khilwa dena 🥲",
        "chal drive pe chalte hai thoda ghoom aayenge 🚗 tu ready rehna"
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeating([
        "deadass anywhere that has AC and no people 💀",
        "how about staying home? revolutionary concept I know 😒",
        "fine, let's grab coffee, but if it sucks it's on you 💀"
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeating([
        "Let's visit that new tech innovation hub or a cool rooftop cafe! 🚀",
        "How about a coworking cafe where we can brainstorm and grab boba? 💡"
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeating([
        "bro let's hit up the gaming lounge or grab burgers 🎮 straight vibe",
        "anywhere with good food bro, bet 🍕"
      ], personaId, history);
    }
  }

  if (hasAnyWord(inputLower, ['ghoomne', 'chale', 'chalo', 'bahar chale', 'milte hai', 'hangout', 'trip', 'plan kare', 'lets go'])) {
    if (isBunty) {
      return pickNonRepeating([
        "haa chal na bhai! waise bhi bore ho rha hu 🥲 kaha chale bata?",
        "are bilkul bhai! mast drive pe chalte hai ya cafe? tu bata 🚗",
        "chal bhai done deal! sham ko nikalte hai, tu bata kaha chalna h 😋",
        "haa sahi me yrr, bohot din ho gaye bahar gaye hue! kaha chale?"
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeating([
        "deadass? fine, as long as I don't have to socialize too much 💀",
        "I guess... where are you dragging me to? 😒",
        "lol bet, but you're paying for the gas 💀"
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeating([
        "YES absolutely!! Super hyped to hang out! Where should we go? 🚀",
        "I'm totally in!! Let's do something super fun today! 🔥"
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeating([
        "bet bro! Let's finish this match and head out 🎮 where we going?",
        "straight vibe bro, count me in fr no cap 👀"
      ], personaId, history);
    }
  }

  // 3. SCHEDULING & TIMING ("kab chale", "kitne baje", "when", "time")
  if (hasAnyWord(inputLower, ['kab chale', 'kitne baje', 'kab nikalna', 'when should we', 'what time'])) {
    if (isBunty) {
      return pickNonRepeating([
        "sham ko 5-6 baje nikalte hai bhai 🚗 tu ready rehna!",
        "jab tu bole tab nikalte hai bhai 🥲 bas 15 min pehle batana",
        "7 baje milte hai metro station pe? wahi se direct chalte hai 🚇"
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeating([
        "after I finish doing absolutely nothing 💀 maybe 6 PM?",
        "later this evening, I need mental preparation first 😒"
      ], personaId, history);
    }
  }

  // 4. AGREEMENT & CONFIRMATION ("done", "pakka", "thik h", "chal fir", "ok bhai")
  if (hasAnyWord(inputLower, ['chal fir', 'done', 'pakka', 'thik h', 'thik hai', 'cool bro', 'deal'])) {
    if (isBunty) {
      return pickNonRepeating([
        "done bhai! 5 baje pick karta hu tujhe 🔥 ready rehna",
        "haa bilkul done deal yrr 🥲 mast maze karenge",
        "pakka bhai! late mat hona bas 🚗"
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeating([
        "cool, don't make me regret this 💀",
        "bet, see you then"
      ], personaId, history);
    }
  }

  // 5. OPINION & PREFERENCE QUERIES ("opinion on X", "what do you think about X")
  if (inputLower.includes('opinion') || inputLower.includes('think about') || inputLower.includes('like about')) {
    const topicMatch = input.match(/(?:opinion|think|about|like)\s+(?:on|of|about)?\s*(.*)/i);
    let topic = topicMatch && topicMatch[1] ? topicMatch[1].replace(/[?._!]/g, '').trim() : 'that';
    if (!topic || topic.length < 2) topic = 'it';

    if (isBunty) {
      return pickNonRepeating([
        `bhai ${topic} mast vibe hai 🥲 sach me accha lagta h! tu bata?`,
        `bhai honestly ${topic} ek number cheez h 🔥 mera toh favorite hai`,
        `arre ${topic} toh solid hai bhai, tuje kaisa lagta h? 😋`
      ], personaId, history);
    } else if (isAlex) {
      return `deadass ${topic} is lowkey overrated 💀 but whatever floats your boat`;
    } else if (isSarah) {
      return `OMG ${topic.toUpperCase()} is AMAZING!! 🚀 super hyped about it!`;
    } else if (isLeo) {
      return `bet bro ${topic} is a straight vibe 🎮 10/10`;
    }
  }

  // 6. FOOD & EATING ("khana", "bhookh", "hungry", "momos", "pizza", "chai", "coffee")
  if (hasAnyWord(inputLower, ['khana', 'bhookh', 'hungry', 'momos', 'pizza', 'chai', 'coffee', 'swiggy', 'zomato', 'eat'])) {
    if (isBunty) {
      return pickNonRepeating([
        "bhai momos ya mast kulhad chai peene chale 🥲 bohot man kar rha",
        "swiggy se pizza mangwa le kya bhai? 🍕 mast chill karenge",
        "bhai bohot zor ki bhookh lagi hai sacchi 🥲 kuch khate hai chal",
        "chai aur sutta ya momos? tu bata kya mood hai ☕"
      ], personaId, history);
    } else if (isAlex) {
      return "deadass always hungry 💀 pizza or nothing";
    }
  }

  // 7. DAILY LIFE & STATUS ("how was your day", "how is it going", "how are you")
  if (hasAnyWord(inputLower, ['how was your day', 'how is your day', 'how are you', 'hows your day', 'how was day', 'day going', 'kaisa raha'])) {
    if (isBunty) {
      return pickNonRepeating([
        "kuch khas nhi bhai, bas chill karra 🥲 tu bata kaisa raha tera day?",
        "aaj ka din toh bohot thakau tha bhai 🥲 bas bed pe pada hu, tera kaisa raha?",
        "mast chill day tha yrr, kuch kaam dhandha nhi kiya 🥲 tu suna?"
      ], personaId, history);
    } else if (isAlex) {
      return `deadass surviving 💀 same old boring stuff, wbu?`;
    } else if (isSarah) {
      return `Super busy building awesome projects today! 🚀 How was yours??`;
    } else if (isLeo) {
      return `chilling and grinding games as usual bro 🎮 straight vibe`;
    }
  }

  // 8. CHIT-CHAT & GREETINGS ("kya karra tu", "kya chal rha", "aur bata", "sup", "what are you doing")
  if (hasAnyWord(inputLower, ['kya kar', 'karra', 'kar raha', 'up to', 'doing', 'kya chal', 'aur bata', 'aur sunao'])) {
    if (isBunty) {
      return pickNonRepeating([
        "kuch nhi bhai chill karra tu bata 🥲",
        "bas bed pe pada reels scroll karra tha 🥲 tu bata kya chal rha?",
        "kuch khas nhi bro, wahi same routine. tu bata kya naya h? 🥲",
        "kuch nhi bhai mast bore ho rha hu, accha hua tune msg kiya"
      ], personaId, history);
    } else if (isAlex) {
      return `deadass chilling 💀 what about you?`;
    } else if (isSarah) {
      return `Testing out cool new code and ideas! 🚀`;
    } else if (isLeo) {
      return `bet bro hopping on Discord 🎮`;
    }
  }

  // 9. MONEY & EXPENSES ("paise", "budget", "bill", "kangaal")
  if (hasAnyWord(inputLower, ['paise', 'paisa', 'budget', 'bill', 'kangaal', 'garib', 'broke'])) {
    if (isBunty) {
      return pickNonRepeating([
        "bhai wallet me sirf ₹50 bache hai 🥲 tu sponsor karega toh chalte hai",
        "month end chal rha bhai, account me zero balance hai 🥲",
        "are paise ki chinta mat kar, thoda manage kar lenge 🥲"
      ], personaId, history);
    }
  }

  // 10. BOREDOM & MOOD ("bore", "boring", "sad", "pareshan", "mood off")
  if (hasAnyWord(inputLower, ['bore', 'boring', 'sad', 'pareshan', 'mood off', 'depressed', 'low'])) {
    if (isBunty) {
      return pickNonRepeating([
        "kuch nhi yrr sab thik ho jayega 🥲 chill kar, chal bahar ghoom aate hai",
        "bhai bore mat ho, koi mast song bhej ya reel bhej 🥲",
        "kya hua bhai? kyu mood off h bata na 🥲 sab share kar le"
      ], personaId, history);
    }
  }

  // 11. CAREER & FUTURE ("internship", "job", "future", "placement")
  if (hasAnyWord(inputLower, ['internship', 'job', 'future', 'college', 'career', 'placement'])) {
    if (isBunty) {
      return pickNonRepeating([
        "wahi job dhundenge 🥲 full tension h",
        "bhai placement cell walo ne dimaag kharab kar rakha hai 🥲",
        "internship toh lag gayi bas achhi job mil jaye bhagwan ki kripa se 🥲"
      ], personaId, history);
    }
  }

  // 12. GREETINGS ("yo", "hey", "hello", "oie", "hi", "bhai")
  if (hasExactWord(inputLower, 'yo') || hasExactWord(inputLower, 'hey') || hasExactWord(inputLower, 'hello') || hasExactWord(inputLower, 'oie') || hasExactWord(inputLower, 'oye') || hasExactWord(inputLower, 'hi')) {
    if (isBunty) {
      return pickNonRepeating([
        "Hn 🥲 oie kya bol rha",
        "yo bhai! kya haal chaal?",
        "haan bol bhai, kaisa h?",
        "Hn bro, sab mast?"
      ], personaId, history);
    } else if (isAlex) {
      return `yo deadass 💀 whats up`;
    } else if (isSarah) {
      return `Hey!! Super hyped to chat! 🚀`;
    } else if (isLeo) {
      return `yo bet bro 🎮`;
    }
  }

  // 13. DYNAMIC NON-REPETITIVE FALLBACKS (If no specific intent triggered)
  if (isBunty) {
    return pickNonRepeating([
      "haa sahi me yrr 🥲 chill kar tu bata",
      "sahi baat h bhai, waise aur kya chal rha?",
      "are bilkul bhai 🥲 100% agreed",
      "haa bhai samajh rha hu, aage bata?",
      "sahi me yaar 🥲 tu bata kya socha fir?",
      "bhai ek number baat boli tune 🥲 mast",
      "haa yrr, life me thoda chill hona chahiye 🥲"
    ], personaId, history);
  } else if (isAlex) {
    return pickNonRepeating([
      "deadass bro 💀 whatever you say",
      "lowkey true I guess 😒",
      "lmao make it make sense 💀",
      "sureee bro whatever floats your boat"
    ], personaId, history);
  } else if (isSarah) {
    return pickNonRepeating([
      "Awesome!! Let's build and learn more! 🚀",
      "That is super interesting!! Tell me more! 🔥",
      "So cool! Love that vibe! 💡"
    ], personaId, history);
  } else if (isLeo) {
    return pickNonRepeating([
      "bet bro, straight vibe 🎮",
      "ggs bro, no cap fr 👀",
      "facts bro facts 🎮"
    ], personaId, history);
  }

  return "haa bilkul 🥲";
}
