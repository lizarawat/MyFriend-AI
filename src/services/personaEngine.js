/**
 * MyFriend AI - Advanced Persona Reply Generation Engine
 * Features:
 * 1. Deep Semantic & Intent Comprehension with Conversational Context Tracking
 * 2. Multi-Message Burst Sequencing (Simulates authentic human texting bubbles)
 * 3. Word-Boundary Regex Tokenization
 * 4. Anti-Repetition Multi-Turn Memory Buffer
 * 5. Interactive Teacher Mode Dialogue Overrides
 * 6. Structured Gemini 1.5 LLM Multi-Bubble Synthesis (when API key configured)
 */

const PYTHON_ML_BACKEND_URL = 'http://127.0.0.1:5000/api/generate';

// Global memory buffer of recent persona response signatures to eliminate repetitive loops
const RECENT_RESPONSES_PER_PERSONA = {};

/**
 * Main Entry Point: Generates persona reply as an array of 1-3 message bursts.
 * @returns {Promise<string[]>} Array of message strings
 */
export async function generatePersonaReply({ persona, conversationHistory, userMessage, apiKey }) {
  if (!persona) return ["Hey, pick a contact first!"];

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
        return [pyData.reply];
      }
    }
  } catch (err) {
    // Local Python ML server not running; fall back smoothly to Gemini LLM or Client NLP
  }

  // 2. Gemini REST API Call (If API Key provided)
  if (apiKey && apiKey.trim() !== '') {
    try {
      const llmBursts = await fetchGeminiReply(persona, conversationHistory, userMessage, apiKey);
      if (llmBursts && llmBursts.length > 0) return llmBursts;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to Client NLP:", err);
    }
  }

  // 3. Client-Side Advanced Semantic NLP Conversational Engine
  return generateClientNLPReply(persona, conversationHistory, userMessage);
}

/**
 * Gemini REST API Call
 * Instructs Gemini to deeply understand intent and reply in 1-3 natural texting bursts.
 */
async function fetchGeminiReply(persona, conversationHistory, userMessage, apiKey) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const contents = [];
  const recentHistory = (conversationHistory || []).slice(-10);
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

  const systemPrompt = `
You are ${persona.name}, a real human friend chatting casually on WhatsApp or iMessage.
Persona details & voice: ${persona.systemPrompt || 'Casual, authentic friend'}
${learnedRulesText}

CRITICAL TEXTING INSTRUCTIONS:
1. Deeply understand the user's message, their emotional tone, and what they actually mean in the current conversation.
2. Reply like a real human friend: authentic, thoughtful, making complete sense, and matching the persona's slang and personality.
3. Real humans on chat do NOT send one monolithic paragraph. Instead, they send 1, 2, or 3 short, punchy message bubbles in sequence.
4. Output your response strictly as a JSON array of 1 to 3 short message strings.
Example:
["bhai CP chalte hai 🚗", "waha mast momos aur chai piyenge 😋 tu bata kitne baje nikalna h?"]
Or for a single punchy reply:
["kuch nhi bhai bed pe pada reels scroll karra 🥲 tu bata kya chal rha?"]
Return ONLY the raw JSON array of strings without markdown backticks.
`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents,
    generationConfig: {
      temperature: 0.88,
      maxOutputTokens: 250,
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
  if (!text) return null;

  try {
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(s => String(s).trim()).filter(Boolean);
    }
  } catch (e) {
    // If not strict JSON, split by double newline or sentences
    const lines = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    if (lines.length > 0) return lines;
    return [text.trim()];
  }

  return [text.trim()];
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
function pickNonRepeatingBursts(candidates, personaId, history) {
  if (!candidates || candidates.length === 0) return ["haa bilkul 🥲"];

  if (!RECENT_RESPONSES_PER_PERSONA[personaId]) {
    RECENT_RESPONSES_PER_PERSONA[personaId] = [];
  }
  const recent = RECENT_RESPONSES_PER_PERSONA[personaId];

  // Also check last 4 bot messages in chat history
  const recentInHistory = (history || [])
    .filter(m => m.sender === 'bot')
    .slice(-4)
    .map(m => (m.text || '').trim().toLowerCase());

  // Filter candidates that weren't used recently
  const freshCandidates = candidates.filter(burstGroup => {
    const burstArray = Array.isArray(burstGroup) ? burstGroup : [burstGroup];
    const signature = burstArray.join(' ').trim().toLowerCase();
    return !recent.includes(signature) && !recentInHistory.some(h => signature.includes(h) || h.includes(signature));
  });

  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const chosenArray = Array.isArray(chosen) ? chosen : [chosen];

  // Record into memory buffer
  recent.push(chosenArray.join(' ').trim().toLowerCase());
  if (recent.length > 6) {
    recent.shift();
  }

  return chosenArray;
}

