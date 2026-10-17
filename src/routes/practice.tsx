import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  BookMarked,
  CreditCard,
  Mic,
  RotateCcw,
  Gauge,
  CheckCircle2,
  Timer,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  LockKeyhole,
  Palette,
  Sparkles,
  AlignLeft,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { SiteNavbar } from "../components/site-navbar";
import { checkSubscriptionAccess } from "../lib/subscription-access";
import {
  alignSpeechTokens,
  getSavedSpeechLanguage,
  normalizeSpeechToken,
  saveSpeechLanguage,
  SPEECH_LANGUAGES,
  type SpeechLanguage,
} from "../lib/speech-recognition";
import {
  getPresentationPreferences,
  readableTextColor,
  type PresentationPreferences,
} from "../lib/presentation-preferences";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Orator | Read Aloud, Word by Word" },
      {
        name: "description",
        content:
          "Paste an essay or article, read it aloud, and watch each word light up as you speak. Practice pacing, clarity, and confidence for public speaking.",
      },
      { property: "og:title", content: "Orator | Read Aloud, Word by Word" },
      {
        property: "og:description",
        content:
          "Paste an essay or article, read it aloud, and watch each word light up as you speak. Practice pacing, clarity, and confidence for public speaking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PracticePage,
});

// ---- Speech recognition types (not in default TS DOM lib in all setups) ----
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as
    (new () => SpeechRecognitionLike) | null;
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

type Phase = "input" | "reading" | "done";

const SAMPLE_TEXTS = [
  {
    title: "Public speaking",
    text: "Good public speaking is not a gift reserved for a lucky few. It is a skill, built one sentence at a time. When you read aloud, you train your voice to carry meaning, your breath to steady your nerves, and your ears to hear your own rhythm. Start slowly. Let each word land. Pause where the punctuation asks you to pause. In time, the page stops being a script and becomes a conversation with your audience.",
  },
  {
    title: "A morning walk",
    text: "The city feels different before the day begins. Shop windows catch the first light, and quiet streets make room for small details. A warm cup of tea waits at home, but there is no need to hurry. For a few minutes, the morning belongs to everyone who is awake enough to notice it.",
  },
  {
    title: "Learning something new",
    text: "Learning takes patience. The first attempt may feel awkward, and the second may not be much better. Still, every small effort builds on the one before it. Ask questions, notice what has changed, and give yourself time to improve. Progress is often easier to see when you look back.",
  },
  {
    title: "The power of listening",
    text: "Good conversations begin with attention. Listening carefully shows respect, but it also helps us understand what someone means beyond the words they choose. Leave a little space before you respond. In that pause, a conversation can become more thoughtful, more honest, and more useful to everyone involved.",
  },
  {
    title: "A brighter neighborhood",
    text: "A welcoming neighborhood is built through everyday choices. Neighbors share tools, greet one another, and look out for people who may need a hand. These gestures are small, but they add up. When people feel seen and included, familiar streets begin to feel like a community.",
  },
];

type SavedPractice = {
  id: string;
  title: string;
  text: string;
  savedAt: string;
};

const SAVED_PRACTICES_KEY = "orator.saved-practices";
const PRACTICE_DRAFT_KEY = "orator.practice-draft";
const PRACTICE_TOOLS_KEY = "orator.practice-tools.";

type PracticeToolPreferences = {
  savePassageOnStart: boolean;
  voiceTypingEnabled: boolean;
  oneSentenceAtATime: boolean;
};

