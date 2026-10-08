import React, { useState } from 'react';
import { X, Upload, Folder, FileArchive, Sparkles, Check, AlertCircle, User, MessageSquare } from 'lucide-react';
import { parseChatLog, parseZipArchive, parseFolderFileList } from '../services/chatParser';
import { analyzePersona } from '../services/personaAnalyzer';

export default function ImportModal({ onAddPersona, onClose }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste' | 'sample'
  const [rawText, setRawText] = useState('');
  const [parsedResult, setParsedResult] = useState(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [customAgeGroup, setCustomAgeGroup] = useState('Gen-Z / Youth Texting (13-24)');
  const [customDescription, setCustomDescription] = useState('Talks in short Hinglish lines, uses 🥲, very chill and casual.');
  const [customAvatar, setCustomAvatar] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        const res = await parseZipArchive(file);
        handleAnalysisResult(res);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          processTextContent(content);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      setErrorMsg('Failed to process file: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFolderUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await parseFolderFileList(files);
      handleAnalysisResult(res);
    } catch (err) {
      setErrorMsg('Failed to process folder: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const items = e.dataTransfer.files;
    if (!items || items.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      if (items.length === 1 && items[0].name.toLowerCase().endsWith('.zip')) {
        const res = await parseZipArchive(items[0]);
        handleAnalysisResult(res);
      } else if (items.length > 1) {
        const res = await parseFolderFileList(items);
        handleAnalysisResult(res);
      } else {
        const file = items[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          processTextContent(event.target.result);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      setErrorMsg('Error reading dropped files: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processTextContent = (text) => {
    setErrorMsg('');
    const res = parseChatLog(text);
    handleAnalysisResult(res);
  };

  const handleAnalysisResult = (res) => {
    if (res.error) {
      setErrorMsg(res.error);
      setParsedResult(null);
    } else {
      setParsedResult(res);
      if (res.participants && res.participants.length > 0) {
        // Auto-select speaker with highest message count or non-user
        const sorted = [...res.participants].sort((a, b) => {
          const countA = res.messages.filter(m => m.sender === a).length;
          const countB = res.messages.filter(m => m.sender === b).length;
          return countB - countA;
        });
        const buntySpeaker = sorted.find(p => p.toLowerCase().includes('bunty'));
        const nonDotSpeaker = sorted.find(p => p.trim() !== '.' && p.trim().toLowerCase() !== 'you');
        setSelectedSpeaker(buntySpeaker || nonDotSpeaker || sorted[0]);
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
      ageGroup: customAgeGroup,
      customFacts: customDescription,
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
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
            Upload File / Folder / ZIP
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

        {/* Tab 1: File / Folder / ZIP Upload */}
        {activeTab === 'upload' && (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ border: '2px dashed var(--border-glass-highlight)', borderRadius: 16, padding: 24, textAlign: 'center', background: 'rgba(30, 41, 59, 0.3)', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 10 }}>
              <Upload size={32} color="var(--accent-cyan)" />
              <FileArchive size={32} color="var(--accent-purple)" />
              <Folder size={32} color="var(--accent-emerald)" />
            </div>
            
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
              {isProcessing ? 'Processing chat data...' : 'Drop your WhatsApp Export File, ZIP, or Folder here'}
            </div>
            
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Supports WhatsApp ZIP Archives, WhatsApp Export Folders (`WhatsApp Chat with Bunty`), `.txt`, `.json`, or raw transcripts.
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label className="btn-primary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                📁 Select File or ZIP Archive
                <input type="file" accept=".txt,.json,.zip" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                📂 Select WhatsApp Folder
                <input 
                  type="file" 
                  webkitdirectory="true" 
                  directory="true" 
                  onChange={handleFolderUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Text */}
        {activeTab === 'paste' && (
          <div style={{ marginBottom: 20 }}>
            <textarea 
              className="form-textarea" 
              rows="5" 
              placeholder={`Paste chat export lines here, e.g.:\n15/09/24, 10:15 - Bunty: deadass bro? 💀\n15/09/24, 10:16 - You: What are you doing?\n15/09/24, 10:17 - Bunty: lmao nothing much`}
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

        {/* Parsed Result Step: Select Target Speaker + Define Age & Personality */}
        {parsedResult && parsedResult.success && (
          <div style={{ padding: 18, borderRadius: 14, background: 'rgba(0, 242, 254, 0.08)', border: '1px solid var(--border-glass-highlight)', marginTop: 16 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={18} /> Analysis Complete: Found {parsedResult.totalMessages} Messages across {parsedResult.participants.length} People!
            </h4>

            {/* 1. Participant Selector */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>1. Select which person from this file should be the AI Bot:</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                {parsedResult.participants.map(p => {
                  const msgCount = parsedResult.messages.filter(m => m.sender === p).length;
                  const isSel = selectedSpeaker === p;
                  return (
                    <button 
                      key={p} 
                      className={`btn-secondary ${isSel ? 'btn-primary' : ''}`}
                      onClick={() => setSelectedSpeaker(p)}
                      style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <User size={14} /> {p} <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({msgCount} msgs)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Age / Demographic Category */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>2. Age / Demographic Group:</label>
              <select 
                className="form-input" 
                value={customAgeGroup} 
                onChange={(e) => setCustomAgeGroup(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              >
                <option value="Gen-Z / Youth Texting (13-24)">Gen-Z / Youth Texting (13-24)</option>
                <option value="Millennial / Young Adult (25-35)">Millennial / Young Adult (25-35)</option>
                <option value="Adult / Formal Communicator (36+)">Adult / Formal Communicator (36+)</option>
              </select>
            </div>

            {/* 3. Personality & Tone Description */}
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>3. Personality & Style Description (Custom Notes):</label>
              <textarea 
                className="form-textarea" 
                rows="2" 
                placeholder="Describe how they talk, e.g. 'Uses 🥲 a lot, talks in short Hinglish lines, very chill'"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={handleCreatePersona} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px' }}>
                <Sparkles size={16} /> Generate {selectedSpeaker || 'Virtual'} Replica Bot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
