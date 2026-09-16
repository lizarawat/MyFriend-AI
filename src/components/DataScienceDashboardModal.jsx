import React, { useState } from 'react';
import { X, BarChart3, Download, Cpu, Sparkles, Database, Check } from 'lucide-react';
import { exportFineTuningDataset, MarkovChainLM } from '../services/dataScienceNLP';

export default function DataScienceDashboardModal({ persona, onClose }) {
  if (!persona) return null;

  const [generatedMarkovText, setGeneratedMarkovText] = useState('');
  const [copiedDataset, setCopiedDataset] = useState(false);

  const tfidfKeywords = persona.tfidfKeywords || [];
  const chatPairs = persona.chatPairs || [];

  // Generate Markov text locally using persona's trained transitions
  const handleTestMarkov = () => {
    const markovLM = new MarkovChainLM(2);
    markovLM.transitions = persona.markovTransitions || {};
    markovLM.startTokens = persona.markovStarts || [];

    const result = markovLM.generate('', 12);
    setGeneratedMarkovText(result || persona.sampleMessages?.[0] || 'No Markov states available');
  };

  // Download JSONL dataset file
  const handleDownloadDataset = () => {
    const jsonlContent = exportFineTuningDataset(chatPairs, persona.name, persona.systemPrompt);
    if (!jsonlContent) {
      alert("No chat pairs available for export.");
      return;
    }

    const blob = new Blob([jsonlContent], { type: 'application/jsonlines' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.name.toLowerCase().replace(/\s+/g, '_')}_finetune_dataset.jsonl`;
    a.click();
    URL.revokeObjectURL(url);

    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 3000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={24} color="var(--accent-cyan)" />
            <span className="modal-title">Data Science & Micro-LLM Inspector</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Top Info Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div className="glass-card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Language Model</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-cyan)', marginTop: 4 }}>
              {persona.detectedLanguage || 'English'}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Chat Pairs</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-purple)', marginTop: 4 }}>
              {chatPairs.length} Pairs
            </div>
          </div>

          <div className="glass-card" style={{ padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Analyzed Messages</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-emerald)', marginTop: 4 }}>
              {persona.messageCount || 0} Texts
            </div>
          </div>
        </div>

        {/* Section 1: TF-IDF Keyword Weights */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={16} color="var(--accent-cyan)" /> TF-IDF Feature Vector Weights
          </h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tfidfKeywords.slice(0, 12).map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: 10, 
                  background: 'rgba(0, 242, 254, 0.1)', 
                  border: '1px solid var(--border-glass-highlight)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontWeight: 700 }}>{item.word}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>score: {item.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Markov Chain Model Simulation */}
        <div style={{ marginBottom: 24, padding: 16, borderRadius: 14, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={16} color="var(--accent-purple)" /> Local Markov Chain Generator (Micro-LLM)
            </h4>
            <button className="btn-secondary" onClick={handleTestMarkov} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Synthesize Text
            </button>
          </div>

          {generatedMarkovText ? (
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass-highlight)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>
              "{generatedMarkovText}"
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Click "Synthesize Text" to test local Markov chain language generation for {persona.name}.
            </div>
          )}
        </div>

        {/* Section 3: Download Fine-Tuning Dataset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 242, 254, 0.15) 100%)', border: '1px solid var(--border-glass-highlight)' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 2 }}>Export Instruction Fine-Tuning Dataset</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Download `.jsonl` dataset to fine-tune Meta Llama 3, Mistral, or OpenAI on {persona.name}'s real voice.
            </div>
          </div>

          <button className="btn-primary" onClick={handleDownloadDataset} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {copiedDataset ? <Check size={16} /> : <Download size={16} />}
            {copiedDataset ? 'Downloaded!' : 'Export .JSONL'}
          </button>
        </div>
      </div>
    </div>
  );
}
