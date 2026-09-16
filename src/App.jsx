import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
import PersonaInspectorModal from './components/PersonaInspectorModal';
import DataScienceDashboardModal from './components/DataScienceDashboardModal';
import ImportModal from './components/ImportModal';
import ApiKeyModal from './components/ApiKeyModal';
import GroupChatModal from './components/GroupChatModal';

import { DEFAULT_PERSONAS } from './data/defaultPersonas';
import { generatePersonaReply } from './services/personaEngine';

export default function App() {
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
  const [isDataScienceOpen, setIsDataScienceOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);

  const [isTyping, setIsTyping] = useState(false);

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

  const lastMessages = {};
  personas.forEach(p => {
    const hist = chatHistories[p.id];
    if (hist && hist.length > 0) {
      lastMessages[p.id] = hist[hist.length - 1].text;
    } else {
      lastMessages[p.id] = p.sampleMessages?.[0] || 'Tap to chat...';
    }
  });

  const handleSendMessage = async (userText) => {
    if (!activePersona) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: userText, timestamp: timeStr };

    const updatedHistory = [...activeMessages, userMsg];
    setChatHistories(prev => ({
      ...prev,
      [activePersonaId]: updatedHistory
    }));

    setIsTyping(true);

    const delayMs = Math.min(2000, Math.max(700, (activePersona.avgWordsPerMsg || 8) * 110));
    await new Promise(r => setTimeout(r, delayMs));

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

  const handleAddPersona = (newPersona) => {
    setPersonas(prev => [newPersona, ...prev]);
    setActivePersonaId(newPersona.id);
    setChatHistories(prev => ({
      ...prev,
      [newPersona.id]: [
        { sender: 'bot', text: `Hey! I am ${newPersona.name}. My TF-IDF vector & Markov models are trained and ready!`, timestamp: 'Just now' }
      ]
    }));
  };

  const handleSavePersona = (updatedPersona) => {
    setPersonas(prev => prev.map(p => p.id === updatedPersona.id ? updatedPersona : p));
  };

  return (
    <div className="app-container">
      <Sidebar 
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={setActivePersonaId}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenGroupChat={() => setIsGroupChatOpen(true)}
        lastMessages={lastMessages}
      />

      <main className="chat-main">
        {activePersona ? (
          <>
            <ChatHeader 
              persona={activePersona} 
              onOpenInspector={() => setIsInspectorOpen(true)}
              onOpenDataScience={() => setIsDataScienceOpen(true)}
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

      {isDataScienceOpen && activePersona && (
        <DataScienceDashboardModal 
          persona={activePersona} 
          onClose={() => setIsDataScienceOpen(false)} 
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
