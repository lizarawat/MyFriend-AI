import React, { useState } from 'react';
import { Search, Plus, Key, Users, Sparkles, MessageSquare, Bot } from 'lucide-react';

export default function Sidebar({ 
  personas, 
  activePersonaId, 
  onSelectPersona, 
  onOpenImport, 
  onOpenApiKey,
  onOpenGroupChat,
  lastMessages
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersonas = personas.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.archetype && p.archetype.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      {/* Search */}
      <div className="search-box">
        <div className="search-input-wrap">
          <Search size={16} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search virtual friends or style..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="contacts-list">
        {filteredPersonas.map((persona) => {
          const isActive = persona.id === activePersonaId;
          const lastMsg = lastMessages[persona.id] || (persona.sampleMessages?.[0] || 'Tap to chat...');
          const traitTag = persona.traits?.sarcasm > 70 ? 'Sarcastic' : (persona.traits?.energy > 70 ? 'High Energy' : 'Chill');

          return (
            <div 
              key={persona.id} 
              className={`contact-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPersona(persona.id)}
            >
              <div className="avatar-wrap">
                <img src={persona.avatar} alt={persona.name} className="avatar-img" />
                <span className="status-dot status-online"></span>
              </div>

              <div className="contact-info">
                <div className="contact-top-row">
                  <span className="contact-name">{persona.name}</span>
                  <span className="contact-time">Online</span>
                </div>
                <div className="contact-preview">
                  <span className="last-msg">{lastMsg}</span>
                  <span className="trait-badge">{traitTag}</span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPersonas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            No virtual contacts found.<br />
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
