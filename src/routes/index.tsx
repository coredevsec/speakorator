import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteNavbar } from "../components/site-navbar";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orator | Practice with Confidence" },
      {
        name: "description",
        content:
          "Build speaking confidence with guided word-by-word practice, real-time feedback, and a premium path for deeper performance analytics.",
      },
      { property: "og:title", content: "Orator | Practice with Confidence" },
      {
        property: "og:description",
        content:
          "Build speaking confidence with guided word-by-word practice, real-time feedback, and a premium path for deeper performance analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const previewWords =
    "Good communication grows through practice, patience, and a steady voice.".split(" ");
  const [activePreviewWord, setActivePreviewWord] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActivePreviewWord((active) => (active + 1) % previewWords.length);
    }, 520);
    return () => window.clearInterval(interval);
  }, [previewWords.length]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      void navigate({ to: "/practice", replace: true });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="landing-page">
      <SiteNavbar brandText="rator" brandTo="/" showMenu={false}>
        <nav className="landing-nav" aria-label="Account actions">
          <Link to="/sign-in">Sign In</Link>
          <Link to="/sign-up" className="landing-nav-cta">
            Sign Up
          </Link>
        </nav>
      </SiteNavbar>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="practice-kicker">SPEAKING CONFIDENCE</span>
          <h1>Speak more clearly. Feel more ready.</h1>
          <p>
            Orator helps you read aloud, track your pace, and build confidence one word at a time.
            Start free, then unlock deeper coaching when you’re ready to level up.
          </p>

          <p className="landing-start-note">
            <CheckCircle2 className="h-4 w-4" /> Free mic practice, anytime
          </p>

          <ul className="landing-proof-list">
            <li>
              <CheckCircle2 className="h-4 w-4" /> Real-time word tracking
            </li>
            <li>
              <CheckCircle2 className="h-4 w-4" /> Clear pacing and filler feedback
            </li>
            <li>
              <CheckCircle2 className="h-4 w-4" /> Designed for public speaking practice
            </li>
          </ul>
        </div>

        <div
          className="landing-hero-card"
          role="img"
          aria-label="Live practice preview, word by word: Good communication grows through practice, patience, and a steady voice."
        >
          <div className="mini-reader-header" aria-hidden="true">
            <span className="mini-reader-pill">
              <span className="mini-reader-live-dot" /> LIVE
            </span>
            <span className="mini-reader-pill mini-reader-pill-muted">SPEAKING PRACTICE</span>
          </div>

          <div className="mini-reader-quote" aria-hidden="true">
            {previewWords.map((word, index) => (
              <span
                key={`${index}-${word}`}
                className={`mini-reader-word ${index < activePreviewWord ? "spoken" : ""} ${index === activePreviewWord ? "current" : ""}`}
              >
                {word}
              </span>
            ))}
          </div>

          <div className="mini-reader-live-status" aria-hidden="true">
            <span>Following your voice</span>
            <span className="mini-reader-waveform">
              {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
                <i key={bar} />
              ))}
            </span>
          </div>

          <div className="mini-reader-metrics" aria-hidden="true">
            <div>
              <span>WPM</span>
              <strong>128</strong>
            </div>
            <div>
              <span>Filler</span>
              <strong>2</strong>
            </div>
            <div>
              <span>Focus</span>
              <strong>96%</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-feature-grid">
        <article className="landing-feature-card">
          <span className="landing-feature-icon">
            <Mic className="h-5 w-5" />
          </span>
          <h2>Read aloud with a live guide</h2>
          <p>
            Follow every word as it highlights in real time while your microphone tracks your flow.
          </p>
        </article>

        <article className="landing-feature-card">
          <span className="landing-feature-icon">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h2>Build calm, steady delivery</h2>
          <p>
            Improve pacing, reduce filler words, and keep your words grounded in a natural rhythm.
          </p>
        </article>

        <article className="landing-feature-card">
          <span className="landing-feature-icon">
            <Sparkles className="h-5 w-5" />
          </span>
          <h2>Unlock a polished premium experience</h2>
          <p>
            Go beyond the basics with analytics, sentence focus, custom themes, and saved practice
            flows.
          </p>
        </article>
      </section>

      <section className="landing-plan-strip">
        <div>
          <p className="practice-kicker">FREE & PREMIUM</p>
          <h2>Everything you need to start, with room to grow.</h2>
        </div>

        <div className="landing-plan-list">
          <div>
            <strong>Free</strong>
            <span>Microphone practice</span>
          </div>
          <div>
            <strong>Premium</strong>
            <span>Analytics, saved passages, custom reading themes</span>
          </div>
        </div>
      </section>
    </main>
  );
}
