import React from 'react';
import { SlidersHorizontal, Volume2, BarChart3 } from 'lucide-react';

export default function ChatHeader({ persona, onOpenInspector, onOpenDataScience, apiKey }) {
  if (!persona) return null;

  const playVoiceSample = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    const sample = persona.sampleMessages?.[0] || `Hey there! I am ${persona.name}. Ready to chat!`;
    const utterance = new SpeechSynthesisUtterance(sample);
    
    utterance.pitch = (persona.traits?.energy > 70) ? 1.2 : (persona.traits?.sarcasm > 70 ? 0.95 : 1.0);
    utterance.rate = (persona.traits?.energy > 70) ? 1.1 : 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const hasApiKey = apiKey && apiKey.trim().length > 0;

  return (
    <header className="chat-header">
      <div className="chat-header-user">
        <div className="avatar-wrap" style={{ width: 44, height: 44 }}>
          <img src={persona.avatar} alt={persona.name} className="avatar-img" />
          <span className="status-dot status-online"></span>
        </div>
        <div>
          <div className="chat-header-name">{persona.name}</div>
          <div className="chat-header-status">
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent-emerald)',
              display: 'inline-block'
            }}></span>
            {hasApiKey ? 'Gemini 1.5 LLM Engine Active' : 'TF-IDF & Markov Micro-LLM Active'}
          </div>
        </div>
      </div>

      {/* Trait Chips & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button 
          className="icon-btn" 
          onClick={playVoiceSample}
          title="Play Persona Voice Sample"
          style={{ width: 'auto', padding: '0 12px', gap: 6 }}
        >
          <Volume2 size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Voice</span>
        </button>

        <button 
          className="icon-btn" 
          onClick={onOpenDataScience}
          title="Data Science & Micro-LLM Analytics"
          style={{ width: 'auto', padding: '0 12px', gap: 6, borderColor: 'var(--border-glass-highlight)' }}
        >
          <BarChart3 size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>Data Science</span>
        </button>

        <button 
          className="icon-btn" 
          onClick={onOpenInspector}
          title="Inspect & Adjust Persona Brain"
          style={{ width: 'auto', padding: '0 12px', gap: 6, borderColor: 'var(--border-glass-highlight)' }}
        >
          <SlidersHorizontal size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-purple)' }}>Brain Inspector</span>
        </button>
      </div>
    </header>
  );
}
