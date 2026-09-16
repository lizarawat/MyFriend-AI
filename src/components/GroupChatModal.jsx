import React, { useState } from 'react';
import { X, Users, Send, Sparkles, Bot } from 'lucide-react';
import { generatePersonaReply } from '../services/personaEngine';

export default function GroupChatModal({ personas, apiKey, onClose }) {
  const [messages, setMessages] = useState([
    { sender: 'system', text: 'Group Chat "The Squad" initialized with multiple virtual personas!' },
    { sender: personas[0]?.name || 'Alex', text: 'yo squad what are we doing today? 💀', avatar: personas[0]?.avatar },
    { sender: personas[1]?.name || 'Sarah', text: 'Hey guys! Super hyped for the weekend! 🚀', avatar: personas[1]?.avatar }
  ]);
  const [userText, setUserText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSendGroup = async (e) => {
    e.preventDefault();
    if (!userText.trim() || isSimulating) return;

    const newMsg = { sender: 'You', text: userText };
    setMessages(prev => [...prev, newMsg]);
    setUserText('');
    setIsSimulating(true);

    // Simulate reactions from each persona sequentially
    for (let i = 0; i < Math.min(personas.length, 3); i++) {
      const p = personas[i];
      await new Promise(r => setTimeout(r, 1200));

      const replyText = await generatePersonaReply({
        persona: p,
        conversationHistory: [],
        userMessage: userText,
        apiKey
      });

      setMessages(prev => [
        ...prev,
        { sender: p.name, text: replyText, avatar: p.avatar }
      ]);
    }

    setIsSimulating(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} color="var(--accent-purple)" />
            <span className="modal-title">Multi-Persona Group Chat ("The Squad")</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Group Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, idx) => {
            if (m.sender === 'system') {
              return (
                <div key={idx} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', padding: 6 }}>
                  {m.text}
                </div>
              );
            }

            const isUser = m.sender === 'You';

            return (
              <div key={idx} style={{ display: 'flex', gap: 10, alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {!isUser && (
                  <img src={m.avatar} alt={m.sender} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <div>
                  {!isUser && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 2 }}>{m.sender}</div>}
                  <div className="message-bubble" style={{ background: isUser ? 'var(--user-bubble-bg)' : 'var(--bot-bubble-bg)' }}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          {isSimulating && (
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontStyle: 'italic' }}>
              Personas are discussing and replying...
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendGroup} className="input-controls" style={{ marginTop: 10 }}>
          <input 
            type="text" 
            className="chat-input-field" 
            placeholder="Talk to the group..." 
            value={userText} 
            onChange={(e) => setUserText(e.target.value)}
            disabled={isSimulating}
          />
          <button type="submit" className="send-btn" disabled={!userText.trim() || isSimulating}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
