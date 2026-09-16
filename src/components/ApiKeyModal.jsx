import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Zap } from 'lucide-react';

export default function ApiKeyModal({ apiKey, onSaveApiKey, onClose }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={22} color="var(--accent-cyan)" />
            <span className="modal-title">AI Engine Settings</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: 14, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', fontSize: '0.85rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} /> Built-in Heuristic Replica Engine works 100% offline with zero setup required.
        </div>

        <div className="form-group">
          <label className="form-label">Google Gemini API Key (Optional)</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="AIzaSy..." 
            value={keyInput} 
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 6, display: 'block' }}>
            Providing a Gemini API key enables deep LLM reasoning infused with the parsed persona style profile.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save Key</button>
        </div>
      </div>
    </div>
  );
}
