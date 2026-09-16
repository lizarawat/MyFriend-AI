/**
 * PersonaEcho AI - Persona Profiling & Style Analyzer
 * Computes tone metrics, vocabulary distributions, slang, emoji signatures, and system prompt.
 */

const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were',
  'am', 'been', 'being', 'had', 'has', 'did', 'does', 'doing'
]);

const SLANG_KEYWORDS = {
  laughter: ['lol', 'lmao', 'lmfao', 'haha', 'hahaha', 'rofl', 'hehe', 'dead', '💀', '😂', '🤣'],
  slang: ['bruh', 'bro', 'fam', 'fr', 'ngl', 'tbh', 'idk', 'idc', 'bet', 'cap', 'nocap', 'slay', 'vibe', 'lowkey', 'highkey', 'deadass', 'sus', 'periodt', 'omg', 'wtf'],
  sarcasm: ['sure', 'totally', 'whatever', 'right', 'ok', 'okay', 'lol okay', 'nice', 'cool story', 'great'],
};

export function analyzePersona(parsedData, targetPersonName) {
  const allMessages = parsedData.messages || [];
  const friendMessages = allMessages.filter(m => m.sender.toLowerCase() === targetPersonName.toLowerCase());

  if (friendMessages.length === 0) {
    return { error: `No messages found for speaker "${targetPersonName}"` };
  }

  let totalWords = 0;
  let totalChars = 0;
  let allCapsCount = 0;
  let allLowerCount = 0;
  let exclamationCount = 0;
  let questionCount = 0;
  let ellipsisCount = 0;

  const wordFreq = {};
  const emojiFreq = {};
  const ngramFreq = {};

  const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

  // Process text messages
  const texts = friendMessages.map(m => m.text);

  texts.forEach(text => {
    // 1. Emoji Extraction
    const emojis = text.match(emojiRegex) || [];
    emojis.forEach(e => {
      emojiFreq[e] = (emojiFreq[e] || 0) + 1;
    });

    // 2. Case Check
    if (text === text.toUpperCase() && /[A-Z]/.test(text)) {
      allCapsCount++;
    }
    if (text === text.toLowerCase() && /[a-z]/.test(text)) {
      allLowerCount++;
    }

    // 3. Punctuation
    if (text.includes('!')) exclamationCount++;
    if (text.includes('?')) questionCount++;
    if (text.includes('...')) ellipsisCount++;

    // 4. Tokenize Words
    const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean);
    totalWords += words.length;
    totalChars += text.length;

    words.forEach(w => {
      if (!STOP_WORDS.has(w) && w.length > 1) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

    // 5. N-grams (2-word catchphrases)
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 1])) {
        ngramFreq[bigram] = (ngramFreq[bigram] || 0) + 1;
      }
    }
  });

  const messageCount = friendMessages.length;
  const avgWordsPerMsg = messageCount > 0 ? (totalWords / messageCount).toFixed(1) : 0;

  // Top Vocabulary & Emojis
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  const topEmojis = Object.entries(emojiFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }));

  const topCatchphrases = Object.entries(ngramFreq)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count >= 2)
    .slice(0, 8)
    .map(([phrase, count]) => phrase);

  // Compute Personality Traits (Scale 0 - 100)
  const totalEmojiCount = Object.values(emojiFreq).reduce((a, b) => a + b, 0);
  const emojiDensity = totalWords > 0 ? (totalEmojiCount / totalWords) * 100 : 0;

  let laughterScore = 0;
  SLANG_KEYWORDS.laughter.forEach(k => {
    if (wordFreq[k]) laughterScore += wordFreq[k];
  });

  let slangScore = 0;
  SLANG_KEYWORDS.slang.forEach(k => {
    if (wordFreq[k]) slangScore += wordFreq[k];
  });

  // Calculate normalized trait indices
  const sarcasmIndex = Math.min(100, Math.round((slangScore * 10 + laughterScore * 5) / (messageCount || 1) * 20 + 35));
  const energyIndex = Math.min(100, Math.round(((exclamationCount / messageCount) * 40 + (allCapsCount / messageCount) * 40 + emojiDensity * 10) || 45));
  const formalityIndex = Math.max(5, Math.min(100, Math.round(100 - (slangScore * 15 + (allLowerCount / messageCount) * 30 + laughterScore * 10))));
  const emojiIndex = Math.min(100, Math.round(emojiDensity * 25));

  // Determine Persona Archetype Title
  let archetype = 'Balanced Conversationalist';
  if (sarcasmIndex > 75) archetype = 'Sarcastic & Witty Banter Specialist';
  else if (energyIndex > 75) archetype = 'High-Energy Hype Friend';
  else if (formalityIndex > 75) archetype = 'Thoughtful & Professional Communicator';
  else if (slangScore > 5) archetype = 'Chill Gen-Z Viber';

  // System Prompt for Gemini / Heuristic Engine
  const systemPrompt = `You are a virtual AI persona modeled strictly after "${targetPersonName}".

PERSONALITY & VOICE METRICS:
- Archetype: ${archetype}
- Sarcasm & Humor Level: ${sarcasmIndex}/100
- Energy & Hype Level: ${energyIndex}/100
- Formality Level: ${formalityIndex}/100
- Emoji Usage Frequency: ${emojiIndex}/100
- Average Sentence Length: ${avgWordsPerMsg} words

SIGNATURE VOCABULARY & SLANG:
- Favorite Words: ${topWords.slice(0, 8).map(w => w.word).join(', ')}
- Top Emojis: ${topEmojis.slice(0, 5).map(e => e.emoji).join(' ')}
- Favorite Catchphrases: ${topCatchphrases.length > 0 ? topCatchphrases.join(', ') : 'None'}

RULES:
1. Always speak exactly like ${targetPersonName}. Match their exact tone, word choices, emojis, and sentence length.
2. ${allLowerCount > messageCount * 0.5 ? 'Write predominantly in lowercase.' : 'Use standard capitalization.'}
3. ${topEmojis.length > 0 ? `Incorporate emojis like ${topEmojis.slice(0, 3).map(e => e.emoji).join(' ')} naturally.` : 'Use minimal emojis.'}
4. Stay in character at all times.`;

  return {
    name: targetPersonName,
    archetype,
    messageCount,
    avgWordsPerMsg,
    traits: {
      sarcasm: sarcasmIndex,
      energy: energyIndex,
      formality: formalityIndex,
      emojiFrequency: emojiIndex,
    },
    casing: {
      allCapsRatio: (allCapsCount / messageCount).toFixed(2),
      allLowerRatio: (allLowerCount / messageCount).toFixed(2),
    },
    punctuation: {
      exclamationRatio: (exclamationCount / messageCount).toFixed(2),
      questionRatio: (questionCount / messageCount).toFixed(2),
      ellipsisRatio: (ellipsisCount / messageCount).toFixed(2),
    },
    topWords,
    topEmojis,
    topCatchphrases,
    sampleMessages: texts.slice(-10), // Last 10 messages for context
    systemPrompt
  };
}
