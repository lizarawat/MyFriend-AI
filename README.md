# MyFriend AI 🤖💬

**MyFriend AI** is an interactive web application that analyzes chat logs from user conversations with friends or people (from WhatsApp, Telegram, Discord, or text exports), creates a digital personality replica profile, and lets users chat with an AI bot that speaks, thinks, and reacts just like that person!

---

## ✨ Features

- 📱 **WhatsApp-Style Multi-Contact Suite**: Manage a contact list of multiple virtual friends, switch between them seamlessly, and see online/style badges.
- 📊 **Chat Log Parser & Tone Analyzer**: Supports WhatsApp export (`.txt`), Telegram (`.json`), Discord, and raw transcript text. Analyzes tone metrics (Sarcasm, Energy, Formality), top used words, signature emojis, and catchphrases.
- ⚡ **Dual AI Replica Engine**:
  - **Offline Heuristic Replica Engine**: Zero configuration required! Generates replies adhering to the friend's slang, emojis, sample sentences, and tone.
  - **Google Gemini LLM Integration**: Optional setting to enter your Gemini API Key for deep LLM reasoning.
- 🎛️ **Persona Brain Inspector**: Tune personality sliders (Sarcasm, Energy, Formality) and add custom memory/knowledge rules (e.g., *"Alex hates pineapples"*).
- 🎙️ **Voice Messages & Speech Dictation**: Listen to bot replies spoken aloud via Text-to-Speech (TTS) with pitch/rate customized to the persona, and use Voice Dictation (STT) to send messages.
- 👥 **Multi-Persona Group Chat ("The Squad")**: Simulate group conversations with multiple virtual friends responding in turn.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack
- **Frontend Framework**: React + Vite
- **Styling**: Vanilla CSS (Dark Glassmorphism UI System)
- **Icons**: Lucide React
- **Audio & Speech**: Web Speech API (TTS & STT)
