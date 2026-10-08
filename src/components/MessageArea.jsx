import React, { useEffect, useRef } from 'react';
import { Volume2, CheckCheck, Sparkles } from 'lucide-react';

export default function MessageArea({ messages, isTyping, persona }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const playTTS = (text) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = (persona?.traits?.energy > 70) ? 1.2 : (persona?.traits?.sarcasm > 70 ? 0.95 : 1.0);
    utterance.rate = (persona?.traits?.energy > 70) ? 1.1 : 0.95;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="messages-container">
      <div className="date-divider">
        <span className="date-badge">
          <Sparkles size={12} color="var(--accent-cyan)" style={{ display: 'inline', marginRight: 4 }} />
          Today • {persona?.name || 'Persona'} AI Replica Session
        </span>
      </div>

      {messages.map((msg, idx) => {
        const isUser = msg.sender === 'user';

        return (
          <div key={idx} className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
            {!isUser && <span className="sender-name-label">{persona?.name || 'Virtual Friend'}</span>}
            
            <div className="message-bubble">
              <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
              
              <div className="msg-footer">
                {!isUser && (
                  <button 
                    onClick={() => playTTS(msg.text)}
                    title="Listen to voice"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      marginRight: 'auto',
                      fontSize: '0.7rem',
                      padding: 0
                    }}
                  >
                    <Volume2 size={12} />
                    <span>Listen</span>
                  </button>
                )}

                <span>{msg.timestamp || '10:15 AM'}</span>
                {isUser && <CheckCheck size={14} color="var(--accent-cyan)" />}
              </div>
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="message-wrapper bot">
          <span className="sender-name-label">{persona?.name || 'Virtual Friend'} is typing...</span>
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
