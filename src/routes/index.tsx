import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Mic, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteNavbar } from "../components/site-navbar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Orator by Corenator - Free Public Speaking Practice App | Voice-Following Teleprompter",
      },
      {
        name: "description",
        content:
          "Orator is a free public speaking practice app and voice-following teleprompter. Paste your speech, sermon, pitch or YouTube script, read out loud, and Orator follows your voice so you never lose your place.",
      },
      { property: "og:title", content: "Orator | Practice with Confidence" },
      {
        property: "og:description",
        content:
          "Build speaking confidence with guided word-by-word practice, real-time feedback, and a premium path for deeper performance analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://orator.corenator.com/" },
      { property: "og:image", content: "https://orator.corenator.com/og-image.png" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const previewWords =
    "Good communication grows through practice, patience, and a steady voice.".split(" ");
  const [activePreviewWord, setActivePreviewWord] = useState(0);
  const communityQuotes = [
    {
      quote: "I can see exactly where I am instead of losing my place.",
      source: "Public speaking learner",
    },
    {
      quote: "The word-by-word guide makes rehearsing feel much less overwhelming.",
      source: "Practice feedback",
    },
    {
      quote: "It gives my practice a clear rhythm and a useful next step.",
      source: "Practice feedback",
    },
  ];
  const [activeCommunityQuote, setActiveCommunityQuote] = useState(0);
  const [activePricingPeriod, setActivePricingPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const pricingPlans = {
    weekly: {
      name: "Weekly",
      price: "$2.99",
      cadence: "per week",
      billed: "Billed weekly",
      description: "Starter plan for quick practice.",
    },
    monthly: {
      name: "Monthly",
      price: "$5.99",
      cadence: "per month",
      billed: "Billed monthly",
      description: "Most flexible for regular speakers.",
    },
    yearly: {
      name: "Yearly",
      price: "$71.88",
      cadence: "per year",
      billed: "Billed yearly",
      description: "Unlimited access for power users.",
    },
  } as const;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActivePreviewWord((active) => (active + 1) % previewWords.length);
    }, 520);
    return () => window.clearInterval(interval);
  }, [previewWords.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = window.setInterval(() => {
      setActiveCommunityQuote((active) => (active + 1) % communityQuotes.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [communityQuotes.length]);

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
      <SiteNavbar brandText="Orator" brandTo="/" showMenu={false} landingMenu>
        <nav className="landing-nav" aria-label="Account actions">
          <Link to="/sign-up" className="landing-nav-cta orator-get-started" style={{ color: "#0a1a27" }}>
            Get Started
          </Link>
        </nav>
      </SiteNavbar>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="practice-kicker">SPEAKING CONFIDENCE</span>
          <h1 className="hero-headline-animate">Speak more clearly. Feel more ready.</h1>
          <p className="hero-subtext-animate">
            Orator is an AI public speaking app and voice-following teleprompter. Practice your
            speech and get real-time feedback on pace, clarity, filler words, and pauses.
          </p>
          <p className="hero-subtext-animate hero-subtext-secondary">
            Paste a script or choose a passage, then practice speaking with clear, helpful coaching.
            Start free and build confidence one session at a time.
          </p>

        </div>
      </section>

      <section className="orator-trust-marquee" aria-label="Orator speaker community">
        <p className="practice-kicker orator-trust-label">TRUSTED BY 6,837 SPEAKERS</p>
        <div className="orator-marquee-mask">
          <div className="orator-marquee-track">
            <div className="orator-marquee-content">
              <span>Students</span><b>•</b><span>Creators</span><b>•</b><span>Pastors</span><b>•</b>
              <span>Founders</span><b>•</b><span>Teachers</span><b>•</b><span>Presenters</span><b>•</b>
              <span>Job Seekers</span><b>•</b><span>Coaches</span><b>•</b>
            </div>
            <div className="orator-marquee-content" aria-hidden="true">
              <span>Students</span><b>•</b><span>Creators</span><b>•</b><span>Pastors</span><b>•</b>
              <span>Founders</span><b>•</b><span>Teachers</span><b>•</b><span>Presenters</span><b>•</b>
              <span>Job Seekers</span><b>•</b><span>Coaches</span><b>•</b>
            </div>
          </div>
        </div>
      </section>

      <div className="orator-between-section-cta">
        <Link to="/sign-up" className="landing-nav-cta">
          Start Practicing - It's Free
        </Link>
      </div>

      <section className="landing-built-everyone">
        <div className="landing-built-everyone-heading orator-centered-section-heading">
          <p className="practice-kicker">BUILT FOR EVERYONE</p>
          <h2>Speak clearly in any situation</h2>
        </div>

        <div className="landing-feature-grid">
          <article className="landing-feature-card">
            <h2>Speakers</h2>
            <p>
              Transform nerves into confidence. Practice speeches, pitches and presentations until
              you feel ready.
            </p>
          </article>

          <article className="landing-feature-card">
            <h2>Creators</h2>
            <p>
              Never lose your place when recording. Read scripts smoothly while Orator follows your
              voice.
            </p>
          </article>

          <article className="landing-feature-card">
            <h2>Students</h2>
            <p>
              Ace presentations and project defenses. Practice delivery, timing and clarity before
              the big day.
            </p>
          </article>
        </div>
      </section>

      <section className="landing-built-everyone">
        <div className="landing-built-everyone-heading orator-centered-section-heading">
          <p className="practice-kicker">FEATURES</p>
          <h2>Why Orator?</h2>
        </div>

        <div className="landing-feature-grid">
          <article className="landing-feature-card">
            <h2>Smart Voice-Following Teleprompter</h2>
            <p>
              Paste your script and the indicator follows your voice as you read.
            </p>
          </article>

          <article className="landing-feature-card">
            <h2>Voice Typing</h2>
            <p>
              Speak naturally, Orator types for you. Perfect for drafting speeches fast.
            </p>
          </article>

          <article className="landing-feature-card">
            <h2>First-Class Mobile Experience</h2>
            <p>
              Optimized for mobile, practice anywhere.
            </p>
          </article>
        </div>
      </section>

      <div
        className="landing-hero-card hero-card-animate orator-feature-practice-card"
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
          <div><span>WPM</span><strong>128</strong></div>
          <div><span>Filler</span><strong>2</strong></div>
          <div><span>Focus</span><strong>96%</strong></div>
        </div>
      </div>

      <ul className="orator-practice-benefits" aria-label="Speaking practice benefits">
        <li>Free mic practice, anytime</li>
        <li>Real-time word tracking</li>
        <li>Clear pacing and filler feedback</li>
        <li>Designed for public speaking practice</li>
      </ul>

      <article className="landing-feature-card orator-language-feature-card">
        <p className="practice-kicker orator-language-feature-label">MULTIPLE LANGUAGES</p>
        <div className="orator-3d-globe" aria-label="Animated globe showing Orator language support">
          <div className="orator-globe-tags orator-globe-tags-left" aria-hidden="true">
            <span className="orator-globe-tag"><i className="orator-flag-us" /> EN</span>
            <span className="orator-globe-tag"><i className="orator-flag-es" /> ES</span>
            <span className="orator-globe-tag"><i className="orator-flag-fr" /> FR</span>
          </div>
          <div className="orator-earth-sphere">
            <img className="orator-earth-texture" src="/earth-globe.svg" alt="" />
          </div>
          <div className="orator-globe-tags orator-globe-tags-right" aria-hidden="true">
            <span className="orator-globe-tag"><i className="orator-flag-de" /> DE</span>
            <span className="orator-globe-tag"><i className="orator-flag-br" /> PT</span>
          </div>
          <span className="orator-globe-shadow" />
        </div>
        <div className="orator-language-feature-copy">
          <h2>Practice in the language you speak</h2>
          <p>
            Orator supports English, Spanish, French, German, and Portuguese, with regional variants.
          </p>
        </div>
      </article>

      <section className="landing-built-everyone orator-community-carousel">
        <div className="landing-built-everyone-heading orator-centered-section-heading">
          <h2>Testimonials</h2>
          <h3>What our customers are saying</h3>
        </div>
        <article className="landing-feature-card orator-community-card">
          <button
            type="button"
            className="orator-carousel-arrow orator-carousel-arrow-prev"
            aria-label="Previous quote"
            onClick={() =>
              setActiveCommunityQuote((active) =>
                active === 0 ? communityQuotes.length - 1 : active - 1,
              )
            }
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            className="orator-community-quote"
            key={activeCommunityQuote}
            role="status"
            aria-live="polite"
          >
            <p>“{communityQuotes[activeCommunityQuote]!.quote}”</p>
            <span>{communityQuotes[activeCommunityQuote]!.source}</span>
          </div>

          <button
            type="button"
            className="orator-carousel-arrow orator-carousel-arrow-next"
            aria-label="Next quote"
            onClick={() =>
              setActiveCommunityQuote((active) => (active + 1) % communityQuotes.length)
            }
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="orator-carousel-dots" aria-label="Choose quote">
            {communityQuotes.map((_, index) => (
              <button
                type="button"
                key={index}
                className={index === activeCommunityQuote ? "active" : ""}
                aria-label={`Show quote ${index + 1}`}
                aria-current={index === activeCommunityQuote ? "true" : undefined}
                onClick={() => setActiveCommunityQuote(index)}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="landing-built-everyone orator-pricing-section">
        <div className="landing-built-everyone-heading orator-pricing-heading orator-centered-section-heading">
          <p className="practice-kicker">PRICING</p>
          <h2>Choose the plan that's right for you</h2>
        </div>

        <div className="orator-pricing-toggle" role="tablist" aria-label="Billing period">
          {(["weekly", "monthly", "yearly"] as const).map((period) => (
            <button
              type="button"
              role="tab"
              aria-selected={activePricingPeriod === period}
              className={activePricingPeriod === period ? "active" : ""}
              key={period}
              onClick={() => setActivePricingPeriod(period)}
            >
              {pricingPlans[period].name}
              {period === "yearly" ? <span className="orator-pricing-badge">-20%</span> : null}
            </button>
          ))}
        </div>

        <div className="landing-feature-grid orator-pricing-grid">
          {(["weekly", "monthly", "yearly"] as const).map((period) => {
            const plan = pricingPlans[period];
            const active = activePricingPeriod === period;
            return (
              <article
                className={`landing-feature-card orator-pricing-card ${period === "monthly" ? "orator-pricing-popular" : ""} ${active ? "orator-pricing-active" : ""}`}
                key={period}
              >
                {period === "monthly" ? <span className="orator-pricing-popular-badge">POPULAR</span> : null}
                <h2>{plan.name}</h2>
                <div className="orator-pricing-price">
                  <strong>{plan.price}</strong>
                  <span>/ {plan.cadence}</span>
                </div>
                <p className="orator-pricing-billed">{plan.billed}</p>
                <p>{plan.description}</p>
                <ul className="orator-pricing-checklist">
                  <li><CheckCircle2 className="h-4 w-4" /> Full voice-following practice</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Voice typing tools</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Mobile and desktop access</li>
                </ul>
                <Link to="/billing" className="landing-nav-cta orator-pricing-button">
                  Choose Plan
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-plan-strip orator-centered-plan">
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

      <section id="quick-answers" className="landing-feature-grid landing-faq-grid">
        <article className="landing-feature-card landing-faq-card">
          <div className="orator-centered-section-heading">
            <p className="practice-kicker orator-faq-heading">FAQ</p>
            <h2>Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible>
            <AccordionItem value="account">
              <AccordionTrigger>Do I need an account to try Orator?</AccordionTrigger>
              <AccordionContent>
                Yes. You need an account to use Orator, so it can save your progress and practices.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="browsers">
              <AccordionTrigger>Which browsers work best?</AccordionTrigger>
              <AccordionContent>
                Edge works best. Safari and Firefox also work. Chrome is not very smooth yet.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="passage">
              <AccordionTrigger>Can I use my own passage?</AccordionTrigger>
              <AccordionContent>
                Yes. Paste or type your own speech, passage, or presentation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="free">
              <AccordionTrigger>Is Orator free?</AccordionTrigger>
              <AccordionContent>
                Yes, to start. Core practice is free.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="phone">
              <AccordionTrigger>Does it work on phone?</AccordionTrigger>
              <AccordionContent>
                Yes. Works on phone, tablet, and laptop.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Link to="/faqs" className="orator-view-all-faqs">
            View all FAQs →
          </Link>
        </article>
      </section>
    </main>
  );
}
