# Orator / SpeakOrator - Speak More Clearly. Feel More Ready.

> Orator helps you read aloud, track your pace, and build confidence one word at a time.

**Live:** https://speakorator.vercel.app
**Repo:** https://github.com/coredevsec/speakorator

### What is Orator?
A public speaking practice platform that listens to you read and follows along in real-time.

It's built for anyone who needs to speak with confidence - students defending projects, YouTubers reading scripts, pastors, founders pitching, and people improving their English.

### Core Features

**1. Speaking Practice - Real-time Word Tracking**
- Paste any article, speech, or passage
- Or choose a sample: Public speaking, A morning walk, Learning something new, The power of listening, A brighter neighborhood
- Click "Start reading" and read aloud
- LIVE indicator follows your voice, highlights the current word as you speak
- Designed to train pacing, filler words, and rhythm

**2. Voice Typing (Dictation)**
- Premium tool: Open a blank dictation page
- Speak naturally - your words appear as they are recognized
- Save dictation directly to Library

**3. Your Library**
- Keep passages close for your next session
- Saves date, word count (e.g., 76 words), and full text
- Delete / manage saved passages

**4. Multi-Language & Accent Support**
- English (US, UK, Australia, Canada, India)
- Spanish (Spain, Mexico)
- French, German, Portuguese (Brazil) and more
- Perfect for accent training and ESL speakers

**5. Premium Tools - Orator Plus**
- **Save passage:** Keep it in your library for later (OFF/ON)
- **Voice typing:** Blank dictation page
- **Sentence focus:** ON - Show one sentence at a time for focused practice

**6. Reading Colors & Customization**
- Adjust reading background (Canvas)
- Adjust highlight color (Active word)
- Live preview - "Find your steady voice, one word at a time"
- Save appearance - choices apply instantly to reading screen

**7. User System**
- Sign In / Sign Up
- Menu: Practice, Voice typing, Library, Settings, Membership, Sign out

### Premium - Orator Plus Membership

Premium unlocks Save passage, Voice typing, Sentence focus and advanced coaching. Implemented with **Flutterwave** - currently in **Test Mode**.

#### How to Test Premium (No Real Payment)

Use any Flutterwave test card at the Membership checkout:

**Recommended - Visa:**

Card: 4242424242424242
CVV: 812
Expiry: 09/31
PIN: 3310
OTP: 12345


**Mastercard:**

Card: 5531886652142950
CVV: 564
Expiry: 09/32
PIN: 3310
OTP: 12345


**Visa 3DS:**

Card: 4187427415564246
CVV: 828
Expiry: 09/32
PIN: 3310
OTP: 12345


Steps: Practice -> Membership / Orator Plus -> Enter test card -> Enter OTP `12345` -> Premium unlocked. No real charge.

### Tech Stack
- **TypeScript 92.2%**, CSS 2.8%, PLpgSQL 2.6%, Python 1.4%
- Next.js / React
- Web Speech API for real-time speech recognition
- Supabase / Postgres for Library & Auth
- Flutterwave Standard for payments (Test Mode)
- Tailwind CSS
- Hosted on Vercel (GitHub -> Vercel CI/CD)

### Why This Project?
- Free mic practice, anytime
- Real-time word tracking
- Clear pacing and filler feedback
- Designed for public speaking practice

Most teleprompters just scroll. Orator listens and grows your confidence.

### Local Development

```bash
git clone https://github.com/coredevsec/speakorator.git
cd speakorator
npm i
npm run dev

---

Built by https://github.com/coredevsec | CS Year 2, UoPeople | Lagos, NG (GMT+1) | Building in public

Open to Paid Remote Internships: Product Engineer / AI Speech Engineer / Full-stack (TypeScript + AI + Payments)
