/**
 * MyFriend AI - Data Science & NLP Module
 * Implements TF-IDF Vectorization, Cosine Similarity, Markov Chain Language Modeling, and Fine-Tuning Exporter.
 */

// 1. TF-IDF VECTORIZER
export class TFIDFVectorizer {
  constructor() {
    this.idfMap = {};
    this.docCount = 0;
    this.vocabulary = new Set();
  }

  fit(documents) {
    this.docCount = documents.length;
    const docFreq = {};

    documents.forEach(doc => {
      const words = new Set(this.tokenize(doc));
      words.forEach(word => {
        docFreq[word] = (docFreq[word] || 0) + 1;
        this.vocabulary.add(word);
      });
    });

    Object.keys(docFreq).forEach(word => {
      this.idfMap[word] = Math.log((this.docCount + 1) / (docFreq[word] + 1)) + 1;
    });
  }

  transform(text) {
    const tokens = this.tokenize(text);
    const tfMap = {};
    tokens.forEach(t => {
      tfMap[t] = (tfMap[t] || 0) + 1;
    });

    const vector = {};
    const totalTokens = tokens.length || 1;

    Object.keys(tfMap).forEach(word => {
      const tf = tfMap[word] / totalTokens;
      const idf = this.idfMap[word] || (Math.log(this.docCount + 1) + 1);
      vector[word] = tf * idf;
    });

    return vector;
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  getTopKeywords(documents, topK = 15) {
    this.fit(documents);
    const combinedVector = {};

    documents.forEach(doc => {
      const vec = this.transform(doc);
      Object.keys(vec).forEach(word => {
        combinedVector[word] = (combinedVector[word] || 0) + vec[word];
      });
    });

    return Object.entries(combinedVector)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([word, score]) => ({ word, score: score.toFixed(4) }));
  }
}

// 2. COSINE SIMILARITY ENGINE
export function computeCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  Object.keys(vecA).forEach(word => {
    normA += vecA[word] * vecA[word];
    if (vecB[word]) {
      dotProduct += vecA[word] * vecB[word];
    }
  });

  Object.keys(vecB).forEach(word => {
    normB += vecB[word] * vecB[word];
  });

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 3. MARKOV CHAIN LANGUAGE MODEL (Local Micro-LLM Generator)
export class MarkovChainLM {
  constructor(order = 2) {
    this.order = order;
    this.transitions = {};
    this.startTokens = [];
  }

  train(corpusTexts) {
    corpusTexts.forEach(text => {
      const tokens = text.trim().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return;

      if (tokens.length >= this.order) {
        const startState = tokens.slice(0, this.order).join(' ');
        this.startTokens.push(startState);
      }

      for (let i = 0; i <= tokens.length - this.order - 1; i++) {
        const state = tokens.slice(i, i + this.order).join(' ');
        const nextToken = tokens[i + this.order];

        if (!this.transitions[state]) {
          this.transitions[state] = [];
        }
        this.transitions[state].push(nextToken);
      }
    });
  }

  generate(seedWord = '', maxWords = 15) {
    if (this.startTokens.length === 0) return null;

    let currentState = null;
    if (seedWord) {
      const matchingStarts = this.startTokens.filter(s => s.toLowerCase().includes(seedWord.toLowerCase()));
      if (matchingStarts.length > 0) {
        currentState = pickRandom(matchingStarts);
      }
    }

    if (!currentState) {
      currentState = pickRandom(this.startTokens);
    }

    const output = currentState.split(' ');

    for (let i = 0; i < maxWords; i++) {
      const possibleNext = this.transitions[currentState];
      if (!possibleNext || possibleNext.length === 0) break;

      const nextToken = pickRandom(possibleNext);
      output.push(nextToken);

      const words = output.slice(-this.order);
      currentState = words.join(' ');
    }

    return output.join(' ');
  }
}

// 4. JSONL FINE-TUNING DATASET EXPORTER
export function exportFineTuningDataset(chatPairs, personaName, systemPrompt) {
  if (!chatPairs || chatPairs.length === 0) return null;

  const jsonlLines = chatPairs.map(pair => {
    return JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt || `You are ${personaName}, speaking in your authentic voice.` },
        { role: 'user', content: pair.prompt },
        { role: 'assistant', content: pair.response }
      ]
    });
  });

  return jsonlLines.join('\n');
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
