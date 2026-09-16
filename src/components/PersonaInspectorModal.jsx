import React, { useState } from 'react';
import { X, SlidersHorizontal, Brain, Flame, Smile, Save, Sparkles } from 'lucide-react';

export default function PersonaInspectorModal({ persona, onSavePersona, onClose }) {
  if (!persona) return null;

  const [traits, setTraits] = useState(persona.traits || { sarcasm: 50, energy: 50, formality: 50, emojiFrequency: 50 });
  const [customFacts, setCustomFacts] = useState(persona.customFacts || '');
  const [systemPrompt, setSystemPrompt] = useState(persona.systemPrompt || '');

  const handleSliderChange = (key, val) => {
    setTraits(prev => ({ ...prev, [key]: parseInt(val) }));
  };

  const handleSave = () => {
    const updated = {
      ...persona,
      traits,
      customFacts,
      systemPrompt
    };
    onSavePersona(updated);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SlidersHorizontal size={22} color="var(--accent-purple)" />
            <span className="modal-title">Persona Brain Inspector & Tuner</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Contact Info Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: 14, borderRadius: 14, background: 'rgba(30, 41, 59, 0.4)', border: '1px solid var(--border-glass)' }}>
          <img src={persona.avatar} alt={persona.name} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{persona.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{persona.archetype || 'Custom Persona'}</div>
          </div>
        </div>

        {/* Trait Tuning Sliders */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={16} color="var(--accent-cyan)" /> Fine-Tune Personality Dynamics
          </h4>

          <div className="slider-group">
            <span style={{ fontSize: '0.85rem', width: 120 }}>Sarcasm & Wit:</span>
            <input 
              type="range" min="0" max="100" className="slider-input" 
              value={traits.sarcasm} 
              onChange={(e) => handleSliderChange('sarcasm', e.target.value)} 
            />
            <span style={{ fontSize: '0.85rem', width: 40, textAlign: 'right', fontWeight: 700, color: 'var(--accent-cyan)' }}>{traits.sarcasm}%</span>
          </div>

          <div className="slider-group">
            <span style={{ fontSize: '0.85rem', width: 120 }}>Energy & Hype:</span>
            <input 
              type="range" min="0" max="100" className="slider-input" 
              value={traits.energy} 
              onChange={(e) => handleSliderChange('energy', e.target.value)} 
            />
            <span style={{ fontSize: '0.85rem', width: 40, textAlign: 'right', fontWeight: 700, color: 'var(--accent-emerald)' }}>{traits.energy}%</span>
          </div>

          <div className="slider-group">
            <span style={{ fontSize: '0.85rem', width: 120 }}>Formality:</span>
            <input 
              type="range" min="0" max="100" className="slider-input" 
              value={traits.formality} 
              onChange={(e) => handleSliderChange('formality', e.target.value)} 
            />
            <span style={{ fontSize: '0.85rem', width: 40, textAlign: 'right', fontWeight: 700, color: 'var(--accent-purple)' }}>{traits.formality}%</span>
          </div>
        </div>

        {/* Emojis & Signature Catchphrases */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10 }}>Signature Vocabulary & Emojis</h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {(persona.topEmojis || []).map((e, idx) => (
              <span key={idx} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.08)', fontSize: '1.1rem' }}>
                {e.emoji}
              </span>
            ))}
            {(persona.topCatchphrases || []).map((phrase, idx) => (
              <span key={idx} className="trait-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                "{phrase}"
              </span>
            ))}
          </div>
        </div>

        {/* Custom Facts & Memories */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="var(--accent-cyan)" /> Persona Memory & Knowledge Rules (Custom Facts)
          </label>
          <textarea 
            className="form-textarea" 
            rows="3" 
            placeholder="Add specific facts e.g. 'Alex hates pineapples', 'Alex plays guitar', 'Alex lives in Brooklyn'..."
            value={customFacts}
            onChange={(e) => setCustomFacts(e.target.value)}
          />
        </div>

        {/* System Prompt Inspector */}
        <div className="form-group">
          <label className="form-label">Generated System Prompt Matrix</label>
          <textarea 
            className="form-textarea" 
            rows="4" 
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={16} /> Save Persona Tuning
          </button>
        </div>
      </div>
    </div>
  );
}
