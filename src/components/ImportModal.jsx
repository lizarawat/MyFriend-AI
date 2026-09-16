import React, { useState } from 'react';
import { X, Upload, FileText, Sparkles, Check, AlertCircle } from 'lucide-react';
import { parseChatLog } from '../services/chatParser';
import { analyzePersona } from '../services/personaAnalyzer';

export default function ImportModal({ onAddPersona, onClose }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste' | 'sample'
  const [rawText, setRawText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      processTextContent(content);
    };
    reader.readAsText(file);
  };

  const processTextContent = (text) => {
    setErrorMsg('');
    const res = parseChatLog(text);
    if (res.error) {
      setErrorMsg(res.error);
      setParsedResult(null);
    } else {
      setParsedResult(res);
      if (res.participants.length > 0) {
        setSelectedSpeaker(res.participants[0]);
      }
    }
  };

  const handlePasteAnalyze = () => {
    if (!rawText.trim()) {
      setErrorMsg('Please paste chat text transcript first');
      return;
    }
    processTextContent(rawText);
  };

  const handleCreatePersona = () => {
    if (!parsedResult || !selectedSpeaker) return;

    const analysis = analyzePersona(parsedResult, selectedSpeaker);
    if (analysis.error) {
      setErrorMsg(analysis.error);
      return;
    }

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80'
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newPersona = {
      id: 'persona-' + Date.now(),
      name: selectedSpeaker,
      avatar: customAvatar.trim() || randomAvatar,
      ...analysis
    };

    onAddPersona(newPersona);
    onClose();
  };

  const loadSampleDataset = (type) => {
    let sampleLog = '';
    if (type === 'sarcastic') {
      sampleLog = `15/09/24, 10:15 - Alex: deadass bro? 💀
15/09/24, 10:16 - You: Yeah man what are you doing today?
15/09/24, 10:16 - Alex: lol okay whatever you say 😒
15/09/24, 10:17 - You: Want to grab pizza?
15/09/24, 10:17 - Alex: sureee because that makes total sense lmao
15/09/24, 10:18 - Alex: count me in anyway 💀`;
    } else if (type === 'tech') {
      sampleLog = `15/09/24, 11:00 - Sarah: That new AI model launch is AMAZING! 🚀
15/09/24, 11:01 - You: Did you try the demo?
15/09/24, 11:01 - Sarah: Yes super hyped for this!! 🔥
15/09/24, 11:02 - Sarah: Let's write some code and test it 💡`;
    } else {
      sampleLog = `15/09/24, 12:30 - Leo: bet bro hopping on Discord 🎮
15/09/24, 12:31 - You: Are we playing Valorant or Warzone?
15/09/24, 12:31 - Leo: ggs bro whichever, straight vibe 👀
15/09/24, 12:32 - Leo: bruh fr no cap`;
    }

    setRawText(sampleLog);
    processTextContent(sampleLog);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={22} color="var(--accent-cyan)" />
            <span className="modal-title">Analyze Chat & Create Virtual Friend</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button 
            className={`btn-secondary ${activeTab === 'upload' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('upload')}
            style={{ flex: 1, padding: 10, fontSize: '0.85rem' }}
          >
            Upload Export File
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'paste' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('paste')}
            style={{ flex: 1, padding: 10, fontSize: '0.85rem' }}
          >
            Paste Chat Transcript
          </button>
          <button 
            className={`btn-secondary ${activeTab === 'sample' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('sample')}
            style={{ flex: 1, padding: 10, fontSize: '0.85rem' }}
          >
            Sample Chats
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div style={{ border: '2px dashed var(--border-glass-highlight)', borderRadius: 16, padding: 30, textAlign: 'center', background: 'rgba(30, 41, 59, 0.3)', marginBottom: 20 }}>
            <Upload size={36} color="var(--accent-cyan)" style={{ marginBottom: 10 }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Drop your chat export file here</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Supports WhatsApp (`.txt`), Telegram (`.json`), Discord, or raw text transcripts</div>
            <label className="btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}>
              Browse File
              <input type="file" accept=".txt,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Tab 2: Paste Text */}
        {activeTab === 'paste' && (
          <div style={{ marginBottom: 20 }}>
            <textarea 
              className="form-textarea" 
              rows="6" 
              placeholder={`Paste chat export lines here, e.g.:\n15/09/24, 10:15 - Alex: deadass bro? 💀\n15/09/24, 10:16 - You: What are you doing?\n15/09/24, 10:17 - Alex: lmao nothing much`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <button className="btn-secondary" onClick={handlePasteAnalyze} style={{ marginTop: 10, width: '100%' }}>
              Parse & Analyze Transcript
            </button>
          </div>
        )}

        {/* Tab 3: Sample Datasets */}
        {activeTab === 'sample' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="glass-card" style={{ padding: 16, cursor: 'pointer', textAlign: 'center' }} onClick={() => loadSampleDataset('sarcastic')}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>💀</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Alex (Sarcastic)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Witty dry humor, deadass, lmao</div>
            </div>

            <div className="glass-card" style={{ padding: 16, cursor: 'pointer', textAlign: 'center' }} onClick={() => loadSampleDataset('tech')}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🚀</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sarah (Tech)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High energy, coding, hype</div>
            </div>

            <div className="glass-card" style={{ padding: 16, cursor: 'pointer', textAlign: 'center' }} onClick={() => loadSampleDataset('gamer')}>
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🎮</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Leo (Gamer)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chill, bruh, bet, ggs</div>
            </div>
          </div>
        )}

        {/* Parsed Result Step: Select Person to Replicate */}
        {parsedResult && parsedResult.success && (
          <div style={{ padding: 16, borderRadius: 14, background: 'rgba(0, 242, 254, 0.08)', border: '1px solid var(--border-glass-highlight)', marginTop: 16 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={18} /> Analysis Complete: Found {parsedResult.totalMessages} Messages!
            </h4>

            <div className="form-group">
              <label className="form-label">Select which friend you want to turn into an AI Bot:</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {parsedResult.participants.map(p => (
                  <button 
                    key={p} 
                    className={`btn-secondary ${selectedSpeaker === p ? 'btn-primary' : ''}`}
                    onClick={() => setSelectedSpeaker(p)}
                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                  >
                    👤 {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleCreatePersona} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> Generate Virtual Replica Bot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
