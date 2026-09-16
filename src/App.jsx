import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
import PersonaInspectorModal from './components/PersonaInspectorModal';
import ImportModal from './components/ImportModal';
import ApiKeyModal from './components/ApiKeyModal';
import GroupChatModal from './components/GroupChatModal';

import { DEFAULT_PERSONAS } from './data/defaultPersonas';
import { generatePersonaReply } from './services/personaEngine';

export default function App() {
  // Local storage initializations
  const [personas, setPersonas] = useState(() => {
    const saved = localStorage.getItem('persona_echo_personas');
    return saved ? JSON.parse(saved) : DEFAULT_PERSONAS;
  });

  const [activePersonaId, setActivePersonaId] = useState(() => {
    return personas[0]?.id || 'alex-sarcastic';
  });

  const [chatHistories, setChatHistories] = useState(() => {
    const saved = localStorage.getItem('persona_echo_histories');
    if (saved) return JSON.parse(saved);
    
    // Default initial message histories per default persona
    return {
      'alex-sarcastic': [
        { sender: 'bot', text: 'yo what\'s up? deadass chilling 💀', timestamp: '10:15 AM' }
      ],
      'sarah-tech': [
        { sender: 'bot', text: 'Hey!! Super hyped for what we are building today! 🚀', timestamp: '10:20 AM' }
      ],
      'leo-gamer': [
        { sender: 'bot', text: 'bet bro hopping on Discord now 🎮', timestamp: '10:22 AM' }
      ]
    };
  });

  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('persona_echo_gemini_key') || '';
  });

  // Modal Visibility States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);

  const [isTyping, setIsTyping] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('persona_echo_personas', JSON.stringify(personas));
  }, [personas]);

  useEffect(() => {
    localStorage.setItem('persona_echo_histories', JSON.stringify(chatHistories));
  }, [chatHistories]);

  useEffect(() => {
    localStorage.setItem('persona_echo_gemini_key', apiKey);
  }, [apiKey]);

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];
  const activeMessages = chatHistories[activePersonaId] || [];

  // Compute Last Messages map for Sidebar
  const lastMessages = {};
  personas.forEach(p => {
    const hist = chatHistories[p.id];
    if (hist && hist.length > 0) {
      lastMessages[p.id] = hist[hist.length - 1].text;
    } else {
      lastMessages[p.id] = p.sampleMessages?.[0] || 'Tap to chat...';
    }
  });

  // Handle Sending a Message
  const handleSendMessage = async (userText) => {
    if (!activePersona) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: userText, timestamp: timeStr };

    // Update history with User message
    const updatedHistory = [...activeMessages, userMsg];
    setChatHistories(prev => ({
      ...prev,
      [activePersonaId]: updatedHistory
    }));

    setIsTyping(true);

    // Simulate natural typing delay based on persona words per message
    const delayMs = Math.min(2200, Math.max(800, (activePersona.avgWordsPerMsg || 8) * 120));
    await new Promise(r => setTimeout(r, delayMs));

    // Generate persona reply
    const replyText = await generatePersonaReply({
      persona: activePersona,
      conversationHistory: updatedHistory,
      userMessage: userText,
      apiKey
    });

    const botMsg = { sender: 'bot', text: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

    setChatHistories(prev => ({
      ...prev,
      [activePersonaId]: [...prev[activePersonaId], botMsg]
    }));

    setIsTyping(false);
  };

  // Add new persona from Chat Uploader
  const handleAddPersona = (newPersona) => {
    setPersonas(prev => [newPersona, ...prev]);
    setActivePersonaId(newPersona.id);
    setChatHistories(prev => ({
      ...prev,
      [newPersona.id]: [
        { sender: 'bot', text: `Hey! I am ${newPersona.name}. I've analyzed our chats and I'm ready to talk!`, timestamp: 'Just now' }
      ]
    }));
  };

  // Save updated persona tuning from Inspector
  const handleSavePersona = (updatedPersona) => {
    setPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
  };

  return (
    <div className="app-container">
      {/* Sidebar (WhatsApp-style contact list) */}
      <Sidebar 
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={setActivePersonaId}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenGroupChat={() => setIsGroupChatOpen(true)}
        lastMessages={lastMessages}
      />

      {/* Active Chat Area */}
      <main className="chat-main">
        {activePersona ? (
          <>
            <ChatHeader 
              persona={activePersona} 
              onOpenInspector={() => setIsInspectorOpen(true)}
              apiKey={apiKey}
            />
            <MessageArea 
              messages={activeMessages} 
              isTyping={isTyping} 
              persona={activePersona}
            />
            <ChatInput 
              onSendMessage={handleSendMessage} 
              persona={activePersona}
              disabled={isTyping}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
            Select a contact from the left sidebar to start chatting!
          </div>
        )}
      </main>

      {/* Modals */}
      {isImportOpen && (
        <ImportModal 
          onAddPersona={handleAddPersona} 
          onClose={() => setIsImportOpen(false)} 
        />
      )}

      {isInspectorOpen && activePersona && (
        <PersonaInspectorModal 
          persona={activePersona} 
          onSavePersona={handleSavePersona} 
          onClose={() => setIsInspectorOpen(false)} 
        />
      )}

      {isApiKeyOpen && (
        <ApiKeyModal 
          apiKey={apiKey} 
          onSaveApiKey={setApiKey} 
          onClose={() => setIsApiKeyOpen(false)} 
        />
      )}

      {isGroupChatOpen && (
        <GroupChatModal 
          personas={personas} 
          apiKey={apiKey} 
          onClose={() => setIsGroupChatOpen(false)} 
        />
      )}
    </div>
  );
}
