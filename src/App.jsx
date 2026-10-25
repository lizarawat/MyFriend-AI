import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageArea from './components/MessageArea';
import ChatInput from './components/ChatInput';
import TeacherCoachPanel from './components/TeacherCoachPanel';
import PersonaInspectorModal from './components/PersonaInspectorModal';
import DataScienceDashboardModal from './components/DataScienceDashboardModal';
import ImportModal from './components/ImportModal';
import ApiKeyModal from './components/ApiKeyModal';
import GroupChatModal from './components/GroupChatModal';
import AuthModal from './components/AuthModal';

import { DEFAULT_PERSONAS } from './data/defaultPersonas';
import { generatePersonaReply } from './services/personaEngine';

export default function App() {
  const [personas, setPersonas] = useState(() => {
    try {
      const saved = localStorage.getItem('persona_echo_personas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const uniqueMap = new Map();
          parsed.forEach(p => {
            if (p && typeof p === 'object') {
              const key = (p.name || p.id || '').toLowerCase().trim();
              if (key && !uniqueMap.has(key)) {
                uniqueMap.set(key, p);
              }
            }
          });
          if (uniqueMap.size > 0) return Array.from(uniqueMap.values());
        }
      }
    } catch (e) {
      console.warn("Using default personas due to cache error:", e);
    }
    return DEFAULT_PERSONAS;
  });

  const [activePersonaId, setActivePersonaId] = useState(() => {
    return 'bunty-hinglish';
  });

  const [chatHistories, setChatHistories] = useState(() => {
    try {
      const saved = localStorage.getItem('persona_echo_histories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Using default histories due to cache error:", e);
    }
    
    return {
      'bunty-hinglish': [
        { sender: 'bot', text: 'kuch nhi bhai chill karra tu bata 🥲', timestamp: '10:15 AM' }
      ],
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
    try {
      return localStorage.getItem('persona_echo_gemini_key') || '';
    } catch (e) {
      return '';
    }
  });

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('persona_echo_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Modal & Panel Visibility States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isDataScienceOpen, setIsDataScienceOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
  const [isGroupChatOpen, setIsGroupChatOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);

  const [typingStatus, setTypingStatus] = useState(null); // null | 'thinking' | 'typing'
  const isTyping = Boolean(typingStatus);

  useEffect(() => {
    try {
      localStorage.setItem('persona_echo_personas', JSON.stringify(personas));
    } catch (e) {}
  }, [personas]);

  useEffect(() => {
    try {
      localStorage.setItem('persona_echo_histories', JSON.stringify(chatHistories));
    } catch (e) {}
  }, [chatHistories]);

  useEffect(() => {
    try {
      localStorage.setItem('persona_echo_gemini_key', apiKey);
    } catch (e) {}
  }, [apiKey]);

  const validPersonas = Array.isArray(personas) && personas.length > 0 ? personas : DEFAULT_PERSONAS;
  const activePersona = validPersonas.find(p => p && p.id === activePersonaId) || 
                        validPersonas.find(p => p && !p.hidden) || 
                        validPersonas[0];
  const activeMessages = (chatHistories && Array.isArray(chatHistories[activePersonaId])) ? chatHistories[activePersonaId] : [];

  // Find the last user message and last bot message for the Teacher box
  const userMessages = activeMessages.filter(m => m && m.sender === 'user');
  const botMessages = activeMessages.filter(m => m && m.sender === 'bot');
  const lastUserMsgText = userMessages.length > 0 ? (userMessages[userMessages.length - 1]?.text || '') : '';
  const lastBotMsgText = botMessages.length > 0 ? (botMessages[botMessages.length - 1]?.text || '') : '';

  const lastMessages = {};
  validPersonas.forEach(p => {
    if (!p || !p.id) return;
    const hist = chatHistories ? chatHistories[p.id] : null;
    if (Array.isArray(hist) && hist.length > 0) {
      const last = hist[hist.length - 1];
      lastMessages[p.id] = (last && typeof last === 'object' && last.text) ? last.text : (typeof last === 'string' ? last : 'Tap to chat...');
    } else {
      lastMessages[p.id] = (p.sampleMessages && p.sampleMessages[0]) || 'Tap to chat...';
    }
  });

  const handleSendMessage = async (userText) => {
    if (!activePersona || !userText || !userText.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: userText.trim(), timestamp: timeStr };

    const updatedHistory = [...activeMessages, userMsg];
    setChatHistories(prev => ({
      ...prev,
      [activePersonaId]: updatedHistory
    }));

    // Step 1: Human reading & thinking comprehension pause
    setTypingStatus('thinking');
    const thinkingDelay = Math.floor(Math.random() * 500) + 1200; // 1.2s to 1.7s
    await new Promise(r => setTimeout(r, thinkingDelay));

    // Step 2: Generate response bursts (1-3 messages)
    let replyBursts = [];
    try {
      const result = await generatePersonaReply({
        persona: activePersona,
        conversationHistory: updatedHistory,
        userMessage: userText.trim(),
        apiKey
      });
      replyBursts = Array.isArray(result) ? result : [result];
    } catch (err) {
      console.error("Error generating reply:", err);
      replyBursts = ["haa bilkul 🥲"];
    }

    if (!replyBursts || replyBursts.length === 0) {
      replyBursts = ["haa bilkul 🥲"];
    }

    // Step 3: Sequentially deliver each burst with human typing cadence
    for (let i = 0; i < replyBursts.length; i++) {
      const burstText = replyBursts[i];
      if (!burstText || !burstText.trim()) continue;

      setTypingStatus('typing');

      // Typing duration proportional to length of the burst
      const wordCount = burstText.trim().split(/\s+/).length;
      const burstTypingDelay = Math.min(1500, Math.max(700, wordCount * 90));
      await new Promise(r => setTimeout(r, burstTypingDelay));

      const botTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const botMsg = {
        sender: 'bot',
        text: burstText.trim(),
        timestamp: botTimeStr
      };

      setChatHistories(prev => {
        const currentHist = prev[activePersonaId] || [];
        return {
          ...prev,
          [activePersonaId]: [...currentHist, botMsg]
        };
      });

      // Natural pause between sequential bubbles (400ms - 550ms)
      if (i < replyBursts.length - 1) {
        setTypingStatus(null);
        await new Promise(r => setTimeout(r, 450));
      }
    }

    setTypingStatus(null);
  };

  // Instant Learning / Teacher Mode Handler
  const handleTeachPersona = ({ trigger, idealResponse, behaviorRule, replaceLast }) => {
    if (!activePersona) return;

    // 1. Add dialogue pair to persona.chatPairs
    const newPair = { prompt: trigger, response: idealResponse };
    const updatedPairs = [newPair, ...(activePersona.chatPairs || [])];

    // 2. Add rule to persona.learnedRules
    const updatedRules = behaviorRule
      ? [behaviorRule, ...(activePersona.learnedRules || [])]
      : (activePersona.learnedRules || []);

    // 3. Update persona in state & storage
    const updatedPersona = {
      ...activePersona,
      chatPairs: updatedPairs,
      learnedRules: updatedRules
    };

    setPersonas(prev => prev.map(p => p.id === activePersona.id ? updatedPersona : p));

    // 4. Optionally replace the last bot message in the chat history
    if (replaceLast) {
      setChatHistories(prev => {
        const hist = [...(prev[activePersona.id] || [])];
        for (let i = hist.length - 1; i >= 0; i--) {
          if (hist[i].sender === 'bot') {
            hist[i] = {
              ...hist[i],
              text: idealResponse
            };
            break;
          }
        }
        return {
          ...prev,
          [activePersona.id]: hist
        };
      });
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('persona_echo_auth_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('persona_echo_auth_user');
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

  const handleDeletePersona = (idToDelete) => {
    const remaining = personas.filter(p => p.id !== idToDelete);
    setPersonas(remaining);
    
    // Clean up history
    setChatHistories(prev => {
      const copy = { ...prev };
      delete copy[idToDelete];
      return copy;
    });

    if (activePersonaId === idToDelete && remaining.length > 0) {
      setActivePersonaId(remaining[0].id);
    }
  };

  const handleToggleHidePersona = (idToToggle) => {
    setPersonas(prev => prev.map(p => {
      if (p.id === idToToggle) {
        return { ...p, hidden: !p.hidden };
      }
      return p;
    }));
  };

  return (
    <div className="app-container">
      <Sidebar 
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={setActivePersonaId}
        onDeletePersona={handleDeletePersona}
        onToggleHidePersona={handleToggleHidePersona}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenApiKey={() => setIsApiKeyOpen(true)}
        onOpenGroupChat={() => setIsGroupChatOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        lastMessages={lastMessages}
      />

      <main className="chat-main">
        {activePersona ? (
          <>
            <ChatHeader 
              persona={activePersona} 
              onOpenInspector={() => setIsInspectorOpen(true)}
              onOpenDataScience={() => setIsDataScienceOpen(true)}
              onToggleTeacher={() => setIsTeacherOpen(prev => !prev)}
              isTeacherOpen={isTeacherOpen}
              apiKey={apiKey}
              typingStatus={typingStatus}
            />

            <MessageArea 
              messages={activeMessages} 
              isTyping={isTyping} 
              typingStatus={typingStatus}
              persona={activePersona}
            />

            {/* Teacher / Live Fine-Tuning Box utilizing the bottom space */}
            <TeacherCoachPanel 
              persona={activePersona}
              lastUserMessage={lastUserMsgText}
              onTeachPersona={handleTeachPersona}
              isOpen={isTeacherOpen}
              onToggle={() => setIsTeacherOpen(prev => !prev)}
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
      {isAuthOpen && (
        <AuthModal 
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

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
