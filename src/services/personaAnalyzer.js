import { TFIDFVectorizer, MarkovChainLM } from './dataScienceNLP';

/**
 * MyFriend AI - Persona Profiling & Style Analyzer
 * Features Demographic Age Group Classification (Gen-Z, Millennial, Adult/Elder),
 * TF-IDF feature extraction, conversation pair memory, and prompt matrix generation.
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

// Demographic Age Group Slang Lexicons
const DEMOGRAPHIC_LEXICONS = {
  gen_z: ['fr', 'ngl', 'deadass', 'bet', 'vibe', 'slay', 'bruh', 'lowkey', 'idk', 'wbu', 'rn', 'tbh', 'idc', 'skibidi', 'rizz', '💀', '😭', '🥲'],
  millennial: ['lol', 'lmao', 'haha', 'hahaha', 'yeah', 'cool', 'awesome', 'nice', 'sweet', 'cheers', 'tbh', '😂', '👍'],
  adult_elder: ['regards', 'dear', 'thanks', 'thank you', 'hope you are well', 'take care', 'good morning', 'blessings', 'pls', 'please', '😊', '🙏']
};

export function analyzePersona(parsedData, targetPersonName) {
  const allMessages = parsedData.messages || [];
  const friendMessages = allMessages.filter(m => m.sender.toLowerCase() === targetPersonName.toLowerCase());

  if (friendMessages.length === 0) {
    return { error: `No messages found for speaker "${targetPersonName}"` };
  }

  // 1. Extract Conversation Turn Pairs
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

  // 2. Language & Age Group Demographic Classification
  let hinglishCount = 0;
  let genzCount = 0;
  let millennialCount = 0;
  let adultCount = 0;

  const texts = friendMessages.map(m => m.text);
  const combinedText = texts.join(' ').toLowerCase();

  HINGLISH_KEYWORDS.forEach(kw => {
    if (combinedText.includes(kw)) hinglishCount++;
  });

  DEMOGRAPHIC_LEXICONS.gen_z.forEach(kw => {
    if (combinedText.includes(kw)) genzCount++;
  });

  DEMOGRAPHIC_LEXICONS.millennial.forEach(kw => {
    if (combinedText.includes(kw)) millennialCount++;
  });

  DEMOGRAPHIC_LEXICONS.adult_elder.forEach(kw => {
    if (combinedText.includes(kw)) adultCount++;
  });

  const totalMsgs = friendMessages.length || 1;
  const lowerCount = texts.filter(t => t === t.toLowerCase()).length;
  const fullPunctCount = texts.filter(t => t.endsWith('.') || t.endsWith('!')).length;

  let ageGroup = 'Millennial / Young Adult (25-35)';
  if (lowerCount / totalMsgs > 0.6 || genzCount >= millennialCount) {
    ageGroup = 'Gen-Z / Youth Texting (13-24)';
  } else if (fullPunctCount / totalMsgs > 0.5 || adultCount > millennialCount) {
    ageGroup = 'Adult / Formal Communicator (36+)';
  }

  const isHinglish = hinglishCount > totalMsgs * 0.12;
  const detectedLanguage = isHinglish ? 'Hinglish (Romanized Hindi + English)' : 'English';

  // 3. TF-IDF Feature Extraction
  const tfidfVectorizer = new TFIDFVectorizer();
  const tfidfKeywords = tfidfVectorizer.getTopKeywords(texts, 15);

  // 4. Markov Chain Model Training
  const markovLM = new MarkovChainLM(2);
  markovLM.train(texts);

  let totalWords = 0;
  let allCapsCount = 0;
  let allLowerCount = 0;
  let exclamationCount = 0;

  const wordFreq = {};
  const emojiFreq = {};
  const ngramFreq = {};

  const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/gu;

  texts.forEach(text => {
    const emojis = text.match(emojiRegex) || [];
    emojis.forEach(e => {
      emojiFreq[e] = (emojiFreq[e] || 0) + 1;
    });

    if (text === text.toUpperCase() && /[A-Z]/.test(text)) allCapsCount++;
    if (text === text.toLowerCase() && /[a-z]/.test(text)) allLowerCount++;
    if (text.includes('!')) exclamationCount++;

    const words = text.toLowerCase().replace(/[^\w\s']/g, '').split(/\s+/).filter(Boolean);
    totalWords += words.length;

    words.forEach(w => {
      if (!ENGLISH_STOP_WORDS.has(w) && w.length > 1) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });

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

  const totalEmojiCount = Object.values(emojiFreq).reduce((a, b) => a + b, 0);
  const emojiDensity = totalWords > 0 ? (totalEmojiCount / totalWords) * 100 : 0;

  const sarcasmIndex = Math.min(100, Math.round((allLowerCount / (messageCount || 1)) * 40 + (isHinglish ? 20 : 10) + 30));
  const energyIndex = Math.min(100, Math.round(((exclamationCount / (messageCount || 1)) * 40 + emojiDensity * 20 + 35)));
  const formalityIndex = isHinglish ? 15 : Math.max(10, Math.round(100 - (allLowerCount / (messageCount || 1)) * 60));
  const emojiIndex = Math.min(100, Math.round(emojiDensity * 30));

  let archetype = isHinglish ? 'Chill Hinglish Desi Viber' : 'Balanced Conversationalist';
  if (sarcasmIndex > 75) archetype = 'Witty & Sarcastic Chatter';
  else if (energyIndex > 75) archetype = 'High-Energy Hype Friend';

  const fewShotExamples = chatPairs.slice(0, 20).map(p => `User: "${p.prompt}"\n${targetPersonName}: "${p.response}"`).join('\n\n');

  const systemPrompt = `You are a virtual AI persona modeled strictly after "${targetPersonName}".

BASE FOUNDATION & DEMOGRAPHICS MATRIX:
- Demographics Foundation Classification: ${ageGroup}
- Primary Language: ${detectedLanguage}
- Archetype: ${archetype}
- TF-IDF Top Words: ${tfidfKeywords.slice(0, 8).map(k => k.word).join(', ')}
- Top Emojis: ${topEmojis.slice(0, 5).map(e => e.emoji).join(' ')}

CRITICAL LANGUAGE RULES:
1. Speak strictly using the ${ageGroup} texting style and ${detectedLanguage}. If Hinglish, write ONLY in casual Hinglish using words like "${tfidfKeywords.slice(0, 5).map(w => w.word).join('", "')}".
2. Match ${targetPersonName}'s exact spelling, capitalization, and brevity.
3. Stay in character at all times.

REAL CONVERSATION EXAMPLES OF ${targetPersonName.toUpperCase()}:
${fewShotExamples || 'No pair samples available'}`;

  const allSampleMessages = Array.from(new Set(texts.filter(t => t && t.trim().length > 0)));

  return {
    name: targetPersonName,
    archetype,
    ageGroup,
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
    tfidfKeywords,
    markovTransitions: markovLM.transitions,
    markovStarts: markovLM.startTokens,
    allSampleMessages,
    chatPairs,
    sampleMessages: allSampleMessages.slice(-20),
    systemPrompt
  };
}
