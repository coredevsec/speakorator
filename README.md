# SpeakOrator - Read & Recite

A reading coach that highlights each word as you speak it. Voice-typing + voice-following teleprompter.

**Live:** https://speakorator.vercel.app | **Stack:** TypeScript 92%, Next.js, Web Speech API

### What it Does
1. **Read Mode:** Paste script -> app follows your voice and highlights where you are (teleprompter that listens)
2. **Voice Typing:** Speak and it types for you

> Never lose your place during speeches, YouTube scripts, sermons, or project defense.

### Who It's For
- Content creators reading from scripts
- Students: project defense / presentations  
- Pastors, MCs, Public speakers
- Founders pitching

### How It Works
- Web Speech API (real-time interim results)
- Custom word-alignment logic with fuzzy matching
- TypeScript + React + Vercel

### Status
🚧 Active Development: Improving voice-to-text alignment accuracy for long scripts. The indicator works, but getting word-perfect sync is hard - working on better timestamp matching.

### Local Dev
```bash
git clone https://github.com/coredevsec/speakorator
cd speakorator
npm i
npm run dev
