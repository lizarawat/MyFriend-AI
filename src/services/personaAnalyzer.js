/**
 * MyFriend AI - Persona Profiling & Style Analyzer
 * Extracts conversation turn pairs, language signature (Hinglish/English), top emojis, slang, and prompt profile.
 */

const ENGLISH_STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were'
]);

const HINGLISH_KEYWORDS = [
  'kya', 'hai', 'haa', 'haan', 'nhi', 'nahi', 'bhai', 'bro', 'yrr', 'yarr', 'karra', 'kar', 'raha',
  'kaise', 'sahi', 'bol', 'arrey', 'sunn', 'oiee', 'oye', 'mujhe', 'tujhe', 'teri', 'mera', 'meri',
  'achha', 'kuch', 'bata', 'rha', 'thi', 'tha', 'vale', 'karo', 'mat', 'abb', 'abey', 'chhod', 'chal'
];

export function analyzePersona(parsedData, targetPersonName) {
  const allMessages = parsedData.messages || [];
  const friendMessages = allMessages.filter(m => m.sender.toLowerCase() === targetPersonName.toLowerCase());

  if (friendMessages.length === 0) {
    return { error: `No messages found for speaker "${targetPersonName}"` };
  }

  // 1. Extract Conversation Pairs (User -> Friend response pairs)
  const chatPairs = [];
  for (let i = 0; i < allMessages.length - 1; i++) {
    const current = allMessages[i];
    const next = allMessages[i + 1];

    if (current.sender.toLowerCase() !== targetPersonName.toLowerCase() && 
        next.sender.toLowerCase() === targetPersonName.toLowerCase()) {
      chatPairs.push({
        prompt: current.text.trim(),
        response: next.text.trim()
      });
    }
  }

  // 2. Language Detection (Hinglish vs English)
  let hinglishCount = 0;
  const texts = friendMessages.map(m => m.text);

  texts.forEach(t => {
    const lower = t.toLowerCase();
    HINGLISH_KEYWORDS.forEach(kw => {
      if (lower.includes(kw)) hinglishCount++;
    });
  });

  const isHinglish = hinglishCount > friendMessages.length * 0.15;
  const detectedLanguage = isHinglish ? 'Hinglish (Romanized Hindi + English)' : 'English';

  let totalWords = 0;
  let allCapsCount = 0;
  let allLowerCount = 0;
  let exclamationCount = 0;

  const wordFreq = {};
  const emojiFreq = {};
  const ngramFreq = {};

  const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

  texts.forEach(text => {
    // Emojis
    const emojis = text.match(emojiRegex) || [];
    emojis.forEach(e => {
      emojiFreq[e] = (emojiFreq[e] || 0) + 1;
    });

    // Casing & Punctuation
    if (text === text.toUpperCase() && /[A-Z]/.test(text)) allCapsCount++;
    if (text === text.toLowerCase() && /[a-z]/.test(text)) allLowerCount++;
    if (text.includes('!')) exclamationCount++;

    // Words
    const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean);
    totalWords += words.length;

    words.forEach(w => {
      if (!ENGLISH_STOP_WORDS.has(w) && w.length > 1) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

    // N-grams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (!ENGLISH_STOP_WORDS.has(words[i]) || !ENGLISH_STOP_WORDS.has(words[i + 1])) {
        ngramFreq[bigram] = (ngramFreq[bigram] || 0) + 1;
      }
    }
  });

  const messageCount = friendMessages.length;
  const avgWordsPerMsg = messageCount > 0 ? (totalWords / messageCount).toFixed(1) : 0;

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
    .map(([phrase]) => phrase);

  // Compute Personality Traits
  const totalEmojiCount = Object.values(emojiFreq).reduce((a, b) => a + b, 0);
  const emojiDensity = totalWords > 0 ? (totalEmojiCount / totalWords) * 100 : 0;

  const sarcasmIndex = Math.min(100, Math.round((allLowerCount / (messageCount || 1)) * 40 + (isHinglish ? 20 : 10) + 30));
  const energyIndex = Math.min(100, Math.round(((exclamationCount / (messageCount || 1)) * 40 + emojiDensity * 20 + 35)));
  const formalityIndex = isHinglish ? 15 : Math.max(10, Math.round(100 - (allLowerCount / (messageCount || 1)) * 60));
  const emojiIndex = Math.min(100, Math.round(emojiDensity * 30));

  let archetype = isHinglish ? 'Chill Hinglish Desi Viber' : 'Balanced Conversationalist';
  if (sarcasmIndex > 75) archetype = 'Witty & Sarcastic Chatter';
  else if (energyIndex > 75) archetype = 'High-Energy Hype Friend';

  // System Prompt for Gemini LLM
  const fewShotExamples = chatPairs.slice(0, 20).map(p => `User: "${p.prompt}"\n${targetPersonName}: "${p.response}"`).join('\n\n');

  const systemPrompt = `You are a virtual AI persona modeled strictly after "${targetPersonName}".

LANGUAGE & VOICE MATRIX:
- Primary Language: ${detectedLanguage}
- Archetype: ${archetype}
- Average Sentence Length: ${avgWordsPerMsg} words
- Favorite Words: ${topWords.slice(0, 8).map(w => w.word).join(', ')}
- Top Emojis: ${topEmojis.slice(0, 5).map(e => e.emoji).join(' ')}

CRITICAL LANGUAGE RULES:
1. You MUST write in ${detectedLanguage}. If the primary language is Hinglish, speak ONLY in Hinglish using words like "${topWords.slice(0, 5).map(w => w.word).join('", "')}". NEVER answer in formal standard English if the person speaks Hinglish!
2. Match ${targetPersonName}'s exact spelling, capitalization, and brevity.
3. ${allLowerCount > messageCount * 0.5 ? 'Write predominantly in lowercase or casual typing.' : 'Use standard capitalization.'}
4. Stay in character at all times.

FEW-SHOT REAL EXAMPLES OF ${targetPersonName.toUpperCase()}'S CHATS:
${fewShotExamples || 'No pair samples available'}`;

  // Unique non-empty sample messages
  const allSampleMessages = Array.from(new Set(texts.filter(t => t && t.trim().length > 0)));

  return {
    name: targetPersonName,
    archetype,
    detectedLanguage,
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
    topWords,
    topEmojis,
    topCatchphrases,
    allSampleMessages,
    chatPairs,
    sampleMessages: allSampleMessages.slice(-20),
    systemPrompt
  };
}
