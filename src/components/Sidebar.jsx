import React, { useState } from 'react';
import { Search, Plus, Key, Users, Sparkles, Bot, Trash2, Eye, EyeOff, ShieldCheck, User, MessageSquare } from 'lucide-react';

export default function Sidebar({ 
  personas, 
  activePersonaId, 
  onSelectPersona, 
  onDeletePersona,
  onToggleHidePersona,
  onOpenImport, 
  onOpenApiKey,
  onOpenGroupChat,
  onOpenAuth,
  currentUser,
  lastMessages
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'hinglish' | 'english'

  const hiddenCount = personas.filter(p => p.hidden).length;

  const filteredPersonas = personas.filter(p => {
    if (!showHidden && p.hidden) return false;

    if (filterType === 'hinglish') {
      const isH = p.name.toLowerCase().includes('bunty') || (p.detectedLanguage && p.detectedLanguage.toLowerCase().includes('hinglish'));
      if (!isH) return false;
    } else if (filterType === 'english') {
      const isH = p.name.toLowerCase().includes('bunty') || (p.detectedLanguage && p.detectedLanguage.toLowerCase().includes('hinglish'));
      if (isH) return false;
    }

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.archetype && p.archetype.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleDelete = (e, persona) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${persona.name}? This will remove all learned chat data.`)) {
      onDeletePersona(persona.id);
    }
  };

  const handleHideToggle = (e, persona) => {
    e.stopPropagation();
    onToggleHidePersona(persona.id);
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000'
          }}>
            <Bot size={20} />
          </div>
          <div>
            <span className="gradient-text">MyFriend AI</span>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>Virtual Person Replica Suite</div>
          </div>
        </div>

        <div className="sidebar-actions">
          {/* User Account Button with 2FA Badge */}
          {currentUser ? (
            <button className="user-account-badge" onClick={onOpenAuth} title="Account & 2FA Status">
              <ShieldCheck size={13} />
              <span>{currentUser.name.split(' ')[0]} (2FA)</span>
            </button>
          ) : (
            <button 
              className="user-account-badge" 
              onClick={onOpenAuth} 
              title="Create Account with 2FA"
              style={{ background: 'rgba(0, 242, 254, 0.1)', borderColor: 'rgba(0, 242, 254, 0.3)', color: 'var(--accent-cyan)' }}
            >
              <User size={13} />
              <span>Sign In / 2FA</span>
            </button>
          )}

          <button className="icon-btn" onClick={onOpenImport} title="Analyze New Chat / Add Friend">
            <Plus size={18} />
          </button>
          <button className="icon-btn" onClick={onOpenGroupChat} title="Group Chat Mode">
            <Users size={18} />
          </button>
          <button className="icon-btn" onClick={onOpenApiKey} title="API Key Settings">
            <Key size={18} />
          </button>
        </div>
      </div>

      {/* Messages Header & Tab Pills at Top */}
      <div className="sidebar-messages-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={15} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.05em', color: '#e2e8f0', textTransform: 'uppercase' }}>
            Messages
          </span>
          <span style={{
            fontSize: '0.68rem',
            padding: '1px 6px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted)',
            fontWeight: 700
          }}>
            {filteredPersonas.length}
          </span>
        </div>

        {hiddenCount > 0 && (
          <button 
            onClick={() => setShowHidden(!showHidden)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {showHidden ? <EyeOff size={12} /> : <Eye size={12} />}
            {showHidden ? 'Hide Hidden' : `Hidden (${hiddenCount})`}
          </button>
        )}
      </div>

      {/* Quick Filter Pills */}
      <div className="sidebar-tab-pills">
        <button className={`tab-pill ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
          All Chats
        </button>
        <button className={`tab-pill ${filterType === 'hinglish' ? 'active' : ''}`} onClick={() => setFilterType('hinglish')}>
          Hinglish Vibes 🥲
        </button>
        <button className={`tab-pill ${filterType === 'english' ? 'active' : ''}`} onClick={() => setFilterType('english')}>
          English
        </button>
      </div>

      {/* Search */}
      <div className="search-box">
        <div className="search-input-wrap">
          <Search size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search virtual friends or personality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts / Messages List */}
      <div className="contacts-list">
        {filteredPersonas.map((persona) => {
          const isActive = persona.id === activePersonaId;
          const lastMsg = lastMessages[persona.id] || (persona.sampleMessages?.[0] || 'Tap to chat...');
          const isHinglish = persona.name.toLowerCase().includes('bunty') || (persona.detectedLanguage && persona.detectedLanguage.toLowerCase().includes('hinglish'));
          const traitTag = isHinglish ? 'Hinglish' : (persona.traits?.sarcasm > 70 ? 'Sarcastic' : (persona.traits?.energy > 70 ? 'High Energy' : 'Chill'));

          return (
            <div 
              key={persona.id} 
              className={`contact-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPersona(persona.id)}
              style={{ opacity: persona.hidden ? 0.6 : 1 }}
            >
              <div className="avatar-wrap">
                <img src={persona.avatar} alt={persona.name} className="avatar-img" />
                <span className="status-dot status-online"></span>
              </div>

              <div className="contact-info">
                <div className="contact-top-row">
                  <span className="contact-name">{persona.name} {persona.hidden ? '(Hidden)' : ''}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="trait-badge">{traitTag}</span>
                    <div style={{ display: 'flex', gap: 3 }} className="contact-actions">
                      <button 
                        className="icon-btn" 
                        onClick={(e) => handleHideToggle(e, persona)} 
                        title={persona.hidden ? "Unhide Person" : "Hide Person"}
                        style={{ width: 22, height: 22, border: 'none' }}
                      >
                        {persona.hidden ? <Eye size={12} color="var(--accent-cyan)" /> : <EyeOff size={12} />}
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={(e) => handleDelete(e, persona)} 
                        title="Delete Person"
                        style={{ width: 22, height: 22, border: 'none' }}
                      >
                        <Trash2 size={12} color="#fca5a5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="contact-preview">
                  <span className="last-msg">{lastMsg}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', flexShrink: 0 }}>Active</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPersonas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No virtual contacts found in this filter.<br />
            Click <strong>+</strong> above to analyze a chat log!
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: 14, borderTop: '1px solid var(--border-glass)' }}>
        <button 
          className="btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.875rem' }}
          onClick={onOpenImport}
        >
          <Sparkles size={16} />
          Import & Analyze Chat Log
        </button>
      </div>
    </aside>
  );
}
