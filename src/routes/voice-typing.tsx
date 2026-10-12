import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BookmarkPlus, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { SiteNavbar } from "../components/site-navbar";
import { supabase } from "../lib/supabase";
import { checkSubscriptionAccess } from "../lib/subscription-access";

const PRACTICE_TOOLS_KEY = "orator.practice-tools.";
const SAVED_PRACTICES_KEY = "orator.saved-practices";

type SavedDictation = {
  id: string;
  title: string;
  text: string;
  savedAt: string;
};

function speechTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function normalizeSpeechToken(token: string): string {
  return token.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");
}

function normalizedPhrase(text: string): string {
  return speechTokens(text).map(normalizeSpeechToken).filter(Boolean).join(" ");
}

type RecognitionResult = {
  isFinal: boolean;
  0: { transcript: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionConstructor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as unknown as Record<string, unknown>;
  return (browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null) as
    (new () => Recognition) | null;
}

function saveVoiceTypingPreference(userId: string, enabled: boolean) {
  try {
    const key = `${PRACTICE_TOOLS_KEY}${userId}`;
    const preferences = JSON.parse(window.localStorage.getItem(key) ?? "{}") as Record<
      string,
      unknown
    >;
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...preferences, voiceTypingEnabled: enabled }),
    );
  } catch {
    window.localStorage.setItem(
      `${PRACTICE_TOOLS_KEY}${userId}`,
      JSON.stringify({ voiceTypingEnabled: enabled }),
    );
  }
}

export const Route = createFileRoute("/voice-typing")({
  component: VoiceTypingPage,
});

function VoiceTypingPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [checking, setChecking] = useState(true);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const wantsListeningRef = useRef(false);
  const userIdRef = useRef("");
  const restartTimerRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const sessionIdRef = useRef(0);
  const lastFinalRef = useRef<{ phrase: string; sessionId: number; time: number } | null>(null);

  useEffect(() => {
    setSupported(getRecognitionConstructor() !== null);
  }, []);

  useEffect(() => {
    if (!supabase) {
      void navigate({ to: "/sign-in", replace: true });
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (!user) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }
      const access = await checkSubscriptionAccess(user.id);
      if (!active) return;
      if (access.error || !access.allowed) {
        void navigate({ to: "/billing", replace: true });
        return;
      }
      setUserId(user.id);
      userIdRef.current = user.id;
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const stopListening = useCallback(
    (savePreference = true) => {
      wantsListeningRef.current = false;
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // The browser may already have stopped recognition.
      }
      recognitionRef.current = null;
      setListening(false);
      setInterimTranscript("");
      if (savePreference && userId) saveVoiceTypingPreference(userId, false);
    },
    [userId],
  );

  const startListening = useCallback(() => {
    const RecognitionConstructor = getRecognitionConstructor();
    if (!RecognitionConstructor) {
      setError("Voice typing is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    setError("");
    wantsListeningRef.current = true;
    const recognition = new RecognitionConstructor();
    let sessionId = ++sessionIdRef.current;
    const handledFinalResults = new Set<number>();
    recognition.lang = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let preview = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        const spokenText = result[0].transcript.trim();
        if (result.isFinal && spokenText) {
          if (handledFinalResults.has(index)) continue;
          handledFinalResults.add(index);
          const tokens = speechTokens(spokenText);
          const previous = lastFinalRef.current;
          const phrase = normalizedPhrase(spokenText);
          const now = Date.now();
          const repeatedFinal = previous?.phrase === phrase && now - previous.time < 2500;
          const crossesSession = previous && previous.sessionId !== sessionId;
          let overlap = 0;
          if (!repeatedFinal && crossesSession) {
            const committedTokens = speechTokens(transcriptRef.current);
            const maxOverlap = Math.min(12, committedTokens.length, tokens.length);
            for (let size = maxOverlap; size > 0; size -= 1) {
              const oldSuffix = committedTokens.slice(-size).map(normalizeSpeechToken);
              const newPrefix = tokens.slice(0, size).map(normalizeSpeechToken);
              if (oldSuffix.every((token, tokenIndex) => token === newPrefix[tokenIndex])) {
                overlap = size;
                break;
              }
            }
          }
          const newTokens = repeatedFinal ? [] : tokens.slice(overlap);
          if (newTokens.length > 0) {
            const cleanText = newTokens.join(" ");
            transcriptRef.current = `${transcriptRef.current.trimEnd()}${transcriptRef.current.trim() ? " " : ""}${cleanText}`;
            setTranscript(transcriptRef.current);
          }
          lastFinalRef.current = { phrase, sessionId, time: now };
        } else if (!result.isFinal) {
          preview += result[0].transcript;
        }
      }
      setInterimTranscript(preview.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        // Some browsers abort a session while rotating audio devices; onend resumes it.
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access was denied. Allow microphone access in your browser settings.");
        stopListening();
      } else if (event.error === "audio-capture") {
        setError("No microphone is available. Connect or enable one, then try again.");
        stopListening();
      } else if (event.error === "network") {
        setError(
          "Speech recognition could not reach the browser's speech service. Check your connection and try again.",
        );
        stopListening();
      } else if (event.error !== "no-speech" && event.error) {
        setError(`Voice typing error: ${event.error}. Please try again.`);
        stopListening();
      }
    };
    recognition.onend = () => {
      if (wantsListeningRef.current && recognitionRef.current === recognition) {
        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          if (!wantsListeningRef.current || recognitionRef.current !== recognition) return;
          handledFinalResults.clear();
          sessionId = ++sessionIdRef.current;
          try {
            recognition.start();
          } catch {
            wantsListeningRef.current = false;
            recognitionRef.current = null;
            setListening(false);
            setError("The browser ended microphone capture. Tap Start dictation to resume.");
          }
        }, 500);
        return;
      }
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      if (!wantsListeningRef.current) {
        setListening(false);
        setInterimTranscript("");
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      if (userId) saveVoiceTypingPreference(userId, true);
    } catch {
      wantsListeningRef.current = false;
      recognitionRef.current = null;
      setListening(false);
      setError("Could not start voice typing. Please try again.");
    }
  }, [stopListening, userId]);

  useEffect(
    () => () => {
      wantsListeningRef.current = false;
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch {
        // The browser may already have stopped recognition.
      }
      recognitionRef.current = null;
      if (userIdRef.current) saveVoiceTypingPreference(userIdRef.current, false);
    },
    [],
  );

  useEffect(() => {
    if (!saveMessage) return;
    const timeoutId = window.setTimeout(() => setSaveMessage(""), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  function saveDictation() {
    const content = transcript.trim();
    if (!content) return;
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(SAVED_PRACTICES_KEY) ?? "[]",
      ) as SavedDictation[];
      if (saved.some((item) => item.text === content)) {
        setSaveMessage("This dictation is already in your Library.");
        return;
      }
      const next: SavedDictation[] = [
        {
          id: crypto.randomUUID(),
          title: content.split(/[.!?]/)[0]?.slice(0, 48) || "Voice dictation",
          text: content,
          savedAt: new Date().toISOString(),
        },
        ...saved,
      ].slice(0, 20);
      window.localStorage.setItem(SAVED_PRACTICES_KEY, JSON.stringify(next));
      setSaveMessage("Dictation saved to your Library.");
    } catch {
      setSaveMessage("Could not save this dictation. Check your browser storage and try again.");
    }
  }

  if (checking) return <main className="auth-page min-h-screen" aria-busy="true" />;

  return (
    <main className="account-page min-h-screen">
      <SiteNavbar brandTo="/practice" />
      <section className="voice-typing-page">
        <p className="practice-kicker">ORATOR PLUS</p>
        <h1>Voice typing</h1>
        <p className="account-page-intro">
          Speak naturally. Your words will appear here as they are recognized.
        </p>
        <label className="sr-only" htmlFor="voice-transcript">
          Dictated text
        </label>
        <textarea
          id="voice-transcript"
          className="voice-typing-editor"
          value={transcript}
          onChange={(event) => {
            transcriptRef.current = event.target.value;
            setTranscript(event.target.value);
          }}
          placeholder=""
        />
        {interimTranscript && (
          <p className="voice-typing-status" aria-live="polite">
            Hearing: {interimTranscript}
          </p>
        )}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        {!supported && <p className="auth-error">Use Chrome or Edge for live voice typing.</p>}
        {saveMessage && (
          <p className="auth-message" role="status">
            {saveMessage}
          </p>
        )}
        <div className="voice-typing-actions">
          <button
            type="button"
            className="settings-save"
            onClick={() => (listening ? stopListening() : startListening())}
            disabled={!supported}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {listening ? "Stop dictation" : "Start dictation"}
          </button>
          <button
            type="button"
            className="settings-billing-link"
            onClick={saveDictation}
            disabled={!transcript.trim()}
          >
            <BookmarkPlus className="h-4 w-4" /> Save to Library
          </button>
          <Link
            to="/practice"
            className="settings-billing-link"
            onClick={() => {
              if (userId) saveVoiceTypingPreference(userId, false);
            }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to practice
          </Link>
        </div>
      </section>
    </main>
  );
}