/**
 * Client-Side Advanced Semantic NLP Conversational Engine
 * Understands conversational context, semantic intents, and outputs multi-message bursts.
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
    for (const pair of [...chatPairs].reverse()) {
      const promptLower = (pair.prompt || pair.context || '').toLowerCase().trim();
      if (promptLower) {
        if (
          promptLower === inputLower ||
          inputLower.includes(promptLower) ||
          promptLower.includes(inputLower)
        ) {
          // If response contains multiple lines, break into sequential bursts
          const lines = (pair.response || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
          return lines.length > 0 ? lines : [pair.response];
        }
      }
    }
  }

  // 2. CONTEXTUAL AWARENESS: Analyze what the bot previously asked
  const lastBotMsg = (history || [])
    .filter(m => m && m.sender === 'bot')
    .slice(-1)[0]?.text?.toLowerCase() || '';

  const botAskedWhere = lastBotMsg.includes('kaha') || lastBotMsg.includes('kahan') || lastBotMsg.includes('kidhar') || lastBotMsg.includes('where');
  const botAskedTime = lastBotMsg.includes('kitne baje') || lastBotMsg.includes('kab') || lastBotMsg.includes('what time');
  const botSuggestedHangout = lastBotMsg.includes('chale') || lastBotMsg.includes('ghoomne') || lastBotMsg.includes('chalo') || lastBotMsg.includes('plan');

  // CONTEXT 2A: Bot asked "kaha chale?" and user replies with a place
  if (botAskedWhere && (
    hasAnyWord(inputLower, ['cp', 'cyber hub', 'hauz khas', 'cafe', 'gurgaon', 'delhi', 'noida', 'tapri', 'canteen', 'lake', 'market', 'kahi bhi', 'kahin bhi', 'drive', 'mall', 'rooftop', 'anywhere'])
  )) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["bhai mast choice hai! 🔥", "sham ko 5-6 baje nikalte hai fir, tu ready rehna 🚗"],
        ["done yrr, waha mast momos aur chai piyenge 😋", "tu bata kitne baje nikalna h? 🚗"],
        ["ek number jagah boli tune! 🚗", "mai pick kar lunga tujhe, bata kab nikalna h?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["fine, that place isn't completely terrible 💀", "what time are we going?"]
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeatingBursts([
        ["YES that place is fantastic!! 🚀", "What time works best for you? Let's do it!"]
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeatingBursts([
        ["bet bro, straight vibe 🎮", "what time we hitting it up?"]
      ], personaId, history);
    }
  }

  // CONTEXT 2B: Bot asked "kitne baje?" and user replies with a timing
  if (botAskedTime && (
    hasAnyWord(inputLower, ['baje', 'pm', 'am', 'sham', 'shaam', 'kal', 'abhi', 'after', '5', '6', '7', '8', 'night', 'raat', 'subah', 'soon', 'around'])
  )) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["thik hai done bhai, time pe nikalte hai 🚗", "mai nikalne se 15 min pehle call karta hu tujhe"],
        ["done deal! ready rehna bas 🥲", "late mat hona bilkul bhi"],
        ["pakka bhai! 🚗", "metro station pe milte hai wahi se direct chalenge"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["bet, see you then 💀", "don't make me wait outside"]
      ], personaId, history);
    }
  }

  // CONTEXT 2C: Bot suggested an outing and user confirms/agrees (not asking a new question)
  const isAskingTime = hasAnyWord(inputLower, ['kitne baje', 'kab chale', 'kab nikalna', 'what time', 'kab']);
  const isAskingWhere = hasAnyWord(inputLower, ['kaha chale', 'kahan chale', 'kidhar chale', 'where to', 'kaha jaye']);

  if (botSuggestedHangout && !isAskingTime && !isAskingWhere && (
    hasAnyWord(inputLower, ['chal', 'chalo', 'done', 'pakka', 'thik', 'theek', 'yes', 'haa', 'ha', 'chalte', 'ok', 'okay'])
  )) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["done bhai! deal pakki 🔥", "tu bata kaha chale? CP ya Cyber Hub?"],
        ["haa chal na yrr! waise bhi bore ho rha hu 🥲", "kaha chalna h bata?"]
      ], personaId, history);
    }
  }

  // 3. DESTINATION QUERIES ("kaha chale", "kahan chale", "kidhar chale", "where should we go")
  if (hasAnyWord(inputLower, ['kaha chale', 'kahan chale', 'kaha chalna', 'kahan chalna', 'kaha jaye', 'kahan jaye', 'kidhar chale', 'where to go', 'where should we go'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["bhai CP ya Cyber Hub chalte hai 🚗", "waha mast momos aur chai piyenge 😋 tu bata kya mood hai?"],
        ["chal kisi badhiya cafe chalte hai bro ☕", "mast baithke bate karenge aur chill karenge! tu ready rehna"],
        ["Hauz Khas chalte hai lake side sham ko! 🚗", "kya bolta h? sham ko 5 baje chale?"],
        ["kahi bhi chal bhai, bas momos khilwa dena 🥲", "aur mast chai peene ka man kar rha hai ☕"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["deadass anywhere that has AC and no people 💀", "how about staying home? revolutionary concept I know 😒"],
        ["fine, let's grab iced coffee 💀", "but if the place is crowded I'm leaving immediately"]
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeatingBursts([
        ["Let's visit that new tech innovation hub or a rooftop cafe! 🚀", "They have incredible matcha and great vibes!"]
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeatingBursts([
        ["bro let's hit up the gaming lounge or grab burgers 🎮", "straight vibe bro, bet 🍕"]
      ], personaId, history);
    }
  }

  // 4. SCHEDULING & TIMING ("kab chale", "kitne baje", "kab nikalna", "what time", "when")
  if (hasAnyWord(inputLower, ['kab chale', 'kitne baje', 'kab nikalna', 'when should we', 'what time', 'kab milna', 'kitna baje'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["sham ko 5-6 baje nikalte hai bhai 🚗", "tu 5 baje tak ready rehna, late mat hona bas 🥲"],
        ["jab tu bole tab nikalte hai bhai 🥲", "bas nikalne se 15 min pehle bata dena 🚗"],
        ["7 baje milte hai metro station pe? 🚇", "wahi se direct cab le lenge!"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["after I finish doing absolutely nothing 💀", "maybe 6 PM? don't be late"]
      ], personaId, history);
    }
  }

  // 5. HANGOUT & OUTING PROPOSALS ("ghoomne chale", "chal", "bahar chale", "milte hai", "lets meet")
  if (hasAnyWord(inputLower, ['ghoomne', 'chale', 'chalo', 'bahar chale', 'milte hai', 'hangout', 'trip', 'plan kare', 'lets go', 'bahar chalte'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["haa chal na bhai! waise bhi bore ho rha hu 🥲", "kaha chale bata? CP ya Cyber Hub?"],
        ["are bilkul bhai! mast drive pe chalte hai ya cafe? 🚗", "tu bata kab free hoga?"],
        ["chal bhai done deal! sham ko nikalte hai 😋", "tu bata kaha chalna h?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["deadass? fine, as long as I don't have to socialize too much 💀", "where are you dragging me to? 😒"],
        ["lol bet, but you're paying for the gas 💀", "and don't expect me to be cheerful"]
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeatingBursts([
        ["YES absolutely!! Super hyped to hang out! 🚀", "Where should we go? Let's do something super fun today! 🔥"]
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeatingBursts([
        ["bet bro! Let me finish this match and head out 🎮", "where we going?"]
      ], personaId, history);
    }
  }

  // 6. AGREEMENT & CONFIRMATION ("done", "pakka", "thik h", "chal fir", "deal", "final")
  if (hasAnyWord(inputLower, ['chal fir', 'done', 'pakka', 'thik h', 'thik hai', 'cool bro', 'deal', 'done deal', 'final'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["done bhai! deal pakki 🔥", "5 baje pick karta hu tujhe, ready rehna 🚗"],
        ["haa bilkul done deal yrr 🥲", "mast maze karenge aaj, bohot din ho gaye bahar gaye!"],
        ["pakka bhai! late mat hona bas 🚗", "mai time pe pahuch jaunga"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["cool, don't make me regret this 💀", "bet, see you then"]
      ], personaId, history);
    }
  }

  // 7. REFUSAL & UNAVAILABILITY ("nahi ja sakta", "busy hu", "nhi aa sakta", "mana", "can't")
  if (hasAnyWord(inputLower, ['nahi ja', 'nhi ja', 'busy hu', 'nhi aa', 'nahi aa', 'cant come', 'cannot', 'mana'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["are yaar 🥲 hamesha ka drama hai tera", "chal koi na, jab free ho tab batana"],
        ["koi baat nhi bhai samajh rha hu 🥲", "kaam nipta le pehle fir milte hai!"]
      ], personaId, history);
    }
  }

  // 8. WHAT ARE YOU DOING & STATUS ("kya kar raha", "kya krra", "kya chal rha", "aur bata", "sup", "what are you doing")
  if (hasAnyWord(inputLower, ['kya kar', 'karra', 'kar raha', 'up to', 'doing', 'kya chal', 'aur bata', 'aur sunao', 'kya haal'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["kuch nhi bhai, bas bed pe pada reels dekh rha hu 🥲", "tu bata kya chal rha tera? kuch naya?"],
        ["chill karra hu bro wahi same routine 🥲", "accha hua tune msg kiya, bohot bore ho rha tha"],
        ["kuch khas nhi bhai, bas chill scene hai 🥲", "tu bata koi naya plan banaya kya?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["deadass staring at the ceiling 💀", "what about you?"]
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeatingBursts([
        ["Testing out some super clean React components! 💻", "What are you working on today? 🚀"]
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeatingBursts([
        ["grinding games on Discord bro 🎮", "straight vibe, hop on!"]
      ], personaId, history);
    }
  }

  // 9. FOOD & SNACKS ("khana", "bhookh", "hungry", "momos", "pizza", "chai", "coffee", "swiggy")
  if (hasAnyWord(inputLower, ['khana', 'bhookh', 'hungry', 'momos', 'pizza', 'chai', 'coffee', 'swiggy', 'zomato', 'eat', 'biryani', 'sutta'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["bhai momos ya mast kulhad chai peene chale? 🥲", "bohot zor ki bhookh lagi hai sacchi 😋"],
        ["swiggy se pizza ya biryani mangwa le kya bhai? 🍕", "mast chill karenge room pe"],
        ["chai aur sutta ya momos? ☕", "tu bata kya khane ka mood hai bro?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["deadass always hungry 💀", "order pizza or I'm not functioning"]
      ], personaId, history);
    }
  }

  // 10. DAILY LIFE & STATUS ("how was your day", "kaisa raha din", "how are you", "kaisa h")
  if (hasAnyWord(inputLower, ['how was your day', 'how is your day', 'how are you', 'hows your day', 'kaisa raha', 'kaisa hai tu', 'kaisa h tu'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["kuch khas nhi bhai, thoda thakau tha 🥲", "tu bata kaisa raha tera day? sab badhiya?"],
        ["mast chill day tha yrr, bed pe pada raha 🥲", "tera kaisa raha? kuch exciting hua?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["deadass surviving 💀", "same old boring stuff, wbu?"]
      ], personaId, history);
    }
  }

  // 11. BOREDOM & MOOD ("bore", "boring", "sad", "pareshan", "mood off", "depressed")
  if (hasAnyWord(inputLower, ['bore', 'boring', 'sad', 'pareshan', 'mood off', 'depressed', 'low', 'dimaag kharab'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["kya hua bhai? kyu mood off h bata na 🥲", "sab share kar le, tension mat le bilkul"],
        ["bhai bore mat ho, koi mast song ya reel bhej 🥲", "ya chal bahar ghoom aate hai thoda refresh ho jayega"],
        ["are chill kar yrr, sab sort ho jayega 🥲", "mai hu na, bata kya baat hui?"]
      ], personaId, history);
    }
  }

  // 12. MONEY & EXPENSES ("paise", "budget", "bill", "kangaal", "garib", "broke")
  if (hasAnyWord(inputLower, ['paise', 'paisa', 'budget', 'bill', 'kangaal', 'garib', 'broke'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["bhai wallet me mere bhi sirf ₹50 bache hai 🥲", "tu sponsor karega toh chalte hai 😅"],
        ["month end chal rha bhai, account me zero balance hai 🥲", "koi na chai sutta manage ho jayega"],
        ["are paise ki tension mat le bhai 🥲", "thoda mai dunga thoda tu, manage kar lenge!"]
      ], personaId, history);
    }
  }

  // 13. CAREER & COLLEGE STRESS ("job", "internship", "future", "placement", "college", "exam")
  if (hasAnyWord(inputLower, ['internship', 'job', 'future', 'college', 'career', 'placement', 'exam', 'assignment'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["wahi job dhundenge 🥲 full tension chal rahi hai", "placement cell walo ne dimaag kharab kar rakha hai yrr"],
        ["bhai roz ka wahi assignment aur interview ka jhanjhat 🥲", "kuch samajh nhi aa rha aage kya hoga"],
        ["internship ka scene toh theek hai bhai 🥲", "bas achhi full-time job mil jaye toh sukoon mile bhagwan ki kripa se"]
      ], personaId, history);
    }
  }

  // 14. OPINION QUERIES ("opinion on X", "what do you think about X", "kaisa lagta h")
  if (inputLower.includes('opinion') || inputLower.includes('think about') || inputLower.includes('kaisa lagta') || inputLower.includes('kya lagta')) {
    const topicMatch = input.match(/(?:opinion|think|about|like|lagta)\s+(?:on|of|about)?\s*(.*)/i);
    let topic = topicMatch && topicMatch[1] ? topicMatch[1].replace(/[?._!]/g, '').trim() : 'that';
    if (!topic || topic.length < 2) topic = 'it';

    if (isBunty) {
      return pickNonRepeatingBursts([
        [`bhai ${topic} mast vibe hai 🥲`, "sach me ek number cheez h, tu bata tujhe kaisa lagta h?"],
        [`bhai honestly ${topic} toh solid hai 🔥`, "mera toh favorite hai waise 😋"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        [`deadass ${topic} is lowkey overrated 💀`, "but whatever floats your boat"]
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeatingBursts([
        [`OMG ${topic.toUpperCase()} is AMAZING!! 🚀`, "super hyped about it! Have you tested it yet?"]
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeatingBursts([
        [`bet bro ${topic} is a straight vibe 🎮`, "10/10 no cap"]
      ], personaId, history);
    }
  }

  // 15. LAUGHTER & BANTER ("haha", "lol", "lmao", "😂", "pagal")
  if (hasAnyWord(inputLower, ['haha', 'hahaha', 'lol', 'lmao', 'xd', '😂', 'rofl', 'pagal', 'joke'])) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["has kyu rha h bhai 😂", "mai toh sach bol rha hu bilkul 🥲"],
        ["lmao bhai tu bhi na alag hi banda hai 😂", "waise bata aage kya scene h?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["lmao make it make sense 💀", "you're actually unhinged"]
      ], personaId, history);
    }
  }

  // 16. GREETINGS ("yo", "hey", "hello", "oie", "oye", "hi", "bhai")
  if (hasExactWord(inputLower, 'yo') || hasExactWord(inputLower, 'hey') || hasExactWord(inputLower, 'hello') || hasExactWord(inputLower, 'oie') || hasExactWord(inputLower, 'oye') || hasExactWord(inputLower, 'hi') || hasExactWord(inputLower, 'bhai')) {
    if (isBunty) {
      return pickNonRepeatingBursts([
        ["Hn 🥲 oye kya bol rha", "sab badhiya? kaisa hai tu?"],
        ["yo bhai! kya haal chaal? 🔥", "aaj bohot din baad msg kiya tune"],
        ["haan bol bhai 🥲", "kya chal rha aajkal?"]
      ], personaId, history);
    } else if (isAlex) {
      return pickNonRepeatingBursts([
        ["yo deadass 💀", "what's up with you?"]
      ], personaId, history);
    } else if (isSarah) {
      return pickNonRepeatingBursts([
        ["Hey!! Super excited to chat! 🚀", "What's on your mind today?"]
      ], personaId, history);
    } else if (isLeo) {
      return pickNonRepeatingBursts([
        ["yo bet bro 🎮", "what's good with you?"]
      ], personaId, history);
    }
  }

  // 17. DYNAMIC NON-REPETITIVE FALLBACKS (If no specific intent triggered)
  if (isBunty) {
    return pickNonRepeatingBursts([
      ["haa sahi me yrr 🥲", "chill kar tu bata aage kya plan h?"],
      ["sahi baat h bhai 🥲", "waise aur kya chal rha life me?"],
      ["are bilkul bhai 100% agreed 🥲", "tu bata aage kya socha fir?"],
      ["haa bhai samajh rha hu 🥲", "aur suna kya naya chal rha?"]
    ], personaId, history);
  } else if (isAlex) {
    return pickNonRepeatingBursts([
      ["deadass bro 💀 whatever you say", "lowkey true I guess 😒"],
      ["sureee bro whatever floats your boat 💀"]
    ], personaId, history);
  } else if (isSarah) {
    return pickNonRepeatingBursts([
      ["Awesome!! Let's build and learn more! 🚀", "Tell me more about it! 🔥"]
    ], personaId, history);
  } else if (isLeo) {
    return pickNonRepeatingBursts([
      ["bet bro, straight vibe 🎮", "no cap fr 👀"]
    ], personaId, history);
  }

  return ["haa bilkul 🥲"];
}
