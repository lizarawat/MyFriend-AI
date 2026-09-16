import React, { useState } from 'react';
import { Send, Mic, Sparkles, Smile } from 'lucide-react';

export default function ChatInput({ onSendMessage, persona, disabled }) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text);
    setText('');
  };

  const handleQuickPrompt = (promptText) => {
    if (disabled) return;
    onSendMessage(promptText);
  };

  // Web Speech API for Mic Dictation
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

  const quickPrompts = [
    "What are you up to right now?",
    "Tell me a story or secret!",
    "Give me your honest opinion on pizza",
    "How was your day going?"
  ];

  return (
    <div className="chat-input-bar">
      {/* Quick Prompt Chips */}
      <div className="quick-prompts">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={12} color="var(--accent-cyan)" /> Try asking:
        </span>
        {quickPrompts.map((prompt, idx) => (
          <button 
            key={idx} 
            className="prompt-chip" 
            onClick={() => handleQuickPrompt(prompt)}
            disabled={disabled}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <form onSubmit={handleSubmit} className="input-controls">
        <button 
          type="button" 
          className={`icon-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleMic}
          title={isListening ? "Listening..." : "Voice Dictation"}
          style={{ color: isListening ? 'var(--accent-pink)' : 'var(--text-muted)' }}
        >
          <Mic size={18} />
        </button>

        <input 
          type="text" 
          className="chat-input-field" 
          placeholder={`Message ${persona?.name || 'virtual friend'}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />

        <button type="submit" className="send-btn" disabled={!text.trim() || disabled}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
