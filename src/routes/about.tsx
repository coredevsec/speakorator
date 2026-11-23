import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteNavbar } from "../components/site-navbar";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Orator | Making confident speakers" },
      {
        name: "description",
        content:
          "Learn how Orator helps people practice public speaking with real-time feedback on pace, clarity, filler words, and pauses.",
      },
    ],
  }),
  component: AboutPage,
});

const languages = [
  "English (United States)",
  "English (United Kingdom)",
  "English (Australia)",
  "English (India)",
  "Spanish (Spain)",
  "Spanish (Mexico)",
  "French",
  "German",
  "Portuguese (Brazil)",
];

function AboutPage() {
  return (
    <main className="landing-page about-page">
      <SiteNavbar brandText="Orator" brandTo="/" showMenu={false} landingMenu>
        <nav className="landing-nav" aria-label="Account actions">
          <Link to="/sign-up" className="landing-nav-cta orator-get-started" style={{ color: "#0a1a27" }}>
            Get Started
          </Link>
        </nav>
      </SiteNavbar>

      <section className="about-hero">
        <p className="practice-kicker">OUR STORY</p>
        <h1>Making confident speakers</h1>
        <p>
          Orator began with a simple problem: speaking clearly should feel less intimidating. We
          built a calm place to practice, understand your delivery, and know what to improve next.
        </p>
      </section>

      <section className="about-story">
        <article className="about-story-row">
          <div className="about-story-image" aria-label="The fear of public speaking">
            <img src="/started.png" alt="A person beginning their public speaking journey" />
          </div>
          <div className="about-story-copy">
            <p className="practice-kicker">IT STARTED WITH A FEAR</p>
            <h2>It started with a fear of public speaking</h2>
            <p>
              Many people know what they want to say, but freeze, rush, or use too many filler words
              when they speak out loud. Practicing alone in front of a mirror does not give real
              feedback, so it is difficult to know what is changing.
            </p>
          </div>
        </article>

        <article className="about-story-row">
          <div className="about-story-image" aria-label="Practice without feedback">
            <img src="/prob.png" alt="A speaker practicing without clear feedback" />
          </div>
          <div className="about-story-copy">
            <p className="practice-kicker">THEN CAME THE PROBLEM</p>
            <h2>Practice needed a clearer next step</h2>
            <p>
              People practiced for interviews, presentations, school, and church, but had no way to
              know if they were improving. No coach, no scores, and no clear next step made it hard to
              build steady confidence.
            </p>
          </div>
        </article>

        <article className="about-story-row">
          <div className="about-story-image" aria-label="Orator practice solution">
            <img src="/built.png" alt="Orator AI speaking practice in use" />
          </div>
          <div className="about-story-copy">
            <p className="practice-kicker">SO WE BUILT ORATOR</p>
            <h2>Practice with useful AI feedback</h2>
            <p>
              Paste your own speech or use a practice passage, speak out loud, and get instant AI
              feedback on pace, clarity, filler words, and pauses, plus what to fix next. Orator gives
              each practice a clear and useful purpose.
            </p>
          </div>
        </article>

        <article className="about-story-row">
          <div className="about-story-image" aria-label="People using Orator today">
            <img src="/wwrn.png" alt="People becoming confident with Orator" />
          </div>
          <div className="about-story-copy">
            <p className="practice-kicker">WHERE WE ARE NOW</p>
            <h2>Confidence for the moments that matter</h2>
            <p>
              Now, people use Orator to prepare for presentations, interviews, exams, sermons, and
              everyday confidence. They can practice calmly, see what is improving, and take the next
              word forward.
            </p>
          </div>
        </article>
      </section>

      <section className="about-languages">
        <p className="practice-kicker">SUPPORTED LANGUAGES</p>
        <h2>Practice in your language</h2>
        <div className="about-language-grid">
          {languages.map((language) => (
            <span key={language}>{language}</span>
          ))}
        </div>
        <p className="about-account-note">
          Note: Users need an account to use Orator so it can save progress and practices.
        </p>
      </section>

      <blockquote className="about-quote">
        <p>“Confidence is not about never feeling nervous. It is about knowing you can take the next word forward.”</p>
      </blockquote>

      <section className="about-cta">
        <h2>Ready to make your next words count?</h2>
        <div className="about-cta-actions">
          <Link to="/sign-up" className="landing-nav-cta about-primary-cta">
            Ready to try Orator? Get started ›
          </Link>
          <div>
            <a href="mailto:support@coranator.com" className="about-secondary-cta">
              Have a question? Get in touch ›
            </a>
            <span>info@corenator.com</span>
          </div>
        </div>
      </section>
    </main>
  );
}