function PracticePage() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<"checking" | "authenticated">("checking");
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [membershipError, setMembershipError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [presentationPreferences, setPresentationPreferences] = useState<PresentationPreferences>(
    getPresentationPreferences(""),
  );
  const [phase, setPhase] = useState<Phase>("input");
  const [text, setText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const normalized = useMemo(() => words.map(normalizeSpeechToken), [words]);
  const [speechLanguage, setSpeechLanguage] = useState<SpeechLanguage>("en-US");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [spokenCount, setSpokenCount] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [fontSize, setFontSize] = useState(34);
  const [supported, setSupported] = useState(false);
  const [selectedSample, setSelectedSample] = useState("");
  const [oneSentenceAtATime, setOneSentenceAtATime] = useState(false);
  const [savePassageOnStart, setSavePassageOnStart] = useState(false);
  const [voiceTypingEnabled, setVoiceTypingEnabled] = useState(false);
  const [settingsUserId, setSettingsUserId] = useState("");
  const [savedText, setSavedText] = useState("");
  const [controlsVisible, setControlsVisible] = useState(true);

  const sentenceForWord = useMemo(() => {
    let sentence = 0;
    return words.map((word) => {
      const wordSentence = sentence;
      if (/[.!?]["')\]]*$/.test(word)) sentence += 1;
      return wordSentence;
    });
  }, [words]);
  const previewIdx = useMemo(() => {
    const heard = splitWords(interim).map(normalizeSpeechToken);
    return alignSpeechTokens(normalized, heard, currentIdx);
  }, [currentIdx, interim, normalized]);
  const visibleIdx = Math.min(Math.max(currentIdx, previewIdx), normalized.length);
  const activeSentence = sentenceForWord[Math.min(visibleIdx, Math.max(words.length - 1, 0))] ?? 0;

  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const cursorRef = useRef(0);
  const normalizedWordsRef = useRef<string[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const wantListeningRef = useRef(false);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const recognitionRestartRef = useRef<number | null>(null);
  const recognitionRestartAttemptsRef = useRef(0);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      void navigate({ to: "/sign-in", replace: true });
      return;
    }
    let active = true;
    const refreshMembership = async (userId: string) => {
      const access = await checkSubscriptionAccess(userId);
      if (!active) return;
      setCurrentUserId(userId);
      setPresentationPreferences(getPresentationPreferences(userId));
      setHasPaidAccess(!access.error && access.allowed);
      setMembershipError(access.error ?? "");
    };
    const loadSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (!active) return;
      if (error) {
        setSessionState("checking");
      } else if (data.session) {
        setSessionState("authenticated");
        void refreshMembership(data.session.user.id);
      } else {
        void navigate({ to: "/sign-in", replace: true });
      }
    };
    void loadSession();
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionState("authenticated");
        void refreshMembership(session.user.id);
      } else void navigate({ to: "/sign-in", replace: true });
    });
    const onFocus = () => void loadSession();
    const refreshInterval = window.setInterval(() => void loadSession(), 30_000);
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", onFocus);
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!currentUserId) return;
    let stored: Partial<PracticeToolPreferences> = {};
    try {
      const value = window.localStorage.getItem(`${PRACTICE_TOOLS_KEY}${currentUserId}`);
      if (value) stored = JSON.parse(value) as Partial<PracticeToolPreferences>;
    } catch {
      stored = {};
    }
    setSavePassageOnStart(stored.savePassageOnStart === true);
    setVoiceTypingEnabled(stored.voiceTypingEnabled === true);
    setOneSentenceAtATime(stored.oneSentenceAtATime === true);
    setSettingsUserId(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || settingsUserId !== currentUserId) return;
    const preferences: PracticeToolPreferences = {
      savePassageOnStart,
      voiceTypingEnabled,
      oneSentenceAtATime,
    };
    try {
      window.localStorage.setItem(
        `${PRACTICE_TOOLS_KEY}${currentUserId}`,
        JSON.stringify(preferences),
      );
    } catch {
      // Keep in-memory preferences available if storage is unavailable.
    }
  }, [currentUserId, oneSentenceAtATime, savePassageOnStart, settingsUserId, voiceTypingEnabled]);

  useEffect(() => {
    const client = supabase;
    if (!client || !currentUserId) return;
    let active = true;
    const refreshMembership = async () => {
      const access = await checkSubscriptionAccess(currentUserId);
      if (!active) return;
      setHasPaidAccess(!access.error && access.allowed);
      setMembershipError(access.error ?? "");
    };
    const channel = client
      .channel(`subscription-status:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${currentUserId}`,
        },
        () => void refreshMembership(),
      )
      .subscribe();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshMembership();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      void client.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    setSpeechLanguage(getSavedSpeechLanguage());
  }, []);

  useEffect(() => {
    const draft = window.sessionStorage.getItem(PRACTICE_DRAFT_KEY);
    if (draft === null) return;
    setText(draft);
    setSelectedSample("");
    window.sessionStorage.removeItem(PRACTICE_DRAFT_KEY);
  }, []);

  useEffect(() => {
    if (phase !== "reading") return;
    const id = setInterval(() => {
      if (startTimeRef.current) setElapsed((Date.now() - startTimeRef.current) / 1000);
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [currentIdx, visibleIdx]);

  const stopRecognition = useCallback(() => {
    wantListeningRef.current = false;
    if (recognitionRestartRef.current !== null) {
      window.clearTimeout(recognitionRestartRef.current);
      recognitionRestartRef.current = null;
    }
    try {
      recogRef.current?.stop();
    } catch {
      // noop
    }
    recogRef.current = null;
    setListening(false);
  }, []);

  const advanceWithTranscript = useCallback(
    (transcript: string) => {
      const heard = splitWords(transcript).map(normalizeSpeechToken);
      if (heard.length === 0) return;
      const targetWords = normalizedWordsRef.current;
      const cursor = alignSpeechTokens(targetWords, heard, cursorRef.current);
      if (cursor !== cursorRef.current) {
        if (!startTimeRef.current) startTimeRef.current = Date.now();
        cursorRef.current = cursor;
        setCurrentIdx(cursor);
        setSpokenCount(cursor);
        if (cursor >= targetWords.length && targetWords.length > 0) {
          stopRecognition();
          setPhase("done");
        }
      }
    },
    [stopRecognition],
  );

  const startRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setMicError("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    setMicError(null);
    wantListeningRef.current = true;
    recognitionRestartAttemptsRef.current = 0;
    const rec = new Ctor();
    rec.lang = speechLanguage;
    rec.continuous = true;
    rec.interimResults = true;
    const handledFinalResults = new Set<number>();
    const scheduleRestart = () => {
      if (!wantListeningRef.current || recogRef.current !== rec) return;
      if (recognitionRestartAttemptsRef.current >= 5) {
        wantListeningRef.current = false;
        recogRef.current = null;
        setListening(false);
        setMicError(
          "Speech recognition could not reconnect. Check your connection and restart the passage.",
        );
        return;
      }
      const delay = Math.min(500 * 2 ** recognitionRestartAttemptsRef.current, 8000);
      recognitionRestartAttemptsRef.current += 1;
      recognitionRestartRef.current = window.setTimeout(() => {
        recognitionRestartRef.current = null;
        if (!wantListeningRef.current || recogRef.current !== rec) return;
        handledFinalResults.clear();
        try {
          rec.start();
        } catch {
          scheduleRestart();
        }
      }, delay);
    };

    rec.onresult = (e) => {
      if (recogRef.current !== rec) return;
      recognitionRestartAttemptsRef.current = 0;
      setMicError(null);
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (!r) continue;
        if (r.isFinal) {
          if (handledFinalResults.has(i)) continue;
          handledFinalResults.add(i);
          const fillerMatches = r[0].transcript.match(/\b(?:um+|uh+)\b/gi);
          if (fillerMatches?.length) {
            setFillerCount((count) => count + fillerMatches.length);
          }
          advanceWithTranscript(r[0].transcript);
        } else {
          interimText += r[0].transcript;
        }
      }
      if (interimText) {
        setInterim(interimText.trim());
      } else {
        setInterim("");
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setMicError(
          "Microphone access was denied. Click the lock/camera icon in your browser's address bar, allow the microphone, then press Start listening again.",
        );
        wantListeningRef.current = false;
      } else if (e.error === "audio-capture") {
        setMicError(
          "No microphone could be captured. Check that a mic is connected and not in use by another app (Zoom, Meet, Teams). If you're in the preview pane, open the app in a full browser tab, or use tap-to-advance below.",
        );
        wantListeningRef.current = false;
      } else if (e.error === "no-speech") {
        // Browser speech services may end a session after silence; onend resumes it.
      } else if (e.error === "network") {
        setMicError("Speech connection interrupted. Reconnecting...");
      } else if (e.error === "aborted") {
        // Treat browser-initiated aborts as a session boundary, not a user stop.
      } else if (e.error) {
        setMicError(`Microphone error: ${e.error}. You can still practice with tap-to-advance.`);
        wantListeningRef.current = false;
      }
    };
    rec.onend = () => {
      if (wantListeningRef.current && recogRef.current === rec) {
        scheduleRestart();
        return;
      }
      if (recogRef.current === rec) recogRef.current = null;
      if (!wantListeningRef.current) setListening(false);
    };

    recogRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      wantListeningRef.current = false;
      recogRef.current = null;
      setListening(false);
      setMicError("Could not start the microphone. Please try again.");
    }
  }, [advanceWithTranscript, speechLanguage]);

  useEffect(() => () => stopRecognition(), [stopRecognition]);

  const beginReading = (content: string) => {
    const w = splitWords(content);
    if (w.length < 2) return;
    normalizedWordsRef.current = w.map(normalize);
    setWords(w);
    cursorRef.current = 0;
    setCurrentIdx(0);
    setSpokenCount(0);
    setFillerCount(0);
    setElapsed(0);
    startTimeRef.current = null;
    setText(content);
    setControlsVisible(false);
    setPhase("reading");
    startRecognition();
  };

  const reset = () => {
    stopRecognition();
    setPhase("input");
    setText("");
    setSelectedSample("");
    setWords([]);
    setInterim("");
    setMicError(null);
    setSavedText("");
  };

  const advanceManually = useCallback(() => {
    if (phase !== "reading") return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const next = Math.min(cursorRef.current + 1, normalized.length);
    cursorRef.current = next;
    setCurrentIdx(next);
    setSpokenCount(next);
    if (next >= normalized.length && normalized.length > 0) {
      stopRecognition();
      setPhase("done");
    }
  }, [phase, normalized.length, stopRecognition]);

  const stepBackward = useCallback(() => {
    if (phase !== "reading") return;
    const previous = Math.max(cursorRef.current - 1, 0);
    cursorRef.current = previous;
    setCurrentIdx(previous);
    setSpokenCount(previous);
  }, [phase]);

  useEffect(() => {
    if (phase !== "reading") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight") {
        if (e.repeat) return;
        e.preventDefault();
        advanceManually();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBackward();
      } else if (e.key === "Escape") {
        setControlsVisible(true);
      } else if (e.key === "+") {
        setFontSize((size) => Math.min(size + 2, 52));
      } else if (e.key === "-") {
        setFontSize((size) => Math.max(size - 2, 24));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, advanceManually, stepBackward]);

  const restartSameText = () => {
    stopRecognition();
    cursorRef.current = 0;
    setCurrentIdx(0);
    setSpokenCount(0);
    setFillerCount(0);
    setElapsed(0);
    startTimeRef.current = null;
    setInterim("");
    setControlsVisible(false);
    setPhase("reading");
    startRecognition();
  };

  const wpm = elapsed > 5 ? Math.round((spokenCount / elapsed) * 60) : 0;
  const progress = words.length ? Math.round((spokenCount / words.length) * 100) : 0;
  const paceProgress = Math.min(100, Math.round((wpm / 180) * 100));
  const presentationStyle = {
    "--background": presentationPreferences.background,
    "--primary": presentationPreferences.accent,
    "--ring": presentationPreferences.accent,
    "--current-word": presentationPreferences.accent,
    "--current-word-foreground": readableTextColor(presentationPreferences.accent),
    "--foreground": readableTextColor(presentationPreferences.background),
  } as CSSProperties;

  const savePractice = () => {
    if (!hasPaidAccess) {
      void navigate({ to: "/billing" });
      return;
    }
    const content = text.trim();
    if (!content || typeof window === "undefined") return;
    const saved: SavedPractice[] = JSON.parse(
      window.localStorage.getItem(SAVED_PRACTICES_KEY) ?? "[]",
    );
    if (saved.some((practice) => practice.text === content)) {
      setSavedText(content);
      return;
    }
    const next: SavedPractice[] = [
      {
        id: crypto.randomUUID(),
        title: content.split(/[.!?]/)[0]?.slice(0, 48) || "Untitled practice",
        text: content,
        savedAt: new Date().toISOString(),
      },
      ...saved,
    ].slice(0, 20);
    window.localStorage.setItem(SAVED_PRACTICES_KEY, JSON.stringify(next));
    setSavedText(content);
  };

  const startReading = () => {
    if (savePassageOnStart && hasPaidAccess && savedText !== text.trim()) savePractice();
    beginReading(text);
  };

  const openVoiceTyping = () => {
    if (!hasPaidAccess) {
      void navigate({ to: "/billing" });
      return;
    }
    setVoiceTypingEnabled(true);
    if (currentUserId) {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem(`${PRACTICE_TOOLS_KEY}${currentUserId}`) ?? "{}",
        ) as Partial<PracticeToolPreferences>;
        window.localStorage.setItem(
          `${PRACTICE_TOOLS_KEY}${currentUserId}`,
          JSON.stringify({ ...stored, voiceTypingEnabled: true }),
        );
      } catch {
        window.localStorage.setItem(
          `${PRACTICE_TOOLS_KEY}${currentUserId}`,
          JSON.stringify({ voiceTypingEnabled: true }),
        );
      }
    }
    void navigate({ to: "/voice-typing" });
  };

  if (sessionState !== "authenticated") {
    return (
      <main className="auth-page flex min-h-screen items-center justify-center" aria-busy="true">
        <span className="auth-loading" aria-label="Checking your session" />
      </main>
    );
  }

  return (
    <main
      className={phase !== "input" ? "reader-focus min-h-screen" : "min-h-screen bg-background"}
    >
      <SiteNavbar brandTo="/practice" />

      {phase === "input" && (
        <section className="practice-page mx-auto max-w-5xl px-6 py-12">
          <div className="practice-intro">
            <p className="practice-kicker">SPEAKING PRACTICE</p>
            <h1>
              Give every word a <span className="practice-intro-accent">voice</span>
            </h1>
            <p>
              Bring a passage to the page. Read it aloud and follow each word as it comes to life.
            </p>
          </div>
          {membershipError && (
            <p className="membership-status-error" role="status">
              Premium status could not be checked. Refresh the page or verify your subscription row
              belongs to your signed-in account.
            </p>
          )}

          <div className="writing-workspace">
            <div className="workspace-heading">
              <div>
                <label htmlFor="article">YOUR PASSAGE</label>
                <p>Paste or type your own, or start with a sample.</p>
              </div>
              <span className="workspace-count" aria-live="polite">
                {text ? `${splitWords(text).length} words` : "Ready when you are"}
              </span>
            </div>
            <textarea
              id="article"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSelectedSample("");
                setMicError(null);
              }}
              placeholder="Paste an article, speech, or a few sentences here…"
              className="writing-input"
            />
            <div className="workspace-options-main">
              <label className="speech-language-control">
                <span className="sr-only">Speech recognition language</span>
                <select
                  aria-label="Speech recognition language"
                  value={speechLanguage}
                  onChange={(event) => {
                    const language = event.target.value as SpeechLanguage;
                    setSpeechLanguage(language);
                    saveSpeechLanguage(language);
                  }}
                  className="bg-transparent text-foreground outline-none"
                >
                  {SPEECH_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sample-picker">
                <select
                  aria-label="Choose a sample passage"
                  value={selectedSample}
                  onChange={(event) => {
                    const sample = SAMPLE_TEXTS.find((item) => item.title === event.target.value);
                    setSelectedSample(event.target.value);
                    if (sample) {
                      setText(sample.text);
                    }
                  }}
                  className="bg-transparent text-foreground outline-none"
                >
                  <option value="">Choose a sample</option>
                  {SAMPLE_TEXTS.map((sample) => (
                    <option key={sample.title} value={sample.title}>
                      {sample.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="workspace-premium-tools">
              <div className="workspace-premium-heading">
                <span className="workspace-premium-sparkle">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <strong>Premium tools</strong>
                  <span>Make each practice session more focused</span>
                </div>
                <span className="premium-feature-tag">ORATOR PLUS</span>
              </div>
              <div className="workspace-premium-actions">
                {hasPaidAccess ? (
                  <button
                    type="button"
                    aria-pressed={savePassageOnStart}
                    disabled={splitWords(text).length < 2}
                    onClick={() => setSavePassageOnStart((selected) => !selected)}
                    className={`premium-tool-button premium-toggle-button ${savePassageOnStart ? "premium-tool-button-active" : ""}`}
                  >
                    {savePassageOnStart ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <BookMarked className="h-5 w-5" />
                    )}
                    <span>
                      <strong>Save passage</strong>
                      <small>
                        {savePassageOnStart
                          ? "On. Save it when you start reading"
                          : "Off. Keep it in your library for later"}
                      </small>
                    </span>
                    <span className="premium-toggle-state">
                      {savePassageOnStart ? "ON" : "OFF"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="premium-tool-button"
                    onClick={() => void navigate({ to: "/billing" })}
                    title="View Premium membership options"
                  >
                    <LockKeyhole className="h-5 w-5" />
                    <span>
                      <strong>Save passages</strong>
                      <small>Keep passages ready for your next session</small>
                    </span>
                    <ArrowRight className="premium-tool-arrow h-4 w-4" />
                  </button>
                )}
                {hasPaidAccess ? (
                  <button
                    type="button"
                    aria-pressed={voiceTypingEnabled}
                    disabled={!supported && !voiceTypingEnabled}
                    onClick={openVoiceTyping}
                    className={`premium-tool-button premium-toggle-button ${voiceTypingEnabled ? "premium-tool-button-active" : ""}`}
                    title={
                      supported
                        ? "Open the separate voice typing page"
                        : "Use Chrome or Edge for voice typing"
                    }
                  >
                    <Mic className="h-5 w-5" />
                    <span>
                      <strong>Voice typing</strong>
                      <small>
                        {voiceTypingEnabled
                          ? "On. Open separate dictation page"
                          : "Open a blank dictation page"}
                      </small>
                    </span>
                    <span className="premium-toggle-state">OPEN</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sentence-option sentence-option-locked"
                    onClick={() => void navigate({ to: "/billing" })}
                    title="View Premium membership options"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    <span>
                      Voice typing <small className="premium-feature-tag">PREMIUM</small>
                    </span>
                    <small>Dictate speech into your passage</small>
                    <ArrowRight className="premium-tool-arrow h-4 w-4" />
                  </button>
                )}
                {hasPaidAccess ? (
                  <button
                    type="button"
                    aria-pressed={oneSentenceAtATime}
                    onClick={() => setOneSentenceAtATime((enabled) => !enabled)}
                    className={`premium-tool-button premium-toggle-button ${oneSentenceAtATime ? "premium-tool-button-active" : ""}`}
                  >
                    {oneSentenceAtATime ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlignLeft className="h-5 w-5" />
                    )}
                    <span>
                      <strong>Sentence focus</strong>
                      <small>
                        {oneSentenceAtATime
                          ? "On. Show one sentence at a time"
                          : "Off. Focus on one thought at a time"}
                      </small>
                    </span>
                    <span className="premium-toggle-state">
                      {oneSentenceAtATime ? "ON" : "OFF"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sentence-option sentence-option-locked"
                    onClick={() => void navigate({ to: "/billing" })}
                  >
                    <LockKeyhole className="h-4 w-4" />
                    <span>
                      Sentence focus <small className="premium-feature-tag">PREMIUM</small>
                    </span>
                    <small>Focus on one complete thought at a time</small>
                    <ArrowRight className="premium-tool-arrow h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="workspace-start-row">
              <p>
                {hasPaidAccess
                  ? savePassageOnStart
                    ? "This passage will be saved to your library."
                    : "This practice will not be saved."
                  : "Start your free practice whenever you are ready."}
              </p>
              <div className="workspace-start-actions">
                <button
                  onClick={startReading}
                  disabled={splitWords(text).length < 2}
                  className="start-reading-button"
                >
                  <Mic className="h-4 w-4" /> Start reading
                </button>
              </div>
            </div>
            {!supported && (
              <p className="mt-3 text-sm text-destructive">
                Your browser doesn't support live speech recognition. For voice typing and word
                tracking, use Chrome or Edge on desktop.
              </p>
            )}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Mic,
                title: "Find your voice",
                body: "Read at your own pace while the microphone follows along hands-free.",
                detail: "VOICE",
              },
              {
                icon: CheckCircle2,
                title: "Stay on the line",
                body: "Follow the live highlight to keep your place through every sentence.",
                detail: "FOCUS",
              },
              {
                icon: Gauge,
                title: "Set a steady pace",
                body: "See your speaking speed and build a rhythm that feels clear and confident.",
                detail: "PACE",
              },
            ].map(({ icon: Icon, title, body, detail }, index) => (
              <div key={title} className={`feature-step feature-step-${index + 1}`}>
                <div className="feature-step-top">
                  <span className="feature-step-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="feature-step-label">{detail}</span>
                </div>
                <h2>{title}</h2>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {phase !== "input" && (
        <section
          className={`reading-stage ${controlsVisible ? "" : "reading-stage-immersive"}`}
          style={presentationStyle}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            setControlsVisible((visible) => !visible);
          }}
          aria-label="Reading screen. Tap anywhere to show or hide controls."
        >
          {controlsVisible && (
            <>
              <div className="reading-toolbar" aria-label="Reading controls">
                <button
                  onClick={() => {
                    stopRecognition();
                    setPhase("input");
                  }}
                  className="reader-control reader-exit"
                  aria-label="Exit focused reading"
                  title="Exit focused reading"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Exit</span>
                </button>
                <div className="reading-tools">
                  {phase === "reading" ? (
                    <span className="reader-listening-state" role="status">
                      {listening ? "Listening" : "Waiting for speech"}
                    </span>
                  ) : (
                    <span className="reader-complete">
                      <CheckCircle2 className="h-5 w-5" /> Passage complete
                    </span>
                  )}
                  <button
                    onClick={stepBackward}
                    className="reader-control"
                    aria-label="Go back one word"
                    title="Go back one word (Left arrow)"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setFontSize((size) => Math.max(size - 2, 24))}
                    className="reader-control"
                    aria-label="Decrease text size"
                    title="Decrease text size"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setFontSize((size) => Math.min(size + 2, 52))}
                    className="reader-control"
                    aria-label="Increase text size"
                    title="Increase text size"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    onClick={restartSameText}
                    className="reader-control"
                    aria-label="Restart passage"
                    title="Restart passage"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="reading-status" aria-live="polite">
                {hasPaidAccess && (
                  <>
                    <span>
                      <Timer className="h-4 w-4" /> {Math.floor(elapsed / 60)}:
                      {String(Math.floor(elapsed % 60)).padStart(2, "0")}
                    </span>
                    <span>
                      <Gauge className="h-4 w-4" />
                      {wpm > 0 ? `${wpm} wpm` : <span>No pace yet</span>}
                    </span>
                    <span>
                      <span className="filler-count">{fillerCount}</span> filler words
                    </span>
                    {!supported && (
                      <span className="analytics-mic-note">Mic required for filler count</span>
                    )}
                  </>
                )}
                <span>
                  {spokenCount} of {words.length} words
                </span>
              </div>
              {!hasPaidAccess && (
                <button
                  type="button"
                  className="reading-premium-prompt"
                  onClick={() => void navigate({ to: "/billing" })}
                >
                  <LockKeyhole className="h-4 w-4" />
                  <span>Unlock pace and filler analytics</span>
                  <small>PREMIUM</small>
                </button>
              )}
              {hasPaidAccess && (
                <div
                  className="pace-tracker"
                  aria-label={`Speaking pace ${wpm} words per minute. Target pace 120 to 150 words per minute.`}
                >
                  <div className="pace-tracker-labels">
                    <span>Presentation analytics</span>
                    <span>Target 120-150 wpm</span>
                  </div>
                  <div className="pace-track">
                    <div className="pace-target-range" />
                    <div className="pace-current" style={{ width: `${paceProgress}%` }} />
                  </div>
                </div>
              )}
              <div
                className="reading-progress"
                role="progressbar"
                aria-label="Reading progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ width: `${progress}%` }} />
              </div>
              {micError && phase === "reading" && (
                <p className="reading-message" role="status">
                  {micError}
                </p>
              )}
            </>
          )}

          <article aria-label="Reading passage" className="reading-passage">
            <p style={{ fontSize: `clamp(1.5rem, ${fontSize}px, 3.25rem)` }}>
              {words.map((word, i) => (
                <span
                  key={`${i}-${word}`}
                  hidden={oneSentenceAtATime && sentenceForWord[i] !== activeSentence}
                >
                  <span
                    ref={i === visibleIdx ? activeWordRef : undefined}
                    className={`reader-word ${i < currentIdx ? "spoken" : i === visibleIdx ? "current" : "upcoming"}`}
                  >
                    {word}
                  </span>{" "}
                </span>
              ))}
            </p>
          </article>
          {phase === "done" && hasPaidAccess && controlsVisible && (
            <section className="session-analytics" aria-label="Presentation analytics summary">
              <div>
                <span>Duration</span>
                <strong>
                  {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed % 60)).padStart(2, "0")}
                </strong>
              </div>
              <div>
                <span>Speaking pace</span>
                <strong>{wpm > 0 ? `${wpm} wpm` : "Not enough data"}</strong>
              </div>
              <div>
                <span>Filler words</span>
                <strong>{fillerCount}</strong>
              </div>
            </section>
          )}
          {controlsVisible && (
            <footer className="reading-hint">
              <span>Tap anywhere to hide controls.</span>
            </footer>
          )}
        </section>
      )}
    </main>
  );
}
